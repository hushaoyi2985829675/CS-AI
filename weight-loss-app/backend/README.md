# Weight Loss App Backend

基于 FastAPI 的减肥助手后端服务。

## 技术栈

- Python 3.10+
- FastAPI
- SQLAlchemy
- MySQL
- OpenAI API

## 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

## 配置环境变量

编辑 `.env` 文件：

```env
DATABASE_URL=mysql+pymysql://admin:password@localhost:3306/weight_loss_db
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 初始化数据库

确保 MySQL 中已创建数据库：

```sql
CREATE DATABASE weight_loss_db;
```

运行初始化脚本：

```bash
cd app
python init_db.py
```

## 启动服务

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API 文档

启动后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 用户管理
- `POST /api/users/register` - 用户注册
- `POST /token` - 用户登录
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息

### 体重记录
- `POST /api/weights` - 添加体重记录
- `GET /api/weights` - 获取体重记录列表
- `GET /api/weights/latest` - 获取最新体重记录
- `DELETE /api/weights/{id}` - 删除体重记录

### AI建议
- `POST /api/advice/generate` - 生成AI建议
- `GET /api/advice` - 获取建议列表
- `GET /api/advice/latest` - 获取最新建议