'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, CheckSquare, Square, Search, Loader2, Tag, ArrowRight, Plus, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { embedProductSizes, normalizeSizes, parseProductSizes } from '@/lib/productSizes';

function computeNewPrice(currentPrice, mode, rawValue, roundStep) {
  const base = Number(currentPrice) || 0;
  const val = Number(rawValue);
  if (!Number.isFinite(val)) return base;

  let next = base;
  if (mode === 'set') {
    next = val;
  } else if (mode === 'delta_uah') {
    next = base + val;
  } else if (mode === 'delta_pct') {
    next = base * (1 + val / 100);
  }

  const step = Number(roundStep) || 1;
  if (step > 1) {
    next = Math.round(next / step) * step;
  } else {
    next = Math.round(next);
  }

  return Math.max(1, next);
}

export default function BulkPriceModal({
  open,
  onClose,
  products = [],
  dbCategories = [],
  isMobile = false,
  onProductsUpdated
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [categoryFilter, setCategoryFilter] = useState('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [priceTarget, setPriceTarget] = useState('base'); // 'base' | `size:${label}`
  const [priceMode, setPriceMode] = useState('set'); // 'set' | 'delta_uah' | 'delta_pct' | 'keep'
  const [priceValue, setPriceValue] = useState('');
  const [roundStep, setRoundStep] = useState('1'); // '1' | '5' | '10'
  const [discountMode, setDiscountMode] = useState('keep'); // 'keep' | 'set'
  const [discountValue, setDiscountValue] = useState('0');
  const [sizesMode, setSizesMode] = useState('keep'); // 'keep' | 'set' | 'clear'
  const [bulkSizes, setBulkSizes] = useState([
    { label: '15 см', price: '500' },
    { label: '20 см', price: '700' }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      const matchesCat = categoryFilter === 'Всі' || p.category === categoryFilter;
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  const toggleSelect = useCallback((id) => {
    if (isSaving) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [isSaving]);

  function selectAllFiltered() {
    if (isSaving) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredProducts.forEach(p => next.add(p.id));
      return next;
    });
  }

  function deselectAll() {
    if (isSaving) return;
    setSelectedIds(new Set());
  }

  const availableSizeLabels = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      parseProductSizes(p).forEach(s => set.add(s.label));
    });
    return Array.from(set);
  }, [products]);

  const targetSizeLabel = priceTarget.startsWith('size:') ? priceTarget.slice(5) : null;

  const normalizedBulkSizes = useMemo(() => normalizeSizes(bulkSizes), [bulkSizes]);
  const hasValidPriceChange = priceMode !== 'keep' && priceValue !== '' && Number.isFinite(Number(priceValue));
  const hasValidDiscountChange = discountMode === 'set' && discountValue !== '' && Number.isFinite(Number(discountValue));
  const hasValidSizesChange = (sizesMode === 'set' && normalizedBulkSizes.length > 0) || sizesMode === 'clear';
  const canApply = !isSaving && selectedIds.size > 0 && (hasValidPriceChange || hasValidDiscountChange || hasValidSizesChange);

  async function handleApply() {
    if (!canApply || !supabase) return;
    const targets = products.filter(p => selectedIds.has(p.id));
    if (targets.length === 0) return;

    setIsSaving(true);
    setErrorMsg('');

    try {
      const nextDiscount = discountMode === 'set'
        ? Math.min(95, Math.max(0, Math.round(Number(discountValue) || 0)))
        : null;

      const updatedRows = [];
      const BATCH_SIZE = 10;

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const chunk = targets.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          chunk.map(async (p) => {
            const payload = {};
            if (hasValidPriceChange) {
              if (targetSizeLabel) {
                const currentSizes = parseProductSizes(p);
                const idx = currentSizes.findIndex(s => s.label === targetSizeLabel);
                if (idx !== -1) {
                  const nextSizes = currentSizes.map((s, sIdx) =>
                    sIdx === idx
                      ? { ...s, price: computeNewPrice(s.price, priceMode, priceValue, roundStep) }
                      : s
                  );
                  payload.description = embedProductSizes(p.description, nextSizes);
                  payload.price = Math.min(...nextSizes.map(s => s.price));
                }
              } else {
                payload.price = computeNewPrice(p.price, priceMode, priceValue, roundStep);
              }
            }
            if (nextDiscount !== null) {
              payload.discount = nextDiscount;
            }
            if (sizesMode === 'set' && normalizedBulkSizes.length > 0) {
              payload.description = embedProductSizes(p.description, normalizedBulkSizes);
              if (!hasValidPriceChange || targetSizeLabel) {
                payload.price = Math.min(...normalizedBulkSizes.map(s => s.price));
              }
            } else if (sizesMode === 'clear') {
              payload.description = embedProductSizes(p.description, []);
            }

            if (Object.keys(payload).length === 0) {
              return p;
            }

            const { data, error } = await supabase
              .from('products')
              .update(payload)
              .eq('id', p.id)
              .select();

            if (error) throw error;
            return data?.[0] || { ...p, ...payload };
          })
        );
        updatedRows.push(...results);
      }

      if (onProductsUpdated && updatedRows.length > 0) {
        onProductsUpdated(updatedRows);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Помилка оновлення цін');
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
        onClick={() => !isSaving && onClose()}
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
          initial={isMobile ? { y: 40, opacity: 0 } : { scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={isMobile ? { y: 40, opacity: 0 } : { scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 920,
            maxHeight: isMobile ? '92vh' : '88vh',
            background: 'var(--color-paper)',
            border: '1px solid var(--color-rule)',
            borderRadius: isMobile ? '20px 20px 0 0' : 18,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)'
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
                  background: 'rgba(164, 174, 248, 0.14)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Tag size={17} />
              </div>
              <div>
                <h2 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 18, margin: 0 }}>
                  Масове редагування цін
                </h2>
                {!isMobile && (
                  <p className="dusk-subheading" style={{ margin: '2px 0 0', fontSize: 12 }}>
                    Оберіть цілу категорію або окремі товари та задайте нову ціну чи знижку
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => !isSaving && onClose()}
              disabled={isSaving}
              className="dusk-btn dusk-btn--ghost"
              style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: 999 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Price & Discount Rule Panel */}
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--color-paper-2)',
                border: '1px solid var(--color-rule)',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12
              }}
            >
              {/* Price Rule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                    {targetSizeLabel ? `Ціна варіанту «${targetSizeLabel}»` : 'Зміна базової ціни (грн)'}
                  </div>
                  {availableSizeLabels.length > 0 && (
                    <select
                      value={priceTarget}
                      onChange={(e) => setPriceTarget(e.target.value)}
                      className="dusk-select"
                      style={{ height: 28, fontSize: 11.5, width: 'auto', padding: '0 10px' }}
                    >
                      <option value="base">Базова ціна товару</option>
                      {availableSizeLabels.map(lbl => (
                        <option key={lbl} value={`size:${lbl}`}>
                          Варіант: {lbl}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <select
                    value={priceMode}
                    onChange={(e) => setPriceMode(e.target.value)}
                    className="dusk-select"
                    style={{ height: 34, fontSize: 12.5, flex: '1 1 170px' }}
                  >
                    <option value="set">Встановити фіксовану (грн)</option>
                    <option value="delta_uah">Змінити на суму (± грн)</option>
                    <option value="delta_pct">Змінити на відсоток (± %)</option>
                    <option value="keep">Не змінювати ціну</option>
                  </select>

                  {priceMode !== 'keep' && (
                    <input
                      type="number"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      placeholder={priceMode === 'set' ? 'Напр. 450' : priceMode === 'delta_uah' ? 'Напр. 50 або -50' : 'Напр. 10 або -15'}
                      className="dusk-input dusk-num"
                      style={{ height: 34, fontSize: 13, width: 140 }}
                    />
                  )}
                </div>

                {(priceMode === 'delta_pct' || priceMode === 'delta_uah') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Округлення:</span>
                    <select
                      value={roundStep}
                      onChange={(e) => setRoundStep(e.target.value)}
                      className="dusk-select"
                      style={{ height: 28, fontSize: 11.5, width: 'auto', padding: '0 10px' }}
                    >
                      <option value="1">До 1 грн</option>
                      <option value="5">До 5 грн</option>
                      <option value="10">До 10 грн</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Discount Rule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                  Знижка (%)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <select
                    value={discountMode}
                    onChange={(e) => setDiscountMode(e.target.value)}
                    className="dusk-select"
                    style={{ height: 34, fontSize: 12.5, flex: '1 1 170px' }}
                  >
                    <option value="keep">Не змінювати знижку</option>
                    <option value="set">Встановити знижку (%)</option>
                  </select>

                  {discountMode === 'set' && (
                    <input
                      type="number"
                      min={0}
                      max={95}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0 = прибрати"
                      className="dusk-input dusk-num"
                      style={{ height: 34, fontSize: 13, width: 120 }}
                    />
                  )}
                </div>
                {discountMode === 'set' && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    Вкажіть `0`, щоб прибрати знижку в обраних товарів.
                  </div>
                )}
              </div>

              {/* Bulk Size Variants */}
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1', borderTop: '1px solid var(--color-rule)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                    Варіанти розмірів (ціна за розмір)
                  </div>
                  <select
                    value={sizesMode}
                    onChange={(e) => setSizesMode(e.target.value)}
                    className="dusk-select"
                    style={{ height: 32, fontSize: 12, width: 'auto', padding: '0 12px' }}
                  >
                    <option value="keep">Не змінювати розміри</option>
                    <option value="set">Задати розміри для обраних</option>
                    <option value="clear">Очистити розміри</option>
                  </select>
                </div>

                {sizesMode === 'set' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {bulkSizes.map((sz, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--color-paper)', padding: 6, borderRadius: 9, border: '1px solid var(--color-rule)' }}>
                          <input
                            type="text"
                            value={sz.label}
                            onChange={(e) => {
                              const next = [...bulkSizes];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setBulkSizes(next);
                            }}
                            placeholder="15 см"
                            className="dusk-input"
                            style={{ width: 90, height: 30, fontSize: 12 }}
                          />
                          <input
                            type="number"
                            value={sz.price}
                            onChange={(e) => {
                              const next = [...bulkSizes];
                              next[idx] = { ...next[idx], price: e.target.value };
                              setBulkSizes(next);
                            }}
                            placeholder="500"
                            className="dusk-input dusk-num"
                            style={{ width: 80, height: 30, fontSize: 12 }}
                          />
                          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>грн</span>
                          <button
                            type="button"
                            onClick={() => setBulkSizes(prev => prev.filter((_, i) => i !== idx))}
                            className="dusk-btn dusk-btn--danger"
                            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBulkSizes(prev => [...prev, { label: '', price: '' }])}
                        className="dusk-btn dusk-btn--ghost"
                        style={{ height: 42, fontSize: 12 }}
                      >
                        <Plus size={13} /> Додати розмір
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter & Selection Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="dusk-select"
                  style={{ height: 32, fontSize: 12.5, width: 'auto', padding: '0 12px' }}
                >
                  <option value="Всі">Всі категорії ({products.length})</option>
                  {dbCategories.map(c => {
                    const count = products.filter(p => p.category === c.name).length;
                    return (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name} ({count})
                      </option>
                    );
                  })}
                </select>

                <button type="button" onClick={selectAllFiltered} disabled={isSaving} className="dusk-btn dusk-btn--ghost" style={{ height: 32, fontSize: 12 }}>
                  <CheckSquare size={14} /> Обрати всі ({filteredProducts.length})
                </button>
                <button type="button" onClick={deselectAll} disabled={isSaving} className="dusk-btn dusk-btn--ghost" style={{ height: 32, fontSize: 12 }}>
                  <Square size={14} /> Зняти всі
                </button>
                <span className="dusk-badge dusk-badge--accent dusk-num">
                  Обрано: {selectedIds.size}
                </span>
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

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(220, 100, 110, 0.14)', color: 'var(--color-danger)', fontSize: 12 }}>
                {errorMsg}
              </div>
            )}

            {/* Products List with Live Price Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredProducts.map(p => {
                const isSelected = selectedIds.has(p.id);
                const pSizes = parseProductSizes(p);
                const matchedVariant = targetSizeLabel ? pSizes.find(s => s.label === targetSizeLabel) : null;
                const oldPrice = targetSizeLabel
                  ? (matchedVariant ? matchedVariant.price : null)
                  : (Number(p.price) || 0);
                const previewPrice = oldPrice !== null && isSelected && hasValidPriceChange
                  ? computeNewPrice(oldPrice, priceMode, priceValue, roundStep)
                  : oldPrice;
                const oldDiscount = Number(p.discount) || 0;
                const previewDiscount = isSelected && hasValidDiscountChange
                  ? Math.min(95, Math.max(0, Math.round(Number(discountValue) || 0)))
                  : oldDiscount;
                const priceChanged = oldPrice !== null && isSelected && hasValidPriceChange && previewPrice !== oldPrice;
                const discountChanged = isSelected && hasValidDiscountChange && previewDiscount !== oldDiscount;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                      background: isSelected ? 'rgba(164, 174, 248, 0.08)' : 'var(--color-paper-2)',
                      cursor: isSaving ? 'default' : 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          flexShrink: 0,
                          background: isSelected ? 'var(--color-accent)' : 'var(--color-paper)',
                          border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                          color: '#111',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'contain', background: 'var(--color-paper)', flexShrink: 0 }}
                        />
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          {p.category}
                        </div>
                      </div>
                    </div>

                    {/* Live Price Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="dusk-num">
                      {oldPrice !== null ? (
                        <>
                          {targetSizeLabel && (
                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{targetSizeLabel}:</span>
                          )}
                          <span style={{ fontSize: 12.5, color: priceChanged ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: priceChanged ? 'line-through' : 'none' }}>
                            {oldPrice} грн
                          </span>
                          {priceChanged && (
                            <>
                              <ArrowRight size={12} style={{ color: 'var(--color-accent)' }} />
                              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-accent)' }}>
                                {previewPrice} грн
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                          немає «{targetSizeLabel}»
                        </span>
                      )}
                      {(oldDiscount > 0 || discountChanged) && (
                        <span
                          className="dusk-badge"
                          style={{
                            fontSize: 10.5,
                            background: discountChanged ? 'rgba(232, 168, 124, 0.18)' : 'var(--color-paper-3)',
                            color: discountChanged ? 'var(--color-accent-2, #E8A87C)' : 'var(--color-muted)'
                          }}
                        >
                          -{previewDiscount}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                  Товарів за цим фільтром не знайдено.
                </div>
              )}
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
            <button type="button" onClick={onClose} disabled={isSaving} className="dusk-btn dusk-btn--ghost">
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="dusk-btn dusk-btn--primary"
            >
              {isSaving ? (
                <><Loader2 size={15} className="animate-spin" /> Оновлення...</>
              ) : (
                <><Tag size={15} /> Застосувати ({selectedIds.size})</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
