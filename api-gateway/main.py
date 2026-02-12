from fastapi import FastAPI, Request, HTTPException
import requests
from fastapi.middleware.cors import CORSMiddleware
from routes import dashboard


app = FastAPI(title="Core Banking API Gateway")

app.include_router(dashboard.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# SERVICE ROUTES
# -------------------------------
SERVICES = {
    "customer": "http://127.0.0.1:8000",
    "account": "http://127.0.0.1:8001",
    "transaction": "http://127.0.0.1:8002",
    "ledger": "http://127.0.0.1:8003",
    "card": "http://127.0.0.1:8004",
    "complaint": "http://127.0.0.1:8005",
    "loan": "http://127.0.0.1:8006",
    "fraud": "http://127.0.0.1:8007"
}

# -------------------------------
# GENERIC PROXY HANDLER
# -------------------------------
@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")

    url = f"{SERVICES[service]}/{path}"

    try:
        response = requests.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items() if k != "host"},
            params=request.query_params,
            json=await request.json() if request.method in ["POST", "PUT"] else None,
            timeout=10
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Service unavailable")

    return response.json()

@app.get("/dashboard/overview")
def dashboard_overview():
    try:
        total_customers = requests.get(f"{SERVICES['customer']}/customers/count").json()["count"]
        active_accounts = requests.get(f"{SERVICES['account']}/accounts/active/count").json()["count"]
        todays_transactions = requests.get(f"{SERVICES['transaction']}/transactions/today/count").json()["count"]
        active_loans = requests.get(f"{SERVICES['loan']}/loans/active/count").json()["count"]
        cards_issued = requests.get(f"{SERVICES['card']}/cards/count").json()["count"]
        fraud_alerts = requests.get(f"{SERVICES['fraud']}/fraud/alerts/open/count").json()["count"]
        open_complaints = requests.get(f"{SERVICES['complaint']}/complaints/open/count").json()["count"]
    except Exception:
        raise HTTPException(status_code=503, detail="Dashboard services unavailable")

    return {
        "total_customers": total_customers,
        "active_accounts": active_accounts,
        "todays_transactions": todays_transactions,
        "active_loans": active_loans,
        "cards_issued": cards_issued,
        "fraud_alerts": fraud_alerts,
        "open_complaints": open_complaints
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "API_GATEWAY"
    }
