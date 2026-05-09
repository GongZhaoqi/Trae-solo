# 临境推演 - 临床决策实训全链路闭环平台

## 项目结构

```
linjing-tuoyan/
├── frontend/                 # 前端应用（React + TypeScript）
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── types/           # TypeScript类型
│   │   ├── utils/           # 工具函数
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── backend/                  # 后端应用（FastAPI + Python）
│   ├── app/
│   │   ├── api/             # API路由
│   │   │   └── v1/
│   │   │       ├── endpoints/  # 具体API端点
│   │   │       └── api.py      # API版本路由
│   │   ├── core/            # 核心配置
│   │   │   ├── config.py     # 应用配置
│   │   │   ├── security.py   # 安全认证
│   │   │   └── database.py  # 数据库连接
│   │   ├── models/          # 数据模型（SQLAlchemy）
│   │   ├── schemas/         # Pydantic模型
│   │   ├── services/        # 业务逻辑
│   │   │   ├── cases/       # 病例剧本服务
│   │   │   ├── engine/      # 决策引擎
│   │   │   ├── sensors/     # 多模态感知
│   │   │   ├── feedback/    # 反馈系统
│   │   │   └── tutor/       # 智能导师
│   │   ├── ml/              # 机器学习模块
│   │   │   ├── llm/         # LLM剧本生成
│   │   │   └── multimodal/  # 多模态感知（MediaPipe）
│   │   └── main.py          # 应用入口
│   ├── tests/               # 测试文件
│   ├── requirements.txt
│   └── README.md
│
├── docker-compose.yml        # Docker编排
├── .env.example              # 环境变量示例
└── README.md                  # 项目说明
```

## 技术栈

### 前端
- React 18
- TypeScript 5
- React Router v6
- Zustand (状态管理)
- Tailwind CSS
- MediaPipe (多模态感知)

### 后端
- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- Pydantic (数据验证)
- Neo4j (图数据库)
- PostgreSQL
- JWT (认证)
- MediaPipe

## 快速开始

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker部署
```bash
docker-compose up -d
```
