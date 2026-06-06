import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Network, Zap } from 'lucide-react';

export default function ArgisHeader({ running, onToggle, agentCount, nodeCount }) {
  return (
    <div className="shrink-0 border-b border-purple-900/40 bg-[#05051a] px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-600 hover:text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: running ? [1,0.3,1] : 0.3, scale: running ? [1,1.2,1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-purple-500"
            />
            <h1 className="text-sm font-bold tracking-[0.25em] text-purple-300 uppercase">
              ARGIS — Master Orchestration Intelligence
            </h1>
          </div>
          <p className="text-[9px] text-gray-600 tracking-widest">
            AGENT ORCHESTRION DEPLOYMENT · PRODUCTION GRADE · INFINITE SCALE
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <Cpu className="w-3 h-3 text-purple-400" />
          <span className="text-purple-300 font-bold">{agentCount}</span> AGENTS
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <Network className="w-3 h-3 text-cyan-400" />
          <span className="text-cyan-300 font-bold">{nodeCount}</span> NODES
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-yellow-300 font-bold">∞</span> SCALE
        </div>
        <button onClick={onToggle}
          className={`px-3 py-1 text-[10px] border rounded tracking-wider transition-colors ${
            running ? 'border-green-600 text-green-400 hover:bg-green-900/20' : 'border-red-600 text-red-400 hover:bg-red-900/20'
          }`}>
          {running ? '⬤ LIVE' : '◼ PAUSED'}
        </button>
      </div>
    </div>
  );
}