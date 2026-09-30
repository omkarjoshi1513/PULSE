from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# User & Auth
class UserSchema(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    department: str

    class Config:
        from_attributes = True

# Dashboard KPIs
class PortfolioKPISchema(BaseModel):
    total_projects: int
    high_risk_projects: int
    monitor_projects: int
    stable_projects: int
    cost_at_risk_cr: float
    total_portfolio_cost_cr: float
    average_delay_months: float
    projects_requiring_action: int
    early_warnings_active: int
    reporting_period: str

class HeatmapCell(BaseModel):
    sector: str
    state: str
    project_count: int
    avg_risk_score: float
    high_risk_count: int
    total_cost_cr: float

class WhatChangedItem(BaseModel):
    category: str
    metric: str
    headline: str
    count_affected: int
    severity: str # critical, high, moderate

# Risk Driver
class RiskDriverSchema(BaseModel):
    id: int
    feature_name: str
    current_value: str
    expected_value: str
    contribution_score: float
    severity: str
    direction: str
    historical_trend: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Monthly Update
class MonthlyUpdateSchema(BaseModel):
    month_year: str
    risk_score: int
    physical_progress_pct: float
    planned_progress_pct: float
    cumulative_expenditure_cr: float
    expenditure_burn_rate: float
    clearance_delay_months: float
    land_acquisition_pct: float
    contractor_efficiency_score: float
    delay_months: float

    class Config:
        from_attributes = True

# Project
class ProjectSummary(BaseModel):
    id: str
    name: str
    ministry_name: str
    sector_name: str
    state_name: str
    original_cost: float
    revised_cost: float
    cumulative_expenditure: float
    current_risk_score: int
    previous_risk_score: int
    risk_category: str
    risk_change: int
    cost_risk_prob: float
    time_risk_prob: float
    expected_cost_overrun_cr: float
    expected_delay_months: float
    status: str
    primary_driver: str
    early_warning_flag: bool

    class Config:
        from_attributes = True

class BenchmarkData(BaseModel):
    peer_group_name: str
    peer_count: int
    avg_peer_risk: float
    this_project_risk: float
    avg_peer_delay_months: float
    this_project_delay_months: float
    risk_percentile: float

class WhatChangedDetail(BaseModel):
    feature_name: str
    current_val: str
    previous_val: str
    delta_display: str
    severity: str
    direction: str # worsened, improved, unchanged

class ProjectDetail(BaseModel):
    id: str
    name: str
    ministry_name: str
    sector_name: str
    state_name: str
    original_cost: float
    revised_cost: float
    cumulative_expenditure: float
    start_date: str
    original_completion_date: str
    anticipated_completion_date: str
    physical_progress_pct: float
    planned_progress_pct: float
    progress_lag_pct: float
    financial_progress_pct: float
    current_risk_score: int
    previous_risk_score: int
    risk_trajectory: List[int] # e.g. [54, 79, 82]
    risk_category: str
    risk_change: int
    cost_risk_prob: float
    time_risk_prob: float
    expected_cost_overrun_cr: float
    expected_delay_months: float
    prediction_confidence: float
    confidence_interval_low: float
    confidence_interval_high: float
    model_name: str
    status: str
    early_warning_flag: bool
    early_warning_trigger: Optional[str]
    primary_driver: str
    what_changed: List[WhatChangedDetail]
    drivers: List[RiskDriverSchema]
    history: List[MonthlyUpdateSchema]
    benchmark: BenchmarkData

# Interventions
class InterventionSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str
    description: str
    applicable_conditions: str
    estimated_cost_cr: float
    required_manpower: int
    max_risk_reduction: float
    expected_time_saved_months: float
    expected_cost_avoided_cr: float
    feature_changes_json: Dict[str, Any]

    class Config:
        from_attributes = True

# Simulation
class SimulationRequest(BaseModel):
    project_id: str
    intervention_ids: List[str]

class ScenarioComparisonItem(BaseModel):
    scenario_name: str
    intervention_names: List[str]
    risk_score: int
    risk_reduction_points: int
    expected_delay_months: float
    time_saved_months: float
    expected_cost_impact_cr: float
    potential_cost_avoided_cr: float
    total_cost_cr: float
    total_manpower: int
    is_baseline: bool = False

class SimulationResponse(BaseModel):
    project_id: str
    baseline: ScenarioComparisonItem
    simulated: ScenarioComparisonItem
    risk_reduction_points: int
    time_saved_months: float
    cost_avoided_cr: float
    total_intervention_cost_cr: float
    total_manpower_required: int
    comparisons: List[ScenarioComparisonItem]
    assumptions_note: str

# Optimization
class OptimizationRequest(BaseModel):
    project_id: str
    available_budget_cr: float
    available_manpower: int
    priority_level: str = "High"
    max_cost_per_intervention_cr: Optional[float] = None

class OptimizationResponse(BaseModel):
    project_id: str
    recommended_interventions: List[InterventionSchema]
    total_cost_cr: float
    total_manpower: int
    expected_risk_score: int
    expected_delay_months: float
    expected_cost_impact_cr: float
    risk_reduction_points: int
    time_saved_months: float
    cost_avoided_cr: float
    remaining_budget_cr: float
    remaining_manpower: int
    explanation: str
    alternatives: List[Dict[str, Any]]

# Actions
class ActionAuditItem(BaseModel):
    timestamp: str
    author: str
    previous_status: str
    new_status: str
    comments: Optional[str] = None

class ActionCreate(BaseModel):
    project_id: str
    intervention_name: str
    intervention_category: str
    expected_impact_summary: str
    deadline: str
    assigned_officer: str
    estimated_cost_cr: float
    predicted_time_saving_months: float
    predicted_cost_saving_cr: float
    notes: Optional[str] = None

class ActionStatusUpdate(BaseModel):
    new_status: str # "Approved", "In Progress", "Completed", "Rejected"
    comments: Optional[str] = None
    assigned_officer: Optional[str] = None

class ActualOutcomeRecord(BaseModel):
    actual_time_saving_months: float
    actual_cost_saving_cr: float
    actual_cost_cr: float
    outcome_notes: str

class ActionDetail(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    ministry_name: Optional[str] = None
    sector_name: Optional[str] = None
    intervention_name: str
    intervention_category: str
    recommended_date: str
    approved_by: str
    assigned_officer: str
    expected_impact_summary: str
    deadline: str
    status: str
    estimated_cost_cr: float
    actual_cost_cr: Optional[float] = None
    predicted_time_saving_months: float
    actual_time_saving_months: Optional[float] = None
    predicted_cost_saving_cr: float
    actual_cost_saving_cr: Optional[float] = None
    time_variance_months: Optional[float] = None
    cost_variance_cr: Optional[float] = None
    notes: Optional[str] = None
    outcome_notes: Optional[str] = None
    created_at: datetime
    updates: List[ActionAuditItem]

    class Config:
        from_attributes = True

# Bottlenecks
class BottleneckSchema(BaseModel):
    id: str
    issue_name: str
    category: str
    affected_projects_count: int
    affected_sectors: List[str]
    affected_states: List[str]
    sample_project_ids: List[str]
    average_delay_months: float
    total_cost_at_risk_cr: float
    severity: str
    trend: str
    systemic_recommendation: str

    class Config:
        from_attributes = True

# Pulse Assistant
class AssistantQueryRequest(BaseModel):
    query: str
    project_id: Optional[str] = None

class GroundedDataPointers(BaseModel):
    project_id: Optional[str] = None
    current_risk: Optional[int] = None
    key_drivers: List[str] = []
    overrun_cost_cr: Optional[float] = None
    delay_months: Optional[float] = None
    recommended_intervention: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    query: str
    response: str
    grounded_data: Optional[GroundedDataPointers] = None
    source: str
    disclaimer: str = "All values grounded directly from verified MoSPI PAIMANA project records."

# Report Review Brief
class ReviewBriefResponse(BaseModel):
    generated_at: str
    officer_name: str
    project_overview: Dict[str, Any]
    current_risk: Dict[str, Any]
    what_changed: List[WhatChangedDetail]
    risk_drivers: List[RiskDriverSchema]
    cost_forecast: Dict[str, Any]
    time_forecast: Dict[str, Any]
    recommended_interventions: List[Dict[str, Any]]
    simulated_impact: Dict[str, Any]
    approved_actions: List[Dict[str, Any]]
    current_status: str
    governance_signoff_text: str
