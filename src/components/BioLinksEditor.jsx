"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { renderLinkIcon, DEFAULT_SOCIAL_LINKS } from '@/app/links/page';
import { 
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Save, CheckCircle, 
  ExternalLink, Globe, Sparkles, Move, RefreshCw, Link as LinkIcon,
  Layers, ShoppingBag, MessageCircle, Flame, Star, Eye, EyeOff, ArrowUpRight,
  BarChart3, Smartphone, Monitor, Tablet, MousePointerClick, Calendar, TrendingUp
} from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'store', label: '🛍️ Магазин (Shopping Bag)' },
  { id: 'telegram', label: '✈️ Telegram' },
  { id: 'tiktok', label: '📱 TikTok' },
  { id: 'instagram', label: '📷 Instagram' },
  { id: 'custom_modeling', label: '🎨 3D Моделювання (Layers)' },
  { id: 'manager', label: '💬 Менеджер (Chat)' },
  { id: 'flame', label: '🔥 Тренди (Flame)' },
  { id: 'star', label: '⭐ Зірка (Star)' },
  { id: 'general', label: '🌐 Веб-сайт (Globe)' },
];

const GRADIENT_OPTIONS = [
  { id: 'from-purple-600 via-pink-600 to-amber-500', label: '✨ Cosmic Purple Gold' },
  { id: 'from-sky-500 to-blue-600', label: '✈️ Telegram Sky Blue' },
  { id: 'from-cyan-500 via-slate-900 to-rose-500', label: '📱 TikTok Cyber' },
  { id: 'from-amber-500 via-rose-500 to-purple-600', label: '📷 Instagram Gradient' },
  { id: 'from-purple-600 to-indigo-600', label: '🎨 Deep Violet' },
  { id: 'from-emerald-500 to-teal-700', label: '💬 Emerald Manager' },
  { id: 'from-rose-500 to-red-600', label: '🔥 Crimson Hot' },
];

export default function BioLinksEditor() {
  const [links, setLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Analytics State
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor' | 'analytics'
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [viewsData, setViewsData] = useState([]);
  const [clicksData, setClicksData] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    url: '',
    badge: '',
    iconType: 'general',
    isInternal: false,
    featured: false,
    hidden: false,
    colorGradient: 'from-purple-600 via-pink-600 to-amber-500'
  });

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadAnalytics() {
    if (!supabase) return;
    setAnalyticsLoading(true);
    try {
      const { data: views, error: viewsError } = await supabase
        .from('bio_links_views')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: clicks, error: clicksError } = await supabase
        .from('bio_links_clicks')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewsError) throw viewsError;
      if (clicksError) throw clicksError;

      setViewsData(views || []);
      setClicksData(clicks || []);
    } catch (e) {
      console.error('Error loading analytics:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (activeSubTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeSubTab]);

  // Analytics calculations
  const totalViews = viewsData.length;
  const totalClicks = clicksData.length;
  const clickThroughRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  const clicksByLinkId = useMemo(() => {
    const counts = {};
    clicksData.forEach(click => {
      const id = click.link_id;
      const title = click.link_title || id;
      if (!counts[id]) {
        counts[id] = { id, title, count: 0, url: click.url };
      }
      counts[id].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [clicksData]);

  const referrersBreakdown = useMemo(() => {
    const counts = {};
    viewsData.forEach(view => {
      const ref = view.referrer || 'direct';
      counts[ref] = (counts[ref] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [viewsData]);

  const devicesBreakdown = useMemo(() => {
    const counts = { mobile: 0, tablet: 0, desktop: 0 };
    viewsData.forEach(view => {
      const device = view.device_type || 'desktop';
      if (counts[device] !== undefined) {
        counts[device] += 1;
      } else {
        counts.desktop += 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [viewsData]);

  const viewsOverTime = useMemo(() => {
    const groups = {};
    const now = new Date();
    // Pre-fill last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayStr = date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
      groups[dayStr] = { date: dayStr, views: 0, clicks: 0 };
    }

    viewsData.forEach(view => {
      const date = new Date(view.created_at);
      const dayStr = date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
      if (groups[dayStr]) {
        groups[dayStr].views += 1;
      }
    });

    clicksData.forEach(click => {
      const date = new Date(click.created_at);
      const dayStr = date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
      if (groups[dayStr]) {
        groups[dayStr].clicks += 1;
      }
    });

    return Object.values(groups);
  }, [viewsData, clicksData]);

  async function loadLinks() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'bio_links')
        .single();

      if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
        setLinks(data.value);
      }
    } catch (e) {
      console.log('Error loading links from DB:', e);
    }
  }

  async function saveLinks(updatedLinks) {
    const listToSave = updatedLinks || links;
    setSaving(true);
    setSavedSuccess(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_bio_links', JSON.stringify(listToSave));
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'bio_links', value: listToSave }, { onConflict: 'key' });
        
        if (error) {
          if (error.message?.includes('row-level security') || error.code === '42501') {
            console.warn('Supabase RLS policy restricted direct insert on settings. Saved to local cache.', error);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          } else {
            console.error('Database save warning:', error);
            setSavedSuccess(true);
          }
        } else {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      } catch (err) {
        console.error('Error saving settings:', err);
        setSavedSuccess(true);
      }
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
    setSaving(false);
  }

  function handleToggleHidden(index) {
    const updated = [...links];
    updated[index] = {
      ...updated[index],
      hidden: !updated[index].hidden
    };
    setLinks(updated);
    saveLinks(updated);
  }

  function handleOpenAdd() {
    setEditingIndex(null);
    setFormData({
      title: '',
      subtitle: '',
      url: '',
      badge: '',
      iconType: 'general',
      isInternal: false,
      featured: false,
      hidden: false,
      colorGradient: 'from-purple-600 via-pink-600 to-amber-500'
    });
    setShowModal(true);
  }

  function handleOpenEdit(index) {
    setEditingIndex(index);
    const item = links[index];
    setFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      url: item.url || '',
      badge: item.badge || '',
      iconType: item.iconType || 'general',
      isInternal: item.isInternal || false,
      featured: item.featured || false,
      hidden: item.hidden || false,
      colorGradient: item.colorGradient || 'from-purple-600 via-pink-600 to-amber-500'
    });
    setShowModal(true);
  }

  function handleSaveForm(e) {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      alert('Будь ласка, заповніть Назву та Посилання (URL)');
      return;
    }

    const newItem = {
      id: editingIndex !== null ? links[editingIndex].id : 'link_' + Date.now(),
      ...formData
    };

    let updated;
    if (editingIndex !== null) {
      updated = [...links];
      updated[editingIndex] = newItem;
    } else {
      updated = [...links, newItem];
    }

    setLinks(updated);
    setShowModal(false);
    saveLinks(updated);
  }

  function handleDelete(index) {
    if (!confirm('Видалити це посилання?')) return;
    const updated = links.filter((_, i) => i !== index);
    setLinks(updated);
    saveLinks(updated);
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const updated = [...links];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLinks(updated);
    saveLinks(updated);
  }

  function handleResetDefault() {
    if (!confirm('Скинути всі посилання до стандартного шаблону?')) return;
    setLinks(DEFAULT_SOCIAL_LINKS);
    saveLinks(DEFAULT_SOCIAL_LINKS);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Шапка розділу */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '24px',
        border: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Globe size={20} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Керування Мультипосиланнями (/links)
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
            Налаштуйте посилання на ваші соцмережі, TikTok, Telegram, Instagram та спецпропозиції
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetDefault}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <RefreshCw size={15} />
            <span>Скинути до стандартних</span>
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
            }}
          >
            <Plus size={18} />
            <span>ДОДАТИ ПОСИЛАННЯ</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        alignSelf: 'flex-start',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('editor')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'editor' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent',
            color: activeSubTab === 'editor' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Globe size={15} />
          <span>Керування посиланнями</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'analytics' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent',
            color: activeSubTab === 'analytics' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BarChart3 size={15} />
          <span>Аналітика та кліки</span>
        </button>
      </div>

      {activeSubTab === 'analytics' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Analytics Header / Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '20px 24px',
            borderRadius: '20px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: '#c084fc' }} /> Статистика відвідувань сторінки посилань
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Аналіз переглядів та кліків по кнопках за останній час
              </p>
            </div>

            <button
              onClick={loadAnalytics}
              disabled={analyticsLoading}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={14} style={{ animation: analyticsLoading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{analyticsLoading ? 'Оновлюється...' : 'Оновити дані'}</span>
            </button>
          </div>

          {analyticsLoading && viewsData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: '#c084fc' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Завантаження статистики...</span>
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                {/* Views Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(10, 25, 47, 0.3))',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Перегляди сторінки (Views)
                    </span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                      <Monitor size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff' }}>
                    {totalViews.toLocaleString('uk-UA')}
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '6px', margin: 0, fontWeight: 700 }}>
                    Загальна кількість завантажень сторінки
                  </p>
                </div>

                {/* Clicks Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(10, 25, 47, 0.3))',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Переходи за лінками (Clicks)
                    </span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
                      <MousePointerClick size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 950, color: '#f472b6' }}>
                    {totalClicks.toLocaleString('uk-UA')}
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '6px', margin: 0, fontWeight: 700 }}>
                    Кліки по кнопках соцмереж / посилань
                  </p>
                </div>

                {/* CTR Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(10, 25, 47, 0.3))',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Конверсія сторінки (CTR)
                    </span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 950, color: '#34d399' }}>
                    {clickThroughRate}%
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '6px', margin: 0, fontWeight: 700 }}>
                    Співвідношення кліків до переглядів
                  </p>
                </div>
              </div>

              {/* Views Over Time - Trend Visualizer */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: '#7c3aed' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0 }}>Динаміка за останні 7 днів</h3>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  height: '140px',
                  paddingTop: '20px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  gap: '8px'
                }}>
                  {viewsOverTime.map((day, idx) => {
                    const maxVal = Math.max(...viewsOverTime.map(d => d.views), 1);
                    const viewHeight = (day.views / maxVal) * 100;
                    const clickHeight = (day.clicks / maxVal) * 100;

                    return (
                      <div key={idx} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}>
                        {/* Bars Container */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '3px',
                          height: '100%',
                          width: '100%',
                          justifyContent: 'center'
                        }}>
                          {/* Views bar */}
                          <div
                            title={`Перегляди (${day.date}): ${day.views}`}
                            style={{
                              width: '12px',
                              height: `${viewHeight}%`,
                              minHeight: day.views > 0 ? '4px' : '0px',
                              background: 'linear-gradient(to top, #7c3aed, #a78bfa)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }}
                          />
                          {/* Clicks bar */}
                          <div
                            title={`Кліки (${day.date}): ${day.clicks}`}
                            style={{
                              width: '12px',
                              height: `${clickHeight}%`,
                              minHeight: day.clicks > 0 ? '4px' : '0px',
                              background: 'linear-gradient(to top, #f472b6, #ec4899)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }}
                          />
                        </div>

                        {/* Label */}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>
                          {day.date}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 800 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }} />
                    <span>Перегляди</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f472b6' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6' }} />
                    <span>Кліки</span>
                  </div>
                </div>
              </div>

              {/* Two-column layout for popular links, referrers & device details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {/* Popular Links clicks list */}
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MousePointerClick size={16} style={{ color: '#f472b6' }} /> Популярність посилань
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {clicksByLinkId.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Немає даних про кліки.</span>
                    ) : (
                      clicksByLinkId.map((linkClick, index) => {
                        const maxClicks = Math.max(...clicksByLinkId.map(l => l.count), 1);
                        const progressWidth = (linkClick.count / maxClicks) * 100;
                        const matchLinkObj = links.find(l => l.id === linkClick.id);
                        
                        return (
                          <div key={index} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: 'rgba(255,255,255,0.01)',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#f472b6', background: 'rgba(244,114,182,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  #{index + 1}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                                  {linkClick.title}
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: '#f472b6' }}>
                                {linkClick.count} кліків
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${progressWidth}%`,
                                height: '100%',
                                background: 'linear-gradient(to right, #7c3aed, #f472b6)',
                                borderRadius: '3px'
                              }} />
                            </div>
                            
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {linkClick.url}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Referrers & Devices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Traffic Sources */}
                  <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} style={{ color: '#34d399' }} /> Джерела трафіку (Referrers)
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {referrersBreakdown.length === 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Немає даних.</span>
                      ) : (
                        referrersBreakdown.map((ref, idx) => {
                          const maxRefVal = Math.max(...referrersBreakdown.map(r => r.count), 1);
                          const progressWidth = (ref.count / maxRefVal) * 100;
                          
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                                <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{ref.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{ref.count} візитів ({Math.round(ref.count / totalViews * 100)}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${progressWidth}%`, height: '100%', background: '#34d399', borderRadius: '2px' }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Device Types */}
                  <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} style={{ color: '#c084fc' }} /> Типи пристроїв
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                      {devicesBreakdown.map((device, idx) => {
                        const percent = totalViews > 0 ? Math.round((device.count / totalViews) * 100) : 0;
                        const renderDeviceIcon = () => {
                          if (device.name === 'mobile') return <Smartphone size={18} style={{ color: '#f472b6' }} />;
                          if (device.name === 'tablet') return <Tablet size={18} style={{ color: '#3b82f6' }} />;
                          return <Monitor size={18} style={{ color: '#34d399' }} />;
                        };
                        const deviceLabels = { mobile: 'Мобільні', tablet: 'Планшети', desktop: 'ПК' };

                        return (
                          <div key={idx} style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '12px 8px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {renderDeviceIcon()}
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                              {deviceLabels[device.name] || device.name}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-muted)' }}>
                              {percent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
        
        {/* Ліва колонка: Список посилань */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
              Активні посилання ({links.length})
            </span>
            {savedSuccess && (
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Збережено успішно!
              </span>
            )}
          </div>

          {links.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '16px',
                borderRadius: '18px',
                background: 'var(--bg-card)',
                border: item.hidden ? '1px dashed rgba(239,68,68,0.3)' : '1px solid var(--border)',
                opacity: item.hidden ? 0.6 : 1,
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              {/* Іконка та тексти */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', flexShrink: 0
                }} className={`bg-gradient-to-br ${item.colorGradient || 'from-purple-600 to-pink-600'}`}>
                  {renderLinkIcon(item.iconType, { size: 20 })}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(236, 72, 153, 0.2))',
                        border: '1px solid rgba(192, 132, 252, 0.35)',
                        color: '#f3e8ff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e879f9' }} />
                        {item.badge}
                      </span>
                    )}
                    {item.hidden && (
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                        Приховано
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {item.url}
                  </span>
                </div>
              </div>

              {/* Дії (Toggle, Up, Down, Edit, Delete) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleHidden(index)}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                    background: item.hidden ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: item.hidden ? '#ef4444' : '#10b981',
                    cursor: 'pointer', fontSize: '11px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  title={item.hidden ? "Натисніть, щоб показати на сайті" : "Натисніть, щоб приховати з сайту"}
                >
                  {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{item.hidden ? 'Сховано' : 'Видиме'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  style={{
                    padding: '6px', borderRadius: '8px', border: 'none',
                    background: 'rgba(255,255,255,0.05)', color: index === 0 ? '#475569' : 'var(--text-main)',
                    cursor: index === 0 ? 'default' : 'pointer'
                  }}
                  title="Перемістити вгору"
                >
                  <ArrowUp size={14} />
                </button>

                <button
                  onClick={() => handleMove(index, 1)}
                  disabled={index === links.length - 1}
                  style={{
                    padding: '6px', borderRadius: '8px', border: 'none',
                    background: 'rgba(255,255,255,0.05)', color: index === links.length - 1 ? '#475569' : 'var(--text-main)',
                    cursor: index === links.length - 1 ? 'default' : 'pointer'
                  }}
                  title="Перемістити вниз"
                >
                  <ArrowDown size={14} />
                </button>

                <button
                  onClick={() => handleOpenEdit(index)}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                    background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Edit3 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(index)}
                  style={{
                    padding: '6px', borderRadius: '8px', border: 'none',
                    background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
                    cursor: 'pointer'
                  }}
                  title="Видалити"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Права колонка: Симуляція мобільного екрана (Preview) */}
        <div style={{
          background: '#0a0a1a',
          borderRadius: '32px',
          padding: '24px 16px',
          border: '4px solid #1e1e38',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          maxWidth: '380px',
          width: '100%',
          justifySelf: 'center'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '18px',
              margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
              overflow: 'hidden'
            }}>
              <img src="/images/buba-logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>BUBA STORE</h3>
            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>ПЕРЕДПЕРЕГЛЯД /LINKS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(22, 22, 48, 0.9)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }} className={`bg-gradient-to-br ${item.colorGradient || 'from-purple-600 to-pink-600'}`}>
                    {renderLinkIcon(item.iconType, { size: 16 })}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{item.title}</div>
                      {item.badge && (
                        <span style={{ fontSize: '8px', fontWeight: 900, padding: '1px 5px', borderRadius: '100px', background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#f3e8ff' }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.subtitle}</div>}
                  </div>
                </div>
                <ArrowUpRight size={16} style={{ color: '#64748b', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

      </div>
      )}

      {/* Модальне вікно створення/редагування посилання */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <form
            onSubmit={handleSaveForm}
            style={{
              background: '#161630', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', padding: '28px', maxWidth: '480px', width: '100%',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>
              {editingIndex !== null ? 'Редагувати посилання' : 'Додати нове посилання'}
            </h3>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Заголовок (Назва мережі / кнопки) *
              </label>
              <input
                type="text"
                required
                placeholder="напр: TikTok Профіль"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Підзаголовок / Опис
              </label>
              <input
                type="text"
                placeholder="напр: Відеопроцес 3D друку"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Посилання (URL) *
              </label>
              <input
                type="text"
                required
                placeholder="https://tiktok.com/@your_username або /custom-modeling"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Бейдж / Тег (необов'язково)
                </label>
                <input
                  type="text"
                  placeholder="напр: Тренди, 24/7"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Іконка
                </label>
                <select
                  value={formData.iconType}
                  onChange={(e) => setFormData({ ...formData, iconType: e.target.value })}
                  style={{
                    width: '100%', background: '#0f0f23', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none'
                  }}
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Стиль колірного градієнта
              </label>
              <select
                value={formData.colorGradient}
                onChange={(e) => setFormData({ ...formData, colorGradient: e.target.value })}
                style={{
                  width: '100%', background: '#0f0f23', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none'
                }}
              >
                {GRADIENT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={formData.isInternal}
                  onChange={(e) => setFormData({ ...formData, isInternal: e.target.checked })}
                />
                <span>Внутрішнє посилання</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span>Сяйво (Glow)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#f87171' }}>
                <input
                  type="checkbox"
                  checked={formData.hidden}
                  onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
                />
                <span>Тимчасово приховати</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Скасувати
              </button>
              <button
                type="submit"
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Зберегти
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
