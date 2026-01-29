import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Send } from 'lucide-react';

export default function IsoBridge({ onTransfer, lastTransaction, hasTokens }) {
  const [displayedXml, setDisplayedXml] = useState('WAITING FOR TRANSACTION...');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!lastTransaction) return;

    const xml = `<Document xmlns="urn:iso:std:iso:20022...">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${lastTransaction.txId}</MsgId>
      <CreDtTm>${lastTransaction.timestamp}</CreDtTm>
    </GrpHdr>
    <CdtTrfTxInf>
      <IntrBkSttlmAmt Ccy="XAU">
        ${lastTransaction.amount}.00
      </IntrBkSttlmAmt>
      <Dbtr>
        <Nm>${lastTransaction.sender}</Nm>
      </Dbtr>
      <Cdtr>
        <Nm>${lastTransaction.receiver}</Nm>
      </Cdtr>
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
      }
    }, 8);

    return () => clearInterval(typeInterval);
  }, [lastTransaction]);

  return (
    <Panel title="3. ISO 20022 BRIDGE (FEDNOW)">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="flex-grow bg-black border border-[#333] p-3 overflow-y-auto min-h-[200px] max-h-[250px]">
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
          SIMULATE TRANSFER (RUST → XML)
        </Button>
      </div>
    </Panel>
  );
}