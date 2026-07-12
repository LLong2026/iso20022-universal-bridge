import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from '@/components/console/Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import VaultDocument from '@/components/vault/VaultDocument';
import {
  Search, Download, Lock, Unlock, CheckCircle, AlertTriangle,
  Loader, Copy, ArrowLeft, FileText, Hash, ShieldCheck, List, Upload, KeySquare, Eye
} from 'lucide-react';

const DID_KEY = 'rwa_did_record';

function getStoredDid() {
  try { return JSON.parse(localStorage.getItem(DID_KEY) || 'null'); } catch { return null; }
}

export default function VaultRetrieve() {
  const [tab, setTab] = useState('retrieve'); // 'retrieve' | 'list' | 'ingest'
  const [assetId, setAssetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [myAssets, setMyAssets] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  // ingest form
  const [ingestForm, setIngestForm] = useState({
    asset_type: 'gold_bar', weight: '', purity: '999.9', description: '', vault_location: '', satoshi_anchor: '', xrp_destination: ''
  });
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestLoading, setIngestLoading] = useState(false);

  const navigate = useNavigate();
  const [didRecord, setDidRecord] = useState(getStoredDid());
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState(null);

  const handleImportDid = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importInput.trim());
      if (!parsed.did || !parsed.private_key_jwk) throw new Error('Missing did or private_key_jwk');
      localStorage.setItem(DID_KEY, JSON.stringify(parsed));
      setDidRecord(parsed);
      setImportInput('');
    } catch (e) {
      setImportError('INVALID DID RECEIPT — paste the full JSON receipt.');
    }
  };

  const handleRetrieve = async () => {
    if (!assetId.trim()) { setError('ENTER AN ASSET ID'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = {
        action: 'retrieve',
        asset_id: assetId.trim(),
        owner_did: didRecord?.did || undefined,
        decrypt: !!didRecord
      };
      const { data } = await base44.functions.invoke('rwaDataService', payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'RETRIEVAL FAILED');
    } finally { setLoading(false); }
  };

  const handleList = async () => {
    if (!didRecord) { setError('NO DID — generate one on the main console first.'); return; }
    setListLoading(true); setError(null);
    try {
      const { data } = await base44.functions.invoke('rwaDataService', { action: 'list', owner_did: didRecord.did });
      setMyAssets(data.assets || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'LIST FAILED');
    } finally { setListLoading(false); }
  };

  const handleIngest = async () => {
    if (!didRecord) { setError('NO DID — generate one first.'); return; }
    setIngestLoading(true); setError(null); setIngestResult(null);
    try {
      const asset = {
        asset_type: ingestForm.asset_type,
        weight: parseFloat(ingestForm.weight) || null,
        purity: ingestForm.purity || null,
        description: ingestForm.description || null,
        vault_location: ingestForm.vault_location || null,
        satoshi_anchor: ingestForm.satoshi_anchor || null,
        xrp_destination: ingestForm.xrp_destination || null,
      };
      const { data } = await base44.functions.invoke('rwaDataService', {
        action: 'full_ingest',
        asset,
        owner_did: didRecord.did,
        private_key_jwk: didRecord.private_key_jwk,
        encrypt: true
      });
      setIngestResult(data);
      // Auto-refresh asset list so new asset is immediately visible
      try {
        const listRes = await base44.functions.invoke('rwaDataService', { action: 'list', owner_did: didRecord.did });
        setMyAssets(listRes.data.assets || []);
      } catch {}
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'INGEST FAILED');
    } finally { setIngestLoading(false); }
  };

  useEffect(() => {
    if (tab === 'list') handleList();
  }, [tab]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            RWA VAULT — RETRIEVE / INGEST
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            JASPER AES-256-GCM · DID-BOUND · SATOSHI-ANCHORED
          </div>
        </div>
        <Link to="/">
          <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
            <ArrowLeft className="w-3 h-3 mr-1" /> CONSOLE
          </Button>
        </Link>
      </div>

      {/* DID Status bar */}
      <div className={`mb-4 border px-3 py-2 rounded text-[10px] tracking-wider ${
        didRecord ? 'border-green-900/50 bg-green-950/10 text-green-400' : 'border-yellow-900/50 bg-yellow-950/10 text-yellow-500'
      }`}>
        <div className="flex items-center gap-2">
          {didRecord ? <ShieldCheck className="w-3 h-3 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
          {didRecord
            ? `DID ACTIVE: ${didRecord.did.slice(0, 28)}...`
            : 'NO DID LOADED — generate one on main console or import a receipt below.'}
        </div>
        {!didRecord && (
          <div className="mt-2 flex gap-1">
            <Input
              value={importInput}
              onChange={e => setImportInput(e.target.value)}
              placeholder='Paste DID receipt JSON...'
              className="bg-black border-[#444] text-[9px] text-gray-300 font-mono h-7 flex-1"
            />
            <Button onClick={handleImportDid} className="h-7 px-2 bg-[#d4af37] hover:bg-[#b8962f] text-black text-[8px]">
              <Upload className="w-3 h-3" />
            </Button>
          </div>
        )}
        {importError && <div className="text-[8px] text-red-400 mt-1">{importError}</div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-[#333] rounded overflow-hidden mb-6 w-fit">
        {[
          { id: 'retrieve', label: 'RETRIEVE', icon: Search },
          { id: 'list', label: 'MY ASSETS', icon: List },
          { id: 'ingest', label: 'FULL INGEST', icon: Download },
          { id: 'serial', label: 'SERIAL LOOKUP', icon: Search }
        ].map(({ id, label, icon: TabIcon }) => (
          <button key={id} onClick={() => {
              if (id === 'serial') { navigate('/serial-search'); return; }
              setTab(id); setError(null); setResult(null);
            }}
            className={`px-4 py-2 text-[10px] tracking-widest font-bold uppercase transition-colors flex items-center gap-1.5 ${
              tab === id ? 'bg-[#d4af37] text-black' : 'bg-black text-gray-500 hover:text-[#d4af37]'
            }`}>
            <TabIcon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── RETRIEVE TAB ── */}
        {tab === 'retrieve' && (
          <>
            <Panel title="ASSET RETRIEVAL">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] text-gray-500 mb-1 tracking-widest">ASSET ID</label>
                  <Input
                    value={assetId}
                    onChange={e => setAssetId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRetrieve()}
                    placeholder="RWA-1234567890-ABCDEF"
                    className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-9"
                  />
                </div>
                <div className="text-[9px] text-gray-600 leading-relaxed">
                  {didRecord
                    ? '✓ DID found — encrypted data will be automatically decrypted if a Jasper package is stored locally.'
                    : '⚠ No DID — only public asset metadata will be returned.'}
                </div>
                <Button onClick={handleRetrieve} disabled={loading}
                  className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10">
                  {loading ? <><Loader className="w-4 h-4 mr-2 animate-spin" />RETRIEVING...</> : <><Search className="w-4 h-4 mr-2" />RETRIEVE ASSET</>}
                </Button>

                {error && (
                  <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[9px] text-red-400">{error}</span>
                  </div>
                )}
              </div>
            </Panel>

            {/* Result panel */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Panel title="RETRIEVED RECORD">
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                      {/* Asset meta */}
                      <div className="border border-[#333] bg-black/60 p-2 rounded space-y-1">
                        <div className="text-[9px] text-gray-500 tracking-widest mb-1">ASSET RECORD</div>
                        {[
                          ['ASSET ID', result.asset?.asset_id],
                          ['TYPE', result.asset?.asset_type],
                          ['WEIGHT', result.asset?.weight ? `${result.asset.weight}g` : '—'],
                          ['PURITY', result.asset?.purity || '—'],
                          ['STATUS', result.asset?.current_status],
                          ['ENCRYPTED', result.asset?.is_encrypted ? 'YES' : 'NO'],
                          ['SATOSHI', result.asset?.satoshi_anchor || '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[9px]">
                            <span className="text-gray-600">{k}:</span>
                            <span className="text-[#d4af37] text-right max-w-[60%] break-all">{v || '—'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Decrypted data */}
                      {result.decrypted_data && (() => {
                        const { file_url, ...safePayload } = result.decrypted_data;
                        return (
                        <div className="relative border border-green-900/50 bg-green-950/10 p-2 rounded">
                          <button onClick={() => copy(safePayload, 'dec')}
                            className="absolute top-2 right-2 text-gray-600 hover:text-[#d4af37]">
                            {copied === 'dec' ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <div className="flex items-center gap-1 mb-1">
                            <Unlock className="w-3 h-3 text-green-400" />
                            <span className="text-[9px] text-green-400 tracking-widest">DECRYPTED PAYLOAD</span>
                          </div>
                          <pre className="text-[8px] text-green-300/80 overflow-auto max-h-32 whitespace-pre-wrap break-all leading-relaxed">
                            {JSON.stringify(safePayload, null, 2)}
                          </pre>
                        </div>
                        );
                      })()}

                      {/* Vault document viewer */}
                      {result.decrypted_data?.file_url && (
                        <VaultDocument
                          fileUrl={result.decrypted_data.file_url}
                          fileName={result.decrypted_data.file_name}
                          fileHash={result.asset?.binding_hash}
                        />
                      )}

                      {/* Transactions */}
                      {result.transactions?.length > 0 && (
                        <div className="border border-[#222] p-2 rounded">
                          <div className="text-[9px] text-gray-500 tracking-widest mb-1 flex items-center gap-1">
                            <Hash className="w-3 h-3" />TRANSACTIONS ({result.transaction_count})
                          </div>
                          {result.transactions.map((tx, i) => (
                            <div key={i} className="text-[8px] text-gray-600 border-t border-[#1a1a1a] pt-1 mt-1">
                              <span className="text-[#d4af37]">{tx.transaction_type?.toUpperCase()}</span>
                              {' · '}{tx.transaction_id}
                              <div className="text-gray-700 break-all">HASH: {tx.transaction_hash?.slice(0, 24)}...</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── LIST TAB ── */}
        {tab === 'list' && (
          <div className="lg:col-span-2">
            <Panel title={`MY ASSETS (DID-OWNED)`}>
              {listLoading ? (
                <div className="flex items-center gap-2 text-[#d4af37] text-xs py-4">
                  <Loader className="w-4 h-4 animate-spin" />LOADING...
                </div>
              ) : myAssets.length === 0 ? (
                <div className="text-[10px] text-gray-600 py-4 text-center">
                  NO ASSETS FOUND FOR THIS DID.
                </div>
              ) : (
                <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                  {myAssets.map((asset, i) => (
                    <motion.div key={asset.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="border border-[#333] bg-black/60 p-2 rounded flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#d4af37] font-bold truncate">{asset.asset_id}</div>
                        <div className="text-[9px] text-gray-500">{asset.asset_type?.toUpperCase()} · {asset.weight ? `${asset.weight}g` : '—'} · {asset.current_status?.toUpperCase()}</div>
                        {asset.description && <div className="text-[8px] text-gray-700 truncate">{asset.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {asset.is_encrypted ? <Lock className="w-3 h-3 text-[#d4af37]" /> : <Unlock className="w-3 h-3 text-gray-600" />}
                        <Button size="sm" variant="outline"
                          onClick={() => { setTab('retrieve'); setAssetId(asset.asset_id); }}
                          className="h-6 text-[8px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] px-2">
                          RETRIEVE
                        </Button>
                        {asset.is_encrypted && (
                          <Link to="/decrypt">
                            <Button size="sm"
                              className="h-6 text-[8px] bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold px-2">
                              <KeySquare className="w-2.5 h-2.5 mr-0.5" />DECRYPT
                            </Button>
                          </Link>
                        )}
                        <Link to={`/artifact-viewer?asset_id=${asset.asset_id}`}>
                          <Button size="sm" variant="outline"
                            className="h-6 text-[8px] border-[#555] text-gray-400 hover:text-green-400 hover:border-green-700 px-2">
                            <Eye className="w-2.5 h-2.5 mr-0.5" />ARTIFACT
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {error && (
                <div className="mt-2 flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[9px] text-red-400">{error}</span>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ── FULL INGEST TAB ── */}
        {tab === 'ingest' && (
          <>
            <Panel title="FULL PIPELINE INGEST">
              <div className="space-y-3">
                <div className="text-[9px] text-gray-600 leading-relaxed border-b border-[#1a1a1a] pb-2 mb-1">
                  STORE → ENCRYPT → SIGN → TX → MINE BLOCK → AUDIT LOG
                </div>

                {[
                  { label: 'WEIGHT (g)', key: 'weight', placeholder: '1000.00' },
                  { label: 'PURITY', key: 'purity', placeholder: '999.9' },
                  { label: 'VAULT LOCATION', key: 'vault_location', placeholder: 'VAULT-A1, ZURICH' },
                  { label: 'SATOSHI ANCHOR', key: 'satoshi_anchor', placeholder: 'SAT-...' },
                  { label: 'DESCRIPTION', key: 'description', placeholder: 'e.g. 1kg Swiss PAMP bar' },
                  { label: 'XRP DESTINATION ADDRESS', key: 'xrp_destination', placeholder: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (payment rail endpoint)' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[9px] text-gray-500 mb-1 tracking-widest">{label}</label>
                    <Input
                      value={ingestForm[key]}
                      onChange={e => setIngestForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-black border-[#444] text-[#d4af37] font-mono text-xs h-8"
                    />
                  </div>
                ))}

                <Button onClick={handleIngest} disabled={ingestLoading || !didRecord}
                  className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10">
                  {ingestLoading
                    ? <><Loader className="w-4 h-4 mr-2 animate-spin" />INGESTING PIPELINE...</>
                    : <><Download className="w-4 h-4 mr-2" />FULL INGEST</>}
                </Button>

                {error && (
                  <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[9px] text-red-400">{error}</span>
                  </div>
                )}
              </div>
            </Panel>

            <AnimatePresence>
              {ingestResult && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Panel title="INGEST RECEIPT">
                    <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[10px] text-green-400 tracking-widest">FULLY INGESTED</span>
                      </div>
                      {[
                        ['ASSET ID', ingestResult.asset_id],
                        ['TX ID', ingestResult.transaction_id],
                        ['BLOCK HEIGHT', ingestResult.block_height],
                        ['PIPELINE', ingestResult.pipeline],
                        ['ENCRYPTED', ingestResult.encrypted ? 'YES (JASPER AES-256)' : 'NO'],
                        ['SIGNED', ingestResult.signature ? 'YES (Ed25519)' : 'NO'],
                        ['XRP ENDPOINT', ingestForm.xrp_destination || '(none specified)'],
                      ].map(([k, v]) => (
                        <div key={k} className="border-t border-[#1a1a1a] pt-1">
                          <div className="text-[8px] text-gray-600">{k}</div>
                          <div className="text-[9px] text-[#d4af37] break-all">{String(v)}</div>
                        </div>
                      ))}
                      <div className="border-t border-[#1a1a1a] pt-1">
                        <div className="text-[8px] text-gray-600">TX HASH</div>
                        <div className="text-[9px] text-[#d4af37] break-all font-bold">{ingestResult.transaction_hash}</div>
                      </div>
                      <div className="border-t border-[#1a1a1a] pt-1">
                        <div className="text-[8px] text-gray-600">BLOCK HASH</div>
                        <div className="text-[9px] text-[#d4af37] break-all">{ingestResult.block_hash}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline"
                          onClick={() => { setTab('retrieve'); setAssetId(ingestResult.asset_id); }}
                          className="flex-1 h-7 text-[9px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37]">
                          → RETRIEVE
                        </Button>
                        <Link to="/decrypt">
                          <Button size="sm"
                            className="flex-1 h-7 text-[9px] bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold px-3">
                            <KeySquare className="w-3 h-3 mr-1" />DECRYPT NOW
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-2 border border-green-900/40 bg-green-950/10 p-2 rounded text-[8px] text-green-400 leading-relaxed">
                        ✓ JASPER PACKAGE PERSISTED TO VAULT — navigate to DECRYPT to unlock contents with your DID.
                      </div>
                    </div>
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}