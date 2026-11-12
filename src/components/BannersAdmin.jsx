"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Edit3, ArrowUp, ArrowDown, Upload, Image as ImageIcon,
  Save, CheckCircle, Eye, EyeOff, Search, Package, X, ArrowRight, Loader2
} from 'lucide-react';

const EMPTY_FORM = {
  id: '',
  title: '',
  accent_title: '',
  subtitle: '',
  button_text: '',
  image_url: '',
  action_type: 'products',
  product_ids: [],
  category: '',
  url: '/catalog',
  is_active: true
};

export default function BannersAdmin({ products = [], categories = [], isMobile = false }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingIndex, setEditingIndex] = useState(null); // null = list, -1 = new, >=0 = edit index
  const [form, setForm] = useState(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'store_banners')
        .single();
      if (data && Array.isArray(data.value)) {
        setBanners(data.value);
      }
      setLoading(false);
    }
    load();
  }, []);

  const persistBanners = async (nextBanners) => {
    setBanners(nextBanners);
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'store_banners', value: nextBanners }, { onConflict: 'key' });
    setSaving(false);
    if (!error) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } else {
      alert('Помилка збереження банерів: ' + error.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `banners/banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      setForm(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      alert('Не вдалося завантажити фото: ' + (err.message || err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openNewForm = () => {
    setForm({ ...EMPTY_FORM, id: `banner-${Date.now()}` });
    setProductSearch('');
    setEditingIndex(-1);
  };

  const openEditForm = (idx) => {
    const target = banners[idx];
    setForm({
      ...EMPTY_FORM,
      ...target,
      product_ids: Array.isArray(target.product_ids) ? target.product_ids.map(String) : []
    });
    setProductSearch('');
    setEditingIndex(idx);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    const cleaned = {
      ...form,
      id: form.id || `banner-${Date.now()}`,
      product_ids: Array.isArray(form.product_ids) ? form.product_ids : []
    };
    let next;
    if (editingIndex === -1) {
      next = [...banners, cleaned];
    } else {
      next = banners.map((b, i) => (i === editingIndex ? cleaned : b));
    }
    await persistBanners(next);
    setEditingIndex(null);
  };

  const toggleProductInForm = (pid) => {
    const sid = String(pid);
    setForm(prev => {
      const exists = prev.product_ids.includes(sid);
      return {
        ...prev,
        product_ids: exists
          ? prev.product_ids.filter(id => id !== sid)
          : [...prev.product_ids, sid]
      };
    });
  };

  const moveBanner = async (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    await persistBanners(next);
  };

  const toggleActive = async (idx) => {
    const next = banners.map((b, i) => (i === idx ? { ...b, is_active: b.is_active === false } : b));
    await persistBanners(next);
  };

  const deleteBanner = async (idx) => {
    if (!confirm('Видалити цей банер?')) return;
    const next = banners.filter((_, i) => i !== idx);
    await persistBanners(next);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = products.filter(p => !p.is_hidden);
    if (!q) return list;
    return list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const categoryNames = useMemo(() => {
    const set = new Set();
    categories.forEach(c => c?.name && set.add(c.name));
    products.forEach(p => p?.category && set.add(p.category));
    return Array.from(set).sort();
  }, [categories, products]);

  const describeAction = (b) => {
    if (b.action_type === 'products') {
      const count = Array.isArray(b.product_ids) ? b.product_ids.length : 0;
      if (count === 1) {
        const p = products.find(pr => String(pr.id) === String(b.product_ids[0]));
        return p ? `Товар: ${p.name}` : '1 вибраний товар';
      }
      return `Підбірка товарів: ${count} шт.`;
    }
    if (b.action_type === 'category') {
      return b.category ? `Категорія: ${b.category}` : 'Категорія не вибрана';
    }
    return `Посилання: ${b.url || '/catalog'}`;
  };

  if (loading) {
    return (
      <div className="dusk-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--color-muted)' }}>
        Завантаження банерів...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Bar */}
      <div className="dusk-panel" style={{
        padding: isMobile ? '14px 16px' : '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Банери головної сторінки
            </h2>
            {savedToast && (
              <span className="dusk-badge dusk-badge--accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={12} /> Збережено
              </span>
            )}
            {saving && <Loader2 size={15} className="animate-spin" style={{ color: 'var(--color-accent)' }} />}
          </div>
          {!isMobile && (
            <p style={{ fontSize: 12.5, color: 'var(--color-muted)', margin: '4px 0 0' }}>
              Керуйте слайдером у шапці магазину та обирайте, які товари чи категорії відкриває кожен банер.
            </p>
          )}
        </div>

        {editingIndex === null ? (
          <button type="button" onClick={openNewForm} className="dusk-btn dusk-btn--primary">
            <Plus size={15} />
            <span>Додати банер</span>
          </button>
        ) : (
          <button type="button" onClick={() => setEditingIndex(null)} className="dusk-btn">
            <X size={15} />
            <span>Назад до списку</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {editingIndex !== null ? (
        <form onSubmit={handleSaveForm} className="dusk-panel" style={{ padding: isMobile ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Live Preview */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Попередній перегляд
            </div>
            <div style={{
              position: 'relative',
              width: '100%',
              height: isMobile ? 170 : 220,
              borderRadius: 16,
              overflow: 'hidden',
              background: '#13151B',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {form.image_url ? (
                <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                  Завантажте зображення банера
                </div>
              )}
              {(form.title || form.accent_title || form.subtitle || form.button_text) && (
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: isMobile ? '14px 18px' : '20px 32px',
                    maxWidth: '62%',
                    gap: 6
                  }}>
                    {(form.title || form.accent_title) && (
                      <div style={{ fontSize: isMobile ? 18 : 28, fontWeight: 800, color: '#F3F4F8', lineHeight: 1.08, textTransform: 'uppercase' }}>
                        {form.title}{' '}
                        {form.accent_title && <span style={{ color: '#93A2FA' }}>{form.accent_title}</span>}
                      </div>
                    )}
                    {form.subtitle && (
                      <div style={{ fontSize: isMobile ? 11.5 : 13.5, color: '#D4D8E3' }}>{form.subtitle}</div>
                    )}
                    {form.button_text && (
                      <span style={{
                        marginTop: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        height: 32,
                        padding: '0 14px',
                        borderRadius: 999,
                        background: '#93A2FA',
                        color: '#13151B',
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        <span>{form.button_text}</span>
                        <ArrowRight size={13} />
                      </span>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload & Text Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6 }}>
                Зображення банера (рекомендовано широкоформатне, напр. 1600×500)
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="dusk-input"
                  value={form.image_url}
                  onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://... або завантажте файл"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <label className="dusk-btn" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{uploading ? 'Завантаження...' : 'Завантажити фото'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6 }}>
                Заголовок
              </label>
              <input
                type="text"
                className="dusk-input"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Наприклад: МІНІСВІТИ"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6 }}>
                Акцентне слово (підсвічується синім)
              </label>
              <input
                type="text"
                className="dusk-input"
                value={form.accent_title}
                onChange={e => setForm(prev => ({ ...prev, accent_title: e.target.value }))}
                placeholder="Наприклад: 3D"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6 }}>
                Підзаголовок
              </label>
              <input
                type="text"
                className="dusk-input"
                value={form.subtitle}
                onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Маленькі світи з великим характером"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6 }}>
                Текст кнопки
              </label>
              <input
                type="text"
                className="dusk-input"
                value={form.button_text}
                onChange={e => setForm(prev => ({ ...prev, button_text: e.target.value }))}
                placeholder="Дивитися колекцію"
              />
            </div>
          </div>

          {/* Click Action */}
          <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 8 }}>
                Що відкриває банер при натисканні
              </label>
              <div className="dusk-segmented" style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                {[
                  { id: 'products', label: 'Вибрані товари' },
                  { id: 'category', label: 'Категорія' },
                  { id: 'url', label: 'Своє посилання' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, action_type: opt.id }))}
                    className={`dusk-segmented-btn ${form.action_type === opt.id ? 'is-active' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {form.action_type === 'products' && (
              <div style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-rule)',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input
                      type="text"
                      className="dusk-input"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Пошук товару для прив'язки..."
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="dusk-badge dusk-badge--accent dusk-num">
                      Обрано: {form.product_ids.length}
                    </span>
                    {form.product_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, product_ids: [] }))}
                        className="dusk-btn"
                        style={{ height: 30, fontSize: 11.5 }}
                      >
                        Очистити
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                  Обери 1 товар — банер відкриє його картку. Обери 2+ товари — банер відкриє цю підбірку в каталозі.
                </div>

                <div style={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 6
                }}>
                  {filteredProducts.map(p => {
                    const checked = form.product_ids.includes(String(p.id));
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 10px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: checked ? 'rgba(147, 162, 250, 0.14)' : 'var(--color-paper-2)',
                          border: checked ? '1px solid rgba(147, 162, 250, 0.4)' : '1px solid var(--color-rule)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProductInForm(p.id)}
                          style={{ accentColor: '#93A2FA', flexShrink: 0 }}
                        />
                        {p.image_url ? (
                          <img src={p.image_url} alt="" style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: 7, background: 'var(--color-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} style={{ color: 'var(--color-muted)' }} />
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                            {p.category ? `${p.category} · ` : ''}{p.price} ₴
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {form.action_type === 'category' && (
              <div>
                <select
                  className="dusk-input"
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ maxWidth: 360 }}
                >
                  <option value="">Оберіть категорію...</option>
                  {categoryNames.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {form.action_type === 'url' && (
              <div>
                <input
                  type="text"
                  className="dusk-input"
                  value={form.url}
                  onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="/catalog, /hits, /custom-modeling або https://..."
                  style={{ maxWidth: 460 }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-ink-2)' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                style={{ accentColor: '#93A2FA' }}
              />
              <span>Показувати банер у магазині</span>
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setEditingIndex(null)} className="dusk-btn">
                Скасувати
              </button>
              <button type="submit" disabled={saving} className="dusk-btn dusk-btn--primary">
                <Save size={15} />
                <span>{saving ? 'Збереження...' : 'Зберегти банер'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : banners.length === 0 ? (
        <div className="dusk-panel" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ImageIcon size={34} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
            Поки що немає власних банерів
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', maxWidth: 420 }}>
            Зараз у магазині показується стандартний банер. Додай свій перший слайд і прив’яжи потрібні товари або категорію.
          </div>
          <button type="button" onClick={openNewForm} className="dusk-btn dusk-btn--primary">
            <Plus size={15} />
            <span>Створити перший банер</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {banners.map((b, idx) => (
            <div
              key={b.id || idx}
              className="dusk-panel"
              style={{
                padding: isMobile ? 12 : 14,
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 14,
                opacity: b.is_active === false ? 0.55 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: isMobile ? 88 : 132,
                  height: isMobile ? 54 : 72,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#13151B',
                  border: '1px solid var(--color-rule)',
                  flexShrink: 0
                }}>
                  {b.image_url ? (
                    <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={20} style={{ color: 'var(--color-muted)' }} />
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-ink)' }}>
                      {b.title || 'Без заголовка'} {b.accent_title && <span style={{ color: 'var(--color-accent)' }}>{b.accent_title}</span>}
                    </span>
                    <span className={`dusk-badge ${b.is_active === false ? '' : 'dusk-badge--accent'}`}>
                      {b.is_active === false ? 'Прихований' : 'Активний'}
                    </span>
                  </div>
                  {b.subtitle && (
                    <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.subtitle}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>
                    {describeAction(b)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => moveBanner(idx, -1)} disabled={idx === 0} className="dusk-btn" title="Вгору" style={{ padding: '0 8px' }}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1} className="dusk-btn" title="Вниз" style={{ padding: '0 8px' }}>
                  <ArrowDown size={14} />
                </button>
                <button type="button" onClick={() => toggleActive(idx)} className="dusk-btn" title={b.is_active === false ? 'Увімкнути' : 'Приховати'} style={{ padding: '0 8px' }}>
                  {b.is_active === false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button type="button" onClick={() => openEditForm(idx)} className="dusk-btn" title="Редагувати">
                  <Edit3 size={14} />
                  <span>Змінити</span>
                </button>
                <button type="button" onClick={() => deleteBanner(idx)} className="dusk-btn" title="Видалити" style={{ color: 'var(--color-danger)', padding: '0 8px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
