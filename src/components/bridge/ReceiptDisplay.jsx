import React from 'react';
import { Receipt as ReceiptIcon, CheckCircle, XCircle } from 'lucide-react';

export default function ReceiptDisplay({ receipt, seed, token, selectedRail, lifecycle }) {
  if (!receipt) return null;
  const Row = ({ label, value, gold }) => (
    <div className="flex justify-between items-start gap-3 py-1 border-b border-[#1a1a1a]">
      <span className="text-[8px] text-gray-600 tracking-wider flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-[9px] text-right break-all ${gold ? 'text-[#d4af37] font-bold' : 'text-gray-300'}`}>{value}</span>
    </div>
  );
  return (
    <div className="border border-[#d4af37]/40 bg-[#d4af37]/5 rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <ReceiptIcon className="w-4 h-4 text-[#d4af37]" />
        <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">UNIVERSAL SETTLEMENT RECEIPT</span>
        {receipt.status === 'settled'
          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />
          : <XCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
      </div>
      <Row label="RECEIPT ID" value={receipt.receipt_id} gold />
      <Row label="SEED ID" value={seed?.seed_id} />
      <Row label="TOKEN ID" value={token?.token_id} />
      <Row label="SELECTED RAIL" value={selectedRail?.name} gold />
      <Row label="RAIL SCORE" value={selectedRail?.score?.toFixed(4)} />
      <Row label="LIFECYCLE ID" value={lifecycle?.lifecycle_id} />
      <Row label="SETTLEMENT PROOF" value={receipt.settlement_proof} gold />
      <Row label="AMOUNT" value={`${receipt.amount} ${receipt.currency}`} />
      <Row label="SENDER → RECEIVER" value={`${receipt.sender} → ${receipt.receiver}`} />
      <Row label="STATUS" value={receipt.status?.toUpperCase()} gold />
    </div>
  );
}