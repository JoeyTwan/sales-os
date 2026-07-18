from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    success: bool
    data: Optional[dict] = None

    @classmethod
    def success(cls, data: dict = None):
        return cls(success=True, data=data)

    @classmethod
    def error(cls, message: str):
        return cls(success=False, data={"message": message})
