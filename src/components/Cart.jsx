"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';

export default function Cart({ items, isOpen, onClose, onRemove, discount, bonuses }) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Side Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.05] shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-[#171717]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                  <ShoppingBag className="text-indigo-500" size={20} />
                </div>
                <h2 className="text-xl font-black text-white">Кошик</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={40} className="text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Кошик порожній</h3>
                  <p className="text-slate-500 text-sm">Здається, ви ще нічого не обрали. Поверніться до каталогу!</p>
                  <button onClick={onClose} className="mt-8 text-indigo-400 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    До покупок <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index} 
                    className="bg-[#171717] border border-white/[0.05] p-4 rounded-2xl flex items-center gap-4 group"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-[10px] font-black text-indigo-500">
                      3D
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <p className="text-indigo-400 font-black text-sm mt-1">{item.price} грн</p>
                    </div>
                    <button 
                      onClick={() => onRemove(index)}
                      className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-[#171717]/50 border-t border-white/[0.05] space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-500 text-sm font-bold uppercase tracking-wider">
                    <span>Проміжна сума</span>
                    <span className="text-white">{subtotal.toFixed(0)} ₴</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 text-sm font-bold uppercase tracking-wider">
                      <span>Знижка ({(discount * 100).toFixed(0)}%)</span>
                      <span>-{(subtotal * discount).toFixed(0)} ₴</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300 font-black text-lg pt-4 border-t border-white/5">
                    <span>Разом</span>
                    <span className="text-white">{(subtotal * (1 - discount)).toFixed(0)} ₴</span>
                  </div>
                </div>

                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                  ОФОРМИТИ ЗАМОВЛЕННЯ
                  <ArrowRight size={20} />
                </button>
                <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-[0.2em] mt-4">
                  Безпечна оплата та швидка доставка
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
