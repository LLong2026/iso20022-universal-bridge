import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck } from 'lucide-react';

export default function ReceiptNavLink() {
  const { pathname } = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-1.5"
    >
      {pathname !== '/receipt' && (
        <Link to="/receipt">
          <button className="flex items-center gap-1.5 bg-[#0d0d0d] border border-[#d4af37]/60
            text-[#d4af37] rounded-full px-3 py-2 text-[9px] font-bold tracking-widest uppercase
            shadow-lg hover:bg-[#d4af37] hover:text-black transition-all duration-150">
            <FileText className="w-3 h-3" />
            RECEIPT
          </button>
        </Link>
      )}
      {pathname !== '/claim-artifacts' && (
        <Link to="/claim-artifacts">
          <button className="flex items-center gap-1.5 bg-[#0d0d0d] border border-[#d4af37]/40
            text-[#d4af37]/80 rounded-full px-3 py-2 text-[9px] font-bold tracking-widest uppercase
            shadow-lg hover:bg-[#d4af37] hover:text-black transition-all duration-150">
            <ShieldCheck className="w-3 h-3" />
            CLAIM DID
          </button>
        </Link>
      )}
    </motion.div>
  );
}