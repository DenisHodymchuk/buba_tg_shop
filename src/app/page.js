"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import Storefront from '@/components/Storefront';
import { supabase } from '@/lib/supabase';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import OrderHistory from '@/components/OrderHistory';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, ShoppingCart, Award, Package, Search, Box, X,
  ChevronLeft, ChevronRight, Droplets, ShieldCheck, Info, Weight, ArrowRight, Sparkles
} from 'lucide-react';
import Reviews from '@/components/Reviews';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(0);
  const [user, setUser] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 720);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset image index when product changes
  useEffect(() => { setActiveImgIndex(0); }, [selectedProduct]);

  const allImages = useMemo(() => {
    if (!selectedProduct) return [];
    const main = selectedProduct.image_url;
    const extra = selectedProduct.image_urls || [];
    return [main, ...extra].filter(Boolean);
  }, [selectedProduct]);

  useEffect(() => {
    const initTG = () => {
      if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();

        const checkUser = () => {
          const u = webApp.initDataUnsafe?.user;
          const s = webApp.initDataUnsafe?.start_param;
          if (u) {
            setUser(u);
            syncUser(u, s);
          } else {
            setTimeout(checkUser, 1000);
          }
        };
        checkUser();

        const h = () => setIsHistoryOpen(true);
        window.addEventListener('openOrderHistory', h);
        return () => window.removeEventListener('openOrderHistory', h);
      } else {
        setTimeout(initTG, 500);
      }
    };
    initTG();
  }, []);

  async function syncUser(tgUser, source) {
    if (!supabase) return;
    try {
      const tid = tgUser.id.toString();

      const { data: existing } = await supabase
        .from('customers')
        .select('acquisition_source')
        .eq('tg_id', tid)
        .single();

      const upsertData = {
        tg_id: tid,
        first_name: tgUser.first_name || 'Клієнт',
        last_name: tgUser.last_name || '',
        allow_notifications: true
      };

      if (source && (!existing || !existing.acquisition_source)) {
        upsertData.acquisition_source = source;
      }

      const { data } = await supabase
        .from('customers')
        .upsert(upsertData, { onConflict: 'tg_id' })
        .select('bonuses, cart_data')
        .single();

      if (data) {
        setBonuses(data.bonuses || 0);
        if (data.cart_data && data.cart_data.length > 0 && cart.length === 0) {
          setCart(data.cart_data);
        }
      }
    } catch (e) {
      console.error('Full sync exception:', e);
    }
  }

  const syncCartToDB = async (newCart) => {
    if (!user?.id) return;
    try {
      const tid = user.id.toString();
      await supabase
        .from('customers')
        .update({
          cart_data: newCart,
          last_cart_activity: new Date().toISOString()
        })
        .eq('tg_id', tid);
    } catch (e) {
      console.error('Error syncing cart:', e);
    }
  };

  const addToCart = (toy) => {
    let updated;
    const existingIndex = cart.findIndex(item => item.id === toy.id);
    if (existingIndex !== -1) {
      updated = [...cart];
      updated[existingIndex] = { ...updated[existingIndex], quantity: (updated[existingIndex].quantity || 1) + 1 };
    } else {
      updated = [...cart, { ...toy, price: parseFloat(toy.price) || 0, discount: parseFloat(toy.discount) || 0, quantity: 1 }];
    }
    setCart(updated);
    syncCartToDB(updated);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = (item.quantity || 1) + delta;
    if (newQty > 0) {
      updated[index] = { ...item, quantity: newQty };
    } else {
      updated.splice(index, 1);
    }
    setCart(updated);
    syncCartToDB(updated);
    if (updated.length === 0) setIsCheckoutOpen(false);
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    syncCartToDB(updated);
    if (updated.length === 0) setIsCheckoutOpen(false);
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#13151B',
      color: '#F3F4F8'
    }}>
      <Header
        cartCount={cartTotalItems}
        bonuses={bonuses}
        onOpenCart={() => cart.length > 0 && setIsCheckoutOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenReviews={() => setIsReviewsOpen(true)}
        onSearch={setSearchQuery}
      />

      <AnimatePresence>
        {isHistoryOpen && (
          <OrderHistory
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            tgUser={user}
          />
        )}
      </AnimatePresence>

      <Reviews
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        tgUser={user}
      />

      {/* Custom 3D Modeling Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: isMobile ? '14px 12px 0' : '20px 20px 0',
          maxWidth: 1360,
          margin: '0 auto',
          width: '100%'
        }}
      >
        <Link href="/custom-modeling" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            background: '#181B22',
            borderRadius: isMobile ? 16 : 18,
            padding: isMobile ? '16px' : '20px 26px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            overflow: 'hidden',
            position: 'relative',
            transition: 'border-color 0.16s ease'
          }}>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: 'rgba(147, 162, 250, 0.14)',
                  color: '#93A2FA',
                  border: '1px solid rgba(147, 162, 250, 0.32)'
                }}>
                  <Sparkles size={11} />
                  <span>Індивідуальна послуга</span>
                </span>
                {!isMobile && (
                  <span style={{ fontSize: 11.5, color: '#8D93A5' }}>
                    3D-друк та моделювання за вашим фото, ескізом або кресленням
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <h2 style={{
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 700,
                  color: '#F3F4F8',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  3D-моделювання будь-якої складності
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#93A2FA'
                }}>
                  <span>Замовити прорахунок</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            <div style={{
              width: isMobile ? 60 : 72,
              height: isMobile ? 60 : 72,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#13151B',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0
            }}>
              <img
                src="/images/custom-modeling.png"
                alt="3D Моделювання"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </Link>
      </motion.div>

      <main style={{ flex: '1 0 auto', paddingBottom: 120 }}>
        <Storefront
          addToCart={addToCart}
          searchQuery={searchQuery}
          onProductClick={setSelectedProduct}
          cart={cart}
        />
      </main>

      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout
            items={cart}
            bonuses={bonuses}
            onClose={() => setIsCheckoutOpen(false)}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onOrderSuccess={() => {
              setCart([]);
              syncCartToDB([]);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cart.length > 0 && !isCheckoutOpen && (
          <CheckoutBar items={cart} onCheckout={() => setIsCheckoutOpen(true)} />
        )}
      </AnimatePresence>

      {/* Product Details Modal (Hallmark Dusk) */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 12, 16, 0.78)',
                backdropFilter: 'blur(12px)'
              }}
            />

            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: isMobile ? 460 : 820,
                background: '#181B22',
                borderRadius: 20,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                maxHeight: '90vh',
                boxShadow: '0 32px 80px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  zIndex: 100,
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(19, 21, 27, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#B8BDCB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              {/* Left Column: Image / 3D Gallery */}
              <div style={{
                background: '#13151B',
                padding: isMobile ? 16 : 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
              }}>
                <div style={{
                  width: '100%',
                  height: isMobile ? 250 : 340,
                  position: 'relative',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AnimatePresence mode="wait">
                    {activeImgIndex === 0 && selectedProduct.model_3d ? (
                      <motion.div
                        key="model"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <model-viewer
                          src={selectedProduct.model_3d}
                          alt={selectedProduct.name}
                          auto-rotate
                          camera-controls
                          touch-action="pan-y"
                          shadow-intensity="1"
                          environment-image="neutral"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={activeImgIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <img
                          src={selectedProduct.model_3d ? allImages[activeImgIndex - 1] : allImages[activeImgIndex]}
                          alt={selectedProduct.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {(allImages.length + (selectedProduct.model_3d ? 1 : 0)) > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImgIndex(prev => prev > 0 ? prev - 1 : (allImages.length + (selectedProduct.model_3d ? 1 : 0)) - 1)}
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: 'rgba(24, 27, 34, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#F3F4F8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5
                        }}
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImgIndex(prev => prev < (allImages.length + (selectedProduct.model_3d ? 1 : 0)) - 1 ? prev + 1 : 0)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: 'rgba(24, 27, 34, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#F3F4F8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5
                        }}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {(allImages.length + (selectedProduct.model_3d ? 1 : 0)) > 1 && (
                  <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {Array.from({ length: allImages.length + (selectedProduct.model_3d ? 1 : 0) }).map((_, i) => {
                      const is3d = i === 0 && selectedProduct.model_3d;
                      const imgUrl = selectedProduct.model_3d ? allImages[i - 1] : allImages[i];
                      const active = activeImgIndex === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveImgIndex(i)}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: active ? '1.5px solid #93A2FA' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: '#181B22',
                            padding: 0,
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#93A2FA',
                            fontSize: 10,
                            fontWeight: 700
                          }}
                        >
                          {is3d ? '3D' : <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Info, Specs & CTA */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                maxHeight: isMobile ? '52vh' : '90vh',
                overflowY: 'auto'
              }}>
                <div style={{ padding: isMobile ? 16 : '22px 24px 16px' }}>
                  {selectedProduct.category && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 9px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(147, 162, 250, 0.14)',
                      color: '#93A2FA',
                      border: '1px solid rgba(147, 162, 250, 0.3)',
                      marginBottom: 8
                    }}>
                      {selectedProduct.category}
                    </span>
                  )}

                  <h2 style={{
                    fontSize: isMobile ? 19 : 22,
                    fontWeight: 700,
                    color: '#F3F4F8',
                    marginBottom: 14,
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em'
                  }}>
                    {selectedProduct.name}
                  </h2>

                  {/* Specs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{
                      background: '#13151B',
                      padding: '10px 12px',
                      borderRadius: 11,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8D93A5', fontSize: 10.5, fontWeight: 500, marginBottom: 4 }}>
                        <Droplets size={12} style={{ color: '#93A2FA' }} /> Матеріал
                      </div>
                      <div style={{ color: '#F3F4F8', fontWeight: 600, fontSize: 13 }}>{selectedProduct.plastic_type || 'PLA Eco'}</div>
                    </div>

                    <div style={{
                      background: '#13151B',
                      padding: '10px 12px',
                      borderRadius: 11,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8D93A5', fontSize: 10.5, fontWeight: 500, marginBottom: 4 }}>
                        <ShieldCheck size={12} style={{ color: '#93A2FA' }} /> Безпека
                      </div>
                      <div style={{ color: '#F3F4F8', fontWeight: 600, fontSize: 13 }}>{selectedProduct.safety_info || '100% Безпечно'}</div>
                    </div>

                    <div style={{
                      background: '#13151B',
                      padding: '10px 12px',
                      borderRadius: 11,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8D93A5', fontSize: 10.5, fontWeight: 500, marginBottom: 4 }}>
                        <Weight size={12} style={{ color: '#F4A97B' }} /> Вага
                      </div>
                      <div style={{ color: '#F3F4F8', fontWeight: 600, fontSize: 13 }}>{selectedProduct.weight || 'Стандарт'}</div>
                    </div>

                    <div style={{
                      background: '#13151B',
                      padding: '10px 12px',
                      borderRadius: 11,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8D93A5', fontSize: 10.5, fontWeight: 500, marginBottom: 5 }}>
                        <Droplets size={12} style={{ color: '#93A2FA' }} /> Кольори
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {selectedProduct.color ? selectedProduct.color.split(',').map((c, i) => {
                          const val = c.trim().toLowerCase();
                          const colorMap = {
                            'білий': '#ffffff', 'white': '#ffffff',
                            'чорний': '#18181b', 'black': '#18181b',
                            'червоний': '#ef4444', 'red': '#ef4444',
                            'синій': '#3b82f6', 'blue': '#3b82f6',
                            'жовтий': '#facc15', 'yellow': '#facc15',
                            'зелений': '#22c55e', 'green': '#22c55e',
                            'рожевий': '#ec4899', 'pink': '#ec4899',
                            'помаранчевий': '#f97316', 'orange': '#f97316',
                            'салатовий': '#84cc16', 'lime': '#84cc16',
                            'фіолетовий': '#a855f7', 'purple': '#a855f7',
                            'блакитний': '#0ea5e9', 'sky': '#0ea5e9',
                            'сірий': '#94a3b8', 'gray': '#94a3b8',
                            'золотий': '#fbbf24', 'gold': '#fbbf24',
                            'срібний': '#cbd5e1', 'silver': '#cbd5e1'
                          };
                          let bg = colorMap[val] || val;
                          if (val.includes('веселк')) bg = 'linear-gradient(to right, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)';
                          return (
                            <div
                              key={i}
                              title={c.trim()}
                              style={{ width: 13, height: 13, borderRadius: '50%', background: bg, border: '1px solid rgba(255,255,255,0.25)' }}
                            />
                          );
                        }) : <div style={{ color: '#F3F4F8', fontWeight: 600, fontSize: 13 }}>Базовий</div>}
                      </div>
                    </div>
                  </div>

                  {/* Product Description */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8D93A5', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                      <Info size={12} /> Опис виробу
                    </div>
                    <p style={{
                      color: '#B8BDCB',
                      lineHeight: 1.55,
                      fontSize: 13.5,
                      margin: 0,
                      whiteSpace: 'pre-line'
                    }}>
                      {(selectedProduct.description || '').split('|||ADMIN_NOTES|||')[0]?.trim() || 'Якісний 3D-друкований виріб власного виробництва.'}
                    </p>
                  </div>
                </div>

                {/* Sticky Footer Action Bar */}
                <div style={{
                  padding: isMobile ? '14px 16px' : '16px 24px',
                  background: '#181B22',
                  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8D93A5', marginBottom: 2, fontWeight: 500 }}>Вартість</div>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#F3F4F8',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 5,
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {(selectedProduct.price * (1 - (selectedProduct.discount || 0) / 100)).toFixed(0)}
                      <span style={{ fontSize: 15, color: '#8D93A5', fontWeight: 500 }}>₴</span>
                      {Number(selectedProduct.discount) > 0 && (
                        <span style={{ fontSize: 13, color: '#8D93A5', textDecoration: 'line-through', fontWeight: 500, marginLeft: 4 }}>
                          {selectedProduct.price} ₴
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{
                      flex: 1,
                      maxWidth: 220,
                      height: 44,
                      borderRadius: 11,
                      background: '#93A2FA',
                      color: '#13151B',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ShoppingCart size={16} />
                    <span>Додати в кошик</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer style={{
        padding: '40px 20px 32px',
        textAlign: 'center',
        flexShrink: 0,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <p style={{ fontSize: 11.5, color: '#8D93A5', fontWeight: 600, letterSpacing: '0.04em' }}>
          © 2026 BUBA Store · Майстерня 3D виробів
        </p>
      </footer>
    </div>
  );
}
