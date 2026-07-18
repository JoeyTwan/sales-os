# Sales OS 已知问题

## 1. 样式问题

### 1.1 Next.js 15 + Tailwind CSS 4 兼容性问题

**状态**: ✅ 已修复（降级到 Next.js 14 + Tailwind CSS 3）

**问题描述**: 
- Next.js 15.5.0 与 Tailwind CSS 4.x 在开发模式下存在兼容性问题
- CSS 文件 `/next/static/css/app/layout.css` 返回 404
- 页面显示纯文字，无样式

**根因**:
- Next.js 15 在开发模式下对 CSS 文件的处理方式发生了变化
- Tailwind CSS 4 使用新的 `@import "tailwindcss"` 和 `@theme` 指令
- 开发服务器无法正确提供这些文件

**修复方案**:
- 降级到 Next.js 14.2.15 + React 18.2.0 + Tailwind CSS 3.4.14
- 使用传统的 `@tailwind base/components/utilities` 指令
- 使用 `tailwind.config.js` 配置主题

**相关文件**:
- `frontend/package.json`
- `frontend/src/styles/globals.css`
- `frontend/postcss.config.mjs`
- `frontend/tailwind.config.js`

## 2. ESLint 依赖冲突

**状态**: ✅ 已修复

**问题描述**:
- ESLint 9.0.0 与 `eslint-config-next` 15.5.0 存在版本冲突
- 运行 `npm run lint` 时可能报错

**修复方案**:
- 降级 ESLint 到 8.x 版本
- 降级 `eslint-config-next` 到 14.2.15

## 3. CORS 配置限制

**状态**: ⚠️ 待改进

**问题描述**:
- 后端 CORS 配置只允许 `http://localhost:3000`
- 前端开发服务器运行在 `http://localhost:3002`
- 虽然前端通过代理访问 API，但生产环境部署时需要调整

**文件**: `backend/app/main.py`

**建议**:
- 配置环境变量来控制允许的 origins
- 生产环境使用反向代理统一域名

## 4. 缺少用户认证系统

**状态**: ❌ 未实现

**问题描述**:
- 当前 API 没有任何认证机制
- 所有接口都可以匿名访问
- 生产环境存在安全风险

**建议**:
- 实现 JWT 或 Session 认证
- 添加用户模型和登录/注册功能
- API 添加认证中间件

## 5. 缺少数据验证和错误处理

**状态**: ⚠️ 部分实现

**问题描述**:
- 前端 API 调用缺少完善的错误处理
- 部分 try-catch 块为空，错误被静默忽略
- 用户操作失败时没有友好的错误提示

**示例代码**:
```typescript
try {
  const response = await fetch("/api/customers");
  if (response.ok) {
    const data = await response.json();
    setCustomers(data);
  }
} catch {} // 错误被忽略
```

**建议**:
- 添加全局错误处理
- 使用 Toast 或 Alert 显示错误信息
- 在 catch 块中记录错误日志

## 6. 前端类型定义不完整

**状态**: ⚠️ 待改进

**问题描述**:
- `frontend/src/types/index.ts` 定义的类型不完整
- 页面组件中重复定义了相同的接口（如 Customer、Task 等）
- 缺少统一的类型定义文件

**建议**:
- 将所有类型定义集中到 `frontend/src/types/index.ts`
- 删除页面组件中的重复定义
- 使用 `import type` 导入类型

## 7. AI 分析引擎使用 Mock 实现

**状态**: ❌ 未实现

**问题描述**:
- `backend/app/api/suggestions.py` 中的 `MockAIEngine` 是基于正则表达式的简单实现
- 无法进行真正的自然语言理解
- 识别准确率有限

**建议**:
- 接入真实的 LLM API（如 OpenAI、阿里云等）
- 使用 Embedding 进行语义匹配
- 实现更复杂的实体识别

## 8. 数据库缺少索引

**状态**: ⚠️ 待优化

**问题描述**:
- 数据库表缺少索引
- 查询性能随数据量增长会下降
- 特别是 `customer_id`、`project_id` 等外键字段

**建议**:
- 为外键字段添加索引
- 为常用查询字段（如 `status`、`activity_date`）添加索引
- 考虑添加复合索引

## 9. 缺少分页功能

**状态**: ❌ 未实现

**问题描述**:
- 所有列表 API 没有分页
- 数据量大时性能差
- 前端渲染可能卡顿

**建议**:
- 实现分页参数（page、limit）
- 添加总数统计
- 前端实现分页组件

## 10. 深色模式实现不完整

**状态**: ⚠️ 部分实现

**问题描述**:
- 深色模式切换功能已实现
- 但部分页面和组件可能未完全适配
- 可能存在样式冲突

**建议**:
- 全面测试深色模式
- 确保所有组件适配深色模式
- 使用 Tailwind 的 `dark:` 前缀

## 11. 后端 API 响应格式不一致

**状态**: ⚠️ 待改进

**问题描述**:
- 部分 API 返回标准格式（包含 success、data、message）
- 部分 API 直接返回数据
- 前端需要处理多种响应格式

**示例**:
```python
# 格式1
return {"status": "ok", "message": "..."}

# 格式2  
return [customer1, customer2]

# 格式3
return {"success": True, "summary": {...}}
```

**建议**:
- 统一响应格式
- 使用标准的 ApiResponse 包装

## 12. 缺少测试覆盖

**状态**: ❌ 未实现

**问题描述**:
- 前端和后端都没有单元测试
- 没有集成测试
- 功能变更可能引入回归问题

**建议**:
- 添加后端单元测试（pytest）
- 添加前端单元测试（Jest）
- 实现 CI/CD 自动化测试

## 问题优先级汇总

| 优先级 | 问题 | 状态 |
|--------|------|------|
| 🔴 高 | Next.js 15 + Tailwind 4 兼容性 | ✅ 已修复 |
| 🔴 高 | 用户认证系统 | ❌ 未实现 |
| 🟡 中 | CORS 配置限制 | ⚠️ 待改进 |
| 🟡 中 | 数据验证和错误处理 | ⚠️ 部分实现 |
| 🟡 中 | 前端类型定义 | ⚠️ 待改进 |
| 🟡 中 | API 响应格式不一致 | ⚠️ 待改进 |
| 🟢 低 | AI 分析引擎 | ❌ 未实现 |
| 🟢 低 | 数据库索引 | ⚠️ 待优化 |
| 🟢 低 | 分页功能 | ❌ 未实现 |
| 🟢 低 | 深色模式 | ⚠️ 部分实现 |
| 🟢 低 | 测试覆盖 | ❌ 未实现 |
