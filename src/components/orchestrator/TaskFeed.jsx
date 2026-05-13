import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const typeColors = {
  INIT:   { text: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  INFO:   { text: '#60a5fa', bg: 'rgba(96,165,250,0.05)' },
  ROUTE:  { text: '#22d3ee', bg: 'rgba(34,211,238,0.05)' },
  METRIC: { text: '#4ade80', bg: 'rgba(74,222,128,0.05)' },
  OPT:    { text: '#fbbf24', bg: 'rgba(251,191,36,0.05)'  },
  SCALE:  { text: '#fb7185', bg: 'rgba(251,113,133,0.05)' },
  AUDIT:  { text: '#34d399', bg: 'rgba(52,211,153,0.05)'  },
  SETTLE: { text: '#d4af37', bg: 'rgba(212,175,55,0.05)'  },
  ERR:    { text: '#ef4444', bg: 'rgba(239,68,68,0.05)'   },
};

export default function TaskFeed({ feed }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  return (
    <div className="flex-1 overflow-auto p-3 bg-[#050510]">
      <div className="text-[10px] text-gray-500 tracking-widest mb-2">LIVE TASK FEED</div>
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {feed.map(entry => {
            const style = typeColors[entry.type] || typeColors.INFO;
            const timeStr = entry.time instanceof Date
              ? entry.time.toLocaleTimeString('en-US', { hour12: false })
              : '--:--:--';
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 px-2 py-1 rounded text-[10px]"
                style={{ backgroundColor: style.bg }}
              >
                <span className="text-gray-600 shrink-0 mt-0.5">{timeStr}</span>
                <span className="font-bold shrink-0" style={{ color: style.text }}>[{entry.type}]</span>
                <span className="text-gray-400 shrink-0 truncate max-w-[120px]">{entry.agent}:</span>
                <span className="text-gray-300">{entry.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}