import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { WorkflowBanner } from './components/layout/WorkflowBanner';
import { CommandCenter } from './pages/CommandCenter';
import { ProjectList } from './pages/ProjectList';
import { ProjectPulse } from './pages/ProjectPulse';
import { InterventionCockpit } from './pages/InterventionCockpit';
import { ActionHub } from './pages/ActionHub';
import { Bottlenecks } from './pages/Bottlenecks';
import { Reports } from './pages/Reports';
import { PulseAssistant } from './pages/PulseAssistant';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('command-center');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('P10291'); // Default hero project P10291
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(undefined);

  // Map active tab to current proactive decision workflow stage
  const getWorkflowStage = (): 'detect' | 'diagnose' | 'predict' | 'simulate' | 'act' | 'learn' => {
    switch (activeTab) {
      case 'command-center':
      case 'projects':
      case 'bottlenecks':
        return 'detect';
      case 'project-pulse':
        return 'diagnose';
      case 'cockpit':
        return 'simulate';
      case 'action-hub':
        return 'act';
      case 'reports':
        return 'learn';
      default:
        return 'detect';
    }
  };

  const handleSelectProject = (pId: string) => {
    setSelectedProjectId(pId);
    setActiveTab('project-pulse');
  };

  const handleOpenCockpit = (pId: string) => {
    setSelectedProjectId(pId);
    setActiveTab('cockpit');
  };

  const handleNavigateReports = (pId: string) => {
    setSelectedProjectId(pId);
    setActiveTab('reports');
  };

  const handleActionCreated = (actionId: string) => {
    setSelectedActionId(actionId);
    setActiveTab('action-hub');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Government Platform Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        earlyWarningCount={12} 
      />

      {/* Proactive Loop Banner (DETECT -> DIAGNOSE -> PREDICT -> SIMULATE -> ACT -> LEARN) */}
      <WorkflowBanner 
        currentStage={getWorkflowStage()} 
        onStageClick={(targetTab) => setActiveTab(targetTab)} 
      />

      {/* Primary Page Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'command-center' && (
          <CommandCenter 
            onSelectProject={handleSelectProject} 
            onNavigateTab={setActiveTab} 
          />
        )}

        {activeTab === 'projects' && (
          <ProjectList 
            onSelectProject={handleSelectProject} 
          />
        )}

        {activeTab === 'project-pulse' && (
          <ProjectPulse 
            projectId={selectedProjectId} 
            onOpenCockpit={handleOpenCockpit}
            onNavigateReports={handleNavigateReports}
          />
        )}

        {activeTab === 'cockpit' && (
          <InterventionCockpit 
            projectId={selectedProjectId} 
            onActionCreated={handleActionCreated} 
          />
        )}

        {activeTab === 'action-hub' && (
          <ActionHub 
            onSelectProject={handleSelectProject} 
            selectedActionId={selectedActionId} 
          />
        )}

        {activeTab === 'bottlenecks' && (
          <Bottlenecks 
            onSelectProject={handleSelectProject} 
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            initialProjectId={selectedProjectId} 
            onSelectProject={handleSelectProject} 
          />
        )}

        {activeTab === 'assistant' && (
          <PulseAssistant 
            onSelectProject={handleSelectProject} 
          />
        )}
      </main>

      {/* Government Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            PAIMANA Pulse • Ministry of Statistics and Programme Implementation (MoSPI) • Data Informatics & Innovation Division (DIID)
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Smart India Hackathon 2026 • Problem Statement ID: 26103
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
