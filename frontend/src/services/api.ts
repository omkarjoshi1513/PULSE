import {
  PortfolioKPIs, HeatmapCell, WhatChangedItem, ProjectSummary, ProjectDetail,
  Intervention, SimulationResponse, OptimizationResponse, ActionDetail,
  Bottleneck, AssistantQueryResponse, ReviewBriefResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export async function fetchKPIs(): Promise<PortfolioKPIs> {
  const res = await fetch(`${API_BASE}/dashboard/kpis`);
  if (!res.ok) throw new Error('Failed to load KPIs');
  return res.json();
}

export async function fetchHeatmap(ministry?: string, sector?: string, state?: string): Promise<HeatmapCell[]> {
  const params = new URLSearchParams();
  if (ministry) params.append('ministry', ministry);
  if (sector) params.append('sector', sector);
  if (state) params.append('state', state);
  const res = await fetch(`${API_BASE}/dashboard/heatmap?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load heatmap');
  return res.json();
}

export async function fetchWhatChanged(): Promise<WhatChangedItem[]> {
  const res = await fetch(`${API_BASE}/dashboard/what-changed`);
  if (!res.ok) throw new Error('Failed to load what changed summary');
  return res.json();
}

export async function fetchProjects(params?: {
  search?: string;
  ministry?: string;
  sector?: string;
  state?: string;
  risk_category?: string;
  limit?: number;
}): Promise<ProjectSummary[]> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.ministry) q.append('ministry', params.ministry);
  if (params?.sector) q.append('sector', params.sector);
  if (params?.state) q.append('state', params.state);
  if (params?.risk_category) q.append('risk_category', params.risk_category);
  if (params?.limit) q.append('limit', params.limit.toString());
  
  const res = await fetch(`${API_BASE}/projects?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export async function fetchProjectDetail(projectId: string): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error(`Failed to load project ${projectId}`);
  return res.json();
}

export async function fetchInterventions(): Promise<Intervention[]> {
  const res = await fetch(`${API_BASE}/interventions`);
  if (!res.ok) throw new Error('Failed to load interventions');
  return res.json();
}

export async function runSimulation(projectId: string, interventionIds: string[]): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, intervention_ids: interventionIds })
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function runOptimization(
  projectId: string,
  availableBudgetCr: number,
  availableManpower: number,
  priorityLevel: string = "High"
): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/optimization/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      available_budget_cr: availableBudgetCr,
      available_manpower: availableManpower,
      priority_level: priorityLevel
    })
  });
  if (!res.ok) throw new Error('Optimization failed');
  return res.json();
}

export async function fetchActions(projectId?: string, status?: string): Promise<ActionDetail[]> {
  const q = new URLSearchParams();
  if (projectId) q.append('project_id', projectId);
  if (status) q.append('status', status);
  const res = await fetch(`${API_BASE}/actions?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to load actions');
  return res.json();
}

export async function createAction(actionData: {
  project_id: string;
  intervention_name: string;
  intervention_category: string;
  expected_impact_summary: string;
  deadline: string;
  assigned_officer: string;
  estimated_cost_cr: number;
  predicted_time_saving_months: number;
  predicted_cost_saving_cr: number;
  notes?: string;
}): Promise<ActionDetail> {
  const res = await fetch(`${API_BASE}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actionData)
  });
  if (!res.ok) throw new Error('Failed to create action');
  return res.json();
}

export async function updateActionStatus(actionId: string, newStatus: string, comments?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/actions/${actionId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_status: newStatus, comments })
  });
  if (!res.ok) throw new Error('Failed to update action status');
}

export async function recordActualOutcome(
  actionId: string,
  actualTimeSavedMonths: number,
  actualCostSavedCr: number,
  actualCostCr: number,
  outcomeNotes: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/actions/${actionId}/outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actual_time_saving_months: actualTimeSavedMonths,
      actual_cost_saving_cr: actualCostSavedCr,
      actual_cost_cr: actualCostCr,
      outcome_notes: outcomeNotes
    })
  });
  if (!res.ok) throw new Error('Failed to record outcome');
}

export async function fetchBottlenecks(): Promise<Bottleneck[]> {
  const res = await fetch(`${API_BASE}/bottlenecks`);
  if (!res.ok) throw new Error('Failed to load bottlenecks');
  return res.json();
}

export async function queryAssistant(query: string, projectId?: string): Promise<AssistantQueryResponse> {
  const res = await fetch(`${API_BASE}/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, project_id: projectId })
  });
  if (!res.ok) throw new Error('Failed to query assistant');
  return res.json();
}

export async function fetchReviewBrief(projectId: string): Promise<ReviewBriefResponse> {
  const res = await fetch(`${API_BASE}/reports/project/${projectId}`);
  if (!res.ok) throw new Error('Failed to load review brief');
  return res.json();
}

export async function fetchMLEvaluation(): Promise<any> {
  const res = await fetch(`${API_BASE}/ml/evaluation`);
  if (!res.ok) throw new Error('Failed to load ML evaluation');
  return res.json();
}

export async function fetchAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}
