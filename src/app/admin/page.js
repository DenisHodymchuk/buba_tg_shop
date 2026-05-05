"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Package, LayoutDashboard, Settings as SettingsIcon, 
  BarChart3, Users, ShoppingBag, Search, Bell, LogOut, ExternalLink,
  ChevronRight, Box, DollarSign, Activity, Filter, Download, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', status: 'in_stock', model_3d: '', images: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    const { data, error } = await supabase.from('products').insert([newProduct]).select();
    if (!error) {
      setProducts([data[0], ...products]);
      setNewProduct({ name: '', description: '', price: '', status: 'in_stock', model_3d: '', images: [] });
      setShowAddForm(false);
    } else {
      alert('Помилка: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (confirm('Видалити цей товар?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) setProducts(products.filter(p => p.id !== id));
    }
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* SIDEBAR - Fixed Width & High Z-Index */}
      <aside className="w-64 flex-shrink-0 bg-[#0b0f1a] border-r border-slate-800 flex flex-col z-50">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Box className="text-white" size={20} />
            </div>
            <span className="font-black text-lg tracking-tight text-white">BUBA <span className="text-indigo-500">CMS</span></span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Основне</p>
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Дашборд" />
          <SidebarLink active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={18} />} label="Товари" />
          <SidebarLink active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingBag size={18} />} label="Замовлення" />
          <SidebarLink active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users size={18} />} label="Клієнти" />
          
          <p className="px-4 py-2 mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Система</p>
          <SidebarLink active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={18} />} label="Аналітика" />
          <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={18} />} label="Налаштування" />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all duration-200">
            <LogOut size={18} />
            <span className="text-sm font-semibold">Вийти</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Scrollable */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        
        {/* Header Section */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-900/50 border border-slate-800 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 transition-all">
              <Search size={16} className="text-slate-500" />
              <input type="text" placeholder="Пошук..." className="bg-transparent border-none focus:ring-0 text-sm px-3 w-48 text-white" />
            </div>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#020617]"></span>
            </button>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">Адміністратор</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1 tracking-tighter">Власник</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs">AD</div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Switching */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'products' ? (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Управління Товарами</h1>
                    <p className="text-slate-500 text-sm mt-1">Керуйте асортиментом вашого 3D магазину</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"><Download size={20} /></button>
                    <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                      <Plus size={20} /> Додати товар
                    </button>
                  </div>
                </div>

                {/* Table Section */}
                <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                    <div className="flex items-center gap-2">
                       <button className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg border border-slate-700">Всі ( {products.length} )</button>
                       <button className="px-3 py-1.5 text-slate-500 text-xs font-bold rounded-lg hover:text-white transition-colors">В наявності</button>
                       <button className="px-3 py-1.5 text-slate-500 text-xs font-bold rounded-lg hover:text-white transition-colors">Під замовлення</button>
                    </div>
                    <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"><Filter size={14} /> Фільтри</button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                          <th className="p-4 pl-8 border-b border-slate-800 font-bold">Назва та опис</th>
                          <th className="p-4 border-b border-slate-800 font-bold">Ціна</th>
                          <th className="p-4 border-b border-slate-800 font-bold text-center">Статус</th>
                          <th className="p-4 pr-8 border-b border-slate-800 font-bold text-right">Дії</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {loading ? (
                          <tr><td colSpan="4" className="p-20 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : products.length === 0 ? (
                          <tr><td colSpan="4" className="p-20 text-center text-slate-600 font-medium">Товари відсутні. Створіть свій перший товар!</td></tr>
                        ) : (
                          products.map((p) => (
                            <tr key={p.id} className="group hover:bg-indigo-500/[0.02] transition-colors">
                              <td className="p-4 pl-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-[10px] font-black text-indigo-500 group-hover:border-indigo-500/30 transition-colors">
                                    {p.model_3d ? '3D' : 'IMG'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{p.name}</p>
                                    <p className="text-xs text-slate-500 truncate w-64 mt-0.5">{p.description || 'Без опису'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono font-bold text-white">{p.price} грн</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                  p.status === 'in_stock' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {p.status === 'in_stock' ? 'В наявності' : 'Немає'}
                                </span>
                              </td>
                              <td className="p-4 pr-8 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                  <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ExternalLink size={16} /></button>
                                  <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 mb-6"><SettingsIcon size={48} className="text-slate-700 animate-spin-slow" /></div>
                <h3 className="text-xl font-bold text-white mb-2">Розділ "{activeTab}" в розробці</h3>
                <p className="text-slate-500 max-w-xs">Ми працюємо над тим, щоб зробити цей розділ таким же крутим, як і управління товарами.</p>
                <button onClick={() => setActiveTab('products')} className="mt-6 text-indigo-400 font-bold hover:underline">Повернутися до товарів</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ADD PRODUCT MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-[#0b0f1a] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
               <div className="p-8 border-b border-slate-800 bg-slate-900/30">
                 <h2 className="text-2xl font-black text-white">Додати новий товар</h2>
                 <p className="text-slate-500 text-sm mt-1">Заповніть інформацію, щоб виставити товар на вітрину</p>
               </div>
               <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Назва</label>
                     <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-white outline-none" />
                   </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Ціна (грн)</label>
                      <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-white outline-none font-mono" />
                    </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Статус</label>
                     <select value={newProduct.status} onChange={e => setNewProduct({...newProduct, status: e.target.value})} className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-white outline-none appearance-none">
                        <option value="in_stock">В наявності</option>
                        <option value="pre_order">Під замовлення</option>
                        <option value="out_of_stock">Немає</option>
                     </select>
                   </div>
                   <div className="col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">3D модель (URL)</label>
                     <input type="text" value={newProduct.model_3d} onChange={e => setNewProduct({...newProduct, model_3d: e.target.value})} className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-white outline-none font-mono text-xs" placeholder="https://..." />
                   </div>
                   <div className="col-span-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Опис</label>
                     <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-[#020617] border border-slate-800 rounded-xl p-4 h-28 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-white outline-none resize-none" />
                   </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-6 py-4 border border-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-900 transition-colors">Скасувати</button>
                   <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">Зберегти товар</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
        active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      <span className={`${active ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}`}>{icon}</span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {active && (
        <motion.div layoutId="active-pill" className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full" />
      )}
    </button>
  );
}
