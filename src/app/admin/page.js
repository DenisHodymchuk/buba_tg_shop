"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Package, LayoutDashboard, ShoppingBag, 
  Search, Bell, LogOut, Box, BarChart3, Settings,
  Upload, Image as ImageIcon, X, Edit3, Filter, CheckCircle, Globe, Tag, Percent, User, Coins, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', price: '', category: '', image_url: '', image_urls: [], 
    description: '', model_3d: '', discount: 0, plastic_type: '', safety_info: '', weight: '', color: ''
  });

  const [searchCustomer, setSearchCustomer] = useState('');
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bonusAmount, setBonusAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    if (!supabase) return;

    const { data: p } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    const { data: o } = await supabase.from('orders').select('*, customer:customers(*)').order('created_at', { ascending: false });

    if (p) setProducts(p);
    if (c) setCustomers(c);
    if (o) setOrders(o);
    setLoading(false);
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      discount: parseInt(formData.discount)
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productData]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '', image_url: '', image_urls: [], description: '', model_3d: '', discount: 0, plastic_type: '', safety_info: '', weight: '', color: '' });
    fetchData();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || '',
      image_url: product.image_url || '',
      image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],
      description: product.description || '',
      model_3d: product.model_3d || '',
      discount: product.discount || 0,
      plastic_type: product.plastic_type || '',
      safety_info: product.safety_info || '',
      weight: product.weight || '',
      color: product.color || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Видалити цей товар?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const updateBonuses = async (type) => {
    if (!selectedCustomer || !bonusAmount) return;
    const amount = parseInt(bonusAmount);
    const newTotal = type === 'add' ? (selectedCustomer.bonuses + amount) : (selectedCustomer.bonuses - amount);
    
    await supabase.from('customers').update({ bonuses: newTotal }).eq('id', selectedCustomer.id);
    setIsBonusModalOpen(false);
    setBonusAmount('');
    fetchData();
  };

  const filteredCustomers = customers.filter(c => 
    c.first_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.tg_id?.toString().includes(searchCustomer)
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#05050f', color: '#fff' }}>Завантаження...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', color: '#fff', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: '#0a0a1a', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>BUBA ADMIN</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'products', label: 'Товари', icon: Package },
              { id: 'orders', label: 'Замовлення', icon: ShoppingBag },
              { id: 'customers', label: 'Клієнти', icon: User },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16, border: 'none',
                  background: activeTab === item.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#6b6b8a',
                  cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800, fontSize: 14, textAlign: 'left'
                }}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900 }}>{activeTab === 'products' ? 'Товари' : activeTab === 'orders' ? 'Замовлення' : 'Клієнти'}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', category: '', image_url: '', image_urls: [], description: '', model_3d: '', discount: 0, plastic_type: '', safety_info: '', weight: '', color: '' }); setIsModalOpen(true); }}
              style={{ padding: '14px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(124,58,237,0.2)' }}
            >
              <Plus size={20} strokeWidth={3} /> ДОДАТИ ТОВАР
            </button>
          )}
        </div>

        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: '#0a0a1a', borderRadius: 32, padding: 24, border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 24, overflow: 'hidden', marginBottom: 20, background: 'rgba(255,255,255,0.02)' }}>
                  <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.discount > 0 && (
                    <div style={{ position: 'absolute', top: 12, left: 12, padding: '6px 12px', borderRadius: 10, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 900 }}>-{p.discount}%</div>
                  )}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{p.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f97316', marginBottom: 24 }}>{p.price}₴</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>РЕДАГУВАТИ</button>
                  <button onClick={() => handleDelete(p.id)} style={{ width: 50, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'customers' && (
          <div style={{ background: '#0a0a1a', borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
             <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ position: 'relative', maxWidth: 400 }}>
                 <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }} size={18} />
                 <input 
                  type="text" 
                  placeholder="Пошук клієнта..." 
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  style={{ width: '100%', padding: '14px 20px 14px 48px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', outline: 'none' }}
                 />
               </div>
             </div>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', color: '#6b6b8a', fontSize: 12, textTransform: 'uppercase', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '20px 24px' }}>Клієнт</th>
                  <th style={{ padding: '20px 24px' }}>TG ID</th>
                  <th style={{ padding: '20px 24px' }}>Бонуси</th>
                  <th style={{ padding: '20px 24px' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '20px 24px', fontWeight: 800 }}>{c.first_name}</td>
                    <td style={{ padding: '20px 24px', color: '#6b6b8a' }}>{c.tg_id}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontWeight: 900 }}>{c.bonuses} 💎</span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <button 
                        onClick={() => { setSelectedCustomer(c); setIsBonusModalOpen(true); }}
                        style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                      >КЕРУВАТИ БОНУСАМИ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map(o => (
              <div key={o.id} style={{ background: '#0a0a1a', borderRadius: 32, padding: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 4 }}>ЗАМОВЛЕННЯ #{o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{o.customer?.first_name} (@{o.customer?.tg_id})</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>{o.total_price}₴</div>
                    <div style={{ fontSize: 12, color: '#6b6b8a' }}>{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20 }}>
                  {JSON.parse(o.items || '[]').map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx === JSON.parse(o.items || '[]').length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontWeight: 800 }}>{item.name} x{item.quantity}</span>
                      <span style={{ color: '#f97316', fontWeight: 800 }}>{(item.price * (1 - (item.discount || 0) / 100)).toFixed(0)}₴</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, fontSize: 14, color: '#6b6b8a' }}>
                  📍 <strong>Доставка:</strong> {o.shipping_city}, {o.shipping_address} ({o.shipping_method})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', background: '#0a0a1a', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', padding: 40 }}>
              <h2 style={{ fontSize: 28, fontWeight: 950, marginBottom: 32 }}>{editingProduct ? 'Редагувати товар' : 'Новий товар'}</h2>
              
              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Назва</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Категорія</label>
                    <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                  </div>
                </div>

                {/* Unified Gallery Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Галерея фотографій</label>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      type="text" 
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Вставте URL нового фото..." 
                      style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 16px', color: '#fff', outline: 'none', fontSize: 13 }} 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const url = newPhotoUrl.trim();
                        if (url) {
                          const currentExtra = Array.isArray(formData.image_urls) ? formData.image_urls : [];
                          if (!formData.image_url) {
                            setFormData({...formData, image_url: url});
                          } else {
                            setFormData({...formData, image_urls: [...currentExtra, url]});
                          }
                          setNewPhotoUrl('');
                        }
                      }}
                      style={{ padding: '0 20px', borderRadius: 14, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ДОДАТИ
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                    {[formData.image_url, ...(Array.isArray(formData.image_urls) ? formData.image_urls : [])].filter(Boolean).map((url, index) => {
                      const isMain = url === formData.image_url;
                      return (
                        <div key={index} style={{ position: 'relative', width: 100, height: 100, borderRadius: 16, border: isMain ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                          <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button"
                            onClick={() => {
                              const all = [formData.image_url, ...(formData.image_urls || [])].filter(Boolean);
                              const newMain = url;
                              const newExtra = all.filter(u => u !== newMain);
                              setFormData({...formData, image_url: newMain, image_urls: newExtra});
                            }}
                            style={{ position: 'absolute', top: 5, left: 5, width: 24, height: 24, borderRadius: '50%', background: isMain ? '#7c3aed' : 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            title="Зробити головним"
                          >
                            <Award size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (isMain) {
                                const extra = formData.image_urls || [];
                                setFormData({...formData, image_url: extra[0] || '', image_urls: extra.slice(1)});
                              } else {
                                setFormData({...formData, image_urls: formData.image_urls.filter(u => u !== url)});
                              }
                            }}
                            style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Базова ціна (₴)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Знижка (%)</label>
                    <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Опис товару</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', minHeight: 120 }} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>Матеріал</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['PLA', 'PETG', 'ABS', 'TPU'].map(p => (
                          <button key={p} type="button" onClick={() => setFormData({...formData, plastic_type: p})} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: formData.plastic_type === p ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={formData.plastic_type} onChange={e => setFormData({...formData, plastic_type: e.target.value})} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13 }} />
                  </div>
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#ec4899', textTransform: 'uppercase' }}>Кольори</label>
                      <button type="button" onClick={() => setFormData({...formData, color: ''})} style={{ fontSize: 9, color: '#ef4444', background: 'none', border: 'none' }}>ОЧИСТИТИ</button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {['Червоний', 'Синій', 'Зелений', 'Жовтий', 'Білий', 'Чорний', 'Веселковий'].map(c => (
                        <button key={c} type="button" onClick={() => { const curr = formData.color ? formData.color.split(',').map(x => x.trim()).filter(Boolean) : []; if (!curr.includes(c)) setFormData({...formData, color: [...curr, c].join(', ')}); }} style={{ fontSize: 9, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{c}</button>
                      ))}
                    </div>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13 }} />
                  </div>
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', textTransform: 'uppercase' }}>Вага</label>
                    <input type="text" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13 }} />
                  </div>
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase' }}>Безпека</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['Харчовий', 'Безпечний', 'Еко', '3+ роки'].map(s => (
                          <button key={s} type="button" onClick={() => setFormData({...formData, safety_info: s === 'Харчовий' ? 'Харчовий пластик' : s === 'Еко' ? 'Еко-матеріал' : s})} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: formData.safety_info?.includes(s) ? '#22c55e' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={formData.safety_info} onChange={e => setFormData({...formData, safety_info: e.target.value})} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>3D Модель URL (.glb)</label>
                  <input type="text" value={formData.model_3d} onChange={e => setFormData({...formData, model_3d: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                </div>

                <button type="submit" style={{ padding: '18px', borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', fontWeight: 950, fontSize: 16, cursor: 'pointer', marginTop: 20, boxShadow: '0 10px 30px rgba(37,99,235,0.3)' }}>ЗБЕРЕГТИ ЗМІНИ</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bonus Modal */}
      <AnimatePresence>
        {isBonusModalOpen && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBonusModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: '#0a0a1a', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 24, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Coins size={32} color="#a78bfa" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 950, marginBottom: 8 }}>{selectedCustomer.first_name}</h2>
              <p style={{ color: '#6b6b8a', marginBottom: 32 }}>Поточний баланс: <span style={{ color: '#fbbf24', fontWeight: 900 }}>{selectedCustomer.bonuses} 💎</span></p>
              
              <input 
                type="number" placeholder="Кількість бонусів" 
                value={bonusAmount} onChange={e => setBonusAmount(e.target.value)}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, fontWeight: 900, textAlign: 'center', marginBottom: 24, outline: 'none' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => updateBonuses('sub')} style={{ padding: '16px', borderRadius: 16, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontWeight: 900, cursor: 'pointer' }}>ВІДНЯТИ</button>
                <button onClick={() => updateBonuses('add')} style={{ padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>ДОДАТИ</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
