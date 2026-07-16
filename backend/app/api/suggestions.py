import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from app.database import get_db
from app.models.suggestion import AISuggestion
from app.models.customer import Customer

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


class CustomerSuggestion(BaseModel):
    name: str = Field(..., description="客户名称")
    company: Optional[str] = Field(None, description="公司名称")
    level: str = Field("MEDIUM", description="客户等级")
    status: str = Field("ACTIVE", description="客户状态")
    summary: Optional[str] = Field(None, description="客户摘要")


class ContactSuggestion(BaseModel):
    name: Optional[str] = Field(None, description="联系人名称")
    position: Optional[str] = Field(None, description="职位")
    phone: Optional[str] = Field(None, description="电话")
    email: Optional[str] = Field(None, description="邮箱")


class ProjectSuggestion(BaseModel):
    name: str = Field(..., description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    budget: Optional[int] = Field(None, description="预算（元）")
    status: str = Field("LEAD", description="项目状态")


class TaskSuggestion(BaseModel):
    title: str = Field(..., description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    priority: str = Field("MEDIUM", description="优先级")
    due_date: Optional[str] = Field(None, description="截止日期")


class MatchedCustomer(BaseModel):
    id: str
    name: str
    confidence: float


class AnalyzeResponse(BaseModel):
    suggestion_id: str
    raw_content: str
    matched_customer: Optional[MatchedCustomer] = None
    customers: List[CustomerSuggestion] = []
    contacts: List[ContactSuggestion] = []
    projects: List[ProjectSuggestion] = []
    tasks: List[TaskSuggestion] = []


class ConfirmRequest(BaseModel):
    customer: Optional[CustomerSuggestion] = None
    project: Optional[ProjectSuggestion] = None
    tasks: List[TaskSuggestion] = []


class MockAIEngine:
    @staticmethod
    def extract_customer_info(content: str):
        patterns = {
            "company": [
                r"拜访了([^，,。]+?)[，,。]",
                r"客户([^，,。]+?公司)",
                r"客户([^，,。]+?科技)",
                r"客户([^，,。]+?电子)",
                r"客户([^，,。]+?集团)",
                r"客户([^，,。]+?有限公司)",
                r"([^，,。]+?公司)",
                r"([^，,。]+?科技)",
                r"([^，,。]+?电子)",
                r"([^，,。]+?集团)",
                r"([^，,。]+?有限公司)",
            ],
            "name": [r"联系([^，,。]+?)[，,。]", r"见([^，,。]+?)[，,。]", r"与([^，,。]+?)沟通"],
        }

        company = None
        name = None

        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, content)
                if match:
                    extracted = match.group(1).strip()
                    prefixes_to_remove = ["新客户", "客户"]
                    for prefix in prefixes_to_remove:
                        if extracted.startswith(prefix):
                            extracted = extracted[len(prefix):].strip()
                            break
                    if key == "company":
                        company = extracted
                    elif key == "name":
                        name = extracted
                    break

        return {"company": company, "name": name}

    @staticmethod
    def extract_project_info(content: str):
        project_keywords = ["MES", "ERP", "WMS", "数字化", "工厂", "自动化", "系统"]

        project_name = None
        for keyword in project_keywords:
            if keyword in content:
                project_name = keyword
                break

        budget_pattern = r"预算(.+?)[万,元]"
        budget_match = re.search(budget_pattern, content)
        budget = None
        if budget_match:
            try:
                budget = int(float(budget_match.group(1).strip()) * 10000)
            except:
                pass

        return {"project_name": project_name, "budget": budget}

    @staticmethod
    def extract_date_info(content: str):
        today = datetime.now().date()

        date_keywords = [
            (r"明天", today + timedelta(days=1)),
            (r"后天", today + timedelta(days=2)),
            (r"周一", MockAIEngine._get_next_weekday(today, 0)),
            (r"周二", MockAIEngine._get_next_weekday(today, 1)),
            (r"周三", MockAIEngine._get_next_weekday(today, 2)),
            (r"周四", MockAIEngine._get_next_weekday(today, 3)),
            (r"周五", MockAIEngine._get_next_weekday(today, 4)),
            (r"周六", MockAIEngine._get_next_weekday(today, 5)),
            (r"周日", MockAIEngine._get_next_weekday(today, 6)),
            (r"下周", today + timedelta(days=7)),
        ]

        due_date = None
        for keyword, target_date in date_keywords:
            if keyword in content:
                due_date = target_date
                break

        return due_date

    @staticmethod
    def _get_next_weekday(today: datetime.date, weekday: int):
        days_ahead = weekday - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return today + timedelta(days=days_ahead)

    @staticmethod
    def extract_task_title(content: str):
        task_keywords = ["发方案", "报价", "回访", "开会", "跟进", "提交", "确认"]

        for keyword in task_keywords:
            if keyword in content:
                return keyword + " - " + content[:20]

        return content[:30]

    @staticmethod
    def analyze(content: str) -> dict:
        customers = []
        contacts = []
        projects = []
        tasks = []

        customer_info = MockAIEngine.extract_customer_info(content)
        if customer_info.get("company") or customer_info.get("name"):
            customer_name = customer_info.get("company") or customer_info.get("name") or "未知客户"
            customers.append({
                "name": customer_name,
                "company": customer_info.get("company"),
                "level": "HIGH" if "预算" in content else "MEDIUM",
                "status": "ACTIVE",
                "summary": content,
            })

        project_info = MockAIEngine.extract_project_info(content)
        if project_info.get("project_name"):
            projects.append({
                "name": project_info["project_name"],
                "description": content,
                "budget": project_info.get("budget"),
                "status": "LEAD",
            })

        has_task_keywords = any(kw in content for kw in ["明天", "后天", "下周", "周一", "周二", "周三", "周四", "周五", "发方案", "报价", "回访", "开会"])
        if has_task_keywords:
            due_date = MockAIEngine.extract_date_info(content)
            tasks.append({
                "title": MockAIEngine.extract_task_title(content),
                "description": content,
                "priority": "HIGH" if "明天" in content else "MEDIUM",
                "due_date": due_date.isoformat() if due_date else None,
            })

        return {
            "customers": customers,
            "contacts": contacts,
            "projects": projects,
            "tasks": tasks,
        }


class AnalyzeRequest(BaseModel):
    content: str = Field(..., description="用户输入内容")


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_content(request: AnalyzeRequest = Body(...), db: Session = Depends(get_db)):
    content = request.content
    analysis = MockAIEngine.analyze(content)

    matched_customer = None
    if analysis["customers"]:
        customer_name = analysis["customers"][0]["name"]
        db_customer = db.query(Customer).filter(Customer.name == customer_name).first()
        if db_customer:
            matched_customer = {
                "id": db_customer.id,
                "name": db_customer.name,
                "confidence": 1.0,
            }

    db_suggestion = AISuggestion(
        raw_content=content,
        suggestion_json=analysis,
    )
    db.add(db_suggestion)
    db.commit()
    db.refresh(db_suggestion)

    return {
        "suggestion_id": db_suggestion.id,
        "raw_content": content,
        "matched_customer": matched_customer,
        "customers": analysis["customers"],
        "contacts": analysis["contacts"],
        "projects": analysis["projects"],
        "tasks": analysis["tasks"],
    }


@router.post("/{suggestion_id}/confirm")
def confirm_suggestion(suggestion_id: str, request: ConfirmRequest, db: Session = Depends(get_db)):
    suggestion = db.query(AISuggestion).filter(AISuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if suggestion.status != "PENDING":
        raise HTTPException(status_code=400, detail="Suggestion is not pending")

    customer_id = None

    if request.customer:
        db_customer = db.query(Customer).filter(Customer.name == request.customer.name).first()
        if db_customer:
            customer_id = db_customer.id
            db_customer.level = request.customer.level
            db_customer.status = request.customer.status
            db_customer.summary = request.customer.summary
        else:
            from app.models.customer import CustomerLevel, CustomerStatus
            new_customer = Customer(
                name=request.customer.name,
                level=request.customer.level,
                status=request.customer.status,
                summary=request.customer.summary,
            )
            db.add(new_customer)
            db.commit()
            db.refresh(new_customer)
            customer_id = new_customer.id

    project_id = None
    if request.project and customer_id:
        from app.models.project import Project
        new_project = Project(
            customer_id=customer_id,
            name=request.project.name,
            description=request.project.description,
            budget=request.project.budget,
            status=request.project.status,
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        project_id = new_project.id

    if customer_id or project_id:
        from app.models.activity import Activity
        activity = Activity(
            customer_id=customer_id,
            project_id=project_id,
            source="capture",
            content=suggestion.raw_content,
            activity_date=datetime.now().date(),
        )
        db.add(activity)

        if customer_id:
            from app.models.customer_ai_summary import CustomerAISummary
            from .customer_ai_summary import AISummaryEngine
            
            db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if db_customer:
                summary_data = AISummaryEngine.generate_summary(db, db_customer)
                
                summary = db.query(CustomerAISummary).filter(CustomerAISummary.customer_id == customer_id).first()
                if summary:
                    for key, value in summary_data.items():
                        setattr(summary, key, value)
                    summary.last_generated_at = datetime.now()
                else:
                    summary = CustomerAISummary(
                        customer_id=customer_id,
                        **summary_data
                    )
                    db.add(summary)

    if request.tasks:
        from app.models.task import Task
        for task in request.tasks:
            due_date = None
            if task.due_date:
                due_date = datetime.fromisoformat(task.due_date).date()
            new_task = Task(
                title=task.title,
                description=task.description,
                status="TODO",
                priority=task.priority,
                due_date=due_date,
            )
            db.add(new_task)

    suggestion.status = "CONFIRMED"
    db.commit()

    return {"message": "Suggestions confirmed and created successfully"}