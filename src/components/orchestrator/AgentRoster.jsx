import React from 'react';
import { motion } from 'framer-motion';

const statusColor = { active: '#4ade80', idle: '#6b7280', overloaded: '#f97316', error: '#ef4444' };
const typeLabel = { master: 'MASTER', domain: 'DOMAIN', dispatcher: 'DISPATCH', scaler: 'SCALER', micro: 'MICRO' };

export default function AgentRoster({ agents, agentStates }) {
  return (
    <div className="p-3">
      <div className="text-[10px] text-gray-500 tracking-widest mb-3 px-1">AGENT ROSTER</div>
      <div className="space-y-1">
        {agents.map(agent => {
          const state = agentStates[agent.id] || {};
          const sc = statusColor[state.status] || '#6b7280';
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-[#1a1a2e] rounded p-2 bg-[#08081a] hover:border-purple-900/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ opacity: state.status === 'active' ? [1, 0.3, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: sc }}
                  />
                  <span className="text-[10px] font-bold truncate max-w-[140px]" style={{ color: agent.color }}>
                    {agent.name}
                  </span>
                </div>
                <span className="text-[8px] text-gray-600 border border-gray-700 px-1 rounded">
                  {typeLabel[agent.type] || agent.type}
                </span>
              </div>
              <div className="text-[9px] text-gray-500 mb-1 truncate">{agent.domain}</div>
              {/* Load bar */}
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${state.load || 0}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: sc }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-gray-600">LOAD {state.load || 0}%</span>
                <span className="text-[8px] text-gray-600">✓ {state.tasks || 0}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}