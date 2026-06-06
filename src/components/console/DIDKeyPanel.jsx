import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Eye, EyeOff, RefreshCw, CheckCircle, Loader, Copy, Download, Upload } from 'lucide-react';

const STORAGE_KEY = 'rwa_did_record';

export default function DIDKeyPanel() {
  const [didRecord, setDidRecord] = useState(null); // { did, public_key_base58, created, private_key_jwk }
  const [loading, setLoading] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [didDoc, setDidDoc] = useState(null);
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDidRecord(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setShowDoc(false);
    setDidDoc(null);
    try {
      const { data } = await base44.functions.invoke('didKeyManager', { action: 'generate' });
      const record = {
        did: data.did,
        public_key_base58: data.public_key_base58,
        created: data.created,
        private_key_jwk: data.private_key_jwk,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      setDidRecord(record);
    } catch (err) {
      console.error('DID generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!didRecord) return;
    setResolving(true);
    try {
      const { data } = await base44.functions.invoke('didKeyManager', {
        action: 'resolve',
        did: didRecord.did,
      });
      setDidDoc(data.did_document);
      setShowDoc(true);
    } catch (err) {
      console.error('DID resolve error:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shortDid = didRecord?.did
    ? didRecord.did.slice(0, 20) + '...' + didRecord.did.slice(-6)
    : null;

  return (
    <Panel title="6. DID KEY MANAGER">
      <div className="space-y-3">
        {/* Status */}
        {didRecord ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-[#d4af37]/40 bg-black/60 p-2 rounded space-y-1"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
              <span className="text-[9px] text-green-400 tracking-widest">IDENTITY ACTIVE</span>
            </div>
            <div className="text-[9px] text-gray-500">DID</div>
            <div className="text-[10px] text-[#d4af37] font-bold tracking-wide break-all leading-relaxed">
              {shortDid}
            </div>
            <div className="text-[9px] text-gray-600">
              CREATED: {new Date(didRecord.created).toLocaleDateString()}
            </div>
          </motion.div>
        ) : (
          <div className="border border-dashed border-[#333] p-3 text-center">
            <KeyRound className="w-5 h-5 text-[#d4af37]/40 mx-auto mb-1" />
            <div className="text-[10px] text-gray-600">NO IDENTITY GENERATED</div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-9 text-xs"
        >
          {loading ? (
            <><Loader className="w-3 h-3 mr-2 animate-spin" />GENERATING...</>
          ) : didRecord ? (
            <><RefreshCw className="w-3 h-3 mr-2" />ROTATE KEYPAIR</>
          ) : (
            <><KeyRound className="w-3 h-3 mr-2" />GENERATE DID</>
          )}
        </Button>

        {/* Retrieve / resolve button */}
        {didRecord && (
          <Button
            onClick={handleResolve}
            disabled={resolving}
            variant="outline"
            className="w-full h-8 bg-transparent border border-[#444] text-[#d4af37] hover:bg-[#d4af37]/10 text-[10px] tracking-widest"
          >
            {resolving ? (
              <><Loader className="w-3 h-3 mr-2 animate-spin" />RESOLVING...</>
            ) : (
              <>{showDoc ? <EyeOff className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
              {showDoc ? 'HIDE' : 'RETRIEVE'} DID DOCUMENT</>
            )}
          </Button>
        )}

        {/* DID Document display */}
        <AnimatePresence>
          {showDoc && didDoc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative border border-[#333] bg-black/80 rounded p-2">
                <button
                  onClick={() => handleCopy(JSON.stringify(didDoc, null, 2))}
                  className="absolute top-2 right-2 text-gray-600 hover:text-[#d4af37] transition-colors"
                >
                  {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <div className="text-[8px] text-gray-500 mb-1 tracking-widest">DID DOCUMENT</div>
                <pre className="text-[8px] text-[#d4af37]/80 overflow-auto max-h-32 leading-relaxed whitespace-pre-wrap break-all">
                  {JSON.stringify(didDoc, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export receipt */}
        {didRecord && (
          <div className="space-y-2 border-t border-[#1a1a1a] pt-2">
            <div className="flex gap-2">
              <Button
                onClick={() => handleCopy(JSON.stringify(didRecord, null, 2))}
                variant="outline"
                className="flex-1 h-7 text-[8px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] tracking-widest"
              >
                {copied ? <CheckCircle className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                COPY RECEIPT
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(didRecord, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `did-receipt-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                className="flex-1 h-7 text-[8px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] tracking-widest"
              >
                <Download className="w-3 h-3 mr-1" />DOWNLOAD
              </Button>
            </div>

            {/* Import DID */}
            <div className="space-y-1">
              <div className="text-[8px] text-gray-600 tracking-widest">IMPORT DID RECEIPT</div>
              <div className="flex gap-1">
                <Input
                  value={importInput}
                  onChange={e => setImportInput(e.target.value)}
                  placeholder='{"did":"did:key:...","private_key_jwk":{...}}'
                  className="bg-black border-[#333] text-[9px] text-gray-400 font-mono h-7 flex-1"
                />
                <Button onClick={() => {
                  setImportError(null);
                  try {
                    const parsed = JSON.parse(importInput.trim());
                    if (!parsed.did || !parsed.private_key_jwk) throw new Error();
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                    setDidRecord(parsed);
                    setImportInput('');
                  } catch { setImportError('INVALID RECEIPT'); }
                }} className="h-7 px-2 bg-[#d4af37] hover:bg-[#b8962f] text-black text-[8px]">
                  <Upload className="w-3 h-3" />
                </Button>
              </div>
              {importError && <div className="text-[8px] text-red-400">{importError}</div>}
            </div>

            <div className="text-[8px] text-gray-600 leading-relaxed">
              ⚠ PRIVATE KEY IN LOCAL STORAGE. DEMO ONLY — USE HSM IN PRODUCTION.
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}