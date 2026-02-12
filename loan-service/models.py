from sqlalchemy import Column, Integer, String, Date, DECIMAL, ForeignKey, BigInteger
from database import Base

class Loan(Base):
    __tablename__ = "loans"

    loan_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    branch_id = Column(Integer, nullable=False)

    account_id = Column(BigInteger, nullable=False)  # 🔥 FIXED

    loan_type = Column(String(50), nullable=False)
    principal_amount = Column(DECIMAL(15,2), nullable=False)
    interest_rate = Column(DECIMAL(5,2), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    emi_amount = Column(DECIMAL(15,2), nullable=False)

    loan_status = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)


class EMISchedule(Base):
    __tablename__ = "emi_schedule"

    emi_id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.loan_id"), nullable=False)

    emi_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)

    emi_amount = Column(DECIMAL(15,2), nullable=False)
    principal_component = Column(DECIMAL(15,2), nullable=False)
    interest_component = Column(DECIMAL(15,2), nullable=False)

    status = Column(String(20), nullable=False)
    paid_date = Column(Date)

    overdue_days = Column(Integer, default=0)        # 🔥 FIX
    penalty_amount = Column(DECIMAL(15,2), default=0)  # 🔥 FIX
