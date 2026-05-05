"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Award, Search } from 'lucide-react';
import Link from 'next/link';

export default function Header({ cartCount, bonuses, onOpenCart }) {
  const [timeLeft, setTimeLeft] = useState('54:44');

  return (
    <header className="bg-[#0a0a0a] flex flex-col space-y-4 px-4 pt-6 pb-4 border-b border-white/[0.05]">
      {/* Top Row: User Greeting & Main Actions */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Привіт, Гість</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Telegram DH-3D-Store</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Balance */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/[0.05] pl-2 pr-3 py-1.5 rounded-full shadow-lg">
             <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-amber-950 font-black text-[10px]">
               <Award size={12} />
             </div>
             <span className="font-black text-xs text-white">{bonuses}</span>
          </div>
          
          {/* Cart */}
          <button 
            onClick={onOpenCart}
            className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/[0.05] flex items-center justify-center text-slate-300 relative hover:bg-white/5 transition-colors"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-[9px] flex items-center justify-center font-black text-white shadow-lg">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Timer Row - Centered and clear */}
      <div className="flex flex-col items-center py-2">
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Знижка 10% діє ще:</span>
         <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-emerald-400 font-black text-xl tracking-widest tabular-nums">
           {timeLeft}
         </div>
      </div>

      {/* Search Row - Fully separate */}
      <div className="relative group w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        <input 
          type="text" 
          placeholder="Пошук товарів за назвою..."
          className="w-full bg-[#141414] border border-white/[0.03] rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-700"
        />
      </div>

      {/* Categories Row - Scrollable and clean */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        <CategoryBtn label="Всі" active />
        <CategoryBtn label="Світильники" />
        <CategoryBtn label="Іграшки" />
        <CategoryBtn label="Підставки" />
        <CategoryBtn label="Статуетки" />
      </div>
    </header>
  );
}

function CategoryBtn({ label, active }) {
  return (
    <button className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-[11px] transition-all border ${
      active 
      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' 
      : 'bg-[#1a1a1a] text-slate-500 border-white/[0.03] hover:text-slate-300'
    }`}>
      {label}
    </button>
  );
}
