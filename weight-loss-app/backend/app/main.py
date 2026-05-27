from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from .config import settings
from .database import engine, get_db
from .models import Base
from .schemas import Token, User
from .crud import get_user_by_username
from .security import verify_password, create_access_token
from .routers import users, advice, steam

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CS2 Inventory Analyzer", version="1.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(advice.router)
app.include_router(steam.router)


# 用户登录，获取 JWT 访问令牌
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    用户登录获取访问令牌

    使用用户名和密码进行身份验证，成功后返回 JWT 访问令牌。
    - **username**: 用户名
    - **password**: 密码

    返回：
    - **access_token**: JWT 访问令牌
    - **token_type**: 令牌类型（bearer）
    """
    user = get_user_by_username(db, username=form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号未注册",
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# API 根路径，返回欢迎信息
@app.get("/")
async def root():
    """
    API 根路径

    返回欢迎信息，用于确认 API 服务正常运行。
    """
    return {"message": "Welcome to CS2 Inventory Analyzer API"}


# 健康检查接口
@app.get("/health")
async def health_check():
    """
    健康检查

    用于监控和负载均衡器检测 API 服务的运行状态。
    返回服务当前的健康状态。
    """
    return {"status": "healthy"}


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>CS2 Inventory Analyzer - API Docs</title>
        <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.9.0/swagger-ui.css">
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.bootcdn.net/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.js"></script>
        <script>
            SwaggerUIBundle({
                url: "/openapi.json",
                dom_id: '#swagger-ui',
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                layout: "BaseLayout"
            });
        </script>
    </body>
    </html>
    """)
