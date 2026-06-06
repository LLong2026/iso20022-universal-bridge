import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle, Loader } from 'lucide-react';

const ARTIFACT_TYPES = [
  { value: 'gold_bar',      label: 'Gold Bar' },
  { value: 'coin',          label: 'Coin' },
  { value: 'bullion',       label: 'Bullion' },
  { value: 'certificate',   label: 'Certificate' },
  { value: 'deed',          label: 'Deed' },
  { value: 'bond',          label: 'Bond' },
  { value: 'commodity',     label: 'Commodity' },
  { value: 'digital_asset', label: 'Digital Asset' },
  { value: 'other',         label: 'Other' },
];

function generateSerial(type) {
  const prefix = type ? type.toUpperCase().slice(0, 3) : 'ART';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export default function ArtifactUploader({ onArtifactReady }) {
  const [artifactType, setArtifactType] = useState('');
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(null); // { serial_number, id }

  const handleTypeChange = (val) => {
    setArtifactType(val);
    setSaved(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setSaved(null);
  };

  const handleRegister = async () => {
    if (!artifactType) return;
    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrl = file_url;
        fileName = file.name;
      }

      const serial = generateSerial(artifactType);
      const artifact = await base44.entities.Artifact.create({
        serial_number: serial,
        artifact_type: artifactType,
        file_url: fileUrl,
        file_name: fileName,
        description,
        status: 'pending',
      });

      setSaved({ serial_number: serial, id: artifact.id });
      if (onArtifactReady) onArtifactReady(serial);
    } catch (err) {
      console.error('Artifact registration error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSendToMint = () => {
    if (saved && onArtifactReady) onArtifactReady(saved.serial_number);
  };

  return (
    <Panel title="0. ARTIFACT REGISTRATION">
      <div className="space-y-3">
        {/* Type selector */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">ARTIFACT TYPE</label>
          <Select value={artifactType} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-9">
              <SelectValue placeholder="SELECT TYPE..." />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#333] text-[#d4af37] font-mono">
              {ARTIFACT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="hover:bg-[#1a1a1a]">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">UPLOAD DOCUMENT / IMAGE</label>
          <label className="flex items-center gap-2 cursor-pointer border border-[#444] bg-black p-2 rounded text-xs text-gray-400 hover:border-[#d4af37] transition-colors">
            <Upload className="w-3 h-3 text-[#d4af37]" />
            <span className="truncate">{file ? file.name : 'CHOOSE FILE (OPTIONAL)'}</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">NOTES (OPTIONAL)</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 1kg Swiss bar, lot #4421"
            className="bg-black border-[#444] text-[#d4af37] font-mono text-xs h-9"
          />
        </div>

        {/* Register button */}
        <Button
          onClick={handleRegister}
          disabled={!artifactType || uploading}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10"
        >
          {uploading ? (
            <><Loader className="w-4 h-4 mr-2 animate-spin" />REGISTERING...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />REGISTER ARTIFACT</>
          )}
        </Button>

        {/* Serial result */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#d4af37]/50 bg-black/60 p-2 rounded space-y-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400 tracking-widest">ARTIFACT REGISTERED</span>
            </div>
            <div className="text-[10px] text-gray-500">SERIAL NO.</div>
            <div className="text-xs text-[#d4af37] font-bold tracking-wider break-all">{saved.serial_number}</div>
            <Button
              onClick={handleSendToMint}
              size="sm"
              className="w-full h-8 bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 text-[10px] tracking-widest"
            >
              → SEND TO FRACTAL BINDING
            </Button>
          </motion.div>
        )}
      </div>
    </Panel>
  );
}