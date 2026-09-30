import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, Layers, AlertTriangle } from 'lucide-react';
import { ProjectSummary } from '../types';
import { fetchProjects } from '../services/api';
import { RiskBadge } from '../components/ui/StatusBadge';

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ministry, setMinistry] = useState('All');
  const [sector, setSector] = useState('All');
  const [riskCategory, setRiskCategory] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchProjects({
          search: search || undefined,
          ministry: ministry !== 'All' ? ministry : undefined,
          sector: sector !== 'All' ? sector : undefined,
          risk_category: riskCategory !== 'All' ? riskCategory : undefined,
          limit: 150
        });
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [search, ministry, sector, riskCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-slate-700" />
            <span>Infrastructure Projects Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete database of ongoing central sector projects monitored under the PAIMANA framework
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Project ID, title, or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={riskCategory}
            onChange={(e) => setRiskCategory(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 text-xs"
          >
            <option value="All">All Risk Levels</option>
            <option value="High Risk">High Risk (≥ 70)</option>
            <option value="Monitor">Monitor (40 - 69)</option>
            <option value="Stable">Stable (&lt; 40)</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 text-xs"
          >
            <option value="All">All Sectors</option>
            <option value="Roads & Highways">Roads & Highways</option>
            <option value="Railways">Railways</option>
            <option value="Power & Renewable Energy">Power & Renewable Energy</option>
            <option value="Urban Transport / Metro">Urban Transport / Metro</option>
            <option value="Coal & Mining">Coal & Mining</option>
            <option value="Ports & Shipping">Ports & Shipping</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="table-wrapper">
          <table className="w-full text-left table-dense">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Sector</th>
                <th>State</th>
                <th>Cost (Orig / Rev)</th>
                <th className="text-center">Risk Score</th>
                <th>Overrun Prob</th>
                <th>Exp Delay</th>
                <th>Primary Bottleneck</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => {
                const isHero = proj.id === 'P10291';
                return (
                  <tr 
                    key={proj.id}
                    className={`transition ${isHero ? 'bg-amber-50/70 font-medium' : 'hover:bg-slate-50'}`}
                  >
                    <td className="font-mono font-bold text-blue-900">
                      <div className="flex items-center space-x-1">
                        <span>{proj.id}</span>
                        {isHero && (
                          <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded uppercase font-bold">
                            Hero
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-slate-900 max-w-sm truncate font-medium" title={proj.name}>
                      {proj.name}
                    </td>
                    <td className="text-slate-600 text-xs">{proj.sector_name}</td>
                    <td className="text-slate-600 text-xs">{proj.state_name}</td>
                    <td className="font-mono text-xs">
                      ₹{proj.original_cost} / ₹{proj.revised_cost} Cr
                    </td>
                    <td className="text-center">
                      <RiskBadge score={proj.current_risk_score} category={proj.risk_category} />
                    </td>
                    <td className="font-mono text-xs text-slate-700">
                      Cost: {Math.round(proj.cost_risk_prob * 100)}% | Time: {Math.round(proj.time_risk_prob * 100)}%
                    </td>
                    <td className="font-mono text-xs text-slate-800">
                      {proj.expected_delay_months} mo
                    </td>
                    <td className="text-xs text-slate-600 max-w-[150px] truncate" title={proj.primary_driver}>
                      {proj.primary_driver}
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectProject(proj.id)}
                        className="text-xs bg-slate-800 text-white px-3 py-1 rounded hover:bg-blue-800 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Open Pulse</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Loaded {projects.length} infrastructure projects</span>
          <span className="font-mono text-[11px]">Database Source: MoSPI Synthetic Corpus (520 Records)</span>
        </div>
      </div>
    </div>
  );
};
