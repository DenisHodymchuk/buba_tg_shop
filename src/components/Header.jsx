"use client";
import React from 'react';
import { ShoppingCart, Award, Search, Box, Clock } from 'lucide-react';

export default function Header({ cartCount, bonuses, onOpenCart, onOpenHistory, onSearch }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(5,5,15,0.8)', backdropFilter: 'blur(30px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      width: '100%',
    }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px' }}>
        
        {/* PC Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
            <Box className="text-white" size={24} />
          </div>
          <div className="hidden sm:block">
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>BUBA STORE</h1>
            <p style={{ fontSize: 8, color: '#7c3aed', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>Premium 3D Toys</p>
          </div>
        </div>

        {/* Desktop Search Bar (Centered) */}
        <div style={{ flex: 1, maxWidth: 500, margin: '0 40px' }} className="hidden md:block">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }} />
            <input 
              type="text" 
              placeholder="Яку іграшку шукаєте?..." 
              onChange={(e) => onSearch?.(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '12px 16px 12px 48px', fontSize: 14, color: '#fff', outline: 'none',
                transition: 'all 0.2s'
              }}
              className="focus:border-[#7c3aed]/50 focus:bg-white/[0.05]"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* History Button */}
          <button 
            onClick={onOpenHistory}
            style={{
              width: 48, height: 48, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
            }}
            className="hover:bg-white/[0.05] active:scale-95"
          >
            <Clock size={20} />
          </button>

          {/* Balance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 14 }}>
            <Award size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>{bonuses}</span>
          </div>
          
          {/* Cart Button */}
          <button 
            onClick={onOpenCart}
            style={{
              width: 48, height: 48, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, #161630, #0a0a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
            }}
            className="hover:scale-105 active:scale-95"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: '50%',
                fontSize: 10, fontWeight: 900, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #05050f'
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search (Only visible on small screens) */}
      <div className="md:hidden" style={{ padding: '0 24px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }} />
          <input 
            type="text" 
            placeholder="Пошук іграшок..."
            onChange={(e) => onSearch?.(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px 14px 12px 42px', fontSize: 14, color: '#fff', outline: 'none',
            }}
          />
        </div>
      </div>
    </header>
  );
}
