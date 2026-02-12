# 🏦 CoreBank – Enterprise Core Banking Microservices Platform

A production-style **Core Banking System** built using **Microservices Architecture**, inspired by real enterprise banking platforms like TCS BaNCS.

This project simulates how modern banks manage:

* Customers
* Accounts
* Transactions
* Ledger
* Loans
* Cards
* Fraud Detection
* Complaints
* Real-time Analytics Dashboard (Power BI)

Built with scalability, service isolation, and real-time reporting in mind.

---

## 🚀 Architecture Overview

```
Frontend (React + Tailwind)
        ↓
API Gateway (FastAPI)
        ↓
-----------------------------------------
| Customer Service   | Account Service   |
| Transaction Service| Ledger Service    |
| Card Service       | Loan Service      |
| Fraud Service      | Complaint Service |
-----------------------------------------
        ↓
MySQL (separate DB per service)
        ↓
Power BI Dashboard (Live Analytics)
```

---

## 🧩 Microservices

| Service             | Port | Responsibility           |
| ------------------- | ---- | ------------------------ |
| Customer Service    | 8000 | Manage customers (CIF)   |
| Account Service     | 8001 | Bank accounts            |
| Transaction Service | 8002 | Money transfers          |
| Ledger Service      | 8003 | Double-entry accounting  |
| Card Service        | 8004 | Debit/Credit cards       |
| Complaint Service   | 8005 | Support tickets          |
| Loan Service        | 8006 | Loans & EMI              |
| Fraud Service       | 8007 | Fraud alerts             |
| API Gateway         | 8080 | Routing + Dashboard APIs |

---

## 🛠 Tech Stack

### Backend

* FastAPI
* Python
* MySQL
* REST APIs
* Microservices Architecture

### Frontend

* React (TypeScript)
* TailwindCSS
* ShadCN UI

### Analytics

* Power BI (Real-time dashboards)

### Dev Tools

* Git
* Postman
* VS Code

---

## ✨ Features

### Core Banking

✔ Customer onboarding
✔ Account creation
✔ Fund transfers
✔ Ledger entries
✔ Loan management
✔ Card issuing & validation
✔ Fraud alerts
✔ Complaint handling

### Dashboard

✔ Real-time KPIs
✔ Active accounts
✔ Transaction volume
✔ Loans outstanding
✔ Fraud alerts
✔ Complaints

### Engineering

✔ Service isolation
✔ Separate DB per service
✔ API Gateway pattern
✔ Scalable design
✔ Clean UI theme system

---

## ⚙️ Setup Instructions

### 1️⃣ Clone repo

```
git clone https://github.com/Praveen-crypto-tech/core-banking-microservices.git
cd core-banking-microservices
```

---

### 2️⃣ Install dependencies (each service)

Example:

```
cd customer-service
pip install -r requirements.txt
```

Repeat for all services.

---

### 3️⃣ Start services

Run each:

```
uvicorn main:app --port 8000 --reload
```

Change port per service.

API Gateway:

```
uvicorn main:app --port 8080 --reload
```

---

### 4️⃣ Start Frontend

```
npm install
npm run dev
```

---

### 5️⃣ Open Dashboard

```
http://localhost:5173
```

---

## 📊 Power BI

The system connects directly to MySQL databases to generate:

* Real-time KPIs
* Transaction trends
* Loan performance
* Fraud monitoring
* Operational metrics

Refresh enabled for live analytics.

---

## 📁 Folder Structure

```
core-banking/
 ├── api-gateway
 ├── customer-service
 ├── account-service
 ├── transaction-service
 ├── ledger-service
 ├── card-service
 ├── loan-service
 ├── fraud-service
 ├── complaint-service
 
```

---

## 🎯 Design Goals

* Simulate real banking architecture
* Learn distributed systems
* Practice scalable backend design
* Build analytics-driven dashboards
* Portfolio-grade enterprise project

---

## 📌 Future Improvements

* Docker containerization
* Kubernetes deployment
* JWT authentication
* Service discovery
* Event-driven messaging (Kafka/RabbitMQ)
* CI/CD pipeline
* Cloud deployment (AWS/Azure)

---

## 👨‍💻 Author

**Praveen J**

Information Technology Student
Focused on Data Science, Backend Engineering & Financial Systems

GitHub: https://github.com/Praveen-crypto-tech

---

## 📜 License

Educational / Learning Purpose
