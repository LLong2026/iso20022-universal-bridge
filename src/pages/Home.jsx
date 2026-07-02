import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LedgerLog from '@/components/console/LedgerLog';
import FractalBindingWrapper from '@/components/console/FractalBindingWrapper';
import ArtifactUploader from '@/components/console/ArtifactUploader';
import IsoBridge from '@/components/console/IsoBridge';
import TopologicalResonance from '@/components/console/TopologicalResonance';
import AuditDashboard from '@/components/console/AuditDashboard';
import StatusBadge from '@/components/console/StatusBadge';
import SovereignValidator from '@/components/console/SovereignValidator';
import GlobalUplink from '@/components/console/GlobalUplink';
import { Link } from 'react-router-dom';


export default function Home() {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState([
    { time: 'SYSTEM', type: 'INIT', message: 'KERNEL LOADED. RUST ENVIRONMENT ACTIVE.' },
    { time: 'SYSTEM', type: 'SECURE', message: 'AIR-GAP ESTABLISHED.' }
  ]);
  const [lastHash, setLastHash] = useState(null);
  const [injectedSerial, setInjectedSerial] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [repairProgress, setRepairProgress] = useState(null);
  const savedTokensRef = useRef(0);
  const seenSettlementsRef = useRef(new Set());

  // Fetch real audit data
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditData'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getAuditData', {});
      return data;
    },
    refetchInterval: 5000,
    initialData: { physicalGold: 0, digitalTokens: 0, currentUtxo: 'SAT-INIT', recentTransactions: [] }
  });

  const physicalGold = auditData?.physicalGold || 0;
  const digitalTokens = auditData?.digitalTokens || 0;
  const currentSatoshi = auditData?.currentUtxo || 'SAT-INIT';

  const addLog = useCallback((type, message) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, type, message }]);
  }, []);

  // Stream Universal Bridge settlement events into the Lone Star Ledger
  useEffect(() => {
    const formatSettlement = (entry) => {
      const a = entry.after_state || {};
      const rail = (a.selected_rail || 'UNKNOWN').toUpperCase().replace(/ /g, '_');
      const receipt = a.receipt_id || entry.log_id || 'N/A';
      const proof = (a.settlement_proof || entry.log_hash || '').substring(0, 12);
      const amt = a.amount != null ? `${a.amount} ${a.currency || ''}`.trim() : '';
      const parties = a.sender && a.receiver ? `${a.sender} → ${a.receiver}` : '';
      const time = entry.created_date
        ? new Date(entry.created_date).toLocaleTimeString('en-US', { hour12: false })
        : new Date().toLocaleTimeString('en-US', { hour12: false });
      return {
        time,
        type: 'BRIDGE',
        message: `UNIVERSAL ROUTE COMPLETE | RAIL: ${rail} | RECEIPT: ${receipt} | PROOF: ${proof}...${amt ? ' | ' + amt : ''}${parties ? ' | ' + parties : ''}`
      };
    };

    base44.entities.AuditLog.filter({ action: 'SETTLEMENT' }, '-created_date', 10)
      .then((entries) => {
        if (!entries || !entries.length) return;
        const formatted = [...entries].reverse()
          .filter((e) => !seenSettlementsRef.current.has(e.log_id))
          .map((e) => { seenSettlementsRef.current.add(e.log_id); return formatSettlement(e); });
        if (formatted.length) setLogs(prev => [...prev, ...formatted]);
      })
      .catch(() => {});

    const unsubscribe = base44.entities.AuditLog.subscribe((event) => {
      if (event.type !== 'create') return;
      const entry = event.data;
      if (!entry || entry.action !== 'SETTLEMENT') return;
      if (seenSettlementsRef.current.has(entry.log_id)) return;
      seenSettlementsRef.current.add(entry.log_id);
      setLogs(prev => [...prev, formatSettlement(entry)]);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const mintMutation = useMutation({
    mutationFn: async ({ serial, weight }) => {
      const response = await base44.functions.invoke('mintGold', {
        serial_number: serial,
        weight_grams: Number(weight)
      });
      return response.data;
    },
    onSuccess: (data) => {
      setLastHash(data.bindingHash);
      addLog('MINT', `SUCCESS: ${data.goldAsset.weight_grams}g BOUND TO ${data.utxoId}. HASH: ${data.bindingHash.substring(0, 16)}...`);
      queryClient.invalidateQueries(['auditData']);
    },
    onError: (error) => {
      console.error('Mint error:', error);
      addLog('ERR', `MINT FAILED: ${error.response?.data?.error || error.message}`);
    }
  });

  const handleMint = useCallback((serial, weight) => {
    addLog('INFO', `INITIATING FRACTAL BINDING FOR ${serial}...`);
    setTimeout(() => {
      mintMutation.mutate({ serial, weight });
    }, 800);
  }, [addLog, mintMutation]);

  const transferMutation = useMutation({
    mutationFn: async ({ amount, sender, receiver }) => {
      const response = await base44.functions.invoke('transferViaXRP', {
        amount_grams: amount,
        sender,
        receiver
      });
      return response.data;
    },
    onSuccess: (data) => {
      addLog('BRIDGE', `XRP SETTLEMENT COMPLETE VIA ${data.usedUtxo} | TIME: ${data.settlementTimeMs}ms`);
      addLog('INFO', `QUEUING NEXT UTXO: ${data.nextUtxo}`);
      queryClient.invalidateQueries(['auditData']);
    },
    onError: (error) => {
      addLog('ERR', `TRANSFER FAILED: ${error.message}`);
    }
  });

  const handleTransfer = useCallback(() => {
    if (digitalTokens <= 0) {
      addLog('ERR', 'CANNOT TRANSFER: INSUFFICIENT RESERVES.');
      return;
    }

    const amt = Math.min(50, digitalTokens);
    const sender = "TREASURY_WALLET_01";
    const receiver = "FED_RESERVE_BANK";

    addLog('TX', `INITIATING TRANSFER: ${amt}g -> ${receiver} | SATOSHI: ${currentSatoshi}`);

    const txId = "LSL-" + Math.floor(Math.random() * 999999);
    setLastTransaction({
      txId,
      amount: amt,
      sender,
      receiver,
      timestamp: new Date().toISOString()
    });

    transferMutation.mutate({ amount: amt, sender, receiver });
  }, [digitalTokens, currentSatoshi, addLog, transferMutation]);

  const corruptMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('simulateCorruption', {});
      return response.data;
    },
    onSuccess: (data) => {
      setIsCorrupted(false);
      setRepairProgress(null);
      addLog('FIX', `KOLMOGOROV SYNTHESIS COMPLETE. RESTORED: ${data.reconstructedGold}g`);
      queryClient.invalidateQueries(['auditData']);
    }
  });

  const handleCorrupt = useCallback(() => {
    addLog('ERR', 'CRITICAL ALERT: SECTOR 7 CORRUPTION DETECTED.');
    setIsCorrupted(true);

    setTimeout(() => {
      addLog('FIX', 'ENGAGING TOPOLOGICAL RESONANCE ENGINE...');
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setRepairProgress(Math.floor((step / 10) * 100));

        if (step >= 10) {
          clearInterval(interval);
          corruptMutation.mutate();
        }
      }, 200);
    }, 1500);
  }, [addLog, corruptMutation]);

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
            UNIVERSAL LIFE CYCLE END - END
            <span className="text-xs text-gray-500 ml-2 tracking-normal">v1.0.4 (RUST CORE)</span>
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/orchestrator">
            <StatusBadge label="AI AGENTS" value="ORCHESTRATOR →" variant="warning" />
          </Link>
          <StatusBadge label="AIR-GAP" value="ACTIVE" variant="success" />
          <StatusBadge 
            label="SOLVENCY" 
            value={`${solvencyPercent}%`} 
            variant={solvencyPercent === 100 ? 'success' : 'danger'} 
          />
        </div>
      </motion.header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 flex-grow">
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <ArtifactUploader onArtifactReady={(serial) => setInjectedSerial(serial)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FractalBindingWrapper onMint={handleMint} lastHash={lastHash} injectedSerial={injectedSerial} />
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
          <IsoBridge />
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
            currentSatoshi={currentSatoshi}
          />
        </motion.div>

        {/* Row 3 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-3"
        >
          <SovereignValidator />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <GlobalUplink />
        </motion.div>
      </div>
    </div>
  );
}