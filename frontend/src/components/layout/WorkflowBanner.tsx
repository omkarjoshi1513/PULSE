import React from 'react';
import { ArrowRight, Search, Activity, Cpu, Sliders, CheckCircle, GraduationCap } from 'lucide-react';

interface WorkflowBannerProps {
  currentStage: 'detect' | 'diagnose' | 'predict' | 'simulate' | 'act' | 'learn';
  onStageClick?: (stage: string) => void;
}

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({ currentStage, onStageClick }) => {
  const steps = [
    { id: 'detect', label: 'DETECT', subtitle: 'What changed?', tab: 'command-center', icon: Search },
    { id: 'diagnose', label: 'DIAGNOSE', subtitle: 'Why is it risky?', tab: 'project-pulse', icon: Activity },
    { id: 'predict', label: 'PREDICT', subtitle: 'What happens next?', tab: 'project-pulse', icon: Cpu },
    { id: 'simulate', label: 'SIMULATE', subtitle: 'What should we do?', tab: 'cockpit', icon: Sliders },
    { id: 'act', label: 'ACT', subtitle: 'Officer Decision & Hub', tab: 'action-hub', icon: CheckCircle },
    { id: 'learn', label: 'LEARN', subtitle: 'Actual vs Predicted', tab: 'action-hub', icon: GraduationCap },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-500 font-medium">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">Proactive Loop:</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
          {steps.map((step, idx) => {
            const isActive = currentStage === step.id;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onStageClick && onStageClick(step.tab)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                  <div>
                    <div className="leading-tight">{step.label}</div>
                    <div className={`text-[10px] hidden md:block ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                      {step.subtitle}
                    </div>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
