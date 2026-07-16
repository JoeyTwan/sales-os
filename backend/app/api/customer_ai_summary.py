from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, date, timedelta
from typing import Optional
import re

from ..database import get_db
from ..models.customer import Customer
from ..models.customer_ai_summary import CustomerAISummary
from ..models.project import Project
from ..models.activity import Activity
from ..schemas.customer_ai_summary import CustomerAISummaryOut, CustomerAISummaryRefreshResponse

router = APIRouter(prefix="/api/customers", tags=["customer_ai_summary"])


class AISummaryEngine:
    @staticmethod
    def generate_summary(db: Session, customer: Customer) -> dict:
        content = customer.summary or ""
        
        projects = db.query(Project).filter(Project.customer_id == customer.id).order_by(desc(Project.created_at)).all()
        activities = db.query(Activity).filter(Activity.customer_id == customer.id).order_by(desc(Activity.activity_date)).all()
        
        all_content = content
        last_activity_content = ""
        for activity in activities:
            all_content += "\n" + activity.content
            if not last_activity_content:
                last_activity_content = activity.content
        
        stage = AISummaryEngine._extract_stage(projects, all_content)
        budget = AISummaryEngine._extract_budget(projects, all_content)
        decision_maker = AISummaryEngine._extract_decision_maker(all_content)
        risk = AISummaryEngine._extract_risk(all_content)
        next_action = AISummaryEngine._extract_next_action(customer, all_content)
        estimated_close_date = AISummaryEngine._extract_close_date(all_content)
        confidence = AISummaryEngine._calculate_confidence(stage, budget, decision_maker, next_action)
        last_activity_summary = AISummaryEngine._generate_activity_summary(last_activity_content, customer.name)
        
        return {
            "stage": stage,
            "budget": budget,
            "decision_maker": decision_maker,
            "risk": risk,
            "next_action": next_action,
            "estimated_close_date": estimated_close_date,
            "confidence": confidence,
            "last_activity_summary": last_activity_summary,
        }
    
    @staticmethod
    def _extract_stage(projects, content: str) -> str:
        if projects:
            stage_map = {
                "LEAD": "线索阶段",
                "QUALIFIED": "确认阶段",
                "PROPOSAL": "方案阶段",
                "NEGOTIATION": "谈判阶段",
                "WON": "已成交",
                "LOST": "已流失",
            }
            return stage_map.get(projects[0].status, "线索阶段")
        
        if "方案" in content or "报价" in content:
            return "方案阶段"
        if "谈判" in content or "价格" in content:
            return "谈判阶段"
        if "签约" in content or "成交" in content:
            return "谈判阶段"
        return "线索阶段"
    
    @staticmethod
    def _extract_budget(projects, content: str) -> str:
        if projects and projects[0].budget:
            b = projects[0].budget
            if b >= 10000:
                return f"{b // 10000}万"
            return f"{b}元"
        
        budget_match = re.search(r"预算\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(万?)", content)
        if budget_match:
            amount = float(budget_match.group(1))
            unit = budget_match.group(2) or ""
            if unit == "万":
                return f"{amount}万"
            if amount >= 10000:
                return f"{amount // 10000}万"
            return f"{amount}元"
        
        return ""
    
    @staticmethod
    def _extract_decision_maker(content: str) -> str:
        patterns = [
            r"([张王李赵刘陈杨黄周吴徐孙马朱胡郭何罗高林]{1,2})(?:总|经理|总监|负责人|决策)",
            r"负责决策\s*的\s*([张王李赵刘陈杨黄周吴徐孙马朱胡郭何罗高林]{1,2})",
            r"([张王李赵刘陈杨黄周吴徐孙马朱胡郭何罗高林]{1,2})负责",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                name = match.group(1)
                if len(name) <= 2:
                    return f"{name}总"
        
        return ""
    
    @staticmethod
    def _extract_risk(content: str) -> str:
        risks = []
        
        if "犹豫" in content or "考虑" in content or "再看看" in content:
            risks.append("客户决策犹豫")
        if "价格" in content and ("高" in content or "贵" in content):
            risks.append("价格敏感")
        if "预算" in content and ("不确定" in content or "未确认" in content or "待定" in content):
            risks.append("预算尚未最终确认")
        if "竞争对手" in content or "竞品" in content or "其他供应商" in content:
            risks.append("存在竞争对手")
        
        return "；".join(risks) if risks else ""
    
    @staticmethod
    def _extract_next_action(customer, content: str) -> str:
        if customer.next_action:
            return customer.next_action
        
        if "发方案" in content or "发送方案" in content:
            return "发送方案"
        if "报价" in content:
            return "发送报价"
        if "拜访" in content:
            return "跟进拜访"
        if "签约" in content or "合同" in content:
            return "准备签约"
        if "会议" in content:
            return "安排会议"
        if "演示" in content or "demo" in content:
            return "产品演示"
        
        return ""
    
    @staticmethod
    def _extract_close_date(content: str) -> Optional[date]:
        date_match = re.search(r"预计(\d+)月(\d+)日签约", content)
        if date_match:
            month = int(date_match.group(1))
            day = int(date_match.group(2))
            today = datetime.today()
            try:
                return date(today.year, month, day)
            except ValueError:
                pass
        
        if "月底" in content:
            today = datetime.today()
            last_day = (datetime(today.year, today.month % 12 + 1, 1) - timedelta(days=1)).day
            return date(today.year, today.month, last_day)
        
        return None
    
    @staticmethod
    def _calculate_confidence(stage: str, budget: str, decision_maker: str, next_action: str) -> int:
        score = 0
        
        if stage:
            stage_scores = {
                "线索阶段": 20,
                "确认阶段": 40,
                "方案阶段": 60,
                "谈判阶段": 80,
                "已成交": 100,
                "已流失": 0,
            }
            score += stage_scores.get(stage, 20)
        
        if budget:
            score += 20
        
        if decision_maker:
            score += 20
        
        if next_action:
            score += 20
        
        return min(score, 100)
    
    @staticmethod
    def _generate_activity_summary(content: str, customer_name: str) -> str:
        if not content:
            return ""
        
        summary = content.strip()
        
        if len(summary) <= 150:
            return summary
        
        return summary[:150] + "..."


@router.get("/{customer_id}/ai-summary", response_model=CustomerAISummaryOut)
def get_customer_ai_summary(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    summary = db.query(CustomerAISummary).filter(CustomerAISummary.customer_id == customer_id).first()
    
    if not summary:
        summary_data = AISummaryEngine.generate_summary(db, customer)
        summary = CustomerAISummary(
            customer_id=customer_id,
            **summary_data
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
    
    return summary


@router.post("/{customer_id}/ai-summary/refresh", response_model=CustomerAISummaryRefreshResponse)
def refresh_customer_ai_summary(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    summary_data = AISummaryEngine.generate_summary(db, customer)
    
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
    
    db.commit()
    db.refresh(summary)
    
    return {"success": True, "summary": summary}