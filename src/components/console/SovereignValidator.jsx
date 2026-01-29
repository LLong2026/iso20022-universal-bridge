import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';

export default function SovereignValidator() {
  const [ledgerIndex, setLedgerIndex] = useState(85291004);

  useEffect(() => {
    const interval = setInterval(() => {
      setLedgerIndex(prev => prev + 1);
    }, 3500); // XRP blocks close every ~3.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Panel title="6. SOVEREIGN VALIDATOR NODE (TX-VAL-01)">
      <div className="space-y-3">
        {/* Node Status */}
        <div className="flex items-center">
          <motion.div
            className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2.5"
            animate={{ boxShadow: ['0 0 10px #0f0', '0 0 20px #0f0', '0 0 10px #0f0'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="text-sm font-bold text-white">
            NODE STATUS: ACTIVE (VALIDATING)
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">OPERATOR:</span>
            <span className="text-[#d4af37] font-mono">TEXAS BULLION DEPOSITORY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">PUBKEY:</span>
            <span className="text-gray-300 font-mono text-[10px]">rHhb9...TexasSovereign01</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">LEDGER INDEX:</span>
            <span className="text-gray-300 font-mono">{ledgerIndex.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">CONSENSUS:</span>
            <span className="text-cyan-400 font-mono">UNL (UNIQUE NODE LIST) AUTHORIZED</span>
          </div>
        </div>

        {/* Peer Traffic Visualization */}
        <div className="relative border border-dashed border-[#333] h-[60px] overflow-hidden">
          {/* Central Node */}
          <motion.div
            className="absolute w-1 h-1 bg-[#d4af37]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            animate={{ 
              boxShadow: ['0 0 15px 5px #d4af37', '0 0 25px 8px #d4af37', '0 0 15px 5px #d4af37'] 
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Peer Dots */}
          {[
            { top: '20%', left: '20%' },
            { top: '80%', left: '80%' },
            { top: '30%', left: '70%' },
            { top: '70%', left: '30%' }
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-gray-700"
              style={pos}
              animate={{ 
                opacity: [0.2, 1, 0.2],
                backgroundColor: ['#444', '#0f0', '#444']
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}

          <div className="absolute bottom-0.5 right-0.5 text-[8px] text-gray-600">
            PEER TRAFFIC INBOUND
          </div>
          </div>

          {/* Hardening Protocol Status */}
          <div className="pt-3 border-t border-[#333]">
          <div className="text-[10px] text-gray-500 mb-2">TSI NODE HARDENING v1.0:</div>
          <div className="space-y-1 text-[9px] font-mono">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1 h-1 bg-green-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-green-400">✓ TELEMETRY PURGED</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1 h-1 bg-green-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              />
              <span className="text-green-400">✓ KERNEL LOCKDOWN: CONFIDENTIALITY</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1 h-1 bg-green-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
              />
              <span className="text-green-400">✓ NETWORK STEALTH (IPv6 DISABLED)</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1 h-1 bg-green-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
              <span className="text-green-400">✓ LXD ENCLAVE ACTIVE (ISOLATED)</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1 h-1 bg-cyan-400 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
              />
              <span className="text-cyan-400">⚡ MESH-RADIO-ENCLAVE LIVE</span>
            </div>
          </div>
          </div>
          </div>
          </Panel>
          );
          }