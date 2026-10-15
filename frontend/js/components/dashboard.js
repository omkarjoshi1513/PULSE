// ==========================================================================
// Dashboard Component
// Displays portfolio overview, high-level KPIs, recent changes, and heatmap.
// ==========================================================================

import { api } from '../api.js';

export const Dashboard = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-dashboard');
    await this.render();
    this.attachEvents();
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Portfolio Overview</h2>
          <p class="page-subtitle">National infrastructure monitoring & early-warning signals across sectors</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-dashboard">
            ↻ Refresh Data
          </button>
          <button class="hero-btn" id="btn-jump-hero">
            ⭐ Focus: Western Freight Corridor (P10291)
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" id="kpi-cards">
        <div class="kpi-card"><span class="kpi-label">Loading KPIs...</span></div>
      </div>

      <!-- Main Dashboard Split: Heatmap & Recent Shifts -->
      <div class="dashboard-split">
        <!-- Left: Sector & State Heatmap -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Sector & State Risk Matrix</div>
              <div class="card-desc">Breakdown of projects and risk intensity across ministries</div>
            </div>
            <div class="heatmap-filter-bar">
              <select class="select-filter" id="hm-sector-filter">
                <option value="All">All Sectors</option>
                <option value="Railways">Railways</option>
                <option value="Road Transport & Highways">Roads & Highways</option>
                <option value="Power">Power</option>
                <option value="Petroleum & Natural Gas">Petroleum</option>
                <option value="Civil Aviation">Civil Aviation</option>
                <option value="Shipping & Ports">Shipping & Ports</option>
              </select>
            </div>
          </div>
          <div class="heatmap-table-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th>State</th>
                  <th>Projects</th>
                  <th>Total Cost (₹ Cr)</th>
                  <th>Avg Risk</th>
                  <th>High Risk</th>
                </tr>
              </thead>
              <tbody id="heatmap-body">
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading sector matrix...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: What Changed Recently -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Portfolio Signals</div>
              <div class="card-desc">Material changes detected in the latest reporting cycle</div>
            </div>
          </div>
          <div class="activity-list" id="what-changed-list">
            <div style="color: var(--text-muted); font-size: 13px;">Checking updates...</div>
          </div>
        </div>
      </div>
    `;

    await Promise.all([
      this.loadKPIs(),
      this.loadHeatmap(),
      this.loadWhatChanged()
    ]);
  },

  attachEvents() {
    document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => this.render());
    document.getElementById('btn-jump-hero')?.addEventListener('click', () => {
      this.app.navigateTo('pulse', { projectId: 'P10291' });
    });

    document.getElementById('hm-sector-filter')?.addEventListener('change', (e) => {
      this.loadHeatmap(e.target.value);
    });
  },

  async loadKPIs() {
    const el = document.getElementById('kpi-cards');
    try {
      const kpis = await api.getKPIs();
      el.innerHTML = `
        <div class="kpi-card">
          <span class="kpi-label">Monitored Projects</span>
          <span class="kpi-value">${kpis.total_projects}</span>
          <span class="kpi-detail">Across 18 ministries</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">High / Critical Risk</span>
          <span class="kpi-value" style="color: var(--danger);">${kpis.high_risk_projects}</span>
          <span class="kpi-detail"><span class="badge badge-risk">${kpis.projects_requiring_action} require proactive steps</span></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Cost at Risk</span>
          <span class="kpi-value">₹${Math.round(kpis.cost_at_risk_cr).toLocaleString('en-IN')} Cr</span>
          <span class="kpi-detail">Out of ₹${Math.round(kpis.total_portfolio_cost_cr).toLocaleString('en-IN')} Cr total</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Average Delay</span>
          <span class="kpi-value">${kpis.average_delay_months.toFixed(1)} mo</span>
          <span class="kpi-detail">${kpis.early_warnings_active} early warning triggers</span>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="kpi-card" style="color: var(--danger);">Failed to load KPI statistics.</div>`;
    }
  },

  async loadHeatmap(sector = 'All') {
    const tbody = document.getElementById('heatmap-body');
    try {
      const cells = await api.getHeatmap(null, sector, null);
      if (!cells || cells.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No records for this sector.</td></tr>`;
        return;
      }

      tbody.innerHTML = cells.slice(0, 10).map(c => {
        const riskColor = c.avg_risk_score > 70 ? 'var(--danger)' : c.avg_risk_score > 45 ? 'var(--warning)' : 'var(--success)';
        return `
          <tr>
            <td><strong>${c.sector}</strong></td>
            <td>${c.state}</td>
            <td>${c.project_count}</td>
            <td>₹${Math.round(c.total_cost_cr).toLocaleString('en-IN')} Cr</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="risk-bar">
                  <div class="risk-bar-fill" style="width: ${c.avg_risk_score}%; background: ${riskColor};"></div>
                </div>
                <span>${Math.round(c.avg_risk_score)}</span>
              </div>
            </td>
            <td>
              ${c.high_risk_count > 0 
                ? `<span class="badge badge-risk">${c.high_risk_count}</span>` 
                : `<span class="badge badge-stable">0</span>`
              }
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">Could not load matrix.</td></tr>`;
    }
  },

  async loadWhatChanged() {
    const list = document.getElementById('what-changed-list');
    try {
      const items = await api.getWhatChanged();
      if (!items || items.length === 0) {
        list.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">No major shift flags this cycle.</div>`;
        return;
      }

      list.innerHTML = items.map(item => {
        const badgeClass = item.severity === 'critical' ? 'badge-risk' : item.severity === 'high' ? 'badge-medium' : 'badge-info';
        return `
          <div class="activity-item">
            <div class="activity-item-content">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge ${badgeClass}">${item.category}</span>
                <span style="font-size: 11px; color: var(--text-muted);">${item.count_affected} projects</span>
              </div>
              <div class="activity-headline">${item.headline}</div>
              <div class="activity-sub">${item.metric}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      list.innerHTML = `<div style="color: var(--danger); font-size: 13px;">Could not load updates feed.</div>`;
    }
  }
};
