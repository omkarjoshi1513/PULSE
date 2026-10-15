// ==========================================================================
// PAIMANA Pulse - Clean API Client
// Handles communication with FastAPI backend endpoints.
// ==========================================================================

const API_BASE = window.location.port === '5173' || window.location.port === '8000'
  ? '/api'
  : 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errMsg = `Request failed: ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errMsg = errJson.detail;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getKPIs: () => request('/dashboard/kpis'),
  getHeatmap: (ministry, sector, state) => {
    const p = new URLSearchParams();
    if (ministry && ministry !== 'All') p.append('ministry', ministry);
    if (sector && sector !== 'All') p.append('sector', sector);
    if (state && state !== 'All') p.append('state', state);
    return request(`/dashboard/heatmap?${p.toString()}`);
  },
  getWhatChanged: () => request('/dashboard/what-changed'),

  // Projects
  getProjects: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.search) p.append('search', filters.search);
    if (filters.ministry && filters.ministry !== 'All') p.append('ministry', filters.ministry);
    if (filters.sector && filters.sector !== 'All') p.append('sector', filters.sector);
    if (filters.state && filters.state !== 'All') p.append('state', filters.state);
    if (filters.risk_category && filters.risk_category !== 'All') p.append('risk_category', filters.risk_category);
    p.append('limit', filters.limit || '120');
    return request(`/projects?${p.toString()}`);
  },
  getProject: (projectId) => request(`/projects/${projectId}`),

  // Interventions & Simulation
  getInterventions: () => request('/interventions'),
  runSimulation: (projectId, interventionIds) => request('/simulations', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, intervention_ids: interventionIds })
  }),
  runOptimization: (projectId, budgetCr, manpower, priority = 'High') => request('/optimization/recommend', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      available_budget_cr: budgetCr,
      available_manpower: manpower,
      priority_level: priority
    })
  }),

  // Actions
  getActions: (projectId, status) => {
    const p = new URLSearchParams();
    if (projectId) p.append('project_id', projectId);
    if (status && status !== 'All') p.append('status', status);
    return request(`/actions?${p.toString()}`);
  },
  createAction: (actionData) => request('/actions', {
    method: 'POST',
    body: JSON.stringify(actionData)
  }),
  updateActionStatus: (actionId, newStatus, comments, assignedOfficer) => request(`/actions/${actionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      new_status: newStatus,
      comments: comments || `Status updated to ${newStatus}`,
      assigned_officer: assignedOfficer
    })
  }),
  recordOutcome: (actionId, timeSaved, costSaved, actualCost, notes) => request(`/actions/${actionId}/outcome`, {
    method: 'POST',
    body: JSON.stringify({
      actual_time_saving_months: timeSaved,
      actual_cost_saving_cr: costSaved,
      actual_cost_cr: actualCost,
      outcome_notes: notes
    })
  }),

  // Bottlenecks
  getBottlenecks: () => request('/bottlenecks'),

  // Assistant
  queryAssistant: (query, projectId) => request('/assistant/query', {
    method: 'POST',
    body: JSON.stringify({ query, project_id: projectId })
  }),

  // Reports
  getReviewBrief: (projectId) => request(`/reports/project/${projectId}`),

  // Audit Logs
  getAuditLogs: () => request('/audit-logs')
};
