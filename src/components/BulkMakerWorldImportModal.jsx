'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Loader2, Check, CheckSquare, Square, Search,
  Image as ImageIcon, Layers, Tag, Coins, ArrowLeft, ArrowRight,
  Copy, Terminal, ChevronDown, AlertCircle, CheckCircle2, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CONSOLE_SNIPPET = `(()=>{const u=[...new Set([...document.querySelectorAll('a[href*="/models/"]')].map(a=>a.href.match(/models\\/\\d+/)?.[0]).filter(Boolean))].map(m=>'https://makerworld.com/en/'+m);copy(u.join('\\n'));return 'Скопійовано моделей: '+u.length})()`;

const NAME_TEMPLATE_PRESETS = [
  { label: '{name}', value: '{name}' },
  { label: 'Фігурка {name}', value: 'Фігурка {name}' },
  { label: 'Брелок {name}', value: 'Брелок {name}' },
  { label: 'Органайзер {name}', value: 'Органайзер {name}' },
  { label: 'Декор {name}', value: 'Декор {name}' },
  { label: '{name} (3D)', value: '{name} (3D)' }
];

/**
 * Parses photo index expressions like "2345", "2, 3, 4, 5", "2-5", "1 3 4".
 * Returns 1-based unique positive integers in user-specified order.
 */
function parsePhotoIndices(raw) {
  if (!raw || !raw.trim()) return [1, 2, 3, 4];
  const trimmed = raw.trim();

  // If user typed compact digits like "2345" with no separators and length > 1
  if (/^[1-9]{2,9}$/.test(trimmed)) {
    return Array.from(new Set(trimmed.split('').map(Number)));
  }

  const result = [];
  const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10));
      const end = Math.min(30, parseInt(rangeMatch[2], 10));
      const step = start <= end ? 1 : -1;
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        if (!result.includes(i)) result.push(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && !result.includes(num)) {
        result.push(num);
      }
    }
  }
  return result.length > 0 ? result : [1];
}

function resolveImagesForModel(allImages, indices) {
  if (!Array.isArray(allImages) || allImages.length === 0) {
    return { main: '', extras: [], pickedNumbers: [] };
  }
  const picked = [];
  const pickedNumbers = [];
  for (const idx of indices) {
    const url = allImages[idx - 1];
    if (url && !picked.includes(url)) {
      picked.push(url);
      pickedNumbers.push(idx);
    }
  }
  // Fallback to 1st photo if none of requested indices exist on this model
  if (picked.length === 0 && allImages[0]) {
    picked.push(allImages[0]);
    pickedNumbers.push(1);
  }
  return {
    main: picked[0] || '',
    extras: picked.slice(1),
    pickedNumbers
  };
}

function applyNameTemplate(template, model, index, useUkrainian) {
  const baseName = useUkrainian
    ? (model.translatedTitle || model.cleanedTitle || model.originalTitle)
    : (model.cleanedTitle || model.originalTitle);
  const tpl = (template || '{name}').trim() || '{name}';
  return tpl
    .replace(/\{name\}/gi, baseName)
    .replace(/\{n\}/gi, String(index + 1))
    .replace(/\{creator\}/gi, model.creator || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getThumbUrl(url) {
  if (!url) return '';
  if (url.includes('makerworld.bblmw.com') && !url.includes('x-oss-process=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}x-oss-process=image/resize,w_200`;
  }
  return url;
}

const PAGE_SIZE = 20;

const ModelCard = React.memo(function ModelCard({
  model,
  idx,
  isSelected,
  previewName,
  previewPrice,
  categoryLabel,
  main,
  extras,
  pickedNumbers,
  onToggle,
  onOverride
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
        background: isSelected ? 'rgba(164, 174, 248, 0.06)' : 'var(--color-paper-2)',
        opacity: isSelected ? 1 : 0.55,
        transition: 'border-color 0.12s ease, opacity 0.12s ease',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 126px'
      }}
    >
      {/* Checkbox + Main photo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onToggle(model.id)}
          style={{
            width: 68,
            height: 68,
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-paper-3)',
            padding: 0,
            cursor: 'pointer'
          }}
          title="Натисніть, щоб обрати / зняти"
        >
          {main ? (
            <img
              src={getThumbUrl(main)}
              alt={previewName}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon size={20} style={{ color: 'var(--color-muted)' }} />
          )}
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: 18,
              height: 18,
              borderRadius: 5,
              background: isSelected ? 'var(--color-accent)' : 'rgba(15,16,24,0.75)',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>
        </button>
        <span className="dusk-num" style={{ fontSize: 10, color: 'var(--color-muted)' }}>
          фото: {pickedNumbers.join(',')} / {model.allImages.length}
        </span>
      </div>

      {/* Details + Editable fields */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          type="text"
          value={previewName}
          onChange={(e) => onOverride(model.id, 'name', e.target.value)}
          className="dusk-input"
          style={{ height: 30, fontSize: 12.5, fontWeight: 600, padding: '0 8px' }}
        />

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="number"
            value={previewPrice}
            onChange={(e) => onOverride(model.id, 'price', e.target.value)}
            className="dusk-input dusk-num"
            style={{ width: 82, height: 26, fontSize: 12, padding: '0 8px' }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>грн</span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-ink-2)',
              marginLeft: 'auto',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Extra photos strip */}
        {extras.length > 0 && (
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingTop: 2 }}>
            {extras.map((imgUrl, i) => (
              <img
                key={i}
                src={getThumbUrl(imgUrl)}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  objectFit: 'cover',
                  border: '1px solid var(--color-rule)',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function BulkMakerWorldImportModal({
  open,
  onClose,
  dbCategories = [],
  isMobile = false,
  onCreated
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Step: 'source' | 'configure' | 'done'
  const [step, setStep] = useState('source');

  // Step 1 state
  const [rawInput, setRawInput] = useState('');
  const [showHelper, setShowHelper] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [translateOnFetch, setTranslateOnFetch] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ loaded: 0, total: 0 });
  const [fetchError, setFetchError] = useState('');
  const [profileWarning, setProfileWarning] = useState('');

  // Step 2 state
  const [loadedModels, setLoadedModels] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterQuery, loadedModels]);

  // Global template settings
  const [photoIndicesStr, setPhotoIndicesStr] = useState('2, 3, 4, 5');
  const [nameTemplate, setNameTemplate] = useState('{name}');
  const [useUkrainianNames, setUseUkrainianNames] = useState(true);
  const [globalPrice, setGlobalPrice] = useState('250');
  const [globalDiscount, setGlobalDiscount] = useState('0');
  const [globalStatus, setGlobalStatus] = useState('in_stock');
  const [globalCategory, setGlobalCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  // Per-item overrides: { [modelId]: { name?: string, price?: string, category?: string } }
  const [overrides, setOverrides] = useState({});

  // Step 3 (saving) state
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ saved: 0, total: 0 });
  const [saveResult, setSaveResult] = useState({ createdCount: 0, errors: [] });

  useEffect(() => {
    if (open && dbCategories.length > 0 && !globalCategory) {
      setGlobalCategory(dbCategories[0].name);
    }
  }, [open, dbCategories, globalCategory]);

  // Reset when closing
  function handleClose() {
    if (isFetching || isSaving) return;
    onClose();
  }

  function handleResetToSource() {
    setStep('source');
    setFetchError('');
    setProfileWarning('');
  }

  const detectedIdsCount = useMemo(() => {
    if (!rawInput.trim()) return 0;
    const ids = new Set();
    const urlMatches = rawInput.matchAll(/models(?:\/|\\\/)(\d{4,10})/gi);
    for (const m of urlMatches) ids.add(m[1]);
    for (const t of rawInput.split(/[\s,;]+/)) {
      if (/^\d{4,10}$/.test(t.trim())) ids.add(t.trim());
    }
    return ids.size;
  }, [rawInput]);

  const parsedPhotoIndices = useMemo(() => parsePhotoIndices(photoIndicesStr), [photoIndicesStr]);

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(CONSOLE_SNIPPET);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // Fallback ignored
    }
  }

  async function handleDiscoverAndLoad() {
    if (!rawInput.trim()) return;
    setFetchError('');
    setProfileWarning('');
    setIsFetching(true);
    setFetchProgress({ loaded: 0, total: 0 });

    try {
      const discoverRes = await fetch('/api/parse-makerworld-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover', input: rawInput })
      });
      const discoverData = await discoverRes.json();
      if (!discoverRes.ok || discoverData.error) {
        throw new Error(discoverData.error || 'Не вдалося розпізнати моделі');
      }

      const ids = discoverData.modelIds || [];
      if (ids.length === 0) {
        if (discoverData.isProfileUrl) {
          throw new Error(
            `Профілі MakerWorld захищені Cloudflare. Відкрийте профіль @${discoverData.handle} у браузері та скористайтесь 1-кліковою підказкою нижче, щоб миттєво скопіювати всі посилання на моделі.`
          );
        }
        throw new Error('Моделей не знайдено. Вставте посилання на моделі або пошуковий запит.');
      }

      if (discoverData.isProfileUrl) {
        setProfileWarning(
          `Увага: через захист Cloudflare на сторінці профілю @${discoverData.handle} знайдено ${ids.length} моделей через пошук. Щоб гарантовано витягти абсолютно всі моделі автора (навіть 100+), скопіюйте їх зі сторінки профілю скриптом з Кроку 1.`
        );
      }

      // Fetch full details in chunks of 10
      const CHUNK_SIZE = 10;
      const allModels = [];
      setFetchProgress({ loaded: 0, total: ids.length });

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const detailRes = await fetch('/api/parse-makerworld-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fetch-details',
            modelIds: chunk,
            translate: translateOnFetch
          })
        });
        const detailData = await detailRes.json();
        if (detailData.models?.length) {
          allModels.push(...detailData.models);
        }
        setFetchProgress({ loaded: Math.min(i + chunk.length, ids.length), total: ids.length });
      }

      if (allModels.length === 0) {
        throw new Error('Не вдалося завантажити деталі жодної моделі.');
      }

      setLoadedModels(allModels);
      setSelectedIds(new Set(allModels.map(m => m.id)));
      setOverrides({});
      setStep('configure');
    } catch (err) {
      setFetchError(err.message || 'Помилка завантаження');
    } finally {
      setIsFetching(false);
    }
  }

  const filteredModels = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return loadedModels;
    return loadedModels.filter(m =>
      m.originalTitle?.toLowerCase().includes(q) ||
      m.translatedTitle?.toLowerCase().includes(q) ||
      m.creator?.toLowerCase().includes(q) ||
      m.id.includes(q)
    );
  }, [loadedModels, filterQuery]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function selectAllFiltered() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredModels.forEach(m => next.add(m.id));
      return next;
    });
  }

  function deselectAllFiltered() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredModels.forEach(m => next.delete(m.id));
      return next;
    });
  }

  const updateOverride = useCallback((id, field, value) => {
    setOverrides(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  }, []);

  const effectiveGlobalCategory = globalCategory === '__new__'
    ? customCategory.trim()
    : globalCategory;

  async function handleCreateProducts() {
    if (!supabase) {
      alert('Помилка: з\'єднання з базою даних не встановлено');
      return;
    }

    const selectedModels = loadedModels.filter(m => selectedIds.has(m.id));
    if (selectedModels.length === 0) return;

    const basePrice = parseFloat(globalPrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      alert('Вкажіть коректну ціну для товарів (більше 0)');
      return;
    }

    setIsSaving(true);
    setSaveProgress({ saved: 0, total: selectedModels.length });

    try {
      // If user typed a new category, create it in categories table first
      let createdCategoryObj = null;
      if (effectiveGlobalCategory) {
        const exists = dbCategories.some(
          c => c.name.toLowerCase() === effectiveGlobalCategory.toLowerCase()
        );
        if (!exists) {
          const { data: catData, error: catErr } = await supabase
            .from('categories')
            .insert([{ name: effectiveGlobalCategory }])
            .select();
          if (!catErr && catData?.[0]) {
            createdCategoryObj = catData[0];
          }
        }
      }

      const rowsToInsert = selectedModels.map((model, idx) => {
        const ov = overrides[model.id] || {};
        const computedName = ov.name !== undefined
          ? ov.name
          : applyNameTemplate(nameTemplate, model, idx, useUkrainianNames);
        const computedPrice = ov.price !== undefined && ov.price !== ''
          ? parseFloat(ov.price)
          : basePrice;
        const computedCategory = ov.category !== undefined
          ? ov.category
          : (effectiveGlobalCategory || model.suggestedCategory || '3D Модель');
        const { main, extras } = resolveImagesForModel(model.allImages, parsedPhotoIndices);

        return {
          name: computedName || model.originalTitle,
          description: '',
          price: isNaN(computedPrice) ? basePrice : computedPrice,
          discount: parseFloat(globalDiscount) || 0,
          status: globalStatus,
          model_3d: '',
          image_url: main,
          image_urls: extras,
          category: computedCategory,
          plastic_type: model.plastic_type || 'PLA',
          color: model.color || '',
          weight: model.weight || '',
          safety_info: '',
          is_trending: false
        };
      });

      const BATCH_SIZE = 20;
      const insertedAll = [];
      const errors = [];

      for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.from('products').insert(batch).select();
        if (error) {
          errors.push(error.message);
        } else if (data) {
          insertedAll.push(...data);
        }
        setSaveProgress({
          saved: Math.min(i + batch.length, rowsToInsert.length),
          total: rowsToInsert.length
        });
      }

      setSaveResult({ createdCount: insertedAll.length, errors });
      setStep('done');

      if (onCreated && insertedAll.length > 0) {
        onCreated(insertedAll, createdCategoryObj);
      }
    } catch (err) {
      alert('Помилка створення товарів: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 11, 18, 0.82)',
          zIndex: 9999,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 20
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="dusk-admin-scope dusk-theme"
          style={{
            width: '100%',
            maxWidth: step === 'configure' ? 1120 : 680,
            maxHeight: isMobile ? '94vh' : '90vh',
            borderRadius: isMobile ? '18px 18px 0 0' : 18,
            background: 'var(--color-paper)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--color-rule)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: isMobile ? '14px 16px' : '16px 22px',
              borderBottom: '1px solid var(--color-rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'var(--color-paper-2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--color-accent-soft, rgba(164, 174, 248, 0.14))',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkles size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 18, margin: 0 }}>
                  Масове заповнення з MakerWorld
                </h2>
                {!isMobile && (
                  <p className="dusk-subheading" style={{ margin: '2px 0 0', fontSize: 12 }}>
                    {step === 'source' && 'Крок 1 з 2 — Вставте список моделей або пошуковий запит'}
                    {step === 'configure' && `Крок 2 з 2 — Шаблон фото, ціни, назви та вибір (${loadedModels.length} моделей)`}
                    {step === 'done' && 'Імпорт завершено'}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isFetching || isSaving}
              className="dusk-btn dusk-btn--ghost"
              style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: 999 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: isMobile ? 14 : 22 }}>
            <AnimatePresence mode="wait">
              {step === 'source' && (
                <motion.div
                  key="source"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-2)' }}>
                        Посилання на моделі MakerWorld або нік автора / пошук
                      </label>
                      {detectedIdsCount > 0 && (
                        <span className="dusk-badge dusk-badge--accent dusk-num">
                          Знайдено моделей: {detectedIdsCount}
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={6}
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder={`Вставте посилання на моделі (по одному в рядок, до 100+ штук):\nhttps://makerworld.com/en/models/123456\nhttps://makerworld.com/en/models/654321\n\nАбо вставте HTML/текст зі сторінки автора чи ключове слово для пошуку...`}
                      className="dusk-input"
                      style={{
                        width: '100%',
                        minHeight: 140,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        lineHeight: 1.5,
                        padding: 12
                      }}
                    />
                  </div>

                  {/* Collapsible helper for extracting 100 models from a creator profile */}
                  <div
                    style={{
                      borderRadius: 12,
                      border: '1px solid var(--color-rule)',
                      background: 'var(--color-paper-2)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowHelper(v => !v)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-ink)',
                        cursor: 'pointer',
                        fontSize: 12.5,
                        fontWeight: 600
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Terminal size={14} style={{ color: 'var(--color-accent)' }} />
                        Як витягти всі 100 моделей зі сторінки автора MakerWorld за 5 секунд?
                      </span>
                      <ChevronDown
                        size={15}
                        style={{
                          transform: showHelper ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {showHelper && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 14px 14px', fontSize: 12.5, color: 'var(--color-ink-2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                              <li>Відкрийте профіль автора на <b>makerworld.com</b> і проскрольте вниз, щоб підвантажились усі моделі.</li>
                              <li>Натисніть <b>F12</b> → вкладка <b>Console</b>.</li>
                              <li>Вставте цей скрипт і натисніть <b>Enter</b> — усі посилання автоматично скопіюються в буфер обміну:</li>
                            </ol>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <code
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  background: 'var(--color-paper)',
                                  border: '1px solid var(--color-rule)',
                                  fontSize: 11,
                                  overflowX: 'auto',
                                  whiteSpace: 'nowrap',
                                  color: 'var(--color-accent)'
                                }}
                              >
                                {CONSOLE_SNIPPET}
                              </code>
                              <button
                                type="button"
                                onClick={handleCopySnippet}
                                className="dusk-btn dusk-btn--ghost"
                                style={{ flexShrink: 0, height: 34 }}
                              >
                                {copiedSnippet ? <><Check size={14} /> Скопійовано</> : <><Copy size={14} /> Копіювати</>}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Options row */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      color: 'var(--color-ink-2)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={translateOnFetch}
                      onChange={(e) => setTranslateOnFetch(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
                    />
                    <span>Автоматично перекладати назви українською</span>
                  </label>

                  {fetchError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(220, 100, 110, 0.12)',
                        border: '1px solid var(--color-danger)',
                        color: 'var(--color-danger)',
                        fontSize: 12.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{fetchError}</span>
                    </div>
                  )}

                  {isFetching && fetchProgress.total > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-ink-2)' }}>
                        <span>Завантаження моделей з MakerWorld...</span>
                        <span className="dusk-num">{fetchProgress.loaded} / {fetchProgress.total}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'var(--color-paper-3)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round((fetchProgress.loaded / fetchProgress.total) * 100)}%`,
                            background: 'var(--color-accent)',
                            transition: 'width 0.25s ease'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'configure' && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {profileWarning && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(235, 175, 115, 0.12)',
                        border: '1px solid var(--color-accent-2)',
                        color: 'var(--color-accent-2)',
                        fontSize: 12.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{profileWarning}</span>
                    </div>
                  )}

                  {/* Template Controls Panel */}
                  <div
                    className="dusk-panel"
                    style={{
                      padding: isMobile ? 12 : 16,
                      borderRadius: 14,
                      background: 'var(--color-paper-2)',
                      border: '1px solid var(--color-rule)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1.4fr 0.8fr 1fr',
                        gap: 12,
                        alignItems: 'end'
                      }}
                    >
                      {/* Photo indices */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <ImageIcon size={13} style={{ color: 'var(--color-accent)' }} />
                          Номери фото (напр. 2345 або 2,3,4,5)
                        </label>
                        <input
                          type="text"
                          value={photoIndicesStr}
                          onChange={(e) => setPhotoIndicesStr(e.target.value)}
                          placeholder="2, 3, 4, 5"
                          className="dusk-input dusk-num"
                          style={{ height: 36, fontSize: 13 }}
                        />
                      </div>

                      {/* Name template */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <Tag size={13} style={{ color: 'var(--color-accent)' }} />
                          Шаблон назви ({'{name}'}, {'{n}'})
                        </label>
                        <input
                          type="text"
                          value={nameTemplate}
                          onChange={(e) => setNameTemplate(e.target.value)}
                          placeholder="Напр. Фігурка {name}"
                          className="dusk-input"
                          style={{ height: 36, fontSize: 13 }}
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <Coins size={13} style={{ color: 'var(--color-accent)' }} />
                          Ціна всім (грн) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={globalPrice}
                          onChange={(e) => setGlobalPrice(e.target.value)}
                          placeholder="250"
                          className="dusk-input dusk-num"
                          style={{ height: 36, fontSize: 13 }}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <Layers size={13} style={{ color: 'var(--color-accent)' }} />
                          Категорія
                        </label>
                        <select
                          value={globalCategory}
                          onChange={(e) => setGlobalCategory(e.target.value)}
                          className="dusk-select"
                          style={{ height: 36, fontSize: 13 }}
                        >
                          <option value="">Авто з MakerWorld</option>
                          {dbCategories.map(c => (
                            <option key={c.id || c.name} value={c.name}>{c.name}</option>
                          ))}
                          <option value="__new__">+ Нова категорія...</option>
                        </select>
                      </div>
                    </div>

                    {/* Second row: Quick presets + Custom category + Language + Discount + Status */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Швидкі шаблони:</span>
                        {NAME_TEMPLATE_PRESETS.map(p => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setNameTemplate(p.value)}
                            className={`dusk-facet-pill ${nameTemplate === p.value ? 'is-active' : ''}`}
                            style={{ fontSize: 11, padding: '3px 9px' }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        {globalCategory === '__new__' && (
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Назва нової категорії..."
                            className="dusk-input"
                            style={{ height: 30, fontSize: 12, width: 170 }}
                          />
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-ink-2)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={useUkrainianNames}
                            onChange={(e) => setUseUkrainianNames(e.target.checked)}
                            style={{ accentColor: 'var(--color-accent)' }}
                          />
                          Укр. переклад
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Знижка %:</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(e.target.value)}
                            className="dusk-input dusk-num"
                            style={{ width: 62, height: 30, fontSize: 12, padding: '0 8px' }}
                          />
                        </div>

                        <select
                          value={globalStatus}
                          onChange={(e) => setGlobalStatus(e.target.value)}
                          className="dusk-select"
                          style={{ height: 30, fontSize: 12, width: 'auto', padding: '0 10px' }}
                        >
                          <option value="in_stock">В наявності</option>
                          <option value="out_of_stock">Немає в наявності</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Selection toolbar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="dusk-btn dusk-btn--ghost"
                        style={{ height: 32, fontSize: 12 }}
                      >
                        <CheckSquare size={14} /> Обрати всі ({filteredModels.length})
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFiltered}
                        className="dusk-btn dusk-btn--ghost"
                        style={{ height: 32, fontSize: 12 }}
                      >
                        <Square size={14} /> Зняти всі
                      </button>
                      <span className="dusk-badge dusk-badge--accent dusk-num">
                        Обрано до створення: {selectedIds.size} з {loadedModels.length}
                      </span>
                    </div>

                    <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 240 }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder="Фільтр серед завантажених..."
                        className="dusk-input"
                        style={{ paddingLeft: 30, height: 32, fontSize: 12.5, borderRadius: 999 }}
                      />
                    </div>
                  </div>

                  {/* Pagination Top */}
                  {filteredModels.length > PAGE_SIZE && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span className="dusk-num" style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        Показано {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredModels.length)} з {filteredModels.length}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Array.from({ length: Math.ceil(filteredModels.length / PAGE_SIZE) }, (_, pIdx) => {
                          const pNum = pIdx + 1;
                          return (
                            <button
                              key={pNum}
                              type="button"
                              onClick={() => setCurrentPage(pNum)}
                              className={`dusk-facet-pill dusk-num ${currentPage === pNum ? 'is-active' : ''}`}
                              style={{ fontSize: 11.5, padding: '3px 10px', minWidth: 32 }}
                            >
                              {pNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Models Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: 10
                    }}
                  >
                    {filteredModels
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((model, localIdx) => {
                      const idx = (currentPage - 1) * PAGE_SIZE + localIdx;
                      const isSelected = selectedIds.has(model.id);
                      const ov = overrides[model.id] || {};
                      const previewName = ov.name !== undefined
                        ? ov.name
                        : applyNameTemplate(nameTemplate, model, idx, useUkrainianNames);
                      const previewPrice = ov.price !== undefined ? ov.price : globalPrice;
                      const { main, extras, pickedNumbers } = resolveImagesForModel(model.allImages, parsedPhotoIndices);
                      const categoryLabel = effectiveGlobalCategory || model.suggestedCategory || '3D Модель';

                      return (
                        <ModelCard
                          key={model.id}
                          model={model}
                          idx={idx}
                          isSelected={isSelected}
                          previewName={previewName}
                          previewPrice={previewPrice}
                          categoryLabel={categoryLabel}
                          main={main}
                          extras={extras}
                          pickedNumbers={pickedNumbers}
                          onToggle={toggleSelect}
                          onOverride={updateOverride}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination Bottom */}
                  {filteredModels.length > PAGE_SIZE && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="dusk-btn dusk-btn--ghost"
                        style={{ height: 30, fontSize: 12 }}
                      >
                        ← Попередня
                      </button>
                      <span className="dusk-num" style={{ fontSize: 12, color: 'var(--color-ink-2)', padding: '0 8px' }}>
                        Сторінка {currentPage} / {Math.ceil(filteredModels.length / PAGE_SIZE)}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= Math.ceil(filteredModels.length / PAGE_SIZE)}
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredModels.length / PAGE_SIZE), p + 1))}
                        className="dusk-btn dusk-btn--ghost"
                        style={{ height: 30, fontSize: 12 }}
                      >
                        Наступна →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '28px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: 'rgba(164, 174, 248, 0.15)',
                      color: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="dusk-heading" style={{ fontSize: 20, margin: 0 }}>
                    Створено товарів: <span className="dusk-num">{saveResult.createdCount}</span>
                  </h3>
                  <p style={{ color: 'var(--color-ink-2)', fontSize: 13.5, margin: 0, maxWidth: 420 }}>
                    Усі обрані моделі успішно додані до каталогу з налаштованими фото, ціною, назвою та категорією.
                  </p>
                  {saveResult.errors.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 6 }}>
                      Помилки ({saveResult.errors.length}): {saveResult.errors[0]}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: isMobile ? '12px 16px' : '14px 22px',
              borderTop: '1px solid var(--color-rule)',
              background: 'var(--color-paper-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            {step === 'source' && (
              <>
                <button type="button" onClick={handleClose} disabled={isFetching} className="dusk-btn dusk-btn--ghost">
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleDiscoverAndLoad}
                  disabled={isFetching || !rawInput.trim()}
                  className="dusk-btn dusk-btn--primary"
                >
                  {isFetching ? (
                    <><Loader2 size={15} className="animate-spin" /> Завантаження...</>
                  ) : (
                    <><span>Витягнути моделі{detectedIdsCount > 0 ? ` (${detectedIdsCount})` : ''}</span> <ArrowRight size={15} /></>
                  )}
                </button>
              </>
            )}

            {step === 'configure' && (
              <>
                <button
                  type="button"
                  onClick={handleResetToSource}
                  disabled={isSaving}
                  className="dusk-btn dusk-btn--ghost"
                >
                  <ArrowLeft size={15} /> Назад
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isSaving && (
                    <span className="dusk-num" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
                      Збереження {saveProgress.saved} / {saveProgress.total}...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateProducts}
                    disabled={isSaving || selectedIds.size === 0}
                    className="dusk-btn dusk-btn--primary"
                  >
                    {isSaving ? (
                      <><Loader2 size={15} className="animate-spin" /> Створення...</>
                    ) : (
                      <><Check size={15} /> Створити обрані товари ({selectedIds.size})</>
                    )}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <button type="button" onClick={handleResetToSource} className="dusk-btn dusk-btn--ghost">
                  Додати ще
                </button>
                <button type="button" onClick={handleClose} className="dusk-btn dusk-btn--primary">
                  Готово
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
