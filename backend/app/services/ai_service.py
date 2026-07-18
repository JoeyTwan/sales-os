import os
import json

from openai import OpenAI

SYSTEM_PROMPT = """
你是CRM销售助手。

从销售记录中提取：

1. customer: 客户信息
   - name: 客户名称（必填）
   - company: 公司名称（可选）
   - level: 客户等级（HIGH/MEDIUM/LOW，必填）
   - status: 客户状态（ACTIVE/INACTIVE，必填）
   - summary: 客户摘要（可选）

2. contact: 联系人信息
   - name: 联系人姓名（可选）
   - position: 职位（可选）
   - phone: 电话（可选）
   - email: 邮箱（可选）

3. project: 项目信息
   - name: 项目名称（必填）
   - description: 项目描述（可选）
   - budget: 预算金额（可选，数字）
   - status: 项目状态（LEAD/PROPOSAL/CLOSED，必填）

4. task: 任务信息
   - title: 任务标题（必填）
   - description: 任务描述（可选）
   - priority: 优先级（HIGH/MEDIUM/LOW，必填）
   - due_date: 截止日期（可选，格式YYYY-MM-DD）

5. activity: 活动信息
   - content: 活动内容（可选）

返回JSON。

禁止Markdown。
禁止解释。
仅返回JSON。

格式：

{
  "customer": {"name": "", "company": "", "level": "MEDIUM", "status": "ACTIVE", "summary": ""},
  "contact": {"name": "", "position": "", "phone": "", "email": ""},
  "project": {"name": "", "description": "", "budget": null, "status": "LEAD"},
  "task": {"title": "", "description": "", "priority": "MEDIUM", "due_date": ""},
  "activity": {"content": ""}
}

如果某项信息无法从销售记录中提取，对应字段可以为空字符串或null。
"""


def load_env():
    from dotenv import load_dotenv
    load_dotenv()


def get_client():
    load_env()
    return OpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com"
    )


def analyze_sales_note(content: str):
    client = get_client()
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        temperature=0.1,
    )

    result = response.choices[0].message.content

    return json.loads(result)