import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import OrchestratorBrain from '@/components/orchestrator/OrchestratorBrain';
import AgentRoster from '@/components/orchestrator/AgentRoster';
import TaskFeed from '@/components/orchestrator/TaskFeed';
import OptimizationPanel from '@/components/orchestrator/OptimizationPanel';

const AGENTS = [
  { id: 'master',       name: 'MASTER ORCHESTRATOR',    domain: 'Command & Control',      model: 'gpt-4o',          color: '#a855f7', type: 'master' },
  { id: 'mint-agent',   name: 'MINT AGENT',             domain: 'Gold Asset Minting',     model: 'gpt-4o-mini',     color: '#d4af37', type: 'domain' },
  { id: 'transfer',     name: 'TRANSFER AGENT',         domain: 'XRP Settlement',         model: 'gpt-4o-mini',     color: '#22d3ee', type: 'domain' },
  { id: 'audit',        name: 'AUDIT AGENT',            domain: 'Solvency & Compliance',  model: 'gpt-4o',          color: '#4ade80', type: 'domain' },
  { id: 'repair',       name: 'REPAIR AGENT',           domain: 'Corruption Recovery',    model: 'gpt-4o-mini',     color: '#f97316', type: 'domain' },
  { id: 'dispatcher',   name: 'TASK DISPATCHER',        domain: 'AI Routing Engine',      model: 'gpt-4o',          color: '#818cf8', type: 'dispatcher' },
  { id: 'node-scaler',  name: 'NODE SCALER',            domain: 'Predictive Scaling',     model: 'gpt-4o-mini',     color: '#fb7185', type: 'scaler' },
  { id: 'risk',         name: 'RISK AGENT',             domain: 'Threat & Risk Analysis', model: 'gpt-4o',          color: '#fbbf24', type: 'domain' },
  { id: 'iso-agent',    name: 'ISO 20022 AGENT',        domain: 'Payment Compliance',     model: 'gpt-4o-mini',     color: '#34d399', type: 'micro' },
  { id: 'ledger-agent', name: 'LEDGER AGENT',           domain: 'Transaction Integrity',  model: 'gpt-4o-mini',     color: '#60a5fa', type: 'micro' },
];

export default function Orchestrator() {
  const [agentStates, setAgentStates] = useState(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, { status: 'idle', load: 0, tasks: 0, successRate: 100, lastAction: null }]))
  );
  const [feed, setFeed] = useState([
    { id: 1, time: new Date(), type: 'INIT', agent: 'MASTER ORCHESTRATOR', message: 'Orchestration kernel loaded. All agents standing by.' },
    { id: 2, time: new Date(), type: 'INFO', agent: 'TASK DISPATCHER',     message: 'AI routing engine online. Domain index: 10 agents active.' },
  ]);
  const [optimizations, setOptimizations] = useState([]);
  const [running, setRunning] = useState(true);

  const addFeed = useCallback((type, agentName, message) => {
    setFeed(prev => [...prev.slice(-80), { id: Date.now() + Math.random(), time: new Date(), type, agent: agentName, message }]);
  }, []);

  // Simulate agent heartbeat / self-optimization loop
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const events = [
        { type: 'ROUTE',  msg: `Task dispatched to ${agent.name} — priority: ${['HIGH','MEDIUM','LOW'][Math.floor(Math.random()*3)]}` },
        { type: 'METRIC', msg: `Perf check: success_rate=${(95 + Math.random()*5).toFixed(1)}% | latency=${(20+Math.random()*80).toFixed(0)}ms` },
        { type: 'OPT',    msg: `Self-optimization proposed: refine routing weight for ${agent.domain}` },
        { type: 'SCALE',  msg: `NODE SCALER: load forecast +${(Math.random()*30).toFixed(0)}% → standing by to provision` },
        { type: 'AUDIT',  msg: `AUDIT AGENT: ledger delta verified — solvency NOMINAL` },
        { type: 'SETTLE', msg: `XRP settlement confirmed in ${(20+Math.random()*120).toFixed(0)}ms via UTXO chain` },
      ];
      const ev = events[Math.floor(Math.random() * events.length)];
      addFeed(ev.type, agent.name, ev.msg);

      setAgentStates(prev => {
        const load = Math.min(100, Math.max(0, (prev[agent.id]?.load || 0) + (Math.random() - 0.5) * 20));
        const status = load > 80 ? 'overloaded' : load > 20 ? 'active' : 'idle';
        return {
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            load: Math.round(load),
            status,
            tasks: (prev[agent.id]?.tasks || 0) + (Math.random() > 0.5 ? 1 : 0),
            successRate: parseFloat((95 + Math.random() * 5).toFixed(1)),
            lastAction: ev.msg.substring(0, 40),
          }
        };
      });

      // Occasionally generate an optimization proposal
      if (Math.random() < 0.15) {
        setOptimizations(prev => [...prev.slice(-10), {
          id: Date.now(),
          agent: agent.name,
          agentId: agent.id,
          type: ['prompt','model','routing','cost'][Math.floor(Math.random()*4)],
          description: `Optimize ${agent.domain} — improve ${['response latency','cost-per-task','routing accuracy','prompt clarity'][Math.floor(Math.random()*4)]}`,
          scoreDelta: +(Math.random() * 8).toFixed(1),
          status: 'proposed',
        }]);
      }
    }, 1800);
    return () => clearInterval(iv);
  }, [running, addFeed]);

  const approveOptimization = (id) => {
    setOptimizations(prev => prev.map(o => o.id === id ? { ...o, status: 'approved' } : o));
    const opt = optimizations.find(o => o.id === id);
    if (opt) addFeed('OPT', 'MASTER ORCHESTRATOR', `Approved optimization for ${opt.agent}: ${opt.description}`);
  };

  const rejectOptimization = (id) => {
    setOptimizations(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
  };

  return (
    <div className="h-screen bg-[#050510] text-gray-100 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-purple-900/40 px-6 py-3 flex items-center justify-between bg-[#08081a] shrink-0">
        <div>
          <h1 className="text-base font-bold tracking-[0.2em] text-purple-300 uppercase">Agentic Orchestration Layer</h1>
          <p className="text-[10px] text-gray-500 tracking-widest">LONE STAR LEDGER — AI COMMAND MESH</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{AGENTS.length} AGENTS</span>
          <button
            onClick={() => setRunning(r => !r)}
            className={`px-3 py-1 text-xs border rounded tracking-wider transition-colors ${
              running
                ? 'border-green-600 text-green-400 hover:bg-green-900/20'
                : 'border-red-600 text-red-400 hover:bg-red-900/20'
            }`}
          >
            {running ? '⬤ LIVE' : '◼ PAUSED'}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Agent Roster */}
        <div className="w-[260px] border-r border-[#1a1a2e] overflow-auto shrink-0">
          <AgentRoster agents={AGENTS} agentStates={agentStates} />
        </div>

        {/* Center: Brain + Feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <OrchestratorBrain agents={AGENTS} agentStates={agentStates} />
          <TaskFeed feed={feed} />
        </div>

        {/* Right: Optimizations */}
        <div className="w-[320px] border-l border-[#1a1a2e] overflow-auto shrink-0">
          <OptimizationPanel
            optimizations={optimizations}
            onApprove={approveOptimization}
            onReject={rejectOptimization}
          />
        </div>
      </div>
    </div>
  );
}