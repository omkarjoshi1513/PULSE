import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import (
    Project, Intervention, Action, ActionUpdate, Bottleneck, AuditLog, User
)
from backend.app.schemas.schemas import (
    PortfolioKPISchema, HeatmapCell, WhatChangedItem, ProjectSummary, ProjectDetail,
    InterventionSchema, SimulationRequest, SimulationResponse,
    OptimizationRequest, OptimizationResponse,
    ActionDetail, ActionCreate, ActionStatusUpdate, ActualOutcomeRecord,
    BottleneckSchema, AssistantQueryRequest, AssistantQueryResponse,
    ReviewBriefResponse
)
from backend.app.services.project_service import project_service
from backend.app.services.simulation_engine import simulation_engine
from backend.app.services.optimization_engine import optimization_engine
from backend.app.services.assistant_engine import assistant_engine
from backend.app.services.report_generator import report_generator
from backend.app.ml.pipeline import ml_pipeline

router = APIRouter()

# ----------------- DASHBOARD / COMMAND CENTER -----------------
@router.get("/dashboard/kpis", response_model=PortfolioKPISchema)
def get_dashboard_kpis(db: Session = Depends(get_db)):
    return project_service.get_portfolio_kpis(db)

@router.get("/dashboard/heatmap", response_model=List[HeatmapCell])
def get_dashboard_heatmap(
    ministry: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return project_service.get_heatmap_data(db, ministry, sector, state)

@router.get("/dashboard/what-changed", response_model=List[WhatChangedItem])
def get_dashboard_what_changed(db: Session = Depends(get_db)):
    return project_service.get_what_changed_summary(db)

# ----------------- PROJECTS -----------------
@router.get("/projects", response_model=List[ProjectSummary])
def get_projects(
    search: Optional[str] = Query(None),
    ministry: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    return project_service.get_projects(db, search, ministry, sector, state, risk_category, status, limit, offset)

@router.get("/projects/{project_id}", response_model=ProjectDetail)
def get_project_detail(project_id: str, db: Session = Depends(get_db)):
    try:
        # Audit log viewing
        log = AuditLog(
            user_name="Dr. Vikram Sharma",
            user_role="MONITORING_OFFICER",
            action_type="PROJECT_VIEWED",
            entity_type="Project",
            entity_id=project_id,
            details="Opened Project Pulse view"
        )
        db.add(log)
        db.commit()
        return project_service.get_project_detail(db, project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------- INTERVENTIONS & SIMULATION -----------------
@router.get("/interventions", response_model=List[InterventionSchema])
def get_interventions(db: Session = Depends(get_db)):
    items = db.query(Intervention).all()
    return [InterventionSchema.model_validate(i) for i in items]

@router.post("/simulations", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    try:
        # Audit simulation
        log = AuditLog(
            user_name="Dr. Vikram Sharma",
            user_role="MONITORING_OFFICER",
            action_type="SIMULATION_EXECUTED",
            entity_type="Project",
            entity_id=req.project_id,
            details=f"Simulated {len(req.intervention_ids)} interventions: {', '.join(req.intervention_ids)}"
        )
        db.add(log)
        db.commit()
        return simulation_engine.simulate(db, req.project_id, req.intervention_ids)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------- OPTIMIZATION -----------------
@router.post("/optimization/recommend", response_model=OptimizationResponse)
def run_optimization(req: OptimizationRequest, db: Session = Depends(get_db)):
    try:
        log = AuditLog(
            user_name="Dr. Vikram Sharma",
            user_role="MONITORING_OFFICER",
            action_type="RECOMMENDATION_GENERATED",
            entity_type="Project",
            entity_id=req.project_id,
            details=f"Ran optimization with budget=₹{req.available_budget_cr}Cr, manpower={req.available_manpower}"
        )
        db.add(log)
        db.commit()
        return optimization_engine.optimize(
            db,
            req.project_id,
            req.available_budget_cr,
            req.available_manpower,
            req.priority_level,
            req.max_cost_per_intervention_cr
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ----------------- ACTION HUB -----------------
@router.get("/actions", response_model=List[ActionDetail])
def get_actions(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Action)
    if project_id:
        q = q.filter(Action.project_id == project_id)
    if status and status != "All":
        q = q.filter(Action.status == status)
    
    actions = q.order_by(Action.created_at.desc()).all()
    out = []
    for a in actions:
        p = db.query(Project).filter(Project.id == a.project_id).first()
        t_var = (a.actual_time_saving_months - a.predicted_time_saving_months) if a.actual_time_saving_months is not None else None
        c_var = (a.actual_cost_saving_cr - a.predicted_cost_saving_cr) if a.actual_cost_saving_cr is not None else None
        
        updates_list = [
            {"timestamp": u.timestamp, "author": u.author, "previous_status": u.previous_status, "new_status": u.new_status, "comments": u.comments}
            for u in a.updates
        ]
        out.append(ActionDetail(
            id=a.id,
            project_id=a.project_id,
            project_name=p.name if p else None,
            ministry_name=p.ministry_name if p else None,
            sector_name=p.sector_name if p else None,
            intervention_name=a.intervention_name,
            intervention_category=a.intervention_category,
            recommended_date=a.recommended_date,
            approved_by=a.approved_by,
            assigned_officer=a.assigned_officer,
            expected_impact_summary=a.expected_impact_summary,
            deadline=a.deadline,
            status=a.status,
            estimated_cost_cr=a.estimated_cost_cr,
            actual_cost_cr=a.actual_cost_cr,
            predicted_time_saving_months=a.predicted_time_saving_months,
            actual_time_saving_months=a.actual_time_saving_months,
            predicted_cost_saving_cr=a.predicted_cost_saving_cr,
            actual_cost_saving_cr=a.actual_cost_saving_cr,
            time_variance_months=round(t_var, 1) if t_var is not None else None,
            cost_variance_cr=round(c_var, 1) if c_var is not None else None,
            notes=a.notes,
            outcome_notes=a.outcome_notes,
            created_at=a.created_at,
            updates=updates_list
        ))
    return out

@router.post("/actions", response_model=ActionDetail)
def create_action(req: ActionCreate, db: Session = Depends(get_db)):
    action_id = f"ACT-2026-{uuid.uuid4().hex[:4].upper()}"
    new_action = Action(
        id=action_id,
        project_id=req.project_id,
        intervention_name=req.intervention_name,
        intervention_category=req.intervention_category,
        recommended_date=datetime.utcnow().strftime("%Y-%m-%d"),
        approved_by="Dr. Vikram Sharma, MoSPI",
        assigned_officer=req.assigned_officer,
        expected_impact_summary=req.expected_impact_summary,
        deadline=req.deadline,
        status="Approved",
        estimated_cost_cr=req.estimated_cost_cr,
        predicted_time_saving_months=req.predicted_time_saving_months,
        predicted_cost_saving_cr=req.predicted_cost_saving_cr,
        notes=req.notes
    )
    db.add(new_action)
    db.flush()

    # Initial update record
    update = ActionUpdate(
        action_id=action_id,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        author="Dr. Vikram Sharma (Monitoring Officer)",
        previous_status="Recommended",
        new_status="Approved",
        comments="Approved intervention under authority delegation."
    )
    db.add(update)
    db.commit()
    db.refresh(new_action)
    return get_actions(project_id=req.project_id, status=None, db=db)[0]

@router.patch("/actions/{action_id}/status")
def update_action_status(action_id: str, req: ActionStatusUpdate, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")

    prev_status = action.status
    action.status = req.new_status
    if req.assigned_officer:
        action.assigned_officer = req.assigned_officer
    
    update = ActionUpdate(
        action_id=action_id,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        author="Dr. Vikram Sharma (Monitoring Officer)",
        previous_status=prev_status,
        new_status=req.new_status,
        comments=req.comments or f"Status transitioned to {req.new_status}"
    )
    db.add(update)

    log = AuditLog(
        user_name="Dr. Vikram Sharma",
        user_role="MONITORING_OFFICER",
        action_type="ACTION_STATUS_CHANGED",
        entity_type="Action",
        entity_id=action_id,
        details=f"Action status moved from {prev_status} to {req.new_status}"
    )
    db.add(log)
    db.commit()
    return {"message": f"Action {action_id} updated to {req.new_status}", "action_id": action_id}

@router.post("/actions/{action_id}/outcome")
def record_actual_outcome(action_id: str, req: ActualOutcomeRecord, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")

    action.actual_time_saving_months = req.actual_time_saving_months
    action.actual_cost_saving_cr = req.actual_cost_saving_cr
    action.actual_cost_cr = req.actual_cost_cr
    action.outcome_notes = req.outcome_notes
    action.status = "Completed"

    update = ActionUpdate(
        action_id=action_id,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        author="Dr. Vikram Sharma (Monitoring Officer)",
        previous_status="In Progress",
        new_status="Completed",
        comments=f"Actual outcome recorded: {req.actual_time_saving_months} mo saved, ₹{req.actual_cost_saving_cr} Cr saved."
    )
    db.add(update)

    log = AuditLog(
        user_name="Dr. Vikram Sharma",
        user_role="MONITORING_OFFICER",
        action_type="ACTUAL_OUTCOME_ENTERED",
        entity_type="Action",
        entity_id=action_id,
        details=f"Recorded actual outcome vs predicted for learning feedback loop."
    )
    db.add(log)
    db.commit()
    return {"message": "Actual outcome recorded successfully", "action_id": action_id}

# ----------------- SYSTEMIC BOTTLENECKS -----------------
@router.get("/bottlenecks", response_model=List[BottleneckSchema])
def get_bottlenecks(db: Session = Depends(get_db)):
    items = db.query(Bottleneck).all()
    return [BottleneckSchema.model_validate(b) for b in items]

# ----------------- PULSE ASSISTANT -----------------
@router.post("/assistant/query", response_model=AssistantQueryResponse)
async def query_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    res = await assistant_engine.query(db, req.query, req.project_id)
    return AssistantQueryResponse(**res)

# ----------------- REPORTS / REVIEW BRIEF -----------------
@router.get("/reports/project/{project_id}", response_model=ReviewBriefResponse)
def get_project_review_brief(project_id: str, db: Session = Depends(get_db)):
    return report_generator.generate_review_brief(db, project_id)

# ----------------- MACHINE LEARNING BENCHMARKS -----------------
@router.get("/ml/evaluation")
def get_ml_evaluation(db: Session = Depends(get_db)):
    return ml_pipeline.train_and_evaluate(db)

# ----------------- AUDIT LOGS -----------------
@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "user_name": l.user_name,
            "user_role": l.user_role,
            "action_type": l.action_type,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details
        }
        for l in logs
    ]
