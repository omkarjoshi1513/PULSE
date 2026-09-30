import React, { useState } from 'react';
import { 
  MessageSquare, Send, Bot, User, ShieldCheck, Sparkles, 
  HelpCircle, ArrowRight, CornerDownLeft 
} from 'lucide-react';
import { AssistantQueryResponse } from '../types';
import { queryAssistant } from '../services/api';

interface MessageItem {
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  groundedData?: any;
  timestamp: string;
}

interface PulseAssistantProps {
  onSelectProject: (projectId: string) => void;
}

export const PulseAssistant: React.FC<PulseAssistantProps> = ({ onSelectProject }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'assistant',
      text: "Namaste. I am the PAIMANA Pulse Decision Assistant. I am directly grounded in verified MoSPI project records, XGBoost/SHAP risk engines, and Intervention Cockpit simulations. You can ask me why any project is risky, what changed this month, or request systemic bottleneck evaluations.",
      source: "Grounded MoSPI Corpus",
      timestamp: "10:00 AM"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    "Why is P10291 high risk?",
    "What changed this month for P10291?",
    "What intervention would reduce the risk for P10291?",
    "What systemic bottlenecks are affecting multiple projects?",
    "Generate a review brief for P10291."
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: MessageItem = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res: AssistantQueryResponse = await queryAssistant(q);
      const assistantMsg: MessageItem = {
        sender: 'assistant',
        text: res.response,
        source: res.source,
        groundedData: res.grounded_data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered a communication error with the internal PAIMANA data bus. Please try again.",
          source: "Error",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-blue-900" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pulse Assistant</h1>
          <span className="text-xs bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Grounded • Zero-Hallucination Safe</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Query infrastructure telemetry, SHAP attributions, and intervention simulations in plain natural language
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
        <div className="font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Quick Benchmark Prompts (Click to Run):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="bg-white border border-slate-300 hover:border-blue-600 hover:text-blue-900 px-2.5 py-1 rounded text-slate-700 transition cursor-pointer text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                P
              </div>
            )}

            <div
              className={`max-w-xl rounded-lg p-3.5 text-xs leading-relaxed whitespace-pre-line ${
                m.sender === 'user'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <div>{m.text}</div>

              {m.source && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Source: {m.source}</span>
                  <span>{m.timestamp}</span>
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 text-xs font-medium">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
            <Bot className="w-4 h-4 animate-spin text-blue-600" />
            <span>Querying verified project database & computing attributions...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Ask about project risks, what changed this month, or feasible interventions..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-xs bg-white focus:outline-hidden focus:border-blue-600 shadow-2xs"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs ${
            inputQuery.trim() 
              ? 'bg-blue-900 hover:bg-blue-800 text-white' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Grounded Intelligence Policy: The assistant retrieves strictly from SQLite/Postgres DB and never invents financial or risk metrics.</span>
      </div>
    </div>
  );
};
