"use client";
import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutBar({ items, onCheckout }) {
  const total = items.reduce((sum, item) => {
    const price = item.price * (1 - (item.discount || 0) / 100);
    return sum + price * (item.quantity || 1);
  }, 0);

  const cartTotalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: 16,
        right: 16,
        maxWidth: 480,
        zIndex: 1000,
        background: 'rgba(24, 27, 34, 0.96)',
        backdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 16,
        padding: '10px 14px',
        border: '1px solid rgba(147, 162, 250, 0.32)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(147, 162, 250, 0.14)',
          border: '1px solid rgba(147, 162, 250, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#93A2FA',
          flexShrink: 0
        }}>
          <ShoppingCart size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 10.5,
            color: '#8D93A5',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            У кошику ({cartTotalItems} шт.)
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#F3F4F8',
            lineHeight: 1.15,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {Math.round(total).toLocaleString('uk-UA')} <span style={{ fontSize: 13, color: '#93A2FA', fontWeight: 500 }}>₴</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        style={{
          height: 38,
          padding: '0 16px',
          borderRadius: 10,
          border: 'none',
          background: '#93A2FA',
          color: '#13151B',
          fontWeight: 600,
          fontSize: 13.5,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          transition: 'all 0.15s ease',
          flexShrink: 0
        }}
      >
        <span>Оформити</span>
        <ArrowRight size={15} strokeWidth={2.3} />
      </button>
    </motion.div>
  );
}
