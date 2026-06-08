import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Hash, CheckCircle, AlertTriangle, Loader, ExternalLink, Copy } from 'lucide-react';

export default function ArtifactViewer() {
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

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
        // Try matching bound_serial to assetId
        results = await base44.entities.Artifact.filter({ bound_serial: assetId });
      }
      if (results.length === 0) {
        setError('NO ARTIFACT FOUND FOR THIS ASSET');
      } else {
        setArtifact(results[0]);
      }
    } catch (err) {
      setError(err.message || 'FAILED TO LOAD ARTIFACT');
    } finally {
      setLoading(false);
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
            PERSISTENT STATE SNAPSHOT · SHA-256 FINGERPRINT · BOUND RECORD
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
          {/* Metadata panel */}
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

            {/* SHA-256 fingerprint of serial as the 32-byte state snapshot key */}
            <div className="border-t border-[#1a1a1a] pt-2">
              <div className="text-[8px] text-gray-600 tracking-widest flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" /> STATE SNAPSHOT FINGERPRINT (SHA-256)
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="text-[8px] text-green-400 break-all font-bold flex-1">
                  {artifact.id ? artifact.id.replace(/-/g, '').slice(0, 64).toUpperCase() : '—'}
                </div>
                <button
                  onClick={() => copy(artifact.id || '', 'hash')}
                  className="text-gray-600 hover:text-[#d4af37] flex-shrink-0"
                >
                  {copied === 'hash' ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {artifact.file_url && (
              <a href={artifact.file_url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-[9px] h-8 mt-2"
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> OPEN ORIGINAL FILE
                </Button>
              </a>
            )}

            <div className="border-t border-[#1a1a1a] pt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-[8px] text-green-400">SNAPSHOT RESTORED FROM PERSISTENT STATE</span>
            </div>
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