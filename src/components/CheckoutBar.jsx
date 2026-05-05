"use client";
import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutBar({ items, onCheckout }) {
  const total = items.reduce((sum, item) => {
    const price = item.price * (1 - (item.discount || 0) / 100);
    return sum + price;
  }, 0);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      style={{
        position: 'fixed', 
        bottom: 'calc(32px + env(safe-area-inset-bottom))',
        left: 16, 
        right: 16,
        maxWidth: 500, 
        zIndex: 1000,
        background: 'rgba(10, 10, 26, 0.98)', 
        backdropFilter: 'blur(30px)',
        borderRadius: 24, 
        padding: '12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
          flexShrink: 0
        }}>
          <ShoppingCart size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9, color: '#6b6b8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Разом ({items.length})
          </div>
          <div style={{ fontSize: 20, fontWeight: 950, color: '#fff', lineHeight: 1 }}>
            {total.toFixed(0)}<span style={{ fontSize: 13, marginLeft: 2, color: '#ec4899' }}>₴</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        style={{
          padding: '10px 16px', 
          borderRadius: 16, 
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: '#fff', 
          fontWeight: 950, 
          fontSize: 14, 
          cursor: 'pointer',
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        className="active:scale-95"
      >
        <span>Оплатити</span>
        <ArrowRight size={16} strokeWidth={3} />
      </button>
    </motion.div>
  );
}
