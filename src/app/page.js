"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Storefront from '@/components/Storefront';
import WheelOfFortune from '@/components/WheelOfFortune';
import Cart from '@/components/Cart';
import { motion } from 'framer-motion';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    // Initialize Telegram Web App
    if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      try {
        webApp.ready();
        webApp.expand();
        
        const user = webApp.initDataUnsafe?.user;
        if (user) {
          setTgUser(user);
        }

        webApp.MainButton.setText('ПЕРЕГЛЯНУТИ КОШИК');
        webApp.MainButton.onClick(() => setIsCartOpen(true));
        
        if (cart.length > 0) {
          webApp.MainButton.show();
        } else {
          webApp.MainButton.hide();
        }
      } catch (e) {
        console.warn('Error initializing Telegram WebApp:', e);
      }
    }
  }, [cart]);

  const addToCart = (toy) => {
    setCart([...cart, toy]);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleWin = (result) => {
    if (result.label === 'БОНУС') {
      setBonuses(prev => prev + 50);
    } else if (result.label === 'ХАЛЯВА') {
      setDiscount(0.5); // 50% discount
    } else {
      setDiscount(result.value);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background text-text">
      <Header 
        cartCount={cart.length} 
        bonuses={bonuses} 
        onOpenCart={() => setIsCartOpen(true)} 
      />

      <main className="max-w-7xl mx-auto">
        <Storefront addToCart={addToCart} />
        
        {/* Wheel Section - Clearly separated */}
        <div className="mt-16 pt-16 border-t border-white/[0.03]">
          <WheelOfFortune onWin={handleWin} />
        </div>
      </main>

      <Cart 
        items={cart} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onRemove={removeFromCart}
        discount={discount}
        bonuses={bonuses}
      />
      
      <footer className="px-4 py-12 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]">
        <p>© 2026 3D Toy Shop Telegram App</p>
        <p className="mt-2 text-slate-800">Premium Digital Toys Experience</p>
      </footer>
    </div>
  );
}
