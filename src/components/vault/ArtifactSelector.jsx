import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, ChevronRight } from 'lucide-react';

export default function ArtifactSelector({ assets, selected, onSelect }) {
  if (!assets.length) {
    return (
      <div className="text-[10px] text-gray-600 py-6 text-center tracking-wider">
        NO BOUND ARTIFACTS FOUND FOR THIS DID.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
      {assets.map((asset, i) => (
        <motion.button
          key={asset.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onSelect(asset)}
          className={`w-full text-left border rounded p-2.5 transition-all flex items-center gap-3 ${
            selected?.id === asset.id
              ? 'border-[#d4af37] bg-[#d4af37]/5'
              : 'border-[#2a2a2a] bg-black/50 hover:border-[#444]'
          }`}
        >
          <div className="flex-shrink-0">
            {asset.is_encrypted
              ? <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
              : <Unlock className="w-3.5 h-3.5 text-gray-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#d4af37] font-bold truncate">{asset.asset_id}</div>
            <div className="text-[8px] text-gray-500 mt-0.5">
              {asset.asset_type?.toUpperCase()} · {asset.weight ? `${asset.weight}g` : '—'} · {asset.current_status?.toUpperCase()}
            </div>
            {asset.description && (
              <div className="text-[8px] text-gray-700 truncate">{asset.description}</div>
            )}
          </div>
          <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors ${selected?.id === asset.id ? 'text-[#d4af37]' : 'text-gray-700'}`} />
        </motion.button>
      ))}
    </div>
  );
}