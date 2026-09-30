import React from 'react';
import { 
  ShieldAlert, Activity, GitPullRequest, CheckSquare, 
  Layers, FileText, MessageSquare, Bell, User, LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  earlyWarningCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, earlyWarningCount = 12 }) => {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'project-pulse', label: 'Project Pulse', icon: Activity },
    { id: 'cockpit', label: 'Intervention Cockpit', icon: GitPullRequest },
    { id: 'action-hub', label: 'Action Hub', icon: CheckSquare },
    { id: 'bottlenecks', label: 'Bottlenecks', icon: ShieldAlert },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'assistant', label: 'Pulse Assistant', icon: MessageSquare },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Banner: Government Authority Context */}
      <div className="bg-slate-950 px-6 py-1.5 border-b border-slate-800 text-xs flex justify-between items-center text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-200">MoSPI</span>
          <span>|</span>
          <span>Ministry of Statistics and Programme Implementation</span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-400">Data Informatics & Innovation Division (DIID)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-mono text-[11px]">
            Problem ID: 26103 • SIH 2026
          </span>
          <span className="text-slate-300 font-medium">Demo Mode: Live Portfolio Context</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('command-center')}>
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow">
              P
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">PAIMANA <span className="text-blue-400 font-light">Pulse</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                  Decision Support
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">From project monitoring to proactive intervention</p>
            </div>
          </div>
        </div>

        {/* User and Role */}
        <div className="flex items-center space-x-5">
          <div 
            onClick={() => setActiveTab('command-center')}
            className="flex items-center space-x-1.5 bg-red-950/70 border border-red-800 text-red-300 px-2.5 py-1 rounded text-xs cursor-pointer hover:bg-red-900/60 transition"
            title="Early warning signals detected this cycle"
          >
            <Bell className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="font-semibold">{earlyWarningCount}</span>
            <span className="hidden sm:inline">Early Warnings</span>
          </div>

          <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-700">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left text-xs">
              <div className="font-medium text-slate-200">Dr. Vikram Sharma</div>
              <div className="text-[10px] text-slate-400">Project Monitoring Officer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="px-6 flex space-x-1 overflow-x-auto border-t border-slate-800 bg-slate-900 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 border-b-2 font-medium transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
