import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, TrendingUp, DollarSign, Clock, ShieldAlert, 
  ArrowUpRight, ArrowRight, Filter, ChevronRight, FileText, CheckSquare, Search
} from 'lucide-react';
import { PortfolioKPIs, HeatmapCell, WhatChangedItem, ProjectSummary } from '../types';
import { fetchKPIs, fetchHeatmap, fetchWhatChanged, fetchProjects } from '../services/api';
import { RiskBadge } from '../components/ui/StatusBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CommandCenterProps {
  onSelectProject: (projectId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onSelectProject, onNavigateTab }) => {
  const [kpis, setKpis] = useState<PortfolioKPIs | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [whatChanged, setWhatChanged] = useState<WhatChangedItem[]>([]);
  const [highRiskProjects, setHighRiskProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Heatmap
  const [selectedMinistry, setSelectedMinistry] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  // Search in table
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiRes, hmRes, wcRes, projRes] = await Promise.all([
          fetchKPIs(),
          fetchHeatmap(selectedMinistry, selectedSector, selectedState),
          fetchWhatChanged(),
          fetchProjects({ limit: 120 })
        ]);
        setKpis(kpiRes);
        setHeatmap(hmRes);
        setWhatChanged(wcRes);
        setHighRiskProjects(projRes);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedMinistry, selectedSector, selectedState]);

  // Sample portfolio risk historical trend
  const trendData = [
    { month: 'Apr 2026', avgRisk: 42, highRiskCount: 61, earlyWarnings: 8 },
    { month: 'May 2026', avgRisk: 44, highRiskCount: 68, earlyWarnings: 11 },
    { month: 'Jun 2026', avgRisk: 47, highRiskCount: 74, earlyWarnings: 14 },
    { month: 'Jul 2026', avgRisk: 50, highRiskCount: 82, earlyWarnings: 19 },
    { month: 'Aug 2026', avgRisk: 52, highRiskCount: 87, earlyWarnings: 21 },
    { month: 'Sep 2026', avgRisk: 54, highRiskCount: 92, earlyWarnings: 26 },
  ];

  const filteredProjects = highRiskProjects.filter(p => {
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      return p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.state_name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portfolio Command Center</h1>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              National Infrastructure Overview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Question addressed: <span className="font-semibold text-slate-700">"Where should decision-makers look?"</span> • Cycle: September 2026
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('projects')}
            className="px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer font-medium"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('bottlenecks')}
            className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded hover:bg-amber-100 transition flex items-center space-x-1.5 cursor-pointer font-medium"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Open Bottleneck Analysis</span>
          </button>
          <button
            onClick={() => onNavigateTab('action-hub')}
            className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-300 rounded hover:bg-blue-100 transition flex items-center space-x-1.5 cursor-pointer font-medium"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
            <span>Review Pending Actions</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition flex items-center space-x-1.5 cursor-pointer font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Executive Briefs</span>
          </button>
        </div>
      </div>

      {/* Official MoSPI Benchmark Banner */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-200 px-2 py-0.5 rounded">
            MoSPI PAIMANA Benchmark Frame
          </span>
          <span>1,981 Ongoing Projects</span>
          <span>•</span>
          <span>17 Ministries</span>
          <span>•</span>
          <span>22 Infrastructure Sectors</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px]">
          <span>Original Cost: <strong className="text-slate-800">₹37.13 Lakh Cr</strong></span>
          <span>Revised: <strong className="text-red-700">₹42.78 Lakh Cr</strong></span>
          <span>Exp: <strong className="text-slate-800">₹20.36 Lakh Cr</strong></span>
        </div>
      </div>

      {/* A. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex justify-between items-start text-slate-500 text-xs font-medium">
            <span>Actively Monitored</span>
            <span className="text-[11px] font-mono text-slate-400">Sample/Live</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.total_projects || 520}</span>
            <span className="text-xs text-slate-500">/ 1,981 total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-700 font-semibold">{kpis?.stable_projects || 270}</span> stable • 
            <span className="text-amber-700 font-semibold ml-1">{kpis?.monitor_projects || 165}</span> monitor
          </div>
        </div>

        {/* High Risk Projects */}
        <div className="bg-red-50/50 border border-red-200 rounded-lg p-4 shadow-2xs">
          <div className="flex justify-between items-start text-red-900 text-xs font-semibold">
            <span>High Risk Projects</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-700">{kpis?.high_risk_projects || 85}</span>
            <span className="text-xs text-red-800 font-medium font-mono">Score ≥ 70</span>
          </div>
          <div className="mt-2 text-[11px] text-red-700 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1 text-red-600" />
            <span>+14 projects this quarter</span>
          </div>
        </div>

        {/* Cost at Risk */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex justify-between items-start text-slate-500 text-xs font-medium">
            <span>Projected Cost Overrun</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">₹{(kpis?.cost_at_risk_cr || 14250).toLocaleString()} Cr</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across flagged critical corridor packages
          </div>
        </div>

        {/* Average Delay */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex justify-between items-start text-slate-500 text-xs font-medium">
            <span>Average Schedule Delay</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.average_delay_months || 5.8} <span className="text-sm font-normal text-slate-500">mo</span></span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Projected from XGBoost early signals
          </div>
        </div>

        {/* Projects Requiring Action */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 shadow-2xs">
          <div className="flex justify-between items-start text-amber-900 text-xs font-semibold">
            <span>Actions Pending Decision</span>
            <CheckSquare className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-800">{kpis?.projects_requiring_action || 42}</span>
            <span className="text-xs text-amber-700 font-medium">Awaiting Officer</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800">
            Proactive intervention options ready
          </div>
        </div>
      </div>

      {/* Grid: Risk Trend & "What Changed This Month" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Portfolio Risk Movement (6-Month Trajectory)</h2>
              <p className="text-xs text-slate-500">Monthly average composite risk index vs high-risk project counts</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5 inline-block"></span>Avg Risk Score</span>
              <span className="flex items-center text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5 inline-block"></span>High Risk Count</span>
            </div>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[20, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
                />
                <Area type="monotone" dataKey="avgRisk" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" name="Avg Risk Score" />
                <Area type="monotone" dataKey="highRiskCount" stroke="#dc2626" strokeWidth={2} strokeDasharray="4 4" fill="none" name="High Risk Projects" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
            <span>Trend Assessment: <strong>Upward Risk Drift</strong> (+12 pts over Q1-Q2 due to monsoon & clearance backlogs)</span>
            <span className="text-blue-700 font-medium">Model: XGBoost Ensemble Early-Warning</span>
          </div>
        </div>

        {/* E. "What Changed This Month" Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>What Changed This Month?</span>
              </h2>
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                Early Alerts Active
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {whatChanged.map((wc, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded border text-xs ${
                    wc.severity === 'critical' 
                      ? 'bg-red-50/70 border-red-200 text-red-900' 
                      : wc.severity === 'high'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{wc.category}</span>
                    <span className="font-mono text-[10px] uppercase font-bold">{wc.severity}</span>
                  </div>
                  <div className="mt-1 text-slate-700 font-medium">{wc.headline}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onSelectProject('P10291')}
              className="w-full py-2 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>Inspect Hero Alert: P10291 (Western Corridor)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* B. Risk Heatmap Concentration */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Portfolio Risk Concentration Matrix (Sector vs State)</h2>
            <p className="text-xs text-slate-500">Color density represents average risk score and high-risk concentration</p>
          </div>
          {/* Heatmap Filters */}
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 text-xs"
            >
              <option value="All">All Sectors</option>
              <option value="Roads & Highways">Roads & Highways</option>
              <option value="Railways">Railways</option>
              <option value="Power & Renewable Energy">Power & Renewable Energy</option>
              <option value="Urban Transport / Metro">Urban Transport / Metro</option>
              <option value="Coal & Mining">Coal & Mining</option>
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 text-xs"
            >
              <option value="All">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Odisha">Odisha</option>
            </select>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {heatmap.slice(0, 18).map((cell, idx) => {
            const isHigh = cell.avg_risk_score >= 70;
            const isMed = cell.avg_risk_score >= 45 && cell.avg_risk_score < 70;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded border text-xs transition cursor-pointer hover:shadow-xs ${
                  isHigh
                    ? 'bg-red-50 border-red-300 text-red-900 hover:bg-red-100'
                    : isMed
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                }`}
                onClick={() => {
                  // filter table
                  setTableSearch(cell.state);
                }}
              >
                <div className="font-semibold truncate" title={cell.sector}>{cell.sector}</div>
                <div className="text-[11px] text-slate-600 truncate">{cell.state}</div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <span className="font-bold text-sm">{cell.avg_risk_score}</span>
                  <span className="text-[10px] text-slate-500">{cell.project_count} proj</span>
                </div>
                {cell.high_risk_count > 0 && (
                  <div className="mt-1 text-[10px] text-red-700 font-semibold">
                    {cell.high_risk_count} critical
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* C. High-Risk Project Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Critical Infrastructure Watchlist</h2>
            <p className="text-xs text-slate-500">Sorted by risk escalation and modeled overrun probability</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, name, state..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
            {tableSearch && (
              <button 
                onClick={() => setTableSearch('')}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table adhering to modern-web-guidance for responsive tables */}
        <div className="table-wrapper mt-3 border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left table-dense">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Ministry / Sector</th>
                <th>State</th>
                <th className="text-center">Risk Score</th>
                <th>Cost Risk</th>
                <th>Time Risk</th>
                <th>Trend</th>
                <th>Primary Driver</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.slice(0, 10).map((proj) => {
                const isHero = proj.id === 'P10291';
                return (
                  <tr 
                    key={proj.id}
                    className={`transition ${isHero ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50'}`}
                  >
                    <td className="font-mono font-bold text-blue-900">
                      <div className="flex items-center space-x-1">
                        <span>{proj.id}</span>
                        {isHero && (
                          <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded uppercase font-bold tracking-wider">
                            Hero
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-medium text-slate-900 max-w-xs truncate" title={proj.name}>
                      {proj.name}
                    </td>
                    <td>
                      <div className="text-[11px] text-slate-700">{proj.sector_name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{proj.ministry_name}</div>
                    </td>
                    <td className="text-slate-600 text-xs">{proj.state_name}</td>
                    <td className="text-center">
                      <RiskBadge score={proj.current_risk_score} category={proj.risk_category} />
                    </td>
                    <td className="font-mono text-xs">
                      {Math.round(proj.cost_risk_prob * 100)}%
                    </td>
                    <td className="font-mono text-xs">
                      {Math.round(proj.time_risk_prob * 100)}%
                    </td>
                    <td className="font-mono text-xs font-semibold">
                      <span className={proj.risk_change > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {proj.risk_change > 0 ? `+${proj.risk_change}` : proj.risk_change}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700 max-w-[140px] truncate" title={proj.primary_driver}>
                      {proj.primary_driver}
                    </td>
                    <td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        proj.status === 'Critical'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : proj.status === 'Under Review'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectProject(proj.id)}
                        className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded hover:bg-blue-800 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Diagnose</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 10 of {filteredProjects.length} critical projects</span>
          <button
            onClick={() => onNavigateTab('projects')}
            className="text-blue-700 hover:underline font-semibold"
          >
            View All 520 Projects in Full Registry →
          </button>
        </div>
      </div>
    </div>
  );
};
