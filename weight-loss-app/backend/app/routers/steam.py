import re
import httpx
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
from jose import JWTError, jwt

from ..config import settings
from ..database import get_db
from ..crud import get_user, get_user_by_steam_id, get_user_by_username, update_user, create_user_from_steam
from ..schemas import UserUpdate
from ..security import oauth2_scheme, create_access_token

router = APIRouter(prefix="/api/auth/steam", tags=["steam-auth"])

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_ID_PATTERN = re.compile(r"^\d{17}$")


def _get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="无效的 token")
    except JWTError:
        raise HTTPException(status_code=401, detail="token 已过期或无效")

    user = get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


def _validate_steam_id(steam_id: str) -> bool:
    return bool(STEAM_ID_PATTERN.match(steam_id))


def _check_steam_id_available(db: Session, steam_id: str, current_user_id: int):
    existing = get_user_by_steam_id(db, steam_id=steam_id)
    if existing and existing.id != current_user_id:
        raise HTTPException(status_code=400, detail="该 Steam 账号已被其他用户绑定")


def _extract_steam_id(params: dict) -> str | None:
    identity = params.get("openid.identity", "")
    match = re.search(r"(\d{17})$", identity)
    return match.group(1) if match else None


async def _verify_steam_response(params: dict) -> bool:
    signed = params.get("openid.signed", "")
    if not signed:
        return False

    verify_params = {
        "openid.mode": "check_authentication",
        "openid.ns": params.get("openid.ns", "http://specs.openid.net/auth/2.0"),
        "openid.sig": params.get("openid.sig", ""),
        "openid.signed": signed,
        "openid.assoc_handle": params.get("openid.assoc_handle", ""),
        "openid.claimed_id": params.get("openid.claimed_id", ""),
        "openid.identity": params.get("openid.identity", ""),
        "openid.op_endpoint": params.get("openid.op_endpoint", ""),
        "openid.response_nonce": params.get("openid.response_nonce", ""),
        "openid.return_to": params.get("openid.return_to", ""),
    }

    for field in signed.split(","):
        key = f"openid.{field}"
        if key not in verify_params or not verify_params[key]:
            verify_params[key] = params.get(key, "")

    try:
        proxies = settings.STEAM_PROXY if settings.STEAM_PROXY else None
        async with httpx.AsyncClient(timeout=10.0, proxy=proxies) as client:
            resp = await client.post(STEAM_OPENID_URL, data=verify_params)
        return "is_valid:true" in resp.text
    except Exception as e:
        print(f"Steam 验证请求失败: {e}")
        return False


# ──────────────────────────────────────────────
# 生产模式接口
# ──────────────────────────────────────────────

@router.get("/login")
async def steam_login(request: Request):
    token = request.query_params.get("token", "")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="缺少认证 token")

    return_to = f"{settings.STEAM_RETURN_URL}?token={token}"
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": settings.STEAM_RETURN_URL.rsplit("/", 1)[0] + "/",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return {"url": f"{STEAM_OPENID_URL}?{urlencode(params)}"}


@router.get("/callback")
async def steam_callback(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)
    token = params.pop("token", None)
    if not token:
        raise HTTPException(status_code=400, detail="缺少认证 token")

    current_user = _get_current_user(token, db)

    if settings.STEAM_DEBUG:
        steam_id = params.get("openid.identity", "")
        match = re.search(r"(\d{17})$", steam_id)
        if not match:
            raise HTTPException(status_code=400, detail="调试模式: 无法获取 Steam ID")
        steam_id = match.group(1)
    else:
        if "openid.signed" not in params:
            raise HTTPException(status_code=400, detail="Steam 登录失败：缺少签名参数")

        is_valid = await _verify_steam_response(params)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Steam 登录验证失败")

        steam_id = _extract_steam_id(params)
        if not steam_id:
            raise HTTPException(status_code=400, detail="无法获取 Steam ID")

    _check_steam_id_available(db, steam_id, current_user.id)
    update_user(db, user_id=current_user.id, user_update=UserUpdate(steam_id=steam_id))

    frontend_url = f"{settings.FRONTEND_URL}?steam_bind=success&steam_id={steam_id}&token={token}"
    return RedirectResponse(url=frontend_url)





# ──────────────────────────────────────────────
# Steam 直接登录接口（无需先注册）
# ──────────────────────────────────────────────

@router.get("/login-with-steam")
async def steam_login_with_steam():
    return_to = settings.STEAM_LOGIN_RETURN_URL
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": return_to.rsplit("/", 1)[0] + "/",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return {"url": f"{STEAM_OPENID_URL}?{urlencode(params)}"}


@router.get("/login-callback")
async def steam_login_callback(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)

    if settings.STEAM_DEBUG:
        steam_id = params.get("openid.identity", "")
        match = re.search(r"(\d{17})$", steam_id)
        if not match:
            raise HTTPException(status_code=400, detail="调试模式: 无法获取 Steam ID")
        steam_id = match.group(1)
    else:
        if "openid.signed" not in params:
            raise HTTPException(status_code=400, detail="Steam 登录失败：缺少签名参数")

        is_valid = await _verify_steam_response(params)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Steam 登录验证失败")

        steam_id = _extract_steam_id(params)
        if not steam_id:
            raise HTTPException(status_code=400, detail="无法获取 Steam ID")

    user = get_user_by_steam_id(db, steam_id=steam_id)
    if not user:
        user = create_user_from_steam(db, steam_id=steam_id)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    frontend_url = (
        f"{settings.FRONTEND_URL}"
        f"?steam_login=success"
        f"&steam_id={steam_id}"
        f"&token={access_token}"
    )
    return RedirectResponse(url=frontend_url)


# ──────────────────────────────────────────────
# 获取 Steam 饰品库存
# ──────────────────────────────────────────────

@router.get("/inventory/{user_id}")
async def get_steam_inventory(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if not user.steam_id:
        raise HTTPException(status_code=400, detail="用户未绑定 Steam 账号")
    
    steam_id = user.steam_id
    url = f"https://steamcommunity.com/inventory/{steam_id}/730/2?l=schinese&count=1000"
    
    try:
        proxies = settings.STEAM_PROXY if settings.STEAM_PROXY else None
        async with httpx.AsyncClient(timeout=30.0, proxy=proxies, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
        
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="Steam API 访问被拒绝，可能需要配置代理(SteamProxy)")
        
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"获取 Steam 库存失败: HTTP {resp.status_code}")
        
        return resp.json()
    except httpx.ConnectError as e:
        print(f"Steam API 连接失败: {e}")
        raise HTTPException(status_code=500, detail="无法连接到 Steam API，请检查网络或配置代理(STEAM_PROXY)")
    except httpx.TimeoutException as e:
        print(f"Steam API 请求超时: {e}")
        raise HTTPException(status_code=500, detail="Steam API 请求超时，请检查网络或配置代理(STEAM_PROXY)")
    except httpx.RequestError as e:
        print(f"Steam API 请求错误: {e}")
        raise HTTPException(status_code=500, detail=f"请求 Steam API 失败: {str(e)}")
    except Exception as e:
        print(f"获取 Steam 库存异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取库存失败: {str(e)}")
