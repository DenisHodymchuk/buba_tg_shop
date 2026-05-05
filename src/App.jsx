import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Storefront from './components/Storefront';
import WheelOfFortune from './components/WheelOfFortune';
import Cart from './components/Cart';
import { motion } from 'framer-motion';

// Mock Telegram SDK initialization (if not in Telegram)
const WebApp = window.Telegram?.WebApp;

function App() {
  const [cart, setCart] = useState([]);
  const [bonuses, setBonuses] = useState(150);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      WebApp.MainButton.setText('ПЕРЕГЛЯНУТИ КОШИК');
      WebApp.MainButton.onClick(() => setIsCartOpen(true));
      
      if (cart.length > 0) {
        WebApp.MainButton.show();
      } else {
        WebApp.MainButton.hide();
      }
    }
  }, [cart]);

  const addToCart = (toy) => {
    setCart([...cart, toy]);
    if (WebApp) WebApp.HapticFeedback.notificationOccurred('success');
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleWin = (result) => {
    if (result.label === 'BONUS') {
      setBonuses(prev => prev + 50);
    } else if (result.label === 'FREE') {
      setDiscount(1); // 100% off? maybe too much, let's say 50% for "FREE" label or actual free item
    } else {
      setDiscount(result.value);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header 
        cartCount={cart.length} 
        bonuses={bonuses} 
        onOpenCart={() => setIsCartOpen(true)} 
      />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <WheelOfFortune onWin={handleWin} />
        
        <div className="px-4 mb-4">
           {discount > 0 && (
             <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl text-green-400 text-center font-bold">
               🎉 Активна знижка: {(discount * 100).toFixed(0)}% OFF!
             </div>
           )}
        </div>

        <Storefront addToCart={addToCart} />
      </motion.main>

      <Cart 
        items={cart} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onRemove={removeFromCart}
        discount={discount}
        bonuses={bonuses}
      />
      
      {/* Footer info */}
      <footer className="px-4 py-8 text-center text-text-muted text-xs">
        <p>© 2026 3D МагазинІграшок Telegram App</p>
        <p>Преміальні іграшки для цифрової ери</p>
      </footer>
    </div>
  );
}

export default App;
