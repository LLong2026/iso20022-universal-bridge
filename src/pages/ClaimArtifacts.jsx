import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle, Loader, Upload, KeySquare } from 'lucide-react';

const DID_KEY = 'rwa_did_record';
function getStoredDid() {
  try { return JSON.parse(localStorage.getItem(DID_KEY) || 'null'); } catch { return null; }
}

export default function ClaimArtifacts() {
  const [didRecord, setDidRecord] = useState(getStoredDid());
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImportDid = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importInput.trim());
      if (!parsed.did || !parsed.private_key_jwk) throw new Error();
      localStorage.setItem(DID_KEY, JSON.stringify(parsed));
      setDidRecord(parsed);
      setImportInput('');
    } catch {
      setImportError('Invalid DID receipt — paste the full JSON.');
    }
  };

  const handleClaim = async () => {
    if (!didRecord) return;
    setClaiming(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('claimArtifactsByDid', {
        owner_did: didRecord.did
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            CLAIM ARTIFACTS TO DID
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            LINK BOUND ARTIFACTS → YOUR DID → DECRYPT ENGINE
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/decrypt">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <KeySquare className="w-3 h-3 mr-1" /> DECRYPT
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <ArrowLeft className="w-3 h-3 mr-1" /> CONSOLE
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-xl">
        {/* DID status */}
        <div className={`mb-5 border px-3 py-2.5 rounded text-[10px] tracking-wider ${
          didRecord ? 'border-green-900/50 bg-green-950/10 text-green-400' : 'border-yellow-900/50 bg-yellow-950/10 text-yellow-500'
        }`}>
          <div className="flex items-center gap-2">
            {didRecord
              ? <><ShieldCheck className="w-3 h-3" /> DID ACTIVE: {didRecord.did.slice(0, 36)}...</>
              : <><AlertTriangle className="w-3 h-3" /> NO DID LOADED — import your receipt below.</>}
          </div>
          {!didRecord && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                <Input
                  value={importInput}
                  onChange={e => setImportInput(e.target.value)}
                  placeholder='Paste full DID receipt JSON...'
                  className="bg-black border-[#444] text-[9px] text-gray-300 font-mono h-7 flex-1"
                />
                <Button onClick={handleImportDid} className="h-7 px-2 bg-[#d4af37] hover:bg-[#b8962f] text-black">
                  <Upload className="w-3 h-3" />
                </Button>
              </div>
              {importError && <div className="text-[8px] text-red-400">{importError}</div>}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="border border-[#333] bg-black/50 rounded p-4 mb-5 text-[9px] text-gray-500 leading-relaxed space-y-2">
          <div className="text-[#d4af37] font-bold text-[10px] tracking-wider mb-1">WHY DO THIS?</div>
          <p>Artifacts uploaded and bound via the main console are stored in the vault but not yet linked to your DID identity. The Decrypt Engine requires a DID link to list and decrypt them.</p>
          <p>Clicking <span className="text-[#d4af37]">CLAIM ALL BOUND ARTIFACTS</span> will scan every bound artifact and register it under your DID so it appears in the Decrypt Engine's list.</p>
        </div>

        {/* Action */}
        <Button
          onClick={handleClaim}
          disabled={claiming || !didRecord}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-11 mb-4"
        >
          {claiming
            ? <><Loader className="w-4 h-4 mr-2 animate-spin" />CLAIMING...</>
            : <><ShieldCheck className="w-4 h-4 mr-2" />CLAIM ALL BOUND ARTIFACTS</>}
        </Button>

        {error && (
          <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-3 rounded mb-4">
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] text-red-400">{error}</span>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="border border-green-900/50 bg-green-950/10 p-4 rounded">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[10px] text-green-400 tracking-widest font-bold">CLAIM COMPLETE</span>
            </div>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between">
                <span className="text-gray-500">ARTIFACTS CLAIMED:</span>
                <span className="text-[#d4af37] font-bold">{result.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ALREADY LINKED:</span>
                <span className="text-gray-400">{result.skipped}</span>
              </div>
            </div>
            {result.created > 0 && (
              <div className="mt-3">
                <Link to="/decrypt">
                  <Button className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold text-[9px] h-9">
                    <KeySquare className="w-3.5 h-3.5 mr-1" /> OPEN DECRYPT ENGINE
                  </Button>
                </Link>
              </div>
            )}
            {result.created === 0 && (
              <div className="text-[8px] text-gray-600 mt-2">
                All artifacts were already claimed, or no bound artifacts exist yet.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}