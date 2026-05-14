import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Search, Filter, CheckCircle, 
  ChevronDown, ChevronRight, DollarSign, Package, 
  TrendingUp, Users, Calendar, Edit3, Save, X, Loader2, RefreshCw, MoveHorizontal, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryDashboard({ showToast }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
  const [expandedBatches, setExpandedBatches] = useState({});
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [newBatch, setNewBatch] = useState({ batch_date: new Date().toISOString().split('T')[0], notes: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ batch_id: null, name: '', maker: '', quantity: 1, price_unit: 50, sold_count: 0, paid_amount: 0 });
  const [moveMenu, setMoveMenu] = useState({ open: false, itemId: null, oldBatchId: null, x: 0, y: 0 });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

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
      showToast('Помилка завантаження: ' + (err.message || err.details || 'Невідома помилка'), 'error');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    let totalValue = 0;
    let totalSold = 0;
    let totalPaid = 0;
    let itemsCount = 0;
    let pendingSalesCount = 0;
    let pendingPaymentsCount = 0;
    let makerDebt = {};

    batches.forEach(b => {
      b.inventory_items?.forEach(i => {
        const itemTotalSold = (i.sold_count || 0) * (i.price_unit || 0);
        const itemPaid = Number(i.paid_amount || 0);
        const itemDebt = itemTotalSold - itemPaid;

        totalValue += (i.quantity || 0) * (i.price_unit || 0);
        totalSold += itemTotalSold;
        totalPaid += itemPaid;
        itemsCount += (i.quantity || 0);

        if ((i.quantity || 0) > (i.sold_count || 0)) {
          pendingSalesCount += (i.quantity - i.sold_count);
        }
        if (itemDebt > 0) {
          pendingPaymentsCount += 1;
        }

        if (i.maker) {
          if (!makerDebt[i.maker]) makerDebt[i.maker] = 0;
          makerDebt[i.maker] += itemDebt;
        }
      });
    });

    return { totalValue, totalSold, totalPaid, itemsCount, debt: totalSold - totalPaid, makerDebt, pendingSalesCount, pendingPaymentsCount };
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
    } catch (err) { 
      console.error('Add batch error:', err);
      showToast('Помилка створення партії: ' + (err.message || 'Перевірте SQL запит у Supabase'), 'error'); 
    }
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
    } catch (err) { 
      console.error('Add item error:', err);
      showToast('Помилка додавання: ' + (err.message || 'Перевірте SQL'), 'error'); 
    }
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
    setConfirmModal({
      open: true,
      title: 'Видалити товар?',
      message: 'Цю дію неможливо буде скасувати.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
          if (error) throw error;
          setBatches(batches.map(b => 
            b.id === batchId ? { ...b, inventory_items: b.inventory_items.filter(i => i.id !== itemId) } : b
          ));
          showToast('Видалено');
          setConfirmModal({ ...confirmModal, open: false });
        } catch (err) { showToast('Помилка видалення', 'error'); }
      }
    });
  }

  async function handleDeleteBatch(batchId) {
    setConfirmModal({
      open: true,
      title: 'Видалити партію?',
      message: 'Ви впевнені, що хочете видалити цю порожню партію?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('inventory_batches').delete().eq('id', batchId);
          if (error) throw error;
          setBatches(batches.filter(b => b.id !== batchId));
          showToast('Партію видалено');
          setConfirmModal({ ...confirmModal, open: false });
        } catch (err) { showToast('Помилка видалення', 'error'); }
      }
    });
  }

  async function handleUpdateBatchStatus(batchId, status) {
    try {
      const { error } = await supabase.from('inventory_batches').update({ status }).eq('id', batchId);
      if (error) throw error;
      setBatches(batches.map(b => b.id === batchId ? { ...b, status } : b));
      showToast(status === 'archived' ? 'Партію архівовано' : 'Партію відновлено');
    } catch (err) { showToast('Помилка оновлення статусу', 'error'); }
  }

  async function handleMoveItem(itemId, oldBatchId, newBatchId) {
    if (!newBatchId) return;
    try {
      const { error } = await supabase.from('inventory_items').update({ batch_id: newBatchId }).eq('id', itemId);
      if (error) throw error;
      
      const itemToMove = batches.find(b => b.id === oldBatchId)?.inventory_items?.find(i => i.id === itemId);
      
      setBatches(batches.map(b => {
        if (b.id === oldBatchId) return { ...b, inventory_items: b.inventory_items.filter(i => i.id !== itemId) };
        if (b.id === newBatchId) return { ...b, inventory_items: [...(b.inventory_items || []), itemToMove] };
        return b;
      }));
      setMoveMenu({ open: false, itemId: null, oldBatchId: null, x: 0, y: 0 });
      showToast('Товар перенесено');
    } catch (err) { showToast('Помилка перенесення', 'error'); }
  }

  const printBatch = (batch) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = batch.inventory_items?.map(i => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">${i.name}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity} шт.</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center;">${i.price_unit} ₴</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right;">${i.quantity * i.price_unit} ₴</td>
      </tr>
    `).join('');

    const total = batch.inventory_items?.reduce((acc, i) => acc + (i.quantity * i.price_unit), 0);
    const invoiceNum = `${new Date(batch.batch_date).getTime().toString().slice(-6)}${batch.id.slice(0,2).toUpperCase()}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Накладна №${invoiceNum}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; }
            .store-name { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
            .batch-info { color: #666; font-size: 14px; margin-top: 5px; }
            .invoice-details { text-align: right; }
            .invoice-label { font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; }
            .invoice-number { font-size: 20px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { text-align: left; padding: 15px 10px; border-bottom: 2px solid #1a1a1a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
            td { font-size: 14px; }
            .total-row { margin-top: 40px; text-align: right; padding-top: 20px; border-top: 2px solid #1a1a1a; }
            .total-label { font-size: 14px; color: #666; font-weight: 700; text-transform: uppercase; }
            .total-amount { font-size: 24px; font-weight: 900; margin-top: 5px; }
            @media print { body { padding: 20px; } .header { border-bottom-width: 2px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="store-name">СІМЕЙНА ДРУКАРНЯ</div>
              <div class="batch-info">Партія від: ${new Date(batch.batch_date).toLocaleDateString('uk-UA')}</div>
              <div class="batch-info">${batch.notes || ''}</div>
            </div>
            <div class="invoice-details">
              <div class="invoice-label">Накладна</div>
              <div class="invoice-number">№${invoiceNum}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%">Найменування товару</th>
                <th style="text-align: center">Кількість</th>
                <th style="text-align: center">Ціна за од.</th>
                <th style="text-align: right">Сума</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-row">
            <div class="total-label">Разом до сплати</div>
            <div class="total-amount">${total} ₴</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredBatches = batches.filter(b => b.status === activeTab || (!b.status && activeTab === 'active'));

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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Очікує продажу: <span style={{ color: '#fff', fontWeight: 800 }}>{stats.pendingSalesCount}</span> шт.
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 28, fontWeight: 950, color: '#fbbf24' }}>{stats.debt} <span style={{ fontSize: 16 }}>₴</span></div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(stats.makerDebt).map(([maker, debt]) => (
              debt > 0 && (
                <div key={maker} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{maker}:</span>
                  <span style={{ fontWeight: 800, color: '#fbbf24' }}>{debt} ₴</span>
                </div>
              )
            ))}
            {stats.debt === 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: 100, fontSize: 10, fontWeight: 900, border: '1px solid rgba(34,197,94,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <CheckCircle2 size={12} /> Боргів немає
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Оплачено: <span style={{ color: '#fff' }}>{stats.totalPaid} ₴</span></span>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              background: stats.pendingPaymentsCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', 
              color: stats.pendingPaymentsCount > 0 ? '#f59e0b' : '#22c55e',
              padding: '4px 10px', borderRadius: 8, fontWeight: 900, fontSize: 9,
              border: stats.pendingPaymentsCount > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(34,197,94,0.2)',
              textTransform: 'uppercase'
            }}>
              {stats.pendingPaymentsCount > 0 ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
              {stats.pendingPaymentsCount} неопл. тов.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Archive */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: activeTab === 'active' ? '#7c3aed' : 'transparent', color: activeTab === 'active' ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
        >
          АКТИВНІ
        </button>
        <button 
          onClick={() => setActiveTab('archived')}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: activeTab === 'archived' ? '#4a4a6a' : 'transparent', color: activeTab === 'archived' ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
        >
          АРХІВ
        </button>
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
        {filteredBatches.map(batch => {
          const isFullyDone = batch.inventory_items?.every(i => (i.sold_count >= i.quantity) && (i.paid_amount >= (i.sold_count * i.price_unit)));
          
          return (
          <div key={batch.id} style={{ background: 'var(--bg-card)', borderRadius: 24, border: batch.status === 'archived' ? '1px solid rgba(255,255,255,0.02)' : '1px solid var(--border)', overflow: 'hidden', opacity: batch.status === 'archived' ? 0.7 : 1 }}>
            {/* Batch Header */}
            <div 
              onClick={() => toggleBatch(batch.id)}
              style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedBatches[batch.id] ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isFullyDone ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)', color: isFullyDone ? '#22c55e' : '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isFullyDone ? <CheckCircle size={20} /> : <Calendar size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {new Date(batch.batch_date).toLocaleDateString('uk-UA')}
                    {isFullyDone && batch.status !== 'archived' && (
                      <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>ГОТОВО ДО АРХІВУ ✅</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{batch.notes || 'Без нотаток'} • {batch.inventory_items?.length || 0} позицій</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <button 
                   onClick={(e) => { e.stopPropagation(); printBatch(batch); }}
                   style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   title="Друкувати накладну"
                >
                  <Printer size={18} />
                </button>

                {batch.status === 'active' ? (
                   <button 
                      disabled={!isFullyDone}
                      onClick={(e) => { e.stopPropagation(); handleUpdateBatchStatus(batch.id, 'archived'); }}
                      style={{ 
                        padding: '8px 16px', borderRadius: 10, 
                        background: isFullyDone ? '#22c55e' : 'rgba(255,255,255,0.05)', 
                        color: isFullyDone ? '#fff' : 'rgba(255,255,255,0.2)', 
                        border: 'none', fontSize: 10, fontWeight: 900, 
                        cursor: isFullyDone ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s'
                      }}
                    >
                      {isFullyDone ? 'В АРХІВ' : 'АРХІВУВАТИ'}
                    </button>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpdateBatchStatus(batch.id, 'active'); }}
                    style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
                  >
                    ВІДНОВИТИ
                  </button>
                )}
                
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a' }}>СУМА</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{batch.inventory_items?.reduce((acc, i) => acc + (i.quantity * i.price_unit), 0)} ₴</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {batch.inventory_items?.length === 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id); }}
                      style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {expandedBatches[batch.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
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
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                <div style={{ position: 'relative' }}>
                                  <button 
                                    onClick={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setMoveMenu({ 
                                        open: true, 
                                        itemId: item.id, 
                                        oldBatchId: batch.id,
                                        x: rect.left - 200, 
                                        y: rect.top + 40 
                                      });
                                    }}
                                    style={{ border: 'none', background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(139,92,246,0.1)' }}
                                  >
                                    <MoveHorizontal size={12} /> ПЕРЕНЕСТИ
                                  </button>
                                </div>
                                <button onClick={() => handleDeleteItem(batch.id, item.id)} style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, padding: 6, cursor: 'pointer' }}><Trash2 size={14}/></button>
                              </div>
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
        )})}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#0f172a', borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Trash2 size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{confirmModal.title}</h3>
              <p style={{ color: '#6b6b8a', fontSize: 14, marginBottom: 32 }}>{confirmModal.message}</p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: 14, borderRadius: 14, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>ТАК, ВИДАЛИТИ</button>
                <button onClick={() => setConfirmModal({ ...confirmModal, open: false })} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>СКАСУВАТИ</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Move Menu */}
      <AnimatePresence>
        {moveMenu.open && (
          <>
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
              onClick={() => setMoveMenu({ ...moveMenu, open: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              style={{ 
                position: 'fixed', left: moveMenu.x, top: moveMenu.y, 
                width: 250, background: '#1e293b', borderRadius: 16, 
                border: '1px solid rgba(255,255,255,0.1)', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000,
                padding: '8px', overflow: 'hidden', backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                Перенести в партію:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto' }} className="hide-scrollbar">
                {batches
                  .filter(b => b.id !== moveMenu.oldBatchId && b.status !== 'archived')
                  .map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleMoveItem(moveMenu.itemId, moveMenu.oldBatchId, b.id)}
                      style={{ 
                        width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', 
                        background: 'transparent', color: '#e2e8f0', textAlign: 'left', 
                        cursor: 'pointer', transition: 'all 0.2s', fontSize: 12, fontWeight: 700,
                        display: 'flex', flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>{new Date(b.batch_date).toLocaleDateString('uk-UA')}</span>
                      {b.notes && <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{b.notes.slice(0, 25)}</span>}
                    </button>
                  ))}
                {batches.filter(b => b.id !== moveMenu.oldBatchId && b.status !== 'archived').length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                    Немає інших активних партій
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
