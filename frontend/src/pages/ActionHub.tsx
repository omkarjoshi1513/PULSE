import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, UserCheck, CheckCircle2, AlertCircle, 
  ArrowRight, History, Edit3, Save, TrendingDown, Layers, ChevronRight
} from 'lucide-react';
import { ActionDetail } from '../types';
import { fetchActions, updateActionStatus, recordActualOutcome } from '../services/api';
import { ActionStatusBadge } from '../components/ui/StatusBadge';

interface ActionHubProps {
  onSelectProject: (projectId: string) => void;
  selectedActionId?: string;
}

export const ActionHub: React.FC<ActionHubProps> = ({ onSelectProject, selectedActionId }) => {
  const [actions, setActions] = useState<ActionDetail[]>([]);
  const [activeAction, setActiveAction] = useState<ActionDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  // Outcome recording state
  const [actualTime, setActualTime] = useState<number>(3.8);
  const [actualCost, setActualCost] = useState<number>(34.0);
  const [outcomeNotes, setOutcomeNotes] = useState<string>('Work resumed across 10 packages; verified on ground.');
  const [recordingOutcome, setRecordingOutcome] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchActions(undefined, statusFilter !== 'All' ? statusFilter : undefined);
        setActions(data);
        if (data.length > 0) {
          if (selectedActionId) {
            const match = data.find(a => a.id === selectedActionId);
            setActiveAction(match || data[0]);
          } else {
            setActiveAction(data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter, selectedActionId]);

  // Handle Status Update (Step 11 in Demo Scenario)
  const handleStatusChange = async (newStatus: string) => {
    if (!activeAction) return;
    try {
      await updateActionStatus(activeAction.id, newStatus);
      // Reload actions
      const updated = await fetchActions(undefined, statusFilter !== 'All' ? statusFilter : undefined);
      setActions(updated);
      const match = updated.find(a => a.id === activeAction.id);
      if (match) setActiveAction(match);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Recording Actual Outcome (Step 12 in Demo Scenario)
  const handleSaveOutcome = async () => {
    if (!activeAction) return;
    try {
      setRecordingOutcome(true);
      await recordActualOutcome(
        activeAction.id,
        actualTime,
        actualCost,
        activeAction.estimated_cost_cr,
        outcomeNotes
      );
      setFeedbackSuccess('Actual impact successfully recorded! Model feedback loop closed.');
      const updated = await fetchActions(undefined, statusFilter !== 'All' ? statusFilter : undefined);
      setActions(updated);
      const match = updated.find(a => a.id === activeAction.id);
      if (match) setActiveAction(match);
      setTimeout(() => setFeedbackSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setRecordingOutcome(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Action Hub</h1>
            <span className="text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-semibold">
              Closed-Loop Execution & Feedback
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Question addressed: <span className="font-semibold text-slate-700">"What has been done and what happened after we acted?"</span> • Human authorization workflow
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 text-xs"
          >
            <option value="All">All Actions ({actions.length})</option>
            <option value="Recommended">Recommended</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Main Grid: Action List & Action Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tracked Decisions ({actions.length})
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {actions.map((act) => {
              const isSelected = activeAction?.id === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => setActiveAction(act)}
                  className={`p-3.5 rounded-lg border-2 transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono font-bold text-blue-900">{act.id}</span>
                    <ActionStatusBadge status={act.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 mt-1">{act.intervention_name}</h3>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Project: <span className="font-mono font-semibold text-slate-700">{act.project_id}</span> • {act.project_name || 'Corridor Reach'}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Deadline: {act.deadline}</span>
                    <span>Outlay: ₹{act.estimated_cost_cr} Cr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Detail & Audit Lifecycle (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-5">
          {activeAction ? (
            <>
              {/* Top Action Summary */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-blue-900">{activeAction.id}</span>
                    <ActionStatusBadge status={activeAction.status} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeAction.intervention_name}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Target Project: <button onClick={() => onSelectProject(activeAction.project_id)} className="font-mono font-bold text-blue-700 hover:underline">{activeAction.project_id}</button> • {activeAction.project_name}
                  </div>
                </div>

                {/* Status Advancement Controls (Step 11) */}
                <div className="flex flex-col items-end gap-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">Update Status:</span>
                  <div className="flex items-center space-x-1">
                    {activeAction.status !== 'Approved' && (
                      <button
                        onClick={() => handleStatusChange('Approved')}
                        className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded font-semibold hover:bg-blue-200 transition cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {activeAction.status !== 'In Progress' && (
                      <button
                        onClick={() => handleStatusChange('In Progress')}
                        className="px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded font-semibold hover:bg-indigo-200 transition cursor-pointer"
                      >
                        In Progress
                      </button>
                    )}
                    {activeAction.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange('Completed')}
                        className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold hover:bg-emerald-200 transition cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Recommended Date</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{activeAction.recommended_date}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Approved By</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{activeAction.approved_by}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Assigned Officer</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{activeAction.assigned_officer}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Budget Allocated</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">₹{activeAction.estimated_cost_cr} Cr</div>
                </div>
              </div>

              {/* Expected Impact Summary */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <strong className="text-slate-900">Expected Impact Summary: </strong>
                <span className="text-slate-700">{activeAction.expected_impact_summary}</span>
              </div>

              {/* ACTUAL VS PREDICTED (The Feedback & Learning Loop - Step 12) */}
              <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Actual Outcome vs Predicted Feedback Loop (Learn)
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-mono">
                      Model Validation
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Predicted Time Saving</span>
                    <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                      {activeAction.predicted_time_saving_months} mo
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Actual Time Saved</span>
                    <div className="font-bold font-mono text-sm text-emerald-800 mt-0.5">
                      {activeAction.actual_time_saving_months !== null && activeAction.actual_time_saving_months !== undefined
                        ? `${activeAction.actual_time_saving_months} mo`
                        : <span className="text-slate-400 text-xs font-normal">Pending entry</span>}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Predicted Cost Avoided</span>
                    <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                      ₹{activeAction.predicted_cost_saving_cr} Cr
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Actual Cost Avoided</span>
                    <div className="font-bold font-mono text-sm text-emerald-800 mt-0.5">
                      {activeAction.actual_cost_saving_cr !== null && activeAction.actual_cost_saving_cr !== undefined
                        ? `₹${activeAction.actual_cost_saving_cr} Cr`
                        : <span className="text-slate-400 text-xs font-normal">Pending entry</span>}
                    </div>
                  </div>
                </div>

                {/* Variance Display */}
                {activeAction.time_variance_months !== null && activeAction.time_variance_months !== undefined && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between font-mono">
                    <span>Schedule Variance: <strong>{activeAction.time_variance_months} months</strong> (Actual vs Model)</span>
                    <span>Cost Variance: <strong>₹{activeAction.cost_variance_cr} Cr</strong></span>
                  </div>
                )}

                {/* Record Outcome Form if not yet completed */}
                {activeAction.actual_time_saving_months === null && (
                  <div className="mt-3 p-3 bg-white border border-slate-300 rounded space-y-2 text-xs">
                    <div className="font-semibold text-slate-800">
                      Record Post-Intervention Ground Telemetry:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600 block">Actual Time Saved (Months)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={actualTime}
                          onChange={(e) => setActualTime(Number(e.target.value))}
                          className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block">Actual Cost Avoided (₹ Cr)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={actualCost}
                          onChange={(e) => setActualCost(Number(e.target.value))}
                          className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block">Ground Verification Notes</label>
                      <input
                        type="text"
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <button
                      onClick={handleSaveOutcome}
                      disabled={recordingOutcome}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{recordingOutcome ? 'Saving...' : 'Submit Ground Outcome & Update Models'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* AUDIT TRAIL */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit History & State Transitions</span>
                </div>

                <div className="space-y-2">
                  {activeAction.updates && activeAction.updates.map((up, i) => (
                    <div key={i} className="flex items-start space-x-3 text-xs p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="font-mono text-slate-400 text-[11px] shrink-0">{up.timestamp}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">
                          {up.author} transitioned status to <span className="text-blue-900 font-bold">{up.new_status}</span>
                        </div>
                        {up.comments && <p className="text-slate-600 text-[11px] mt-0.5">{up.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select an action from the left panel to inspect details and audit history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
