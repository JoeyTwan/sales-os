# Sales OS

面向个人销售的 AI Sales Operating System

## 项目介绍

Sales OS 是一款面向个人销售人员的操作系统，旨在帮助销售专业人士高效管理客户关系、任务和工作记录，结合 AI 能力提供战略分析和决策支持。

## 核心价值

- **客户管理**：完整的客户信息管理，包括等级、状态、下一步动作
- **任务管理**：今日、本周、未来任务分组，列表和日历视图
- **AI战略分析**：基于数据的风险分析、机会分析和建议
- **知识库入口**：集成 NotebookLM 进行资料查询
- **工作记录**：快速记录所有想法和跟进内容
- **个人销售中枢**：统一管理销售工作的所有环节

## 当前功能

已完成：

- ✅ 工作台
- ✅ 客户管理
- ✅ 客户详情
- ✅ 跟进记录
- ✅ 任务系统
- ✅ 收件箱
- ✅ 深浅色模式
- ✅ NotebookLM入口

## 技术栈

### Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

### Backend

- FastAPI
- SQLAlchemy
- SQLite

## 本地启动

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端启动

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档

## Git工作流

```bash
git add .
git commit -m "中文描述"
git push origin main
```
