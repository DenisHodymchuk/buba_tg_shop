"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_DROPSHIPPING_DATA } from '@/components/DropshippingAdmin';
import {
  Search, Download, Copy, Check, ChevronLeft, ChevronRight,
  ShoppingBag, ExternalLink, X, Sparkles, Image as ImageIcon,
  Layers, Loader2, Send, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function DropshippingPage() {
  const [catalog, setCatalog] = useState(DEFAULT_DROPSHIPPING_DATA);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-card active image index
  const [cardImgIdx, setCardImgIdx] = useState({});
  // Per-card downloading state
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState('');
  // Toast notification
  const [toast, setToast] = useState(null);
  // Selected item for full modal view
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalImgIdx, setModalImgIdx] = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'dropshipping_catalog')
            .maybeSingle();

          if (!error && data?.value) {
            setCatalog({
              ...DEFAULT_DROPSHIPPING_DATA,
              ...data.value,
              categories: Array.isArray(data.value.categories) && data.value.categories.length > 0
                ? data.value.categories
                : DEFAULT_DROPSHIPPING_DATA.categories,
              items: Array.isArray(data.value.items) ? data.value.items : []
            });
            setLoading(false);
            return;
          }
        }

        // Fallback to localStorage if offline/local
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('buba_dropshipping_catalog');
          if (cached) {
            const parsed = JSON.parse(cached);
            setCatalog({ ...DEFAULT_DROPSHIPPING_DATA, ...parsed });
          }
        }
      } catch (e) {
        console.error('Error loading dropshipping page:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const visibleItems = useMemo(() => {
    return (catalog.items || []).filter(i => !i.hidden);
  }, [catalog.items]);

  const categories = useMemo(() => {
    const itemCats = visibleItems.map(i => i.category).filter(Boolean);
    const merged = Array.from(new Set([...(catalog.categories || []), ...itemCats]));
    return ['Всі', ...merged];
  }, [catalog.categories, visibleItems]);

  const filteredItems = useMemo(() => {
    return visibleItems.filter(item => {
      const matchesCat = activeCategory === 'Всі' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [visibleItems, activeCategory, searchQuery]);

  // Download single photo via our server proxy
  const downloadSinglePhoto = async (imgUrl, productName, index = 1) => {
    if (!imgUrl) return;
    const safeName = (productName || 'buba-toy')
      .replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const filename = `${safeName}-${index}`;
    const proxyUrl = `/api/download-image?url=${encodeURIComponent(imgUrl)}&filename=${encodeURIComponent(filename)}`;

    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = `${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all photos of a product sequentially
  const downloadAllPhotos = async (item) => {
    const imgs = item.images || [];
    if (imgs.length === 0) return;

    setDownloadingId(item.id);
    try {
      for (let i = 0; i < imgs.length; i++) {
        setDownloadProgress(`${i + 1}/${imgs.length}`);
        await downloadSinglePhoto(imgs[i], item.name, i + 1);
        // Small pause between browser downloads so mobile/desktop browsers don't block multiple downloads
        if (i < imgs.length - 1) {
          await new Promise(r => setTimeout(r, 450));
        }
      }
      showToast(`Завантажено всі фото (${imgs.length} шт.) ✅`);
    } catch (e) {
      console.error(e);
      showToast('Помилка під час завантаження фото');
    } finally {
      setDownloadingId(null);
      setDownloadProgress('');
    }
  };

  const copyText = (text, label = 'Скопійовано в буфер обміну! 📋') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(label);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #131c38 0%, #050b16 65%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 80
    }}>
      {/* TOP BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5, 11, 22, 0.85)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 16px'
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/"
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 950, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 6px 16px rgba(124,58,237,0.35)'
              }}
            >
              B
            </Link>
            <div>
              <div style={{ fontSize: 15, fontWeight: 950, letterSpacing: '-0.02em', color: '#fff' }}>
                {catalog.headerTitle || 'BUBA SHOP • Дропшипінг'}
              </div>
              <div style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 800 }}>
                Офіційний каталог для партнерів ({visibleItems.length} позицій)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {catalog.contactTelegram && (
              <a
                href={catalog.contactTelegram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '9px 14px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                  color: '#fff', fontSize: 12, fontWeight: 900, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 6px 18px rgba(14,165,233,0.3)'
                }}
              >
                <Send size={14} /> Зв&apos;язок з менеджером
              </a>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 16px' }}>
        {/* HERO / COOPERATION INFO */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(45,212,191,0.08))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 24,
          padding: '20px 22px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5, fontWeight: 600 }}>
            {catalog.headerSubtitle}
          </div>
          {catalog.termsNote && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(45,212,191,0.25)',
              padding: '8px 12px', borderRadius: 12, color: '#5eead4', fontSize: 12, fontWeight: 800,
              alignSelf: 'flex-start'
            }}>
              {catalog.termsNote}
            </div>
          )}
        </div>

        {/* SEARCH & CATEGORY FILTER */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24
        }}>
          {/* Search Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '12px 16px'
          }}>
            <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Пошук за назвою іграшки, описом або категорією..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: '#fff', fontSize: 14, outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Categories Bar */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none'
          }}>
            {categories.map(cat => {
              const active = activeCategory === cat;
              const count = cat === 'Всі'
                ? visibleItems.length
                : visibleItems.filter(i => i.category === cat).length;
              if (cat !== 'Всі' && count === 0) return null;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '10px 16px',
                    borderRadius: 14,
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#fff' : '#94a3b8',
                    fontSize: 12.5,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: active ? '0 8px 20px rgba(124,58,237,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{cat}</span>
                  <span style={{
                    fontSize: 10.5, padding: '1px 7px', borderRadius: 99,
                    background: active ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontWeight: 900
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LOADING OR CATALOG GRID */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 size={38} className="animate-spin" style={{ color: '#a855f7' }} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24, padding: '80px 20px', textAlign: 'center'
          }}>
            <ShoppingBag size={48} style={{ color: '#475569', marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px 0' }}>Товарів не знайдено</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Спробуйте змінити категорію або пошуковий запит
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: 20
          }}>
            {filteredItems.map(item => {
              const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
              const currentIdx = cardImgIdx[item.id] || 0;
              const activeImg = images[currentIdx] || images[0] || '';
              const margin = item.rrpPrice && item.dropPrice ? (Number(item.rrpPrice) - Number(item.dropPrice)) : 0;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 24,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 14px 35px rgba(0,0,0,0.35)'
                  }}
                >
                  {/* IMAGE GALLERY AREA */}
                  <div style={{ position: 'relative', aspectRatio: '1/1', background: '#090f1d', overflow: 'hidden' }}>
                    {activeImg ? (
                      <img
                        src={activeImg}
                        alt={item.name}
                        onClick={() => { setSelectedItem(item); setModalImgIdx(currentIdx); }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                        <ImageIcon size={42} />
                      </div>
                    )}

                    {/* Top badges */}
                    <div style={{
                      position: 'absolute', top: 12, left: 12, right: 12,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none'
                    }}>
                      <span style={{
                        background: 'rgba(9,15,29,0.85)', backdropFilter: 'blur(8px)',
                        color: '#e2e8f0', padding: '5px 11px', borderRadius: 10,
                        fontSize: 11, fontWeight: 850, border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {item.category}
                      </span>

                      {images.length > 0 && (
                        <span style={{
                          background: 'rgba(9,15,29,0.85)', backdropFilter: 'blur(8px)',
                          color: '#cbd5e1', padding: '5px 10px', borderRadius: 10,
                          fontSize: 11, fontWeight: 850, border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          📷 {currentIdx + 1} / {images.length}
                        </span>
                      )}
                    </div>

                    {/* Prev / Next arrows if multiple images */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextIdx = (currentIdx - 1 + images.length) % images.length;
                            setCardImgIdx(prev => ({ ...prev, [item.id]: nextIdx }));
                          }}
                          style={{
                            position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)',
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'rgba(9,15,29,0.8)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextIdx = (currentIdx + 1) % images.length;
                            setCardImgIdx(prev => ({ ...prev, [item.id]: nextIdx }));
                          }}
                          style={{
                            position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)',
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'rgba(9,15,29,0.8)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}

                    {/* Quick Expand Button */}
                    <button
                      type="button"
                      onClick={() => { setSelectedItem(item); setModalImgIdx(currentIdx); }}
                      title="Відкрити великі фото та опис"
                      style={{
                        position: 'absolute', bottom: 10, right: 10,
                        background: 'rgba(9,15,29,0.85)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', borderRadius: 10, padding: '6px 10px',
                        fontSize: 11, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5
                      }}
                    >
                      <Maximize2 size={13} /> Всі фото
                    </button>
                  </div>

                  {/* THUMBNAIL STRIP */}
                  {images.length > 1 && (
                    <div style={{
                      display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto',
                      background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCardImgIdx(prev => ({ ...prev, [item.id]: idx }))}
                          style={{
                            padding: 0, width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                            border: idx === currentIdx ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.12)',
                            opacity: idx === currentIdx ? 1 : 0.6, cursor: 'pointer', flexShrink: 0,
                            background: 'none'
                          }}
                        >
                          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* DOWNLOAD PHOTO BAR */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: images.length > 1 ? '1fr 1.15fr' : '1fr',
                    gap: 8,
                    padding: '10px 14px',
                    background: 'rgba(45,212,191,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        downloadSinglePhoto(activeImg, item.name, currentIdx + 1);
                        showToast('Завантаження фото почалося ⬇️');
                      }}
                      style={{
                        padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                        color: '#fff', fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}
                    >
                      <Download size={14} style={{ color: '#2dd4bf' }} />
                      Скачати це фото
                    </button>

                    {images.length > 1 && (
                      <button
                        type="button"
                        disabled={downloadingId === item.id}
                        onClick={() => downloadAllPhotos(item)}
                        style={{
                          padding: '8px 10px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)',
                          color: '#020b18', fontSize: 11.5, fontWeight: 950,
                          cursor: downloadingId === item.id ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        {downloadingId === item.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Качаємо {downloadProgress}
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            Всі фото ({images.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* PRODUCT INFO & DESCRIPTION */}
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    {/* Title & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <h2
                          onClick={() => { setSelectedItem(item); setModalImgIdx(currentIdx); }}
                          style={{ fontSize: 16.5, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.3, cursor: 'pointer' }}
                        >
                          {item.name}
                        </h2>
                        {item.weight && (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
                            Параметри: {item.weight}
                          </span>
                        )}
                      </div>

                      <div style={{
                        background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)',
                        borderRadius: 12, padding: '6px 11px', textAlign: 'right', flexShrink: 0
                      }}>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: '#5eead4', textTransform: 'uppercase' }}>
                          ДРОП-ЦІНА
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 950, color: '#2dd4bf', lineHeight: 1.1 }}>
                          {item.dropPrice} ₴
                        </div>
                      </div>
                    </div>

                    {/* RRP & Margin Pill */}
                    {item.rrpPrice && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', borderRadius: 10,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                        fontSize: 11.5, fontWeight: 800
                      }}>
                        <span style={{ color: '#cbd5e1' }}>Рекомендована РРЦ: <b>{item.rrpPrice} ₴</b></span>
                        {margin > 0 && (
                          <span style={{ color: '#4ade80', fontWeight: 900 }}>
                            Ваш дохід: +{margin} ₴
                          </span>
                        )}
                      </div>
                    )}

                    {/* Colors note */}
                    {item.colorsNote && (
                      <div style={{ fontSize: 11.5, color: '#a78bfa', fontWeight: 750 }}>
                        🎨 {item.colorsNote}
                      </div>
                    )}

                    {/* Description Box */}
                    {item.description && (
                      <div style={{
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: 12, fontSize: 12.5, color: '#cbd5e1',
                        lineHeight: 1.5, whiteSpace: 'pre-line', maxHeight: 130, overflowY: 'auto'
                      }}>
                        {item.description}
                      </div>
                    )}

                    {/* Copy Buttons Footer */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => copyText(item.description || item.name, 'Опис скопійовано! 📋')}
                        style={{
                          flex: 1, padding: '9px 10px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#e2e8f0', fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <Copy size={13} /> Копіювати опис
                      </button>

                      <button
                        type="button"
                        onClick={() => copyText(`${item.name}\n\n${item.description || ''}`.trim(), 'Назву та опис скопійовано! 📋')}
                        style={{
                          flex: 1, padding: '9px 10px', borderRadius: 10,
                          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
                          color: '#ddd6fe', fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <Copy size={13} /> Назва + Опис
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL PRODUCT LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div
            onClick={() => setSelectedItem(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(2, 8, 18, 0.9)', backdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 880, maxHeight: '92vh',
                background: '#0b1528', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.75)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 850 }}>{selectedItem.category}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 950, color: '#fff', margin: 0 }}>{selectedItem.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Main Big Image */}
                {selectedItem.images?.[modalImgIdx] && (
                  <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#050b16', maxHeight: 460, display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={selectedItem.images[modalImgIdx]}
                      alt={selectedItem.name}
                      style={{ maxHeight: 460, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        downloadSinglePhoto(selectedItem.images[modalImgIdx], selectedItem.name, modalImgIdx + 1);
                        showToast('Завантаження фото почалося ⬇️');
                      }}
                      style={{
                        position: 'absolute', bottom: 12, right: 12,
                        padding: '10px 16px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)',
                        color: '#020b18', fontSize: 12.5, fontWeight: 950, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                      }}
                    >
                      <Download size={16} /> Скачати це фото (#{modalImgIdx + 1})
                    </button>
                  </div>
                )}

                {/* All Photos Grid with individual download */}
                {selectedItem.images?.length > 1 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8' }}>
                        УСІ ФОТОГРАФІЇ ({selectedItem.images.length} шт.)
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadAllPhotos(selectedItem)}
                        style={{
                          padding: '7px 14px', borderRadius: 10, border: 'none',
                          background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 900,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Download size={14} /> Скачати всі {selectedItem.images.length} фото одразу
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: 10 }}>
                      {selectedItem.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setModalImgIdx(idx)}
                          style={{
                            position: 'relative', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden',
                            border: idx === modalImgIdx ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.12)',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSinglePhoto(imgUrl, selectedItem.name, idx + 1);
                              showToast(`Завантажуємо фото #${idx + 1} ⬇️`);
                            }}
                            title="Скачати це фото"
                            style={{
                              position: 'absolute', bottom: 4, right: 4,
                              width: 26, height: 26, borderRadius: 7,
                              background: 'rgba(2,11,24,0.85)', border: '1px solid rgba(255,255,255,0.2)',
                              color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price & Description inside modal */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>ДРОП-ЦІНА</div>
                    <div style={{ fontSize: 22, fontWeight: 950, color: '#2dd4bf' }}>{selectedItem.dropPrice} ₴</div>
                  </div>
                  {selectedItem.rrpPrice && (
                    <div style={{ paddingLeft: 14, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>РЕКОМЕНДОВАНА РРЦ</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{selectedItem.rrpPrice} ₴</div>
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => copyText(selectedItem.description || selectedItem.name, 'Опис скопійовано! 📋')}
                      style={{
                        padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Copy size={14} /> Копіювати опис
                    </button>
                  </div>
                </div>

                {selectedItem.description && (
                  <div style={{
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: 16, fontSize: 13.5, color: '#e2e8f0',
                    lineHeight: 1.6, whiteSpace: 'pre-line'
                  }}>
                    {selectedItem.description}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', zIndex: 500,
              background: 'rgba(16, 185, 129, 0.95)', backdropFilter: 'blur(10px)',
              color: '#022c22', padding: '12px 20px', borderRadius: 14,
              fontSize: 13, fontWeight: 950, boxShadow: '0 15px 35px rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
