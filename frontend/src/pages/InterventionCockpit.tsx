import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, Check, Plus, Sliders, DollarSign, Users, 
  Clock, ShieldAlert, Sparkles, AlertCircle, ArrowRight, 
  Send, Layers, CheckCircle2, RotateCcw
} from 'lucide-react';
import { 
  Intervention, SimulationResponse, OptimizationResponse, ProjectDetail 
} from '../types';
import { 
  fetchInterventions, runSimulation, runOptimization, 
  createAction, fetchProjectDetail 
} from '../services/api';
import { RiskBadge } from '../components/ui/StatusBadge';

interface InterventionCockpitProps {
  projectId: string;
  onActionCreated: (actionId: string) => void;
}

export const InterventionCockpit: React.FC<InterventionCockpitProps> = ({ 
  projectId, onActionCreated 
}) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  
  // Optimization constraints
  const [availableBudget, setAvailableBudget] = useState<number>(100);
  const [availableManpower, setAvailableManpower] = useState<number>(50);
  const [priorityLevel, setPriorityLevel] = useState<string>('High');
  const [optimization, setOptimization] = useState<OptimizationResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter intervention categories
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [projData, intsData] = await Promise.all([
          fetchProjectDetail(projectId),
          fetchInterventions()
        ]);
        setProject(projData);
        setInterventions(intsData);

        // Run baseline simulation initially
        const initialSim = await runSimulation(projectId, []);
        setSimulation(initialSim);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [projectId]);

  // Handle toggling an intervention for What-If simulation
  const handleToggleIntervention = async (id: string) => {
    let nextIds: string[];
    if (selectedIds.includes(id)) {
      nextIds = selectedIds.filter(i => i !== id);
    } else {
      nextIds = [...selectedIds, id];
    }
    setSelectedIds(nextIds);

    try {
      setSimulating(true);
      const res = await runSimulation(projectId, nextIds);
      setSimulation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Run Constraint Optimization (Step 8 in Demo Scenario)
  const handleRunOptimization = async () => {
    try {
      setOptimizing(true);
      const res = await runOptimization(projectId, availableBudget, availableManpower, priorityLevel);
      setOptimization(res);

      // Auto-select recommended interventions in simulation
      const recIds = res.recommended_interventions.map(i => i.id);
      setSelectedIds(recIds);
      const simRes = await runSimulation(projectId, recIds);
      setSimulation(simRes);
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(false);
    }
  };

  // Human Officer Approval: Create entry in Action Hub
  const handleApproveIntervention = async () => {
    if (!simulation || selectedIds.length === 0) return;

    try {
      const selectedNames = simulation.simulated.intervention_names.join(' + ');
      const newAction = await createAction({
        project_id: projectId,
        intervention_name: selectedNames,
        intervention_category: 'Multi-Criteria Intervention Package',
        expected_impact_summary: `Modeled risk reduction: -${simulation.risk_reduction_points} pts, time saved: ${simulation.time_saved_months} months, cost avoided: ₹${simulation.cost_avoided_cr} Cr.`,
        deadline: '2026-11-30',
        assigned_officer: 'Project Monitoring Officer (MoSPI)',
        estimated_cost_cr: simulation.total_intervention_cost_cr,
        predicted_time_saving_months: simulation.time_saved_months,
        predicted_cost_saving_cr: simulation.cost_avoided_cr,
        notes: `Authorized under budget limit of ₹${availableBudget} Cr. Feasible package verified by optimization engine.`
      });

      setActionSuccess(`Action ${newAction.id} successfully authorized and logged into the Action Hub!`);
      setTimeout(() => {
        onActionCreated(newAction.id);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInterventions = categoryFilter === 'All' 
    ? interventions 
    : interventions.filter(i => i.category === categoryFilter);

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-7xl mx-auto">
        <Sliders className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading Intervention Cockpit workspace for {projectId}...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
              {project.id}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intervention Cockpit</h1>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold border border-amber-300">
              Hero Decision Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Question addressed: <span className="font-semibold text-slate-700">"What should we do?"</span> • Testing corrective interventions under budget constraints
          </p>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* TOP STATE BAR: CURRENT BASELINE vs SIMULATED IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline: DO NOTHING SCENARIO */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Baseline Scenario</span>
              <h2 className="text-base font-extrabold text-slate-900">DO NOTHING</h2>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Current Trajectory
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Baseline Risk</span>
              <div className="text-xl font-bold font-mono text-red-700 mt-1">{project.current_risk_score}</div>
              <span className="text-[10px] text-red-600 font-medium">Critical Overrun</span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Expected Delay</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{project.expected_delay_months} mo</div>
              <span className="text-[10px] text-slate-400">Schedule slippage</span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Cost Impact</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{project.expected_cost_overrun_cr} Cr</div>
              <span className="text-[10px] text-slate-400">Unbudgeted burden</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 italic">
            Baseline scenario models project outcome if no administrative or capital interventions are mobilized.
          </div>
        </div>

        {/* SIMULATED OUTCOME */}
        <div className="bg-blue-50/60 border-2 border-blue-400 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">What-If Simulation</span>
              <h2 className="text-base font-extrabold text-blue-950">
                {selectedIds.length === 0 ? "Select Interventions Below" : `Active Package (${selectedIds.length} Selected)`}
              </h2>
            </div>
            <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono font-semibold">
              Projected Impact
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded border border-blue-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Simulated Risk</span>
              <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                {simulation ? simulation.simulated.risk_score : project.current_risk_score}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">
                {simulation?.risk_reduction_points ? `-${simulation.risk_reduction_points} points` : 'No change'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-blue-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Simulated Delay</span>
              <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                {simulation ? simulation.simulated.expected_delay_months : project.expected_delay_months} mo
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">
                {simulation?.time_saved_months ? `${simulation.time_saved_months} mo saved` : '0 mo saved'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-blue-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Potential Cost Avoided</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                ₹{simulation ? simulation.cost_avoided_cr : 0} Cr
              </div>
              <span className="text-[10px] text-slate-500">
                Outlay: ₹{simulation ? simulation.total_intervention_cost_cr : 0} Cr
              </span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-blue-900/80 font-medium flex items-center justify-between">
            <span>Projected impact under modeled XGBoost & SHAP assumptions. Not causal proof.</span>
            {selectedIds.length > 0 && (
              <button
                onClick={() => { setSelectedIds([]); runSimulation(projectId, []).then(setSimulation); }}
                className="text-xs text-red-600 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Selection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONSTRAINTS & OPTIMIZATION PANEL (Step 8 in Demo Scenario) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Constraint-Based Intervention Optimization Engine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministically identifies optimal combinations respecting fiscal and manpower caps
            </p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
            Combinatorial Linear Solver
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 items-end">
          {/* Available Budget Slider / Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              <span>Available Budget Cap</span>
              <span className="font-mono text-blue-900 font-bold">₹{availableBudget} Cr</span>
            </label>
            <input
              type="range"
              min={20}
              max={200}
              step={5}
              value={availableBudget}
              onChange={(e) => setAvailableBudget(Number(e.target.value))}
              className="w-full mt-2 accent-blue-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹20 Cr</span>
              <span>Default: ₹100 Cr</span>
              <span>₹200 Cr</span>
            </div>
          </div>

          {/* Available Manpower Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              <span>Available Officers / Teams</span>
              <span className="font-mono text-blue-900 font-bold">{availableManpower} personnel</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={availableManpower}
              onChange={(e) => setAvailableManpower(Number(e.target.value))}
              className="w-full mt-2 accent-blue-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10</span>
              <span>Default: 50</span>
              <span>100</span>
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Optimization Goal</label>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(e.target.value)}
              className="w-full mt-1.5 border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800"
            >
              <option value="High">Balanced (Risk + Schedule)</option>
              <option value="Time">Schedule Priority (Maximize Months Saved)</option>
              <option value="Cost">Fiscal Priority (Maximize ₹ Avoided)</option>
            </select>
          </div>

          {/* Run Button */}
          <div>
            <button
              onClick={handleRunOptimization}
              disabled={optimizing}
              className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{optimizing ? 'Solving Constraints...' : 'Identify Feasible Package'}</span>
            </button>
          </div>
        </div>

        {/* Optimization Output Card (if generated) */}
        {optimization && (
          <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-emerald-950 uppercase text-[11px] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Recommended Optimal Feasible Combination</span>
              </span>
              <span className="font-mono text-emerald-800 font-semibold">
                Budget Utilized: ₹{optimization.total_cost_cr} Cr / ₹{availableBudget} Cr (₹{optimization.remaining_budget_cr} Cr Remaining)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {optimization.recommended_interventions.map((rec) => (
                <div key={rec.id} className="bg-white p-2.5 rounded border border-emerald-200">
                  <div className="font-bold text-slate-900">{rec.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cost: ₹{rec.estimated_cost_cr} Cr • Teams: {rec.required_manpower}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    -{rec.max_risk_reduction} pts • {rec.expected_time_saved_months} mo saved
                  </div>
                </div>
              ))}
            </div>

            <div className="text-slate-800 leading-relaxed bg-white/70 p-2.5 rounded border border-emerald-200">
              <strong className="text-slate-900">Optimization Rationale: </strong>
              {optimization.explanation}
            </div>
          </div>
        )}
      </div>

      {/* MULTI-INTERVENTION SCENARIO COMPARISON TABLE */}
      {simulation && simulation.comparisons && simulation.comparisons.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Scenario Comparison Table (Do Nothing vs Options vs Combined)
            </h2>
            <span className="text-xs text-slate-500">Comparative decision matrix</span>
          </div>

          <div className="table-wrapper mt-3 border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left table-dense">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Interventions Included</th>
                  <th>Projected Risk</th>
                  <th>Risk Reduction</th>
                  <th>Expected Delay</th>
                  <th>Time Saved</th>
                  <th>Cost Impact</th>
                  <th>Intervention Outlay</th>
                </tr>
              </thead>
              <tbody>
                {simulation.comparisons.map((c, i) => (
                  <tr 
                    key={i} 
                    className={c.is_baseline ? 'bg-slate-50' : (c.scenario_name.includes('Combined') ? 'bg-blue-50/50 font-medium' : '')}
                  >
                    <td className="font-semibold text-slate-900">
                      {c.scenario_name}
                      {c.is_baseline && <span className="ml-2 text-[10px] text-slate-500 font-normal">(Baseline)</span>}
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate">
                      {c.intervention_names.join(', ')}
                    </td>
                    <td className="font-mono font-bold">
                      <RiskBadge score={c.risk_score} showIcon={false} />
                    </td>
                    <td className="font-mono text-emerald-700 font-semibold">
                      {c.risk_reduction_points > 0 ? `-${c.risk_reduction_points} pts` : '-'}
                    </td>
                    <td className="font-mono text-xs">{c.expected_delay_months} mo</td>
                    <td className="font-mono text-emerald-700 font-semibold">
                      {c.time_saved_months > 0 ? `${c.time_saved_months} mo` : '-'}
                    </td>
                    <td className="font-mono text-xs">₹{c.expected_cost_impact_cr} Cr</td>
                    <td className="font-mono text-xs text-slate-700">₹{c.total_cost_cr} Cr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERVENTION LIBRARY */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Intervention Library (Select to simulate what-if impact)
            </h2>
            <p className="text-xs text-slate-500">
              12 realistic administrative, operational, contractual, and procurement interventions
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 text-xs">
            {['All', 'Administrative', 'Operational', 'Financial', 'Contractual', 'Procurement'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  categoryFilter === cat
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredInterventions.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleIntervention(item.id)}
                className={`p-4 rounded-lg border-2 transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                      {item.category}
                    </span>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2">{item.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  
                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    <strong>Applicable: </strong>{item.applicable_conditions}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Est Cost</span>
                    <strong className="text-slate-800">₹{item.estimated_cost_cr} Cr</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Risk Red</span>
                    <strong className="text-emerald-700">-{item.max_risk_reduction} pts</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Time Saved</span>
                    <strong className="text-emerald-700">{item.expected_time_saved_months} mo</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HUMAN OFFICER DECISION BAR (Step 10 in Demo Scenario) */}
      <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md sticky bottom-4 z-40">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
              Human-in-the-Loop Governance
            </span>
            <span className="text-xs text-slate-400">
              Authority: Dr. Vikram Sharma, Project Monitoring Officer (MoSPI)
            </span>
          </div>
          <div className="text-sm font-semibold mt-1">
            {selectedIds.length > 0 
              ? `Ready to authorize ${selectedIds.length} intervention(s) (Est. Outlay: ₹${simulation?.total_intervention_cost_cr || 0} Cr)`
              : "Select interventions or run optimization above to authorize corrective action."
            }
          </div>
        </div>

        <button
          onClick={handleApproveIntervention}
          disabled={selectedIds.length === 0}
          className={`px-5 py-2.5 rounded font-bold text-xs transition flex items-center space-x-2 cursor-pointer shadow ${
            selectedIds.length > 0 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Approve & Forward to Action Hub</span>
        </button>
      </div>
    </div>
  );
};
