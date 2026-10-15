// ==========================================================================
// Systemic Bottlenecks Component
// Analyzes recurring structural delays across ministries & projects.
// ==========================================================================

import { api } from '../api.js';

export const Bottlenecks = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-bottlenecks');
    await this.render();
    this.attachEvents();
    await this.loadBottlenecks();
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Systemic Bottlenecks Analysis</h2>
          <p class="page-subtitle">Cross-ministry root causes driving delays across the national infrastructure portfolio</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-bottlenecks">
            ↻ Refresh Analysis
          </button>
        </div>
      </div>

      <div class="bottleneck-grid" id="bottlenecks-list">
        <div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          Loading systemic bottleneck analysis...
        </div>
      </div>
    `;
  },

  attachEvents() {
    document.getElementById('btn-refresh-bottlenecks')?.addEventListener('click', () => this.loadBottlenecks());
  },

  async loadBottlenecks() {
    const list = document.getElementById('bottlenecks-list');
    try {
      const items = await api.getBottlenecks();
      if (!items || items.length === 0) {
        list.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No active bottlenecks flagged.</div>`;
        return;
      }

      list.innerHTML = items.map(b => {
        const severityClass = b.severity === 'Critical' ? 'badge-risk' : b.severity === 'High' ? 'badge-medium' : 'badge-info';
        return `
          <div class="bottleneck-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="badge ${severityClass}">${b.severity} Severity</span>
              <span style="font-size: 11.5px; color: var(--text-muted);">${b.category}</span>
            </div>
            <div class="bottleneck-name">${b.name}</div>
            <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
              ${b.description || 'Systemic procedural delay affecting milestone delivery.'}
            </p>

            <div class="bottleneck-stats">
              <div>
                <strong>${b.affected_project_count || 12}</strong>
                <span>Projects Affected</span>
              </div>
              <div style="border-left: 1px solid var(--border-color); padding-left: 12px;">
                <strong style="color: var(--danger);">+${b.average_delay_months || 8.5} mo</strong>
                <span>Avg Delay Added</span>
              </div>
            </div>

            <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 12px;">
              <div style="font-weight: 600; color: var(--text-main); margin-bottom: 2px;">Proven Mitigation:</div>
              <div style="color: var(--text-muted);">${b.recommended_mitigation || 'State coordination committee escalation & digital single-window clearance.'}</div>
            </div>

            <div style="margin-top: 14px; text-align: right;">
              <button class="btn btn-secondary btn-sm btn-filter-bn" data-sector="${b.category}">
                View Related Projects →
              </button>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.btn-filter-bn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.app.navigateTo('projects');
        });
      });
    } catch (err) {
      list.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger); grid-column: 1 / -1;">Failed to load bottlenecks: ${err.message}</div>`;
    }
  }
};
