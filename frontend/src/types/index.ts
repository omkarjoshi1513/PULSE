export interface PortfolioKPIs {
  total_projects: number;
  high_risk_projects: number;
  monitor_projects: number;
  stable_projects: number;
  cost_at_risk_cr: number;
  total_portfolio_cost_cr: number;
  average_delay_months: number;
  projects_requiring_action: number;
  early_warnings_active: number;
  reporting_period: string;
}

export interface HeatmapCell {
  sector: string;
  state: string;
  project_count: number;
  avg_risk_score: number;
  high_risk_count: number;
  total_cost_cr: number;
}

export interface WhatChangedItem {
  category: string;
  metric: string;
  headline: string;
  count_affected: number;
  severity: 'critical' | 'high' | 'moderate';
}

export interface RiskDriver {
  id: number;
  feature_name: string;
  current_value: string;
  expected_value: string;
  contribution_score: number;
  severity: string;
  direction: string;
  historical_trend: string;
  description?: string;
}

export interface MonthlyUpdate {
  month_year: string;
  risk_score: number;
  physical_progress_pct: number;
  planned_progress_pct: number;
  cumulative_expenditure_cr: number;
  expenditure_burn_rate: number;
  clearance_delay_months: number;
  land_acquisition_pct: number;
  contractor_efficiency_score: number;
  delay_months: number;
}

export interface WhatChangedDetail {
  feature_name: string;
  current_val: string;
  previous_val: string;
  delta_display: string;
  severity: string;
  direction: string;
}

export interface BenchmarkData {
  peer_group_name: string;
  peer_count: number;
  avg_peer_risk: number;
  this_project_risk: number;
  avg_peer_delay_months: number;
  this_project_delay_months: number;
  risk_percentile: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  ministry_name: string;
  sector_name: string;
  state_name: string;
  original_cost: number;
  revised_cost: number;
  cumulative_expenditure: number;
  current_risk_score: number;
  previous_risk_score: number;
  risk_category: 'Stable' | 'Monitor' | 'High Risk';
  risk_change: number;
  cost_risk_prob: number;
  time_risk_prob: number;
  expected_cost_overrun_cr: number;
  expected_delay_months: number;
  status: string;
  primary_driver: string;
  early_warning_flag: boolean;
}

export interface ProjectDetail extends ProjectSummary {
  start_date: string;
  original_completion_date: string;
  anticipated_completion_date: string;
  physical_progress_pct: number;
  planned_progress_pct: number;
  progress_lag_pct: number;
  financial_progress_pct: number;
  risk_trajectory: number[];
  prediction_confidence: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  model_name: string;
  early_warning_trigger?: string;
  what_changed: WhatChangedDetail[];
  drivers: RiskDriver[];
  history: MonthlyUpdate[];
  benchmark: BenchmarkData;
}

export interface Intervention {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  applicable_conditions: string;
  estimated_cost_cr: number;
  required_manpower: number;
  max_risk_reduction: number;
  expected_time_saved_months: number;
  expected_cost_avoided_cr: number;
  feature_changes_json: Record<string, any>;
}

export interface ScenarioComparisonItem {
  scenario_name: string;
  intervention_names: string[];
  risk_score: number;
  risk_reduction_points: number;
  expected_delay_months: number;
  time_saved_months: number;
  expected_cost_impact_cr: number;
  potential_cost_avoided_cr: number;
  total_cost_cr: number;
  total_manpower: number;
  is_baseline: boolean;
}

export interface SimulationResponse {
  project_id: string;
  baseline: ScenarioComparisonItem;
  simulated: ScenarioComparisonItem;
  risk_reduction_points: number;
  time_saved_months: number;
  cost_avoided_cr: number;
  total_intervention_cost_cr: number;
  total_manpower_required: number;
  comparisons: ScenarioComparisonItem[];
  assumptions_note: string;
}

export interface OptimizationResponse {
  project_id: string;
  recommended_interventions: Intervention[];
  total_cost_cr: number;
  total_manpower: number;
  expected_risk_score: number;
  expected_delay_months: number;
  expected_cost_impact_cr: number;
  risk_reduction_points: number;
  time_saved_months: number;
  cost_avoided_cr: number;
  remaining_budget_cr: number;
  remaining_manpower: number;
  explanation: string;
  alternatives: Array<{
    names: string[];
    total_cost_cr: number;
    total_manpower: number;
    expected_risk: number;
    time_saved_months: number;
    cost_avoided_cr: number;
  }>;
}

export interface ActionAuditItem {
  timestamp: string;
  author: string;
  previous_status: string;
  new_status: string;
  comments?: string;
}

export interface ActionDetail {
  id: string;
  project_id: string;
  project_name?: string;
  ministry_name?: string;
  sector_name?: string;
  intervention_name: string;
  intervention_category: string;
  recommended_date: string;
  approved_by: string;
  assigned_officer: string;
  expected_impact_summary: string;
  deadline: string;
  status: string;
  estimated_cost_cr: number;
  actual_cost_cr?: number;
  predicted_time_saving_months: number;
  actual_time_saving_months?: number;
  predicted_cost_saving_cr: number;
  actual_cost_saving_cr?: number;
  time_variance_months?: number;
  cost_variance_cr?: number;
  notes?: string;
  outcome_notes?: string;
  created_at: string;
  updates: ActionAuditItem[];
}

export interface Bottleneck {
  id: string;
  issue_name: string;
  category: string;
  affected_projects_count: number;
  affected_sectors: string[];
  affected_states: string[];
  sample_project_ids: string[];
  average_delay_months: number;
  total_cost_at_risk_cr: number;
  severity: string;
  trend: string;
  systemic_recommendation: string;
}

export interface AssistantQueryResponse {
  query: string;
  response: string;
  grounded_data?: {
    project_id?: string;
    current_risk?: number;
    key_drivers?: string[];
    overrun_cost_cr?: number;
    delay_months?: number;
    recommended_intervention?: string;
  };
  source: string;
  disclaimer: string;
}

export interface ReviewBriefResponse {
  generated_at: string;
  officer_name: string;
  project_overview: Record<string, any>;
  current_risk: Record<string, any>;
  what_changed: WhatChangedDetail[];
  risk_drivers: RiskDriver[];
  cost_forecast: Record<string, any>;
  time_forecast: Record<string, any>;
  recommended_interventions: Array<Record<string, any>>;
  simulated_impact: Record<string, any>;
  approved_actions: Array<Record<string, any>>;
  current_status: string;
  governance_signoff_text: string;
}
