import React from 'react';
import { ShoppingCart, Award } from 'lucide-react';

export default function Header({ cartCount, bonuses, onOpenCart }) {
  return (
    <header className="sticky top-0 z-30 px-4 py-4 backdrop-blur-md bg-background/80 border-b border-white/5 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <span className="font-bold text-xl">3D</span>
        </div>
        <h1 className="font-bold text-lg">МагазинІграшок</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <Award size={16} className="text-yellow-500" />
          <span className="font-bold text-sm">{bonuses}</span>
        </div>
        
        <button 
          onClick={onOpenCart}
          className="relative p-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[10px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
