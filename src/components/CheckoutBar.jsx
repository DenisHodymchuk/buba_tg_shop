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
        bottom: 12, // Трохи вище для мобільних
        left: '50%', 
        transform: 'translateX(-50%)',
        width: '94%', 
        maxWidth: 500, 
        zIndex: 1000,
        background: '#0a0a1a', 
        borderRadius: 28, 
        padding: '12px 14px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 6 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'rgba(124, 58, 237, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed'
        }}>
          <ShoppingCart size={24} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: -2 }}>
            В кошику ({items.length})
          </div>
          <div style={{ fontSize: 26, fontWeight: 950, color: '#fff', lineHeight: 1 }}>
            {total.toFixed(0)}<span style={{ fontSize: 16, marginLeft: 2, color: '#ec4899' }}>₴</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        style={{
          padding: '14px 28px', 
          borderRadius: 22, 
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: '#fff', 
          fontWeight: 950, 
          fontSize: 16, 
          cursor: 'pointer',
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
          transition: 'all 0.2s'
        }}
        className="active:scale-95"
      >
        Оплатити
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </motion.div>
  );
}
