import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  score: number;
  category?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, category, showIcon = true }) => {
  let cat = category;
  if (!cat) {
    if (score >= 70) cat = 'High Risk';
    else if (score >= 40) cat = 'Monitor';
    else cat = 'Stable';
  }

  if (cat === 'High Risk' || score >= 70) {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        {showIcon && <AlertTriangle className="w-3 h-3 text-red-600" />}
        <span>{score}/100 High Risk</span>
      </span>
    );
  }

  if (cat === 'Monitor' || (score >= 40 && score < 70)) {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        {showIcon && <Clock className="w-3 h-3 text-amber-600" />}
        <span>{score}/100 Monitor</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
      {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
      <span>{score}/100 Stable</span>
    </span>
  );
};

export const ActionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-300">Approved</span>;
    case 'In Progress':
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 border border-indigo-300">In Progress</span>;
    case 'Completed':
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
    case 'Pending Approval':
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">Pending Approval</span>;
    case 'Rejected':
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-300">Rejected</span>;
    default:
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-300">Recommended</span>;
  }
};
