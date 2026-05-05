"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import { supabase } from '@/lib/supabase';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import OrderHistory from '@/components/OrderHistory';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(0);
  const [user, setUser] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      try {
        webApp.ready();
        webApp.expand();
        webApp.MainButton.hide();

        const tgUser = webApp.initDataUnsafe?.user;
        if (tgUser) {
          setUser(tgUser);
          syncUser(tgUser);
        }
        const handleOpenHistory = () => setIsHistoryOpen(true);
        window.addEventListener('openOrderHistory', handleOpenHistory);

        return () => {
          window.removeEventListener('openOrderHistory', handleOpenHistory);
        };
      } catch (e) {
        console.warn('Error initializing Telegram WebApp:', e);
      }
    }
  }, []);

  const [debugInfo, setDebugInfo] = useState('Wait...');

  async function syncUser(tgUser) {
    if (!supabase) return;
    try {
      const tid = tgUser.id.toString();
      setDebugInfo(`TID: ${tid}`);
      const { data, error } = await supabase.from('customers').select('bonuses').eq('tg_id', tid).single();
      if (data) {
        setBonuses(data.bonuses || 0);
        setDebugInfo(`OK: ${tid}`);
      } else if (error) {
        setDebugInfo(`Err: ${error.code}`);
      } else {
        setDebugInfo(`None: ${tid}`);
      }
    } catch (e) {
      setDebugInfo(`Err: Catch`);
    }
  }

  const addToCart = (toy) => {
    const existingIndex = cart.findIndex(item => item.id === toy.id);
    
    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex] = { 
        ...newCart[existingIndex], 
        quantity: (newCart[existingIndex].quantity || 1) + 1 
      };
      setCart(newCart);
    } else {
      const itemToAdd = {
        ...toy,
        price: parseFloat(toy.price) || 0,
        discount: parseFloat(toy.discount) || 0,
        quantity: 1
      };
      setCart([...cart, itemToAdd]);
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
    <div style={{ 
      minHeight: '100vh', width: '100%', margin: '0', 
      display: 'flex', flexDirection: 'column', background: '#05050f'
    }}>
      <Header 
        cartCount={cartTotalItems} bonuses={bonuses} debugInfo={debugInfo}
        onOpenCart={() => cart.length > 0 && setIsCheckoutOpen(true)} 
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSearch={setSearchQuery}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: 140 }}>
        <Storefront addToCart={addToCart} searchQuery={searchQuery} />
      </main>

      <AnimatePresence>
        {isHistoryOpen && (
          <OrderHistory onClose={() => setIsHistoryOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && cart.length > 0 && (
          <Checkout 
            items={cart} 
            bonuses={bonuses}
            onClose={() => setIsCheckoutOpen(false)} 
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cart.length > 0 && !isCheckoutOpen && (
          <CheckoutBar items={cart} onCheckout={() => setIsCheckoutOpen(true)} />
        )}
      </AnimatePresence>
      
      <footer style={{ padding: '60px 20px 40px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 BUBA STORE</p>
        <p style={{ marginTop: 6, fontSize: 8, color: '#3a3a5a', textTransform: 'uppercase', letterSpacing: '0.3em' }}>3D друковані іграшки</p>
      </footer>
    </div>
  );
}
