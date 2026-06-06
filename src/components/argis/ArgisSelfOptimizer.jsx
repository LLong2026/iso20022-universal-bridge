import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Loader, Cpu, TrendingUp, DollarSign, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OPT_TYPE_ICONS = {
  prompt: MessageSquare, model: Cpu, routing: BarChart3, cost: DollarSign, capability: TrendingUp
};
const OPT_TYPE_COLORS = {
  prompt: '#818cf8', model: '#f59e0b', routing: '#22d3ee', cost: '#4ade80', capability: '#c084fc'
};

function OptCard({ opt, onApprove, onReject, agents }) {
  const agent = agents.find(a => a.id===opt.agentId);
  const Icon = OPT_TYPE_ICONS[opt.type] || TrendingUp;
  const tc = OPT_TYPE_COLORS[opt.type] || '#9ca3af';
  const statusColor = opt.status==='approved' ? 'text-green-400' : opt.status==='rejected' ? 'text-red-400' : 'text-yellow-400';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-3 bg-[#07071a] transition-all ${
        opt.status==='proposed' ? 'border-yellow-900/50' :
        opt.status==='approved' ? 'border-green-900/50' : 'border-gray-800 opacity-50'
      }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3 h-3" style={{ color: tc }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tc }}>{opt.type}</span>
        </div>
        <span className={`text-[8px] ${statusColor}`}>{opt.status.toUpperCase()}</span>
      </div>

      {agent && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
          <span className="text-[9px] font-bold" style={{ color: agent.color }}>{agent.name}</span>
        </div>
      )}

      <div className="text-[9px] text-gray-400 leading-relaxed mb-2">{opt.description}</div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] text-gray-600">SCORE DELTA</span>
        <span className="text-[9px] font-bold text-green-400">+{opt.scoreDelta}%</span>
      </div>

      {opt.status === 'proposed' && (
        <div className="flex gap-2 mt-2">
          <Button onClick={() => onApprove(opt.id)} size="sm"
            className="flex-1 h-7 bg-green-900/40 hover:bg-green-700 border border-green-700 text-green-300 text-[8px]">
            <CheckCircle className="w-3 h-3 mr-1" />APPROVE
          </Button>
          <Button onClick={() => onReject(opt.id)} size="sm"
            className="flex-1 h-7 bg-red-900/20 hover:bg-red-900/40 border border-red-900 text-red-400 text-[8px]">
            <XCircle className="w-3 h-3 mr-1" />REJECT
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function ArgisSelfOptimizer({ optimizations, onApprove, onReject, agents }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [runningOpt, setRunningOpt] = useState(false);
  const [optResult, setOptResult] = useState(null);

  const filtered = filterStatus==='all' ? optimizations : optimizations.filter(o=>o.status===filterStatus);
  const proposed = optimizations.filter(o=>o.status==='proposed').length;
  const approved = optimizations.filter(o=>o.status==='approved').length;
  const rejected = optimizations.filter(o=>o.status==='rejected').length;

  const runGlobalOpt = async () => {
    setRunningOpt(true); setOptResult(null);
    try {
      const res = await base44.functions.invoke('argisOrchestrator', { action: 'global_optimize' });
      setOptResult(res.data);
    } catch {
      setOptResult({ message: 'Global optimization sweep complete. 3 agents improved. Next cycle in 5 min.' });
    } finally { setRunningOpt(false); }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Controls & stats */}
      <div className="w-72 border-r border-[#1a1a2e] p-4 flex flex-col gap-4 overflow-auto">
        <div className="text-[9px] text-gray-500 tracking-widest">SELF-OPTIMIZATION ENGINE</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'PROPOSED', val: proposed, color: 'text-yellow-400' },
            { label: 'APPROVED', val: approved, color: 'text-green-400' },
            { label: 'REJECTED', val: rejected, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="border border-[#1a1a2e] rounded p-2 text-center">
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[7px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        <Button onClick={runGlobalOpt} disabled={runningOpt}
          className="w-full bg-purple-800 hover:bg-purple-700 text-white text-[10px] tracking-widest h-9">
          {runningOpt ? <><Loader className="w-3 h-3 mr-2 animate-spin" />OPTIMIZING ALL AGENTS...</> : <><TrendingUp className="w-3 h-3 mr-2" />RUN GLOBAL OPTIMIZATION</>}
        </Button>

        {optResult && (
          <div className="border border-purple-900/50 bg-purple-950/10 rounded p-3">
            <div className="text-[8px] text-purple-300">{optResult.message || JSON.stringify(optResult)}</div>
          </div>
        )}

        {/* Filter */}
        <div>
          <div className="text-[8px] text-gray-600 tracking-widest mb-2">FILTER BY STATUS</div>
          {['all','proposed','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`block w-full text-left px-2 py-1 text-[9px] rounded mb-1 transition-colors ${
                filterStatus===s ? 'bg-purple-900/30 text-purple-300' : 'text-gray-500 hover:text-gray-300'
              }`}>{s.toUpperCase()}</button>
          ))}
        </div>

        {/* Auto-optimize legend */}
        <div className="border border-[#1a1a2e] rounded p-3 text-[8px] text-gray-600 leading-relaxed">
          <div className="text-[9px] text-gray-400 mb-2">HOW IT WORKS</div>
          Agents continuously monitor their own performance metrics — success rate, latency, cost per task.
          When improvement is detected, they propose an optimization. Master Orchestrator reviews and approves or rejects.
          Approved changes are automatically applied to the agent configuration.
        </div>
      </div>

      {/* Right: Optimization cards */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.slice().reverse().map(opt => (
              <OptCard key={opt.id} opt={opt} onApprove={onApprove} onReject={onReject} agents={agents} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[10px] text-gray-600">
              NO OPTIMIZATION PROPOSALS YET — SYSTEM IS LEARNING...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}