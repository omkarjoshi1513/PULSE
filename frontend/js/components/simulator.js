// ==========================================================================
// What-If Simulator & Optimization Component
// Interactive simulation of interventions, budget constraints, and ROI.
// ==========================================================================

import { api } from '../api.js';

export const Simulator = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-simulator');
    this.currentProjectId = 'P10291';
    this.interventions = [];
    this.lastSimulationResult = null;
    await this.render();
    this.attachEvents();
    await this.loadInitialData();
  },

  async setProject(projectId) {
    if (projectId) {
      this.currentProjectId = projectId;
      const sel = document.getElementById('sim-project-select');
      if (sel) sel.value = projectId;
      await this.runSimulation();
    }
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>What-If Intervention Simulator</h2>
          <p class="page-subtitle">Test and optimize corrective action packages to compress schedule delays & curb cost escalation</p>
        </div>
        <div class="page-actions">
          <select class="select-filter" id="sim-project-select" style="font-weight: 600;">
            <option value="P10291">P10291 - Western Dedicated Freight Corridor</option>
            <option value="P10144">P10144 - Mumbai-Ahmedabad High Speed Rail</option>
            <option value="P10382">P10382 - Eastern Peripheral Expressway</option>
            <option value="P10055">P10055 - Barmer Refinery Project</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="btn-auto-optimize">
            ⚡ Recommend Best Package
          </button>
        </div>
      </div>

      <div class="simulator-layout">
        <!-- Left: Control Panel & Intervention Picker -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Intervention Package Builder</div>
              <div class="card-desc">Select candidate interventions or adjust resource constraints</div>
            </div>
          </div>

          <!-- Sliders for Budget & Manpower -->
          <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px;">
            <div class="slider-group">
              <div class="slider-label-row">
                <span>Available Budget Cap</span>
                <span id="budget-val" style="font-weight: 700; color: var(--primary);">₹150 Cr</span>
              </div>
              <input type="range" class="range-slider" id="budget-slider" min="10" max="500" step="10" value="150" />
            </div>

            <div class="slider-group" style="margin-bottom: 0;">
              <div class="slider-label-row">
                <span>Deployable Manpower Cap</span>
                <span id="manpower-val" style="font-weight: 700; color: var(--primary);">60 Personnel</span>
              </div>
              <input type="range" class="range-slider" id="manpower-slider" min="5" max="250" step="5" value="60" />
            </div>
          </div>

          <!-- Interventions Checklist -->
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Select Interventions to Test:</div>
          <div class="intervention-pick-list" id="interventions-checklist">
            <div style="color: var(--text-muted); font-size: 13px; padding: 10px;">Loading interventions...</div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px;">
            <button class="btn btn-primary" id="btn-run-simulation" style="flex: 1;">
              ▶ Run What-If Simulation
            </button>
            <button class="btn btn-secondary" id="btn-reset-interventions">
              Clear All
            </button>
          </div>
        </div>

        <!-- Right: Simulation Impact & Action Conversion -->
        <div class="card" id="sim-results-container">
          <div class="card-header">
            <div>
              <div class="card-title">Projected Outcome & ROI</div>
              <div class="card-desc">Comparative analysis against business-as-usual baseline</div>
            </div>
          </div>

          <div id="sim-results-body">
            <div style="padding: 40px; text-align: center; color: var(--text-muted);">
              Select interventions and click "Run What-If Simulation" to project impacts.
            </div>
          </div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    // Project selector
    document.getElementById('sim-project-select')?.addEventListener('change', (e) => {
      this.currentProjectId = e.target.value;
      this.runSimulation();
    });

    // Sliders
    const budgetSlider = document.getElementById('budget-slider');
    const budgetVal = document.getElementById('budget-val');
    budgetSlider?.addEventListener('input', (e) => {
      if (budgetVal) budgetVal.textContent = `₹${e.target.value} Cr`;
    });

    const manpowerSlider = document.getElementById('manpower-slider');
    const manpowerVal = document.getElementById('manpower-val');
    manpowerSlider?.addEventListener('input', (e) => {
      if (manpowerVal) manpowerVal.textContent = `${e.target.value} Personnel`;
    });

    // Run simulation button
    document.getElementById('btn-run-simulation')?.addEventListener('click', () => {
      this.runSimulation();
    });

    // Auto-optimize button
    document.getElementById('btn-auto-optimize')?.addEventListener('click', () => {
      this.runOptimization();
    });

    // Reset button
    document.getElementById('btn-reset-interventions')?.addEventListener('click', () => {
      document.querySelectorAll('#interventions-checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
      this.runSimulation();
    });
  },

  async loadInitialData() {
    try {
      this.interventions = await api.getInterventions();
      this.renderInterventionsList();
      // Run baseline simulation for current project
      await this.runSimulation();
    } catch (e) {
      console.error('Failed to load interventions', e);
    }
  },

  renderInterventionsList() {
    const list = document.getElementById('interventions-checklist');
    if (!list || !this.interventions) return;

    list.innerHTML = this.interventions.map((item, idx) => `
      <label class="intervention-item" for="inv-${item.id}">
        <input type="checkbox" id="inv-${item.id}" value="${item.id}" ${idx < 2 ? 'checked' : ''} />
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="color: var(--text-main);">${item.name}</strong>
            <span style="font-size: 11px; font-weight: 600; color: var(--primary);">₹${item.estimated_cost_cr} Cr</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
            ${item.description}
          </div>
          <div style="display: flex; gap: 10px; font-size: 11px; color: var(--text-light); margin-top: 4px;">
            <span>⏱️ Saves up to ~${item.expected_time_saved_months} mo</span>
            <span>👥 ${item.required_manpower} personnel</span>
          </div>
        </div>
      </label>
    `).join('');
  },

  getSelectedInterventionIds() {
    const checked = document.querySelectorAll('#interventions-checklist input[type="checkbox"]:checked');
    return Array.from(checked).map(cb => cb.value);
  },

  async runSimulation() {
    const resultsBody = document.getElementById('sim-results-body');
    const selectedIds = this.getSelectedInterventionIds();

    try {
      resultsBody.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Calculating multi-variable simulation...</div>`;
      const res = await api.runSimulation(this.currentProjectId, selectedIds);
      this.lastSimulationResult = res;
      this.renderSimulationResults(res);
    } catch (err) {
      resultsBody.innerHTML = `<div style="padding: 24px; color: var(--danger); text-align: center;">Simulation failed: ${err.message}</div>`;
    }
  },

  async runOptimization() {
    const resultsBody = document.getElementById('sim-results-body');
    const budget = parseFloat(document.getElementById('budget-slider')?.value || '150');
    const manpower = parseInt(document.getElementById('manpower-slider')?.value || '60', 10);

    try {
      resultsBody.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Finding optimal resource allocation...</div>`;
      const opt = await api.runOptimization(this.currentProjectId, budget, manpower);

      // Check corresponding checkboxes
      const recIds = new Set((opt.recommended_interventions || []).map(i => i.id));
      document.querySelectorAll('#interventions-checklist input[type="checkbox"]').forEach(cb => {
        cb.checked = recIds.has(cb.value);
      });

      this.app.showToast(`Found optimal package with ${recIds.size} interventions!`);
      // Run simulation to display comparative results
      await this.runSimulation();
    } catch (err) {
      resultsBody.innerHTML = `<div style="padding: 24px; color: var(--danger); text-align: center;">Optimization failed: ${err.message}</div>`;
    }
  },

  renderSimulationResults(res) {
    const resultsBody = document.getElementById('sim-results-body');
    const b = res.baseline;
    const s = res.simulated;

    const netSavings = res.cost_avoided_cr - res.total_intervention_cost_cr;
    const roiRatio = res.total_intervention_cost_cr > 0 ? (res.cost_avoided_cr / res.total_intervention_cost_cr).toFixed(1) : 'N/A';

    resultsBody.innerHTML = `
      <!-- Comparison KPI Columns -->
      <div class="comparison-box">
        <div class="comp-col">
          <h4>Baseline (Do Nothing)</h4>
          <div class="comp-metric" style="color: var(--danger);">
            ${b.expected_delay_months.toFixed(1)} mo Delay
          </div>
          <div style="font-size: 13px; color: var(--text-muted);">Risk Score: <strong>${b.risk_score} / 100</strong></div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Potential Overrun: ₹${Math.round(b.expected_cost_impact_cr)} Cr</div>
        </div>

        <div class="comp-col" style="border-left: 2px solid var(--border-color); padding-left: 16px;">
          <h4 style="color: var(--primary);">Simulated Package</h4>
          <div class="comp-metric" style="color: var(--success);">
            ${s.expected_delay_months.toFixed(1)} mo Delay
          </div>
          <div style="font-size: 13px; color: var(--text-muted);">Risk Score: <strong>${s.risk_score} / 100</strong> (${res.risk_reduction_points} pts drop)</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Cost Overrun: ₹${Math.round(s.expected_cost_impact_cr)} Cr</div>
        </div>
      </div>

      <!-- Key Impact Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
        <div style="background: var(--success-bg); border: 1px solid var(--success-border); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: var(--success); font-weight: 600;">Time Recovered</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--success);">${res.time_saved_months.toFixed(1)} mo</div>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: var(--primary); font-weight: 600;">Cost Avoidance</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--primary);">₹${Math.round(res.cost_avoided_cr)} Cr</div>
        </div>
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: var(--radius-sm); padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #7e22ce; font-weight: 600;">Net Benefit</div>
          <div style="font-size: 20px; font-weight: 700; color: #7e22ce;">₹${Math.round(netSavings)} Cr</div>
        </div>
      </div>

      <!-- Resource Requirements -->
      <div style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 20px; padding: 10px 14px; background: var(--bg-app); border-radius: var(--radius-sm);">
        💼 Total Package Cost: <strong>₹${res.total_intervention_cost_cr.toFixed(1)} Cr</strong> • 
        👥 Manpower: <strong>${res.total_manpower_required} officers</strong> • 
        📈 Benefit-Cost Ratio: <strong>${roiRatio}x</strong>
      </div>

      <!-- Action Conversion CTA -->
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-primary" id="btn-approve-action" style="flex: 1;">
          ✓ Approve & Convert to Action Item
        </button>
      </div>
    `;

    document.getElementById('btn-approve-action')?.addEventListener('click', () => {
      this.openApproveModal(res);
    });
  },

  openApproveModal(res) {
    const modal = document.getElementById('modal-approve-action');
    if (!modal) return;

    // Prefill form values
    document.getElementById('modal-action-project-id').value = this.currentProjectId;
    document.getElementById('modal-action-name').value = `Intervention Package for ${this.currentProjectId}`;
    document.getElementById('modal-action-cost').value = res.total_intervention_cost_cr;
    document.getElementById('modal-action-time-saved').value = res.time_saved_months;
    document.getElementById('modal-action-cost-saved').value = res.cost_avoided_cr;
    document.getElementById('modal-action-summary').value = `Projected to recover ${res.time_saved_months.toFixed(1)} months and avoid ₹${Math.round(res.cost_avoided_cr)} Cr overrun.`;

    modal.classList.add('active');
  }
};
