import requests

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PAIMANA Pulse"

def test_dashboard_kpis():
    res = requests.get(f"{BASE_URL}/api/dashboard/kpis")
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] >= 500
    assert data["high_risk_projects"] > 0
    assert data["cost_at_risk_cr"] > 0

def test_what_changed():
    res = requests.get(f"{BASE_URL}/api/dashboard/what-changed")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

def test_hero_project_pulse():
    res = requests.get(f"{BASE_URL}/api/projects/P10291")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "P10291"
    assert data["current_risk_score"] == 82
    assert data["risk_category"] == "High Risk"
    assert data["physical_progress_pct"] == 48.0
    assert data["progress_lag_pct"] == 17.0
    assert data["early_warning_flag"] is True
    assert len(data["drivers"]) >= 3
    assert len(data["history"]) >= 4

def test_interventions():
    res = requests.get(f"{BASE_URL}/api/interventions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 12

def test_simulation_workflow():
    payload = {
        "project_id": "P10291",
        "intervention_ids": ["INT_001", "INT_002"]
    }
    res = requests.post(f"{BASE_URL}/api/simulations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["project_id"] == "P10291"
    assert data["baseline"]["risk_score"] == 82
    assert data["simulated"]["risk_score"] < 82
    assert data["risk_reduction_points"] > 0
    assert data["time_saved_months"] > 0
    assert data["cost_avoided_cr"] > 0
    assert len(data["comparisons"]) >= 3

def test_optimization_workflow():
    payload = {
        "project_id": "P10291",
        "available_budget_cr": 100.0,
        "available_manpower": 50,
        "priority_level": "High"
    }
    res = requests.post(f"{BASE_URL}/api/optimization/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommended_interventions"]) > 0
    assert data["total_cost_cr"] <= 100.0
    assert data["total_manpower"] <= 50
    assert data["expected_risk_score"] < 82
    assert "Recommended" in data["explanation"]

def test_action_hub_and_actual_outcome():
    # 1. Create action
    create_payload = {
        "project_id": "P10291",
        "intervention_name": "Accelerate Land Acquisition & RoW SLA",
        "intervention_category": "Administrative",
        "expected_impact_summary": "District collector SLA mobilized",
        "deadline": "2026-11-30",
        "assigned_officer": "Project Monitoring Officer",
        "estimated_cost_cr": 35.0,
        "predicted_time_saving_months": 3.1,
        "predicted_cost_saving_cr": 35.0
    }
    res = requests.post(f"{BASE_URL}/api/actions", json=create_payload)
    assert res.status_code == 200
    action = res.json()
    action_id = action["id"]

    # 2. Advance status
    patch_res = requests.patch(
        f"{BASE_URL}/api/actions/{action_id}/status",
        json={"new_status": "In Progress", "comments": "Field teams deployed"}
    )
    assert patch_res.status_code == 200

    # 3. Record actual outcome (feedback loop)
    outcome_payload = {
        "actual_time_saving_months": 2.9,
        "actual_cost_saving_cr": 33.5,
        "actual_cost_cr": 34.0,
        "outcome_notes": "SLA concluded successfully with verified ground handover."
    }
    out_res = requests.post(f"{BASE_URL}/api/actions/{action_id}/outcome", json=outcome_payload)
    assert out_res.status_code == 200

def test_bottlenecks():
    res = requests.get(f"{BASE_URL}/api/bottlenecks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert any("Land Acquisition" in b["issue_name"] for b in data)

def test_assistant_query():
    # Query for hero project
    q_res = requests.post(
        f"{BASE_URL}/api/assistant/query",
        json={"query": "Why is P10291 high risk?", "project_id": "P10291"}
    )
    assert q_res.status_code == 200
    data = q_res.json()
    assert "82" in data["response"]
    assert "Progress Lag" in data["response"]

    # Systemic query
    q_sys = requests.post(
        f"{BASE_URL}/api/assistant/query",
        json={"query": "What are the systemic bottlenecks across projects?"}
    )
    assert q_sys.status_code == 200
    assert "recurring bottlenecks" in q_sys.json()["response"].lower()

def test_review_brief():
    res = requests.get(f"{BASE_URL}/api/reports/project/P10291")
    assert res.status_code == 200
    data = res.json()
    assert data["project_overview"]["project_id"] == "P10291"
    assert data["current_risk"]["composite_score"] == 82
    assert len(data["what_changed"]) >= 4

if __name__ == "__main__":
    print("Running PAIMANA Pulse automated test suite...")
    test_health()
    print("[PASS] Health check passed")
    test_dashboard_kpis()
    print("[PASS] Dashboard KPIs passed")
    test_what_changed()
    print("[PASS] What Changed panel passed")
    test_hero_project_pulse()
    print("[PASS] Hero project P10291 pulse passed")
    test_interventions()
    print("[PASS] Interventions library passed")
    test_simulation_workflow()
    print("[PASS] What-If simulation workflow passed")
    test_optimization_workflow()
    print("[PASS] Optimization engine passed")
    test_action_hub_and_actual_outcome()
    print("[PASS] Action Hub & Learning loop passed")
    test_bottlenecks()
    print("[PASS] Bottleneck engine passed")
    test_assistant_query()
    print("[PASS] Grounded Assistant passed")
    test_review_brief()
    print("[PASS] Review Brief generator passed")
    print("\nALL 11 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
