import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

function buildXml(seed, token, rail, receipt) {
  const proof = receipt?.settlement_proof ? receipt.settlement_proof.substring(0, 32) + '...' : 'PENDING';
  const life = receipt?.lifecycle_id || 'PENDING';
  return `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${seed.instruction_id}</MsgId>
      <CreDtTm>${seed.timestamp}</CreDtTm>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>${rail.name.toUpperCase().replace(/ /g, '_')}</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${token.token_id}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${seed.currency}">${seed.amount}.00</IntrBkSttlmAmt>
      <Dbtr>
        <Nm>${seed.sender}</Nm>
      </Dbtr>
      <Cdtr>
        <Nm>${seed.receiver}</Nm>
      </Cdtr>
      <SplmtryData>
        <PlcAndNm>UNIVERSAL_BRIDGE</PlcAndNm>
        <Envlp>
          <UniversalBridge>
            <SelectedRail>${rail.name}</SelectedRail>
            <RailScore>${rail.score.toFixed(4)}</RailScore>
            <SeedId>${seed.seed_id}</SeedId>
            <TokenHash>${token.token_hash.substring(0, 32)}...</TokenHash>
            <SatoshiAnchor>${token.satoshi_anchor}</SatoshiAnchor>
            <LifecycleId>${life}</LifecycleId>
            <SettlementProof>${proof}</SettlementProof>
          </UniversalBridge>
        </Envlp>
      </SplmtryData>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

export default function RailTerminal({ result, executing }) {
  const [displayedXml, setDisplayedXml] = useState('WAITING FOR TRANSACTION...');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('READY');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!result?.receipt) return;
    const { seed, token, selected_rail, receipt } = result;

    setStatus('ENCODING');
    const xml = buildXml(seed, token, selected_rail, receipt);
    setIsTyping(true);
    setDisplayedXml('');

    let i = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplayedXml(prev => prev + xml.charAt(i));
      i++;
      if (i >= xml.length) {
        clearInterval(intervalRef.current);
        setIsTyping(false);
        setStatus('BROADCASTING');
        setTimeout(() => setStatus('SETTLED'), 1000);
      }
    }, 6);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [result]);

  const statusColors = {
    READY: 'text-blue-400',
    ENCODING: 'text-yellow-400',
    BROADCASTING: 'text-purple-400',
    SETTLED: 'text-green-400'
  };

  const railName = result?.selected_rail?.name || 'RAIL';

  return (
    <div className="border border-[#222] rounded bg-black/40 p-4">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-gray-500">{railName} LEDGER STATUS:</span>
        <motion.span
          className={`font-bold flex items-center gap-1 ${statusColors[status]}`}
          animate={status !== 'READY' && status !== 'SETTLED' ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Zap className="w-3 h-3" />
          {status}
        </motion.span>
      </div>
      <div className="bg-black border border-[#333] p-3 overflow-y-auto min-h-[160px] max-h-[240px]">
        <pre className="text-[10px] text-gray-400 whitespace-pre-wrap break-all font-mono">
          {displayedXml}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-1.5 h-3 bg-green-400 ml-0.5"
            />
          )}
        </pre>
      </div>
      {status === 'SETTLED' && result?.receipt && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-[10px] text-green-400 bg-green-950/30 border border-green-500/30 p-2 rounded"
        >
          ✓ SETTLED VIA {railName} | SCORE: {result.selected_rail.score.toFixed(4)} | ISO 20022 COMPLIANT
        </motion.div>
      )}
    </div>
  );
}