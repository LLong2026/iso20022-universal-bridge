import React from 'react';

export default function AgentCard({ agent, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all font-mono
        ${active
          ? 'border-[#d4af37]/60 bg-[#d4af37]/8 shadow-[0_0_12px_rgba(212,175,55,0.1)]'
          : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-700'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: agent.color }} />
        <span className={`text-[10px] font-bold tracking-widest uppercase truncate
          ${active ? 'text-[#d4af37]' : 'text-gray-400'}`}>
          {agent.label}
        </span>
      </div>
      <p className="text-[9px] text-gray-600 leading-relaxed">{agent.description}</p>
    </button>
  );
}