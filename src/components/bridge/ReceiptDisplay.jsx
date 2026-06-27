import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, FileText } from 'lucide-react';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-[#1a1a1a]">
      <span className="text-[9px] text-gray-600 tracking-wider whitespace-nowrap">{label}</span>
      <span className="text-[9px] text-gray-200 text-right break-all font-mono">{value || '—'}</span>
    </div>
  );
}

export default function ReceiptDisplay({ result }) {
  if (!result) {
    return (
      <div className="border border-[#222] rounded bg-black/30 p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <FileText className="w-8 h-8 text-gray-700" />
        <div className="text-[10px] text-gray-600 tracking-widest text-center">NO RECEIPT YET</div>
        <div className="text-[8px] text-gray-700 tracking-wider">EXECUTE BRIDGE TO SETTLE</div>
      </div>
    );
  }
  const { receipt, selected_rail, seed, token, lifecycle } = result;
  const settled = receipt.status === 'settled';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-[#d4af37]/40 rounded bg-black/30 p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#222]">
        <CheckCircle className={`w-4 h-4 ${settled ? 'text-green-400' : 'text-red-400'}`} />
        <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">UNIVERSAL SETTLEMENT RECEIPT</span>
      </div>
      <div className="space-y-0.5">
        <Row label="RECEIPT ID" value={receipt.receipt_id} />
        <Row label="SEED ID" value={seed.seed_id} />
        <Row label="TOKEN ID" value={token.token_id} />
        <Row label="SELECTED RAIL" value={selected_rail.name} />
        <Row label="RAIL SCORE" value={selected_rail.score.toFixed(4)} />
        <Row label="LIFECYCLE ID" value={lifecycle.lifecycle_id} />
        <Row label="SETTLEMENT PROOF" value={receipt.settlement_proof} />
        <Row label="AMOUNT" value={`${receipt.amount} ${receipt.currency}`} />
        <Row label="SENDER → RECEIVER" value={`${receipt.sender} → ${receipt.receiver}`} />
        <div className="flex justify-between pt-2">
          <span className="text-[9px] text-gray-600 tracking-wider">STATUS</span>
          <span className={`text-[10px] font-bold ${settled ? 'text-green-400' : 'text-red-400'}`}>{receipt.status.toUpperCase()}</span>
        </div>
      </div>
    </motion.div>
  );
}