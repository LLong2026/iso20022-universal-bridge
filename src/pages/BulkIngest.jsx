import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BulkArtifactUploader from '@/components/console/BulkArtifactUploader';
import StatusBadge from '@/components/console/StatusBadge';

export default function BulkIngest() {
  const [batchSerials, setBatchSerials] = useState([]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-mono p-4 md:p-6 flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#d4af37] pb-4 mb-6 gap-4"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase">
            BULK ARTIFACT INGESTION
            <span className="text-xs text-gray-500 ml-2 tracking-normal">SCALING BENCHMARK</span>
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/">
            <StatusBadge label="CONSOLE" value="← BACK" variant="warning" />
          </Link>
          <StatusBadge label="MODE" value="BATCH" variant="success" />
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-grow">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <BulkArtifactUploader onBatchReady={(serials) => setBatchSerials(serials)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-[#111] border border-[#333] p-4 flex flex-col h-full">
            <div className="text-[#d4af37] border-b border-[#333] pb-2 mb-4 text-sm uppercase tracking-wider font-semibold">
              BATCH REGISTRY
            </div>
            <div className="flex-grow flex flex-col">
              {batchSerials.length === 0 ? (
                <p className="text-xs text-gray-600 font-mono">
                  Registered serials will appear here after a batch is processed. Use "Send Batch to Fractal Binding" to push them to the mint flow.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {batchSerials.map((s, i) => (
                    <div key={i} className="text-xs text-[#d4af37] font-mono break-all border border-[#333] bg-black/60 p-2 rounded">
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}