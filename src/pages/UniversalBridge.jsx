import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader, GitBranch, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import BridgeFlow from '@/components/bridge/BridgeFlow';
import RailScorecard from '@/components/bridge/RailScorecard';
import ReceiptDisplay from '@/components/bridge/ReceiptDisplay';
import RailTerminal from '@/components/bridge/RailTerminal';

export default function UniversalBridge() {
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [sender, setSender] = useState('did:rwa:central_bank_001');
  const [receiver, setReceiver] = useState('did:rwa:treasury_002');
  const [isoXml, setIsoXml] = useState('');
  const [rails, setRails] = useState([]);
  const [loadingRails, setLoadingRails] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [receipts, setReceipts] = useState([]);

  useEffect(() => { loadRails(); loadReceipts(); }, []);

  const loadRails = async () => {
    setLoadingRails(true);
    try {
      const { data } = await base44.functions.invoke('universalBridge', { action: 'list_rails' });
      setRails(data.rails || []);
    } catch (e) { setError(e?.response?.data?.error || e.message); }
    finally { setLoadingRails(false); }
  };

  const loadReceipts = async () => {
    try {
      const { data } = await base44.functions.invoke('universalBridge', { action: 'list_receipts' });
      setReceipts(data.receipts || []);
    } catch { /* ignore */ }
  };

  const execute = async () => {
    setExecuting(true); setError(null); setResult(null); setActiveStep(0);
    try {
      const payload = { action: 'execute' };
      if (isoXml.trim()) payload.iso20022_xml = isoXml.trim();
      else payload.instruction = { amount, currency, sender, receiver };

      // animate the 8-step flow
      for (let i = 1; i <= 8; i++) {
        setActiveStep(i);
        await new Promise(r => setTimeout(r, 180));
      }

      const { data } = await base44.functions.invoke('universalBridge', payload);
      setResult(data);
      setActiveStep(8);
      loadReceipts();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'EXECUTION FAILED');
    } finally { setExecuting(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">UNIVERSAL BRIDGE</h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">MULTI-RAIL ISO20022 ROUTING · NORMALIZE → TOKEN → EVALUATE → SETTLE</div>
        </div>
        <Link to="/">
          <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
            <ArrowLeft className="w-3 h-3 mr-1" />CONSOLE
          </Button>
        </Link>
      </div>

      {/* Flow visualization */}
      <div className="mb-6">
        <BridgeFlow activeStep={activeStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col 1 — Instruction input */}
        <div className="border border-[#222] rounded bg-black/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">ISO20022 INSTRUCTION</div>
          <div className="space-y-2">
            <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="AMOUNT" className="bg-black border-[#333] text-xs font-mono h-8" />
            <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="CURRENCY" className="bg-black border-[#333] text-xs font-mono h-8" />
            <Input value={sender} onChange={e => setSender(e.target.value)} placeholder="SENDER DID" className="bg-black border-[#333] text-xs font-mono h-8" />
            <Input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="RECEIVER DID" className="bg-black border-[#333] text-xs font-mono h-8" />
            <Textarea value={isoXml} onChange={e => setIsoXml(e.target.value)} placeholder="OPTIONAL: paste raw ISO20022 XML (overrides fields above)" className="bg-black border-[#333] text-[9px] font-mono min-h-[80px]" />
            <Button onClick={execute} disabled={executing} className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10">
              {executing ? <><Loader className="w-4 h-4 mr-2 animate-spin" />ROUTING...</> : <><Send className="w-4 h-4 mr-2" />EXECUTE BRIDGE</>}
            </Button>
            {error && <div className="text-[8px] text-red-400 border border-red-900/50 bg-red-950/20 p-2 rounded">{error}</div>}
          </div>
        </div>

        {/* Col 2 — Rail registry */}
        <div className="border border-[#222] rounded bg-black/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">RAIL REGISTRY · DETERMINISTIC SCORES</div>
          {loadingRails
            ? <div className="flex items-center gap-2 text-[#d4af37] text-[10px]"><Loader className="w-4 h-4 animate-spin" />LOADING...</div>
            : <RailScorecard rails={rails} selectedRail={result?.selected_rail} />}
        </div>

        {/* Col 3 — Universal receipt */}
        <div className="border border-[#222] rounded bg-black/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">UNIVERSAL RECEIPT</div>
          {result?.receipt
            ? <ReceiptDisplay receipt={result.receipt} seed={result.seed} token={result.token} selectedRail={result.selected_rail} lifecycle={result.lifecycle} />
            : (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-700">
                <GitBranch className="w-8 h-8 opacity-20" />
                <div className="text-[9px] tracking-widest text-center">NO RECEIPT YET<br /><span className="text-[8px]">EXECUTE BRIDGE TO SETTLE</span></div>
              </div>
            )}
        </div>
      </div>

      {/* Rail terminal — live settlement status */}
      <div className="mt-5">
        <RailTerminal result={result} executing={executing} />
      </div>

      {/* Settlement history */}
      {receipts.length > 0 && (
        <div className="mt-6 border border-[#222] rounded bg-black/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">SETTLEMENT HISTORY ({receipts.length})</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {receipts.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-[8px] border-b border-[#1a1a1a] py-1">
                <span className={`font-bold ${r.status === 'settled' ? 'text-green-500' : 'text-red-500'}`}>{r.status?.toUpperCase()}</span>
                <span className="text-[#d4af37]">{r.selected_rail}</span>
                <span className="text-gray-500">{r.amount} {r.currency}</span>
                <span className="text-gray-600 truncate flex-1">{r.receipt_id}</span>
                <span className="text-gray-700">{new Date(r.created_date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}