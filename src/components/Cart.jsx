import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart({ items, isOpen, onClose, onRemove, discount, bonuses }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount || 0);
  const total = subtotal - discountAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 glass-card rounded-t-[32px] p-6 z-50 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} /> Мій Кошик
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
              {items.length === 0 ? (
                <div className="text-center py-10 text-text-muted">Твій кошик порожній</div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden">
                       <model-viewer src={item.model} auto-rotate style={{ height: '64px' }}></model-viewer>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-primary font-semibold">${item.price}</p>
                    </div>
                    <button onClick={() => onRemove(idx)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex justify-between text-text-muted">
                <span>Проміжна сума</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Знижка ({(discount * 100).toFixed(0)}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-yellow-400">
                <span>Доступні Бонуси</span>
                <span>{bonuses} балів</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Разом</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button 
                disabled={items.length === 0}
                className="glass-button w-full mt-4 py-4 text-lg"
              >
                Оформити замовлення
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
