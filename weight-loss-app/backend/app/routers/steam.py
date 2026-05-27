from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import httpx
import re
from jose import JWTError, jwt

from ..config import settings
from ..database import get_db
from ..crud import get_user_by_steam_id, get_user_by_username, update_user
from ..schemas import UserUpdate

router = APIRouter(
    prefix="/api/auth/steam",
    tags=["steam-auth"],
)

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"


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
    login_url = f"{STEAM_OPENID_URL}?{urlencode(params)}"
    return RedirectResponse(url=login_url)


@router.get("/callback")
async def steam_callback(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)

    token = params.pop("token", None)
    if not token:
        raise HTTPException(status_code=400, detail="缺少认证 token")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="无效的 token")
    except JWTError:
        raise HTTPException(status_code=401, detail="token 已过期或无效")

    current_user = get_user_by_username(db, username=username)
    if not current_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if "openid.signed" not in params:
        raise HTTPException(status_code=400, detail="Steam 登录失败：缺少签名参数")

    is_valid = await _verify_steam_response(params)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Steam 登录验证失败")

    steam_id = _extract_steam_id(params)
    if not steam_id:
        raise HTTPException(status_code=400, detail="无法获取 Steam ID")

    existing_user = get_user_by_steam_id(db, steam_id=steam_id)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="该 Steam 账号已被其他用户绑定")

    update_user(db, user_id=current_user.id, user_update=UserUpdate(steam_id=steam_id))

    frontend_url = f"http://localhost:19006?steam_bind=success&steam_id={steam_id}"
    return RedirectResponse(url=frontend_url)


async def _verify_steam_response(params: dict) -> bool:
    signed = params.get("openid.signed", "")
    if not signed:
        return False

    verify_params = {
        "openid.ns": params.get("openid.ns", "http://specs.openid.net/auth/2.0"),
        "openid.mode": "check_authentication",
        "openid.op_endpoint": params.get("openid.op_endpoint", ""),
        "openid.claimed_id": params.get("openid.claimed_id", ""),
        "openid.identity": params.get("openid.identity", ""),
        "openid.return_to": params.get("openid.return_to", ""),
        "openid.response_nonce": params.get("openid.response_nonce", ""),
        "openid.assoc_handle": params.get("openid.assoc_handle", ""),
        "openid.signed": signed,
        "openid.sig": params.get("openid.sig", ""),
    }

    for field in signed.split(","):
        key = f"openid.{field}"
        if key in params:
            verify_params[key] = params[key]

    async with httpx.AsyncClient() as client:
        response = await client.post(STEAM_OPENID_URL, data=verify_params)

    return "is_valid:true" in response.text


def _extract_steam_id(params: dict) -> str | None:
    identity = params.get("openid.identity", "")
    match = re.search(r"(\d{17,})$", identity)
    return match.group(1) if match else None
