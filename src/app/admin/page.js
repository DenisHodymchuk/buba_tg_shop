"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Package, LayoutDashboard, ShoppingBag, 
  Search, Bell, LogOut, Box, BarChart3, Settings,
  Upload, Image as ImageIcon, X, Edit3, Filter, CheckCircle, Globe, Tag, Percent, User, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Всі');

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', discount: 0, status: 'in_stock', model_3d: '', image_url: '', category: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, []);

  async function fetchUsers() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('telegram_id', 'is', null); // Тільки ті, хто має TG ID
      if (!error && data) {
        setUsers(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  }

  async function awardBonuses(user) {
    if (!supabase) return;
    const amount = prompt(`Скільки бонусів нарахувати для ${user.name}?`, '50');
    if (!amount || isNaN(amount)) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${user.phone}${user.telegram_id ? `,telegram_id.eq.${user.telegram_id}` : ''}`)
        .single();
      
      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update({ bonuses: (profile.bonuses || 0) + parseInt(amount) })
          .eq('phone', profile.phone);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            phone: user.phone, 
            telegram_id: user.telegram_id,
            name: user.name, 
            bonuses: parseInt(amount) 
          }]);
        if (error) throw error;
      }
      
      alert('Бонуси успішно нараховано!');
      fetchUsers();
    } catch (e) {
      alert('Помилка при нарахуванні: ' + e.message + '\n\nПереконайтеся, що у вас створена таблиця "profiles" з колонками phone (text, primary key), name (text) та bonuses (int4).');
    }
  }

  async function deleteUser(phone) {
    if (!supabase || !confirm('Видалити цього клієнта?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('phone', phone);
      if (error) throw error;
      fetchUsers();
    } catch (e) {
      alert('Помилка: ' + e.message);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert('Помилка оновлення статусу: ' + e.message);
    }
  }

  async function fetchOrders() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }

  async function fetchProducts() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
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

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return ['Всі', ...new Set(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Всі' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const finalPricePreview = useMemo(() => {
    const p = parseFloat(formData.price) || 0;
    const d = parseFloat(formData.discount) || 0;
    return (p * (1 - d / 100)).toFixed(0);
  }, [formData.price, formData.discount]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    if (!supabase) {
      alert('Помилка: З\'єднання з базою даних не встановлено (перевірте .env.local)');
      setUploading(false);
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      alert('Помилка: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (!supabase) {
      alert('Помилка: З\'єднання з базою даних не встановлено');
      setLoading(false);
      return;
    }
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0
      };

      if (editingId) {
        const { data, error } = await supabase.from('products').update(dataToSave).eq('id', editingId).select();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingId ? data[0] : p));
      } else {
        const { data, error } = await supabase.from('products').insert([dataToSave]).select();
        if (error) throw error;
        setProducts([data[0], ...products]);
      }
      closeModal();
    } catch (error) {
      alert('Помилка: ' + error.message + '\nПереконайтеся, що ви додали колонку discount в базу даних (ALTER TABLE products ADD COLUMN discount NUMERIC DEFAULT 0)');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(product) {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discount: product.discount || 0,
      status: product.status || 'in_stock',
      model_3d: product.model_3d || '',
      image_url: product.image_url || '',
      category: product.category || ''
    });
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', discount: 0, status: 'in_stock', model_3d: '', image_url: '', category: '' });
  }

  async function handleDelete(id) {
    if (!supabase) return;
    if (confirm('Видалити цей товар назавжди?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) setProducts(products.filter(p => p.id !== id));
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#020b18', color: '#e2e8f0', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, flexShrink: 0, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box className="text-white" size={20} />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>TOVVERSE</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={18} />} label="Товари" />
          <SidebarBtn active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<ShoppingBag size={18} />} label="Замовлення" />
          <SidebarBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<User size={18} />} label="Клієнти" />
          <SidebarBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Налаштування" />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(2,11,24,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 16px', width: 350 }}>
            <Search size={16} style={{ color: '#4a4a6a' }} />
            <input type="text" placeholder="Пошук..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none', width: '100%' }} />
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: '#fff', color: '#020b18', padding: '10px 24px', borderRadius: 12, fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
            <Plus size={18} /> ДОДАТИ ТОВАР
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
          {!supabase && (
            <div style={{ marginBottom: 24, padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 12, color: '#ef4444', fontSize: 13, fontWeight: 700 }}>
              ⚠️ З'єднання з Supabase не встановлено. Перевірте наявність та правильність файлу .env.local
            </div>
          )}
          {activeTab === 'products' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Товари ({filteredProducts.length})</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  {categories.slice(0, 6).map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: activeCategory === cat ? 'rgba(59,130,246,0.1)' : 'transparent', border: '1px solid', borderColor: activeCategory === cat ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: activeCategory === cat ? '#3b82f6' : '#6b6b8a', cursor: 'pointer' }}>{cat}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredProducts.map(p => {
                  const final = (p.price * (1 - (p.discount || 0) / 100)).toFixed(0);
                  return (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 60, height: 60, background: '#f0eef5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                         {p.model_3d ? <Box size={28} color="#3b82f6" /> : p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} color="#94a3b8" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</h3>
                        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 700 }}>{p.category || 'Без категорії'}</p>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 20 }}>
                        {p.discount > 0 && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 900 }}>-{p.discount}%</div>}
                        {p.discount > 0 && <div style={{ fontSize: 10, color: '#4a4a6a', textDecoration: 'line-through' }}>{p.price} ₴</div>}
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{final} ₴</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 10, border: 'none', cursor: 'pointer' }}><Edit3 size={18} /></button>
                        <button onClick={() => handleDelete(p.id)} style={{ padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'sales' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Замовлення ({orders.length})</h1>
                <button onClick={fetchOrders} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer' }}>Оновити</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                          {order.order_number || `#${order.id.slice(0, 8)}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 700 }}>
                          {new Date(order.created_at).toLocaleString('uk-UA')}
                        </div>
                      </div>
                      <div style={{ 
                        padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 900, 
                        background: 
                          order.status === 'new' ? 'rgba(59,130,246,0.1)' : 
                          order.status === 'preparing' ? 'rgba(245,158,11,0.1)' :
                          order.status === 'printing' ? 'rgba(124,58,237,0.1)' :
                          order.status === 'shipping' ? 'rgba(236,72,153,0.1)' :
                          order.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                        color: 
                          order.status === 'new' ? '#3b82f6' : 
                          order.status === 'preparing' ? '#f59e0b' :
                          order.status === 'printing' ? '#7c3aed' :
                          order.status === 'shipping' ? '#ec4899' :
                          order.status === 'completed' ? '#22c55e' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        {
                          order.status === 'new' ? 'Нове' : 
                          order.status === 'preparing' ? 'Підготовка' :
                          order.status === 'printing' ? 'Друкується' :
                          order.status === 'shipping' ? 'Відправка' :
                          order.status === 'completed' ? 'Виконано' : 'Скасовано'
                        }
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Клієнт</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{order.shipping_details?.firstName} {order.shipping_details?.lastName}</div>
                        <div style={{ fontSize: 12, color: '#6b6b8a' }}>{order.shipping_details?.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Доставка</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{order.shipping_method === 'nova_poshta' ? 'Нова Пошта' : 'Самовивіз'}</div>
                        <div style={{ fontSize: 12, color: '#6b6b8a' }}>
                          {order.shipping_details?.city}
                          {order.shipping_details?.warehouse && <div style={{ fontSize: 11, marginTop: 4, color: '#94a3b8' }}>{order.shipping_details.warehouse}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Сума</div>
                        <div style={{ fontSize: 20, fontWeight: 950, color: '#2dd4bf' }}>{order.total} ₴</div>
                        {order.shipping_details?.bonus_used > 0 && (
                          <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, marginTop: 4 }}>
                             🪙 -{order.shipping_details.bonus_used} бонусів
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: order.payment_status === 'paid' ? '#22c55e' : '#f59e0b', fontWeight: 900, marginTop: 4 }}>
                          {order.payment_status === 'paid' ? 'Оплачено' : 'Очікує оплати'}
                        </div>
                      </div>
                    </div>

                    {order.shipping_details?.items && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Товари</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {order.shipping_details.items.map((item, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: 10, fontSize: 12, color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {item.name} x{item.quantity || 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <StatusBtn label="Підготовка" active={order.status === 'preparing'} color="#f59e0b" onClick={() => updateOrderStatus(order.id, 'preparing')} />
                      <StatusBtn label="Друкується" active={order.status === 'printing'} color="#7c3aed" onClick={() => updateOrderStatus(order.id, 'printing')} />
                      <StatusBtn label="Відправка" active={order.status === 'shipping'} color="#ec4899" onClick={() => updateOrderStatus(order.id, 'shipping')} />
                      <StatusBtn label="Виконано" active={order.status === 'completed'} color="#22c55e" onClick={() => updateOrderStatus(order.id, 'completed')} />
                      <StatusBtn label="Скасувати" active={order.status === 'cancelled'} color="#ef4444" onClick={() => updateOrderStatus(order.id, 'cancelled')} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'users' ? (
            <>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Клієнти та Бонуси ({users.length})</h1>
                <button onClick={fetchUsers} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer' }}>Оновити</button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Клієнт</th>
                      <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Телефон</th>
                      <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Бонуси</th>
                      <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', textAlign: 'right' }}>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{user.name}</div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: 13, color: '#fff', fontWeight: 800 }}>{user.telegram_id || '---'}</div>
                          <div style={{ fontSize: 11, color: '#6b6b8a' }}>{user.phone}</div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Coins size={16}/></div>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{user.bonuses || 0}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => awardBonuses(user)}
                              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              Нарахувати
                            </button>
                            <button 
                              onClick={() => deleteUser(user.phone)}
                              style={{ padding: '8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a' }}>
              Тут будуть налаштування магазину
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative', width: '100%', maxWidth: 500, background: '#0a192f', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 24 }}>{editingId ? 'Редагувати товар' : 'Новий товар'}</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 140, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
                  {formData.image_url ? (
                    <>
                      <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button type="button" onClick={() => setFormData({...formData, image_url: ''})} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Upload size={28} style={{ color: '#3b82f6', marginBottom: 8 }} />
                      <p style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 700 }}>Завантажити фото</p>
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Назва</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Базова Ціна (₴)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Знижка (%)</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 34px 14px 14px', color: '#fff', outline: 'none', width: '100%' }} />
                      <Percent size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }} />
                    </div>
                  </div>
                </div>

                {/* ПРЕВ'Ю ФІНАЛЬНОЇ ЦІНИ */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.2)', borderRadius: 16, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b6b8a' }}>Фінальна ціна для клієнта:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{finalPricePreview} ₴</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Категорія</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>3D Модель URL (.glb)</label>
                  <input type="text" value={formData.model_3d} onChange={e => setFormData({...formData, model_3d: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', fontSize: 11 }} />
                </div>

                <button type="submit" style={{ marginTop: 10, padding: 16, borderRadius: 14, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>ЗБЕРЕГТИ ЗМІНИ</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarBtn({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: active ? 'rgba(59,130,246,0.1)' : 'transparent', color: active ? '#3b82f6' : '#6b6b8a', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
      {icon} {label}
    </button>
  );
}

function StatusBtn({ label, active, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 800, 
        background: active ? color : 'rgba(255,255,255,0.02)',
        color: active ? '#fff' : '#6b6b8a',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: active ? `0 4px 12px ${color}40` : 'none'
      }}
    >
      {label}
    </button>
  );
}
