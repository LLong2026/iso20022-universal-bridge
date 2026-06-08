import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function BindNavLink() {
  const { pathname } = useLocation();
  if (pathname === '/bind') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-32 right-4 z-50"
    >
      <Link to="/bind">
        <button className="flex items-center gap-1.5 bg-[#d4af37] border border-[#d4af37]
          text-black rounded-full px-3 py-2 text-[9px] font-bold tracking-widest uppercase
          shadow-lg hover:bg-[#b8962f] transition-all duration-150">
          <Zap className="w-3 h-3" />
          BIND
        </button>
      </Link>
    </motion.div>
  );
}