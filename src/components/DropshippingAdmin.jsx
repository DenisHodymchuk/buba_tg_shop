"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Edit3, Search, ExternalLink, Copy, Check, Upload,
  Sparkles, Loader2, Image as ImageIcon, X, Tag, Eye, EyeOff,
  Download, ShoppingBag, Settings, Star, ArrowUp, ArrowDown, FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DEFAULT_DROPSHIPPING_DATA = {
  headerTitle: 'BUBA SHOP • Дропшипінг Каталог',
  headerSubtitle: 'Актуальний каталог 3D-друкованих іграшок та аксесуарів. Завантажуйте живі фото у високій якості, копіюйте готові описи та заробляйте разом з нами!',
  contactTelegram: 'https://t.me/ande_3d_manager',
  contactLabel: 'Написати менеджеру в Telegram',
  termsNote: '⚡ Відправка щодня Новою Поштою та Укрпоштою • Можливий друк у будь-яких кольорах під замовлення клієнта',
  categories: ['Дракони', 'Тваринки', 'Брелоки', 'Антистрес', 'Підставки та Декор'],
  items: []
};

export default function DropshippingAdmin({ showToast, storeProducts = [] }) {
  const [catalog, setCatalog] = useState(DEFAULT_DROPSHIPPING_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportStoreModal, setShowImportStoreModal] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // Add / Edit Product Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [makerworldUrl, setMakerworldUrl] = useState('');
  const [isParsingMw, setIsParsingMw] = useState(false);
  const [parsedCostHint, setParsedCostHint] = useState('');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Дракони',
    dropPrice: '',
    rrpPrice: '',
    description: '',
    images: [],
    sku: '',
    weight: '',
    colorsNote: 'Доступні різні кольори під замовлення',
    inStock: true,
    hidden: false,
    makerworldUrl: ''
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('buba_dropshipping_catalog');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.items)) {
              setCatalog({ ...DEFAULT_DROPSHIPPING_DATA, ...parsed });
            }
          } catch (_) {}
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'dropshipping_catalog')
          .maybeSingle();

        if (!error && data?.value) {
          const merged = {
            ...DEFAULT_DROPSHIPPING_DATA,
            ...data.value,
            categories: Array.isArray(data.value.categories) && data.value.categories.length > 0
              ? data.value.categories
              : DEFAULT_DROPSHIPPING_DATA.categories,
            items: Array.isArray(data.value.items) ? data.value.items : []
          };
          setCatalog(merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem('buba_dropshipping_catalog', JSON.stringify(merged));
          }
        }
      }
    } catch (err) {
      console.error('Error loading dropshipping catalog:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveCatalog(nextCatalog, successMsg = 'Каталог дропшипінгу збережено ✅') {
    setSaving(true);
    setCatalog(nextCatalog);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_dropshipping_catalog', JSON.stringify(nextCatalog));
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'dropshipping_catalog', value: nextCatalog }, { onConflict: 'key' });
        if (error) throw error;
      }
      if (successMsg) showToast?.(successMsg, 'success');
    } catch (err) {
      console.error('Error saving dropshipping catalog:', err);
      showToast?.('Помилка збереження в БД: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  }

  const openAddModal = () => {
    setEditingItem(null);
    setIsDuplicating(false);
    setMakerworldUrl('');
    setParsedCostHint('');
    setManualImageUrl('');
    setFormData({
      name: '',
      category: catalog.categories[0] || 'Дракони',
      dropPrice: '',
      rrpPrice: '',
      description: '',
      images: [],
      sku: `DRP-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: '',
      colorsNote: 'Доступні різні кольори під замовлення',
      inStock: true,
      hidden: false,
      makerworldUrl: ''
    });
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsDuplicating(false);
    setMakerworldUrl(item.makerworldUrl || '');
    setParsedCostHint('');
    setManualImageUrl('');
    setFormData({
      name: item.name || '',
      category: item.category || catalog.categories[0] || 'Дракони',
      dropPrice: item.dropPrice !== undefined ? String(item.dropPrice) : '',
      rrpPrice: item.rrpPrice !== undefined && item.rrpPrice !== '' ? String(item.rrpPrice) : '',
      description: item.description || '',
      images: Array.isArray(item.images) ? item.images : [],
      sku: item.sku || '',
      weight: item.weight || '',
      colorsNote: item.colorsNote || '',
      inStock: item.inStock !== false,
      hidden: !!item.hidden,
      makerworldUrl: item.makerworldUrl || ''
    });
    setShowFormModal(true);
  };

  const handleDuplicate = (item) => {
    setEditingItem(null);
    setIsDuplicating(true);
    setMakerworldUrl(item.makerworldUrl || '');
    setParsedCostHint('');
    setManualImageUrl('');
    setFormData({
      name: item.name || '',
      category: item.category || catalog.categories[0] || 'Дракони',
      dropPrice: item.dropPrice !== undefined ? String(item.dropPrice) : '',
      rrpPrice: item.rrpPrice !== undefined && item.rrpPrice !== '' ? String(item.rrpPrice) : '',
      description: item.description || '',
      images: Array.isArray(item.images) ? [...item.images] : [],
      sku: `DRP-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: item.weight || '',
      colorsNote: item.colorsNote || '',
      inStock: item.inStock !== false,
      hidden: false,
      makerworldUrl: item.makerworldUrl || ''
    });
    setShowFormModal(true);
    showToast?.('Дані скопійовано! Внесіть зміни (назву, розмір, ціну тощо) та збережіть.', 'info');
  };

  // Parse from MakerWorld URL
  const handleParseMakerWorld = async () => {
    const url = makerworldUrl.trim();
    if (!url || !url.includes('makerworld.com')) {
      showToast?.('Вставте коректне посилання на модель з makerworld.com', 'error');
      return;
    }

    setIsParsingMw(true);
    try {
      const res = await fetch('/api/parse-makerworld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Не вдалося розпарсити посилання');
      }

      const allParsedImages = [
        data.image_url,
        ...(Array.isArray(data.image_urls) ? data.image_urls : [])
      ].filter(Boolean);

      // Deduplicate images while keeping existing ones if any
      const combinedImages = Array.from(new Set([...allParsedImages, ...formData.images]));

      // Separate public description from admin cost calculation notes
      let cleanDesc = data.description || '';
      let costHint = '';
      if (cleanDesc.includes('|||ADMIN_NOTES|||')) {
        const parts = cleanDesc.split('|||ADMIN_NOTES|||');
        cleanDesc = (parts[0] || '').trim();
        costHint = (parts[1] || '').trim();
      }

      setParsedCostHint(costHint);
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: cleanDesc || prev.description,
        images: combinedImages,
        weight: data.weight || prev.weight,
        makerworldUrl: url
      }));

      showToast?.(`Імпортовано з MakerWorld! Знайдено ${allParsedImages.length} фото ✨`, 'success');
    } catch (err) {
      console.error('MakerWorld parse error:', err);
      showToast?.(`Помилка парсингу: ${err.message}`, 'error');
    } finally {
      setIsParsingMw(false);
    }
  };

  // Multi-file upload to Supabase Storage
  const handleMultiPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!supabase) {
      showToast?.('Немає підключення до Supabase Storage', 'error');
      return;
    }

    setIsUploadingPhotos(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        if (publicUrl) uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      showToast?.(`Завантажено фото: ${uploadedUrls.length} шт.`, 'success');
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast?.(`Помилка завантаження фото: ${err.message}`, 'error');
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleAddManualImageUrl = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    if (formData.images.includes(trimmed)) {
      showToast?.('Це фото вже додано', 'info');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, trimmed]
    }));
    setManualImageUrl('');
  };

  const handleRemoveImage = (idx) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const handleMakeMainImage = (idx) => {
    if (idx === 0) return;
    setFormData(prev => {
      const next = [...prev.images];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return { ...prev, images: next };
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast?.('Введіть назву товару', 'error');
      return;
    }
    if (!formData.dropPrice) {
      showToast?.('Вкажіть ціну для дропшипінгу', 'error');
      return;
    }
    if (formData.images.length === 0) {
      showToast?.('Додайте хоча б одне фото (або спарсіть з MakerWorld)', 'error');
      return;
    }

    const catTrimmed = (formData.category || 'Інше').trim();
    const updatedCategories = catalog.categories.includes(catTrimmed)
      ? catalog.categories
      : [...catalog.categories, catTrimmed];

    const itemPayload = {
      id: editingItem ? editingItem.id : `drop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: formData.name.trim(),
      category: catTrimmed,
      dropPrice: parseFloat(formData.dropPrice) || 0,
      rrpPrice: formData.rrpPrice ? (parseFloat(formData.rrpPrice) || '') : '',
      description: formData.description.trim(),
      images: formData.images,
      sku: formData.sku.trim(),
      weight: formData.weight.trim(),
      colorsNote: formData.colorsNote.trim(),
      inStock: formData.inStock,
      hidden: formData.hidden,
      makerworldUrl: formData.makerworldUrl.trim(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextItems = editingItem
      ? catalog.items.map(it => it.id === editingItem.id ? itemPayload : it)
      : [itemPayload, ...catalog.items];

    await saveCatalog(
      { ...catalog, categories: updatedCategories, items: nextItems },
      editingItem ? 'Товар оновлено ✅' : 'Товар додано в каталог дропшипінгу 🎉'
    );
    setShowFormModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Видалити цей товар з каталогу дропшипінгу?')) return;
    const nextItems = catalog.items.filter(it => it.id !== id);
    await saveCatalog({ ...catalog, items: nextItems }, 'Товар видалено');
  };

  const handleToggleVisibility = async (item) => {
    const nextItems = catalog.items.map(it =>
      it.id === item.id ? { ...it, hidden: !it.hidden } : it
    );
    await saveCatalog(
      { ...catalog, items: nextItems },
      item.hidden ? 'Товар тепер видимий у каталозі 👁️' : 'Товар приховано з публічного каталогу'
    );
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryInput.trim();
    if (!name) return;
    if (catalog.categories.includes(name)) {
      showToast?.('Така категорія вже існує', 'info');
      return;
    }
    const nextCategories = [...catalog.categories, name];
    setNewCategoryInput('');
    await saveCatalog({ ...catalog, categories: nextCategories }, `Категорію «${name}» додано`);
  };

  const handleDeleteCategory = async (catName) => {
    const count = catalog.items.filter(i => i.category === catName).length;
    if (count > 0 && !confirm(`У категорії «${catName}» є ${count} товарів. Видалити категорію зі списку вкладок?`)) {
      return;
    }
    const nextCategories = catalog.categories.filter(c => c !== catName);
    if (activeCategory === catName) setActiveCategory('Всі');
    await saveCatalog({ ...catalog, categories: nextCategories }, `Категорію «${catName}» видалено`);
  };

  const handleImportStoreProduct = (prod) => {
    const imgs = [
      prod.image_url,
      ...(Array.isArray(prod.image_urls) ? prod.image_urls : [])
    ].filter(Boolean);

    let cleanDesc = prod.description || '';
    if (cleanDesc.includes('|||ADMIN_NOTES|||')) {
      cleanDesc = cleanDesc.split('|||ADMIN_NOTES|||')[0].trim();
    }

    setShowImportStoreModal(false);
    setEditingItem(null);
    setParsedCostHint('');
    setFormData({
      name: prod.name || '',
      category: prod.category && catalog.categories.includes(prod.category) ? prod.category : (prod.category || catalog.categories[0] || 'Дракони'),
      dropPrice: prod.price ? String(Math.round(prod.price * 0.75)) : '',
      rrpPrice: prod.price ? String(prod.price) : '',
      description: cleanDesc,
      images: imgs,
      sku: `DRP-${prod.id || Math.floor(1000 + Math.random() * 9000)}`,
      weight: prod.weight || '',
      colorsNote: prod.color ? `Базовий колір: ${prod.color} (доступні й інші)` : 'Доступні різні кольори під замовлення',
      inStock: true,
      hidden: false,
      makerworldUrl: ''
    });
    setShowFormModal(true);
    showToast?.('Дані товару підтягнуто! Перевірте дроп-ціну та збережіть.', 'success');
  };

  const copyPublicUrl = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/dropshipping`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast?.('Посилання на каталог скопійовано! 📋', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredItems = useMemo(() => {
    return (catalog.items || []).filter(item => {
      const matchesCat = activeCategory === 'Всі' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [catalog.items, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#a855f7' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* HEADER BAR */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(45,212,191,0.08))',
        border: '1px solid rgba(168,85,247,0.25)',
        borderRadius: 24,
        padding: isMobile ? 16 : 24,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 950, color: '#fff', margin: 0 }}>
              🤝 Каталог Дропшипінгу
            </h1>
            <span style={{
              background: 'rgba(45,212,191,0.15)', color: '#2dd4bf',
              border: '1px solid rgba(45,212,191,0.3)', borderRadius: 99,
              padding: '3px 10px', fontSize: 11, fontWeight: 900
            }}>
              {catalog.items.length} товарів
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '6px 0 0 0' }}>
            Публічна сторінка з категоріями, цінами, описами та завантаженням фото в 1 клік (доступна всім за посиланням <b>/dropshipping</b>)
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={copyPublicUrl}
            style={{
              padding: '10px 14px', borderRadius: 12,
              background: copiedLink ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
              border: copiedLink ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.12)',
              color: copiedLink ? '#4ade80' : '#fff',
              fontSize: 12, fontWeight: 850, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {copiedLink ? <Check size={15} /> : <Copy size={15} />}
            {copiedLink ? 'Посилання скопійовано!' : 'Скопіювати лінк'}
          </button>

          <a
            href="/dropshipping"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)',
              color: '#60a5fa', fontSize: 12, fontWeight: 850, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <ExternalLink size={15} /> Відкрити каталог
          </a>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1', fontSize: 12, fontWeight: 850, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Settings size={15} /> Шапка та умови
          </button>

          {storeProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowImportStoreModal(true)}
              style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)',
                color: '#d8b4fe', fontSize: 12, fontWeight: 850, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <ShoppingBag size={15} /> З магазину
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: '10px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: '#fff', fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 8px 20px rgba(124,58,237,0.35)'
            }}
          >
            <Plus size={16} /> ДОДАТИ ТОВАР
          </button>
        </div>
      </div>

      {/* CATEGORIES & SEARCH BAR */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: isMobile ? 12 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 10 }}>
          {/* Search */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '8px 14px'
          }}>
            <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Пошук товару в дроп-каталозі..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Add Category */}
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Нова категорія..."
              value={newCategoryInput}
              onChange={e => setNewCategoryInput(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '8px 14px', color: '#fff', fontSize: 12.5, outline: 'none',
                minWidth: isMobile ? 0 : 180, flex: 1
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(45,212,191,0.3)',
                background: 'rgba(45,212,191,0.12)', color: '#2dd4bf',
                fontSize: 12, fontWeight: 850, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <FolderPlus size={14} /> + Категорія
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {['Всі', ...catalog.categories].map(cat => {
            const active = activeCategory === cat;
            const count = cat === 'Всі'
              ? catalog.items.length
              : catalog.items.filter(i => i.category === cat).length;

            return (
              <div
                key={cat}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 10,
                  background: active ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.04)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer'
                }}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 99,
                  background: active ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#fff' : '#cbd5e1'
                }}>
                  {count}
                </span>
                {cat !== 'Всі' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    title="Видалити категорію"
                    style={{
                      background: 'none', border: 'none', color: active ? 'rgba(255,255,255,0.8)' : '#64748b',
                      cursor: 'pointer', padding: '0 2px', fontSize: 11, lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ITEMS GRID */}
      {filteredItems.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 24, padding: '60px 20px', textAlign: 'center'
        }}>
          <ShoppingBag size={42} style={{ color: '#64748b', marginBottom: 12 }} />
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: '0 0 8px 0' }}>
            У цій категорії ще немає товарів для дропшипінгу
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, maxWidth: 460, margin: '0 auto 20px' }}>
            Додайте товар за посиланням з MakerWorld (усі фото підтягнуться автоматично) або завантажте свої фото.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: '12px 24px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            <Plus size={18} /> Додати перший товар
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 16
        }}>
          {filteredItems.map(item => {
            const mainImg = item.images?.[0] || '';
            const photoCount = item.images?.length || 0;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: item.hidden ? '1px dashed rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: item.hidden ? 0.65 : 1
                }}
              >
                {/* Image Header */}
                <div style={{ position: 'relative', aspectRatio: '4/3', background: '#0f172a', overflow: 'hidden' }}>
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <ImageIcon size={36} />
                    </div>
                  )}

                  {/* Category & Photo Count Badges */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
                      color: '#e2e8f0', padding: '4px 10px', borderRadius: 8,
                      fontSize: 11, fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {item.category}
                    </span>
                    <span style={{
                      background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(8px)',
                      color: '#fff', padding: '4px 9px', borderRadius: 8,
                      fontSize: 11, fontWeight: 850
                    }}>
                      📷 {photoCount} фото
                    </span>
                  </div>

                  {item.hidden && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(239,68,68,0.9)', color: '#fff',
                      padding: '4px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: 900
                    }}>
                      ПРИХОВАНО
                    </div>
                  )}

                  {/* Thumbnail strip if multiple photos */}
                  {photoCount > 1 && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8, right: 8,
                      display: 'flex', gap: 4, overflowX: 'auto', padding: 4,
                      background: 'rgba(2,11,24,0.75)', backdropFilter: 'blur(6px)',
                      borderRadius: 10
                    }}>
                      {item.images.slice(0, 6).map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt=""
                          style={{
                            width: 34, height: 34, borderRadius: 6, objectFit: 'cover',
                            border: idx === 0 ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.15)',
                            flexShrink: 0
                          }}
                        />
                      ))}
                      {photoCount > 6 && (
                        <div style={{
                          width: 34, height: 34, borderRadius: 6, background: 'rgba(255,255,255,0.1)',
                          color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          +{photoCount - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 950, color: '#2dd4bf' }}>
                        {item.dropPrice} ₴
                      </div>
                      {item.rrpPrice && (
                        <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>
                          РРЦ: {item.rrpPrice} ₴
                        </div>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p style={{
                      fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.45,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      style={{
                        flex: 1, minWidth: 95, padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#60a5fa', fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                      }}
                    >
                      <Edit3 size={13} /> Редагувати
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      title="Створити копію та змінити дані"
                      style={{
                        flex: 1, minWidth: 95, padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                        color: '#c084fc', fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                      }}
                    >
                      <Copy size={13} /> Дублювати
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item)}
                      title={item.hidden ? 'Показати у каталозі' : 'Приховати з каталогу'}
                      style={{
                        padding: '8px 9px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: item.hidden ? '#f59e0b' : '#94a3b8', cursor: 'pointer'
                      }}
                    >
                      {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Видалити"
                      style={{
                        padding: '8px 9px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div
            onClick={() => setShowFormModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(2,11,24,0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
              padding: isMobile ? 0 : 20
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 680,
                maxHeight: isMobile ? '92vh' : '90vh',
                background: '#0b1528',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: isMobile ? '24px 24px 0 0' : 24,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.65)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <h2 style={{ fontSize: 17, fontWeight: 950, color: '#fff', margin: 0 }}>
                  {editingItem ? '✏️ Редагувати товар дропшипінгу' : (isDuplicating ? '📋 Дублювати товар (створити як новий)' : '➕ Додати товар у Дропшипінг')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 10, padding: 6, cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form id="dropship-item-form" onSubmit={handleSaveItem} style={{ padding: isMobile ? 14 : 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. MAKERWORLD PARSER */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 900, color: '#34d399', textTransform: 'uppercase' }}>
                    <Sparkles size={14} /> 1. Швидкий імпорт фото та опису з MakerWorld
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                    <input
                      type="url"
                      placeholder="Вставте посилання https://makerworld.com/en/models/..."
                      value={makerworldUrl}
                      onChange={e => setMakerworldUrl(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleParseMakerWorld}
                      disabled={isParsingMw}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none',
                        background: '#10b981', color: '#022c22', fontWeight: 950, fontSize: 12.5,
                        cursor: isParsingMw ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isParsingMw ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {isParsingMw ? 'Парсимо...' : '⚡ Спарсити з MakerWorld'}
                    </button>
                  </div>
                  {parsedCostHint && (
                    <div style={{
                      marginTop: 4, padding: 10, borderRadius: 10,
                      background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(52,211,153,0.25)',
                      fontSize: 11.5, color: '#a7f3d0', whiteSpace: 'pre-line', lineHeight: 1.4
                    }}>
                      {parsedCostHint}
                    </div>
                  )}
                </div>

                {/* 2. PHOTOS GALLERY (MULTIPLE) */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase' }}>
                      2. Фотографії товару ({formData.images.length} шт.)
                    </span>

                    <label style={{
                      padding: '7px 14px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                      color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}>
                      {isUploadingPhotos ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploadingPhotos ? 'Завантаження...' : '+ Завантажити фото (можна декілька)'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleMultiPhotoUpload}
                        disabled={isUploadingPhotos}
                      />
                    </label>
                  </div>

                  {/* Add by direct URL */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      placeholder="Або вставте пряме посилання на фото (URL)..."
                      value={manualImageUrl}
                      onChange={e => setManualImageUrl(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImageUrl}
                      style={{
                        padding: '8px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer'
                      }}
                    >
                      Додати URL
                    </button>
                  </div>

                  {/* Preview Grid */}
                  {formData.images.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: 10
                    }}>
                      {formData.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden',
                            border: idx === 0 ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.12)',
                            background: '#020b18'
                          }}
                        >
                          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                          {idx === 0 ? (
                            <span style={{
                              position: 'absolute', top: 6, left: 6,
                              background: '#2dd4bf', color: '#020b18',
                              fontSize: 9.5, fontWeight: 950, padding: '2px 6px', borderRadius: 6
                            }}>
                              ★ ГОЛОВНЕ
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakeMainImage(idx)}
                              style={{
                                position: 'absolute', bottom: 6, left: 6, right: 6,
                                background: 'rgba(2,11,24,0.85)', color: '#cbd5e1',
                                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                                padding: '3px 4px', fontSize: 9.5, fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              Зробити головним
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute', top: 6, right: 6,
                              width: 24, height: 24, borderRadius: '50%',
                              background: 'rgba(239,68,68,0.9)', color: '#fff',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: 20, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)',
                      textAlign: 'center', color: '#64748b', fontSize: 12
                    }}>
                      Поки немає фото. Спарсіть модель з MakerWorld вище або завантажте фото з пристрою.
                    </div>
                  )}
                </div>

                {/* 3. NAME, CATEGORY & PRICES */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                    3. Назва, Категорія, Ціна та Опис
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>НАЗВА ТОВАРУ *</label>
                      <input
                        type="text"
                        required
                        placeholder="Напр.: Рухомий Дракон 45 см"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: 10, color: '#fff', fontSize: 13.5, outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>КАТЕГОРІЯ *</label>
                      <input
                        type="text"
                        list="dropship-categories-list"
                        placeholder="Оберіть або впишіть нову..."
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: 10, color: '#fff', fontSize: 13.5, outline: 'none'
                        }}
                      />
                      <datalist id="dropship-categories-list">
                        {catalog.categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>

                  {/* Quick Category Chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {catalog.categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                          background: formData.category === cat ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                          border: formData.category === cat ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                          color: formData.category === cat ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Prices & Weight */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#2dd4bf', display: 'block', marginBottom: 4 }}>ДРОП-ЦІНА (₴) *</label>
                      <input
                        type="number"
                        required
                        placeholder="250"
                        value={formData.dropPrice}
                        onChange={e => setFormData({ ...formData, dropPrice: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.35)',
                          borderRadius: 10, padding: 10, color: '#2dd4bf', fontSize: 14, fontWeight: 900, outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>РРЦ / РОЗДРІБ (₴, необов&apos;язково)</label>
                      <input
                        type="number"
                        placeholder="420"
                        value={formData.rrpPrice}
                        onChange={e => setFormData({ ...formData, rrpPrice: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: 10, color: '#fff', fontSize: 13.5, outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>ВАГА / РОЗМІР (необов&apos;язково)</label>
                      <input
                        type="text"
                        placeholder="Напр.: 120г, 35 см"
                        value={formData.weight}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                      ОПИС ТОВАРУ (Дропшипери зможуть скопіювати його в 1 клік)
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Детальний опис іграшки, особливості, рухомі деталі, матеріали..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, padding: 12, color: '#fff', fontSize: 13, lineHeight: 1.5, outline: 'none', resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Colors note */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                      ПРИМІТКА ПРО КОЛЬОРИ
                    </label>
                    <input
                      type="text"
                      placeholder="Доступні будь-які кольори PLA / Silk..."
                      value={formData.colorsNote}
                      onChange={e => setFormData({ ...formData, colorsNote: e.target.value })}
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, padding: 10, color: '#fff', fontSize: 12.5, outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                background: 'rgba(255,255,255,0.02)'
              }}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{
                    padding: '11px 18px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)', border: 'none',
                    color: '#94a3b8', fontSize: 12.5, fontWeight: 850, cursor: 'pointer'
                  }}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  form="dropship-item-form"
                  disabled={saving}
                  style={{
                    padding: '11px 24px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)',
                    color: '#020b18', fontSize: 13, fontWeight: 950, cursor: 'pointer'
                  }}
                >
                  {saving ? 'Збереження...' : (editingItem ? 'Зберегти зміни' : (isDuplicating ? 'Створити як новий товар' : 'Додати в каталог'))}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div
            onClick={() => setShowSettingsModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(2,11,24,0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 520, background: '#0b1528',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 22,
                display: 'flex', flexDirection: 'column', gap: 14
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 950, color: '#fff', margin: 0 }}>
                ⚙️ Налаштування сторінки /dropshipping
              </h3>

              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>ЗАГОЛОВОК СТОРІНКИ</label>
                <input
                  type="text"
                  value={catalog.headerTitle || ''}
                  onChange={e => setCatalog({ ...catalog, headerTitle: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>ОПИС ПІД ЗАГОЛОВКОМ</label>
                <textarea
                  rows={3}
                  value={catalog.headerSubtitle || ''}
                  onChange={e => setCatalog({ ...catalog, headerSubtitle: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>КОРОТКІ УМОВИ СПІВПРАЦІ (БАНЕР)</label>
                <input
                  type="text"
                  value={catalog.termsNote || ''}
                  onChange={e => setCatalog({ ...catalog, termsNote: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 4 }}>ПОСИЛАННЯ НА TELEGRAM / INSTAGRAM ДЛЯ ЗАМОВЛЕНЬ</label>
                <input
                  type="text"
                  placeholder="https://t.me/..."
                  value={catalog.contactTelegram || ''}
                  onChange={e => setCatalog({ ...catalog, contactTelegram: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontWeight: 800, cursor: 'pointer' }}
                >
                  Закрити
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await saveCatalog(catalog, 'Налаштування сторінки збережено ✅');
                    setShowSettingsModal(false);
                  }}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#7c3aed', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                >
                  Зберегти
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT FROM EXISTING STORE MODAL */}
      <AnimatePresence>
        {showImportStoreModal && (
          <div
            onClick={() => setShowImportStoreModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(2,11,24,0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 560, maxHeight: '80vh', background: '#0b1528',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 950, color: '#fff', margin: 0 }}>
                  📥 Імпортувати товар з основного магазину
                </h3>
                <button onClick={() => setShowImportStoreModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Пошук серед товарів магазину..."
                value={storeSearchQuery}
                onChange={e => setStoreSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
              />

              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {storeProducts
                  .filter(p => !storeSearchQuery || p.name?.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                  .map(prod => (
                    <div
                      key={prod.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {prod.image_url && (
                          <img src={prod.image_url} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 850, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 800 }}>
                            Роздріб: {prod.price} ₴ • Фото: {1 + (prod.image_urls?.length || 0)} шт.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportStoreProduct(prod)}
                        style={{
                          padding: '7px 12px', borderRadius: 9, border: 'none',
                          background: '#7c3aed', color: '#fff', fontSize: 11.5, fontWeight: 850,
                          cursor: 'pointer', flexShrink: 0
                        }}
                      >
                        Вибрати
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
