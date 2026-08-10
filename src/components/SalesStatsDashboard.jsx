"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Coins, Calendar, ArrowUpRight, CheckCircle2, 
  Clock, RefreshCw, ShoppingBag, TrendingUp, DollarSign,
  Package, Send, Truck, Printer, Palette, XCircle, ChevronDown, ChevronUp,
  Percent, Award, Filter
} from 'lucide-react';

const PLATFORMS = [
  { key: 'website', label: 'Сайт', color: '#3b82f6' },
  { key: 'olx', label: 'OLX', color: '#23e5db' },
  { key: 'instagram', label: 'Instagram', color: '#f43f5e' },
  { key: 'facebook', label: 'Facebook', color: '#1877f2' },
  { key: 'telegram', label: 'Telegram', color: '#0ea5e9' },
  { key: 'tiktok', label: 'TikTok', color: '#ff0050' },
  { key: 'threads', label: 'Threads', color: '#ffffff' },
  { key: 'offline', label: 'Офлайн', color: '#22c55e' },
  { key: 'other', label: 'Інше', color: '#a855f7' }
];

const STATUS_META = {
  new: { label: 'Нові', color: '#3b82f6', icon: Clock },
  printing: { label: 'Друкуються', color: '#7c3aed', icon: Printer },
  painting: { label: 'Розфарбовуються', color: '#f59e0b', icon: Palette },
  shipping: { label: 'Готові до відправки', color: '#ec4899', icon: Truck },
  shipped: { label: 'Відправлені', color: '#10b981', icon: Send },
  completed: { label: 'Виконані', color: '#22c55e', icon: CheckCircle2 },
  cancelled: { label: 'Скасовані', color: '#ef4444', icon: XCircle }
};

export default function SalesStatsDashboard({ showToast }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodType, setPeriodType] = useState('month'); // 'week' | 'month' | 'quarter'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | '30days' | '7days' | 'thisMonth' | 'thisYear'
  const [isMobile, setIsMobile] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales stats:', err);
      if (showToast) showToast('Помилка завантаження статистики продажів', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
    if (showToast) showToast('Статистику оновлено!', 'success');
  };

  // Filter sales by selected time range
  const filteredSales = useMemo(() => {
    if (timeFilter === 'all') return sales;
    const now = new Date();
    return sales.filter(s => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      if (timeFilter === '7days') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (timeFilter === '30days') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      if (timeFilter === 'thisMonth') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'thisYear') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, timeFilter]);

  // General KPI stats
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
        label = `${monday.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })} - ${sunday.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: '#a78bfa' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>Завантаження статистики продажів...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={28} style={{ color: '#a78bfa' }} /> Статистика та Аналітика Продажів
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Аналіз каси, середнього чеку, каналів замовлень та періодичної динаміки</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Time range selector */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 3, gap: 3 }}>
            {[
              { val: 'all', label: 'Всі часи' },
              { val: '30days', label: '30 днів' },
              { val: '7days', label: '7 днів' },
              { val: 'thisMonth', label: 'Цей місяць' },
              { val: 'thisYear', label: 'Цей рік' }
            ].map(tf => (
              <button
                key={tf.val}
                type="button"
                onClick={() => setTimeFilter(tf.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: timeFilter === tf.val ? '#7c3aed' : 'transparent',
                  color: timeFilter === tf.val ? '#fff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button 
            type="button"
            onClick={handleManualRefresh} 
            disabled={refreshing}
            style={{ 
              padding: '10px 16px', borderRadius: 12, 
              background: refreshing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
              color: refreshing ? '#22c55e' : '#fff', 
              border: '1px solid rgba(255,255,255,0.1)', 
              fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s' 
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Оновлюємо...' : 'Оновити'}
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* Total Revenue Card */}
        <div style={{ background: 'linear-gradient(135deg, #0e1e38, #0a192f)', borderRadius: 20, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Загальна каса (Всі канали)</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 950, color: '#fff' }}>{stats.totalRevenue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 6, fontWeight: 700 }}>
            Успішних замовлень: <strong style={{ color: '#e2e8f0' }}>{stats.activeCount}</strong> (всього: {stats.totalCount})
          </div>
        </div>

        {/* Paid Revenue Card */}
        <div style={{ background: 'linear-gradient(135deg, #062319, #0a192f)', borderRadius: 20, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Оплачено (Отримано)</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 950, color: '#4ade80' }}>{stats.paidRevenue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 6, fontWeight: 700 }}>
            Частка оплачених коштів: <strong style={{ color: '#4ade80' }}>{stats.totalRevenue > 0 ? Math.round((stats.paidRevenue / stats.totalRevenue) * 100) : 0}%</strong>
          </div>
        </div>

        {/* Pending Revenue Card */}
        <div style={{ background: 'linear-gradient(135deg, #2a1b08, #0a192f)', borderRadius: 20, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Очікує оплати / Накладений</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 950, color: '#fbbf24' }}>{stats.pendingRevenue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 6, fontWeight: 700 }}>
            Клієнтські передоплати чи післяплата
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div style={{ background: 'linear-gradient(135deg, #1c0e35, #0a192f)', borderRadius: 20, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Середній чек (AOV)</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <Coins size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 950, color: '#c084fc' }}>{stats.avgOrderValue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 6, fontWeight: 700 }}>
            Середня сума 1 замовлення
          </div>
        </div>

      </div>

      {/* Platform Breakdown */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Розподіл за Джерелами Замовлень</h2>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowAllSources(!showAllSources)}
            style={{ 
              background: showAllSources ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.03)', 
              border: showAllSources ? '1px solid #7c3aed' : '1px solid var(--border)', 
              color: showAllSources ? '#a78bfa' : 'var(--text-muted)', 
              fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {showAllSources ? 'Приховати неактивні (0 ₴)' : 'Показати всі 9 джерел'}
          </button>
        </div>

        {/* Stacked Multi-Color Distribution Bar */}
        {stats.totalRevenue > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 14, width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 8, display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              {PLATFORMS.map(p => {
                const sum = stats.sourceSums[p.key] || 0;
                if (sum <= 0) return null;
                const percent = (sum / stats.totalRevenue) * 100;
                return (
                  <div 
                    key={p.key} 
                    title={`${p.label}: ${sum.toLocaleString('uk-UA')} ₴ (${Math.round(percent)}%)`}
                    style={{ 
                      width: `${percent}%`, 
                      background: p.color, 
                      height: '100%', 
                      transition: 'width 0.4s ease',
                      borderRight: '1px solid rgba(0,0,0,0.3)'
                    }} 
                  />
                );
              })}
            </div>

            {/* Quick Legend Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 2 }}>
              {PLATFORMS.filter(p => (stats.sourceSums[p.key] || 0) > 0)
                .sort((a, b) => (stats.sourceSums[b.key] || 0) - (stats.sourceSums[a.key] || 0))
                .map(p => {
                  const sum = stats.sourceSums[p.key] || 0;
                  const percent = Math.round((sum / stats.totalRevenue) * 100);
                  return (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                      <span>{p.label}:</span>
                      <strong style={{ color: p.color }}>{percent}%</strong>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Source Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {PLATFORMS
            .filter(p => showAllSources || (stats.sourceSums[p.key] || 0) > 0 || (stats.sourceCounts[p.key] || 0) > 0)
            .sort((a, b) => (stats.sourceSums[b.key] || 0) - (stats.sourceSums[a.key] || 0))
            .map(p => {
              const sum = stats.sourceSums[p.key] || 0;
              const count = stats.sourceCounts[p.key] || 0;
              const percent = stats.totalRevenue > 0 ? Math.round((sum / stats.totalRevenue) * 100) : 0;
              const isActive = sum > 0 || count > 0;

              return (
                <div 
                  key={p.key} 
                  style={{ 
                    background: isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', 
                    border: isActive ? `1px solid ${p.color}35` : '1px solid rgba(255,255,255,0.04)', 
                    borderRadius: 14, 
                    padding: 14, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8,
                    opacity: isActive ? 1 : 0.4,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: isActive ? `0 0 8px ${p.color}` : 'none' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.label}</span>
                    </div>
                    {isActive ? (
                      <span style={{ fontSize: 11, fontWeight: 900, color: p.color, background: `${p.color}18`, padding: '2px 8px', borderRadius: 8 }}>
                        {percent}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>0%</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 18, fontWeight: 950, color: isActive ? '#fff' : 'var(--text-muted)' }}>{sum.toLocaleString('uk-UA')} ₴</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{count} прод.</div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: p.color, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Period Analytics */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={22} style={{ color: '#8b5cf6' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Аналітика за Періодами</h2>
          </div>
          
          {/* Period selector tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', alignSelf: isMobile ? 'flex-start' : 'auto' }}>
            {[
              { type: 'week', label: 'По тижнях' },
              { type: 'month', label: 'По місяцях' },
              { type: 'quarter', label: 'По кварталах' }
            ].map(tab => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setPeriodType(tab.type)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  background: periodType === tab.type ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                  color: periodType === tab.type ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of periods */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {periodData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Немає даних для відображення статистики за цей період.</div>
          ) : (
            periodData.map(item => {
              const paidPercent = item.total > 0 ? (item.paid / item.total) * 100 : 0;
              return (
                <div key={item.key} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 700 }}>
                        {item.count} {item.count === 1 ? 'продаж' : item.count < 5 ? 'продажі' : 'продажів'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 950, color: '#2dd4bf' }}>{item.total.toLocaleString('uk-UA')} ₴</div>
                      <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2, fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span>Оплачено: {item.paid.toLocaleString('uk-UA')} ₴</span>
                        {item.total - item.paid > 0 && (
                          <span style={{ color: '#fbbf24' }}>Очікує: {(item.total - item.paid).toLocaleString('uk-UA')} ₴</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual Progress bar container */}
                  <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'rgba(139,92,246,0.25)', borderRadius: 3 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${paidPercent}%`, background: '#2dd4bf', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Breakdown & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        
        {/* Status Breakdown */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} style={{ color: '#ec4899' }} /> Розподіл за Статусами
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.keys(STATUS_META).map(stKey => {
              const meta = STATUS_META[stKey];
              const Icon = meta.icon;
              const count = stats.statusCounts[stKey] || 0;
              const sum = stats.statusSums[stKey] || 0;

              return (
                <div key={stKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{meta.label}</span>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{count} шт.</span>
                    <strong style={{ fontSize: 13, color: '#fff', minWidth: 80, textAlign: 'right' }}>{sum.toLocaleString('uk-UA')} ₴</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Sold Products */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} style={{ color: '#fbbf24' }} /> Топ Товари за Виручкою
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topProducts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Немає даних про товари.</div>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 750, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {prod.name}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{prod.qty} шт.</span>
                    <strong style={{ fontSize: 13, color: '#4ade80' }}>{prod.total.toLocaleString('uk-UA')} ₴</strong>
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
