import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, FileText, ShieldCheck, Search } from 'lucide-react';

const links = [
  { to: '/bind',            label: 'BIND',          icon: Zap,         hideOn: '/bind' },
  { to: '/receipt',         label: 'RECEIPT',        icon: FileText,    hideOn: '/receipt' },
  { to: '/claim-artifacts', label: 'CLAIM DID',      icon: ShieldCheck, hideOn: '/claim-artifacts' },
  { to: '/serial-search',   label: 'SERIAL LOOKUP',  icon: Search,      hideOn: '/serial-search' },
];

export default function SecondaryNavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex items-center gap-1
      bg-[#0d0d0d] border border-[#d4af37]/40 rounded-full px-3 py-2 shadow-xl shadow-black/60
      backdrop-blur-sm"
      style={{ transform: 'translateX(calc(-50% + 220px))' }}
    >
      {links.map(({ to, label, icon: Icon, hideOn }) => {
        if (pathname === hideOn) return null;
        const active = pathname === to;
        return (
          <Link key={to} to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest
              uppercase transition-all duration-150
              ${active
                ? 'bg-[#d4af37] text-black shadow shadow-[#d4af37]/30'
                : 'text-gray-500 hover:text-[#d4af37]'}`}>
            <Icon className="w-3 h-3" />{label}
          </Link>
        );
      })}
    </nav>
  );
}