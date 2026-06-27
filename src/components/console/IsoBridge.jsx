import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Send, Zap, Loader } from 'lucide-react';

function buildXml(seed, token, rail, receipt) {
  const proof = receipt?.settlement_proof ? receipt.settlement_proof.substring(0, 32) + '...' : 'PENDING';
  return `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${seed.instruction_id}</MsgId>
      <CreDtTm>${seed.timestamp}</CreDtTm>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys><Prtry>${rail.name.toUpperCase().replace(/ /g, '_')}</Prtry></ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>${token.token_id}</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="${seed.currency}">${seed.amount}.00</IntrBkSttlmAmt>
      <Dbtr><Nm>${seed.sender}</Nm></Dbtr>
      <Cdtr><Nm>${seed.receiver}</Nm></Cdtr>
      <SplmtryData>
        <PlcAndNm>UNIVERSAL_BRIDGE</PlcAndNm>
        <Envlp><UniversalBridge>
          <SelectedRail>${rail.name}</SelectedRail>
          <RailScore>${rail.score.toFixed(4)}</RailScore>
          <SeedId>${seed.seed_id}</SeedId>
          <TokenHash>${token.token_hash.substring(0, 32)}...</TokenHash>
          <SatoshiAnchor>${token.satoshi_anchor}</SatoshiAnchor>
          <LifecycleId>${receipt.lifecycle_id}</LifecycleId>
          <SettlementProof>${proof}</SettlementProof>
        </UniversalBridge></Envlp>
      </SplmtryData>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

const BRIDGE_PROFILES = [
  { priority: 'fastest', amount: 1000, currency: 'USD', counterparty_tier: 'retail', sender: 'TREASURY_WALLET_01', receiver: 'FED_RESERVE_BANK' },
  { priority: 'most_compliant', amount: 50000, currency: 'USD', counterparty_tier: 'treasury', sender: 'TREASURY_WALLET_01', receiver: 'FED_RESERVE_BANK' },
  { priority: 'cheapest', amount: 500, currency: 'USD', counterparty_tier: 'retail', sender: 'TREASURY_WALLET_01', receiver: 'FED_RESERVE_BANK' },
  { priority: 'highest_finality', amount: 250000, currency: 'USD', counterparty_tier: 'central_bank', sender: 'TREASURY_WALLET_01', receiver: 'FED_RESERVE_BANK' }
];

export default function IsoBridge() {
  const [displayed, setDisplayed] = useState('WAITING FOR TRANSACTION...');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('READY');
  const [railName, setRailName] = useState('RAIL');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const cycleRef = useRef(0);

  const statusColors = {
    READY: 'text-blue-400',
    PROCESSING: 'text-yellow-400',
    SETTLED: 'text-green-400',
    FAILED: 'text-red-400'
  };

  const execute = async () => {
    setExecuting(true); setError(null); setStatus('PROCESSING');
    setDisplayed(''); setIsTyping(true);
    try {
      const profile = BRIDGE_PROFILES[cycleRef.current % BRIDGE_PROFILES.length];
      cycleRef.current++;
      const { data } = await base44.functions.invoke('universalBridge', {
        action: 'execute',
        instruction: profile
      });

      setRailName(data.selected_rail.name);

      const scoreLines = data.scored_rails
        .map(r => `  ${r.name.padEnd(20)} SCORE: ${r.score.toFixed(4)}`).join('\n');
      const feed = [
        '> STEP 1 — NORMALIZE: ISO20022 → UNIVERSAL SEED',
        `  SEED_ID: ${data.seed.seed_id}`,
        `  AMOUNT: ${data.seed.amount} ${data.seed.currency}`,
        `  PRIORITY: ${data.seed.priority} | TIER: ${data.seed.counterparty_tier}`,
        `  SENDER: ${data.seed.sender} → RECEIVER: ${data.seed.receiver}`,
        '',
        '> STEP 2 — TOKENIZE: SATOSHI TOKENIZATION MACHINE',
        `  TOKEN_ID: ${data.token.token_id}`,
        `  SATOSHI_ANCHOR: ${data.token.satoshi_anchor}`,
        `  TOKEN_HASH: ${data.token.token_hash.substring(0, 32)}...`,
        '',
        '> STEP 3/4 — RAIL REGISTRY & DETERMINISTIC EVALUATION',
        scoreLines,
        '',
        `> STEP 5 — SELECT: ${data.selected_rail.name} (SCORE: ${data.selected_rail.score.toFixed(4)})`,
        '',
        `> STEP 6 — EXECUTE: ${data.selected_rail.name} LIFECYCLE`,
        `  LIFECYCLE_ID: ${data.lifecycle.lifecycle_id}`,
        `  SETTLEMENT_PROOF: ${data.lifecycle.settlement_proof.substring(0, 32)}...`,
        '',
        `> STEP 7 — UNIVERSAL RECEIPT: ${data.receipt.receipt_id}`,
        `  STATUS: ${data.receipt.status.toUpperCase()}`,
        '',
        '> STEP 8 — ISO20022 SETTLEMENT MESSAGE:',
        buildXml(data.seed, data.token, data.selected_rail, data.receipt)
      ].join('\n');

      let i = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setDisplayed(prev => prev + feed.charAt(i));
        i++;
        if (i >= feed.length) {
          clearInterval(intervalRef.current);
          setIsTyping(false);
          setStatus(data.receipt.status === 'settled' ? 'SETTLED' : 'FAILED');
        }
      }, 3);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'EXECUTION FAILED';
      setError(msg);
      setStatus('FAILED');
      setDisplayed('EXECUTION FAILED: ' + msg);
      setIsTyping(false);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Panel title="3. ISO 20022 → UNIVERSAL BRIDGE">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500">{railName} LEDGER STATUS:</span>
          <motion.span
            className={`font-bold flex items-center gap-1 ${statusColors[status]}`}
            animate={status === 'PROCESSING' ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Zap className="w-3 h-3" />
            {status}
          </motion.span>
        </div>

        <div className="flex-grow bg-black border border-[#333] p-3 overflow-y-auto min-h-[180px] max-h-[240px]">
          <pre className="text-[10px] text-gray-400 whitespace-pre-wrap break-all font-mono">
            {displayed}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-1.5 h-3 bg-green-400 ml-0.5"
              />
            )}
          </pre>
        </div>

        <Button
          onClick={execute}
          disabled={executing || isTyping}
          className="mt-3 w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10"
        >
          {executing
            ? <><Loader className="w-4 h-4 mr-2 animate-spin" />ROUTING...</>
            : <><Send className="w-4 h-4 mr-2" />EXECUTE UNIVERSAL BRIDGE</>}
        </Button>

        {status === 'SETTLED' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-[10px] text-green-400 bg-green-950/30 border border-green-500/30 p-2 rounded"
          >
            ✓ SETTLED VIA {railName} | ISO 20022 COMPLIANT | MULTI-RAIL UNIVERSAL ROUTING
          </motion.div>
        )}
        {error && status === 'FAILED' && (
          <div className="mt-2 text-[10px] text-red-400 bg-red-950/30 border border-red-500/30 p-2 rounded">{error}</div>
        )}
      </div>
    </Panel>
  );
}