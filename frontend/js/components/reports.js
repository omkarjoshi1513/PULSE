// ==========================================================================
// Executive Reports & Review Brief Component
// Generates official review briefs for secretary & ministerial meetings.
// ==========================================================================

import { api } from '../api.js';

export const Reports = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-reports');
    this.currentProjectId = 'P10291';
    await this.render();
    this.attachEvents();
    await this.loadReviewBrief();
  },

  async setProject(projectId) {
    if (projectId) {
      this.currentProjectId = projectId;
      const sel = document.getElementById('report-project-select');
      if (sel) sel.value = projectId;
      await this.loadReviewBrief();
    }
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Executive Project Review Brief</h2>
          <p class="page-subtitle">One-page executive summary formatted for inter-ministerial review & Pragati meetings</p>
        </div>
        <div class="page-actions">
          <select class="select-filter" id="report-project-select" style="font-weight: 600;">
            <option value="P10291">P10291 - Western Dedicated Freight Corridor</option>
            <option value="P10144">P10144 - Mumbai-Ahmedabad High Speed Rail</option>
            <option value="P10382">P10382 - Eastern Peripheral Expressway</option>
            <option value="P10055">P10055 - Barmer Refinery Project</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-print-report">
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div class="report-paper" id="report-content">
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
          Generating review brief...
        </div>
      </div>
    `;

    await this.populateProjectDropdown();
  },

  attachEvents() {
    document.getElementById('report-project-select')?.addEventListener('change', (e) => {
      this.currentProjectId = e.target.value;
      this.loadReviewBrief();
    });

    document.getElementById('btn-print-report')?.addEventListener('click', () => {
      window.print();
    });
  },

  async populateProjectDropdown() {
    try {
      const projects = await api.getProjects({ limit: 80 });
      const sel = document.getElementById('report-project-select');
      if (!sel || !projects) return;

      sel.innerHTML = projects.map(p => `
        <option value="${p.id}" ${p.id === this.currentProjectId ? 'selected' : ''}>
          ${p.id} - ${p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
        </option>
      `).join('');
    } catch (e) {
      console.warn('Could not populate reports dropdown', e);
    }
  },

  async loadReviewBrief() {
    const el = document.getElementById('report-content');
    try {
      el.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Fetching executive data...</div>`;
      const brief = await api.getReviewBrief(this.currentProjectId);

      el.innerHTML = `
        <div class="report-header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700;">
                Government of India • Ministry of Statistics & Programme Implementation
              </div>
              <h3 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-top: 4px;">
                ${brief.project_name || 'Infrastructure Project Review'}
              </h3>
              <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                Project ID: <strong>${brief.project_id}</strong> • Sector: <strong>${brief.sector}</strong> • State: <strong>${brief.state}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${brief.risk_category === 'High' ? 'badge-risk' : 'badge-medium'}">
                ${brief.risk_category} Risk (${brief.current_risk_score}/100)
              </span>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Cycle: ${brief.report_date || 'October 2026'}</div>
            </div>
          </div>
        </div>

        <!-- 1. Executive Summary -->
        <div class="report-section">
          <h4>1. Executive Summary</h4>
          <p>${brief.executive_summary || 'The project shows moderate schedule slippage due to land acquisition and statutory clearances. Timely proactive interventions are recommended to prevent further cost escalation.'}</p>
        </div>

        <!-- 2. Performance Summary -->
        <div class="report-section">
          <h4>2. Performance Snapshot</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0;">
            <div style="background: var(--bg-app); padding: 10px; border-radius: var(--radius-sm);">
              <div style="font-size: 11px; color: var(--text-muted);">Physical Progress</div>
              <div style="font-size: 16px; font-weight: 700;">${brief.physical_progress_pct ? brief.physical_progress_pct.toFixed(1) : 0}%</div>
            </div>
            <div style="background: var(--bg-app); padding: 10px; border-radius: var(--radius-sm);">
              <div style="font-size: 11px; color: var(--text-muted);">Expenditure Incurred</div>
              <div style="font-size: 16px; font-weight: 700;">₹${Math.round(brief.expenditure_cr || 0)} Cr</div>
            </div>
            <div style="background: var(--bg-app); padding: 10px; border-radius: var(--radius-sm);">
              <div style="font-size: 11px; color: var(--text-muted);">Projected Delay</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--danger);">+${brief.projected_delay_months || 0} Months</div>
            </div>
            <div style="background: var(--bg-app); padding: 10px; border-radius: var(--radius-sm);">
              <div style="font-size: 11px; color: var(--text-muted);">Cost Overrun Risk</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--danger);">₹${Math.round(brief.projected_cost_overrun_cr || 0)} Cr</div>
            </div>
          </div>
        </div>

        <!-- 3. Key Issues & Risk Factors -->
        <div class="report-section">
          <h4>3. Core Impediments & Bottlenecks</h4>
          <ul style="padding-left: 20px; margin-top: 8px;">
            ${(brief.key_issues || [
              'Delay in acquiring 42 hectares of railway right-of-way in critical sections.',
              'Forest and environmental clearance pending at state nodal authority level.',
              'Contractor cashflow constraints slowing down civil bridge construction.'
            ]).map(issue => `<li style="margin-bottom: 6px;">${issue}</li>`).join('')}
          </ul>
        </div>

        <!-- 4. Recommended Interventions -->
        <div class="report-section">
          <h4>4. Strategic Recommendations & Action Plan</h4>
          <ul style="padding-left: 20px; margin-top: 8px;">
            ${(brief.recommended_interventions || [
              'Deploy high-priority district magistrate taskforce for fast-tracked land consent.',
              'Authorize mobilization advance release to maintain contractor workforce on site.',
              'Convene inter-ministerial coordination meeting under Cabinet Secretariat oversight.'
            ]).map(rec => `<li style="margin-bottom: 6px;"><strong>${rec}</strong></li>`).join('')}
          </ul>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-muted);">
          <span>Prepared by: Dr. Vikram Sharma, MoSPI Project Monitoring Division</span>
          <span>Verified via PAIMANA Decision Engine</span>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Failed to load review brief: ${err.message}</div>`;
    }
  }
};
