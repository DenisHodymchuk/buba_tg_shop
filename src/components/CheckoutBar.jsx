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
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 500, zIndex: 1000,
        background: 'rgba(15, 15, 35, 0.85)', backdropFilter: 'blur(20px)',
        borderRadius: 24, padding: '16px 20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(124, 58, 237, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed'
        }}>
          <ShoppingCart size={24} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            В кошику ({items.length})
          </div>
          <div style={{ fontSize: 24, fontWeight: 950, color: '#fff', lineHeight: 1 }}>
            {total.toFixed(0)}<span style={{ fontSize: 14, marginLeft: 2, color: '#ec4899' }}>₴</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        style={{
          padding: '12px 24px', borderRadius: 18, border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
          transition: 'all 0.2s'
        }}
        className="active:scale-95"
      >
        Оплатити
        <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}
