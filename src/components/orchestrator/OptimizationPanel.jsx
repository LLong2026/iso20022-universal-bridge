import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const typeColors = {
  prompt:   '#a855f7',
  model:    '#22d3ee',
  routing:  '#fbbf24',
  cost:     '#4ade80',
};

export default function OptimizationPanel({ optimizations, onApprove, onReject }) {
  const pending = optimizations.filter(o => o.status === 'proposed');
  const history = optimizations.filter(o => o.status !== 'proposed').slice(-8);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="text-[10px] text-gray-500 tracking-widest mb-3">SELF-OPTIMIZATION QUEUE</div>

      {/* Pending approvals */}
      <div className="mb-4 flex-1 overflow-auto">
        <div className="text-[9px] text-yellow-500 mb-2 tracking-wider">
          AWAITING APPROVAL ({pending.length})
        </div>
        <AnimatePresence>
          {pending.length === 0 && (
            <div className="text-[10px] text-gray-600 italic px-1">No pending optimizations.</div>
          )}
          {pending.map(opt => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="border border-yellow-900/40 rounded p-2 mb-2 bg-[#0f0f0a]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold" style={{ color: typeColors[opt.type] || '#fff' }}>
                  [{opt.type?.toUpperCase()}]
                </span>
                <span className="text-[9px] text-green-400">+{opt.scoreDelta} pts</span>
              </div>
              <div className="text-[9px] text-yellow-300 mb-0.5 font-semibold">{opt.agent}</div>
              <div className="text-[9px] text-gray-400 mb-2">{opt.description}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => onApprove(opt.id)}
                  className="flex-1 text-[9px] py-0.5 border border-green-700 text-green-400 rounded hover:bg-green-900/20 transition-colors"
                >
                  APPROVE
                </button>
                <button
                  onClick={() => onReject(opt.id)}
                  className="flex-1 text-[9px] py-0.5 border border-red-800 text-red-400 rounded hover:bg-red-900/20 transition-colors"
                >
                  REJECT
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* History */}
      <div>
        <div className="text-[9px] text-gray-600 mb-2 tracking-wider">RECENT DECISIONS</div>
        <div className="space-y-1">
          {history.reverse().map(opt => (
            <div key={opt.id} className="flex items-center gap-2 text-[9px]">
              <span className={opt.status === 'approved' ? 'text-green-500' : 'text-red-500'}>
                {opt.status === 'approved' ? '✓' : '✗'}
              </span>
              <span className="text-gray-500 truncate">{opt.agent}</span>
              <span className="text-gray-600 truncate flex-1">{opt.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}