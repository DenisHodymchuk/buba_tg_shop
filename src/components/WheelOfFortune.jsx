import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const SECTORS = [
  { label: '5%', value: 0.05, color: '#6366f1' },
  { label: '10%', value: 0.1, color: '#a855f7' },
  { label: '15%', value: 0.15, color: '#6366f1' },
  { label: '20%', value: 0.2, color: '#a855f7' },
  { label: 'БОНУС', value: 50, color: '#f59e0b' },
  { label: 'ХАЛЯВА', value: 1, color: '#10b981' },
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
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#f59e0b']
      });
      
      onWin(result);
    }, 3000);
  };

  return (
    <div className="wheel-section px-4 py-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-8 title-gradient text-center">Spin for a Discount!</h2>
      
      <div className="relative w-64 h-64 mb-10">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-8 bg-white z-10 clip-path-triangle shadow-lg"></div>
        
        <motion.div 
          className="w-full h-full rounded-full border-4 border-white/20 relative overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "easeOut" }}
          style={{ 
            background: `conic-gradient(${SECTORS.map((s, i) => `${s.color} ${i * (360/SECTORS.length)}deg ${(i+1) * (360/SECTORS.length)}deg`).join(', ')})`
          }}
        >
          {SECTORS.map((s, i) => (
            <div 
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full pointer-events-none"
              style={{ transform: `rotate(${i * (360/SECTORS.length) + (180/SECTORS.length)}deg)` }}
            >
              <span className="absolute top-8 left-1/2 -translate-x-1/2 font-bold text-white text-xs">{s.label}</span>
            </div>
          ))}
        </motion.div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl z-20">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold">GO</div>
        </div>
      </div>

      <button 
        onClick={spin}
        disabled={spinning}
        className={`glass-button w-full max-w-xs ${spinning ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {spinning ? 'Крутимо...' : 'Крутити Колесо!'}
      </button>
    </div>
  );
}
