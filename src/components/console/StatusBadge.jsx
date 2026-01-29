import React from 'react';
import { motion } from 'framer-motion';

export default function StatusBadge({ label, value, variant = 'success' }) {
  const variants = {
    success: {
      bg: 'bg-[#003300]',
      border: 'border-green-500',
      text: 'text-green-400',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]'
    },
    danger: {
      bg: 'bg-[#330000]',
      border: 'border-red-500',
      text: 'text-red-400',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    },
    warning: {
      bg: 'bg-[#332200]',
      border: 'border-yellow-500',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]'
    }
  };

  const style = variants[variant];

  return (
    <motion.div 
      className={`${style.bg} ${style.text} px-3 py-1.5 border ${style.border} text-xs font-bold ${style.glow}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <span className="opacity-70">{label}:</span> {value}
    </motion.div>
  );
}