"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { renderLinkIcon, DEFAULT_SOCIAL_LINKS } from '@/app/links/page';
import { 
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Save, CheckCircle, 
  ExternalLink, Globe, Sparkles, Move, RefreshCw, Link as LinkIcon,
  Layers, ShoppingBag, MessageCircle, Flame, Star
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

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    url: '',
    badge: '',
    iconType: 'general',
    isInternal: false,
    featured: false,
    colorGradient: 'from-purple-600 via-pink-600 to-amber-500'
  });

  useEffect(() => {
    loadLinks();
  }, []);

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
        
        if (error) throw error;
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (err) {
        alert('Помилка збереження в базу даних: ' + err.message);
      }
    }
    setSaving(false);
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

      {/* Основний вміст: Список посилань ліворуч + Прев'ю праворуч */}
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
                border: '1px solid var(--border)',
                gap: '12px'
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.2)', color: '#c084fc' }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {item.url}
                  </span>
                </div>
              </div>

              {/* Дії (Up, Down, Edit, Delete) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
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
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)'
            }}>
              <Globe size={32} color="#fff" />
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
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{item.title}</div>
                    {item.subtitle && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.subtitle}</div>}
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: '#64748b' }} />
              </div>
            ))}
          </div>
        </div>

      </div>

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

            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={formData.isInternal}
                  onChange={(e) => setFormData({ ...formData, isInternal: e.target.checked })}
                />
                <span>Внутрішнє посилання сайту</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span>Виділена картка (Glow)</span>
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
