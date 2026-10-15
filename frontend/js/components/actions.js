// ==========================================================================
// Action Tracker Component
// Tracks execution of approved interventions and records actual outcomes.
// ==========================================================================

import { api } from '../api.js';

export const Actions = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-actions');
    this.currentStatusFilter = 'All';
    this.actionsList = [];
    await this.render();
    this.attachEvents();
    await this.loadActions();
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Action Tracker & Learning Loop</h2>
          <p class="page-subtitle">Monitor approved proactive interventions, enforce accountability, and verify actual outcomes</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-actions">
            ↻ Refresh Actions
          </button>
        </div>
      </div>

      <!-- Filter Tabs Bar -->
      <div class="filter-bar">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="action-status-filters">
          <button class="btn btn-primary btn-sm status-filter-btn" data-status="All">All Actions</button>
          <button class="btn btn-secondary btn-sm status-filter-btn" data-status="Approved">Approved</button>
          <button class="btn btn-secondary btn-sm status-filter-btn" data-status="In Progress">In Progress</button>
          <button class="btn btn-secondary btn-sm status-filter-btn" data-status="Completed">Completed</button>
        </div>
      </div>

      <!-- Action Items Grid -->
      <div class="action-grid" id="actions-container">
        <div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
          Loading action items...
        </div>
      </div>
    `;
  },

  attachEvents() {
    document.getElementById('btn-refresh-actions')?.addEventListener('click', () => this.loadActions());

    document.querySelectorAll('.status-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.status-filter-btn').forEach(b => {
          b.className = 'btn btn-secondary btn-sm status-filter-btn';
        });
        btn.className = 'btn btn-primary btn-sm status-filter-btn';
        this.currentStatusFilter = btn.getAttribute('data-status');
        this.renderFilteredActions();
      });
    });
  },

  async loadActions() {
    const container = document.getElementById('actions-container');
    try {
      this.actionsList = await api.getActions();
      this.renderFilteredActions();
    } catch (err) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger); grid-column: 1 / -1;">Failed to load actions: ${err.message}</div>`;
    }
  },

  renderFilteredActions() {
    const container = document.getElementById('actions-container');
    const filtered = this.currentStatusFilter === 'All'
      ? this.actionsList
      : this.actionsList.filter(a => a.status === this.currentStatusFilter);

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          No actions found in "${this.currentStatusFilter}" state.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(a => {
      const statusBadge = a.status === 'Completed' ? 'badge-stable' : a.status === 'In Progress' ? 'badge-info' : 'badge-medium';
      const hasOutcome = a.actual_time_saving_months !== null && a.actual_time_saving_months !== undefined;

      return `
        <div class="action-card" data-action-id="${a.id}">
          <div>
            <div class="action-card-header">
              <span class="badge ${statusBadge}">${a.status}</span>
              <span style="font-family: monospace; font-size: 11px; color: var(--text-muted);">${a.id}</span>
            </div>
            <div class="action-title">${a.intervention_name}</div>
            <div class="action-meta">
              Project: <strong style="color: var(--primary); cursor: pointer;" class="link-project" data-p="${a.project_id}">${a.project_id}</strong> (${a.project_name || 'Infrastructure Project'})
            </div>

            <div class="action-impact-box">
              <div style="font-weight: 600; margin-bottom: 4px;">Expected Impact:</div>
              <div>⏱️ Predicted Time Saved: <strong>${a.predicted_time_saving_months || 0} mo</strong></div>
              <div>💰 Predicted Cost Saved: <strong>₹${Math.round(a.predicted_cost_saving_cr || 0)} Cr</strong></div>
              ${a.estimated_cost_cr ? `<div>💼 Allocated Cost: ₹${a.estimated_cost_cr} Cr</div>` : ''}
            </div>

            ${hasOutcome ? `
              <div style="background: var(--success-bg); border: 1px solid var(--success-border); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 12px; margin-bottom: 12px;">
                <div style="font-weight: 600; color: var(--success);">Actual Realized Outcome:</div>
                <div>⏱️ Real Time Saved: <strong>${a.actual_time_saving_months} mo</strong> (Variance: ${a.time_variance_months > 0 ? '+' : ''}${a.time_variance_months || 0} mo)</div>
                <div>💰 Real Cost Saved: <strong>₹${Math.round(a.actual_cost_saving_cr || 0)} Cr</strong></div>
                ${a.outcome_notes ? `<div style="font-style: italic; color: var(--text-muted); margin-top: 4px;">"${a.outcome_notes}"</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px;">
              👤 Assigned: <strong>${a.assigned_officer || 'Monitoring Officer'}</strong> • 📅 Deadline: <strong>${a.deadline || '2026-11-30'}</strong>
            </div>

            <div class="action-footer">
              <div style="display: flex; gap: 6px; width: 100%;">
                <button class="btn btn-secondary btn-sm btn-update-status" data-id="${a.id}" data-current="${a.status}" style="flex: 1;">
                  Update Status
                </button>
                <button class="btn btn-primary btn-sm btn-record-outcome" data-id="${a.id}" style="flex: 1;">
                  ${hasOutcome ? 'Edit Outcome' : 'Log Outcome'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.link-project').forEach(el => {
      el.addEventListener('click', () => {
        const pId = el.getAttribute('data-p');
        if (pId) this.app.navigateTo('pulse', { projectId: pId });
      });
    });

    container.querySelectorAll('.btn-update-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.getAttribute('data-id');
        const current = btn.getAttribute('data-current');
        this.openStatusModal(actionId, current);
      });
    });

    container.querySelectorAll('.btn-record-outcome').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.getAttribute('data-id');
        this.openOutcomeModal(actionId);
      });
    });
  },

  openStatusModal(actionId, currentStatus) {
    const modal = document.getElementById('modal-update-status');
    if (!modal) return;
    document.getElementById('modal-status-action-id').value = actionId;
    document.getElementById('modal-status-select').value = currentStatus === 'Approved' ? 'In Progress' : 'Completed';
    modal.classList.add('active');
  },

  openOutcomeModal(actionId) {
    const modal = document.getElementById('modal-record-outcome');
    if (!modal) return;
    document.getElementById('modal-outcome-action-id').value = actionId;
    modal.classList.add('active');
  }
};
