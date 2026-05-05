"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import { supabase } from '@/lib/supabase';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import OrderHistory from '@/components/OrderHistory';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Droplets, ShieldCheck, Weight, Info } from 'lucide-react';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(0);
  const [user, setUser] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
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
        .select('bonuses')
        .single();

      if (data) setBonuses(data.bonuses || 0);
    } catch (e) {
      console.error('Full sync exception:', e);
    }
  }

  const addToCart = (toy) => {
    const existingIndex = cart.findIndex(item => item.id === toy.id);
    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: (newCart[existingIndex].quantity || 1) + 1 };
      setCart(newCart);
    } else {
      setCart([...cart, { ...toy, price: parseFloat(toy.price) || 0, discount: parseFloat(toy.discount) || 0, quantity: 1 }]);
    }
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQty = (item.quantity || 1) + delta;
    if (newQty > 0) {
      newCart[index] = { ...item, quantity: newQty };
      setCart(newCart);
    } else {
      newCart.splice(index, 1);
      setCart(newCart);
      if (newCart.length === 0) setIsCheckoutOpen(false);
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    if (newCart.length === 0) setIsCheckoutOpen(false);
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div style={{ minHeight: '100vh', width: '100%', margin: '0', display: 'flex', flexDirection: 'column', background: '#05050f' }}>
      <Header 
        cartCount={cartTotalItems} bonuses={bonuses}
        onOpenCart={() => cart.length > 0 && setIsCheckoutOpen(true)} 
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSearch={setSearchQuery}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: 140 }}>
        <Storefront 
          addToCart={addToCart} 
          searchQuery={searchQuery} 
          onProductClick={setSelectedProduct}
        />
      </main>

      <AnimatePresence>
        {isHistoryOpen && <OrderHistory onClose={() => setIsHistoryOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && cart.length > 0 && (
          <Checkout 
            items={cart} bonuses={bonuses}
            onClose={() => setIsCheckoutOpen(false)} 
            onRemove={removeFromCart} onUpdateQuantity={updateQuantity}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }}
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 450, background: '#0a0a1a', 
                borderRadius: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px' }}>
                <div style={{ width: '100%', height: 320, position: 'relative', marginTop: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 32, overflow: 'hidden' }}>
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
                        key={activeImgIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
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

                      {/* Dots */}
                      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 5 }}>
                        {Array.from({ length: allImages.length + (selectedProduct.model_3d ? 1 : 0) }).map((_, i) => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === activeImgIndex ? '#7c3aed' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 }}>{selectedProduct.category}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 16 }}>{selectedProduct.name}</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Droplets size={12} style={{ color: '#3b82f6' }} /> Матеріал
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.plastic_type || 'PLA Пластик'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <ShieldCheck size={12} style={{ color: '#22c55e' }} /> Безпека
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.safety_info || 'Безпечний'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Weight size={12} style={{ color: '#ec4899' }} /> Вага
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.weight || '---'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Droplets size={12} style={{ color: '#7c3aed' }} /> Кольори
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedProduct.color ? selectedProduct.color.split(',').map((c, i) => {
                          const val = c.trim().toLowerCase();
                          // Словник кольорів
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
                            'коричневий': '#78350f', 'brown': '#78350f',
                            'золотий': '#fbbf24', 'gold': '#fbbf24',
                            'срібний': '#cbd5e1', 'silver': '#cbd5e1',
                            'бежевий': '#f5f5dc', 'beige': '#f5f5dc',
                            'м\'ятний': '#2ed573', 'mint': '#2ed573'
                          };

                          let bg = val;
                          if (val.includes('веселк') || val.includes('rainb')) {
                            bg = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
                          } else if (colorMap[val]) {
                            bg = colorMap[val];
                          }
                          
                          return (
                            <div 
                              key={i} 
                              title={c.trim()}
                              style={{ 
                                width: 18, height: 18, borderRadius: '50%', 
                                background: bg, border: '2px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                              }} 
                            />
                          );
                        }) : <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>Базовий</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                      <Info size={12} /> Опис товару
                    </div>
                    <p style={{ color: '#6b6b8a', lineHeight: 1.5, fontSize: 14 }}>{selectedProduct.description || 'Опис скоро з\'явиться...'}</p>
                  </div>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', background: '#0a0a1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#6b6b8a', marginBottom: 2 }}>Ціна товару</div>
                    <div style={{ fontSize: 24, fontWeight: 950, color: '#f97316' }}>
                      {(selectedProduct.price * (1 - (selectedProduct.discount || 0) / 100)).toFixed(0)}₴
                    </div>
                  </div>
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{ 
                      padding: '14px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                      color: '#fff', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(124,58,237,0.3)'
                    }}
                  >
                    В КОШИК
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer style={{ padding: '60px 20px 40px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 BUBA STORE</p>
        <p style={{ marginTop: 6, fontSize: 8, color: '#3a3a5a', textTransform: 'uppercase', letterSpacing: '0.3em' }}>3D друковані іграшки</p>
      </footer>
    </div>
  );
}
