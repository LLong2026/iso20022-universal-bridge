import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const TYPE_COLORS = {
  INIT: '#a855f7', BOOT: '#818cf8', DISPATCH: '#22d3ee', METRIC: '#4ade80',
  OPT: '#f59e0b', SCALE: '#fb7185', KNOWLEDGE: '#d4af37', HEALTH: '#6ee7b7',
  REROUTE: '#f97316', AUDIT: '#34d399', SETTLE: '#60a5fa', SYNTH: '#c084fc', INFO: '#9ca3af',
};

function MiniAgentOrb({ agent, state }) {
  const sc = state?.status === 'active' ? agent.color : state?.status === 'overloaded' ? '#ef4444' : '#374151';
  return (
    <motion.div
      animate={{ boxShadow: state?.status==='active' ? [`0 0 6px ${agent.color}66`, `0 0 14px ${agent.color}99`, `0 0 6px ${agent.color}66`] : 'none' }}
      transition={{ repeat: Infinity, duration: 1.8 }}
      title={`${agent.name} — ${state?.status||'idle'} — Load: ${state?.load||0}%`}
      className="w-8 h-8 rounded-full border flex items-center justify-center cursor-default relative"
      style={{ borderColor: sc, backgroundColor: `${agent.color}15` }}
    >
      <span className="text-[7px] font-bold" style={{ color: agent.color }}>
        {agent.name.slice(0,3)}
      </span>
      {state?.status === 'overloaded' && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
      )}
    </motion.div>
  );
}

export default function ArgisCommandCenter({ agents, agentStates, feed, taskQueue }) {
  const feedRef = useRef(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed]);

  const tier1 = agents.filter(a=>a.tier===1);
  const tier2 = agents.filter(a=>a.tier===2);
  const tier3 = agents.filter(a=>a.tier===3);
  const tier4 = agents.filter(a=>a.tier===4);

  const totalTasks = Object.values(agentStates).reduce((s,a)=>s+(a.tasks||0),0);
  const activeCount = Object.values(agentStates).filter(a=>a.status==='active').length;
  const avgSR = (Object.values(agentStates).reduce((s,a)=>s+(a.successRate||0),0)/agents.length).toFixed(1);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Agent Topology */}
      <div className="w-80 border-r border-[#1a1a2e] flex flex-col p-4 overflow-auto">
        <div className="text-[9px] text-gray-500 tracking-widest mb-4">AGENT TOPOLOGY</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'TASKS', val: totalTasks, color: 'text-purple-300' },
            { label: 'ACTIVE', val: activeCount, color: 'text-green-400' },
            { label: 'AVG SR', val: `${avgSR}%`, color: 'text-cyan-300' },
          ].map(s => (
            <div key={s.label} className="border border-[#1a1a2e] rounded p-2 text-center">
              <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[8px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tiers */}
        {[
          { label: 'TIER 1 — MASTER', agents: tier1 },
          { label: 'TIER 2 — ORCHESTRATORS', agents: tier2 },
          { label: 'TIER 3 — DOMAIN', agents: tier3 },
          { label: 'TIER 4 — MICRO', agents: tier4 },
        ].map(tier => (
          <div key={tier.label} className="mb-4">
            <div className="text-[8px] text-gray-600 tracking-widest mb-2">{tier.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {tier.agents.map(a => (
                <MiniAgentOrb key={a.id} agent={a} state={agentStates[a.id]} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Center: Live Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-[#1a1a2e] px-4 py-2 flex items-center justify-between">
          <span className="text-[9px] text-gray-500 tracking-widest">LIVE EVENT STREAM</span>
          <span className="text-[9px] text-purple-400">{feed.length} EVENTS</span>
        </div>
        <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-1">
          {feed.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 text-[9px] leading-relaxed">
              <span className="text-gray-700 shrink-0 w-14">{e.time.toTimeString().slice(0,8)}</span>
              <span className="shrink-0 font-bold w-16 truncate" style={{ color: TYPE_COLORS[e.type]||'#9ca3af' }}>
                [{e.type}]
              </span>
              <span className="text-purple-400/80 shrink-0 w-28 truncate">{e.agent}</span>
              <span className="text-gray-400 flex-1 break-words">{e.message}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Task Queue */}
      <div className="w-64 border-l border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="border-b border-[#1a1a2e] px-3 py-2">
          <span className="text-[9px] text-gray-500 tracking-widest">TASK QUEUE</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {taskQueue.slice().reverse().map(t => (
            <div key={t.id} className="border border-[#1a1a2e] rounded p-2 bg-[#08081a]">
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-400 font-bold">{t.id}</span>
                <span className={`text-[7px] px-1 rounded ${
                  t.status==='completed' ? 'bg-green-900/40 text-green-400' :
                  t.status==='in_progress' ? 'bg-blue-900/40 text-blue-400' :
                  t.status==='dispatched' ? 'bg-purple-900/40 text-purple-400' :
                  'bg-gray-800 text-gray-500'
                }`}>{t.status.toUpperCase()}</span>
              </div>
              <div className="text-[8px] text-gray-500 mt-0.5">{t.type} · {t.priority}</div>
              <div className="text-[7px] text-gray-700 mt-0.5 truncate">→ {t.agent}</div>
            </div>
          ))}
          {taskQueue.length === 0 && (
            <div className="text-[9px] text-gray-700 text-center py-4">QUEUE EMPTY</div>
          )}
        </div>
      </div>
    </div>
  );
}