from pydantic import BaseModel
from typing import Literal

class LedgerRequest(BaseModel):
    reference_id: int

    debit_account_id: int
    credit_account_id: int

    debit_customer_id: int
    credit_customer_id: int

    debit_branch_id: int
    credit_branch_id: int

    amount: float
    narration: str
