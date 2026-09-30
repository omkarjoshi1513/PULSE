import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Layers, MapPin, Clock, DollarSign } from 'lucide-react';
import { Bottleneck, ProjectSummary } from '../types';
import { fetchBottlenecks, fetchProjects } from '../services/api';

interface BottlenecksProps {
  onSelectProject: (projectId: string) => void;
}

export const Bottlenecks: React.FC<BottlenecksProps> = ({ onSelectProject }) => {
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [selectedBottleneck, setSelectedBottleneck] = useState<Bottleneck | null>(null);
  const [affectedProjects, setAffectedProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchBottlenecks();
        setBottlenecks(data);
        if (data.length > 0) {
          setSelectedBottleneck(data[0]);
          loadProjectsForBottleneck(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadProjectsForBottleneck = async (b: Bottleneck) => {
    try {
      const all = await fetchProjects({ limit: 80 });
      // Filter projects that match the sample IDs or primary driver
      const matched = all.filter(p => 
        b.sample_project_ids.includes(p.id) || 
        p.primary_driver.toLowerCase().includes(b.issue_name.split(' ')[0].toLowerCase())
      );
      setAffectedProjects(matched.length > 0 ? matched : all.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (b: Bottleneck) => {
    setSelectedBottleneck(b);
    loadProjectsForBottleneck(b);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Systemic Bottleneck & Pattern Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Question addressed: <span className="font-semibold text-slate-700">"What keeps going wrong across the national portfolio?"</span> • Multi-project recurring pattern detection
          </p>
        </div>
        <span className="text-xs bg-red-100 text-red-800 font-semibold px-2.5 py-1 rounded border border-red-300">
          5 Systemic Patterns Active
        </span>
      </div>

      {/* Grid: Bottlenecks on Left, Affected Projects on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bottlenecks List */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Portfolio Systemic Hazards
          </div>

          <div className="space-y-3">
            {bottlenecks.map((b) => {
              const isSelected = selectedBottleneck?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelect(b)}
                  className={`p-4 rounded-lg border-2 transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-red-50/70 border-red-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                      {b.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      b.severity === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {b.severity}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1">{b.issue_name}</h3>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Affected Projects</span>
                      <strong className="text-sm font-bold text-red-700">{b.affected_projects_count} projects</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Average Delay</span>
                      <strong className="text-sm font-bold text-slate-900">{b.average_delay_months} months</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Cost at Risk</span>
                      <strong className="text-sm font-bold text-slate-900">₹{b.total_cost_at_risk_cr} Cr</strong>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                    <span className="text-slate-500">Sectors:</span>
                    {b.affected_sectors.map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    <span className="text-slate-500">States:</span>
                    {b.affected_states.map((st, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Bottleneck Deep Dive & Affected Projects */}
        <div className="lg:col-span-6 space-y-4">
          {selectedBottleneck && (
            <>
              {/* Recommendation Card */}
              <div className="bg-slate-900 text-white rounded-lg p-5 shadow-md space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Systemic Policy Intervention
                  </span>
                </div>
                <h2 className="text-base font-bold">{selectedBottleneck.issue_name}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">MoSPI Central Recommendation: </strong>
                  {selectedBottleneck.systemic_recommendation}
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Quarterly Trend: {selectedBottleneck.trend}
                </div>
              </div>

              {/* Affected Projects List */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-xs uppercase text-slate-700">
                    Affected Projects Sample ({affectedProjects.length})
                  </h3>
                  <span className="text-xs text-slate-500">Click to diagnose project pulse</span>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {affectedProjects.map((p) => (
                    <div 
                      key={p.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded transition cursor-pointer"
                      onClick={() => onSelectProject(p.id)}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-900">{p.id}</span>
                          <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.sector_name} • {p.state_name} • Risk: <strong className="text-red-700">{p.current_risk_score}/100</strong>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectProject(p.id); }}
                        className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded hover:bg-blue-800 transition flex items-center space-x-1"
                      >
                        <span>Pulse</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
