import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Layers, ShieldCheck, Zap, Globe, Lock, Network, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowItWorks = ({ open, onClose }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-[#05070a] p-8 shadow-[0_0_60px_-15px_rgba(16,185,129,0.5)]"
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-2xl font-bold text-white">How It Works</h2>
          <p className="mt-1 text-sm text-slate-400">The 8-step Universal Bridge settlement pipeline.</p>
          <div className="mt-6 space-y-3">
            {[
              { n: "01", t: "Normalize", d: "Standardize any instruction — JSON or ISO 20022 XML — into a universal schema." },
              { n: "02", t: "Seed", d: "Generate a deterministic seed with a cryptographic hash binding the intent." },
              { n: "03", t: "Tokenize", d: "Anchor the seed to a Satoshi UTXO via Taproot tweaking." },
              { n: "04", t: "Filter Rails", d: "Discard rails that fail currency, amount, or regulatory-tier constraints." },
              { n: "05", t: "Evaluate", d: "Score surviving rails against priority-weighted cost, speed, liquidity, finality." },
              { n: "06", t: "Select", d: "Deterministically pick the highest-scoring rail for the instruction." },
              { n: "07", t: "Execute Lifecycle", d: "Run the rail-specific handler to broadcast and settle the transaction." },
              { n: "08", t: "Receipt", d: "Emit an immutable universal receipt and log the settlement to the ledger." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <span className="font-mono text-emerald-400 font-bold">{s.n}</span>
                <div>
                  <p className="font-semibold text-white">{s.t}</p>
                  <p className="text-sm text-slate-400">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const WhyBuild = ({ open, onClose }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#05070a] p-8 shadow-[0_0_60px_-15px_rgba(34,211,238,0.5)]"
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-2xl font-bold text-white">Why Build This</h2>
          <p className="mt-1 text-sm text-slate-400">Bridging DeFi primitives with central-bank-grade settlement.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Network, t: "Multi-Rail Interop", d: "One instruction, many rails — XRP, Lightning, SWIFT, FedNow — selected deterministically." },
              { icon: ShieldCheck, t: "ISO 20022 Native", d: "Speaks the global financial messaging standard out of the box." },
              { icon: Lock, t: "Satoshi Targeting", d: "Real-world assets anchored to Bitcoin UTXOs via Taproot tweaking." },
              { icon: Zap, t: "Sub-Second Finality", d: "Deterministic routing settles high-value transfers in milliseconds." },
              { icon: Globe, t: "Sovereign-Grade", d: "Counterparty tiers from retail to central bank, enforced at the rail layer." },
              { icon: Cpu, t: "Agentic Oversight", d: "Six production AI agents guard integrity, ledger, lifecycle, identity, risk, and mint." },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <f.icon className="h-6 w-6 text-cyan-400" />
                <p className="mt-2 font-semibold text-white">{f.t}</p>
                <p className="text-sm text-slate-400">{f.d}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function Cover() {
  const navigate = useNavigate();
  const [howOpen, setHowOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070a] text-white">
      {/* ambient grid + glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(16,185,129,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.4)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 uppercase">
            <Layers className="h-3.5 w-3.5" />
            ISO 20022 · XRP · Taproot
          </div>

          <h1 className="font-heading text-5xl sm:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-emerald-300 via-white to-cyan-300 bg-clip-text text-transparent">
              ISO20022
            </span>
            <br />
            <span className="text-white">Universal Bridge</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-slate-400">
            A demonstration platform bridging DeFi and central banking — deterministic
            multi-rail settlement anchored by Satoshi Targeting and Taproot Tweaking.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setHowOpen(true)}
              className="border-emerald-500/40 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/15 hover:text-emerald-100"
            >
              How it works
            </Button>
            <Button
              variant="outline"
              onClick={() => setWhyOpen(true)}
              className="border-cyan-500/40 bg-cyan-500/5 text-cyan-200 hover:bg-cyan-500/15 hover:text-cyan-100"
            >
              Why build this
            </Button>
          </div>

          <motion.div
            className="mt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => {
                sessionStorage.setItem("jasper_cover_seen", "1");
                navigate("/claim-artifacts");
              }}
              className="group bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-[0_0_40px_-10px_rgba(16,185,129,0.7)]"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="mt-3 text-xs text-slate-500">Continues to DID Claim →</p>
          </motion.div>
        </motion.div>
      </div>

      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
      <WhyBuild open={whyOpen} onClose={() => setWhyOpen(false)} />
    </div>
  );
}