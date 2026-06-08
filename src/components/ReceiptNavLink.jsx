import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function ReceiptNavLink() {
  const { pathname } = useLocation();
  if (pathname === '/receipt') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-20 right-4 z-50"
    >
      <Link to="/receipt">
        <button className="flex items-center gap-1.5 bg-[#0d0d0d] border border-[#d4af37]/60
          text-[#d4af37] rounded-full px-3 py-2 text-[9px] font-bold tracking-widest uppercase
          shadow-lg hover:bg-[#d4af37] hover:text-black transition-all duration-150">
          <FileText className="w-3 h-3" />
          RECEIPT
        </button>
      </Link>
    </motion.div>
  );
}