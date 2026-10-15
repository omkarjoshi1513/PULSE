// ==========================================================================
// Projects Directory Component
// Searchable, filterable list of all infrastructure projects.
// ==========================================================================

import { api } from '../api.js';

export const Projects = {
  async init(app) {
    this.app = app;
    this.container = document.getElementById('view-projects');
    this.projects = [];
    this.filteredProjects = [];
    await this.render();
    this.attachEvents();
    await this.loadProjects();
  },

  async render() {
    this.container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2>Projects Directory</h2>
          <p class="page-subtitle">Track, filter, and drill down into individual infrastructure projects</p>
        </div>
        <div class="page-actions">
          <span style="font-size: 13px; color: var(--text-muted);" id="project-count-indicator">Loading...</span>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="proj-search-input" placeholder="Search by name, ID (e.g. P10291), or state..." />
        </div>
        <select class="select-filter" id="proj-sector-filter">
          <option value="All">All Sectors</option>
          <option value="Railways">Railways</option>
          <option value="Road Transport & Highways">Roads & Highways</option>
          <option value="Power">Power</option>
          <option value="Petroleum & Natural Gas">Petroleum</option>
          <option value="Civil Aviation">Civil Aviation</option>
          <option value="Shipping & Ports">Shipping & Ports</option>
        </select>
        <select class="select-filter" id="proj-risk-filter">
          <option value="All">All Risk Levels</option>
          <option value="High">High / Critical Risk</option>
          <option value="Moderate">Moderate Risk</option>
          <option value="Stable">Stable / On-Track</option>
        </select>
      </div>

      <!-- Data Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Project Name</th>
              <th>Sector & Ministry</th>
              <th>State</th>
              <th>Cost (₹ Cr)</th>
              <th>Expected Delay</th>
              <th>Risk Score</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="projects-table-body">
            <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">Loading projects...</td></tr>
          </tbody>
        </table>
        <div class="pagination-bar">
          <span id="pagination-info">Showing projects</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-prev-page" disabled>Previous</button>
            <button class="btn btn-secondary btn-sm" id="btn-next-page">Next</button>
          </div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const searchInput = document.getElementById('proj-search-input');
    const sectorFilter = document.getElementById('proj-sector-filter');
    const riskFilter = document.getElementById('proj-risk-filter');

    const handleFilterChange = () => {
      this.filterProjects();
    };

    searchInput?.addEventListener('input', handleFilterChange);
    sectorFilter?.addEventListener('change', handleFilterChange);
    riskFilter?.addEventListener('change', handleFilterChange);

    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTablePage();
      }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      const maxPage = Math.ceil(this.filteredProjects.length / this.pageSize);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderTablePage();
      }
    });
  },

  async loadProjects() {
    try {
      this.projects = await api.getProjects({ limit: 550 });
      this.filteredProjects = [...this.projects];
      this.currentPage = 1;
      this.pageSize = 15;
      this.renderTablePage();
    } catch (err) {
      document.getElementById('projects-table-body').innerHTML = `
        <tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 24px;">Failed to load project records.</td></tr>
      `;
    }
  },

  filterProjects() {
    const q = (document.getElementById('proj-search-input')?.value || '').toLowerCase().trim();
    const sector = document.getElementById('proj-sector-filter')?.value || 'All';
    const risk = document.getElementById('proj-risk-filter')?.value || 'All';

    this.filteredProjects = this.projects.filter(p => {
      const matchSearch = !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.state_name && p.state_name.toLowerCase().includes(q));
      const matchSector = sector === 'All' || p.sector_name === sector;
      const matchRisk = risk === 'All' || p.risk_category === risk;
      return matchSearch && matchSector && matchRisk;
    });

    this.currentPage = 1;
    this.renderTablePage();
  },

  renderTablePage() {
    const tbody = document.getElementById('projects-table-body');
    const countEl = document.getElementById('project-count-indicator');
    const pageInfo = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    if (!this.filteredProjects || this.filteredProjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No matching projects found.</td></tr>`;
      if (countEl) countEl.textContent = '0 projects found';
      if (pageInfo) pageInfo.textContent = 'Page 1 of 1';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    if (countEl) countEl.textContent = `${this.filteredProjects.length} projects`;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, this.filteredProjects.length);
    const pageItems = this.filteredProjects.slice(startIdx, endIdx);
    const maxPage = Math.ceil(this.filteredProjects.length / this.pageSize);

    if (pageInfo) pageInfo.textContent = `Showing ${startIdx + 1}-${endIdx} of ${this.filteredProjects.length}`;
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= maxPage;

    tbody.innerHTML = pageItems.map(p => {
      const badgeClass = p.risk_category === 'High' ? 'badge-risk' : p.risk_category === 'Moderate' ? 'badge-medium' : 'badge-stable';
      const riskColor = p.current_risk_score > 70 ? 'var(--danger)' : p.current_risk_score > 45 ? 'var(--warning)' : 'var(--success)';

      return `
        <tr data-id="${p.id}">
          <td><strong style="color: var(--primary); font-family: monospace;">${p.id}</strong></td>
          <td style="max-width: 280px;">
            <div style="font-weight: 600; color: var(--text-main); line-height: 1.3;">${p.name}</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${p.primary_driver || 'Routine schedule monitoring'}</div>
          </td>
          <td>
            <div>${p.sector_name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${p.ministry_name}</div>
          </td>
          <td>${p.state_name || 'Multi-State'}</td>
          <td>₹${Math.round(p.revised_cost || p.original_cost).toLocaleString('en-IN')} Cr</td>
          <td>
            ${p.expected_delay_months > 0 
              ? `<span style="color: ${p.expected_delay_months > 12 ? 'var(--danger)' : 'var(--warning)'}; font-weight: 600;">+${p.expected_delay_months.toFixed(1)} mo</span>` 
              : `<span style="color: var(--success);">On schedule</span>`
            }
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="badge ${badgeClass}">${p.current_risk_score}</span>
              <span style="font-size: 11px; color: var(--text-muted);">${p.risk_category}</span>
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-secondary btn-sm btn-pulse" data-id="${p.id}" style="margin-right: 4px;">Pulse</button>
            <button class="btn btn-primary btn-sm btn-sim" data-id="${p.id}">Simulate</button>
          </td>
        </tr>
      `;
    }).join('');

    // Row / button click handlers
    tbody.querySelectorAll('.btn-pulse').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.app.navigateTo('pulse', { projectId: id });
      });
    });

    tbody.querySelectorAll('.btn-sim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.app.navigateTo('simulator', { projectId: id });
      });
    });

    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        if (id) this.app.navigateTo('pulse', { projectId: id });
      });
    });
  }
};
