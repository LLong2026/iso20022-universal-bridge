import React from 'react';
import { motion } from 'framer-motion';
import { FileInput, Sparkles, Network, Calculator, Target, Play, Receipt, GitBranch } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'NORMALIZE', desc: 'ISO20022 → Universal Seed', icon: FileInput },
  { n: 2, label: 'TOKENIZE', desc: 'Satoshi Tokenization Machine', icon: Sparkles },
  { n: 3, label: 'RAIL REGISTRY', desc: 'List available rails', icon: Network },
  { n: 4, label: 'EVALUATE', desc: 'Deterministic scoring', icon: Calculator },
  { n: 5, label: 'SELECT', desc: 'Highest score wins', icon: Target },
  { n: 6, label: 'EXECUTE', desc: 'Rail lifecycle handler', icon: Play },
  { n: 7, label: 'RECEIPT', desc: 'Universal settlement receipt', icon: Receipt },
  { n: 8, label: 'COMPLETE', desc: 'Multi-rail universal routing', icon: GitBranch },
];

export default function BridgeFlow({ activeStep }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {STEPS.map((s) => {
        const Icon = s.icon;
        const done = activeStep >= s.n;
        const current = activeStep === s.n;
        return (
          <motion.div key={s.n}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: done ? 1 : 0.4, scale: current ? 1.03 : 1 }}
            className={`border rounded p-2.5 ${done ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-[#222] bg-black/40'} ${current ? 'ring-1 ring-[#d4af37]' : ''}`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${done ? 'text-[#d4af37]' : 'text-gray-600'}`} />
              <span className={`text-[9px] font-bold tracking-wider ${done ? 'text-[#d4af37]' : 'text-gray-600'}`}>{s.n}. {s.label}</span>
            </div>
            <div className="text-[8px] text-gray-600 mt-1">{s.desc}</div>
          </motion.div>
        );
      })}
    </div>
  );
}