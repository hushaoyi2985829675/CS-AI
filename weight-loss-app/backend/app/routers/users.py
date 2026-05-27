from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..schemas import User, UserCreate, UserUpdate
from ..crud import get_user_by_email, get_user_by_username, create_user, update_user, get_user
from ..database import get_db
from ..security import get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

# 注册新用户
@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册

    - **username**: 用户名（唯一）
    - **password**: 密码
    - **steam_id**: Steam ID（可选）
    """
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

# 获取当前登录用户信息
@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    获取当前登录用户信息

    需要通过 Authorization 头部传入 Bearer Token 进行身份验证。
    返回当前登录用户的完整信息。
    """
    return current_user

# 根据用户 ID 获取用户信息
@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    根据用户 ID 获取用户信息

    - **user_id**: 用户的唯一标识 ID
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user

# 更新当前登录用户信息
@router.put("/me", response_model=User)
def update_users_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新当前登录用户信息

    所有字段均为可选，只更新传入的字段。
    - **steam_id**: Steam ID
    """
    updated_user = update_user(db, user_id=current_user.id, user_update=user_update)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user
