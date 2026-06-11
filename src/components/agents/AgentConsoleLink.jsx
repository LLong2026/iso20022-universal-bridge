import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentConsoleLink() {
  const { pathname } = useLocation();
  if (pathname === '/agents') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-4 z-50">
      <Link to="/agents"
        className="flex items-center gap-2 px-3 py-2 rounded-full
          bg-[#0d0d0d] border border-[#a78bfa]/40 text-[#a78bfa]
          text-[9px] font-bold tracking-widest uppercase
          hover:border-[#a78bfa]/70 hover:bg-[#a78bfa]/10
          shadow-lg shadow-black/60 transition-all">
        <Bot className="w-3 h-3" />
        AI AGENTS
      </Link>
    </motion.div>
  );
}