# Sales OS

Sales OS 是一个 AI 驱动的销售操作系统。

销售只需要记录每天的拜访、电话、微信沟通内容，
AI 即可自动识别客户、联系人、项目、预算、任务，
并自动生成 CRM 数据。

---

## 为什么要做 Sales OS

传统 CRM 最大的问题：

- 销售不愿录入
- 数据滞后
- 跟进记录缺失
- 客户信息分散
- 项目推进过程不可追踪

结果：

CRM 最终变成了管理层看的系统，
而不是销售每天真正使用的工具。

Sales OS 的目标：

把 CRM 从"录入系统"
变成"自动生成系统"。

销售只需要说：

"今天和新网银行李倩沟通，
他们计划采购昇腾910B液冷服务器，
预算300万，下周安排技术交流。"

AI 自动生成：

✅ 客户

✅ 联系人

✅ 项目

✅ 预算

✅ 跟进记录

✅ 待办任务

真正做到：

销售负责沟通，
AI 负责录入。

---

## 核心能力

### AI销售记录解析

输入：

自然语言销售记录

输出：

结构化客户数据

自动提取：

- 客户
- 联系人
- 项目
- 商机
- 预算
- 跟进任务

---

### Customer Brain

自动汇总客户历史信息。

帮助销售快速了解：

- 最近沟通内容
- 当前项目状态
- 风险点
- 下一步动作

---

### 客户管理

统一管理：

- 客户
- 联系人
- 活动记录
- 项目机会

---

### 项目管理

跟踪：

- 项目阶段
- 项目预算
- 商机进展
- 关键里程碑

---

### 任务管理

自动生成销售待办。

例如：

- 发解决方案
- 安排演示
- 发送报价
- 客户回访

---

### 用户认证与数据隔离

支持：

- JWT认证
- 多用户隔离
- 安全访问控制

---

## 产品流程

销售输入：

"今天与新网银行项目负责人李倩沟通，
客户计划采购昇腾910B液冷服务器，
预算300万元，
下周安排技术验证。"

↓

AI分析

↓

识别客户

↓

识别项目

↓

识别预算

↓

识别任务

↓

确认

↓

自动生成CRM数据

---

## 产品截图

### 登录页

![登录页](docs/images/login.png)

### Dashboard

![Dashboard](docs/images/dashboard.png)

### AI Analyze

![AI Analyze](docs/images/ai-analyze.png)

### Customer Brain

![Customer Brain](docs/images/customer-brain.png)

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/JoeyTwan/sales-os.git

cd sales-os
```

### 2. 配置AI

复制配置文件：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，填写：

```
DEEPSEEK_API_KEY=你的DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

---

### 3. 启动后端

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

默认地址：

http://localhost:8000

---

### 4. 启动前端

```bash
cd frontend

npm install

npm run dev
```

默认地址：

http://localhost:3000

---

## DeepSeek API配置

本项目默认支持 DeepSeek。

申请地址：

https://platform.deepseek.com/

创建 API Key 后：

填写到：

`backend/.env`

即可使用 AI 分析能力。

---

## Roadmap

未来规划：

- 邮件自动同步
- 微信聊天记录导入
- AI客户评分
- AI跟进建议
- AI销售预测
- PostgreSQL
- Docker部署
- 云服务器部署

---

## 作者

Joey Twan

独立开发的 AI Agent 项目。

目标：

让销售专注于业务，让 AI 多做工作。