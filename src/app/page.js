"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import Cart from '@/components/Cart';
import CheckoutBar from '@/components/CheckoutBar';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      try {
        webApp.ready();
        webApp.expand();
        
        // Вимикаємо стандартну кнопку Telegram, бо тепер маємо крутіший CheckoutBar
        webApp.MainButton.hide();
      } catch (e) {
        console.warn('Error initializing Telegram WebApp:', e);
      }
    }
  }, [cart]);

  const addToCart = (toy) => {
    setCart([...cart, toy]);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      margin: '0', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#05050f'
    }}>
      <Header 
        cartCount={cart.length} 
        bonuses={bonuses} 
        onOpenCart={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: 120 }}>
        <Storefront addToCart={addToCart} searchQuery={searchQuery} />
      </main>

      <Cart 
        items={cart} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onRemove={removeFromCart}
        discount={discount}
        bonuses={bonuses}
      />

      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <CheckoutBar items={cart} onCheckout={() => setIsCartOpen(true)} />
        )}
      </AnimatePresence>
      
      <footer style={{ 
        padding: '60px 20px 40px', 
        textAlign: 'center',
        flexShrink: 0
      }}>
        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 BUBA STORE</p>
        <p style={{ marginTop: 6, fontSize: 8, color: '#3a3a5a', textTransform: 'uppercase', letterSpacing: '0.3em' }}>3D друковані іграшки</p>
      </footer>
    </div>
  );
}
