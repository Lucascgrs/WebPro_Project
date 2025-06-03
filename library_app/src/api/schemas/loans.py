from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LoanBase(BaseModel):
    user_id: int = Field(..., description="ID de l'utilisateur")
    book_id: int = Field(..., description="ID du livre")
    loan_date: datetime = Field(default_factory=datetime.utcnow, description="Date d'emprunt")
    return_date: Optional[datetime] = Field(None, description="Date de retour")
    due_date: datetime = Field(..., description="Date d'échéance")


class LoanCreate(LoanBase):
    pass


class LoanUpdate(BaseModel):
    return_date: Optional[datetime] = Field(None, description="Date de retour")
    due_date: Optional[datetime] = Field(None, description="Date d'échéance")


class LoanInDBBase(LoanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Loan(LoanInDBBase):
    pass