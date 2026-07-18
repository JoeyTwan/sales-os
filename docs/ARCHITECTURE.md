# Sales OS 架构文档

## 1. 系统概览

Sales OS 是一个现代化的销售操作系统，采用前后端分离架构。

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 14.2.15 |
| 前端语言 | TypeScript | 5.6.0 |
| 前端样式 | Tailwind CSS | 3.4.14 |
| 状态管理 | React Context | - |
| 后端框架 | FastAPI | 0.115.0 |
| 后端语言 | Python | 3.10+ |
| 数据库 | SQLite | - |
| ORM | SQLAlchemy | 2.0.35 |
| 数据验证 | Pydantic | 2.9.0 |

## 2. 架构图

```mermaid
graph TB
    subgraph 前端层
        A[Next.js App] --> B[API层 /api]
        A --> C[页面组件]
        A --> D[共享组件]
        A --> E[Context状态管理]
    end

    subgraph 后端层
        F[FastAPI] --> G[路由层]
        G --> H[业务逻辑层]
        H --> I[数据访问层]
        I --> J[(SQLite数据库)]
    end

    B --> F
```

## 3. 数据库 ER 图

```mermaid
erDiagram
    customers ||--o{ activities : has
    customers ||--o{ projects : has
    customers ||--o{ customer_ai_summary : has
    projects ||--o{ activities : belongs_to
    
    customers {
        string id PK "主键(UUID)"
        string name "客户名称"
        enum level "等级(HIGH/MEDIUM/LOW)"
        enum status "状态(ACTIVE/FOLLOWING/PAUSED/LOST)"
        text summary "摘要"
        text next_action "下一步动作"
        date next_action_date "下一步动作日期"
        date last_activity_date "最后活动日期"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }
    
    activities {
        string id PK "主键(UUID)"
        string customer_id FK "客户ID"
        string project_id FK "项目ID"
        text content "活动内容"
        enum source "来源(capture/manual/email/meeting)"
        date activity_date "活动日期"
        timestamp created_at "创建时间"
    }
    
    projects {
        string id PK "主键(UUID)"
        string customer_id FK "客户ID"
        string name "项目名称"
        text description "项目描述"
        integer budget "预算"
        enum status "状态(LEAD/QUALIFIED/PROPOSAL/NEGOTIATION/WON/LOST)"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }
    
    tasks {
        string id PK "主键(UUID)"
        string title "任务标题"
        text description "任务描述"
        enum status "状态(TODO/DOING/DONE)"
        enum priority "优先级(HIGH/MEDIUM/LOW)"
        date due_date "截止日期"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }
    
    inbox_items {
        uuid id PK "主键(UUID)"
        string content "内容"
        enum status "状态(PENDING/CONFIRMED/ARCHIVED)"
        datetime created_at "创建时间"
    }
    
    ai_suggestions {
        string id PK "主键(UUID)"
        enum status "状态(PENDING/CONFIRMED/CANCELLED)"
        string raw_content "原始内容"
        json suggestion_json "建议JSON"
        datetime created_at "创建时间"
    }
    
    customer_ai_summary {
        string id PK "主键(UUID)"
        string customer_id FK "客户ID"
        string stage "阶段"
        string budget "预算"
        string decision_maker "决策人"
        text risk "风险"
        text next_action "下一步动作"
        date estimated_close_date "预计签约日期"
        integer confidence "可信度"
        text last_activity_summary "最近活动摘要"
        timestamp last_generated_at "最后生成时间"
        timestamp created_at "创建时间"
        timestamp updated_at "更新时间"
    }
```

## 4. 前端路由结构

```mermaid
graph LR
    A[/] --> B[工作台]
    A --> C[/customers]
    C --> D[/customers/[id]]
    A --> E[/tasks]
    A --> F[/inbox]
    F --> G[/inbox/[id]]
    A --> H[/suggestions]
    H --> I[/suggestions/[id]]
    A --> J[/knowledge]
    A --> K[/settings]
```

### 路由详情

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | DashboardPage | 工作台首页，AI分析入口 |
| `/customers` | CustomersPage | 客户列表页 |
| `/customers/[id]` | CustomerDetailPage | 客户详情页 |
| `/tasks` | TasksPage | 任务管理页 |
| `/inbox` | InboxPage | 收件箱页 |
| `/inbox/[id]` | InboxDetailPage | 收件箱详情页 |
| `/suggestions` | SuggestionsPage | AI建议列表页 |
| `/suggestions/[id]` | SuggestionDetailPage | AI建议详情页 |
| `/knowledge` | KnowledgePage | 知识库页 |
| `/settings` | SettingsPage | 系统设置页 |

## 5. 前后端依赖关系

### 前端 API 调用映射

| 前端页面 | 调用的 API | 方法 |
|----------|-----------|------|
| `/` | `/api/activities` | GET |
| `/` | `/api/tasks` | GET |
| `/` | `/api/customers` | GET |
| `/` | `/api/suggestions/analyze` | POST |
| `/` | `/api/suggestions/{id}/confirm` | POST |
| `/customers` | `/api/customers` | GET |
| `/customers/[id]` | `/api/customers/{id}` | GET |
| `/customers/[id]` | `/api/customers/{id}/ai-summary` | GET |
| `/customers/[id]` | `/api/activities/customer/{id}` | GET |
| `/customers/[id]` | `/api/projects/customer/{id}` | GET |
| `/tasks` | `/api/tasks` | GET |
| `/tasks` | `/api/tasks/{id}` | PATCH |
| `/inbox` | `/api/inbox` | GET |
| `/inbox/[id]` | `/api/inbox/{id}` | PATCH |
| `/suggestions` | `/api/suggestions/analyze` | POST |

### 代理配置

前端通过 `next.config.mjs` 配置 API 代理：

```js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*'
    }
  ]
}
```

## 6. 项目结构

### 前端结构

```
frontend/
├── src/
│   ├── app/                 # 路由页面
│   │   ├── customers/       # 客户模块
│   │   ├── inbox/           # 收件箱模块
│   │   ├── knowledge/       # 知识库模块
│   │   ├── settings/        # 设置模块
│   │   ├── suggestions/     # AI建议模块
│   │   ├── tasks/           # 任务模块
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── components/          # 共享组件
│   ├── context/             # React Context
│   ├── hooks/               # 自定义Hooks
│   ├── lib/                 # 工具函数
│   ├── styles/              # 全局样式
│   └── types/               # TypeScript类型定义
├── next.config.mjs          # Next.js配置
├── tailwind.config.js       # Tailwind配置
├── postcss.config.mjs       # PostCSS配置
└── package.json             # 依赖配置
```

### 后端结构

```
backend/
├── app/
│   ├── api/                 # API路由
│   │   ├── activities.py
│   │   ├── customers.py
│   │   ├── customer_ai_summary.py
│   │   ├── health.py
│   │   ├── inbox.py
│   │   ├── projects.py
│   │   ├── suggestions.py
│   │   └── tasks.py
│   ├── config/              # 配置文件
│   ├── models/              # 数据库模型
│   ├── schemas/             # Pydantic模式
│   ├── utils/               # 工具函数
│   ├── database.py          # 数据库连接
│   └── main.py              # 应用入口
├── data/                    # SQLite数据文件
└── requirements.txt         # Python依赖
```
