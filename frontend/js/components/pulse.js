// ==========================================================================
// Project Pulse Component
// Comprehensive diagnostic view for an individual project.
// ==========================================================================

import { api } from '../api.js';

export const ProjectPulse = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-pulse');
    this.currentProjectId = 'P10291'; // Default Hero Project
    await this.render();
    this.attachEvents();
  },

  async setProject(projectId) {
    if (projectId) {
      this.currentProjectId = projectId;
      const sel = document.getElementById('pulse-project-select');
      if (sel) sel.value = projectId;
      await this.loadProjectData();
    }
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Project Pulse Diagnostic</h2>
          <p class="page-subtitle">Granular performance indicators, risk drivers, and timeline forecasts</p>
        </div>
        <div class="page-actions">
          <select class="select-filter" id="pulse-project-select" style="font-weight: 600;">
            <option value="P10291">P10291 - Western Dedicated Freight Corridor</option>
            <option value="P10144">P10144 - Mumbai-Ahmedabad High Speed Rail</option>
            <option value="P10382">P10382 - Eastern Peripheral Expressway</option>
            <option value="P10055">P10055 - Barmer Refinery Project</option>
            <option value="P10419">P10419 - Delhi-Varanasi High Speed Corridor</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-pulse-launch-sim">
            ⚙️ Simulate Interventions
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-pulse-open-brief">
            📄 Executive Brief
          </button>
        </div>
      </div>

      <div id="pulse-content">
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">Loading project diagnostic...</div>
      </div>
    `;

    await this.populateProjectDropdown();
    await this.loadProjectData();
  },

  attachEvents() {
    document.getElementById('pulse-project-select')?.addEventListener('change', (e) => {
      this.currentProjectId = e.target.value;
      this.loadProjectData();
    });

    document.getElementById('btn-pulse-launch-sim')?.addEventListener('click', () => {
      this.app.navigateTo('simulator', { projectId: this.currentProjectId });
    });

    document.getElementById('btn-pulse-open-brief')?.addEventListener('click', () => {
      this.app.navigateTo('reports', { projectId: this.currentProjectId });
    });
  },

  async populateProjectDropdown() {
    try {
      const projects = await api.getProjects({ limit: 100 });
      const sel = document.getElementById('pulse-project-select');
      if (!sel || !projects) return;

      sel.innerHTML = projects.map(p => `
        <option value="${p.id}" ${p.id === this.currentProjectId ? 'selected' : ''}>
          ${p.id} - ${p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
        </option>
      `).join('');
    } catch (e) {
      console.warn('Could not populate projects dropdown', e);
    }
  },

  async loadProjectData() {
    const content = document.getElementById('pulse-content');
    try {
      const p = await api.getProject(this.currentProjectId);
      const riskClass = p.risk_category === 'High' ? 'badge-risk' : p.risk_category === 'Moderate' ? 'badge-medium' : 'badge-stable';

      // SVG sparkline for risk trajectory
      const traj = p.risk_trajectory || [40, 55, p.current_risk_score];
      const svgPoints = traj.map((val, idx) => {
        const x = (idx / (traj.length - 1)) * 180 + 10;
        const y = 60 - (val / 100) * 50;
        return `${x},${y}`;
      }).join(' ');

      content.innerHTML = `
        <!-- Main Project Overview Card -->
        <div class="pulse-header">
          <div class="pulse-header-top">
            <div class="pulse-title-group">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-family: monospace; font-weight: 700; color: var(--primary); font-size: 14px;">${p.id}</span>
                <span class="badge ${riskClass}">${p.risk_category} Risk</span>
                ${p.early_warning_flag ? '<span class="badge badge-risk">⚠️ Early Warning Active</span>' : ''}
              </div>
              <h3>${p.name}</h3>
              <div class="pulse-meta-row">
                <span>🏛️ ${p.ministry_name}</span>
                <span>📌 Sector: ${p.sector_name}</span>
                <span>📍 State: ${p.state_name}</span>
                <span>📅 Start: ${p.start_date || '2022-01'}</span>
                <span>🏁 Target: ${p.anticipated_completion_date || p.original_completion_date}</span>
              </div>
            </div>

            <!-- Mini Sparkline for Risk -->
            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; text-align: center;">
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Risk Trajectory</div>
              <svg width="200" height="65" style="overflow: visible;">
                <polyline fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" points="${svgPoints}" />
                ${traj.map((val, idx) => {
                  const x = (idx / (traj.length - 1)) * 180 + 10;
                  const y = 60 - (val / 100) * 50;
                  return `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="var(--primary)" stroke-width="2" />`;
                }).join('')}
              </svg>
              <div style="font-size: 12px; font-weight: 600; color: var(--text-main); margin-top: 2px;">Current: ${p.current_risk_score} / 100</div>
            </div>
          </div>

          <!-- Progress and Cost Indicators -->
          <div class="pulse-stats-grid">
            <div class="stat-box">
              <span class="stat-box-label">Physical Progress</span>
              <span class="stat-box-val">${p.physical_progress_pct.toFixed(1)}%</span>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${Math.min(p.physical_progress_pct, 100)}%;"></div>
              </div>
              <span style="font-size: 11px; color: ${p.progress_lag_pct > 5 ? 'var(--danger)' : 'var(--text-muted)'}; margin-top: 4px;">
                Planned: ${p.planned_progress_pct.toFixed(1)}% (${p.progress_lag_pct.toFixed(1)}% lag)
              </span>
            </div>

            <div class="stat-box">
              <span class="stat-box-label">Financial Expenditure</span>
              <span class="stat-box-val">₹${Math.round(p.cumulative_expenditure).toLocaleString('en-IN')} Cr</span>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${Math.min((p.cumulative_expenditure / (p.revised_cost || p.original_cost)) * 100, 100)}%; background: #0284c7;"></div>
              </div>
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Of total ₹${Math.round(p.revised_cost || p.original_cost).toLocaleString('en-IN')} Cr
              </span>
            </div>

            <div class="stat-box">
              <span class="stat-box-label">Expected Schedule Delay</span>
              <span class="stat-box-val" style="color: ${p.expected_delay_months > 6 ? 'var(--danger)' : 'var(--text-main)'};">
                +${p.expected_delay_months.toFixed(1)} Months
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted);">
                Model Confidence: ${Math.round(p.prediction_confidence * 100)}%
              </span>
            </div>

            <div class="stat-box">
              <span class="stat-box-label">Potential Cost Overrun</span>
              <span class="stat-box-val" style="color: ${p.expected_cost_overrun_cr > 100 ? 'var(--danger)' : 'var(--text-main)'};">
                ₹${Math.round(p.expected_cost_overrun_cr).toLocaleString('en-IN')} Cr
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted);">
                Cost Risk Prob: ${Math.round(p.cost_risk_prob * 100)}%
              </span>
            </div>
          </div>
        </div>

        <!-- 2-Column Split: Risk Drivers & What Changed -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;" class="pulse-detail-grid">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Key Risk Drivers -->
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">Primary Risk Drivers</div>
                  <div class="card-desc">Underlying root causes contributing to project risk score</div>
                </div>
              </div>
              <div class="driver-list">
                ${(p.drivers || []).map(d => `
                  <div class="driver-item">
                    <div>
                      <div style="font-weight: 600; color: var(--text-main);">${d.feature_name}</div>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                        Current: <strong>${d.current_value}</strong> (Benchmark: ${d.expected_value})
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge ${d.severity === 'Critical' ? 'badge-risk' : 'badge-medium'}">${d.severity}</span>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">+${d.contribution_score.toFixed(1)} pts</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- What Changed This Cycle -->
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">What Changed This Reporting Cycle</div>
                  <div class="card-desc">Metric variance between previous and current submission</div>
                </div>
              </div>
              <div class="activity-list">
                ${(p.what_changed || []).map(wc => `
                  <div class="activity-item">
                    <div class="activity-item-content">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">${wc.feature_name}</span>
                        <span class="badge ${wc.direction === 'worsened' ? 'badge-risk' : 'badge-stable'}">${wc.delta_display}</span>
                      </div>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        Previous: ${wc.previous_val} → Current: <strong>${wc.current_val}</strong>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Failed to load diagnostic details for ${this.currentProjectId}.</div>`;
    }
  }
};
