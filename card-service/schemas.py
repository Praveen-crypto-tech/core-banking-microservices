from pydantic import BaseModel
from typing import Optional

class CardCreate(BaseModel):
    account_id: int
    daily_limit: Optional[float] = 50000


class CardResponse(BaseModel):
    card_id: int
    card_number: str
    status: str

    class Config:
        from_attributes = True


class CardValidateRequest(BaseModel):
    card_number: str
    amount: float
