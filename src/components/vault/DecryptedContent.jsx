import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Unlock, FileText, Image, ExternalLink } from 'lucide-react';

function FieldRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="border-t border-[#1a1a1a] pt-1.5 mt-1.5">
      <div className="text-[8px] text-gray-600 tracking-widest">{label}</div>
      <div className="text-[9px] text-[#d4af37] break-all leading-relaxed">{String(value)}</div>
    </div>
  );
}

export default function DecryptedContent({ decryptedData, contentHash, asset }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(decryptedData, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const fileUrl = decryptedData?.file_url || asset?.file_url;
  const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-3">
      {/* Unlock header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Unlock className="w-4 h-4 text-green-400" />
          <span className="text-[10px] text-green-400 tracking-widest font-bold">DECRYPTED CONTENTS</span>
        </div>
        <button onClick={copy}
          className="flex items-center gap-1 text-[8px] text-gray-600 hover:text-[#d4af37] transition-colors">
          {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* Content hash */}
      <div className="border border-[#1f1f1f] bg-black/40 rounded px-2 py-1.5">
        <div className="text-[8px] text-gray-600 tracking-widest">INTEGRITY HASH (SHA-256)</div>
        <div className="text-[8px] text-green-500/70 font-mono break-all">{contentHash}</div>
      </div>

      {/* Core asset fields */}
      <div className="border border-[#2a2a2a] bg-black/60 rounded p-2.5 space-y-0.5">
        <div className="text-[9px] text-gray-500 tracking-widest mb-1 flex items-center gap-1">
          <FileText className="w-3 h-3" /> ASSET RECORD
        </div>
        <FieldRow label="ASSET TYPE" value={decryptedData?.asset_type?.toUpperCase()} />
        <FieldRow label="WEIGHT" value={decryptedData?.weight ? `${decryptedData.weight}g` : null} />
        <FieldRow label="PURITY" value={decryptedData?.purity} />
        <FieldRow label="OWNER DID" value={decryptedData?.owner_did} />
        <FieldRow label="VAULT LOCATION" value={decryptedData?.vault_location} />
        <FieldRow label="SATOSHI ANCHOR" value={decryptedData?.satoshi_anchor} />
        <FieldRow label="DESCRIPTION" value={decryptedData?.description} />
        <FieldRow label="SIGNED AT" value={decryptedData?.signed_at} />
        <FieldRow label="CURRENT STATUS" value={decryptedData?.current_status?.toUpperCase()} />
      </div>

      {/* Attached file */}
      {fileUrl && (
        <div className="border border-[#2a2a2a] bg-black/60 rounded p-2.5">
          <div className="text-[9px] text-gray-500 tracking-widest mb-2 flex items-center gap-1">
            <Image className="w-3 h-3" /> ATTACHED DOCUMENT
          </div>
          {isImage ? (
            <img src={fileUrl} alt="artifact"
              className="w-full max-h-48 object-contain rounded border border-[#333]" />
          ) : (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[9px] text-[#d4af37] hover:underline break-all">
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {fileUrl}
            </a>
          )}
        </div>
      )}

      {/* Raw JSON fallback */}
      <details className="border border-[#1a1a1a] rounded">
        <summary className="px-2 py-1.5 text-[8px] text-gray-600 cursor-pointer hover:text-gray-400 tracking-widest">
          RAW JSON PAYLOAD
        </summary>
        <pre className="px-2 pb-2 text-[7px] text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(decryptedData, null, 2)}
        </pre>
      </details>
    </motion.div>
  );
}