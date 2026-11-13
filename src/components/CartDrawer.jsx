'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck } from 'lucide-react';

export default function CartDrawer({
  items = [],
  isMobile = false,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => {
    const unit = Math.round((Number(item.price) || 0) * (1 - (Number(item.discount) || 0) / 100));
    return sum + unit * (item.quantity || 1);
  }, 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 12, 16, 0.72)'
        }}
      />

      {/* Right Slide-Over Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          width: isMobile ? '100%' : 420,
          maxWidth: '100vw',
          height: '100%',
          background: '#181B22',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.55)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(147, 162, 250, 0.14)',
                color: '#93A2FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingBag size={18} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#F3F4F8', lineHeight: 1.2 }}>
                Кошик
              </div>
              <div style={{ fontSize: 12, color: '#8D93A5', fontVariantNumeric: 'tabular-nums' }}>
                {totalCount === 0
                  ? 'Поки порожній'
                  : `${totalCount} ${totalCount === 1 ? 'товар' : totalCount < 5 ? 'товари' : 'товарів'}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити кошик"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#13151B',
              color: '#B8BDCB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px',
                gap: 12
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: '#13151B',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8D93A5'
                }}
              >
                <ShoppingBag size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F8' }}>
                У кошику поки порожньо
              </div>
              <div style={{ fontSize: 13, color: '#8D93A5', maxWidth: 240, lineHeight: 1.45 }}>
                Оберіть фігурку або 3D-виріб на вітрині, щоб оформити замовлення.
              </div>
            </div>
          ) : (
            items.map((item, idx) => {
              const unit = Math.round((Number(item.price) || 0) * (1 - (Number(item.discount) || 0) / 100));
              const qty = item.quantity || 1;
              const lineTotal = unit * qty;

              return (
                <div
                  key={`${item.id}-${item.selectedSize || 'default'}-${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '68px 1fr',
                    gap: 12,
                    padding: 10,
                    borderRadius: 14,
                    background: '#13151B',
                    border: '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 10,
                      background: '#0F1117',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </div>

                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: '#F3F4F8',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#8D93A5', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                          {unit} ₴ / шт.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove?.(idx)}
                        aria-label="Видалити товар"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          border: 'none',
                          background: 'transparent',
                          color: '#8D93A5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#181B22',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 999,
                          padding: '2px 4px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity?.(idx, -1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            border: 'none',
                            background: 'transparent',
                            color: '#F3F4F8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: '#F3F4F8', fontVariantNumeric: 'tabular-nums' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity?.(idx, 1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            border: 'none',
                            background: 'transparent',
                            color: '#F3F4F8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 800, color: '#93A2FA', fontVariantNumeric: 'tabular-nums' }}>
                        {lineTotal} ₴
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#151820',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            {/* Free shipping progress (> 3000 UAH) */}
            <div style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: subtotal > 3000 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(147, 162, 250, 0.08)',
              border: subtotal > 3000 ? '1px solid rgba(74, 222, 128, 0.28)' : '1px solid rgba(147, 162, 250, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: subtotal > 3000 ? '#4ADE80' : '#B8BDCB' }}>
                <Truck size={14} style={{ color: subtotal > 3000 ? '#4ADE80' : '#93A2FA', flexShrink: 0 }} />
                <span>
                  {subtotal > 3000
                    ? 'Безкоштовна доставка по Україні активована!'
                    : `До безкоштовної доставки ще ${3001 - subtotal} ₴`}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((subtotal / 3001) * 100))}%`,
                  background: subtotal > 3000 ? '#4ADE80' : '#93A2FA',
                  borderRadius: 999,
                  transition: 'width 0.25s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#8D93A5', fontWeight: 500 }}>Разом до сплати</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#F3F4F8', fontVariantNumeric: 'tabular-nums' }}>
                {subtotal} ₴
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 12,
                border: 'none',
                background: '#93A2FA',
                color: '#13151B',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span>Оформити замовлення</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: '#B8BDCB',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Продовжити покупки
            </button>
          </div>
        )}
      </motion.aside>
    </div>
  );
}
