import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';

const typeColors = {
  INIT: 'text-blue-400',
  SECURE: 'text-purple-400',
  INFO: 'text-gray-400',
  MINT: 'text-[#d4af37]',
  TX: 'text-green-400',
  ERR: 'text-red-500',
  FIX: 'text-cyan-400',
  BRIDGE: 'text-emerald-400'
};

export default function LedgerLog({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Panel title="2. LONE STAR LEDGER (IMMUTABLE LOG)" className="h-full min-h-[300px]">
      <div 
        ref={containerRef}
        className="flex-grow overflow-y-auto bg-black p-3 border border-[#333] text-xs space-y-1 max-h-[350px] scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-b border-[#222] pb-1 flex gap-2 items-start"
            >
              <span className="text-[#666] shrink-0">[{log.time}]</span>
              <span className={`font-bold shrink-0 ${typeColors[log.type] || 'text-gray-400'}`}>
                {log.type}
              </span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[#d4af37]">{'>'}</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-2 h-4 bg-[#d4af37]"
          />
        </div>
      </div>
    </Panel>
  );
}