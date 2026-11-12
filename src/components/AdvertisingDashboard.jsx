// Hallmark Dusk Theme — AdvertisingDashboard
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Search, Edit3, X, RefreshCw, Megaphone, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvertisingDashboard({ showToast }) {
  const [ads, setAds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Всі');
  const [roiFilter, setRoiFilter] = useState('all'); // 'all' | 'profitable' | 'loss' | 'shop_budget' | 'personal_budget'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [quickRevenueModal, setQuickRevenueModal] = useState({ open: false, adId: null, currentRevenue: 0, addAmount: '' });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    platform: 'Instagram',
    custom_platform: '',
    product_id: '',
    cost: '',
    revenue: '',
    budget_source: 'Особисті кошти',
    ad_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const platformsList = ['Instagram', 'Facebook', 'Telegram', 'TikTok', 'Google', 'YouTube', 'OLX', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('*')
        .order('ad_date', { ascending: false });

      if (adsError) throw adsError;
      setAds(adsData || []);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      
      if (!productsError) {
        setProducts(productsData || []);
      }
    } catch (err) {
      console.error('Error fetching ads data:', err);
      showToast?.('Помилка завантаження рекламних кампаній', 'error');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    let personalCost = 0;
    let shopCost = 0;
    
    ads.forEach(ad => {
      const cost = parseFloat(ad.cost || 0);
      totalCost += cost;
      totalRevenue += parseFloat(ad.revenue || 0);
      
      if (ad.budget_source === 'Кошти друкарні') {
        shopCost += cost;
      } else {
        personalCost += cost;
      }
    });

    const totalProfit = totalRevenue - totalCost;
    const romi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      totalProfit,
      romi,
      personalCost,
      shopCost
    };
  }, [ads]);

  const uniquePlatforms = useMemo(() => {
    const list = ads.map(a => a.platform).filter(Boolean);
    return ['Всі', ...new Set(list)];
  }, [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchPlatform = platformFilter === 'Всі' || ad.platform === platformFilter;
      
      const prodName = ad.product_name || '';
      const notes = ad.notes || '';
      const query = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' || 
        prodName.toLowerCase().includes(query) || 
        notes.toLowerCase().includes(query) || 
        (ad.platform || '').toLowerCase().includes(query);

      const adCost = parseFloat(ad.cost || 0);
      const adRev = parseFloat(ad.revenue || 0);
      const adProfit = adRev - adCost;

      if (roiFilter === 'profitable' && adProfit <= 0) return false;
      if (roiFilter === 'loss' && adProfit >= 0) return false;
      if (roiFilter === 'shop_budget' && ad.budget_source !== 'Кошти друкарні') return false;
      if (roiFilter === 'personal_budget' && ad.budget_source === 'Кошти друкарні') return false;

      return matchPlatform && matchSearch;
    });
  }, [ads, platformFilter, searchQuery, roiFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    const finalPlatform = formData.platform === 'Other' 
      ? (formData.custom_platform || 'Other') 
      : formData.platform;

    let selectedProductName = 'Загальна реклама магазину';
    if (formData.product_id) {
      const found = products.find(p => String(p.id) === String(formData.product_id));
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
      budget_source: formData.budget_source || 'Особисті кошти',
      ad_date: formData.ad_date,
      notes: formData.notes
    };

    try {
      if (editingAd) {
        const { error } = await supabase
          .from('advertisements')
          .update(payload)
          .eq('id', editingAd.id);

        if (error) throw error;
        showToast?.('Рекламу оновлено');
        setEditingAd(null);
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert([payload]);

        if (error) throw error;
        showToast?.('Рекламу додано');
      }

      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showToast?.('Помилка збереження реклами', 'error');
    }
  }

  function resetForm() {
    setFormData({
      platform: 'Instagram',
      custom_platform: '',
      product_id: '',
      cost: '',
      revenue: '',
      budget_source: 'Особисті кошти',
      ad_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  }

  function handleEdit(ad) {
    setEditingAd(ad);
    const isStandardPlatform = platformsList.includes(ad.platform);
    
    setFormData({
      platform: isStandardPlatform ? ad.platform : 'Other',
      custom_platform: isStandardPlatform ? '' : ad.platform,
      product_id: ad.product_id || '',
      cost: ad.cost?.toString() || '0',
      revenue: ad.revenue?.toString() || '0',
      budget_source: ad.budget_source || 'Особисті кошти',
      ad_date: ad.ad_date,
      notes: ad.notes || ''
    });
    setShowAddForm(true);
  }

  async function handleQuickRevenueSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(quickRevenueModal.addAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newRevenue = parseFloat(quickRevenueModal.currentRevenue || 0) + amount;

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ revenue: newRevenue })
        .eq('id', quickRevenueModal.adId);

      if (error) throw error;
      showToast?.(`Додано +${amount} ₴ до доходу кампанії`);
      setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast?.('Помилка оновлення доходу', 'error');
    }
  }

  async function handleDelete(adId) {
    if (!window.confirm('Ви впевнені, що хочете видалити цей запис реклами?')) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      showToast?.('Запис видалено');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast?.('Помилка видалення', 'error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      
      {/* Dusk Glass Header & Filter Command Bar */}
      <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div>
            <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>
              Кабінет реклами та маркетингу
            </h1>
            <p className="dusk-subheading" style={{ marginTop: 2 }}>
              Облік рекламних бюджетів, окупність кампаній (ROMI) та атрибуція доходу по каналах
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Пошук товару, блогера, нотатки…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dusk-input"
                style={{ paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, height: 34, fontSize: 12.5, borderRadius: 999 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchData}
              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              style={{ height: 34, padding: '0 10px' }}
              title="Оновити"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingAd(null);
                resetForm();
                setShowAddForm(true);
              }}
              className="dusk-btn dusk-btn--primary"
              style={{ height: 34 }}
            >
              <Plus size={15} />
              <span>Додати рекламу</span>
            </button>
          </div>
        </div>

        {/* Dusk Ruled Tally — 4 Key Marketing Figures */}
        <div
          className="dusk-tally"
          style={{
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            borderTop: '1px solid var(--color-rule)',
            borderBottom: '1px solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            borderRadius: 10
          }}
        >
          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Витрачено на рекламу</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-accent-2)' }}>
              {stats.totalCost.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">
              Особ: {stats.personalCost.toFixed(0)} ₴ · Друк: {stats.shopCost.toFixed(0)} ₴
            </span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Отриманий дохід</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-accent)' }}>
              {stats.totalRevenue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">Сума продажів з реклами</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Чистий результат</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: stats.totalProfit >= 0 ? 'var(--color-ink)' : 'var(--color-danger)' }}>
              {stats.totalProfit >= 0 ? `+${stats.totalProfit.toFixed(0)}` : stats.totalProfit.toFixed(0)} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">Дохід мінус рекламний бюджет</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Окупність (ROMI)</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: stats.romi >= 0 ? 'var(--color-accent)' : 'var(--color-accent-2)' }}>
              {stats.romi >= 0 ? `+${stats.romi.toFixed(1)}%` : `${stats.romi.toFixed(1)}%`}
            </div>
            <span className="dusk-tally__sub">Рентабельність інвестицій</span>
          </div>
        </div>

        {/* Platform Pipeline + ROI Facet Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="dusk-pipeline hide-scrollbar">
            {uniquePlatforms.map(plat => {
              const active = platformFilter === plat;
              const count = plat === 'Всі' ? ads.length : ads.filter(a => a.platform === plat).length;
              return (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setPlatformFilter(plat)}
                  className={`dusk-pipeline__step ${active ? 'active' : ''}`}
                >
                  {active && <span className="dusk-dot dusk-dot--periwinkle" />}
                  <span>{plat}</span>
                  <span className="dusk-pipeline__count">{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Фільтр:</span>
            {[
              { id: 'all', label: 'Усі кампанії' },
              { id: 'profitable', label: 'Окупилися (ROMI > 0)' },
              { id: 'loss', label: 'Ще не окупилися', apricot: true },
              { id: 'shop_budget', label: 'Бюджет друкарні' },
              { id: 'personal_budget', label: 'Особисті кошти' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoiFilter(f.id)}
                className={`dusk-facet-pill ${roiFilter === f.id ? (f.apricot ? 'active-apricot' : 'active') : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns List / Table */}
      <div className="dusk-panel" style={{ overflow: 'hidden' }}>
        {filteredAds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-muted)', fontSize: 13 }}>
            Рекламних кампаній за вибраними фільтрами не знайдено.
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredAds.map((ad, idx) => {
              const adCost = parseFloat(ad.cost || 0);
              const adRev = parseFloat(ad.revenue || 0);
              const adProfit = adRev - adCost;
              const adRomi = adCost > 0 ? (adProfit / adCost) * 100 : 0;

              return (
                <div
                  key={ad.id}
                  style={{
                    padding: 16,
                    borderBottom: idx < filteredAds.length - 1 ? '1px solid var(--color-rule)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="dusk-num" style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {new Date(ad.ad_date).toLocaleDateString('uk-UA')}
                    </span>
                    <span className="dusk-badge dusk-badge--periwinkle">{ad.platform}</span>
                  </div>

                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                    {ad.product_name}
                  </div>

                  <div className="dusk-num" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--color-paper)', padding: 12, borderRadius: 10, border: '1px solid var(--color-rule)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Витрати</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-accent-2)' }}>{adCost.toFixed(0)} ₴</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Продажі</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-accent)' }}>{adRev.toFixed(0)} ₴</span>
                        <button
                          type="button"
                          onClick={() => setQuickRevenueModal({ open: true, adId: ad.id, currentRevenue: adRev, addAmount: '' })}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ height: 22, padding: '0 6px', fontSize: 11 }}
                        >
                          +₴
                        </button>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Прибуток</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: adProfit >= 0 ? 'var(--color-ink)' : 'var(--color-danger)' }}>
                        {adProfit >= 0 ? `+${adProfit.toFixed(0)}` : adProfit.toFixed(0)} ₴
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>ROMI</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: adRomi >= 0 ? 'var(--color-accent)' : 'var(--color-accent-2)' }}>
                        {adRomi >= 0 ? `+${adRomi.toFixed(0)}%` : `${adRomi.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>

                  {ad.notes && (
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      Нотатки: <span style={{ color: 'var(--color-ink-2)' }}>{ad.notes}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => handleEdit(ad)} className="dusk-btn dusk-btn--ghost dusk-btn--sm" style={{ flex: 1 }}>
                      <Edit3 size={13} />
                      <span>Редагувати</span>
                    </button>
                    <button type="button" onClick={() => handleDelete(ad.id)} className="dusk-btn dusk-btn--danger dusk-btn--sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dusk-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Платформа</th>
                  <th>Рекламований товар</th>
                  <th style={{ textAlign: 'right' }}>Витрати</th>
                  <th style={{ textAlign: 'right' }}>Дохід з реклами</th>
                  <th style={{ textAlign: 'right' }}>Чистий результат</th>
                  <th style={{ textAlign: 'center' }}>ROMI</th>
                  <th>Нотатки</th>
                  <th style={{ textAlign: 'right' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.map(ad => {
                  const adCost = parseFloat(ad.cost || 0);
                  const adRev = parseFloat(ad.revenue || 0);
                  const adProfit = adRev - adCost;
                  const adRomi = adCost > 0 ? (adProfit / adCost) * 100 : 0;

                  return (
                    <tr key={ad.id}>
                      <td className="dusk-num" style={{ whiteSpace: 'nowrap', color: 'var(--color-muted)', fontSize: 12.5 }}>
                        {new Date(ad.ad_date).toLocaleDateString('uk-UA')}
                      </td>
                      <td>
                        <span className="dusk-badge dusk-badge--neutral">{ad.platform}</span>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ad.product_name}
                      </td>
                      <td className="dusk-num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-accent-2)' }}>{adCost.toFixed(0)} ₴</div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          {ad.budget_source === 'Кошти друкарні' ? 'Друкарня' : 'Особисті'}
                        </div>
                      </td>
                      <td className="dusk-num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{adRev.toFixed(0)} ₴</span>
                          <button 
                            type="button"
                            onClick={() => setQuickRevenueModal({ open: true, adId: ad.id, currentRevenue: adRev, addAmount: '' })}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ height: 24, padding: '0 7px', fontSize: 11 }}
                            title="Швидко додати суму продажу"
                          >
                            +₴
                          </button>
                        </div>
                      </td>
                      <td className="dusk-num" style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: adProfit >= 0 ? 'var(--color-ink)' : 'var(--color-danger)' }}>
                        {adProfit >= 0 ? `+${adProfit.toFixed(0)}` : adProfit.toFixed(0)} ₴
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`dusk-badge dusk-num ${adRomi >= 0 ? 'dusk-badge--periwinkle' : 'dusk-badge--apricot'}`}>
                          {adRomi >= 0 ? `+${adRomi.toFixed(0)}%` : `${adRomi.toFixed(0)}%`}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ad.notes}>
                        {ad.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            type="button"
                            onClick={() => handleEdit(ad)}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ padding: '0 8px' }}
                            title="Редагувати"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(ad.id)}
                            className="dusk-btn dusk-btn--danger dusk-btn--sm"
                            style={{ padding: '0 8px' }}
                            title="Видалити"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Campaign Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div 
            onClick={() => setShowAddForm(false)}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'oklch(10% 0.015 268 / 0.80)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 8 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="dusk-panel"
              style={{ 
                width: '100%', maxWidth: 520, borderRadius: 18, overflow: 'hidden',
                border: '1px solid var(--color-rule)', boxShadow: '0 24px 64px rgba(0,0,0,0.55)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-rule)', background: 'var(--color-paper-2)' }}>
                <h2 className="dusk-heading" style={{ fontSize: 18 }}>{editingAd ? 'Редагувати рекламну кампанію' : 'Нова рекламна кампанія'}</h2>
                <button type="button" onClick={() => setShowAddForm(false)} className="dusk-btn dusk-btn--ghost dusk-btn--sm" style={{ width: 30, height: 30, padding: 0 }}>
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>Платформа / Сервіс</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {platformsList.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, platform: p })}
                        className={`dusk-facet-pill ${formData.platform === p ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.platform === 'Other' && (
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Власна назва сервісу / блогера</label>
                    <input 
                      type="text" 
                      placeholder="Наприклад: Блогер Тарас" 
                      value={formData.custom_platform} 
                      onChange={e => setFormData({...formData, custom_platform: e.target.value})} 
                      required
                      className="dusk-input"
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Рекламований товар</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="dusk-select"
                  >
                    <option value="">Загальна реклама магазину</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} ₴)</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Джерело бюджету</label>
                    <select
                      value={formData.budget_source}
                      onChange={(e) => setFormData({ ...formData, budget_source: e.target.value })}
                      className="dusk-select"
                    >
                      <option value="Особисті кошти">Особисті кошти</option>
                      <option value="Кошти друкарні">Кошти друкарні</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Дата запуску</label>
                    <input 
                      type="date" 
                      value={formData.ad_date} 
                      onChange={e => setFormData({...formData, ad_date: e.target.value})} 
                      required
                      className="dusk-input dusk-num"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Витрати на рекламу (₴) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0"
                      value={formData.cost} 
                      onChange={e => setFormData({...formData, cost: e.target.value})} 
                      required
                      className="dusk-input dusk-num"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Сума продажів (₴)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0"
                      value={formData.revenue} 
                      onChange={e => setFormData({...formData, revenue: e.target.value})} 
                      className="dusk-input dusk-num"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Нотатки / посилання</label>
                  <textarea 
                    placeholder="Наприклад: Сторіз у блогера, таргет на Reels…" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="dusk-textarea"
                    style={{ minHeight: 76 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" onClick={() => setShowAddForm(false)} className="dusk-btn dusk-btn--ghost">
                    Скасувати
                  </button>
                  <button type="submit" className="dusk-btn dusk-btn--primary">
                    <Check size={14} />
                    <span>Зберегти кампанію</span>
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
          <div
            onClick={() => setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' })}
            style={{ position: 'fixed', inset: 0, background: 'oklch(10% 0.015 268 / 0.80)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }} 
              animate={{ opacity: 1, scale: 1 }} 
              onClick={(e) => e.stopPropagation()}
              className="dusk-panel"
              style={{ borderRadius: 16, padding: 20, width: '100%', maxWidth: 380, border: '1px solid var(--color-rule)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="dusk-heading" style={{ fontSize: 16 }}>Додати суму продажу</h3>
                <button 
                  type="button"
                  onClick={() => setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' })} 
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ width: 28, height: 28, padding: 0 }}
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleQuickRevenueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
                    Поточний дохід кампанії: <strong className="dusk-num" style={{ color: 'var(--color-accent)' }}>{quickRevenueModal.currentRevenue} ₴</strong>
                  </div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Сума нового продажу (₴)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Наприклад: 450" 
                    value={quickRevenueModal.addAmount} 
                    onChange={e => setQuickRevenueModal({...quickRevenueModal, addAmount: e.target.value})} 
                    required
                    autoFocus
                    className="dusk-input dusk-num"
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setQuickRevenueModal({ open: false, adId: null, currentRevenue: 0, addAmount: '' })} className="dusk-btn dusk-btn--ghost">
                    Скасувати
                  </button>
                  <button type="submit" className="dusk-btn dusk-btn--primary">
                    Додати дохід
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
