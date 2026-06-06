import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle, Loader, Copy, Download, ArrowLeft, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

const DID_KEY = 'rwa_did_record';

export default function DIDSetup() {
  const [didRecord, setDidRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DID_KEY);
      if (stored) setDidRecord(JSON.parse(stored));
    } catch {}
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await base44.functions.invoke('didKeyManager', { action: 'generate' });
      const record = {
        did: data.did,
        public_key_base58: data.public_key_base58,
        created: data.created,
        private_key_jwk: data.private_key_jwk,
      };
      localStorage.setItem(DID_KEY, JSON.stringify(record));
      setDidRecord(record);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'DID generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(didRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(didRecord, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `did-receipt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
          <div>
            <h1 className="text-lg font-bold tracking-[0.15em] uppercase text-[#d4af37]">
              DID IDENTITY SETUP
            </h1>
            <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
              Ed25519 · did:rwa · SELF-SOVEREIGN
            </div>
          </div>
          <Link to="/vault">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <ArrowLeft className="w-3 h-3 mr-1" /> VAULT
            </Button>
          </Link>
        </div>

        {/* Status */}
        <AnimatePresence mode="wait">
          {didRecord ? (
            <motion.div key="active" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="border border-green-900/50 bg-green-950/10 p-4 rounded mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-[10px] text-green-400 tracking-widest font-bold">IDENTITY ACTIVE</span>
              </div>
              <div className="text-[9px] text-gray-500">DID</div>
              <div className="text-[10px] text-[#d4af37] break-all leading-relaxed">{didRecord.did}</div>
              <div className="text-[9px] text-gray-600">
                CREATED: {new Date(didRecord.created).toLocaleString()}
              </div>
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="border border-dashed border-[#333] p-6 rounded mb-4 text-center">
              <KeyRound className="w-8 h-8 text-[#d4af37]/30 mx-auto mb-2" />
              <div className="text-[10px] text-gray-500 tracking-widest">NO IDENTITY FOUND</div>
              <div className="text-[9px] text-gray-700 mt-1">Generate a DID to unlock all vault functions</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate button */}
        <Button onClick={handleGenerate} disabled={loading}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-11 mb-3">
          {loading
            ? <><Loader className="w-4 h-4 mr-2 animate-spin" />GENERATING DID...</>
            : didRecord
              ? <><RefreshCw className="w-4 h-4 mr-2" />ROTATE KEYPAIR</>
              : <><KeyRound className="w-4 h-4 mr-2" />GENERATE DID</>}
        </Button>

        {error && (
          <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded mb-3">
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] text-red-400">{error}</span>
          </div>
        )}

        {/* Save buttons */}
        {didRecord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline"
                className="flex-1 h-9 text-[9px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] tracking-widest">
                {copied ? <CheckCircle className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                COPY RECEIPT
              </Button>
              <Button onClick={handleDownload} variant="outline"
                className="flex-1 h-9 text-[9px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] tracking-widest">
                <Download className="w-3 h-3 mr-1" />DOWNLOAD JSON
              </Button>
            </div>

            <div className="border border-[#1a1a1a] bg-black/60 p-3 rounded text-[8px] text-gray-600 leading-relaxed">
              ⚠ YOUR PRIVATE KEY IS STORED IN THIS BROWSER ONLY.<br />
              Download the receipt JSON and keep it safe — it cannot be recovered if lost.<br />
              The DID is now active across all vault operations.
            </div>

            <Link to="/vault" className="block">
              <Button className="w-full h-10 bg-green-900/40 hover:bg-green-900/60 text-green-400 border border-green-900/50 font-bold tracking-wider text-xs">
                <CheckCircle className="w-4 h-4 mr-2" /> GO TO VAULT
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}