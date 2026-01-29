import React, { useState, useEffect, useRef } from 'react';
import Panel from './Panel';

export default function GlobalUplink() {
  const [latency, setLatency] = useState(42);
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    // Jitter the latency
    const latencyInterval = setInterval(() => {
      const lat = Math.floor(Math.random() * (55 - 35 + 1) + 35);
      setLatency(lat);
    }, 1000);

    return () => clearInterval(latencyInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const drawWave = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      
      for (let i = 0; i < canvas.width; i++) {
        const y = (canvas.height / 2) + 
                  Math.sin((i + offsetRef.current) * 0.1) * 10 + 
                  Math.sin((i + offsetRef.current * 2) * 0.05) * 5;
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      offsetRef.current += 5;
      animationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Panel title="7. GLOBAL UPLINK TELEMETRY">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">SAT-LINK (LEO):</span>
          <span className="text-cyan-400 font-mono">CONNECTED (STARLINK/IRIDIUM)</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">LATENCY:</span>
          <span className="text-gray-300 font-mono">{latency}ms</span>
        </div>

        <div className="flex justify-between items-center text-xs pt-2">
          <span className="text-gray-500">RF BACKUP (MESH):</span>
          <span className="text-[#d4af37] font-mono">ACTIVE (915 MHz)</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">PROTOCOL:</span>
          <span className="text-gray-300 font-mono">FHSS (FREQ HOPPING)</span>
        </div>

        <div className="relative border border-[#333] bg-black h-[50px] overflow-hidden mt-2">
          <canvas ref={canvasRef} width={300} height={50} className="w-full h-full" />
          <div className="absolute top-0.5 right-0.5 text-[8px] text-green-400">
            SIGNAL: -85 dBm
          </div>
        </div>
      </div>
    </Panel>
  );
}