import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LedgerLog from '@/components/console/LedgerLog';
import FractalBinding from '@/components/console/FractalBinding';
import IsoBridge from '@/components/console/IsoBridge';
import TopologicalResonance from '@/components/console/TopologicalResonance';
import AuditDashboard from '@/components/console/AuditDashboard';
import StatusBadge from '@/components/console/StatusBadge';

export default function Home() {
  const [logs, setLogs] = useState([
    { time: 'SYSTEM', type: 'INIT', message: 'KERNEL LOADED. RUST ENVIRONMENT ACTIVE.' },
    { time: 'SYSTEM', type: 'SECURE', message: 'AIR-GAP ESTABLISHED.' }
  ]);
  const [physicalGold, setPhysicalGold] = useState(0);
  const [digitalTokens, setDigitalTokens] = useState(0);
  const [lastHash, setLastHash] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [repairProgress, setRepairProgress] = useState(null);
  const savedTokensRef = useRef(0);

  const addLog = useCallback((type, message) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, type, message }]);
  }, []);

  const handleMint = useCallback((serial, weight) => {
    addLog('INFO', `INITIATING FRACTAL BINDING FOR ${serial}...`);
    
    setTimeout(() => {
      const hash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setLastHash(hash);
      setPhysicalGold(prev => prev + weight);
      setDigitalTokens(prev => prev + weight);
      addLog('MINT', `SUCCESS: ${weight}g BOUND TO SATOSHI. HASH: ${hash.substring(0, 16)}...`);
    }, 800);
  }, [addLog]);

  const handleTransfer = useCallback(() => {
    if (digitalTokens <= 0) {
      addLog('ERR', 'CANNOT TRANSFER: INSUFFICIENT RESERVES.');
      return;
    }

    const amt = Math.min(50, digitalTokens);
    const txId = "LSL-" + Math.floor(Math.random() * 999999);
    const sender = "TREASURY_WALLET_01";
    const receiver = "FED_RESERVE_BANK";

    addLog('TX', `INITIATING TRANSFER: ${amt}g -> ${receiver}`);

    setLastTransaction({
      txId,
      amount: amt,
      sender,
      receiver,
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      addLog('BRIDGE', 'HOMOMORPHIC MAPPING COMPLETE. SENT TO FEDWIRE.');
    }, 1500);
  }, [digitalTokens, addLog]);

  const handleCorrupt = useCallback(() => {
    addLog('ERR', 'CRITICAL ALERT: SECTOR 7 CORRUPTION DETECTED.');
    setIsCorrupted(true);
    savedTokensRef.current = digitalTokens;
    setDigitalTokens(0);

    setTimeout(() => {
      addLog('FIX', 'ENGAGING TOPOLOGICAL RESONANCE ENGINE...');
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setRepairProgress(Math.floor((step / 10) * 100));

        if (step >= 10) {
          clearInterval(interval);
          setDigitalTokens(savedTokensRef.current);
          setIsCorrupted(false);
          setRepairProgress(null);
          addLog('FIX', 'KOLMOGOROV SYNTHESIS COMPLETE. LEDGER RESTORED.');
        }
      }, 200);
    }, 1500);
  }, [digitalTokens, addLog]);

  const solvencyPercent = physicalGold > 0 
    ? Math.round((digitalTokens / physicalGold) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6 flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#d4af37] pb-4 mb-6 gap-4"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase">
            LONE STAR LEDGER
            <span className="text-xs text-gray-500 ml-2 tracking-normal">v1.0.4 (RUST CORE)</span>
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <StatusBadge label="AIR-GAP" value="ACTIVE" variant="success" />
          <StatusBadge 
            label="SOLVENCY" 
            value={`${solvencyPercent}%`} 
            variant={solvencyPercent === 100 ? 'success' : 'danger'} 
          />
        </div>
      </motion.header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-grow">
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FractalBinding onMint={handleMint} lastHash={lastHash} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <LedgerLog logs={logs} />
        </motion.div>

        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <IsoBridge 
            onTransfer={handleTransfer} 
            lastTransaction={lastTransaction}
            hasTokens={digitalTokens > 0}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TopologicalResonance 
            onCorrupt={handleCorrupt}
            isCorrupted={isCorrupted}
            repairProgress={repairProgress}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AuditDashboard 
            physicalGold={physicalGold}
            digitalTokens={digitalTokens}
          />
        </motion.div>
      </div>
    </div>
  );
}