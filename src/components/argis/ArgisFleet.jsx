import React, { useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_COLOR = { active: '#4ade80', idle: '#6b7280', overloaded: '#ef4444', error: '#f43f5e', offline: '#374151' };
const TIER_LABEL = { 1: 'MASTER', 2: 'ORCHESTRATOR', 3: 'DOMAIN', 4: 'MICRO' };
const TIER_BORDER = { 1: 'border-purple-500/50', 2: 'border-indigo-500/40', 3: 'border-cyan-500/30', 4: 'border-gray-700' };

export default function ArgisFleet({ agents, agentStates }) {
  const [filter, setFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const filtered = filter === 'all' ? agents : agents.filter(a => a.tier === parseInt(filter));
  const selected = selectedAgent ? agents.find(a=>a.id===selectedAgent) : null;
  const selState = selected ? (agentStates[selected.id]||{}) : {};

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[['all','ALL TIERS'],['1','MASTER'],['2','ORCHESTRATORS'],['3','DOMAIN'],['4','MICRO']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1 text-[9px] border rounded tracking-widest transition-colors ${
                filter===v ? 'border-purple-500 text-purple-300 bg-purple-900/20' : 'border-[#222] text-gray-500 hover:text-gray-300'
              }`}>{l}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((agent, i) => {
            const state = agentStates[agent.id] || {};
            const sc = STATUS_COLOR[state.status] || '#6b7280';
            return (
              <motion.div key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                className={`border rounded-lg p-3 bg-[#07071a] cursor-pointer hover:bg-[#0d0d25] transition-all ${
                  selectedAgent===agent.id ? 'border-purple-500/70 ring-1 ring-purple-500/30' : TIER_BORDER[agent.tier]
                }`}
              >
                {/* Status dot + tier */}
                <div className="flex items-center justify-between mb-2">
                  <motion.div
                    animate={{ opacity: state.status==='active' ? [1,0.3,1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sc }}
                  />
                  <span className="text-[7px] text-gray-700 border border-gray-800 px-1 rounded">
                    T{agent.tier}
                  </span>
                </div>

                {/* Orb */}
                <motion.div
                  animate={{ boxShadow: state.status==='active' ? [`0 0 8px ${agent.color}55`,`0 0 16px ${agent.color}88`,`0 0 8px ${agent.color}55`] : 'none' }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ border: `1.5px solid ${agent.color}66`, backgroundColor: `${agent.color}18` }}
                >
                  <span className="text-[9px] font-bold" style={{ color: agent.color }}>
                    {agent.name.slice(0,4)}
                  </span>
                </motion.div>

                <div className="text-[8px] font-bold text-center truncate" style={{ color: agent.color }}>
                  {agent.name}
                </div>
                <div className="text-[7px] text-gray-600 text-center truncate mt-0.5">{agent.role}</div>

                {/* Load bar */}
                <div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${state.load||0}%` }} transition={{ duration: 0.8 }}
                    className="h-full rounded-full" style={{ backgroundColor: sc }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[7px] text-gray-700">{state.load||0}%</span>
                  <span className="text-[7px] text-gray-700">✓{state.tasks||0}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Side panel — agent detail */}
      {selected && (
        <motion.div initial={{ x: 300 }} animate={{ x: 0 }}
          className="w-72 border-l border-[#1a1a2e] bg-[#06061a] overflow-auto p-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] text-gray-500 tracking-widest">AGENT DETAIL</span>
            <button onClick={() => setSelectedAgent(null)} className="text-gray-700 hover:text-gray-400 text-xs">✕</button>
          </div>

          {/* Orb */}
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ boxShadow: [`0 0 20px ${selected.color}44`,`0 0 40px ${selected.color}77`,`0 0 20px ${selected.color}44`] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ border: `2px solid ${selected.color}88`, backgroundColor: `${selected.color}15` }}
            >
              <span className="text-sm font-bold" style={{ color: selected.color }}>{selected.name.slice(0,4)}</span>
            </motion.div>
          </div>

          <div className="space-y-2">
            {[
              ['NAME', selected.name],
              ['ROLE', selected.role],
              ['DOMAIN', selected.domain],
              ['MODEL', selected.model],
              ['TIER', TIER_LABEL[selected.tier]],
              ['TYPE', selected.type.toUpperCase()],
              ['STATUS', selState.status?.toUpperCase() || 'IDLE'],
              ['LOAD', `${selState.load||0}%`],
              ['TASKS', selState.tasks||0],
              ['SUCCESS RATE', `${selState.successRate||0}%`],
              ['LATENCY', `${selState.latency||0}ms`],
              ['COST/TASK', `$${selState.costPerTask||0}`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-[9px] border-b border-[#111] pb-1">
                <span className="text-gray-600">{k}</span>
                <span style={{ color: selected.color }}>{v}</span>
              </div>
            ))}
          </div>

          {selState.lastAction && (
            <div className="mt-3 border border-[#1a1a2e] rounded p-2">
              <div className="text-[8px] text-gray-600 mb-1">LAST ACTION</div>
              <div className="text-[9px] text-gray-400 leading-relaxed">{selState.lastAction}</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}