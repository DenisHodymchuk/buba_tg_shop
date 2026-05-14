import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Search, Filter, CheckCircle, 
  ChevronDown, ChevronRight, DollarSign, Package, 
  TrendingUp, Users, Calendar, Edit3, Save, X, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryDashboard({ showToast }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatches, setExpandedBatches] = useState({});
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [newBatch, setNewBatch] = useState({ batch_date: new Date().toISOString().split('T')[0], notes: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ batch_id: null, name: '', maker: '', quantity: 1, price_unit: 50, sold_count: 0, paid_amount: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: bData, error: bError } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          inventory_items (*)
        `)
        .order('batch_date', { ascending: false });
      
      if (bError) throw bError;
      setBatches(bData || []);
      
      // Auto-expand the most recent batch
      if (bData?.length > 0) {
        setExpandedBatches({ [bData[0].id]: true });
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      showToast('Помилка завантаження даних', 'error');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalSold = 0;
    let totalPaid = 0;
    let itemsCount = 0;

    batches.forEach(b => {
      b.inventory_items?.forEach(i => {
        totalValue += i.quantity * i.price_unit;
        totalSold += i.sold_count * i.price_unit;
        totalPaid += Number(i.paid_amount || 0);
        itemsCount += i.quantity;
      });
    });

    return { totalValue, totalSold, totalPaid, itemsCount, debt: totalSold - totalPaid };
  }, [batches]);

  const toggleBatch = (id) => {
    setExpandedBatches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleAddBatch() {
    try {
      const { data, error } = await supabase.from('inventory_batches').insert([newBatch]).select();
      if (error) throw error;
      setBatches([ { ...data[0], inventory_items: [] }, ...batches]);
      setShowBatchForm(false);
      showToast('Партію створено');
    } catch (err) { showToast('Помилка створення партії', 'error'); }
  }

  async function handleAddItem(batchId) {
    try {
      const itemToSave = { ...newItem, batch_id: batchId };
      const { data, error } = await supabase.from('inventory_items').insert([itemToSave]).select();
      if (error) throw error;
      
      setBatches(batches.map(b => 
        b.id === batchId ? { ...b, inventory_items: [...(b.inventory_items || []), data[0]] } : b
      ));
      setNewItem({ batch_id: null, name: '', maker: '', quantity: 1, price_unit: 50, sold_count: 0, paid_amount: 0 });
      showToast('Товар додано');
    } catch (err) { showToast('Помилка додавання товару', 'error'); }
  }

  async function handleUpdateItem(item) {
    try {
      const { error } = await supabase.from('inventory_items').update(item).eq('id', item.id);
      if (error) throw error;
      setBatches(batches.map(b => ({
        ...b,
        inventory_items: b.inventory_items?.map(i => i.id === item.id ? item : i)
      })));
      setEditingItem(null);
      showToast('Оновлено');
    } catch (err) { showToast('Помилка оновлення', 'error'); }
  }

  async function handleDeleteItem(batchId, itemId) {
    if (!confirm('Видалити цей товар?')) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
      if (error) throw error;
      setBatches(batches.map(b => 
        b.id === batchId ? { ...b, inventory_items: b.inventory_items.filter(i => i.id !== itemId) } : b
      ));
      showToast('Видалено');
    } catch (err) { showToast('Помилка видалення', 'error'); }
  }

  return (
    <div style={{ color: 'var(--text-main)' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 950, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Package size={32} style={{ color: '#7c3aed' }} /> Склад та Реалізація
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Облік товарів у магазинах та виплати майстрам</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setShowBatchForm(true)}
            style={{ padding: '12px 24px', borderRadius: 14, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(124,58,237,0.2)' }}
          >
            <Plus size={18} /> НОВА ПАРТІЯ
          </button>
          <button 
            onClick={fetchData}
            style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(124,58,237,0.2)' }}>
          <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Загальна вартість</div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{stats.totalValue} <span style={{ fontSize: 16, color: '#a78bfa' }}>₴</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{stats.itemsCount} одиниць товару</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(20,184,166,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Продано на суму</div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{stats.totalSold} <span style={{ fontSize: 16, color: '#4ade80' }}>₴</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Сума реалізованого товару</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Борг майстрам</div>
          <div style={{ fontSize: 28, fontWeight: 950, color: '#fbbf24' }}>{stats.debt} <span style={{ fontSize: 16 }}>₴</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Оплачено: {stats.totalPaid} ₴</div>
        </div>
      </div>

      {/* Batch Form Modal */}
      <AnimatePresence>
        {showBatchForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#0f172a', borderRadius: 32, padding: 32, width: '100%', maxWidth: 450, border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 24 }}>Нова партія</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', display: 'block', marginBottom: 8 }}>ДАТА ПАРТІЇ</label>
                  <input type="date" value={newBatch.batch_date} onChange={e => setNewBatch({...newBatch, batch_date: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', display: 'block', marginBottom: 8 }}>НОТАТКИ</label>
                  <textarea placeholder="Наприклад: Поставка в ТЦ 'Метро'" value={newBatch.notes} onChange={e => setNewBatch({...newBatch, notes: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff', minHeight: 100 }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button onClick={handleAddBatch} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>СТВОРИТИ</button>
                  <button onClick={() => setShowBatchForm(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>СКАСУВАТИ</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {batches.map(batch => (
          <div key={batch.id} style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Batch Header */}
            <div 
              onClick={() => toggleBatch(batch.id)}
              style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedBatches[batch.id] ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{new Date(batch.batch_date).toLocaleDateString('uk-UA')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{batch.notes || 'Без нотаток'} • {batch.inventory_items?.length || 0} позицій</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a' }}>СУМА ПАРТІЇ</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{batch.inventory_items?.reduce((acc, i) => acc + (i.quantity * i.price_unit), 0)} ₴</div>
                </div>
                {expandedBatches[batch.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            </div>

            {/* Batch Content */}
            <AnimatePresence>
              {expandedBatches[batch.id] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ТОВАР</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ВИРОБНИК</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>К-СТЬ</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ЦІНА</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ПРОДАНО</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ЗАЛИШОК</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ОПЛАЧЕНО</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДІЇ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.inventory_items?.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ fontSize: 13, fontWeight: 800 }}>{item.name}</div>
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{item.maker}</div>
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantity}</td>
                            <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.price_unit} ₴</td>
                            <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: '#4ade80' }}>{item.sold_count}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <button onClick={() => handleUpdateItem({ ...item, sold_count: Math.min(item.quantity, item.sold_count + 1) })} style={{ border: 'none', background: 'none', color: '#6b6b8a', cursor: 'pointer', padding: 0 }}><ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} /></button>
                                  <button onClick={() => handleUpdateItem({ ...item, sold_count: Math.max(0, item.sold_count - 1) })} style={{ border: 'none', background: 'none', color: '#6b6b8a', cursor: 'pointer', padding: 0 }}><ChevronDown size={12} /></button>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: (item.quantity - item.sold_count) === 0 ? '#ef4444' : '#fff' }}>
                                {item.quantity - item.sold_count}
                              </span>
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                              <div 
                                onClick={() => {
                                  const newVal = item.paid_amount >= (item.sold_count * item.price_unit) ? 0 : (item.sold_count * item.price_unit);
                                  handleUpdateItem({ ...item, paid_amount: newVal });
                                }}
                                style={{ 
                                  fontSize: 10, fontWeight: 900, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'inline-block',
                                  background: item.paid_amount >= (item.sold_count * item.price_unit) && item.sold_count > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                  color: item.paid_amount >= (item.sold_count * item.price_unit) && item.sold_count > 0 ? '#22c55e' : '#f59e0b'
                                }}
                              >
                                {item.paid_amount >= (item.sold_count * item.price_unit) && item.sold_count > 0 ? 'ОПЛАЧЕНО' : `${item.paid_amount} ₴`}
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteItem(batch.id, item.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                        {/* Add Item Row */}
                        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '14px 8px' }}>
                            <input placeholder="Назва товару..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: '#fff', fontSize: 12 }} />
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <input placeholder="Хто зробив..." value={newItem.maker} onChange={e => setNewItem({...newItem, maker: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: '#fff', fontSize: 12 }} />
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} style={{ width: 50, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: '#fff', fontSize: 12, textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <input type="number" value={newItem.price_unit} onChange={e => setNewItem({...newItem, price_unit: parseInt(e.target.value) || 0})} style={{ width: 60, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: '#fff', fontSize: 12, textAlign: 'center' }} />
                          </td>
                          <td colSpan={3}></td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            <button onClick={() => handleAddItem(batch.id)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>ДОДАТИ</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
