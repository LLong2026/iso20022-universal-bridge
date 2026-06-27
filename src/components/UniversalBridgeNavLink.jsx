import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export default function UniversalBridgeNavLink() {
  const { pathname } = useLocation();
  if (pathname === '/universal-bridge') return null;
  return (
    <Link to="/universal-bridge">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0a0a0a] border border-[#d4af37] text-[#d4af37] px-3 py-2 rounded-full shadow-lg shadow-[#d4af37]/20 cursor-pointer"
      >
        <GitBranch className="w-4 h-4" />
        <span className="text-[9px] font-bold tracking-widest">UNIVERSAL BRIDGE</span>
      </motion.div>
    </Link>
  );
}