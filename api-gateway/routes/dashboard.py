from fastapi import APIRouter
import requests
import mysql.connector
from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

SERVICES = {
    "total_customers": "http://127.0.0.1:8000/customers/count",
    "active_accounts": "http://127.0.0.1:8001/accounts/count",
    "todays_transactions": "http://127.0.0.1:8002/transactions/today/count",
    "active_loans": "http://127.0.0.1:8006/loans/active/count",
    "cards_issued": "http://127.0.0.1:8004/cards/count",
    "fraud_alerts": "http://127.0.0.1:8007/alerts/open/count",
    "open_complaints": "http://127.0.0.1:8005/complaints/count"
}

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="dashboard_user",
        password="Dashboard@123"
    )



def safe_count(url: str):
    try:
        r = requests.get(url, timeout=3)
        if r.status_code != 200:
            return 0

        data = r.json()

        # Case 1: plain list
        if isinstance(data, list):
            return len(data)

        # Case 2: wrapped list under common keys
        if isinstance(data, dict):
            for key in ["data", "items", "customers", "accounts", "transactions", "loans", "cards", "alerts", "complaints"]:
                if key in data and isinstance(data[key], list):
                    return len(data[key])

            # Case 3: backend already gives count
            for key in ["total", "count"]:
                if key in data and isinstance(data[key], int):
                    return data[key]

    except Exception:
        pass

    return 0


@router.get("/overview")
def dashboard_overview():
    db = get_db()
    cursor = db.cursor()

    # Total customers
    cursor.execute("SELECT COUNT(*) FROM customer_db.customers")
    total_customers = cursor.fetchone()[0]

    # Active accounts
    cursor.execute("""
        SELECT COUNT(*) 
        FROM account_db.accounts 
        WHERE status = 'ACTIVE'
    """)
    active_accounts = cursor.fetchone()[0]

    # Today's transactions
    cursor.execute("""
        SELECT COUNT(*) 
        FROM transaction_db.transactions
        WHERE created_at >= CURDATE()
          AND created_at < CURDATE() + INTERVAL 1 DAY
    """)
    todays_transactions = cursor.fetchone()[0]

    # Active loans
    cursor.execute("""
        SELECT COUNT(*) 
        FROM loan_db.loans
        WHERE loan_status = 'ACTIVE'
    """)
    active_loans = cursor.fetchone()[0]

    # Cards issued
    cursor.execute("SELECT COUNT(*) FROM card_db.cards")
    cards_issued = cursor.fetchone()[0]

    # Fraud alerts
    cursor.execute("""
        SELECT COUNT(*) 
        FROM fraud_db.fraud_alerts
        WHERE fraud_flag = 1
    """)
    fraud_alerts = cursor.fetchone()[0]

    # Open complaints
    cursor.execute("""
        SELECT COUNT(*) 
        FROM complaint_db.complaints
        WHERE status = 'OPEN'
    """)
    open_complaints = cursor.fetchone()[0]

    cursor.close()
    db.close()

    return {
        "total_customers": total_customers,
        "active_accounts": active_accounts,
        "todays_transactions": todays_transactions,
        "active_loans": active_loans,
        "cards_issued": cards_issued,
        "fraud_alerts": fraud_alerts,
        "open_complaints": open_complaints
    }
