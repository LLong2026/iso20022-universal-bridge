import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';
import { Zap, Satellite, Radio } from 'lucide-react';

export default function RFITrigger() {
  const [satWindow, setSatWindow] = useState({ name: 'Texas-Sovereign-1', active: true });
  const [lastPulse, setLastPulse] = useState(null);
  const [queuedPayload, setQueuedPayload] = useState('ISO20022_XRP_SETTLEMENT_3.2s_CONFIRMED');

  useEffect(() => {
    // Simulate satellite window changes
    const interval = setInterval(() => {
      const active = Math.random() > 0.3; // 70% uptime
      setSatWindow(prev => ({ ...prev, active }));
      
      if (active) {
        // Fire pulse
        const start = Date.now();
        setTimeout(() => {
          const duration = Date.now() - start;
          setLastPulse({
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            duration: `${duration}ms`,
            status: 'SETTLED'
          });
        }, Math.random() * 50 + 10); // 10-60ms
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Panel title="8. RFI TRIGGER (MACH 10 BURST)">
      <div className="space-y-3">
        {/* Satellite Window Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Satellite className="w-3 h-3" />
            SAT WINDOW:
          </span>
          <motion.span 
            className={`font-mono font-bold flex items-center gap-1 ${satWindow.active ? 'text-green-400' : 'text-yellow-400'}`}
            animate={satWindow.active ? {} : { opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: satWindow.active ? 0 : Infinity }}
          >
            {satWindow.active ? '✓ ACTIVE' : '⏳ AWAITING'}
          </motion.span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">SATELLITE:</span>
          <span className="text-cyan-400 font-mono text-[10px]">{satWindow.name}</span>
        </div>

        {/* Hardware Status */}
        <div className="pt-2 border-t border-[#333] space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">HARDWARE:</span>
            <span className="text-[#d4af37] font-mono">HACKRF_TRANSFER</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">FREQUENCY:</span>
            <span className="text-gray-300 font-mono">915.000 MHz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SAMPLE RATE:</span>
            <span className="text-gray-300 font-mono">2 Msps</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">GAIN:</span>
            <span className="text-gray-300 font-mono">20 dB</span>
          </div>
        </div>

        {/* Queued Payload */}
        <div className="pt-2 border-t border-[#333]">
          <div className="text-[9px] text-gray-500 mb-1">QUEUED PAYLOAD:</div>
          <div className="bg-black border border-[#333] p-2 text-[9px] text-green-400 font-mono break-all">
            {queuedPayload}
          </div>
        </div>

        {/* Last Pulse Status */}
        <AnimatePresence mode="wait">
          {lastPulse && (
            <motion.div
              key={lastPulse.time}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-2 border-t border-[#333]"
            >
              <div className="flex items-center gap-2 text-[10px]">
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Zap className="w-3 h-3 text-yellow-400" />
                </motion.div>
                <span className="text-yellow-400 font-bold">BOOM. PULSE FIRED</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[9px] ml-5">
                <div className="text-gray-400">Time: {lastPulse.time}</div>
                <div className="text-gray-400">Duration: {lastPulse.duration}</div>
                <div className="text-green-400">Status: {lastPulse.status} | Record: CLEAN</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Diode Indicator */}
        <div className="pt-2 border-t border-[#333] flex items-center justify-between text-[9px]">
          <span className="text-gray-500 flex items-center gap-1">
            <Radio className="w-3 h-3" />
            DATA DIODE:
          </span>
          <span className="text-cyan-400 font-mono">FIRE & FORGET MODE</span>
        </div>
      </div>
    </Panel>
  );
}