# 减肥助手 App

一款基于 React Native + FastAPI 的减肥管理应用，支持体重记录、目标追踪和 AI 智能建议。

## 功能特性

- ✅ 用户注册与登录
- ✅ 设置目标体重和个人信息
- ✅ 每日体重记录
- ✅ 体重变化趋势图表
- ✅ BMI 计算
- ✅ 减肥进度追踪
- ✅ AI 智能饮食和运动建议（基于 OpenAI API）
- ✅ 历史记录管理

## 技术架构

### 后端
- **框架**: FastAPI
- **数据库**: MySQL
- **ORM**: SQLAlchemy
- **AI 集成**: OpenAI API
- **认证**: JWT Token

### 前端
- **框架**: React Native + Expo
- **UI**: React Native Paper
- **导航**: React Navigation
- **图表**: react-native-chart-kit
- **状态管理**: React Context + Hooks

## 项目结构

```
weight-loss-app/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── main.py             # FastAPI入口
│   │   ├── config.py           # 配置文件
│   │   ├── database.py         # 数据库连接
│   │   ├── models.py           # 数据库模型
│   │   ├── schemas.py          # Pydantic模型
│   │   ├── security.py         # 安全模块
│   │   ├── crud.py             # 数据库操作
│   │   ├── ai_service.py       # AI服务
│   │   ├── init_db.py          # 数据库初始化
│   │   └── routers/            # API路由
│   │       ├── users.py        # 用户管理
│   │       ├── weights.py      # 体重记录
│   │       └── advice.py       # AI建议
│   ├── .env                    # 环境变量
│   └── requirements.txt        # 依赖
└── frontend/                   # 前端应用
    ├── src/
    │   ├── types/              # 类型定义
    │   ├── api/                # API调用
    │   ├── context/            # 状态管理
    │   ├── navigation/         # 导航配置
    │   └── screens/            # 页面组件
    ├── App.tsx                 # 入口文件
    ├── app.json               # Expo配置
    ├── package.json            # 依赖
    └── tsconfig.json          # TypeScript配置
```

## 快速开始

### 1. 配置后端

```bash
cd backend
pip install -r requirements.txt
```

编辑 `.env` 文件，配置数据库和 OpenAI API Key：

```env
DATABASE_URL=mysql+pymysql://admin:password@localhost:3306/weight_loss_db
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your-secret-key
```

初始化数据库并启动服务：

```bash
cd app
python init_db.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 配置前端

```bash
cd frontend
npm install
```

启动开发服务器：

```bash
npm start
```

## API 文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 使用说明

1. 注册账号并填写个人信息（目标体重、当前体重、身高、年龄、性别）
2. 每日更新体重记录
3. 查看体重变化趋势和减肥进度
4. 点击生成 AI 建议获取个性化饮食和运动建议

## License

MIT