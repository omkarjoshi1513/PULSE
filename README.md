# PAIMANA Pulse

> **"From project monitoring to proactive intervention."**

**Smart India Hackathon 2026 Prototype Submission**  
- **Problem Statement ID**: 26103  
- **Problem Statement**: *"Use case on web-based integrated project-monitoring platform"*  
- **Organization**: Ministry of Statistics and Programme Implementation (MoSPI)  
- **Department**: Data Informatics & Innovation Division (DIID)  
- **Theme**: Smart Automation | **Category**: Software  

---

## 1. Product Philosophy & Core Identity

PAIMANA tells decision-makers *what happened*.  
**PAIMANA Pulse** tells them:

$$\text{WHAT CHANGED} \longrightarrow \text{WHY} \longrightarrow \text{WHAT HAPPENS NEXT} \longrightarrow \text{WHAT SHOULD WE DO} \longrightarrow \text{WHAT HAPPENED AFTER WE ACTED}$$

The operational workflow implemented across the platform is:
```
DETECT ──► DIAGNOSE ──► PREDICT ──► SIMULATE ──► ACT ──► LEARN
```

PAIMANA Pulse is an **intelligence and decision-support layer** designed to sit directly on top of the central PAIMANA infrastructure monitoring system. It keeps **human officers in control** of all statutory and fiscal choices while delivering interpretable machine learning, constraint-based optimization, and closed-loop feedback learning.

---

## 2. Quick Start (Starts with One Command)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### One-Command Startup
On Windows, simply run:
```cmd
start.bat
```
Or via Python:
```bash
python run_app.py
```

This single command:
1. Verifies the SQLite relational database (auto-seeding 520 realistic infrastructure projects, 12 interventions, 5 systemic bottlenecks, and temporal updates if not present).
2. Starts the **FastAPI backend** on `http://127.0.0.1:8000` (API documentation live at `http://127.0.0.1:8000/docs`).
3. Starts the **Vite React frontend** on `http://localhost:5173`.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Responsive Container Tables.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0.
- **Database**: SQLite (out-of-the-box zero-configuration default) / PostgreSQL compatible.
- **Machine Learning & Attribution**: scikit-learn, XGBoost / Gradient Boosting Regressors, SHAP-inspired explainability attributions.
- **Optimization**: Combinatorial Multi-Criteria Knapsack / Linear Solver (OR-Tools architecture) with sub-additive diminishing return modeling.
- **Grounded Assistant**: Direct database retrieval engine with zero-hallucination guarantee + Ollama local model hook.
- **Deployment**: Docker, Docker Compose, Nginx reverse proxy.

---

## 4. End-to-End Judge Demonstration Walkthrough

Follow this exact 14-step user journey:

| Step | Action | What to Observe |
|---|---|---|
| **Step 1** | Open **Command Center** (`http://localhost:5173`) | See portfolio context (1,981 projects, ₹37.13L Cr original vs ₹42.78L Cr revised), KPI cards, Sector/State risk heatmap, Risk trend chart, and "What Changed This Month" alerts. |
| **Step 2** | Click **"Diagnose"** on Hero Project **`P10291`** | Opens **Project Pulse**. Observe prominent risk score: **82/100 HIGH RISK** with trajectory: **54 → 79 → 82**. |
| **Step 3** | Inspect Section B **"What Changed?"** | Early Warning Detected: Progress Lag (+12.0%), Clearance Delay (+2.0 mo), Expenditure Burn (+8% monthly burn rate), Land Acquisition (-7% RoW access). |
| **Step 4** | Inspect Section C **"Why is it risky?"** | SHAP horizontal bar chart displaying top risk drivers: Progress Lag (+28.5 pts), Land Acquisition (+22.0 pts), Burn Rate (+16.8 pts). Click on any bar to view expected vs observed values. |
| **Step 5** | Inspect Section D **"Predictions"** | Cost Overrun Prob: 74% (₹126 Cr), Time Overrun Prob: 81% (8.2 months delay), 90% Confidence Interval: [6.5 - 10.2 mo]. |
| **Step 6** | Click **"Intervention Cockpit"** | Opens the Hero decision workspace. Note baseline **"DO NOTHING"** card (Risk: 82, Delay: 8.2 mo, Cost: ₹126 Cr). |
| **Step 7** | Toggle Interventions | Click *"Accelerate Land Acquisition"* and *"Increase Fund Release"*. Observe What-If simulation: Risk drops to **52 (-30 pts)**, Delay reduced to **3.9 mo (4.3 mo saved)**, **₹67 Cr avoided**. |
| **Step 8** | Test Constraints & Optimization | In the Optimization card, set Budget Cap to **₹100 Cr** and Manpower to **50**. Click **"Identify Feasible Package"**. |
| **Step 9** | Review Recommendation | The solver recommends the optimal combination under budget, explaining *why* it was selected without claiming "AI decided". |
| **Step 10** | Click **"Approve & Forward to Action Hub"** | Human officer authorization creates an auditable record in the Action Hub. |
| **Step 11** | Open **Action Hub** | Track lifecycle transitions: `Recommended → Approved → In Progress → Completed`. Inspect chronological audit stamps (e.g. 09:32, 10:04, 10:07). |
| **Step 12** | Inspect **Actual vs Predicted (Learn)** | View feedback loop comparison: Predicted time saving (5.0 mo) vs Actual ground telemetry (3.8 mo), Predicted cost saving (₹40 Cr) vs Actual (₹34 Cr) with calculated variance. |
| **Step 13** | Open **Bottlenecks** | See recurring systemic patterns: *Land Acquisition* (23 projects, 4.7 mo delay), *Statutory Clearances* (19 projects), *Utility Shifting* (15 projects). Click to view affected projects. |
| **Step 14** | Open **Pulse Assistant** | Click the quick prompt: *"Why is P10291 high risk?"*. The assistant answers directly from database records without hallucinating. |

---

## 5. Verification & Test Suite

Run the automated test suite verifying all REST endpoints, models, simulations, and optimization:
```bash
python tests/test_api.py
```
**Output**:
```
Running PAIMANA Pulse automated test suite...
[PASS] Health check passed
[PASS] Dashboard KPIs passed
[PASS] What Changed panel passed
[PASS] Hero project P10291 pulse passed
[PASS] Interventions library passed
[PASS] What-If simulation workflow passed
[PASS] Optimization engine passed
[PASS] Action Hub & Learning loop passed
[PASS] Bottleneck engine passed
[PASS] Grounded Assistant passed
[PASS] Review Brief generator passed

ALL 11 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS RATE)
```

---

## 6. SIH 2026 Compliance Highlights

1. **Human-in-the-Loop Governance**: Interventions remain strictly advisory until approved by a human officer.
2. **Transparent Explainability**: SHAP attribution values show exact feature impacts rather than black-box outputs.
3. **Simulation vs Causal Proof**: What-if outcomes are clearly disclaimed as model projections under specified assumptions.
4. **Data Grounding**: The assistant answers solely from verified project records, avoiding hallucination.
5. **Operational UI Aesthetic**: Clean, modern government technology aesthetic (deep navy, slate, accessible indicators) avoiding generic AI gimmicks.
