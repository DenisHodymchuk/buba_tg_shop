"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';

export default function Cart({ items, isOpen, onClose, onRemove, discount, bonuses, onCheckout }) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const total = subtotal * (1 - discount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a1a] border-l border-white/[0.04] shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.04] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/20 flex items-center justify-center">
                  <ShoppingBag className="text-[#ec4899]" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Кошик</h2>
                  <p className="text-[10px] text-[#6b6b8a] font-bold">{items.length} товарів</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-[#6b6b8a] hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-[#161630] rounded-2xl flex items-center justify-center mb-5">
                    <ShoppingBag size={36} className="text-[#4a4a6a]" />
                  </div>
                  <h3 className="text-base font-black text-white mb-1">Кошик порожній</h3>
                  <p className="text-[#6b6b8a] text-xs mb-6">Оберіть вироби з каталогу!</p>
                  <button onClick={onClose} className="text-[#ec4899] font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                    До покупок <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={index} 
                    className="bg-[#161630] border border-white/[0.04] p-3.5 rounded-xl flex items-center gap-3 group hover:border-[#7c3aed]/20 transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#1e1e40] to-[#161630] rounded-xl border border-white/[0.04] flex items-center justify-center text-[10px] font-black text-[#7c3aed] flex-shrink-0">
                      3D
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                      <p className="text-[#f97316] font-black text-sm mt-0.5">{item.price} ₴</p>
                    </div>
                    <button 
                      onClick={() => onRemove(index)}
                      className="p-2 text-[#4a4a6a] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 bg-[#12122a]/80 border-t border-white/[0.04] space-y-3">
                <div className="flex justify-between text-[#6b6b8a] text-xs font-bold uppercase tracking-wider">
                  <span>Сума</span>
                  <span className="text-[#a1a1c5]">{subtotal.toFixed(0)} ₴</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <span>Знижка ({(discount * 100).toFixed(0)}%)</span>
                    <span>-{(subtotal * discount).toFixed(0)} ₴</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg pt-3 border-t border-white/[0.04]">
                  <span className="text-[#a1a1c5]">Разом</span>
                  <span className="text-white">{total.toFixed(0)} ₴</span>
                </div>

                <button 
                  onClick={onCheckout}
                  className="w-full btn-gradient py-4 text-sm font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 mt-2"
                >
                  Перейти до оплати
                  <ArrowRight size={18} />
                </button>
                <p className="text-[8px] text-center text-[#4a4a6a] font-bold uppercase tracking-[0.2em] mt-2">
                  Безпечна оплата • Швидка доставка
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
