from datetime import datetime
from uuid import UUID
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class SuggestionStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class CustomerSuggestion(BaseModel):
    name: str = Field(..., description="客户名称")
    company: Optional[str] = Field(None, description="公司名称")
    level: str = Field("MEDIUM", description="客户等级 HIGH/MEDIUM/LOW")
    status: str = Field("ACTIVE", description="客户状态 ACTIVE/FOLLOWING/PAUSED/LOST")
    summary: Optional[str] = Field(None, description="客户摘要")
    next_action: Optional[str] = Field(None, description="下一步动作")
    next_action_date: Optional[str] = Field(None, description="下一步动作日期")


class TaskSuggestion(BaseModel):
    title: str = Field(..., description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    priority: str = Field("MEDIUM", description="优先级 HIGH/MEDIUM/LOW")
    due_date: Optional[str] = Field(None, description="截止日期")


class SuggestionJSON(BaseModel):
    customer_suggestions: List[CustomerSuggestion] = Field([], description="客户建议列表")
    task_suggestions: List[TaskSuggestion] = Field([], description="任务建议列表")


class AnalyzeRequest(BaseModel):
    content: str = Field(..., description="用户输入的原始内容")


class SuggestionCreate(BaseModel):
    raw_content: str
    suggestion_json: Optional[SuggestionJSON] = None


class SuggestionUpdate(BaseModel):
    status: SuggestionStatus


class SuggestionOut(BaseModel):
    id: UUID
    status: SuggestionStatus
    raw_content: str
    suggestion_json: Optional[SuggestionJSON] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyzeResponse(BaseModel):
    suggestion_id: UUID
    suggestions: SuggestionJSON