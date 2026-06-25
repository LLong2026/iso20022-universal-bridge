import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, Loader, X, FileStack, AlertTriangle, Copy, Check } from 'lucide-react';

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

const STATUS = {
  queued:      { label: 'QUEUED',      color: 'text-gray-500', icon: FileStack },
  uploading:   { label: 'UPLOADING',   color: 'text-blue-400', icon: Loader },
  registered:  { label: 'REGISTERED',  color: 'text-green-400', icon: CheckCircle },
  failed:      { label: 'FAILED',      color: 'text-red-400',  icon: AlertTriangle },
};

export default function BulkArtifactUploader({ onBatchReady }) {
  const [artifactType, setArtifactType] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]); // { id, file, status, serial, error }
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const idCounter = useRef(0);

  const addFiles = (fileList) => {
    const newItems = Array.from(fileList).map(file => ({
      id: ++idCounter.current,
      file,
      status: 'queued',
      serial: null,
      error: null,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleFilePick = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearAll = () => {
    if (processing) return;
    setItems([]);
  };

  const updateItem = (id, patch) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  };

  const processQueue = async () => {
    if (!artifactType || processing) return;
    setProcessing(true);
    const queue = items.filter(i => i.status === 'queued' || i.status === 'failed');
    for (const item of queue) {
      updateItem(item.id, { status: 'uploading', error: null });
      try {
        let fileUrl = null;
        let fileName = null;
        if (item.file) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
          fileUrl = file_url;
          fileName = item.file.name;
        }
        const serial = generateSerial(artifactType);
        await base44.entities.Artifact.create({
          serial_number: serial,
          artifact_type: artifactType,
          file_url: fileUrl,
          file_name: fileName,
          description,
          status: 'pending',
        });
        updateItem(item.id, { status: 'registered', serial });
      } catch (err) {
        updateItem(item.id, { status: 'failed', error: err?.response?.data?.error || err?.message || 'Unknown error' });
      }
    }
    setProcessing(false);
  };

  const registered = items.filter(i => i.status === 'registered');
  const failed = items.filter(i => i.status === 'failed');
  const done = registered.length + failed.length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  const copySerials = () => {
    const text = registered.map(i => i.serial).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sendBatch = () => {
    if (onBatchReady) onBatchReady(registered.map(i => i.serial));
  };

  return (
    <Panel title="0. BULK ARTIFACT INGESTION">
      <div className="space-y-3">
        {/* Type + description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ARTIFACT TYPE (ALL)</label>
            <Select value={artifactType} onValueChange={setArtifactType} disabled={processing}>
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">NOTES (APPLIES TO ALL)</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. benchmark batch 06-25"
              disabled={processing}
              className="bg-black border-[#444] text-[#d4af37] font-mono text-xs h-9"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed p-4 rounded text-center cursor-pointer transition-colors ${
            dragOver ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-[#444] hover:border-[#d4af37]'
          }`}
        >
          <FileStack className="w-6 h-6 text-[#d4af37] mx-auto mb-1" />
          <p className="text-xs text-gray-400 font-mono">DROP FILES HERE OR CLICK TO SELECT</p>
          <p className="text-[10px] text-gray-600 font-mono mt-1">MULTIPLE FILES SUPPORTED</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>{done} / {items.length} PROCESSED</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-[#222] rounded overflow-hidden">
              <motion.div
                className="h-full bg-[#d4af37]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* File list */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
          <AnimatePresence initial={false}>
            {items.map(item => {
              const s = STATUS[item.status];
              const Icon = s.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-2 border border-[#333] bg-black/60 p-2 rounded text-xs"
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${s.color} ${item.status === 'uploading' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-gray-300 font-mono">{item.file?.name || 'NO FILE'}</div>
                    {item.serial && (
                      <div className="text-[10px] text-[#d4af37] font-mono truncate">{item.serial}</div>
                    )}
                    {item.error && (
                      <div className="text-[10px] text-red-400 font-mono truncate">{item.error}</div>
                    )}
                  </div>
                  <span className={`text-[9px] font-mono tracking-wider ${s.color}`}>{s.label}</span>
                  {!processing && (
                    <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={processQueue}
            disabled={!artifactType || items.length === 0 || processing || !items.some(i => i.status === 'queued' || i.status === 'failed')}
            className="flex-1 bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10"
          >
            {processing ? (
              <><Loader className="w-4 h-4 mr-2 animate-spin" />PROCESSING...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />REGISTER ALL ({items.filter(i => i.status === 'queued' || i.status === 'failed').length})</>
            )}
          </Button>
          {items.length > 0 && !processing && (
            <Button
              onClick={clearAll}
              variant="outline"
              className="h-10 border-[#444] text-gray-400 hover:text-red-400"
            >
              CLEAR
            </Button>
          )}
        </div>

        {/* Batch summary + actions */}
        {registered.length > 0 && !processing && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#d4af37]/50 bg-black/60 p-2 rounded space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 tracking-widest">{registered.length} ARTIFACTS REGISTERED</span>
              </div>
              <button onClick={copySerials} className="text-[10px] text-gray-400 hover:text-[#d4af37] flex items-center gap-1 font-mono">
                {copied ? <><Check className="w-3 h-3" /> COPIED</> : <><Copy className="w-3 h-3" /> COPY SERIALS</>}
              </button>
            </div>
            {onBatchReady && (
              <Button
                onClick={sendBatch}
                size="sm"
                className="w-full h-8 bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 text-[10px] tracking-widest"
              >
                → SEND BATCH TO FRACTAL BINDING
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </Panel>
  );
}