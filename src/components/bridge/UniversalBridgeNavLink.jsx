import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';

export default function UniversalBridgeNavLink() {
  const { pathname } = useLocation();
  if (pathname === '/universal-bridge') return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-40 right-4 z-50"
    >
      <Link to="/universal-bridge">
        <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#d4af37]/40 rounded-full px-4 py-2.5 shadow-xl shadow-black/60 hover:border-[#d4af37] transition-colors group">
          <Network className="w-4 h-4 text-[#d4af37]" />
          <span className="text-[9px] font-bold tracking-widest text-gray-400 group-hover:text-[#d4af37] uppercase">Universal Bridge</span>
        </div>
      </Link>
    </motion.div>
  );
}