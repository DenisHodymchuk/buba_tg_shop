// Hallmark Dusk Theme — SalesStatsDashboard
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Calendar, RefreshCw, CheckCircle2, Clock, 
  Printer, Palette, ClipboardList, Truck, Send, XCircle
} from 'lucide-react';

const PLATFORMS = [
  { key: 'website', label: 'Сайт' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'olx', label: 'OLX' },
  { key: 'prom', label: 'Prom' },
  { key: 'rozetka', label: 'Rozetka' },
  { key: 'shafa', label: 'Shafa' },
  { key: 'manual', label: 'Вручну' },
  { key: 'other', label: 'Інше' }
];

const STATUS_META = {
  new: { label: 'Нове', signal: 'apricot', icon: Clock },
  printing: { label: 'Друк', signal: 'apricot', icon: Printer },
  painting: { label: 'Склейка / Розфарб.', signal: 'apricot', icon: Palette },
  preparing: { label: 'Пакування', signal: 'apricot', icon: ClipboardList },
  shipping: { label: 'До відправки', signal: 'apricot', icon: Truck },
  shipped: { label: 'В дорозі', signal: 'periwinkle', icon: Send },
  completed: { label: 'Виконано', signal: 'periwinkle', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', signal: 'muted', icon: XCircle }
};

export default function SalesStatsDashboard({ supabase, showToast, isMobile }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodType, setPeriodType] = useState('month'); // 'week' | 'month' | 'quarter'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | '30days' | '7days' | 'thisMonth' | 'thisYear'
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAllSources, setShowAllSources] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, [supabase]);

  const fetchSalesData = async (isManual = false) => {
    if (!supabase) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const unified = (ordersData || []).map(o => ({
        id: o.id,
        total: parseFloat(o.total || 0),
        status: o.status || 'new',
        payment_status: o.payment_status || 'pending',
        source: o.source || 'website',
        created_at: o.created_at,
        shipping_details: o.shipping_details || {},
        items: o.shipping_details?.items || []
      }));

      setSales(unified);
      if (isManual && showToast) {
        showToast('Статистику оновлено', 'success');
      }
    } catch (e) {
      console.error('Error fetching sales stats:', e);
      if (showToast) showToast('Помилка завантаження статистики', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchSalesData(true);
  };

  // Filtered sales by time and source
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      if (sourceFilter !== 'all' && (sale.source || 'website') !== sourceFilter) return false;
      if (timeFilter === 'all') return true;
      if (!sale.created_at) return false;
      const d = new Date(sale.created_at);

      if (timeFilter === '7days') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (timeFilter === '30days') {
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return d >= monthAgo;
      }
      if (timeFilter === 'thisMonth') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'thisYear') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, timeFilter, sourceFilter]);

  // Core KPI Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let activeCount = 0;
    let cancelledCount = 0;

    const sourceSums = {};
    const sourceCounts = {};
    const statusCounts = {};
    const statusSums = {};

    PLATFORMS.forEach(p => {
      sourceSums[p.key] = 0;
      sourceCounts[p.key] = 0;
    });

    Object.keys(STATUS_META).forEach(st => {
      statusCounts[st] = 0;
      statusSums[st] = 0;
    });

    filteredSales.forEach(sale => {
      const amt = parseFloat(sale.total || 0);
      const st = sale.status || 'new';

      if (statusCounts[st] !== undefined) {
        statusCounts[st] += 1;
        statusSums[st] += amt;
      }

      if (st === 'cancelled') {
        cancelledCount += 1;
        return;
      }

      activeCount += 1;
      totalRevenue += amt;

      if (sale.payment_status === 'paid') {
        paidRevenue += amt;
      } else if (sale.payment_status === 'partially_paid') {
        const isCod = !!sale.shipping_details?.is_cod;
        const codAmount = parseFloat(sale.shipping_details?.cod_amount || 0);
        if (isCod && codAmount > 0) {
          paidRevenue += Math.max(0, amt - codAmount);
        } else {
          paidRevenue += amt * 0.5;
        }
      }

      const src = sale.source || 'website';
      if (sourceSums[src] !== undefined) {
        sourceSums[src] += amt;
        sourceCounts[src] += 1;
      } else {
        sourceSums.other = (sourceSums.other || 0) + amt;
        sourceCounts.other = (sourceCounts.other || 0) + 1;
      }
    });

    const pendingRevenue = Math.max(0, totalRevenue - paidRevenue);
    const avgOrderValue = activeCount > 0 ? Math.round(totalRevenue / activeCount) : 0;
    const completionRate = activeCount > 0 
      ? Math.round(((statusCounts.completed || 0) / activeCount) * 100) 
      : 0;

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      activeCount,
      totalCount: filteredSales.length,
      cancelledCount,
      avgOrderValue,
      completionRate,
      sourceSums,
      sourceCounts,
      statusCounts,
      statusSums
    };
  }, [filteredSales]);

  // Period breakdown
  const periodData = useMemo(() => {
    const groups = {};

    filteredSales.forEach(sale => {
      if (sale.status === 'cancelled') return;
      if (!sale.created_at) return;

      const date = new Date(sale.created_at);
      const amt = parseFloat(sale.total || 0);
      const isPaid = sale.payment_status === 'paid';

      let key = '';
      let label = '';

      if (periodType === 'week') {
        const tempDate = new Date(date);
        const day = tempDate.getDay();
        const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(tempDate.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        key = `${monday.getFullYear()}-W${Math.ceil(monday.getDate() / 7)}`;
        label = `${monday.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })} – ${sunday.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
      } else if (periodType === 'quarter') {
        const q = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${q}`;
        label = `Q${q} ${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = { key, label, total: 0, paid: 0, count: 0, dateObj: date };
      }

      groups[key].total += amt;
      groups[key].count += 1;
      if (isPaid) {
        groups[key].paid += amt;
      } else if (sale.payment_status === 'partially_paid') {
        const isCod = !!sale.shipping_details?.is_cod;
        const codAmount = parseFloat(sale.shipping_details?.cod_amount || 0);
        if (isCod && codAmount > 0) {
          groups[key].paid += Math.max(0, amt - codAmount);
        } else {
          groups[key].paid += amt * 0.5;
        }
      }
    });

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredSales, periodType]);

  // Top products analytics
  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach(sale => {
      if (sale.status === 'cancelled') return;
      const items = Array.isArray(sale.items) ? sale.items : [];
      items.forEach(item => {
        const name = item.name || item.title || 'Товар без назви';
        const qty = parseInt(item.quantity || item.count || 1, 10);
        const price = parseFloat(item.price || 0);
        const total = price * qty;

        if (!map[name]) {
          map[name] = { name, qty: 0, total: 0 };
        }
        map[name].qty += qty;
        map[name].total += total;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredSales]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14, color: 'var(--color-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: 13 }}>Завантаження фінансової аналітики...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      
      {/* Dusk Glass Header & Filter Bar */}
      <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div>
            <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>
              Фінансова аналітика та зрізи
            </h1>
            <p className="dusk-subheading" style={{ marginTop: 2 }}>
              Аналіз загальної каси, фактичних надходжень, середнього чеку та каналів продажу
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="dusk-segmented">
              {[
                { val: 'all', label: 'Весь час' },
                { val: '30days', label: '30 днів' },
                { val: '7days', label: '7 днів' },
                { val: 'thisMonth', label: 'Цей місяць' },
                { val: 'thisYear', label: 'Цей рік' }
              ].map(tf => (
                <button
                  key={tf.val}
                  type="button"
                  onClick={() => setTimeFilter(tf.val)}
                  className={`dusk-segmented__item ${timeFilter === tf.val ? 'active' : ''}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button 
              type="button"
              onClick={handleManualRefresh} 
              disabled={refreshing}
              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              style={{ height: 34 }}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Оновлення...' : 'Оновити'}
            </button>
          </div>
        </div>

        {/* Channel Filter Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Канал:</span>
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`dusk-facet-pill ${sourceFilter === 'all' ? 'active' : ''}`}
          >
            Усі джерела
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setSourceFilter(sourceFilter === p.key ? 'all' : p.key)}
              className={`dusk-facet-pill ${sourceFilter === p.key ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dusk Ruled Tally — 4 Primary Financial Metrics */}
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
          <div className="dusk-tally__cell" style={{ padding: '14px 18px' }}>
            <span className="dusk-tally__label">Загальна каса</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 20 : 24 }}>
              {stats.totalRevenue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">
              Активних замовлень: <strong style={{ color: 'var(--color-ink)' }}>{stats.activeCount}</strong> (скасовано: {stats.cancelledCount})
            </span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '14px 18px' }}>
            <span className="dusk-tally__label">Фактично отримано</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 20 : 24, color: 'var(--color-accent)' }}>
              {stats.paidRevenue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">
              Частка оплачених коштів: <strong style={{ color: 'var(--color-accent)' }}>{stats.totalRevenue > 0 ? Math.round((stats.paidRevenue / stats.totalRevenue) * 100) : 0}%</strong>
            </span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '14px 18px' }}>
            <span className="dusk-tally__label">Очікує оплати / наложка</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 20 : 24, color: stats.pendingRevenue > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {stats.pendingRevenue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">У дорозі або в черзі на оплату</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '14px 18px' }}>
            <span className="dusk-tally__label">Середній чек (AOV)</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 20 : 24 }}>
              {stats.avgOrderValue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">Виконано до кінця: {stats.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="dusk-panel" style={{ padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="dusk-heading" style={{ fontSize: 16 }}>Розподіл за джерелами замовлень</h2>
            <p className="dusk-subheading" style={{ fontSize: 12, marginTop: 2 }}>Виручка та кількість замовлень по кожному каналу за вибраний період</p>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowAllSources(!showAllSources)}
            className={`dusk-facet-pill ${showAllSources ? 'active' : ''}`}
          >
            {showAllSources ? 'Приховати порожні (0 ₴)' : 'Показати всі джерела'}
          </button>
        </div>

        {/* Source Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {PLATFORMS
            .filter(p => showAllSources || (stats.sourceSums[p.key] || 0) > 0 || (stats.sourceCounts[p.key] || 0) > 0)
            .sort((a, b) => (stats.sourceSums[b.key] || 0) - (stats.sourceSums[a.key] || 0))
            .map((p, idx) => {
              const sum = stats.sourceSums[p.key] || 0;
              const count = stats.sourceCounts[p.key] || 0;
              const percent = stats.totalRevenue > 0 ? Math.round((sum / stats.totalRevenue) * 100) : 0;
              const isActive = sum > 0 || count > 0;

              return (
                <div 
                  key={p.key} 
                  style={{ 
                    background: 'var(--color-paper)', 
                    border: '1px solid var(--color-rule)', 
                    borderRadius: 12, 
                    padding: 14, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8,
                    opacity: isActive ? 1 : 0.45
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span className={`dusk-dot ${idx === 0 && isActive ? 'dusk-dot--periwinkle' : isActive ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{p.label}</span>
                    </div>
                    <span className="dusk-badge dusk-badge--neutral dusk-num" style={{ fontSize: 11, padding: '1px 7px' }}>
                      {percent}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="dusk-num" style={{ fontSize: 18, fontWeight: 600, color: isActive ? 'var(--color-ink)' : 'var(--color-muted)' }}>
                      {sum.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                    </div>
                    <div className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{count} замовл.</div>
                  </div>

                  {/* Restrained Progress Bar */}
                  <div style={{ width: '100%', height: 4, background: 'var(--color-paper-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: idx === 0 ? 'var(--color-accent)' : 'var(--color-accent-2)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Period Analytics */}
      <div className="dusk-panel" style={{ padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div>
            <h2 className="dusk-heading" style={{ fontSize: 16 }}>Динаміка за періодами</h2>
            <p className="dusk-subheading" style={{ fontSize: 12, marginTop: 2 }}>Порівняння загальної каси та оплаченої частки по тижнях, місяцях і кварталах</p>
          </div>
          
          <div className="dusk-segmented" style={{ alignSelf: isMobile ? 'flex-start' : 'auto' }}>
            {[
              { type: 'week', label: 'По тижнях' },
              { type: 'month', label: 'По місяцях' },
              { type: 'quarter', label: 'По кварталах' }
            ].map(tab => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setPeriodType(tab.type)}
                className={`dusk-segmented__item ${periodType === tab.type ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {periodData.length === 0 ? (
            <div style={{ color: 'var(--color-muted)', fontSize: 12.5, padding: '20px 0' }}>Немає даних для відображення за цей період.</div>
          ) : (
            periodData.map(item => {
              const paidPercent = item.total > 0 ? (item.paid / item.total) * 100 : 0;
              const pendingVal = Math.max(0, item.total - item.paid);
              return (
                <div key={item.key} style={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)', textTransform: 'capitalize' }}>{item.label}</div>
                      <div className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                        {item.count} {item.count === 1 ? 'продаж' : item.count < 5 ? 'продажі' : 'продажів'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="dusk-num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>
                        {item.total.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                      </div>
                      <div className="dusk-num" style={{ fontSize: 11, marginTop: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <span style={{ color: 'var(--color-accent)' }}>Оплачено: {item.paid.toLocaleString('uk-UA')} ₴</span>
                        {pendingVal > 0 && (
                          <span style={{ color: 'var(--color-accent-2)' }}>Очікує: {pendingVal.toLocaleString('uk-UA')} ₴</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', width: '100%', height: 5, background: 'var(--color-paper-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'var(--color-accent-2-soft)' }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${paidPercent}%`, background: 'var(--color-accent)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Breakdown & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        
        {/* Status Breakdown */}
        <div className="dusk-panel" style={{ padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 className="dusk-heading" style={{ fontSize: 16 }}>Розподіл за етапами виконання</h2>
            <p className="dusk-subheading" style={{ fontSize: 12, marginTop: 2 }}>Кількість замовлень та сума на кожному етапі воронки</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(STATUS_META).map(stKey => {
              const meta = STATUS_META[stKey];
              const count = stats.statusCounts[stKey] || 0;
              const sum = stats.statusSums[stKey] || 0;

              return (
                <div key={stKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-paper)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-rule)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`dusk-dot ${meta.signal === 'periwinkle' ? 'dusk-dot--periwinkle' : meta.signal === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>{meta.label}</span>
                  </div>

                  <div className="dusk-num" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{count} шт.</span>
                    <strong style={{ fontSize: 13, color: 'var(--color-ink)', minWidth: 85, textAlign: 'right' }}>
                      {sum.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Sold Products */}
        <div className="dusk-panel" style={{ padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 className="dusk-heading" style={{ fontSize: 16 }}>Топ моделей за виручкою</h2>
            <p className="dusk-subheading" style={{ fontSize: 12, marginTop: 2 }}>Найпопулярніші вироби за кількістю та сумою замовлень</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topProducts.length === 0 ? (
              <div style={{ color: 'var(--color-muted)', fontSize: 12.5, padding: '20px 0' }}>Немає даних про продані товари.</div>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-paper)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-rule)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <span className="dusk-mono" style={{ fontSize: 11, fontWeight: 600, color: idx < 3 ? 'var(--color-accent-2)' : 'var(--color-muted)', background: 'var(--color-paper-2)', padding: '2px 7px', borderRadius: 6, border: '1px solid var(--color-rule)' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 230 }}>
                      {prod.name}
                    </span>
                  </div>

                  <div className="dusk-num" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{prod.qty} шт.</span>
                    <strong style={{ fontSize: 13, color: 'var(--color-accent)', minWidth: 85, textAlign: 'right' }}>
                      {prod.total.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
