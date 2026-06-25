import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function BulkIngestNavLink() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/bulk-ingest') return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/bulk-ingest')}
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 bg-black/90 border border-[#d4af37] text-[#d4af37] px-3 py-2 rounded-lg shadow-lg shadow-[#d4af37]/20 font-mono text-xs tracking-widest uppercase hover:bg-[#d4af37]/10 transition-colors"
      title="Bulk Artifact Ingestion"
    >
      <Layers className="w-4 h-4" />
      <span className="hidden sm:inline">Bulk Ingest</span>
    </motion.button>
  );
}