import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Panel from './Panel';
import { Satellite, Radio, CheckCircle2 } from 'lucide-react';

export default function SatelliteReceiver() {
  const [signalStrength, setSignalStrength] = useState(-92);
  const [lastSync, setLastSync] = useState(null);
  const [isListening, setIsListening] = useState(true);
  const [fftActivity, setFftActivity] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Simulate signal strength variation
    const signalInterval = setInterval(() => {
      setSignalStrength(Math.floor(Math.random() * (-85 - -95 + 1) + -95));
    }, 1500);

    return () => clearInterval(signalInterval);
  }, []);

  useEffect(() => {
    // Simulate ledger sync detection
    const syncInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        setLastSync({
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          blockHeight: Math.floor(85291000 + Math.random() * 100)
        });
      }
    }, 7000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    // FFT visualization
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let offset = 0;

    const drawSpectrum = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw FFT bars
      const bars = 64;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * 30 + 10 + Math.sin((i + offset) * 0.1) * 15;
        const x = i * barWidth;
        const y = canvas.height - height;

        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, '#0ea5e9');
        gradient.addColorStop(1, '#0369a1');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, height);
      }

      offset += 0.5;
      animationRef.current = requestAnimationFrame(drawSpectrum);
    };

    drawSpectrum();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Panel title="9. SATELLITE RECEIVER (BLACK CHAIN)">
      <div className="space-y-3">
        {/* Hardware Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Satellite className="w-3 h-3" />
            SDR STATUS:
          </span>
          <motion.span 
            className="font-mono text-green-400 flex items-center gap-1"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Radio className="w-3 h-3" />
            LISTENING
          </motion.span>
        </div>

        {/* Reception Parameters */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">FREQUENCY:</span>
            <span className="text-gray-300 font-mono">1.200 GHz (Ku-BAND)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SAMPLE RATE:</span>
            <span className="text-gray-300 font-mono">2.048 Msps</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SIGNAL:</span>
            <motion.span 
              key={signalStrength}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`font-mono ${signalStrength > -90 ? 'text-green-400' : 'text-yellow-400'}`}
            >
              {signalStrength} dBm
            </motion.span>
          </div>
        </div>

        {/* FFT Spectrum Display */}
        <div className="relative border border-[#333] bg-black h-[60px] overflow-hidden">
          <canvas ref={canvasRef} width={300} height={60} className="w-full h-full" />
          <div className="absolute top-0.5 left-0.5 text-[8px] text-cyan-400">
            FFT: WIDEBAND LEDGER SCAN
          </div>
        </div>

        {/* Listening Status */}
        <div className="pt-2 border-t border-[#333] text-[10px] text-gray-400 flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          LISTENING FOR ISO 20022 LEDGER BROADCAST...
        </div>

        {/* Last Sync Event */}
        <AnimatePresence mode="wait">
          {lastSync && (
            <motion.div
              key={lastSync.time}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-2 border-t border-[#333]"
            >
              <div className="flex items-center gap-2 text-[10px]">
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                </motion.div>
                <span className="text-green-400 font-bold">✓ BLACK CHAIN SYNC</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[9px] ml-5">
                <div className="text-gray-400">Time: {lastSync.time}</div>
                <div className="text-cyan-400">Block: #{lastSync.blockHeight.toLocaleString()}</div>
                <div className="text-green-400">Records: SECURE | Signature: MATCHED</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passive Mode Indicator */}
        <div className="pt-2 border-t border-[#333] flex items-center justify-between text-[9px]">
          <span className="text-gray-500">MODE:</span>
          <span className="text-[#d4af37] font-mono">PASSIVE DOWNLINK (RX ONLY)</span>
        </div>
      </div>
    </Panel>
  );
}