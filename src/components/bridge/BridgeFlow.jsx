import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const STEPS = [
  { n: 1, title: 'NORMALIZE', sub: 'ISO20022 → Universal Seed' },
  { n: 2, title: 'TOKENIZE', sub: 'Satoshi Tokenization Machine' },
  { n: 3, title: 'RAIL REGISTRY', sub: 'List available rails' },
  { n: 4, title: 'EVALUATE', sub: 'Deterministic scoring' },
  { n: 5, title: 'SELECT', sub: 'Highest score wins' },
  { n: 6, title: 'EXECUTE', sub: 'Rail lifecycle handler' },
  { n: 7, title: 'RECEIPT', sub: 'Universal settlement receipt' },
  { n: 8, title: 'COMPLETE', sub: 'Multi-rail universal routing' },
];

export default function BridgeFlow({ activeStep }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
      {STEPS.map((s) => {
        const isActive = activeStep === s.n;
        const isDone = activeStep > s.n;
        return (
          <motion.div
            key={s.n}
            animate={{
              borderColor: isActive ? '#d4af37' : isDone ? 'rgba(34,197,94,0.4)' : '#222',
              backgroundColor: isActive ? 'rgba(212,175,55,0.06)' : isDone ? 'rgba(20,83,45,0.08)' : 'rgba(0,0,0,0.3)'
            }}
            className="border rounded p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold tracking-wider ${isActive ? 'text-[#d4af37]' : isDone ? 'text-green-400' : 'text-gray-600'}`}>
                {s.n}. {s.title}
              </span>
              {isDone && <CheckCircle className="w-3 h-3 text-green-400" />}
            </div>
            <div className="text-[8px] text-gray-600 mt-0.5">{s.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}