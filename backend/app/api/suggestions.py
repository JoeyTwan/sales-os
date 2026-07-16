import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.suggestion import AISuggestion, SuggestionStatus
from app.models.customer import Customer, CustomerLevel, CustomerStatus
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.suggestion import (
    AnalyzeRequest,
    AnalyzeResponse,
    SuggestionOut,
    SuggestionUpdate,
    SuggestionJSON,
    CustomerSuggestion,
    TaskSuggestion,
)

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


class MockAIEngine:
    @staticmethod
    def extract_customer_info(content: str):
        patterns = {
            "company": [r"拜访了(.+?)[，,]", r"(.+?)公司", r"(.+?)科技", r"(.+?)电子"],
            "name": [r"联系(.+?)[，,]", r"见(.+?)[，,]", r"与(.+?)沟通"],
            "budget": [r"预算(.+?)[万,元]"],
        }
        
        company = None
        name = None
        budget = None
        
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, content)
                if match:
                    if key == "company":
                        company = match.group(1).strip()
                    elif key == "name":
                        name = match.group(1).strip()
                    elif key == "budget":
                        budget = match.group(1).strip()
                    break
        
        return {"company": company, "name": name, "budget": budget}

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
    def analyze(content: str) -> SuggestionJSON:
        customer_suggestions = []
        task_suggestions = []
        
        customer_keywords = ["客户", "公司", "预算", "拜访", "客户名称", "联系人"]
        task_keywords = ["明天", "下周", "周一", "周二", "周三", "周四", "周五", "周六", "周日", "发方案", "提交", "跟进"]
        
        has_customer_info = any(keyword in content for keyword in customer_keywords)
        has_task_info = any(keyword in content for keyword in task_keywords)
        
        if has_customer_info:
            info = MockAIEngine.extract_customer_info(content)
            customer_name = info.get("company") or info.get("name") or "未知客户"
            customer_suggestions.append(
                CustomerSuggestion(
                    name=customer_name,
                    company=info.get("company"),
                    level="HIGH" if info.get("budget") else "MEDIUM",
                    status="ACTIVE",
                    summary=content,
                )
            )
        
        if has_task_info:
            due_date = MockAIEngine.extract_date_info(content)
            task_suggestions.append(
                TaskSuggestion(
                    title=content,
                    description=content,
                    priority="HIGH" if "明天" in content else "MEDIUM",
                    due_date=due_date.isoformat() if due_date else None,
                )
            )
        
        return SuggestionJSON(
            customer_suggestions=customer_suggestions,
            task_suggestions=task_suggestions,
        )


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_content(request: AnalyzeRequest, db: Session = Depends(get_db)):
    suggestions = MockAIEngine.analyze(request.content)
    
    db_suggestion = AISuggestion(
        raw_content=request.content,
        suggestion_json=suggestions.model_dump(),
    )
    db.add(db_suggestion)
    db.commit()
    db.refresh(db_suggestion)
    
    return AnalyzeResponse(
        suggestion_id=db_suggestion.id,
        suggestions=suggestions,
    )


@router.get("", response_model=list[SuggestionOut])
def get_suggestions(status: str = None, db: Session = Depends(get_db)):
    query = db.query(AISuggestion)
    if status:
        query = query.filter(AISuggestion.status == status)
    suggestions = query.order_by(AISuggestion.created_at.desc()).all()
    return suggestions


@router.get("/{suggestion_id}", response_model=SuggestionOut)
def get_suggestion(suggestion_id: str, db: Session = Depends(get_db)):
    suggestion = db.query(AISuggestion).filter(AISuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return suggestion


@router.patch("/{suggestion_id}", response_model=SuggestionOut)
def update_suggestion(suggestion_id: str, request: SuggestionUpdate, db: Session = Depends(get_db)):
    suggestion = db.query(AISuggestion).filter(AISuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = request.status.value
    db.commit()
    db.refresh(suggestion)
    return suggestion


@router.post("/{suggestion_id}/confirm")
def confirm_suggestion(suggestion_id: str, db: Session = Depends(get_db)):
    suggestion = db.query(AISuggestion).filter(AISuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    if suggestion.status != "PENDING":
        raise HTTPException(status_code=400, detail="Suggestion is not pending")
    
    suggestion_json = suggestion.suggestion_json
    if not suggestion_json:
        raise HTTPException(status_code=400, detail="No suggestions to confirm")
    
    for customer_suggestion in suggestion_json.get("customer_suggestions", []):
        db_customer = Customer(
            name=customer_suggestion["name"],
            level=CustomerLevel(customer_suggestion.get("level", "MEDIUM")),
            status=CustomerStatus(customer_suggestion.get("status", "ACTIVE")),
            summary=customer_suggestion.get("summary"),
            next_action=customer_suggestion.get("next_action"),
            next_action_date=customer_suggestion.get("next_action_date"),
        )
        db.add(db_customer)
    
    for task_suggestion in suggestion_json.get("task_suggestions", []):
        db_task = Task(
            title=task_suggestion["title"],
            description=task_suggestion.get("description"),
            status=TaskStatus("TODO"),
            priority=TaskPriority(task_suggestion.get("priority", "MEDIUM")),
            due_date=task_suggestion.get("due_date"),
        )
        db.add(db_task)
    
    suggestion.status = "CONFIRMED"
    db.commit()
    
    return {"message": "Suggestions confirmed and created successfully"}