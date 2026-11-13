'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Loader2, Check, CheckSquare, Square, Search,
  ChevronDown, Wand2, Square as StopIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DEFAULT_PROMPT =
  'Place the exact 3D-printed object from the reference image centered on a sleek matte dark graphite slate studio pedestal (#161822) against a seamless dark charcoal studio backdrop (#0F1117). Soft diffused overhead key light with subtle cool periwinkle rim light, realistic soft contact shadow beneath the object, clean commercial e-commerce product photography. Preserve the exact shape, proportions, surface texture, colors, and all details of the 3D-printed object without altering or distorting it.';

function getThumbUrl(url) {
  if (!url) return '';
  if (url.includes('makerworld.bblmw.com') && !url.includes('x-oss-process=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}x-oss-process=image/resize,w_200`;
  }
  return url;
}

const PAGE_SIZE = 24;

export default function StudioStyleModal({
  open,
  onClose,
  products = [],
  dbCategories = [],
  isMobile = false,
  onProductUpdated
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithoutStudio, setOnlyWithoutStudio] = useState(true);
  const [keepReferenceInGallery, setKeepReferenceInGallery] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [engine, setEngine] = useState('free'); // 'free' | 'fal'
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [currentName, setCurrentName] = useState('');
  const [lastError, setLastError] = useState('');
  const [statusMap, setStatusMap] = useState({}); // { [id]: 'pending' | 'processing' | 'done' | 'error' }
  const syncedIdsRef = useRef(new Set());

  const syncBatchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/studio-batch', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      if (Array.isArray(data.updatedProducts) && data.updatedProducts.length > 0) {
        const nextStatuses = {};
        for (const prod of data.updatedProducts) {
          nextStatuses[prod.id] = 'done';
          if (!syncedIdsRef.current.has(prod.id)) {
            syncedIdsRef.current.add(prod.id);
            if (onProductUpdated) onProductUpdated(prod);
          }
        }
        setStatusMap(prev => ({ ...prev, ...nextStatuses }));
      }

      if (data.running) {
        setIsProcessing(true);
        setProgress({ done: data.done || 0, total: data.total || 0, errors: data.errors || 0 });
        setCurrentName(data.currentName || '');
        setLastError(data.lastError || '');
      } else if (data.total > 0 && data.done >= data.total) {
        setIsProcessing(false);
        setProgress({ done: data.done || 0, total: data.total || 0, errors: data.errors || 0 });
        setCurrentName('');
        setLastError(data.lastError || '');
      } else if (!data.running) {
        setIsProcessing(false);
      }
    } catch {
      // ignore transient poll errors
    }
  }, [onProductUpdated]);

  useEffect(() => {
    if (!open) return;
    syncBatchStatus();
    const timer = setInterval(syncBatchStatus, 2000);
    return () => clearInterval(timer);
  }, [open, syncBatchStatus]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      if (!p.image_url) return false;
      const matchesCat = categoryFilter === 'Всі' || p.category === categoryFilter;
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      const isStudio = p.image_url.includes('/studio-');
      const matchesStudio = !onlyWithoutStudio || !isStudio;
      return matchesCat && matchesSearch && matchesStudio;
    });
  }, [products, categoryFilter, searchQuery, onlyWithoutStudio]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, onlyWithoutStudio]);

  const toggleSelect = useCallback((id) => {
    if (isProcessing) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [isProcessing]);

  function selectAllFiltered() {
    if (isProcessing) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredProducts.forEach(p => next.add(p.id));
      return next;
    });
  }

  function deselectAll() {
    if (isProcessing) return;
    setSelectedIds(new Set());
  }

  async function handleStopStudio() {
    try {
      await fetch('/api/studio-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
    } catch {
      // ignore
    }
  }

  async function handleRunStudio() {
    if (selectedIds.size === 0 || isProcessing) return;
    const targets = products.filter(p => selectedIds.has(p.id) && p.image_url);
    if (targets.length === 0) return;

    setIsProcessing(true);
    setProgress({ done: 0, total: targets.length, errors: 0 });
    setCurrentName('');
    setLastError('');
    syncedIdsRef.current = new Set();

    const initialStatus = {};
    targets.forEach(t => { initialStatus[t.id] = 'pending'; });
    setStatusMap(initialStatus);

    if (engine === 'free') {
      try {
        const res = await fetch('/api/studio-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            products: targets.map(p => ({
              id: p.id,
              name: p.name,
              image_url: p.image_url,
              image_urls: p.image_urls
            })),
            aspectRatio,
            keepReferenceInGallery
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Не вдалося запустити фонову обробку');
        }
        syncBatchStatus();
      } catch (err) {
        setLastError(err.message);
        setIsProcessing(false);
      }
      return;
    }

    let doneCount = 0;
    let errorCount = 0;
    const CONCURRENCY = 2;
    let cursor = 0;

    async function worker() {
      while (cursor < targets.length) {
        const product = targets[cursor++];
        setStatusMap(prev => ({ ...prev, [product.id]: 'processing' }));

        try {
          const res = await fetch('/api/studio-style-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: product.image_url,
              aspectRatio,
              customPrompt
            })
          });
          const data = await res.json();
          if (!res.ok || !data.url) {
            throw new Error(data.error || 'Помилка генерації');
          }
          const newStudioUrl = data.url;

          const oldMain = product.image_url;
          const existingExtras = Array.isArray(product.image_urls) ? product.image_urls : [];
          const nextExtras = keepReferenceInGallery && oldMain && !oldMain.includes('/studio-') && !existingExtras.includes(oldMain)
            ? [oldMain, ...existingExtras]
            : existingExtras;

          if (supabase) {
            const { data: updatedRows, error: dbErr } = await supabase
              .from('products')
              .update({
                image_url: newStudioUrl,
                image_urls: nextExtras
              })
              .eq('id', product.id)
              .select();

            if (dbErr) throw dbErr;
            if (updatedRows?.[0] && onProductUpdated) {
              onProductUpdated(updatedRows[0]);
            }
          }

          setStatusMap(prev => ({ ...prev, [product.id]: 'done' }));
        } catch (err) {
          console.error(`Studio failed for product ${product.id}:`, err);
          errorCount++;
          setLastError(err.message);
          setStatusMap(prev => ({ ...prev, [product.id]: 'error' }));
        } finally {
          doneCount++;
          setProgress({ done: doneCount, total: targets.length, errors: errorCount });
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker())
    );

    setIsProcessing(false);
  }

  if (!mounted || !open) return null;

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageItems = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
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
            maxWidth: 1040,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--color-accent-soft, rgba(164, 174, 248, 0.14))',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Wand2 size={17} />
              </div>
              <div>
                <h2 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 18, margin: 0 }}>
                  ШІ-студія для першого фото
                </h2>
                {!isMobile && (
                  <p className="dusk-subheading" style={{ margin: '2px 0 0', fontSize: 12 }}>
                    Єдиний темний студійний стиль для всіх товарів зі збереженням реального фото в галереї
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="dusk-btn dusk-btn--ghost"
              style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: 999 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Controls */}
            <div
              className="dusk-panel"
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--color-paper-2)',
                border: '1px solid var(--color-rule)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="dusk-select"
                    style={{ height: 32, fontSize: 12.5, width: 'auto', padding: '0 12px' }}
                  >
                    <option value="Всі">Всі категорії</option>
                    {dbCategories.map(c => (
                      <option key={c.id || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="dusk-select"
                    style={{ height: 32, fontSize: 12.5, width: 'auto', padding: '0 12px' }}
                  >
                    <option value="free">Безкоштовна фонова ШІ-студія (0 грн, на сервері)</option>
                    <option value="fal">Flux Kontext (fal.ai, платний баланс)</option>
                  </select>

                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="dusk-select"
                    style={{ height: 32, fontSize: 12.5, width: 'auto', padding: '0 12px' }}
                  >
                    <option value="1:1">Формат 1:1 (універсальний)</option>
                    <option value="4:5">Формат 4:5 (портрет)</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-ink-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={onlyWithoutStudio}
                      onChange={(e) => setOnlyWithoutStudio(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    Тільки без ШІ-студії
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-ink-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={keepReferenceInGallery}
                      onChange={(e) => setKeepReferenceInGallery(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    Зберегти оригінал у галереї (#2)
                  </label>
                </div>

                <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 220 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук товару..."
                    className="dusk-input"
                    style={{ paddingLeft: 30, height: 32, fontSize: 12.5, borderRadius: 999 }}
                  />
                </div>
              </div>

              {/* Prompt toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPromptEditor(v => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-accent)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <span>Налаштувати стиль-промпт</span>
                  <ChevronDown size={13} style={{ transform: showPromptEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
                </button>
                <AnimatePresence initial={false}>
                  {showPromptEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <textarea
                        rows={3}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="dusk-input"
                        style={{ width: '100%', marginTop: 8, padding: 10, fontSize: 12, lineHeight: 1.45 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Selection Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={selectAllFiltered} disabled={isProcessing} className="dusk-btn dusk-btn--ghost" style={{ height: 30, fontSize: 12 }}>
                  <CheckSquare size={14} /> Обрати всі ({filteredProducts.length})
                </button>
                <button type="button" onClick={deselectAll} disabled={isProcessing} className="dusk-btn dusk-btn--ghost" style={{ height: 30, fontSize: 12 }}>
                  <Square size={14} /> Зняти всі
                </button>
                <span className="dusk-badge dusk-badge--accent dusk-num">
                  Обрано: {selectedIds.size}
                </span>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`dusk-facet-pill dusk-num ${currentPage === pNum ? 'is-active' : ''}`}
                      style={{ fontSize: 11.5, padding: '2px 9px' }}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar when processing */}
            {(isProcessing || lastError) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 10, background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
                {isProcessing && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-ink-2)', gap: 8 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {engine === 'free'
                          ? `Фонова обробка на сервері: ${currentName || 'підготовка...'}`
                          : 'Генерація студійних фото (Flux Kontext)...'}
                      </span>
                      <span className="dusk-num" style={{ flexShrink: 0 }}>
                        {progress.done} / {progress.total} {progress.errors > 0 ? `(помилок: ${progress.errors})` : ''}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--color-paper-3)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                          background: 'var(--color-accent)',
                          transition: 'width 0.25s ease'
                        }}
                      />
                    </div>
                    {engine === 'free' && (
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                        Можете закрити це вікно — обробка триватиме у фоні без навантаження на браузер.
                      </div>
                    )}
                  </>
                )}
                {lastError && (
                  <div style={{ fontSize: 11.5, color: 'var(--color-danger)' }}>
                    Остання помилка: {lastError}
                  </div>
                )}
              </div>
            )}

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {pageItems.map(p => {
                const isSelected = selectedIds.has(p.id);
                const st = statusMap[p.id];
                const isStudio = p.image_url?.includes('/studio-');

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: 10,
                      borderRadius: 12,
                      border: `1px solid ${st === 'done' ? '#34d399' : st === 'error' ? 'var(--color-danger)' : isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: isSelected ? 'rgba(164, 174, 248, 0.07)' : 'var(--color-paper-2)',
                      cursor: isProcessing ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ aspectRatio: '1 / 1', borderRadius: 9, background: 'var(--color-paper)', overflow: 'hidden', position: 'relative', width: '100%' }}>
                      <img
                        src={getThumbUrl(p.image_url)}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          width: 20,
                          height: 20,
                          borderRadius: 6,
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

                      {(st || isStudio) && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            padding: '2px 7px',
                            borderRadius: 6,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: st === 'processing' ? 'rgba(147,162,250,0.9)' : st === 'error' ? 'rgba(220,100,110,0.9)' : 'rgba(52,211,153,0.9)',
                            color: '#111'
                          }}
                        >
                          {st === 'processing' ? 'ШІ...' : st === 'error' ? 'Помилка' : 'Студія ✓'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{p.category}</div>
                  </button>
                );
              })}
            </div>
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
            <button type="button" onClick={onClose} className="dusk-btn dusk-btn--ghost">
              {isProcessing ? 'Згорнути (працює у фоні)' : 'Закрити'}
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isProcessing && engine === 'free' && (
                <button type="button" onClick={handleStopStudio} className="dusk-btn dusk-btn--danger">
                  <StopIcon size={13} /> Зупинити
                </button>
              )}
              <button
                type="button"
                onClick={handleRunStudio}
                disabled={isProcessing || selectedIds.size === 0}
                className="dusk-btn dusk-btn--primary"
              >
                {isProcessing ? (
                  <><Loader2 size={15} className="animate-spin" /> Обробка ({progress.done}/{progress.total})...</>
                ) : (
                  <><Sparkles size={15} /> Зробити ШІ-студію ({selectedIds.size})</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
