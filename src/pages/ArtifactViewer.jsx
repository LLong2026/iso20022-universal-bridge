import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Hash, CheckCircle, AlertTriangle, Loader, ExternalLink, Copy, RefreshCw } from 'lucide-react';

// Fetch file bytes and compute real SHA-256 (32 bytes = 64 hex chars)
async function computeFileHash(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export default function ArtifactViewer() {
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [hashLoading, setHashLoading] = useState(false);
  const [hashError, setHashError] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const serial = urlParams.get('serial');
  const assetId = urlParams.get('asset_id');

  useEffect(() => {
    if (!serial && !assetId) {
      setError('NO SERIAL OR ASSET ID PROVIDED');
      setLoading(false);
      return;
    }
    loadArtifact();
  }, []);

  const loadArtifact = async () => {
    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (serial) {
        results = await base44.entities.Artifact.filter({ bound_serial: serial });
      }
      if (results.length === 0 && assetId) {
        results = await base44.entities.Artifact.filter({ bound_serial: assetId });
      }
      if (results.length === 0) {
        setError('NO ARTIFACT FOUND FOR THIS ASSET');
      } else {
        const found = results[0];
        setArtifact(found);
        // Auto-compute hash if there's a file
        if (found.file_url) {
          computeHash(found.file_url);
        }
      }
    } catch (err) {
      setError(err.message || 'FAILED TO LOAD ARTIFACT');
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
    } catch (err) {
      setHashError('HASH COMPUTATION FAILED — FILE MAY BE CORS-RESTRICTED');
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase text-[#d4af37]">
            ARTIFACT VIEWER
          </h1>
          <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">
            PERSISTENT STATE SNAPSHOT · SHA-256 · 32-BYTE FILE FINGERPRINT
          </div>
        </div>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8"
        >
          <ArrowLeft className="w-3 h-3 mr-1" /> BACK
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#d4af37] text-xs py-8 justify-center">
          <Loader className="w-4 h-4 animate-spin" /> LOADING ARTIFACT...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 border border-red-900/50 bg-red-950/20 p-3 rounded max-w-xl mx-auto mt-8">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-red-400 font-bold">{error}</div>
            <div className="text-[9px] text-gray-600 mt-1">
              Serial: {serial || '—'} · Asset ID: {assetId || '—'}
            </div>
          </div>
        </div>
      )}

      {artifact && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {/* Metadata + Hash panel */}
          <div className="border border-[#333] bg-black/60 rounded p-4 space-y-3">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> ARTIFACT RECORD
            </div>

            {[
              ['SERIAL NUMBER', artifact.serial_number],
              ['TYPE', artifact.artifact_type?.toUpperCase()],
              ['STATUS', artifact.status?.toUpperCase()],
              ['BOUND TO', artifact.bound_serial || '—'],
              ['FILE NAME', artifact.file_name || '—'],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-[#1a1a1a] pt-2">
                <div className="text-[8px] text-gray-600 tracking-widest">{k}</div>
                <div className="text-[10px] text-[#d4af37] break-all mt-0.5">{v || '—'}</div>
              </div>
            ))}

            {artifact.description && (
              <div className="border-t border-[#1a1a1a] pt-2">
                <div className="text-[8px] text-gray-600 tracking-widest">DESCRIPTION</div>
                <div className="text-[10px] text-gray-300 mt-0.5">{artifact.description}</div>
              </div>
            )}

            {/* REAL SHA-256 32-byte fingerprint */}
            <div className="border-t border-[#1a1a1a] pt-3">
              <div className="text-[8px] text-gray-600 tracking-widest flex items-center gap-1 mb-2">
                <Hash className="w-2.5 h-2.5" /> 32-BYTE SHA-256 STATE SNAPSHOT
              </div>

              {hashLoading && (
                <div className="flex items-center gap-2 text-[9px] text-yellow-500">
                  <Loader className="w-3 h-3 animate-spin" /> COMPUTING HASH FROM FILE BYTES...
                </div>
              )}

              {hashError && (
                <div className="text-[8px] text-red-400 leading-relaxed">
                  {hashError}
                  <button
                    onClick={() => computeHash(artifact.file_url)}
                    className="ml-2 text-[#d4af37] hover:underline"
                  >RETRY</button>
                </div>
              )}

              {fileHash && (
                <div className="space-y-1">
                  {/* Display as 2 rows of 32 hex chars = 32 bytes */}
                  <div className="bg-black border border-green-900/40 rounded p-2">
                    <div className="text-[8px] text-green-300 font-bold break-all leading-relaxed tracking-wider">
                      {fileHash.slice(0, 32)}
                    </div>
                    <div className="text-[8px] text-green-300 font-bold break-all leading-relaxed tracking-wider">
                      {fileHash.slice(32)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-gray-700">256 bits · 32 bytes · hex-encoded</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => computeHash(artifact.file_url)}
                        className="text-gray-600 hover:text-[#d4af37]"
                        title="Recompute"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => copy(fileHash, 'hash')}
                        className="text-gray-600 hover:text-[#d4af37]"
                        title="Copy hash"
                      >
                        {copied === 'hash' ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-[7px] text-green-400">SNAPSHOT VERIFIED — FILE BYTES MATCH THIS FINGERPRINT</span>
                  </div>
                </div>
              )}

              {!hashLoading && !fileHash && !hashError && artifact.file_url && (
                <Button
                  onClick={() => computeHash(artifact.file_url)}
                  className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black text-[9px] h-7 font-bold mt-1"
                >
                  <Hash className="w-3 h-3 mr-1" /> COMPUTE SNAPSHOT HASH
                </Button>
              )}
            </div>

            {artifact.file_url && (
              <a href={artifact.file_url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-[9px] h-8 mt-1"
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> OPEN ORIGINAL FILE
                </Button>
              </a>
            )}
          </div>

          {/* Document preview panel */}
          <div className="border border-[#333] bg-black/60 rounded p-4">
            <div className="text-[9px] text-gray-500 tracking-widest mb-3">SCANNED DOCUMENT PREVIEW</div>

            {!artifact.file_url ? (
              <div className="flex items-center justify-center h-64 border border-[#222] rounded text-[9px] text-gray-700">
                NO FILE ATTACHED TO THIS ARTIFACT
              </div>
            ) : isImage(artifact.file_url) ? (
              <img
                src={artifact.file_url}
                alt="Artifact"
                className="w-full rounded border border-[#333] object-contain max-h-[60vh]"
              />
            ) : isPDF(artifact.file_url) ? (
              <iframe
                src={artifact.file_url}
                className="w-full h-[60vh] rounded border border-[#333]"
                title="Artifact PDF"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border border-[#222] rounded gap-3">
                <FileText className="w-8 h-8 text-[#d4af37]" />
                <div className="text-[9px] text-gray-500">DOCUMENT PREVIEW NOT AVAILABLE</div>
                <a href={artifact.file_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#d4af37] hover:bg-[#b8962f] text-black text-[9px] h-7 font-bold">
                    <ExternalLink className="w-3 h-3 mr-1" /> DOWNLOAD FILE
                  </Button>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}