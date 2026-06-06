import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Unlock, Loader, CheckCircle, Copy, AlertTriangle } from 'lucide-react';

const DID_STORAGE_KEY = 'rwa_did_record';
const JASPER_STORAGE_KEY = 'jasper_encrypted_package';

export default function JasperPanel() {
  const [mode, setMode] = useState('encrypt'); // 'encrypt' | 'decrypt'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'encrypted'|'decrypted', payload }
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const getStoredDid = () => {
    try {
      const rec = localStorage.getItem(DID_STORAGE_KEY);
      return rec ? JSON.parse(rec) : null;
    } catch { return null; }
  };

  const getStoredPackage = () => {
    try {
      const pkg = localStorage.getItem(JASPER_STORAGE_KEY);
      return pkg ? JSON.parse(pkg) : null;
    } catch { return null; }
  };

  const handleEncrypt = async () => {
    const didRecord = getStoredDid();
    if (!didRecord) {
      setError('NO DID FOUND — generate a DID identity first.');
      return;
    }
    if (!inputText.trim()) {
      setError('ENTER DATA TO ENCRYPT.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('jasperEncryption', {
        action: 'encrypt',
        data: inputText,
        owner_did: didRecord.did
      });
      localStorage.setItem(JASPER_STORAGE_KEY, JSON.stringify(data.encrypted_package));
      setResult({ type: 'encrypted', payload: data.encrypted_package });
    } catch (err) {
      setError(err.message || 'ENCRYPTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    const didRecord = getStoredDid();
    if (!didRecord) {
      setError('NO DID FOUND — generate a DID identity first.');
      return;
    }
    const pkg = getStoredPackage();
    if (!pkg) {
      setError('NO ENCRYPTED PACKAGE IN STORAGE — encrypt something first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('jasperEncryption', {
        action: 'decrypt',
        encrypted_package: pkg,
        owner_did: didRecord.did
      });
      setResult({ type: 'decrypted', payload: data.data });
    } catch (err) {
      setError(err.message || 'DECRYPTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const storedPkg = getStoredPackage();
  const encryptedAt = storedPkg?.encrypted_at
    ? new Date(storedPkg.encrypted_at).toLocaleTimeString('en-US', { hour12: false })
    : null;

  return (
    <Panel title="7. JASPER ENCRYPTION">
      <div className="space-y-3">

        {/* Mode toggle */}
        <div className="flex gap-1 border border-[#333] rounded overflow-hidden">
          <button
            onClick={() => { setMode('encrypt'); setResult(null); setError(null); }}
            className={`flex-1 py-1.5 text-[10px] tracking-widest font-bold uppercase transition-colors ${
              mode === 'encrypt' ? 'bg-[#d4af37] text-black' : 'bg-black text-gray-500 hover:text-[#d4af37]'
            }`}
          >
            <Lock className="w-3 h-3 inline mr-1" />ENCRYPT
          </button>
          <button
            onClick={() => { setMode('decrypt'); setResult(null); setError(null); }}
            className={`flex-1 py-1.5 text-[10px] tracking-widest font-bold uppercase transition-colors ${
              mode === 'decrypt' ? 'bg-[#d4af37] text-black' : 'bg-black text-gray-500 hover:text-[#d4af37]'
            }`}
          >
            <Unlock className="w-3 h-3 inline mr-1" />DECRYPT
          </button>
        </div>

        {/* Encrypt mode: text input */}
        {mode === 'encrypt' && (
          <div>
            <label className="block text-[9px] text-gray-500 mb-1 tracking-widest">PLAINTEXT / ASSET DATA</label>
            <Textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder='e.g. {"serial":"GOL-XYZ","weight":1000}'
              className="bg-black border-[#444] text-[#d4af37] font-mono text-[10px] h-20 resize-none"
            />
          </div>
        )}

        {/* Decrypt mode: show stored package info */}
        {mode === 'decrypt' && (
          <div className="border border-dashed border-[#333] p-2 rounded">
            {storedPkg ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#d4af37]" />
                  <span className="text-[9px] text-green-400 tracking-widest">PACKAGE IN VAULT</span>
                </div>
                <div className="text-[8px] text-gray-600">ALGO: {storedPkg.algorithm}</div>
                <div className="text-[8px] text-gray-600">ENCRYPTED: {encryptedAt}</div>
                <div className="text-[8px] text-gray-600 break-all">
                  DID: {storedPkg.owner_did?.slice(0, 22)}...
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-gray-600 text-center">NO PACKAGE IN LOCAL VAULT</div>
            )}
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
          disabled={loading}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-9 text-xs"
        >
          {loading ? (
            <><Loader className="w-3 h-3 mr-2 animate-spin" />{mode === 'encrypt' ? 'ENCRYPTING...' : 'DECRYPTING...'}</>
          ) : mode === 'encrypt' ? (
            <><Lock className="w-3 h-3 mr-2" />JASPER ENCRYPT</>
          ) : (
            <><Unlock className="w-3 h-3 mr-2" />JASPER DECRYPT</>
          )}
        </Button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded"
            >
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-[9px] text-red-400 leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative border border-[#d4af37]/40 bg-black/60 rounded p-2"
            >
              <button
                onClick={() => handleCopy(result.payload)}
                className="absolute top-2 right-2 text-gray-600 hover:text-[#d4af37] transition-colors"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[9px] text-green-400 tracking-widest">
                  {result.type === 'encrypted' ? 'ENCRYPTED — STORED IN VAULT' : 'DECRYPTED SUCCESSFULLY'}
                </span>
              </div>
              {result.type === 'encrypted' ? (
                <div className="text-[8px] text-gray-500 space-y-0.5">
                  <div>ALG: <span className="text-[#d4af37]">{result.payload.algorithm}</span></div>
                  <div>WRAP: <span className="text-[#d4af37]">{result.payload.key_wrap}</span></div>
                  <div className="text-[8px] text-gray-600 break-all">
                    IV: {result.payload.iv?.slice(0, 16)}...
                  </div>
                </div>
              ) : (
                <pre className="text-[9px] text-[#d4af37]/90 overflow-auto max-h-24 whitespace-pre-wrap break-all leading-relaxed">
                  {typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload, null, 2)}
                </pre>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-[8px] text-gray-700 border-t border-[#1a1a1a] pt-1.5 leading-relaxed">
          AES-256-GCM · HKDF-SHA256 · DID-BOUND KEY WRAPPING
        </div>
      </div>
    </Panel>
  );
}