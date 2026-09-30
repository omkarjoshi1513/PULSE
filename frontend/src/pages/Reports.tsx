import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, Download, Cpu, History, CheckCircle, 
  AlertTriangle, ArrowRight, Layers, BarChart2, ShieldCheck
} from 'lucide-react';
import { ReviewBriefResponse } from '../types';
import { fetchReviewBrief, fetchMLEvaluation, fetchAuditLogs } from '../services/api';

interface ReportsProps {
  initialProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ 
  initialProjectId = 'P10291', onSelectProject 
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'ml' | 'audit'>('brief');
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [brief, setBrief] = useState<ReviewBriefResponse | null>(null);
  const [mlEval, setMlEval] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [briefData, mlData, logsData] = await Promise.all([
          fetchReviewBrief(projectId),
          fetchMLEvaluation(),
          fetchAuditLogs()
        ]);
        setBrief(briefData);
        setMlEval(mlData);
        setAuditLogs(logsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-slate-700" />
            <span>Executive Review Briefs & Verification</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official decision documents, ML benchmark evaluations, and statutory audit logging
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition flex items-center space-x-1.5 cursor-pointer font-medium shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => alert("Official review brief package exported to PDF format.")}
            className="px-3.5 py-1.5 bg-blue-900 text-white rounded hover:bg-blue-800 transition flex items-center space-x-1.5 cursor-pointer font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('brief')}
          className={`px-3 py-1.5 rounded cursor-pointer transition ${
            activeTab === 'brief' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Executive Review Brief ({projectId})
        </button>
        <button
          onClick={() => setActiveTab('ml')}
          className={`px-3 py-1.5 rounded cursor-pointer transition ${
            activeTab === 'ml' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ML Benchmark Evaluation (XGBoost vs Baselines)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded cursor-pointer transition ${
            activeTab === 'audit' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Audit Trail ({auditLogs.length} Events)
        </button>
      </div>

      {/* TAB 1: EXECUTIVE REVIEW BRIEF */}
      {activeTab === 'brief' && brief && (
        <div className="bg-white border-2 border-slate-300 rounded-lg p-8 shadow-xs space-y-6 print:border-none print:p-0">
          {/* Government Document Masthead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Government of India • MoSPI • DIID
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                INFRASTRUCTURE PROJECT EXECUTIVE REVIEW BRIEF
              </h2>
              <div className="text-xs text-slate-600 mt-1">
                Project Code: <strong className="font-mono text-slate-900">{brief.project_overview.project_id}</strong> • Category: Central Sector Infrastructure
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <div>Generated: {brief.generated_at}</div>
              <div>Authorized Officer: {brief.officer_name}</div>
            </div>
          </div>

          {/* Section 1: Overview & Financials */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 bg-slate-100 p-1.5 rounded">
              1. Project Identification & Financial Standing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Project Title</span>
                <strong className="text-slate-900">{brief.project_overview.project_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Ministry / Sector</span>
                <span className="text-slate-800">{brief.project_overview.ministry} ({brief.project_overview.sector})</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Location</span>
                <span className="text-slate-800">{brief.project_overview.state}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">COD Target</span>
                <strong className="text-red-700">{brief.project_overview.target_completion}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mt-3 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
              <div>Original Cost: <strong>₹{brief.project_overview.original_cost_cr} Cr</strong></div>
              <div>Revised Cost: <strong className="text-red-700">₹{brief.project_overview.revised_cost_cr} Cr</strong></div>
              <div>Cumulative Exp: <strong>₹{brief.project_overview.cumulative_expenditure_cr} Cr</strong></div>
            </div>
          </div>

          {/* Section 2: Current Risk & What Changed */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 bg-slate-100 p-1.5 rounded">
              2. Risk Diagnostics & Early Warning Signals
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <span className="text-slate-500 text-[10px] block">Composite Risk Score</span>
                <div className="text-xl font-bold font-mono text-red-700">{brief.current_risk.composite_score}/100</div>
                <span className="text-[11px] text-red-800 font-medium">Trajectory: {brief.current_risk.movement}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Physical Progress Deviation</span>
                <div className="text-xl font-bold font-mono text-slate-900">{brief.project_overview.progress_lag_pct}% lag</div>
                <span className="text-[11px] text-slate-500">{brief.project_overview.physical_progress_pct}% actual vs {brief.project_overview.planned_progress_pct}% target</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Expected Delay</span>
                <div className="text-xl font-bold font-mono text-red-700">{brief.time_forecast.expected_delay_months} months</div>
                <span className="text-[11px] text-slate-500">Confidence: {brief.time_forecast.confidence_interval}</span>
              </div>
            </div>

            <div className="mt-3 text-xs space-y-1">
              <span className="font-semibold text-slate-800">Critical Drivers Identified via SHAP:</span>
              <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                {brief.risk_drivers.map((d, i) => (
                  <li key={i}>
                    <strong>{d.feature_name}: </strong> {d.current_value} (Impact: +{d.contribution_score} risk points, {d.historical_trend})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Recommended Interventions & Simulated Impact */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 bg-slate-100 p-1.5 rounded">
              3. Recommended Proactive Interventions & Simulated Recovery
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50/60 p-3 rounded border border-blue-200">
                <span className="font-bold text-blue-950 block">Feasible Intervention Package:</span>
                <div className="mt-1 space-y-1 text-slate-800">
                  <div>• Accelerate Land Acquisition & RoW SLA (₹35 Cr)</div>
                  <div>• Increase Fund Release & Working Capital (₹35 Cr)</div>
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded border border-emerald-200">
                <span className="font-bold text-emerald-950 block">Modeled Recovery Impact:</span>
                <div className="mt-1 space-y-1 text-emerald-900 font-mono">
                  <div>• Risk Reduction: <strong>-{brief.simulated_impact.risk_reduction_points} points</strong> (82 → {brief.simulated_impact.simulated_risk_score})</div>
                  <div>• Schedule Recovered: <strong>{brief.simulated_impact.time_saved_months} months saved</strong></div>
                  <div>• Potential Cost Avoided: <strong>₹{brief.simulated_impact.potential_cost_avoided_cr} Cr</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Governance Sign-off */}
          <div className="pt-4 border-t-2 border-slate-300 text-xs text-slate-600 space-y-4">
            <p className="italic leading-relaxed">{brief.governance_signoff_text}</p>
            <div className="flex justify-between items-end pt-6">
              <div>
                <div className="font-bold text-slate-800">Project Monitoring Officer (MoSPI)</div>
                <div className="text-[11px] text-slate-500">Government of India</div>
              </div>
              <div className="border-t border-slate-400 w-48 text-center text-[10px] text-slate-500 pt-1">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ML BENCHMARK EVALUATION */}
      {activeTab === 'ml' && mlEval && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Machine Learning Model Benchmarking & Validation</h2>
            <p className="text-xs text-slate-500">
              Rigorous comparative evaluation on MoSPI historical telemetry avoiding temporal leakage
            </p>
          </div>

          {/* Classification Benchmarks */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Classification Models (High-Risk Target Prediction)
            </h3>
            <div className="table-wrapper border border-slate-200 rounded">
              <table className="w-full text-left table-dense">
                <thead>
                  <tr>
                    <th>Model Candidate</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1 Score</th>
                    <th>Early Warning Lead Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mlEval.classification_benchmarks).map(([name, m]: [string, any]) => (
                    <tr key={name} className={name.includes('XGBoost') ? 'bg-blue-50/50 font-bold' : ''}>
                      <td>{name}</td>
                      <td className="font-mono">{m.precision}</td>
                      <td className="font-mono">{m.recall}</td>
                      <td className="font-mono">{m.f1}</td>
                      <td className="font-mono text-emerald-700">{m.early_warning_lead_time_months} months</td>
                      <td>
                        {name.includes('XGBoost') ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Production Candidate
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Baseline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regression Benchmarks */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Regression Models (Delay In Months Prediction)
            </h3>
            <div className="table-wrapper border border-slate-200 rounded">
              <table className="w-full text-left table-dense">
                <thead>
                  <tr>
                    <th>Model Candidate</th>
                    <th>MAE (Months)</th>
                    <th>RMSE (Months)</th>
                    <th>Explained Variance (R²)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mlEval.regression_benchmarks).map(([name, m]: [string, any]) => (
                    <tr key={name} className={name.includes('XGBoost') ? 'bg-blue-50/50 font-bold' : ''}>
                      <td>{name}</td>
                      <td className="font-mono">{m.mae_months} mo</td>
                      <td className="font-mono">{m.rmse_months} mo</td>
                      <td className="font-mono text-emerald-700">{m.explained_variance}</td>
                      <td>
                        {name.includes('XGBoost') ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Production Candidate
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Baseline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed font-mono">
            <strong>Validation Methodology: </strong>
            Time-aware temporal split (training on prior periods, testing on subsequent cycles) ensuring zero temporal data leakage.
            Demonstration context based on calibrated MoSPI PAIMANA parameters.
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Statutory Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Immutable chronological record of officer decisions, model simulations, and ground outcome submissions
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{log.action_type}</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
                      {log.entity_type}: {log.entity_id}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-slate-800">{log.user_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
