import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Send, Zap } from 'lucide-react';

export default function IsoBridge({ onTransfer, lastTransaction, hasTokens }) {
  const [displayedXml, setDisplayedXml] = useState('WAITING FOR TRANSACTION...');
  const [isTyping, setIsTyping] = useState(false);
  const [xrpStatus, setXrpStatus] = useState('READY');

  useEffect(() => {
    if (!lastTransaction) return;

    setXrpStatus('ENCODING');

    const bindingHash = 'A1B2' + Math.random().toString(36).substring(2, 8).toUpperCase() + 'C3D4';
    const xml = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${lastTransaction.txId}</MsgId>
      <CreDtTm>${lastTransaction.timestamp}</CreDtTm>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>XRPL</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>LSL-TX-${lastTransaction.txId.split('-')[1]}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="XAU">${lastTransaction.amount}.00</IntrBkSttlmAmt>
      
      <Dbtr>
        <Nm>${lastTransaction.sender}</Nm>
      </Dbtr>
      <Cdtr>
        <Nm>${lastTransaction.receiver}</Nm>
      </Cdtr>

      <SplmtryData>
        <PlcAndNm>LONE_STAR_BRIDGE</PlcAndNm>
        <Envlp>
          <XrpBridge>
            <LedgerIndex>PENDING</LedgerIndex>
            <NetworkFee>0.00001 XRP</NetworkFee>
            <Settlement>3-5 SECONDS</Settlement>
            <Hash>${bindingHash}</Hash>
          </XrpBridge>
        </Envlp>
      </SplmtryData>

    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

    setIsTyping(true);
    setDisplayedXml('');
    
    let i = 0;
    const typeInterval = setInterval(() => {
      setDisplayedXml(prev => prev + xml.charAt(i));
      i++;
      if (i >= xml.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setXrpStatus('BROADCASTING');
        
        // Simulate XRP settlement
        setTimeout(() => {
          setXrpStatus('SETTLED');
        }, 1200);
      }
    }, 8);

    return () => clearInterval(typeInterval);
  }, [lastTransaction]);

  const statusColors = {
    READY: 'text-blue-400',
    ENCODING: 'text-yellow-400',
    BROADCASTING: 'text-purple-400',
    SETTLED: 'text-green-400'
  };

  return (
    <Panel title="3. ISO 20022 → XRP BRIDGE">
      <div className="flex-grow overflow-hidden flex flex-col">
        {/* XRP Status Indicator */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500">XRP LEDGER STATUS:</span>
          <motion.span 
            className={`font-bold flex items-center gap-1 ${statusColors[xrpStatus]}`}
            animate={xrpStatus !== 'READY' && xrpStatus !== 'SETTLED' ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Zap className="w-3 h-3" />
            {xrpStatus}
          </motion.span>
        </div>

        <div className="flex-grow bg-black border border-[#333] p-3 overflow-y-auto min-h-[180px] max-h-[220px]">
          <pre className="text-[10px] text-gray-400 whitespace-pre-wrap break-all">
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

        <Button
          onClick={onTransfer}
          disabled={!hasTokens || isTyping}
          className="mt-3 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider h-10"
        >
          <Send className="w-4 h-4 mr-2" />
          TRANSFER VIA XRP RAIL
        </Button>

        {xrpStatus === 'SETTLED' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-[10px] text-green-400 bg-green-950/30 border border-green-500/30 p-2 rounded"
          >
            ✓ SETTLED IN 3.2s | FEE: 0.00001 XRP | ISO 20022 COMPLIANT
          </motion.div>
        )}
      </div>
    </Panel>
  );
}