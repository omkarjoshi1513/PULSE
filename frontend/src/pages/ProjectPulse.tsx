import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ArrowUpRight, Clock, DollarSign, Activity, 
  ChevronRight, BarChart2, ShieldAlert, Cpu, CheckCircle, 
  HelpCircle, Sliders, FileText, ArrowRight, Info
} from 'lucide-react';
import { ProjectDetail, RiskDriver } from '../types';
import { fetchProjectDetail } from '../services/api';
import { RiskBadge } from '../components/ui/StatusBadge';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, AreaChart, Area 
} from 'recharts';

interface ProjectPulseProps {
  projectId: string;
  onOpenCockpit: (projectId: string) => void;
  onNavigateReports: (projectId: string) => void;
}

export const ProjectPulse: React.FC<ProjectPulseProps> = ({ 
  projectId, onOpenCockpit, onNavigateReports 
}) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<RiskDriver | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchProjectDetail(projectId);
        setProject(data);
        if (data.drivers && data.drivers.length > 0) {
          setSelectedDriver(data.drivers[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-7xl mx-auto">
        <Activity className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm font-medium">Retrieving diagnostic telemetry for {projectId}...</p>
      </div>
    );
  }

  // Prepare SHAP chart data
  const shapData = project.drivers.map(d => ({
    name: d.feature_name,
    score: d.contribution_score,
    rawDriver: d
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold bg-blue-900 text-white px-2.5 py-0.5 rounded">
                {project.id}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {project.sector_name}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {project.ministry_name}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {project.state_name}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                project.status === 'Critical' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-700'
              }`}>
                Status: {project.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500">
              Start: {project.start_date} • Original Target: {project.original_completion_date} • Anticipated COD: <strong className="text-red-700">{project.anticipated_completion_date}</strong>
            </p>
          </div>

          {/* Prominent Risk Score & Trajectory */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <div className="text-left sm:text-right">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Composite Risk Index</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-red-700 font-mono">
                  {project.current_risk_score}
                </span>
                <span className="text-slate-400 font-mono text-sm">/ 100</span>
              </div>
              <div className="text-xs font-bold text-red-700 uppercase tracking-wide">
                {project.risk_category}
              </div>
            </div>

            {/* Risk Movement 54 -> 79 -> 82 */}
            <div className="pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-200 text-xs">
              <div className="text-[11px] text-slate-500 font-medium">Trajectory (Past 3 Cycles):</div>
              <div className="flex items-center space-x-1.5 font-mono font-bold mt-1 text-slate-700">
                {project.risk_trajectory.map((score, i) => (
                  <React.Fragment key={i}>
                    <span className={i === project.risk_trajectory.length - 1 ? 'text-red-600 font-extrabold' : ''}>
                      {score}
                    </span>
                    {i < project.risk_trajectory.length - 1 && <span className="text-slate-400">→</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-1 text-[11px] text-red-700 font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>Escalated (+{project.risk_change} points)</span>
              </div>
            </div>

            {/* Quick Cockpit Action */}
            <button
              onClick={() => onOpenCockpit(project.id)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>Intervention Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A: PROJECT HEALTH */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Cost Overrun Prob */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Cost Overrun Prob</div>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {Math.round(project.cost_risk_prob * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">XGBoost Clf</div>
        </div>

        {/* Time Overrun Prob */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Time Overrun Prob</div>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {Math.round(project.time_risk_prob * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">XGBoost Clf</div>
        </div>

        {/* Expected Additional Cost */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Expected Addl Cost</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            ₹{project.expected_cost_overrun_cr} Cr
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">+{(project.expected_cost_overrun_cr / project.original_cost * 100).toFixed(1)}% base</div>
        </div>

        {/* Expected Delay */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Expected Delay</div>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {project.expected_delay_months} mo
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Confidence: ±1.8 mo</div>
        </div>

        {/* Physical Progress */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Physical Progress</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {project.physical_progress_pct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Actual site work</div>
        </div>

        {/* Planned Progress */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Planned Progress</div>
          <div className="text-lg font-bold font-mono text-slate-700 mt-1">
            {project.planned_progress_pct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Original milestone</div>
        </div>

        {/* Progress Lag */}
        <div className="bg-red-50/60 border border-red-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-red-900">Progress Lag</div>
          <div className="text-lg font-bold font-mono text-red-700 mt-1">
            {project.progress_lag_pct}%
          </div>
          <div className="text-[10px] text-red-700 mt-0.5 font-semibold">Critical deviation</div>
        </div>

        {/* Financial Progress */}
        <div className="bg-white border border-slate-200 rounded p-3 text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Financial Progress</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {project.financial_progress_pct}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">₹{project.cumulative_expenditure} Cr spent</div>
        </div>
      </div>

      {/* SECTION B: WHAT CHANGED? (Critical Early Warning Section) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              What Changed Since Previous Reporting Period?
            </h2>
            <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider animate-pulse">
              Early Warning Detected
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Comparing August 2026 vs September 2026 Telemetry
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.what_changed.map((change, i) => (
            <div 
              key={i} 
              className={`p-3.5 rounded border text-xs ${
                change.severity === 'Critical' 
                  ? 'bg-red-50/70 border-red-300 text-red-900' 
                  : 'bg-amber-50/70 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                <span className="text-slate-800 font-bold">{change.feature_name}</span>
                <span className={`px-1.5 py-0.2 rounded font-mono uppercase text-[9px] ${
                  change.severity === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {change.severity}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">Current Value</div>
                  <div className="text-base font-bold font-mono text-slate-900">{change.current_val}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Previous</div>
                  <div className="text-sm font-mono text-slate-600">{change.previous_val}</div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-mono font-bold text-xs">
                <span>Delta Deviation:</span>
                <span className={change.direction === 'worsened' ? 'text-red-700' : 'text-emerald-700'}>
                  {change.delta_display}
                </span>
              </div>
            </div>
          ))}
        </div>

        {project.early_warning_trigger && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Automated Early-Warning Engine Trigger: </strong>
              <span>{project.early_warning_trigger} Proactive intervention is recommended before the critical path slips further.</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C: WHY IS IT RISKY? (SHAP Explainability View) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Why Is This Project Risky? (Explainable ML / SHAP Attribution)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Contribution of operational features to the elevated risk score of {project.current_risk_score}/100
            </p>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-blue-700 hover:text-blue-900 underline font-medium cursor-pointer"
          >
            {showTechnicalDetails ? 'Hide Model Internals' : 'View Technical Details (SHAP Weights)'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Horizontal Bar Chart */}
          <div className="lg:col-span-7">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Top Risk Drivers (Ranked by SHAP Contribution Score)
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
                    formatter={(val) => [`+${val} risk points`, 'SHAP Attribution']}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="#dc2626" 
                    radius={[0, 4, 4, 0]}
                    onClick={(entry: any) => setSelectedDriver(entry?.payload?.rawDriver || entry?.rawDriver || null)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              Click on any horizontal driver bar to inspect detailed telemetry, target expectations, and root cause notes.
            </p>
          </div>

          {/* Selected Driver Inspection Card */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            {selectedDriver ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{selectedDriver.feature_name}</h3>
                  <span className="text-xs bg-red-100 text-red-800 font-mono font-bold px-2 py-0.5 rounded">
                    +{selectedDriver.contribution_score} pts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Current Observed:</span>
                    <div className="font-bold text-slate-900 font-mono text-sm">{selectedDriver.current_value}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Expected Baseline:</span>
                    <div className="font-bold text-emerald-800 font-mono text-sm">{selectedDriver.expected_value}</div>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 text-[10px]">Historical Trend:</span>
                  <div className="font-semibold text-slate-800">{selectedDriver.historical_trend}</div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                  <strong className="text-slate-900">Diagnostic Finding: </strong>
                  {selectedDriver.description || "Driver contributes significantly to composite model variance."}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Select a risk driver from the chart to inspect.</div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                onClick={() => onOpenCockpit(project.id)}
                className="w-full py-2 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800 transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Simulate Intervention for {selectedDriver?.feature_name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Technical Details Accordion */}
        {showTechnicalDetails && (
          <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded text-xs font-mono space-y-2">
            <div className="text-blue-400 font-bold">XGBoost Ensemble Feature Sensitivities & Base Values:</div>
            <div>• Base expected risk score E[f(x)] = 48.2 (Portfolio Central Baseline)</div>
            <div>• Explainer: shap.TreeExplainer(model=XGBoostRegressor_v2.4, feature_perturbation='interventional')</div>
            <div>• Local attribution sum: ∑ SHAP_values = +33.8 points (yielding current score 82.0)</div>
            <div>• Stratified K-Fold Out-of-Time Validation PR-AUC = 0.892, MAE = 1.14 months</div>
          </div>
        )}
      </div>

      {/* SECTION D: PREDICTION & CONFIDENCE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span>Probabilistic Predictions & Uncertainty Range</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">Model: {project.model_name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Cost Overrun Forecast</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{project.expected_cost_overrun_cr} Cr</div>
            <div className="mt-2 text-xs text-slate-600">
              Probability of overrun: <strong className="text-red-700">{Math.round(project.cost_risk_prob * 100)}%</strong>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Projected revised budget: ₹{(project.revised_cost + project.expected_cost_overrun_cr).toFixed(1)} Cr
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Time Overrun Forecast</div>
            <div className="text-2xl font-bold font-mono text-red-700 mt-1">{project.expected_delay_months} Months</div>
            <div className="mt-2 text-xs text-slate-600">
              Probability of schedule breach: <strong className="text-red-700">{Math.round(project.time_risk_prob * 100)}%</strong>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Modeled completion: <strong>{project.anticipated_completion_date}</strong>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Prediction Confidence Interval (90%)</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {project.confidence_interval_low} - {project.confidence_interval_high} <span className="text-sm font-normal text-slate-500">mo</span>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              Confidence Index: <strong className="text-blue-700">{Math.round(project.prediction_confidence * 100)}%</strong>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center">
              <Info className="w-3 h-3 text-slate-400 mr-1" />
              <span>Uncertainty modeled via conformalized quantile regression</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION E: HISTORICAL MONTHLY TREND */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Historical Monthly Trajectory (Physical vs Planned vs Delay)
            </h2>
            <p className="text-xs text-slate-500">Tracking progress divergence over the previous 6 reporting months</p>
          </div>
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={project.history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_year" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '4px' }} />
              <Line type="monotone" dataKey="planned_progress_pct" stroke="#3b82f6" strokeWidth={2} name="Planned Progress %" />
              <Line type="monotone" dataKey="physical_progress_pct" stroke="#10b981" strokeWidth={2} name="Physical Progress %" />
              <Line type="monotone" dataKey="risk_score" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" name="Risk Score" />
              <Line type="monotone" dataKey="delay_months" stroke="#8b5cf6" strokeWidth={2} name="Delay (Months)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION F: PEER BENCHMARK */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Peer Sector Benchmark Comparison
            </h2>
            <p className="text-xs text-slate-500">
              Benchmarking {project.id} against {project.benchmark.peer_count} peer projects in {project.sector_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500">Average Peer Risk Score</span>
            <div className="text-2xl font-bold font-mono text-slate-700 mt-1">{project.benchmark.avg_peer_risk}</div>
            <div className="mt-2 text-xs text-red-700 font-semibold">
              This Project: {project.current_risk_score} (+{(project.current_risk_score - project.benchmark.avg_peer_risk).toFixed(1)} pts above peer average)
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500">Average Peer Delay</span>
            <div className="text-2xl font-bold font-mono text-slate-700 mt-1">{project.benchmark.avg_peer_delay_months} mo</div>
            <div className="mt-2 text-xs text-red-700 font-semibold">
              This Project: {project.expected_delay_months} mo (+{(project.expected_delay_months - project.benchmark.avg_peer_delay_months).toFixed(1)} mo slower)
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500">Risk Percentile in Sector</span>
            <div className="text-2xl font-bold font-mono text-red-700 mt-1">{project.benchmark.risk_percentile}th</div>
            <div className="mt-2 text-xs text-slate-600">
              Among top {100 - project.benchmark.risk_percentile}% most critical sector projects
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div>
          <div className="font-bold text-sm">Next Step: Proactive Decision Support</div>
          <div className="text-xs text-slate-300">
            Simulate corrective interventions or run optimization to determine feasible packages under budget constraints.
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => onNavigateReports(project.id)}
            className="px-3.5 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded transition font-medium cursor-pointer"
          >
            Review Brief Report
          </button>
          <button
            onClick={() => onOpenCockpit(project.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <span>Open Intervention Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
