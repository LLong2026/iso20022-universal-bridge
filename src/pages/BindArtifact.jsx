import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Upload, CheckCircle, Loader, AlertTriangle,
  ShieldCheck, Zap, RefreshCw, Lock
} from 'lucide-react';

const DID_KEY = 'rwa_did_record';
function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

export default function BindArtifact() {
  const [didRecord, setDidRecord] = useState(getStored(DID_KEY));
  const [artifacts, setArtifacts] = useState([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [selected, setSelected] = useState(null);
  const [weight, setWeight] = useState('');
  const [binding, setBinding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Sync DID from localStorage
  useEffect(() => {
    const sync = () => { const f = getStored(DID_KEY); if (f) setDidRecord(f); };
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync); };
  }, []);

  // Load pending artifacts
  useEffect(() => {
    loadArtifacts();
  }, []);

  const loadArtifacts = async () => {
    setLoadingArtifacts(true);
    try {
      const all = await base44.entities.Artifact.list('-created_date', 100);
      // Show pending + recently bound
      setArtifacts(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const handleBind = async () => {
    if (!selected || !didRecord) return;
    setBinding(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('bindArtifact', {
        artifact_serial: selected.serial_number,
        owner_did: didRecord.did,
        weight_grams: parseFloat(weight) || 0,
      });
      setResult(data);
      // Refresh list
      await loadArtifacts();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'BIND FAILED');
    } finally {
      setBinding(false);
    }
  };

  const statusColor = (s) => s === 'bound' ? 'text-green-400' : s === 'pending' ? 'text-yellow-500' : 'text-gray-500';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            ARTIFACT BIND ENGINE
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            SELECT ARTIFACT · ATTACH DID · BIND → DECRYPT ENGINE
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/decrypt">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <Lock className="w-3 h-3 mr-1" /> DECRYPT
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
        {didRecord
          ? <><ShieldCheck className="w-3 h-3 inline mr-1" />DID ACTIVE: {didRecord.did.slice(0, 36)}...</>
          : <><AlertTriangle className="w-3 h-3 inline mr-1" />NO DID LOADED — generate one on the main console first.</>
        }
        {!didRecord && (
          <Link to="/did-setup" className="ml-3 text-[#d4af37] underline text-[9px]">GO TO DID SETUP →</Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — artifact list */}
        <div className="border border-[#222] rounded p-4 bg-[#0d0d0d]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-bold tracking-widest text-[#d4af37]">YOUR ARTIFACTS</div>
            <button onClick={loadArtifacts} disabled={loadingArtifacts}
              className="flex items-center gap-1 text-[8px] text-gray-600 hover:text-[#d4af37] transition-colors">
              <RefreshCw className={`w-3 h-3 ${loadingArtifacts ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
          </div>

          {loadingArtifacts ? (
            <div className="flex items-center gap-2 text-[#d4af37] text-[10px] py-4">
              <Loader className="w-4 h-4 animate-spin" /> LOADING...
            </div>
          ) : artifacts.length === 0 ? (
            <div className="text-[10px] text-gray-600 py-6 text-center">
              NO ARTIFACTS FOUND.<br />
              <Link to="/" className="text-[#d4af37] underline">Upload one from the Console →</Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {artifacts.map(art => (
                <button
                  key={art.id}
                  onClick={() => { setSelected(art); setResult(null); setError(null); setWeight(''); }}
                  className={`w-full text-left border rounded p-2.5 transition-all ${
                    selected?.id === art.id
                      ? 'border-[#d4af37] bg-[#d4af37]/10'
                      : 'border-[#222] hover:border-[#444] bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-[#d4af37] font-bold tracking-wider truncate">
                      {art.serial_number}
                    </div>
                    <span className={`text-[8px] font-bold tracking-widest ml-2 flex-shrink-0 ${statusColor(art.status)}`}>
                      {(art.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[8px] text-gray-500 mt-0.5">
                    {art.artifact_type?.toUpperCase()} · {art.file_name || 'NO FILE'}
                  </div>
                  {art.description && (
                    <div className="text-[8px] text-gray-600 truncate">{art.description}</div>
                  )}
                  {art.owner_did && (
                    <div className="text-[7px] text-green-500/70 mt-0.5 truncate">
                      DID: {art.owner_did.slice(0, 28)}...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — bind controls */}
        <div className="border border-[#222] rounded p-4 bg-[#0d0d0d]">
          <div className="text-[11px] font-bold tracking-widest text-[#d4af37] mb-4">BIND CONFIGURATION</div>

          {!selected ? (
            <div className="text-[10px] text-gray-600 py-10 text-center">
              ← SELECT AN ARTIFACT TO BIND
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected artifact summary */}
              <div className="border border-[#d4af37]/30 bg-[#d4af37]/5 rounded p-3 space-y-1">
                <div className="text-[9px] text-gray-500 tracking-widest">SELECTED ARTIFACT</div>
                <div className="text-[11px] text-[#d4af37] font-bold">{selected.serial_number}</div>
                <div className="text-[8px] text-gray-500">
                  {selected.artifact_type?.toUpperCase()} · {selected.file_name || 'no file'}
                </div>
                {selected.status === 'bound' && (
                  <div className="text-[8px] text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> ALREADY BOUND — rebinding will update the DID
                  </div>
                )}
              </div>

              {/* DID summary */}
              <div className="border border-[#333] bg-black/40 rounded p-2.5 space-y-1">
                <div className="text-[9px] text-gray-500 tracking-widest">BINDING DID</div>
                {didRecord ? (
                  <div className="text-[9px] text-green-400 break-all">{didRecord.did}</div>
                ) : (
                  <div className="text-[9px] text-red-400">NO DID — generate one first</div>
                )}
              </div>

              {/* Weight input */}
              <div>
                <label className="block text-[9px] text-gray-500 mb-1 tracking-widest">WEIGHT IN GRAMS (OPTIONAL)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 1000"
                  className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-9"
                />
              </div>

              {/* Bind button */}
              <Button
                onClick={handleBind}
                disabled={binding || !didRecord}
                className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-11"
              >
                {binding
                  ? <><Loader className="w-4 h-4 mr-2 animate-spin" />BINDING...</>
                  : <><Zap className="w-4 h-4 mr-2" />BIND ARTIFACT TO DID</>
                }
              </Button>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[8px] text-red-400 leading-relaxed">{error}</span>
                </div>
              )}

              {/* Success */}
              {result?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-green-900/50 bg-green-950/10 p-3 rounded space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] text-green-400 font-bold tracking-widest">ARTIFACT BOUND</span>
                  </div>
                  <div className="text-[8px] text-gray-500 space-y-0.5">
                    <div>SERIAL: <span className="text-[#d4af37]">{result.artifact_serial}</span></div>
                    <div>DID: <span className="text-green-400 break-all">{result.owner_did?.slice(0, 40)}...</span></div>
                    <div className="text-[7px] break-all text-gray-600">HASH: {result.binding_hash?.slice(0, 32)}...</div>
                  </div>
                  <Link to="/decrypt">
                    <Button size="sm" className="w-full h-8 bg-[#d4af37] hover:bg-[#b8962f] text-black text-[9px] font-bold tracking-widest mt-1">
                      <Lock className="w-3 h-3 mr-1" /> OPEN DECRYPT ENGINE →
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help note */}
      <div className="mt-6 border border-[#1a1a1a] rounded p-3 text-[9px] text-gray-600 leading-relaxed">
        <span className="text-[#d4af37]">HOW IT WORKS:</span> Upload a file in the Console (Artifact Registration) →
        Select it here → Bind it to your DID → Go to the Decrypt Engine to view and decrypt it.
        Your DID is loaded from local storage — generate it in the Console's DID Key Manager panel.
      </div>
    </div>
  );
}