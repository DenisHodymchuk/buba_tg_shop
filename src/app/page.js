"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import Cart from '@/components/Cart';
import CheckoutBar from '@/components/CheckoutBar';
import Checkout from '@/components/Checkout';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(150); // Наприклад, 150 монет
  const [isCartOpen, setIsCartOpen] = useState(false);
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
  }, [cart]);

  const addToCart = (toy) => {
    setCart([...cart, toy]);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const updateQuantity = (index, delta) => {
    // В нашому випадку cart - це масив товарів, де кожен товар це окремий елемент.
    // Якщо хочемо справжню кількість, треба групувати. Але поки просто додаємо/видаляємо.
    if (delta > 0) {
      setCart([...cart, cart[index]]);
    } else {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', margin: '0', 
      display: 'flex', flexDirection: 'column', background: '#05050f'
    }}>
      <Header 
        cartCount={cart.length} bonuses={bonuses} 
        onOpenCart={() => setIsCartOpen(true)} onSearch={setSearchQuery}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: 120 }}>
        <Storefront addToCart={addToCart} searchQuery={searchQuery} />
      </main>

      <Cart 
        items={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} 
        onRemove={removeFromCart} bonuses={bonuses}
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
      />

      <AnimatePresence>
        {isCheckoutOpen && (
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
        {cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
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
