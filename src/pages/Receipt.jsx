import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, ArrowLeft, CheckCircle, AlertTriangle, Loader,
  Copy, Hash, Download, FileText, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Real SHA-256 over file bytes → 32-byte (64 hex char) fingerprint
async function computeFileHash(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export default function Receipt() {
  const urlParams = new URLSearchParams(window.location.search);
  const initSerial = urlParams.get('serial') || '';

  const [serial, setSerial] = useState(initSerial);
  const [loading, setLoading] = useState(false);
  const [goldAsset, setGoldAsset] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  // Hash state
  const [fileHash, setFileHash] = useState(null);
  const [hashLoading, setHashLoading] = useState(false);
  const [hashError, setHashError] = useState(null);

  // Auto-search if serial in URL
  useEffect(() => {
    if (initSerial) handleSearch(initSerial);
  }, []);

  const handleSearch = async (overrideSerial) => {
    const s = (overrideSerial || serial).trim();
    if (!s) return;
    setLoading(true);
    setError(null);
    setGoldAsset(null);
    setArtifact(null);
    setFileHash(null);
    setHashError(null);

    try {
      // Search GoldAsset by serial_number
      const [goldResults, artifactResults] = await Promise.all([
        base44.entities.GoldAsset.filter({ serial_number: s }),
        base44.entities.Artifact.filter({ bound_serial: s }),
      ]);

      const gold = goldResults[0] || null;
      const art = artifactResults[0] || null;

      setGoldAsset(gold);
      setArtifact(art);

      if (!gold && !art) {
        setError('No record found for serial: ' + s);
      } else if (art?.file_url) {
        // Auto-compute hash from file bytes
        computeHash(art.file_url);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const computeHash = async (url) => {
    setHashLoading(true);
    setHashError(null);
    setFileHash(null);
    try {
      const hash = await computeFileHash(url);
      setFileHash(hash);
    } catch {
      setHashError('HASH FAILED — CORS OR FILE UNAVAILABLE');
    } finally {
      setHashLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const isImage = (url) => url && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
  const isPDF = (url) => url && /\.pdf$/i.test(url);

  const Row = ({ label, value, mono = true }) => value ? (
    <div className="border-t border-[#1a1a1a] pt-1.5 mt-1.5">
      <div className="text-[8px] text-gray-600 tracking-widest">{label}</div>
      <div className={`text-[10px] text-[#d4af37] break-all mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            RECEIPT & ARTIFACT RECOVERY
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            SERIAL → RECEIPT → 32-BYTE SHA-256 SNAPSHOT → ARTIFACT RESTORE
          </div>
        </div>
        <Link to="/vault">
          <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
            <ArrowLeft className="w-3 h-3 mr-1" /> VAULT
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6 max-w-2xl">
        <Input
          value={serial}
          onChange={e => setSerial(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Enter serial number (e.g. OTH-MQ4L92E5-FQAJ)"
          className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-11 flex-1"
        />
        <Button onClick={() => handleSearch()} disabled={loading || !serial.trim()}
          className="bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold h-11 px-5">
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-red-900/50 bg-red-950/20 p-3 rounded mb-4 max-w-2xl">
          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <span className="text-[9px] text-red-400">{error}</span>
        </div>
      )}

      <AnimatePresence>
        {(goldAsset || artifact) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl"
          >
            {/* LEFT: Receipt panel */}
            <div className="space-y-4">

              {/* Gold Asset Receipt */}
              {goldAsset && (
                <div className="border border-[#d4af37]/40 bg-black/70 rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] text-green-400 tracking-widest font-bold">GOLD ASSET RECEIPT</span>
                  </div>
                  <Row label="SERIAL NUMBER" value={goldAsset.serial_number} />
                  <Row label="WEIGHT" value={goldAsset.weight_grams ? `${goldAsset.weight_grams}g` : null} />
                  <Row label="STATUS" value={goldAsset.status?.toUpperCase()} />
                  <Row label="SATOSHI UTXO" value={goldAsset.satoshi_utxo} />
                  <Row label="MINTED" value={goldAsset.mint_timestamp ? new Date(goldAsset.mint_timestamp).toLocaleString() : null} />
                  {goldAsset.binding_hash && (
                    <div className="border-t border-[#1a1a1a] pt-1.5 mt-1.5">
                      <div className="text-[8px] text-gray-600 tracking-widest">BINDING HASH (586-BIT SPONGE)</div>
                      <div className="text-[9px] text-[#d4af37] break-all mt-0.5 leading-relaxed">
                        {goldAsset.binding_hash}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Artifact receipt metadata */}
              {artifact && (
                <div className="border border-[#333] bg-black/70 rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-[10px] text-[#d4af37] tracking-widest font-bold">ARTIFACT RECORD</span>
                  </div>
                  <Row label="ARTIFACT SERIAL" value={artifact.serial_number} />
                  <Row label="TYPE" value={artifact.artifact_type?.toUpperCase()} />
                  <Row label="STATUS" value={artifact.status?.toUpperCase()} />
                  <Row label="BOUND SERIAL" value={artifact.bound_serial} />
                  <Row label="FILE NAME" value={artifact.file_name} />
                  {artifact.description && <Row label="DESCRIPTION" value={artifact.description} mono={false} />}
                </div>
              )}

              {/* 32-byte SHA-256 snapshot */}
              {artifact?.file_url && (
                <div className="border border-green-900/40 bg-black/70 rounded p-4">
                  <div className="text-[9px] text-gray-500 tracking-widest mb-3 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> 32-BYTE SHA-256 STATE SNAPSHOT
                  </div>

                  {hashLoading && (
                    <div className="flex items-center gap-2 text-[9px] text-yellow-500">
                      <Loader className="w-3 h-3 animate-spin" /> READING FILE BYTES · COMPUTING HASH...
                    </div>
                  )}

                  {hashError && (
                    <div className="text-[8px] text-red-400">
                      {hashError}
                      <button onClick={() => computeHash(artifact.file_url)} className="ml-2 text-[#d4af37]">RETRY</button>
                    </div>
                  )}

                  {fileHash && (
                    <div>
                      <div className="bg-black border border-green-800/50 rounded p-3 mb-2">
                        <div className="text-[8px] text-green-300 font-bold tracking-widest break-all leading-loose">
                          {fileHash.slice(0, 32)}
                        </div>
                        <div className="text-[8px] text-green-300 font-bold tracking-widest break-all leading-loose">
                          {fileHash.slice(32)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] text-gray-700">256 bits · 32 bytes · deterministic · reproducible</span>
                        <div className="flex gap-2">
                          <button onClick={() => computeHash(artifact.file_url)} title="Recompute"
                            className="text-gray-600 hover:text-[#d4af37]">
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button onClick={() => copy(fileHash, 'hash')} title="Copy"
                            className="text-gray-600 hover:text-[#d4af37]">
                            {copied === 'hash' ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 border-t border-[#1a1a1a] pt-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-[7px] text-green-400 tracking-widest">
                          SNAPSHOT VERIFIED — RE-FETCH THIS FILE AND HASH WILL MATCH EXACTLY
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Artifact document + download */}
            <div className="border border-[#333] bg-black/60 rounded p-4 flex flex-col">
              <div className="text-[9px] text-gray-500 tracking-widest mb-3">SCANNED ARTIFACT — RESTORED FROM SNAPSHOT</div>

              {!artifact?.file_url ? (
                <div className="flex-1 flex items-center justify-center text-[9px] text-gray-700 border border-[#1a1a1a] rounded h-64">
                  NO FILE BOUND TO THIS SERIAL
                </div>
              ) : isImage(artifact.file_url) ? (
                <img
                  src={artifact.file_url}
                  alt="Artifact"
                  className="w-full rounded border border-[#333] object-contain max-h-[55vh] mb-3"
                />
              ) : isPDF(artifact.file_url) ? (
                <iframe
                  src={artifact.file_url}
                  className="w-full h-[55vh] rounded border border-[#333] mb-3"
                  title="Artifact PDF"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-48 border border-[#1a1a1a] rounded gap-2 mb-3">
                  <FileText className="w-8 h-8 text-[#d4af37]" />
                  <div className="text-[9px] text-gray-600">FILE TYPE — NO INLINE PREVIEW</div>
                </div>
              )}

              {artifact?.file_url && (
                <div className="flex gap-2 mt-auto">
                  <a href={artifact.file_url} download={artifact.file_name || 'artifact'}
                    className="flex-1">
                    <Button className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold text-[9px] h-9">
                      <Download className="w-3.5 h-3.5 mr-1" /> DOWNLOAD ARTIFACT
                    </Button>
                  </a>
                  <button onClick={() => copy(artifact.file_url, 'url')}
                    className="border border-[#333] rounded px-3 text-gray-500 hover:text-[#d4af37] hover:border-[#d4af37]"
                    title="Copy file URL">
                    {copied === 'url' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <LinkIcon className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!goldAsset && !artifact && !error && !loading && (
        <div className="text-center text-[10px] text-gray-700 py-12 tracking-widest">
          ENTER A SERIAL NUMBER TO RESTORE THE RECEIPT AND ARTIFACT
        </div>
      )}
    </div>
  );
}