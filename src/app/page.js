"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(150);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      try {
        webApp.ready();
        webApp.expand();
        webApp.MainButton.hide();
      } catch (e) {
        console.warn('Error initializing Telegram WebApp:', e);
      }
    }
  }, []);

  const addToCart = (toy) => {
    // Переконуємося, що ціна - це число, щоб уникнути NaN
    const itemToAdd = {
      ...toy,
      price: parseFloat(toy.price) || 0,
      discount: parseFloat(toy.discount) || 0
    };
    setCart([...cart, itemToAdd]);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const updateQuantity = (index, delta) => {
    if (delta > 0) {
      setCart([...cart, cart[index]]);
    } else {
      const newCart = [...cart];
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

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', margin: '0', 
      display: 'flex', flexDirection: 'column', background: '#05050f'
    }}>
      <Header 
        cartCount={cart.length} bonuses={bonuses} 
        onOpenCart={() => cart.length > 0 && setIsCheckoutOpen(true)} 
        onSearch={setSearchQuery}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: 140 }}>
        <Storefront addToCart={addToCart} searchQuery={searchQuery} />
      </main>

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
