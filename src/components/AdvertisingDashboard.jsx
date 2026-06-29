import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Search, Filter, CheckCircle, 
  DollarSign, Package, TrendingUp, Calendar, Edit3, X, Loader2, RefreshCw, AlertCircle, Megaphone, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvertisingDashboard({ showToast }) {
  const [ads, setAds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Всі');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [quickRevenueModal, setQuickRevenueModal] = useState({ open: false, adId: null, currentRevenue: 0, addAmount: '' });
  
  const [formData, setFormData] = useState({
    platform: 'Instagram',
    custom_platform: '',
    product_id: '',
    cost: '',
    revenue: '',
    ad_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const platformsList = ['Instagram', 'Facebook', 'Telegram', 'TikTok', 'Google', 'YouTube', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch ads
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('*')
        .order('ad_date', { ascending: false });

      if (adsError) {
        // Table might not exist yet
        throw adsError;
      }

      setAds(adsData || []);

      // Fetch products to link to
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      
      if (!productsError) {
        setProducts(productsData || []);
      }
    } catch (err) {
      console.error('Error fetching ads data:', err);
      showToast('Помилка: переконайтеся, що таблиця advertisements створена в Supabase', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    
    ads.forEach(ad => {
      totalCost += parseFloat(ad.cost || 0);
      totalRevenue += parseFloat(ad.revenue || 0);
    });

    const totalProfit = totalRevenue - totalCost;
    const romi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      totalProfit,
      romi
    };
  }, [ads]);

  // Unique platforms for filtering
  const uniquePlatforms = useMemo(() => {
    const list = ads.map(a => a.platform).filter(Boolean);
    return ['Всі', ...new Set(list)];
  }, [ads]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchPlatform = platformFilter === 'Всі' || ad.platform === platformFilter;
      
      const prodName = ad.product_name || '';
      const notes = ad.notes || '';
      const query = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' || 
        prodName.toLowerCase().includes(query) || 
        notes.toLowerCase().includes(query) || 
        ad.platform.toLowerCase().includes(query);

      return matchPlatform && matchSearch;
    });
  }, [ads, platformFilter, searchQuery]);

  // Handle submit (create or update)
  async function handleSubmit(e) {
    e.preventDefault();
    
    const finalPlatform = formData.platform === 'Other' 
      ? (formData.custom_platform || 'Other') 
      : formData.platform;

    let selectedProductName = 'Загальна реклама магазину';
    if (formData.product_id) {
      const found = products.find(p => p.id === formData.product_id);
      if (found) {
        selectedProductName = found.name;
      }
    }

    const payload = {
      platform: finalPlatform,
      product_id: formData.product_id ? formData.product_id : null,
      product_name: selectedProductName,
      cost: parseFloat(formData.cost) || 0,
      revenue: parseFloat(formData.revenue) || 0,
      ad_date: formData.ad_date,
      notes: formData.notes
    };

    try {
      if (editingAd) {
        // Update
        const { error } = await supabase
          .from('advertisements')
          .update(payload)
          .eq('id', editingAd.id);

        if (error) throw error;
        showToast('Рекламу оновлено');
        setEditingAd(null);
      } else {
        // Create
        const { error } = await supabase
          .from('advertisements')
          .insert([payload]);

        if (error) throw error;
        showToast('Рекламу додано');
      }

      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Помилка збереження реклами', 'error');
    }
  }

  function resetForm() {
    setFormData({
      platform: 'Instagram',
      custom_platform: '',
      product_id: '',
      cost: '',
      revenue: '',
      ad_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  }

  // Open edit form
  function handleEdit(ad) {
    setEditingAd(ad);
    const isStandardPlatform = platformsList.includes(ad.platform);
    
    setFormData({
      platform: isStandardPlatform ? ad.platform : 'Other',
      custom_platform: isStandardPlatform ? '' : ad.platform,
      product_id: ad.product_id || '',
      cost: ad.cost.toString(),
      revenue: ad.revenue.toString(),
      ad_date: ad.ad_date,
      notes: ad.notes || ''
    });
    setShowAddForm(true);
  }

  // Quick add revenue
  async function handleQuickRevenueSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(quickRevenueModal.addAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newRevenue = parseFloat(quickRevenueModal.currentRevenue) + amount;

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ revenue: newRevenue })
        .eq('id', quickRevenueModal.adId);

      if (error) throw error;
      showToast(`Додано +${amount} ₴ до прибутку`);
      setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Помилка оновлення прибутку', 'error');
    }
  }

  // Delete ad campaign
  async function handleDelete(adId) {
    if (!window.confirm('Ви впевнені, що хочете видалити цей запис реклами?')) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      showToast('Запис видалено');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Помилка видалення', 'error');
    }
  }

  return (
    <div style={{ color: 'var(--text-main)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 950, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Megaphone size={32} style={{ color: '#ec4899' }} /> Кабінет Реклами
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Контроль рентабельності рекламних кампаній та маркетингу</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => {
              setEditingAd(null);
              resetForm();
              setShowAddForm(true);
            }}
            style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #7c3aed)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(236,72,153,0.2)' }}
          >
            <Plus size={18} /> ДОДАТИ РЕКЛАМУ
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Spent */}
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Витрачено на рекламу</div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{stats.totalCost.toFixed(0)} <span style={{ fontSize: 16, color: '#ef4444' }}>₴</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Загальний бюджет реклами</div>
        </div>

        {/* Revenue */}
        <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(20,184,166,0.1))', padding: 24, borderRadius: 24, border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Отриманий дохід</div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>{stats.totalRevenue.toFixed(0)} <span style={{ fontSize: 16, color: '#4ade80' }}>₴</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Сума продажів з реклами</div>
        </div>

        {/* Profit */}
        <div style={{ 
          background: stats.totalProfit >= 0 
            ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))' 
            : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(153,27,27,0.1))', 
          padding: 24, 
          borderRadius: 24, 
          border: stats.totalProfit >= 0 ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(239,68,68,0.2)' 
        }}>
          <div style={{ color: stats.totalProfit >= 0 ? '#3b82f6' : '#ef4444', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Чистий прибуток</div>
          <div style={{ fontSize: 28, fontWeight: 950, color: stats.totalProfit >= 0 ? '#fff' : '#ef4444' }}>
            {stats.totalProfit.toFixed(0)} <span style={{ fontSize: 16 }}>₴</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Дохід мінус витрати</div>
        </div>

        {/* ROMI */}
        <div style={{ 
          background: stats.romi >= 0 
            ? 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))' 
            : 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.1))', 
          padding: 24, 
          borderRadius: 24, 
          border: stats.romi >= 0 ? '1px solid rgba(168,85,247,0.2)' : '1px solid rgba(249,115,22,0.2)' 
        }}>
          <div style={{ color: stats.romi >= 0 ? '#c084fc' : '#f97316', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Рентабельність (ROMI)</div>
          <div style={{ fontSize: 28, fontWeight: 950, color: stats.romi >= 0 ? '#4ade80' : '#f97316' }}>
            {stats.romi >= 0 ? `+${stats.romi.toFixed(1)}%` : `${stats.romi.toFixed(1)}%`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Окупність маркетингових витрат</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {uniquePlatforms.map(plat => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: platformFilter === plat ? '#ec4899' : 'var(--bg-card)',
                color: platformFilter === plat ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
            >
              {plat.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', width: 280 }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Пошук товару чи опису..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
        </div>
      </div>

      {/* Ads List */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДАТА</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ПЛАТФОРМА</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ТОВАР</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ВИТРАТИ</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ПРОДАЖІ (ДОХІД)</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ПРИБУТОК</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ROMI</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>НОТАТКИ</th>
                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДІЇ</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                    Рекламних кампаній не знайдено. Натисніть "Додати рекламу", щоб створити перший запис.
                  </td>
                </tr>
              ) : (
                filteredAds.map(ad => {
                  const adCost = parseFloat(ad.cost || 0);
                  const adRev = parseFloat(ad.revenue || 0);
                  const adProfit = adRev - adCost;
                  const adRomi = adCost > 0 ? (adProfit / adCost) * 100 : 0;

                  return (
                    <tr key={ad.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      {/* Date */}
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700 }}>
                        {new Date(ad.ad_date).toLocaleDateString('uk-UA')}
                      </td>
                      {/* Platform */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 900, 
                          color: ad.platform.toLowerCase() === 'instagram' ? '#f43f5e' : 
                                 ad.platform.toLowerCase() === 'facebook' ? '#3b82f6' :
                                 ad.platform.toLowerCase() === 'telegram' ? '#0ea5e9' :
                                 ad.platform.toLowerCase() === 'tiktok' ? '#00f2fe' : '#fff',
                          background: 'rgba(255,255,255,0.05)',
                          padding: '4px 8px',
                          borderRadius: 8
                        }}>
                          {ad.platform}
                        </span>
                      </td>
                      {/* Product */}
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ad.product_name}
                      </td>
                      {/* Cost */}
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#ef4444' }}>
                        {adCost.toFixed(0)} ₴
                      </td>
                      {/* Revenue */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#4ade80' }}>
                            {adRev.toFixed(0)} ₴
                          </span>
                          <button 
                            onClick={() => setQuickRevenueModal({ open: true, adId: ad.id, currentRevenue: adRev, addAmount: '' })}
                            style={{ 
                              border: 'none', background: 'rgba(34,197,94,0.1)', color: '#4ade80', 
                              borderRadius: 6, width: 22, height: 22, cursor: 'pointer', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 
                            }}
                            title="Швидко додати суму продажу"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {/* Profit */}
                      <td style={{ 
                        padding: '16px 20px', textAlign: 'center', fontSize: 13, fontWeight: 800,
                        color: adProfit >= 0 ? '#4ade80' : '#ef4444'
                      }}>
                        {adProfit >= 0 ? `+${adProfit.toFixed(0)}` : adProfit.toFixed(0)} ₴
                      </td>
                      {/* ROMI */}
                      <td style={{ 
                        padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 900,
                        color: adRomi >= 0 ? '#4ade80' : '#f97316'
                      }}>
                        {adRomi >= 0 ? `+${adRomi.toFixed(0)}%` : `${adRomi.toFixed(0)}%`}
                      </td>
                      {/* Notes */}
                      <td style={{ 
                        padding: '16px 20px', fontSize: 12, color: 'var(--text-muted)', 
                        maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                      }} title={ad.notes}>
                        {ad.notes || '---'}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleEdit(ad)}
                            style={{ border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer' }}
                            title="Редагувати"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(ad.id)}
                            style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, padding: 6, cursor: 'pointer' }}
                            title="Видалити"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              style={{ background: '#0a192f', borderRadius: 32, padding: 32, width: '100%', maxWidth: 480, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>{editingAd ? 'Редагувати рекламу' : 'Нова реклама'}</h2>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Platform */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Платформа / Сервіс</label>
                  <select 
                    value={formData.platform} 
                    onChange={e => setFormData({...formData, platform: e.target.value})} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                  >
                    {platformsList.map(p => (
                      <option key={p} value={p} style={{ background: '#0a192f' }}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Platform */}
                {formData.platform === 'Other' && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Власна назва сервісу</label>
                    <input 
                      type="text" 
                      placeholder="Наприклад: Блогер Тарас" 
                      value={formData.custom_platform} 
                      onChange={e => setFormData({...formData, custom_platform: e.target.value})} 
                      required
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                )}

                {/* Target Product */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Товар для реклами</label>
                  <select 
                    value={formData.product_id} 
                    onChange={e => setFormData({...formData, product_id: e.target.value})} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                  >
                    <option value="" style={{ background: '#0a192f' }}>Загальна реклама магазину</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#0a192f' }}>{p.name} ({p.price} ₴)</option>
                    ))}
                  </select>
                </div>

                {/* Cost & Revenue */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Вартість реклами (₴)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0"
                      value={formData.cost} 
                      onChange={e => setFormData({...formData, cost: e.target.value})} 
                      required
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Сума продажів (₴)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0"
                      value={formData.revenue} 
                      onChange={e => setFormData({...formData, revenue: e.target.value})} 
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Дата розміщення</label>
                  <input 
                    type="date" 
                    value={formData.ad_date} 
                    onChange={e => setFormData({...formData, ad_date: e.target.value})} 
                    required
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Нотатки / Посилання</label>
                  <textarea 
                    placeholder="Наприклад: Сторіз у блогера про Lego Crane..." 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none', minHeight: 80, resize: 'none' }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button 
                    type="submit" 
                    style={{ flex: 1, padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #7c3aed)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                  >
                    ЗБЕРЕГТИ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                  >
                    СКАСУВАТИ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Revenue Modal */}
      <AnimatePresence>
        {quickRevenueModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              style={{ background: '#0a192f', borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900 }}>Додати суму продажу</h3>
                <button 
                  onClick={() => setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' })} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleQuickRevenueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Поточний дохід від цієї реклами: <strong style={{ color: '#4ade80' }}>{quickRevenueModal.currentRevenue} ₴</strong></div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Сума нового продажу (₴)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Введіть суму, наприклад: 450" 
                    value={quickRevenueModal.addAmount} 
                    onChange={e => setQuickRevenueModal({...quickRevenueModal, addAmount: e.target.value})} 
                    required
                    autoFocus
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    type="submit" 
                    style={{ flex: 1, padding: 12, borderRadius: 12, background: '#4ade80', color: '#020b18', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                  >
                    ДОДАТИ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' })} 
                    style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                  >
                    СКАСУВАТИ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
