import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle, AlertTriangle, Loader, Copy } from 'lucide-react';

export default function SerialSearch() {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [goldAsset, setGoldAsset] = useState(null);
  const [assetRecord, setAssetRecord] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    if (!serial.trim()) return;
    setLoading(true);
    setError(null);
    setGoldAsset(null);
    setAssetRecord(null);

    try {
      const [goldResults, recordResults] = await Promise.all([
        base44.entities.GoldAsset.filter({ serial_number: serial.trim() }),
        base44.entities.AssetRecord.filter({ asset_id: serial.trim() }),
      ]);

      if (goldResults.length > 0) setGoldAsset(goldResults[0]);
      if (recordResults.length > 0) setAssetRecord(recordResults[0]);

      if (goldResults.length === 0 && recordResults.length === 0) {
        setError('No asset found with that serial number or asset ID.');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const Row = ({ label, value }) => value ? (
    <div className="flex justify-between text-[9px] border-t border-[#1a1a1a] pt-1 mt-1">
      <span className="text-gray-600">{label}</span>
      <span className="text-[#d4af37] text-right max-w-[60%] break-all">{value}</span>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#d4af37] pb-4 mb-6">
          <div>
            <h1 className="text-lg font-bold tracking-[0.15em] uppercase text-[#d4af37]">SERIAL LOOKUP</h1>
            <div className="text-[10px] text-gray-600 mt-0.5 tracking-wider">SEARCH BY SERIAL NUMBER OR ASSET ID</div>
          </div>
          <Link to="/vault">
            <Button variant="outline" className="border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37] text-xs h-8">
              <ArrowLeft className="w-3 h-3 mr-1" /> VAULT
            </Button>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <Input
            value={serial}
            onChange={e => setSerial(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. OTH-MQ4L92E5-FQAJ or RWA-..."
            className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-11 flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !serial.trim()}
            className="bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold h-11 px-5">
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 border border-red-900/50 bg-red-950/20 p-3 rounded mb-4">
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-[9px] text-red-400">{error}</span>
          </div>
        )}

        {/* GoldAsset result */}
        {goldAsset && (
          <div className="border border-[#d4af37]/40 bg-black/60 rounded p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[10px] text-green-400 tracking-widest font-bold">GOLD ASSET FOUND</span>
            </div>
            <Row label="SERIAL NUMBER" value={goldAsset.serial_number} />
            <Row label="WEIGHT" value={goldAsset.weight_grams ? `${goldAsset.weight_grams}g` : null} />
            <Row label="STATUS" value={goldAsset.status?.toUpperCase()} />
            <Row label="SATOSHI UTXO" value={goldAsset.satoshi_utxo} />
            <Row label="MINTED" value={goldAsset.mint_timestamp ? new Date(goldAsset.mint_timestamp).toLocaleString() : null} />
            <Row label="BINDING HASH" value={goldAsset.binding_hash?.slice(0, 32) + '...'} />
          </div>
        )}

        {/* AssetRecord result */}
        {assetRecord && (
          <div className="border border-[#d4af37]/40 bg-black/60 rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-[10px] text-green-400 tracking-widest font-bold">RWA ASSET RECORD FOUND</span>
              </div>
              <button onClick={() => copy(assetRecord.asset_id)}
                className="text-gray-600 hover:text-[#d4af37] flex items-center gap-1 text-[8px]">
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                COPY ID
              </button>
            </div>
            <Row label="ASSET ID" value={assetRecord.asset_id} />
            <Row label="TYPE" value={assetRecord.asset_type?.toUpperCase()} />
            <Row label="WEIGHT" value={assetRecord.weight ? `${assetRecord.weight}g` : null} />
            <Row label="PURITY" value={assetRecord.purity} />
            <Row label="STATUS" value={assetRecord.current_status?.toUpperCase()} />
            <Row label="ENCRYPTED" value={assetRecord.is_encrypted ? 'YES (JASPER AES-256)' : 'NO'} />
            <Row label="VAULT" value={assetRecord.vault_location} />
            <Row label="OWNER DID" value={assetRecord.owner_did?.slice(0, 30) + '...'} />

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
              <Link to={`/vault`} className="flex-1">
                <Button size="sm" variant="outline"
                  onClick={() => sessionStorage.setItem('vault_asset_id', assetRecord.asset_id)}
                  className="w-full h-8 text-[9px] border-[#333] text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37]">
                  → OPEN IN VAULT
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!goldAsset && !assetRecord && !error && !loading && (
          <div className="text-center text-[10px] text-gray-700 py-8 tracking-widest">
            ENTER A SERIAL NUMBER OR ASSET ID TO SEARCH
          </div>
        )}
      </div>
    </div>
  );
}