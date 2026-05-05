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
        bottom: 24, // Збільшено відступ знизу
        left: '50%', 
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', // Динамічна ширина
        maxWidth: 500, 
        zIndex: 1000,
        background: 'rgba(10, 10, 26, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderRadius: 24, 
        padding: '12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
          flexShrink: 0
        }}>
          <ShoppingCart size={22} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            Кошик ({items.length})
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, color: '#fff', lineHeight: 1, whiteSpace: 'nowrap' }}>
            {total.toFixed(0)}<span style={{ fontSize: 14, marginLeft: 2, color: '#ec4899' }}>₴</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        style={{
          padding: '12px 24px', 
          borderRadius: 18, 
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: '#fff', 
          fontWeight: 950, 
          fontSize: 15, 
          cursor: 'pointer',
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        className="active:scale-95"
      >
        <span>Оплатити</span>
        <ArrowRight size={18} strokeWidth={3} />
      </button>
    </motion.div>
  );
}
