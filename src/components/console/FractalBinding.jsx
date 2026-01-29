import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Panel from './Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap } from 'lucide-react';

export default function FractalBinding({ onMint, lastHash }) {
  const [serial, setSerial] = useState('TX-GOLD-001');
  const [weight, setWeight] = useState('1000.00');
  const [isBinding, setIsBinding] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const drawSpongeEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let frame = 0;
    const maxFrames = 25;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      for (let j = 0; j < 15; j++) {
        ctx.fillStyle = Math.random() > 0.4 ? '#d4af37' : '#1a1a1a';
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 6 + 1;
        ctx.fillRect(x, y, size, size);
      }

      // Add some connecting lines for fractal effect
      if (frame % 3 === 0) {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
      }

      frame++;
      if (frame < maxFrames) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const handleMint = () => {
    if (!serial || !weight) return;
    
    setIsBinding(true);
    drawSpongeEffect();
    
    setTimeout(() => {
      onMint(serial, parseFloat(weight));
      setIsBinding(false);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Panel title="1. FRACTAL BINDING (MINT)">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">SERIAL NO.</label>
          <Input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-9"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">WEIGHT (GRAMS)</label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="bg-black border-[#444] text-[#d4af37] font-mono text-sm h-9"
          />
        </div>

        <Button
          onClick={handleMint}
          disabled={isBinding}
          className="w-full bg-[#d4af37] hover:bg-[#b8962f] text-black font-bold uppercase tracking-wider h-10"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isBinding ? 'BINDING...' : 'BIND ASSET (MINT)'}
        </Button>

        {/* Hash Display */}
        <motion.div 
          className="text-[10px] text-gray-500 break-all border border-dashed border-[#333] p-2 min-h-[50px] bg-black/50"
          animate={lastHash ? { borderColor: ['#333', '#d4af37', '#333'] } : {}}
          transition={{ duration: 1 }}
        >
          {lastHash ? (
            <>
              <span className="text-[#d4af37]">BINDING HASH (586-BIT):</span>
              <br />
              {lastHash}
            </>
          ) : (
            'WAITING FOR INPUT...'
          )}
        </motion.div>

        {/* Sponge Visualizer */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">SPONGE-586 VISUALIZER</label>
          <canvas
            ref={canvasRef}
            width={280}
            height={80}
            className="w-full h-20 bg-[#050505] border border-[#333]"
          />
        </div>
      </div>
    </Panel>
  );
}