import React from 'react';
import { motion } from 'framer-motion';

export default function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-[#111] border border-[#333] p-4 flex flex-col h-full ${className}`}>
      <div className="text-[#d4af37] border-b border-[#333] pb-2 mb-4 text-sm uppercase tracking-wider font-semibold">
        {title}
      </div>
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}