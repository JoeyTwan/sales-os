# Database Documentation

## Customer V1

### 字段定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 客户唯一标识 |
| name | VARCHAR(255) | NOT NULL | 客户名称 |
| level | ENUM | NOT NULL | 客户级别：高、中、低 |
| status | ENUM | NOT NULL | 客户状态：活跃、跟进中、暂停、流失 |
| summary | TEXT | NULL | 客户摘要/备注 |
| next_action | TEXT | NULL | 下一步行动 |
| next_action_date | DATE | NULL | 下一步行动日期 |
| last_activity_date | DATE | NULL | 最后活动日期 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### Enum 定义

**customer_level**
- HIGH (高)
- MEDIUM (中)
- LOW (低)

**customer_status**
- ACTIVE (活跃)
- FOLLOWING (跟进中)
- PAUSED (暂停)
- LOST (流失)

### PostgreSQL DDL

```sql
CREATE TYPE customer_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'FOLLOWING', 'PAUSED', 'LOST');

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    level customer_level NOT NULL,
    status customer_status NOT NULL,
    summary TEXT,
    next_action TEXT,
    next_action_date DATE,
    last_activity_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_level ON customers(level);
CREATE INDEX idx_customers_status ON customers(status);
```

---

## Activity V1

### 字段定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 活动唯一标识 |
| customer_id | UUID | NOT NULL, FOREIGN KEY | 关联客户 ID |
| type | ENUM | NOT NULL | 活动类型：拜访、电话、微信、会议、邮件、备注 |
| content | TEXT | NOT NULL | 活动内容 |
| activity_date | DATE | NOT NULL | 活动日期 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### Enum 定义

**activity_type**
- VISIT (拜访)
- CALL (电话)
- WECHAT (微信)
- MEETING (会议)
- EMAIL (邮件)
- NOTE (备注)

### 关系

- `customer_id` → `customers.id` (外键关联)
- 删除客户时级联删除活动：`ON DELETE CASCADE`

### PostgreSQL DDL

```sql
CREATE TYPE activity_type AS ENUM ('VISIT', 'CALL', 'WECHAT', 'MEETING', 'EMAIL', 'NOTE');

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    content TEXT NOT NULL,
    activity_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_customer_id ON activities(customer_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_activity_date ON activities(activity_date);
```
