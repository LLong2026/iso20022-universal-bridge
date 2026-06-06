import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

// Floating ARGIS quick-launch button — sits above the main NavBar
export default function ArgisNavLink() {
  const { pathname } = useLocation();
  if (pathname === '/argis') return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-24 right-4 z-50"
    >
      <Link to="/argis">
        <motion.button
          animate={{ boxShadow: ['0 0 8px #a855f755', '0 0 20px #a855f799', '0 0 8px #a855f755'] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-12 h-12 rounded-full bg-[#0d0021] border-2 border-purple-600/70 flex items-center justify-center hover:border-purple-400 transition-colors group"
          title="ARGIS — Master Orchestration AI"
        >
          <BrainCircuit className="w-5 h-5 text-purple-400 group-hover:text-purple-200 transition-colors" />
        </motion.button>
        <div className="text-[7px] text-purple-500 text-center mt-1 tracking-widest font-mono">ARGIS</div>
      </Link>
    </motion.div>
  );
}