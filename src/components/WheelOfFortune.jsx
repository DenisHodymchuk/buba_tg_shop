"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SECTORS = [
  { label: '10%', value: 0.1, color: '#4f46e5' },
  { label: '20%', value: 0.2, color: '#0f172a' },
  { label: '30%', value: 0.3, color: '#4f46e5' },
  { label: '50%', value: 0.5, color: '#0f172a' },
  { label: '70%', value: 0.7, color: '#4f46e5' },
  { label: '99%', value: 0.99, color: '#f59e0b' },
];

export default function WheelOfFortune({ onWin }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    
    // Minimum 5 full spins + random additional rotation
    const extraSpins = 5 + Math.random() * 5;
    const newRotation = rotation + extraSpins * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      // Calculate which sector stopped at the top (0 degrees)
      const actualRotation = newRotation % 360;
      const sectorIndex = Math.floor((360 - actualRotation) / (360 / SECTORS.length)) % SECTORS.length;
      const result = SECTORS[sectorIndex];
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#8b5cf6', '#f59e0b']
      });
      
      onWin(result);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center py-12 px-4 select-none">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Щасливе Колесо</h2>
        <p className="text-slate-500 text-sm">Випробуй удачу та отримай знижку на покупку!</p>
      </div>
      
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        {/* Outer Glow Ring */}
        <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Neon Border */}
        <div className="absolute -inset-2 border-4 border-indigo-500/30 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>

        {/* The Arrow / Indicator */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
           <div className="w-6 h-8 bg-white rounded-b-full shadow-lg relative after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-l-[12px] after:border-r-[12px] after:border-b-[16px] after:border-l-transparent after:border-r-transparent after:border-b-white"></div>
        </div>
        
        {/* The Wheel */}
        <motion.div 
          className="w-full h-full rounded-full border-[6px] border-slate-800 relative overflow-hidden shadow-2xl bg-slate-900"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.2, 0, 0.1, 1] }} // Custom cubic-bezier for smooth deceleration
          style={{ 
            background: `conic-gradient(${SECTORS.map((s, i) => `${s.color} ${i * (360/SECTORS.length)}deg ${(i+1) * (360/SECTORS.length)}deg`).join(', ')})`
          }}
        >
          {SECTORS.map((s, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 w-1 origin-bottom flex items-start justify-center pt-6"
              style={{ transform: `rotate(${i * (360/SECTORS.length) + (180/SECTORS.length)}deg)` }}
            >
              <span className="font-black text-white text-lg tracking-tighter transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                {s.label}
              </span>
            </div>
          ))}
          
          {/* Subtle separators */}
          {SECTORS.map((_, i) => (
            <div 
              key={`sep-${i}`}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-white/10"
              style={{ transform: `rotate(${i * (360/SECTORS.length)}deg)` }}
            ></div>
          ))}
        </motion.div>
        
        {/* Center Cap */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-950 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-2xl z-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent"></div>
          <div className="relative text-indigo-400 font-black text-xs">WIN</div>
        </div>
      </div>

      <button 
        onClick={spin}
        disabled={spinning}
        className={`mt-12 glass-button w-full max-w-xs h-16 text-lg font-black tracking-widest uppercase transition-all duration-300 ${
          spinning ? 'opacity-50 grayscale cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95 shadow-indigo-600/40'
        }`}
      >
        {spinning ? 'Крутимо...' : 'Запустити Удачу'}
      </button>
    </div>
  );
}
