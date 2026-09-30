from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    role = Column(String(30), default="MONITORING_OFFICER") # ADMIN, MONITORING_OFFICER, VIEWER
    department = Column(String(100), default="MoSPI - DIID")
    created_at = Column(DateTime, default=datetime.utcnow)

class Ministry(Base):
    __tablename__ = "ministries"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(150), nullable=False)
    total_projects = Column(Integer, default=0)
    total_cost_cr = Column(Float, default=0.0)

class Sector(Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    icon = Column(String(50), default="Layers")

class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True)
    name = Column(String(100), nullable=False)
    region = Column(String(50), default="Western")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(30), primary_key=True, index=True) # e.g. P10291
    name = Column(String(255), nullable=False)
    ministry_name = Column(String(150), nullable=False)
    sector_name = Column(String(100), nullable=False)
    state_name = Column(String(100), nullable=False)
    
    # Financial metrics in ₹ Crore
    original_cost = Column(Float, nullable=False, default=1000.0)
    revised_cost = Column(Float, nullable=False, default=1200.0)
    cumulative_expenditure = Column(Float, nullable=False, default=700.0)
    
    # Dates
    start_date = Column(String(20), default="2023-01-15")
    original_completion_date = Column(String(20), default="2026-03-31")
    anticipated_completion_date = Column(String(20), default="2026-12-15")
    
    # Progress metrics
    physical_progress_pct = Column(Float, default=48.0)
    planned_progress_pct = Column(Float, default=65.0)
    progress_lag_pct = Column(Float, default=17.0)
    financial_progress_pct = Column(Float, default=61.0)
    
    # Risk Metrics (0 - 100)
    current_risk_score = Column(Integer, default=50)
    previous_risk_score = Column(Integer, default=45)
    risk_category = Column(String(20), default="Monitor") # Stable, Monitor, High Risk
    risk_change = Column(Integer, default=0) # current - previous
    
    # Probabilistic Predictions
    cost_risk_prob = Column(Float, default=0.50) # 0.0 - 1.0
    time_risk_prob = Column(Float, default=0.50) # 0.0 - 1.0
    expected_cost_overrun_cr = Column(Float, default=50.0)
    expected_delay_months = Column(Float, default=4.0)
    prediction_confidence = Column(Float, default=0.88)
    confidence_interval_low = Column(Float, default=6.5)
    confidence_interval_high = Column(Float, default=10.2)
    model_name = Column(String(50), default="XGBoost Regressor v2.4")
    
    # Operational flags
    status = Column(String(30), default="Active") # Stable, Monitor, Critical, Under Review
    early_warning_flag = Column(Boolean, default=False)
    early_warning_trigger = Column(String(255), nullable=True)
    primary_driver = Column(String(100), default="Progress Lag")
    
    # Relationships
    monthly_updates = relationship("ProjectMonthlyUpdate", back_populates="project", cascade="all, delete-orphan")
    risk_drivers = relationship("RiskDriver", back_populates="project", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="project", cascade="all, delete-orphan")

class ProjectMonthlyUpdate(Base):
    __tablename__ = "project_monthly_updates"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(30), ForeignKey("projects.id"), index=True)
    month_year = Column(String(20), nullable=False) # e.g. "2026-06"
    risk_score = Column(Integer, nullable=False)
    physical_progress_pct = Column(Float, default=0.0)
    planned_progress_pct = Column(Float, default=0.0)
    cumulative_expenditure_cr = Column(Float, default=0.0)
    expenditure_burn_rate = Column(Float, default=1.0) # ratio of actual vs scheduled burn
    clearance_delay_months = Column(Float, default=0.0)
    land_acquisition_pct = Column(Float, default=100.0)
    contractor_efficiency_score = Column(Float, default=85.0)
    delay_months = Column(Float, default=0.0)
    
    project = relationship("Project", back_populates="monthly_updates")

class RiskDriver(Base):
    __tablename__ = "risk_drivers"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(30), ForeignKey("projects.id"), index=True)
    feature_name = Column(String(100), nullable=False)
    current_value = Column(String(50), nullable=False)
    expected_value = Column(String(50), nullable=False)
    contribution_score = Column(Float, nullable=False) # SHAP value relative impact
    severity = Column(String(20), default="Medium") # High, Medium, Low
    direction = Column(String(20), default="increase_risk") # increase_risk, mitigating
    historical_trend = Column(String(20), default="Worsening") # Worsening, Stable, Improving
    description = Column(Text, nullable=True)
    
    project = relationship("Project", back_populates="risk_drivers")

class Intervention(Base):
    __tablename__ = "interventions"
    id = Column(String(30), primary_key=True, index=True) # e.g. INT_001
    code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Administrative, Financial, Operational, Contractual
    description = Column(Text, nullable=False)
    applicable_conditions = Column(Text, nullable=False)
    estimated_cost_cr = Column(Float, nullable=False, default=20.0)
    required_manpower = Column(Integer, nullable=False, default=15)
    max_risk_reduction = Column(Float, nullable=False, default=15.0)
    expected_time_saved_months = Column(Float, nullable=False, default=2.5)
    expected_cost_avoided_cr = Column(Float, nullable=False, default=30.0)
    feature_changes_json = Column(JSON, default=dict)

class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(30), ForeignKey("projects.id"), index=True)
    baseline_risk = Column(Integer, nullable=False)
    baseline_delay_months = Column(Float, nullable=False)
    baseline_cost_impact_cr = Column(Float, nullable=False)
    selected_intervention_ids = Column(JSON, nullable=False) # list of IDs
    simulated_risk = Column(Integer, nullable=False)
    simulated_delay_months = Column(Float, nullable=False)
    simulated_cost_impact_cr = Column(Float, nullable=False)
    risk_reduction_points = Column(Integer, nullable=False)
    time_saved_months = Column(Float, nullable=False)
    potential_cost_avoided_cr = Column(Float, nullable=False)
    total_intervention_cost_cr = Column(Float, nullable=False)
    total_manpower_required = Column(Integer, nullable=False)
    is_feasible = Column(Boolean, default=True)
    assumptions_note = Column(Text, default="Projected impact under modeled XGBoost & SHAP assumptions.")
    created_at = Column(DateTime, default=datetime.utcnow)

class Action(Base):
    __tablename__ = "actions"
    id = Column(String(40), primary_key=True, index=True) # e.g. ACT-2026-0104
    project_id = Column(String(30), ForeignKey("projects.id"), index=True)
    intervention_name = Column(String(150), nullable=False)
    intervention_category = Column(String(50), default="Operational")
    recommended_date = Column(String(30), nullable=False)
    approved_by = Column(String(100), default="Pending Review")
    assigned_officer = Column(String(100), default="Project Monitoring Officer (MoSPI)")
    expected_impact_summary = Column(Text, nullable=False)
    deadline = Column(String(30), nullable=False)
    status = Column(String(30), default="Recommended") # Recommended, Pending Approval, Approved, In Progress, Completed, Rejected
    estimated_cost_cr = Column(Float, default=35.0)
    actual_cost_cr = Column(Float, nullable=True)
    
    # Feedback loop: Actual vs Predicted
    predicted_time_saving_months = Column(Float, default=3.1)
    actual_time_saving_months = Column(Float, nullable=True)
    predicted_cost_saving_cr = Column(Float, default=35.0)
    actual_cost_saving_cr = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    outcome_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="actions")
    updates = relationship("ActionUpdate", back_populates="action", cascade="all, delete-orphan")

class ActionUpdate(Base):
    __tablename__ = "action_updates"
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(40), ForeignKey("actions.id"), index=True)
    timestamp = Column(String(30), nullable=False)
    author = Column(String(100), nullable=False)
    previous_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    comments = Column(Text, nullable=True)
    
    action = relationship("Action", back_populates="updates")

class Bottleneck(Base):
    __tablename__ = "bottlenecks"
    id = Column(String(30), primary_key=True, index=True)
    issue_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    affected_projects_count = Column(Integer, default=0)
    affected_sectors = Column(JSON, default=list) # ["Roads", "Railways", "Power"]
    affected_states = Column(JSON, default=list) # ["Maharashtra", "Karnataka", "Madhya Pradesh"]
    sample_project_ids = Column(JSON, default=list) # ["P10291", "P10344", ...]
    average_delay_months = Column(Float, default=0.0)
    total_cost_at_risk_cr = Column(Float, default=0.0)
    severity = Column(String(20), default="High") # Critical, High, Moderate
    trend = Column(String(30), default="Increasing across Q2")
    systemic_recommendation = Column(Text, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_name = Column(String(100), default="Officer V. Sharma")
    user_role = Column(String(50), default="MONITORING_OFFICER")
    action_type = Column(String(50), nullable=False) # e.g. "SIMULATION_EXECUTED", "ACTION_APPROVED"
    entity_type = Column(String(50), nullable=False) # "Project", "Simulation", "Action"
    entity_id = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)

class AssistantQuery(Base):
    __tablename__ = "assistant_queries"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_query = Column(Text, nullable=False)
    project_id = Column(String(30), nullable=True)
    retrieved_data_summary = Column(Text, nullable=True)
    response_text = Column(Text, nullable=False)
    source = Column(String(50), default="Grounded Project DB")
