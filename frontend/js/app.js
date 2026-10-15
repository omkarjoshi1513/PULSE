// ==========================================================================
// PAIMANA Pulse - Main Application Controller
// Orchestrates tabs, state, modals, and notifications.
// ==========================================================================

import { api } from './api.js';
import { Dashboard } from './components/dashboard.js';
import { Projects } from './components/projects.js';
import { ProjectPulse } from './components/pulse.js';
import { Simulator } from './components/simulator.js';
import { Actions } from './components/actions.js';
import { Bottlenecks } from './components/bottlenecks.js';
import { Reports } from './components/reports.js';
import { Assistant } from './components/assistant.js';

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.components = {
      dashboard: Dashboard,
      projects: Projects,
      pulse: ProjectPulse,
      simulator: Simulator,
      actions: Actions,
      bottlenecks: Bottlenecks,
      reports: Reports,
      assistant: Assistant
    };
  }

  async init() {
    console.log('Initializing PAIMANA Pulse application...');
    this.attachGlobalEvents();
    this.initModals();

    // Initialize all components
    await Promise.all([
      Dashboard.init(this),
      Projects.init(this),
      ProjectPulse.init(this),
      Simulator.init(this),
      Actions.init(this),
      Bottlenecks.init(this),
      Reports.init(this),
      Assistant.init(this)
    ]);

    // Activate default tab
    this.navigateTo('dashboard');
  }

  attachGlobalEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab');
        if (tab) this.navigateTo(tab);
      });
    });

    // Brand click returns to dashboard
    document.querySelector('.brand-section')?.addEventListener('click', () => {
      this.navigateTo('dashboard');
    });

    // Hero project button in header
    document.getElementById('header-hero-btn')?.addEventListener('click', () => {
      this.navigateTo('pulse', { projectId: 'P10291' });
    });

    // Warning pill in header
    document.getElementById('header-warning-pill')?.addEventListener('click', () => {
      this.navigateTo('projects');
    });
  }

  navigateTo(tabName, params = {}) {
    if (!this.components[tabName]) return;

    this.currentTab = tabName;

    // Update nav tab active classes
    document.querySelectorAll('.nav-tab').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update view container visibility
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view.id === `view-${tabName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Apply specific component parameters
    if (tabName === 'pulse' && params.projectId) {
      ProjectPulse.setProject(params.projectId);
    } else if (tabName === 'simulator' && params.projectId) {
      Simulator.setProject(params.projectId);
    } else if (tabName === 'reports' && params.projectId) {
      Reports.setProject(params.projectId);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  initModals() {
    // Modal Close buttons
    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Click outside modal
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // 1. Submit Action Approval Form
    const approveForm = document.getElementById('form-approve-action');
    approveForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pId = document.getElementById('modal-action-project-id').value;
      const name = document.getElementById('modal-action-name').value;
      const officer = document.getElementById('modal-action-officer').value || 'Dr. Vikram Sharma';
      const deadline = document.getElementById('modal-action-deadline').value || '2026-11-30';
      const cost = parseFloat(document.getElementById('modal-action-cost').value || '0');
      const timeSaved = parseFloat(document.getElementById('modal-action-time-saved').value || '0');
      const costSaved = parseFloat(document.getElementById('modal-action-cost-saved').value || '0');
      const summary = document.getElementById('modal-action-summary').value;
      const notes = document.getElementById('modal-action-notes').value;

      try {
        await api.createAction({
          project_id: pId,
          intervention_name: name,
          intervention_category: 'Proactive Mitigation',
          assigned_officer: officer,
          deadline: deadline,
          estimated_cost_cr: cost,
          predicted_time_saving_months: timeSaved,
          predicted_cost_saving_cr: costSaved,
          expected_impact_summary: summary,
          notes: notes
        });

        document.getElementById('modal-approve-action').classList.remove('active');
        this.showToast('✓ Intervention approved and logged to Action Tracker!');
        await Actions.loadActions();
        this.navigateTo('actions');
      } catch (err) {
        alert(`Failed to save action: ${err.message}`);
      }
    });

    // 2. Submit Action Status Update Form
    const statusForm = document.getElementById('form-update-status');
    statusForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const actionId = document.getElementById('modal-status-action-id').value;
      const newStatus = document.getElementById('modal-status-select').value;
      const comments = document.getElementById('modal-status-notes').value;

      try {
        await api.updateActionStatus(actionId, newStatus, comments);
        document.getElementById('modal-update-status').classList.remove('active');
        this.showToast(`Action status updated to ${newStatus}`);
        await Actions.loadActions();
      } catch (err) {
        alert(`Failed to update status: ${err.message}`);
      }
    });

    // 3. Submit Record Outcome Form
    const outcomeForm = document.getElementById('form-record-outcome');
    outcomeForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const actionId = document.getElementById('modal-outcome-action-id').value;
      const timeSaved = parseFloat(document.getElementById('modal-outcome-time-saved').value || '0');
      const costSaved = parseFloat(document.getElementById('modal-outcome-cost-saved').value || '0');
      const actualCost = parseFloat(document.getElementById('modal-outcome-cost-cr').value || '0');
      const notes = document.getElementById('modal-outcome-notes').value;

      try {
        await api.recordOutcome(actionId, timeSaved, costSaved, actualCost, notes);
        document.getElementById('modal-record-outcome').classList.remove('active');
        this.showToast('✓ Actual outcome logged successfully (learning loop updated)!');
        await Actions.loadActions();
      } catch (err) {
        alert(`Failed to record outcome: ${err.message}`);
      }
    });
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
