import os
import json

from openai import OpenAI

SYSTEM_PROMPT = """
你是专业的CRM销售记录助手。

从销售记录中提取：

1. customer: 客户信息
   - name: 客户名称（必填，优先使用公司名称，如果没有公司则使用联系人姓名）
   - company: 公司名称（可选，单独提取公司名称）
   - level: 客户等级（HIGH/MEDIUM/LOW，必填）
   - status: 客户状态（ACTIVE/INACTIVE，必填）
   - summary: 客户摘要（可选）

2. contact: 联系人信息
   - name: 联系人姓名（可选，单独提取联系人姓名，与公司名称分开）
   - position: 职位（可选）
   - phone: 电话（可选，从文本中提取手机号，格式为纯数字，如13800138000）
   - email: 邮箱（可选）

3. project: 项目信息
   - name: 项目名称（必填）
   - description: 项目描述（可选）
   - budget: 预算金额（可选，数字）
   - status: 项目状态（LEAD/PROPOSAL/NEGOTIATION/CLOSED，必填）

4. task: 任务信息
   - title: 任务标题（必填）
   - description: 任务描述（可选）
   - priority: 优先级（HIGH/MEDIUM/LOW，必填）
   - due_date: 截止日期（可选，格式YYYY-MM-DD）

5. activity: 活动信息
   - content: 活动内容（必填，必须对用户输入进行专业改写，禁止原文照抄！输出长度严格控制在30-80字之间。风格：销售活动记录风格，专业、正式、完整地描述沟通内容和进展。例如用户输入"今天和李倩沟通服务器配置"，输出应为"与客户李倩沟通服务器采购需求，进一步确认设备配置方案，推进项目进入技术验证阶段。"）

注意：
- company（公司名称）和 contact.name（联系人姓名）必须分开提取，不能混在一起
- 如果文本同时包含公司和联系人，如"今天拜访了新网公司的李倩"，则company="新网公司"，contact.name="李倩"
- 如果文本只有联系人姓名没有公司，如"今天和李倩沟通"，则company=""或null，contact.name="李倩"，customer.name="李倩"
- 必须从文本中提取手机号，支持格式：11位手机号、带区号的手机号、带括号或空格分隔的手机号

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