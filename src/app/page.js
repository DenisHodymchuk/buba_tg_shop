"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import { supabase } from '@/lib/supabase';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import OrderHistory from '@/components/OrderHistory';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Plus, ShoppingCart, Award, Package, Search, Box, X, 
  ChevronLeft, ChevronRight, Droplets, ShieldCheck, Info, Weight 
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

  // Скидаємо індекс при зміні товару
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
          if (u) {
            setUser(u);
            syncUser(u);
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

  async function syncUser(tgUser) {
    if (!supabase) return;
    try {
      const tid = tgUser.id.toString();
      const { data, error } = await supabase
        .from('customers')
        .upsert({ 
          tg_id: tid, 
          first_name: tgUser.first_name || 'Клієнт', 
          last_name: tgUser.last_name || ''
        }, { onConflict: 'tg_id' })
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

  // Sync Cart to Supabase
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
    <div style={{ minHeight: '100vh', width: '100%', margin: '0', display: 'flex', flexDirection: 'column', background: '#05050f' }}>
      <Header 
        cartCount={cartTotalItems} bonuses={bonuses}
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

      <main style={{ flex: '1 0 auto', paddingBottom: 140 }}>
        <Storefront 
          addToCart={addToCart} 
          searchQuery={searchQuery} 
          onProductClick={setSelectedProduct}
        />
      </main>


      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout 
            items={cart} bonuses={bonuses}
            onClose={() => setIsCheckoutOpen(false)} 
            onRemove={removeFromCart} onUpdateQuantity={updateQuantity}
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

      {/* Product Details Modal (Direct child of Root to overlay Header) */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 20px' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 450, background: '#0a0a1a', 
                borderRadius: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px', scrollbarWidth: 'none' }}>
                <div style={{ width: '100%', height: 320, position: 'relative', marginTop: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 32, overflow: 'hidden' }}>
                  <AnimatePresence mode="wait">
                    {activeImgIndex === 0 && selectedProduct.model_3d ? (
                      <motion.div 
                        key="model" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <model-viewer
                          src={selectedProduct.model_3d} alt={selectedProduct.name}
                          auto-rotate camera-controls touch-action="pan-y"
                          shadow-intensity="1" environment-image="neutral"
                          style={{ width: '100%', height: '100%' }}
                        ></model-viewer>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={activeImgIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <img 
                          src={selectedProduct.model_3d ? allImages[activeImgIndex - 1] : allImages[activeImgIndex]} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 20 }} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {(allImages.length + (selectedProduct.model_3d ? 1 : 0)) > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImgIndex(prev => prev > 0 ? prev - 1 : (allImages.length + (selectedProduct.model_3d ? 1 : 0)) - 1)}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={() => setActiveImgIndex(prev => prev < (allImages.length + (selectedProduct.model_3d ? 1 : 0)) - 1 ? prev + 1 : 0)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.1em' }}>{selectedProduct.category}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 950, color: '#fff', marginBottom: 20, lineHeight: 1.2 }}>{selectedProduct.name}</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 30 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                        <Droplets size={12} style={{ color: '#3b82f6' }} /> Матеріал
                      </div>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{selectedProduct.plastic_type || 'PLA Eco'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                        <ShieldCheck size={12} style={{ color: '#22c55e' }} /> Безпека
                      </div>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{selectedProduct.safety_info || '100% Безпечно'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                        <Weight size={12} style={{ color: '#ec4899' }} /> Вага
                      </div>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{selectedProduct.weight || '---'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                        <Droplets size={12} style={{ color: '#7c3aed' }} /> Кольори
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedProduct.color ? selectedProduct.color.split(',').map((c, i) => {
                          const val = c.trim().toLowerCase();
                          const colorMap = {
                            'білий': '#ffffff', 'white': '#ffffff',
                            'чорний': '#000000', 'black': '#000000',
                            'червоний': '#ef4444', 'red': '#ef4444',
                            'синій': '#3b82f6', 'blue': '#3b82f6',
                            'жовтий': '#facc15', 'yellow': '#facc15',
                            'зелений': '#22c55e', 'green': '#22c55e',
                            'рожевий': '#ec4899', 'pink': '#ec4899',
                            'помаранчевий': '#f97316', 'orange': '#f97316',
                            'салатовий': '#adff2f', 'lime': '#adff2f',
                            'фіолетовий': '#a855f7', 'purple': '#a855f7',
                            'блакитний': '#0ea5e9', 'sky': '#0ea5e9',
                            'сірий': '#94a3b8', 'gray': '#94a3b8',
                            'золотий': '#fbbf24', 'gold': '#fbbf24',
                            'срібний': '#cbd5e1', 'silver': '#cbd5e1'
                          };
                          let bg = colorMap[val] || val;
                          if (val.includes('веселк')) bg = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
                          return (
                            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: bg, border: '1px solid rgba(255,255,255,0.2)' }} />
                          );
                        }) : <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>Базовий</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                      <Info size={12} /> Про цей виріб
                    </div>
                    <p style={{ color: '#6b6b8a', lineHeight: 1.6, fontSize: 15, margin: 0 }}>{(selectedProduct.description || '').split('|||ADMIN_NOTES|||')[0]?.trim() || 'Опис скоро з\'явиться...'}</p>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div style={{ 
                flexShrink: 0, padding: '24px 24px 32px', background: 'linear-gradient(to top, #0a0a1a 80%, transparent)', 
                borderTop: '1px solid rgba(255,255,255,0.05)', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#6b6b8a', marginBottom: 4, fontWeight: 800, textTransform: 'uppercase' }}>Вартість</div>
                    <div style={{ fontSize: 26, fontWeight: 1000, color: '#f97316', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      {(selectedProduct.price * (1 - (selectedProduct.discount || 0) / 100)).toFixed(0)}
                      <span style={{ fontSize: 16 }}>₴</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{ 
                      flex: 1, padding: '16px 20px', borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                      color: '#fff', border: 'none', fontWeight: 1000, fontSize: 15, cursor: 'pointer',
                      boxShadow: '0 12px 24px rgba(124,58,237,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    В кошик
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer style={{ padding: '60px 20px 40px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 BUBA STORE</p>
        <p style={{ marginTop: 6, fontSize: 8, color: '#3a3a5a', textTransform: 'uppercase', letterSpacing: '0.3em' }}>3D ДРУКОВАНІ ВИРОБИ</p>
      </footer>
    </div>
  );
}
