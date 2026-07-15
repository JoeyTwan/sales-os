# Sales OS

Sales OS 是一个面向销售工程师的 AI 工作操作系统。

## 技术栈

- **前端**: Next.js 15 (TypeScript, App Router, Tailwind CSS 4)
- **后端**: FastAPI (Python)
- **数据库**: 待配置
- **Docker**: 待配置

## 项目结构

```
sales-os/
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/       # App Router 页面
│   │   ├── components/ # 可复用组件
│   │   ├── hooks/     # 自定义 Hooks
│   │   ├── lib/       # 工具函数（API 客户端等）
│   │   ├── styles/    # 全局样式
│   │   └── types/     # TypeScript 类型定义
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── backend/           # FastAPI 后端应用
│   ├── app/
│   │   ├── api/       # API 路由
│   │   ├── config/    # 配置管理
│   │   ├── schemas/   # Pydantic 模型
│   │   ├── utils/     # 工具函数
│   │   └── main.py    # 应用入口
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

访问: http://localhost:8000

## 目标

- 一个入口
- 一个上下文
- 一个 CRM
- AI 自动整理信息，而不是增加操作

## 第一版原则

- Capture First（先记录）
- CRM First（CRM 是核心）
- AI Invisible（AI 隐形）
- Less but Better（少，但更好）
