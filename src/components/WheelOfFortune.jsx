"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SECTORS = [
  { label: '10%', value: 0.1, color: '#7c3aed' },
  { label: '15%', value: 0.15, color: '#1e1e40' },
  { label: '20%', value: 0.2, color: '#ec4899' },
  { label: '30%', value: 0.3, color: '#1e1e40' },
  { label: '50%', value: 0.5, color: '#7c3aed' },
  { label: '99%', value: 0.99, color: '#f97316' },
];

export default function WheelOfFortune({ onWin }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    
    const extraSpins = 5 + Math.random() * 5;
    const newRotation = rotation + extraSpins * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const actualRotation = newRotation % 360;
      const sectorIndex = Math.floor((360 - actualRotation) / (360 / SECTORS.length)) % SECTORS.length;
      const result = SECTORS[sectorIndex];
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#7c3aed', '#ec4899', '#f97316', '#fbbf24']
      });
      
      onWin(result);
    }, 4000);
  };

  return (
    <section className="flex flex-col items-center py-12 px-4 select-none">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-1">🎡 Колесо Фортуни</h2>
        <p className="text-[#6b6b8a] text-xs font-bold">Крутіть та отримуйте знижки!</p>
      </div>
      
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        {/* Cosmic Glow */}
        <div className="absolute -inset-6 bg-gradient-to-r from-[#7c3aed]/20 via-[#ec4899]/15 to-[#f97316]/20 rounded-full blur-3xl cosmic-pulse"></div>
        
        {/* Outer Ring */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316] p-[3px]">
          <div className="w-full h-full rounded-full bg-[#0a0a1a]"></div>
        </div>

        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg"></div>
        </div>
        
        {/* Wheel */}
        <motion.div 
          className="w-full h-full rounded-full border-2 border-white/10 relative overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.2, 0, 0.1, 1] }}
          style={{ 
            background: `conic-gradient(${SECTORS.map((s, i) => `${s.color} ${i * (360/SECTORS.length)}deg ${(i+1) * (360/SECTORS.length)}deg`).join(', ')})`
          }}
        >
          {SECTORS.map((s, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 w-px origin-bottom flex items-start justify-center pt-5"
              style={{ transform: `rotate(${i * (360/SECTORS.length) + (180/SECTORS.length)}deg)` }}
            >
              <span className="font-black text-white text-sm drop-shadow-lg" style={{ transform: 'rotate(180deg)', writingMode: 'vertical-rl' }}>
                {s.label}
              </span>
            </div>
          ))}
          
          {SECTORS.map((_, i) => (
            <div 
              key={`sep-${i}`}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white/10"
              style={{ transform: `rotate(${i * (360/SECTORS.length)}deg)` }}
            ></div>
          ))}
        </motion.div>
        
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center shadow-2xl z-20 border-2 border-white/20">
          <span className="text-white font-black text-[10px] uppercase tracking-tight">WIN</span>
        </div>
      </div>

      <button 
        onClick={spin}
        disabled={spinning}
        className={`mt-10 btn-gradient w-full max-w-xs py-4 text-sm font-black uppercase tracking-[0.15em] transition-all ${
          spinning ? 'opacity-50 grayscale cursor-not-allowed scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {spinning ? 'Крутимо... ✨' : 'Крутити Колесо'}
      </button>
    </section>
  );
}
