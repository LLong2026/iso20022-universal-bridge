import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from '@/components/console/Panel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Loader, AlertTriangle, ShieldCheck, Lock, RefreshCw, Upload, CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import ArtifactSelector from '@/components/vault/ArtifactSelector';
import HashVerifier from '@/components/vault/HashVerifier';
import DecryptedContent from '@/components/vault/DecryptedContent';

const DID_KEY = 'rwa_did_record';
const PKG_KEY = 'jasper_encrypted_package';

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

export default function DecryptArtifact() {
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [contentHash, setContentHash] = useState(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  const [didRecord, setDidRecord] = useState(getStored(DID_KEY));
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState(null);

  // Re-sync DID from localStorage whenever tab gains focus or storage changes
  useEffect(() => {
    const sync = () => {
      const fresh = getStored(DID_KEY);
      if (fresh) setDidRecord(fresh);
    };
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync); };
  }, []);

  const handleImportDid = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importInput.trim());
      if (!parsed.did || !parsed.private_key_jwk) throw new Error('Missing fields');
      localStorage.setItem(DID_KEY, JSON.stringify(parsed));
      setDidRecord(parsed);
      setImportInput('');
    } catch {
      setImportError('INVALID RECEIPT — paste full JSON.');
    }
  };

  useEffect(() => {
    if (didRecord) loadAssets();
  }, [didRecord]);

  const loadAssets = async () => {
    setLoadingAssets(true); setError(null);
    try {
      const { data } = await base44.functions.invoke('rwaDataService', {
        action: 'list',
        owner_did: didRecord.did
      });
      setAssets(data.assets || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'FAILED TO LOAD ASSETS');
    } finally { setLoadingAssets(false); }
  };

  const handleSelect = (asset) => {
    setSelected(asset);
    setDecryptedData(null);
    setTransaction(null);
    setContentHash(null);
    setVerified(false);
    setError(null);
  };

  const handleDecrypt = async () => {
    if (!selected) return;
    const pkg = getStored(`jasper_encrypted_package_${selected.asset_id}`);

    if (!pkg) {
      setError('NO ENCRYPTED PACKAGE FOUND — you must have ingested an asset with Jasper encryption first. The package is stored locally after ingest.');
      return;
    }
    if (pkg.owner_did && pkg.owner_did !== didRecord.did) {
      setError('PACKAGE DID MISMATCH — this encrypted package belongs to a different DID.');
      return;
    }

    setDecrypting(true); setError(null); setDecryptedData(null); setVerified(false);
    try {
      const { data } = await base44.functions.invoke('rwaDataService', {
        action: 'retrieve',
        asset_id: selected.asset_id,
        owner_did: didRecord.did,
        encrypted_package: pkg,
        decrypt: true
      });

      if (!data.decrypted_data) {
        setError('DECRYPTION RETURNED NO DATA — the encrypted package may not match this asset.');
        return;
      }

      setDecryptedData(data.decrypted_data);
      setTransaction(data.transactions?.[0] || null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'DECRYPTION FAILED');
    } finally { setDecrypting(false); }
  };

  const handleVerified = (hash) => {
    setContentHash(hash);
    setVerified(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            JASPER DECRYPTION INTERFACE
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            SELECT BOUND ARTIFACT · VERIFY HASH CHAIN · UNLOCK CONTENTS
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/vault">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              VAULT
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <ArrowLeft className="w-3 h-3 mr-1" /> CONSOLE
            </Button>
          </Link>
        </div>
      </div>

      {/* DID Status */}
      <div className={`mb-6 border px-3 py-2 rounded text-[10px] tracking-wider ${
        didRecord ? 'border-green-900/50 bg-green-950/10 text-green-400' : 'border-red-900/50 bg-red-950/10 text-red-400'
      }`}>
        <div className="flex items-center gap-2">
          <span className="flex-1">
            {didRecord
              ? <><ShieldCheck className="w-3 h-3 inline mr-1 flex-shrink-0" />DID ACTIVE: {didRecord.did.slice(0, 32)}...</>
              : <><AlertTriangle className="w-3 h-3 inline mr-1 flex-shrink-0" />NO DID — generate on main console or import receipt below.</>}
          </span>
          {!didRecord && (
            <button onClick={() => { const f = getStored(DID_KEY); if (f) setDidRecord(f); }}
              className="text-[8px] text-gray-600 hover:text-[#d4af37] border border-[#333] px-2 py-0.5 rounded transition-colors ml-2 flex-shrink-0">
              <RefreshCw className="w-2.5 h-2.5 inline mr-0.5" />RELOAD
            </button>
          )}
        </div>
        {!didRecord && (
          <div className="mt-3 space-y-2">
            {/* File upload */}
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="border border-dashed border-[#555] rounded px-3 py-1.5 text-center text-[9px] text-gray-500 hover:border-[#d4af37] hover:text-[#d4af37] transition-colors">
                  <Upload className="w-3 h-3 inline mr-1" />UPLOAD did-receipt-*.json FILE
                </div>
                <input type="file" accept=".json,application/json" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setImportError(null);
                    try {
                      const parsed = JSON.parse(ev.target.result);
                      if (!parsed.did || !parsed.private_key_jwk) throw new Error();
                      localStorage.setItem(DID_KEY, JSON.stringify(parsed));
                      setDidRecord(parsed);
                      setImportInput('');
                    } catch { setImportError('INVALID FILE — must be a did-receipt JSON with "did" and "private_key_jwk" fields.'); }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} />
              </label>
            </div>

            {/* Paste JSON */}
            <div className="flex gap-1">
              <Input
                value={importInput}
                onChange={e => setImportInput(e.target.value)}
                placeholder='Or paste full JSON: {"did":"did:key:...","private_key_jwk":{...}}'
                className="bg-black border-[#444] text-[9px] text-gray-300 font-mono h-7 flex-1"
              />
              <Button onClick={handleImportDid} className="h-7 px-2 bg-[#d4af37] hover:bg-[#b8962f] text-black text-[8px]">
                <Upload className="w-3 h-3" />
              </Button>
            </div>

            {/* Format hint */}
            <div className="text-[8px] text-gray-700 leading-relaxed">
              ⚠ The receipt is a <span className="text-gray-500">JSON object</span>, not a raw key.
              Download it from the main console → DID Key Panel → <span className="text-gray-500">DOWNLOAD</span> button.
            </div>
          </div>
        )}
        {importError && <div className="text-[8px] text-red-400 mt-1">{importError}</div>}
      </div>

      {!didRecord ? (
        <div className="text-center py-20 text-gray-600 text-sm">
          <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <div>No DID loaded. Return to the main console and generate your identity.</div>
          <Link to="/" className="mt-4 inline-block text-[#d4af37] text-xs hover:underline">← GO TO CONSOLE</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Col 1 — Artifact selector */}
          <Panel title={`BOUND ARTIFACTS ${assets.length ? `(${assets.length})` : ''}`}>
            <div className="mb-3 flex justify-end">
              <button onClick={loadAssets} disabled={loadingAssets}
                className="flex items-center gap-1 text-[8px] text-gray-600 hover:text-[#d4af37] transition-colors">
                <RefreshCw className={`w-3 h-3 ${loadingAssets ? 'animate-spin' : ''}`} />
                REFRESH
              </button>
            </div>
            {loadingAssets ? (
              <div className="flex items-center gap-2 text-[#d4af37] text-[10px] py-4">
                <Loader className="w-4 h-4 animate-spin" /> LOADING...
              </div>
            ) : (
              <ArtifactSelector assets={assets} selected={selected} onSelect={handleSelect} />
            )}
          </Panel>

          {/* Col 2 — Decrypt controls + hash verifier */}
          <Panel title="JASPER DECRYPTION ENGINE">
            {!selected ? (
              <div className="text-[10px] text-gray-600 py-6 text-center">
                ← SELECT AN ARTIFACT TO DECRYPT
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected summary */}
                <div className="border border-[#d4af37]/30 bg-[#d4af37]/5 rounded p-2.5 space-y-1">
                  <div className="text-[9px] text-gray-500 tracking-widest">SELECTED ARTIFACT</div>
                  <div className="text-[10px] text-[#d4af37] font-bold">{selected.asset_id}</div>
                  <div className="text-[8px] text-gray-600">
                    {selected.asset_type?.toUpperCase()} · {selected.weight ? `${selected.weight}g` : '—'}
                    {selected.is_encrypted && <span className="ml-2 text-[#d4af37]">🔒 JASPER ENCRYPTED</span>}
                  </div>
                </div>

                <Button
                  onClick={handleDecrypt}
                  disabled={decrypting || !selected.is_encrypted}
                  className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10"
                >
                  {decrypting
                    ? <><Loader className="w-4 h-4 mr-2 animate-spin" />DECRYPTING...</>
                    : <><Lock className="w-4 h-4 mr-2" />DECRYPT & VERIFY</>}
                </Button>

                {!selected.is_encrypted && (
                  <div className="text-[8px] text-yellow-600 text-center">
                    THIS ASSET WAS NOT ENCRYPTED WITH JASPER.
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[8px] text-red-400 leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Hash verification chain */}
                <AnimatePresence>
                  {decryptedData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-t border-[#1a1a1a] pt-4">
                      <HashVerifier
                        asset={selected}
                        transaction={transaction}
                        decryptedData={decryptedData}
                        onVerified={handleVerified}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Panel>

          {/* Col 3 — Decrypted contents */}
          <Panel title="UNLOCKED CONTENTS">
            <AnimatePresence mode="wait">
              {!decryptedData ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 gap-3 text-gray-700">
                  <Lock className="w-8 h-8 opacity-20" />
                  <div className="text-[9px] tracking-widest text-center">
                    CONTENTS LOCKED<br />
                    <span className="text-[8px]">SELECT ARTIFACT AND DECRYPT TO REVEAL</span>
                  </div>
                </motion.div>
              ) : verified ? (
                <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <DecryptedContent
                    decryptedData={decryptedData}
                    contentHash={contentHash}
                    asset={selected}
                  />
                </motion.div>
              ) : (
                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[10px] text-[#d4af37] py-6">
                  <Loader className="w-4 h-4 animate-spin" />VERIFYING HASH CHAIN...
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

        </div>
      )}
    </div>
  );
}