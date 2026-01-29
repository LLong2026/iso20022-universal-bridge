import React from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Zap } from 'lucide-react';

export default function TopologicalResonance({ onCorrupt, isCorrupted, repairProgress }) {
  const getStatusDisplay = () => {
    if (repairProgress !== null) {
      return {
        text: `RECONSTRUCTING: ${repairProgress}%`,
        color: 'text-cyan-400',
        icon: <Zap className="w-4 h-4 animate-pulse" />
      };
    }
    if (isCorrupted) {
      return {
        text: 'STATUS: CORRUPTED (HASH MISMATCH)',
        color: 'text-red-500',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }
    return {
      text: 'SYSTEM HEALTHY',
      color: 'text-green-400',
      icon: <Shield className="w-4 h-4" />
    };
  };

  const status = getStatusDisplay();

  return (
    <Panel title="4. TOPOLOGICAL RESONANCE (SELF-HEAL)">
      <div className="space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          Simulate a data corruption event to test the Kolmogorov Synthesis Engine.
        </p>

        <Button
          onClick={onCorrupt}
          disabled={isCorrupted || repairProgress !== null}
          className="w-full bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider h-10"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          SIMULATE CORRUPTION
        </Button>

        {/* Status Display */}
        <motion.div 
          className={`flex items-center gap-2 text-sm font-semibold ${status.color}`}
          animate={isCorrupted ? { x: [-2, 2, -2, 2, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          {status.icon}
          {status.text}
        </motion.div>

        {/* Progress Bar */}
        {repairProgress !== null && (
          <div className="w-full h-2 bg-[#222] rounded overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${repairProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        {/* Visual Effect */}
        <div className="h-16 bg-[#050505] border border-[#333] relative overflow-hidden">
          {(isCorrupted || repairProgress !== null) && (
            <motion.div
              className="absolute inset-0"
              animate={{
                background: isCorrupted && repairProgress === null
                  ? ['rgba(255,0,0,0.1)', 'rgba(255,0,0,0.3)', 'rgba(255,0,0,0.1)']
                  : ['rgba(0,255,255,0.1)', 'rgba(0,255,255,0.2)', 'rgba(0,255,255,0.1)']
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px'
          }} />

          {repairProgress !== null && (
            <motion.div
              className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-400"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              style={{ transform: 'translateY(-50%)' }}
            />
          )}
        </div>
      </div>
    </Panel>
  );
}