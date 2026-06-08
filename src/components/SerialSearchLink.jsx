import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SerialSearchLink() {
  const { pathname } = useLocation();
  if (pathname === '/serial-search') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <Link to="/serial-search">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-[#0a0a0a] border border-[#d4af37]/60 text-[#d4af37] text-[10px] font-mono tracking-widest px-3 py-2 rounded shadow-lg hover:border-[#d4af37] hover:bg-[#111] transition-colors"
        >
          <Search className="w-3 h-3" />
          SERIAL LOOKUP
        </motion.button>
      </Link>
    </motion.div>
  );
}