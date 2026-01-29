import React from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Scale, Coins, Database, Radar } from 'lucide-react';

export default function AuditDashboard({ physicalGold, digitalTokens, currentSatoshi }) {
  const isSolvent = physicalGold === digitalTokens;
  const ratio = physicalGold > 0 ? (digitalTokens / physicalGold) : 1;

  const metrics = [
    {
      label: 'TOTAL PHYSICAL GOLD',
      value: `${physicalGold.toFixed(2)}g`,
      icon: <Scale className="w-4 h-4" />
    },
    {
      label: 'TOTAL DIGITAL TOKENS',
      value: `${digitalTokens.toFixed(2)}g`,
      icon: <Coins className="w-4 h-4" />
    }
  ];

  return (
    <Panel title="5. REAL-TIME AUDIT">
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="flex justify-between items-center text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-gray-400 flex items-center gap-2">
              {metric.icon}
              {metric.label}:
            </span>
            <motion.span 
              className="font-bold text-[#d4af37]"
              key={metric.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {metric.value}
            </motion.span>
          </motion.div>
        ))}

        {/* Ratio Display */}
        <div className="flex justify-between items-center text-sm pt-2 border-t border-[#333]">
          <span className="text-gray-400 flex items-center gap-2">
            <Database className="w-4 h-4" />
            RATIO:
          </span>
          <motion.span 
            className={`font-bold ${isSolvent ? 'text-green-400' : 'text-red-500'}`}
            animate={!isSolvent ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.5, repeat: !isSolvent ? Infinity : 0 }}
          >
            {isSolvent ? '1:1 (SOLVENT)' : 'MISMATCH (INSOLVENT)'}
          </motion.span>
        </div>

        {/* Visual Ratio Bar */}
        <div className="h-3 bg-[#222] rounded overflow-hidden relative">
          <motion.div
            className={`h-full ${isSolvent ? 'bg-green-500' : 'bg-red-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/70">
            {(ratio * 100).toFixed(0)}%
          </div>
        </div>

        {/* XRP Payment Rail Section */}
        <div className="pt-3 border-t border-[#333]">
          <label className="text-xs text-gray-500 flex items-center gap-2 mb-2">
            <Radar className="w-3 h-3" />
            XRP PAYMENT RAIL
          </label>
          <motion.div 
            className="text-[10px] bg-black/50 p-2 border border-[#333] space-y-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-blue-400">⚡ XRPL NODE: SYNCED</div>
            <motion.div 
              key={currentSatoshi}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-[#d4af37] font-bold"
            >
              QUEUED: {currentSatoshi}... (READY)
            </motion.div>
            <div className="text-green-400">SETTLEMENT: 3-5s</div>
          </motion.div>
        </div>
      </div>
    </Panel>
  );
}