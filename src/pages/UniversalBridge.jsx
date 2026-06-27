import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader, AlertTriangle, History } from 'lucide-react';
import BridgeFlow from '@/components/bridge/BridgeFlow';
import RailScorecard from '@/components/bridge/RailScorecard';
import ReceiptDisplay from '@/components/bridge/ReceiptDisplay';

export default function UniversalBridge() {
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [sender, setSender] = useState('did:rwa:central_bank_001');
  const [receiver, setReceiver] = useState('did:rwa:treasury_002');
  const [rawXml, setRawXml] = useState('');
  const [rails, setRails] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [priority, setPriority] = useState('balanced');
  const [counterpartyTier, setCounterpartyTier] = useState('central_bank');
  const [maxCost, setMaxCost] = useState('');
  const [minLiquidity, setMinLiquidity] = useState('');
  const [minFinality, setMinFinality] = useState('');

  useEffect(() => {
    loadRails();
    loadReceipts();
  }, []);

  const loadRails = async () => {
    try {
      const { data } = await base44.functions.invoke('universalBridge', { action: 'list_rails' });
      setRails(data.rails || []);
    } catch (e) { console.error(e); }
  };

  const loadReceipts = async () => {
    try {
      const { data } = await base44.functions.invoke('universalBridge', { action: 'list_receipts' });
      setReceipts(data.receipts || []);
    } catch (e) { console.error(e); }
  };

  const handleExecute = async () => {
    setExecuting(true); setError(null); setResult(null); setActiveStep(1);
    try {
      const routing = {
        priority, counterparty_tier: counterpartyTier,
        max_cost: maxCost ? parseFloat(maxCost) : null,
        min_liquidity: minLiquidity ? parseFloat(minLiquidity) : null,
        min_finality: minFinality ? parseFloat(minFinality) : null
      };
      const payload = rawXml.trim()
        ? { action: 'execute', iso20022_xml: rawXml, ...routing }
        : { action: 'execute', instruction: { amount: parseFloat(amount), currency, sender, receiver, ...routing } };
      const [res] = await Promise.all([
        base44.functions.invoke('universalBridge', payload),
        new Promise(r => setTimeout(r, 1300))
      ]);
      const data = res.data;
      setResult(data);
      setActiveStep(7);
      setTimeout(() => setActiveStep(8), 350);
      loadReceipts();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'EXECUTION FAILED');
      setActiveStep(0);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">UNIVERSAL BRIDGE</h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">MULTI-RAIL ISO20022 ROUTING · NORMALIZE → TOKEN → EVALUATE → SETTLE</div>
        </div>
        <Link to="/">
          <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
            <ArrowLeft className="w-3 h-3 mr-1" /> CONSOLE
          </Button>
        </Link>
      </div>

      {/* 8-step pipeline */}
      <BridgeFlow activeStep={activeStep} />

      {/* 3-column main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col 1 — Instruction */}
        <div className="border border-[#222] rounded bg-black/30 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">ISO20022 INSTRUCTION</div>
          <div className="space-y-2">
            <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="AMOUNT" className="bg-black border-[#333] text-gray-200 text-xs font-mono h-9" />
            <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="CURRENCY" className="bg-black border-[#333] text-gray-200 text-xs font-mono h-9" />
            <Input value={sender} onChange={e => setSender(e.target.value)} placeholder="SENDER DID" className="bg-black border-[#333] text-gray-200 text-xs font-mono h-9" />
            <Input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="RECEIVER DID" className="bg-black border-[#333] text-gray-200 text-xs font-mono h-9" />
            <Textarea value={rawXml} onChange={e => setRawXml(e.target.value)} placeholder="OPTIONAL: paste raw ISO20022 XML (overrides fields above)" className="bg-black border-[#333] text-gray-400 text-[10px] font-mono min-h-[80px] resize-none" />
            <div className="text-[8px] text-gray-600 tracking-widest pt-1">ROUTING CONSTRAINTS</div>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="bg-black border-[#333] text-gray-300 text-[10px] font-mono h-9 rounded px-2">
              <option value="balanced">PRIORITY: BALANCED</option>
              <option value="fastest">PRIORITY: FASTEST</option>
              <option value="cheapest">PRIORITY: CHEAPEST</option>
              <option value="most_compliant">PRIORITY: MOST COMPLIANT</option>
              <option value="highest_finality">PRIORITY: HIGHEST FINALITY</option>
            </select>
            <select value={counterpartyTier} onChange={e => setCounterpartyTier(e.target.value)} className="bg-black border-[#333] text-gray-300 text-[10px] font-mono h-9 rounded px-2">
              <option value="retail">COUNTERPARTY: RETAIL</option>
              <option value="treasury">COUNTERPARTY: TREASURY</option>
              <option value="central_bank">COUNTERPARTY: CENTRAL BANK</option>
            </select>
            <div className="grid grid-cols-3 gap-2">
              <Input value={maxCost} onChange={e => setMaxCost(e.target.value)} placeholder="MAX COST" className="bg-black border-[#333] text-gray-400 text-[9px] font-mono h-8" />
              <Input value={minLiquidity} onChange={e => setMinLiquidity(e.target.value)} placeholder="MIN LIQ" className="bg-black border-[#333] text-gray-400 text-[9px] font-mono h-8" />
              <Input value={minFinality} onChange={e => setMinFinality(e.target.value)} placeholder="MIN FIN" className="bg-black border-[#333] text-gray-400 text-[9px] font-mono h-8" />
            </div>
            <Button onClick={handleExecute} disabled={executing} className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10">
              {executing ? <><Loader className="w-4 h-4 mr-2 animate-spin" />ROUTING...</> : <><Send className="w-4 h-4 mr-2" />EXECUTE BRIDGE</>}
            </Button>
            {error && (
              <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-[8px] text-red-400">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Col 2 — Rail scorecard */}
        <div className="border border-[#222] rounded bg-black/30 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">RAIL REGISTRY · DETERMINISTIC SCORES</div>
          {rails.length ? (
            <RailScorecard rails={rails} selectedName={result?.selected_rail?.name} />
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-gray-600 py-6">
              <Loader className="w-4 h-4 animate-spin text-[#d4af37]" /> LOADING RAILS...
            </div>
          )}
        </div>

        {/* Col 3 — Receipt */}
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">UNIVERSAL RECEIPT</div>
          <ReceiptDisplay result={result} />
        </div>
      </div>

      {/* Decision trace */}
      {result && (
        <div className="mt-6 border border-[#222] rounded bg-black/30 p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-3">DECISION TRACE — RAIL SELECTION LOGIC</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><div className="text-[8px] text-gray-600 tracking-wider">PRIORITY</div><div className="text-[10px] text-gray-200 font-mono">{(result.selection_basis?.priority || 'balanced').toUpperCase()}</div></div>
            <div><div className="text-[8px] text-gray-600 tracking-wider">COUNTERPARTY TIER</div><div className="text-[10px] text-gray-200 font-mono">{(result.selection_basis?.counterparty_tier || 'retail').toUpperCase()}</div></div>
            <div><div className="text-[8px] text-gray-600 tracking-wider">ELIGIBLE RAILS</div><div className="text-[10px] text-green-400 font-mono">{result.scored_rails?.length || 0}</div></div>
            <div><div className="text-[8px] text-gray-600 tracking-wider">REJECTED RAILS</div><div className="text-[10px] text-red-400 font-mono">{result.rejected_rails?.length || 0}</div></div>
          </div>
          {result.rejected_rails?.length > 0 && (
            <div className="space-y-1 mb-3">
              <div className="text-[8px] text-gray-600 tracking-widest">FILTERED OUT:</div>
              {result.rejected_rails.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="text-gray-500">{r.name}</span>
                  <span className="text-red-400">→ {r.reasons.join(', ').replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
          {result.selection_basis?.weights && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-mono text-gray-500">
              <span className="text-gray-600">WEIGHTS:</span>
              {Object.entries(result.selection_basis.weights).map(([k, v]) => (
                <span key={k}>{k}: {(v * 100).toFixed(0)}%</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lone Star Ledger — settlement event */}
      {result?.settlement_event && (
        <div className="mt-6 border border-[#d4af37]/30 rounded bg-black p-4">
          <div className="text-[10px] font-bold tracking-widest text-[#d4af37] mb-2">LONE STAR LEDGER — SETTLEMENT EVENT</div>
          <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">{result.settlement_event}</pre>
        </div>
      )}

      {/* Settlement history */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-3 h-3 text-[#d4af37]" />
          <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">SETTLEMENT HISTORY ({receipts.length})</span>
        </div>
        <div className="border border-[#222] rounded bg-black/30 divide-y divide-[#1a1a1a]">
          {receipts.length === 0 ? (
            <div className="text-[10px] text-gray-600 py-4 text-center">NO SETTLEMENTS YET</div>
          ) : receipts.map((r) => {
            const settled = r.status === 'settled';
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-[10px] font-mono">
                <span className={`font-bold ${settled ? 'text-green-400' : 'text-red-400'}`}>{r.status.toUpperCase()}</span>
                <span className="text-gray-300">{r.selected_rail}</span>
                <span className="text-gray-400">{r.amount} {r.currency}</span>
                <span className="text-gray-500">{r.receipt_id}</span>
                <span className="text-gray-600 ml-auto">{new Date(r.created_date).toLocaleString('en-US')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}