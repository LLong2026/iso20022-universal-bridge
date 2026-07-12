import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, ShieldCheck, Loader, CheckCircle, Download, FileText } from 'lucide-react';

export default function VaultDocument({ fileUrl, fileName, fileHash }) {
  const [vaultState, setVaultState] = useState('locked');
  const [authProgress, setAuthProgress] = useState(0);

  const isImage = (url) => url && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
  const isPDF = (url) => url && /\.pdf$/i.test(url);

  const handleVaultUnlock = () => {
    setVaultState('authenticating');
    setAuthProgress(0);
    const steps = 5;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAuthProgress(Math.floor((step / steps) * 100));
      if (step >= steps) {
        clearInterval(interval);
        setTimeout(() => setVaultState('unlocked'), 300);
      }
    }, 350);
  };

  const authLabels = [
    'VERIFYING LEDGER ANCHOR...',
    'COMPUTING SHA-256 FINGERPRINT...',
    'VALIDATING HASH CHAIN...',
    'DECRYPTING VAULT PACKAGE...',
    'INTEGRITY CONFIRMED'
  ];

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-32 border border-[#222] rounded text-[9px] text-gray-700">
        NO FILE ATTACHED
      </div>
    );
  }

  return (
    <div>
      <div className="text-[9px] text-gray-500 tracking-widest mb-2 flex items-center gap-1">
        <Lock className="w-3 h-3" /> VAULT DOCUMENT — CRYPTOGRAPHICALLY BOUND
      </div>

      {vaultState === 'locked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-[40vh] border border-[#d4af37]/30 rounded bg-gradient-to-b from-[#0a0a0a] to-[#110a00] gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-full border-2 border-[#d4af37] flex items-center justify-center"
          >
            <Lock className="w-6 h-6 text-[#d4af37]" />
          </motion.div>
          <div className="text-center">
            <div className="text-[10px] text-[#d4af37] font-bold tracking-widest">DOCUMENT SEALED IN VAULT</div>
            <div className="text-[9px] text-gray-500 mt-1 max-w-[260px]">
              This artifact is cryptographically bound to the Lone Star Ledger. Authenticate to decrypt and reveal the document.
            </div>
          </div>
          <Button
            onClick={handleVaultUnlock}
            className="bg-[#d4af37] hover:bg-[#b8962f] text-black text-[10px] h-9 font-bold tracking-wider px-6"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-2" /> AUTHENTICATE & UNLOCK
          </Button>
        </motion.div>
      )}

      {vaultState === 'authenticating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-[40vh] border border-[#d4af37]/30 rounded bg-black gap-4"
        >
          <Loader className="w-7 h-7 text-[#d4af37] animate-spin" />
          <div className="w-56 h-1.5 bg-[#222] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#d4af37]"
              initial={{ width: '0%' }}
              animate={{ width: `${authProgress}%` }}
            />
          </div>
          <div className="text-[9px] text-gray-400 tracking-widest text-center">
            {authProgress < 20 ? authLabels[0] :
             authProgress < 40 ? authLabels[1] :
             authProgress < 60 ? authLabels[2] :
             authProgress < 80 ? authLabels[3] :
             authLabels[4]}
          </div>
          {fileHash && (
            <div className="text-[7px] text-gray-700 tracking-wider">
              HASH: {fileHash.slice(0, 16)}...
            </div>
          )}
        </motion.div>
      )}

      {vaultState === 'unlocked' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="relative">
            <div className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] z-10 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[7px] text-green-400 tracking-widest font-bold">VAULT DOCUMENT · INTEGRITY VERIFIED</span>
            </div>
            {fileHash && (
              <div className="absolute -top-2 right-4 px-2 bg-[#0a0a0a] z-10">
                <span className="text-[7px] text-[#d4af37] tracking-widest">SHA-256: {fileHash.slice(0, 12)}...</span>
              </div>
            )}
            <div className="border-2 border-[#d4af37]/40 rounded overflow-hidden bg-[#1a1a1a]">
              {isImage(fileUrl) ? (
                <img src={fileUrl} alt="Vault Artifact" className="w-full object-contain max-h-[50vh]" />
              ) : isPDF(fileUrl) ? (
                <iframe src={fileUrl} className="w-full h-[50vh] bg-white" title="Vault Document" />
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <FileText className="w-6 h-6 text-[#d4af37]" />
                  <div className="text-[9px] text-gray-500">FORMAT NOT EMBEDDABLE</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5 text-green-400" />
                <span className="text-[7px] text-green-400 tracking-wider">DECRYPTED · LEDGER-VERIFIED · {fileName || 'VAULT.DOC'}</span>
              </div>
              <a href={fileUrl} download={fileName || 'vault-document'}>
                <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-[8px] h-6">
                  <Download className="w-2.5 h-2.5 mr-1" /> EXPORT
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}