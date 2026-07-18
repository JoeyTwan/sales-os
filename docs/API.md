# Sales OS API 文档

## 基础信息

- **API Base URL**: `http://localhost:8000`
- **认证**: 暂无（开发阶段）
- **CORS**: 允许 `http://localhost:3000`

## 健康检查

### GET /api/health

检查API服务状态

**响应**:
```json
{
  "status": "ok",
  "message": "Sales OS API is running"
}
```

## 客户管理

### GET /api/customers

获取客户列表

**响应**:
```json
[
  {
    "id": "uuid",
    "name": "客户名称",
    "level": "HIGH|MEDIUM|LOW",
    "status": "ACTIVE|FOLLOWING|PAUSED|LOST",
    "summary": "客户摘要",
    "next_action": "下一步动作",
    "next_action_date": "2024-01-01",
    "last_activity_date": "2024-01-01",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "ai_summary": {
      "stage": "线索阶段",
      "budget": "30万",
      "decision_maker": "张总",
      "risk": "客户决策犹豫",
      "next_action": "发送方案",
      "estimated_close_date": "2024-02-01",
      "confidence": 60,
      "last_activity_summary": "活动摘要..."
    }
  }
]
```

### GET /api/customers/{customer_id}

获取单个客户详情

**响应**: 同 GET /api/customers 单个对象

### POST /api/customers

创建客户

**请求**:
```json
{
  "name": "客户名称",
  "level": "HIGH|MEDIUM|LOW",
  "status": "ACTIVE|FOLLOWING|PAUSED|LOST",
  "summary": "客户摘要",
  "next_action": "下一步动作",
  "next_action_date": "2024-01-01"
}
```

**响应**: 同 GET /api/customers 单个对象

### PATCH /api/customers/{customer_id}

更新客户

**请求**:
```json
{
  "name": "新名称",
  "level": "MEDIUM"
}
```

**响应**: 同 GET /api/customers 单个对象

### GET /api/customers/{customer_id}/ai-summary

获取客户AI摘要

**响应**:
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "stage": "线索阶段",
  "budget": "30万",
  "decision_maker": "张总",
  "risk": "客户决策犹豫",
  "next_action": "发送方案",
  "estimated_close_date": "2024-02-01",
  "confidence": 60,
  "last_activity_summary": "活动摘要...",
  "last_generated_at": "2024-01-01T00:00:00",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### POST /api/customers/{customer_id}/ai-summary/refresh

刷新客户AI摘要

**响应**:
```json
{
  "success": true,
  "summary": { ... }
}
```

## 活动管理

### GET /api/activities

获取最近活动列表（限制20条）

**响应**:
```json
[
  {
    "id": "uuid",
    "customer_id": "uuid|null",
    "project_id": "uuid|null",
    "content": "活动内容",
    "source": "capture|manual|email|meeting",
    "activity_date": "2024-01-01",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

### GET /api/activities/customer/{customer_id}

获取客户的活动列表

**响应**: 同 GET /api/activities

### POST /api/activities

创建活动

**请求**:
```json
{
  "customer_id": "uuid|null",
  "project_id": "uuid|null",
  "content": "活动内容",
  "source": "manual"
}
```

**响应**:
```json
{
  "id": "uuid",
  "content": "活动内容"
}
```

### POST /api/activities/raw

创建原始活动（不带客户关联）

**请求**:
```json
{
  "content": "活动内容"
}
```

**响应**: 同 POST /api/activities

### POST /api/activities/customer

为客户创建活动

**请求**:
```json
{
  "customer_id": "uuid",
  "content": "活动内容"
}
```

**响应**: 同 POST /api/activities

## 任务管理

### GET /api/tasks

获取任务列表

**响应**:
```json
[
  {
    "id": "uuid",
    "title": "任务标题",
    "description": "任务描述",
    "status": "TODO|DOING|DONE",
    "priority": "HIGH|MEDIUM|LOW",
    "due_date": "2024-01-01",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

### GET /api/tasks/today

获取今日待办任务

**响应**: 同 GET /api/tasks

### POST /api/tasks

创建任务

**请求**:
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "status": "TODO",
  "priority": "MEDIUM",
  "due_date": "2024-01-01"
}
```

**响应**: 同 GET /api/tasks 单个对象

### PATCH /api/tasks/{task_id}

更新任务

**请求**:
```json
{
  "status": "DOING",
  "priority": "HIGH"
}
```

**响应**: 同 GET /api/tasks 单个对象

## 项目管理

### GET /api/projects

获取项目列表

**查询参数**:
- `status`: 可选，按状态筛选

**响应**:
```json
[
  {
    "id": "uuid",
    "customer_id": "uuid",
    "name": "项目名称",
    "description": "项目描述",
    "budget": 300000,
    "status": "LEAD|QUALIFIED|PROPOSAL|NEGOTIATION|WON|LOST",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

### GET /api/projects/{project_id}

获取单个项目

**响应**: 同 GET /api/projects 单个对象

### GET /api/projects/customer/{customer_id}

获取客户的项目列表

**响应**: 同 GET /api/projects

### POST /api/projects

创建项目

**请求**:
```json
{
  "customer_id": "uuid",
  "name": "项目名称",
  "description": "项目描述",
  "budget": 300000,
  "status": "LEAD"
}
```

**响应**: 同 GET /api/projects 单个对象

### PATCH /api/projects/{project_id}

更新项目

**请求**: 同 POST /api/projects

**响应**: 同 GET /api/projects 单个对象

### DELETE /api/projects/{project_id}

删除项目

**响应**:
```json
{
  "message": "Project deleted successfully"
}
```

## 收件箱

### GET /api/inbox

获取收件箱列表

**响应**:
```json
[
  {
    "id": "uuid",
    "content": "内容",
    "status": "PENDING|CONFIRMED|ARCHIVED",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

### POST /api/inbox

创建收件箱项

**请求**:
```json
{
  "content": "内容"
}
```

**响应**: 同 GET /api/inbox 单个对象

### PATCH /api/inbox/{id}

更新收件箱项状态

**请求**:
```json
{
  "status": "CONFIRMED"
}
```

**响应**: 同 GET /api/inbox 单个对象

## AI建议

### POST /api/suggestions/analyze

分析用户输入内容，提取客户、项目、任务信息

**请求**:
```json
{
  "content": "今天拜访了天昕电子，预算30万，下周二发方案"
}
```

**响应**:
```json
{
  "suggestion_id": "uuid",
  "raw_content": "原始内容",
  "matched_customer": {
    "id": "uuid",
    "name": "客户名称",
    "confidence": 1.0
  },
  "customers": [
    {
      "name": "客户名称",
      "company": "公司名称",
      "level": "HIGH|MEDIUM",
      "status": "ACTIVE",
      "summary": "摘要"
    }
  ],
  "contacts": [],
  "projects": [
    {
      "name": "项目名称",
      "description": "描述",
      "budget": 300000,
      "status": "LEAD"
    }
  ],
  "tasks": [
    {
      "title": "任务标题",
      "description": "描述",
      "priority": "HIGH|MEDIUM",
      "due_date": "2024-01-01"
    }
  ]
}
```

### POST /api/suggestions/{suggestion_id}/confirm

确认并创建建议中的数据

**请求**:
```json
{
  "customer": {
    "name": "客户名称",
    "level": "HIGH",
    "status": "ACTIVE",
    "summary": "摘要"
  },
  "project": {
    "name": "项目名称",
    "description": "描述",
    "budget": 300000,
    "status": "LEAD"
  },
  "tasks": [
    {
      "title": "任务标题",
      "priority": "HIGH",
      "due_date": "2024-01-01"
    }
  ]
}
```

**响应**:
```json
{
  "message": "Suggestions confirmed and created successfully"
}
```

## 错误响应格式

```json
{
  "detail": "错误描述"
}
```

**HTTP状态码**:
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误
