"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StoreShell from '@/components/StoreShell';
import { supabase } from '@/lib/supabase';
import { parseProductSizes } from '@/lib/productSizes';
import {
  Flame, ArrowRight, ShoppingCart, Sparkles, Truck, ShieldCheck,
  ChevronLeft, ChevronRight, Eye, Trophy
} from 'lucide-react';

function HitCard({ toy, rank, inCartQty, isMobile, onProductClick, addToCart }) {
  const [hovered, setHovered] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(0);

  const sizes = useMemo(() => parseProductSizes(toy), [toy]);
  const activeSize = sizes[Math.min(sizeIdx, Math.max(0, sizes.length - 1))] || null;
  const basePrice = activeSize ? activeSize.price : (Number(toy.price) || 0);
  const hasDiscount = Number(toy.discount) > 0;
  const finalPrice = Math.round(basePrice * (1 - (toy.discount || 0) / 100));
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(rank * 0.04, 0.25) }}
      onClick={() => onProductClick?.(toy)}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        background: hovered ? '#1C2029' : '#181B22',
        borderRadius: isMobile ? 16 : 20,
        border: `1px solid ${
          inCartQty > 0
            ? 'rgba(147, 162, 250, 0.55)'
            : hovered
              ? 'rgba(147, 162, 250, 0.35)'
              : isTop3
                ? 'rgba(244, 169, 123, 0.22)'
                : 'rgba(255, 255, 255, 0.08)'
        }`,
        padding: isMobile ? 10 : 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.22s ease',
        transform: hovered && !isMobile ? 'translateY(-3px)' : 'none',
        boxShadow: isTop3 ? '0 10px 30px rgba(0, 0, 0, 0.28)' : 'none'
      }}
    >
      {/* Image Stage */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          borderRadius: isMobile ? 12 : 14,
          background: '#13151B',
          overflow: 'hidden',
          marginBottom: 12
        }}
      >
        {toy.image_url && (
          <img
            src={toy.image_url}
            alt={toy.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: hovered && !isMobile ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          />
        )}

        {/* Rank Badge */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 999,
            background: isTop3 ? 'rgba(244, 169, 123, 0.92)' : 'rgba(24, 27, 34, 0.88)',
            color: isTop3 ? '#13151B' : '#F3F4F8',
            border: isTop3 ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: 11,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {isTop3 ? <Trophy size={11} /> : <Flame size={11} style={{ color: '#F4A97B' }} />}
          <span>#{rank}</span>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(147, 162, 250, 0.92)',
              color: '#13151B',
              fontSize: 11,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            -{toy.discount}%
          </div>
        )}
      </div>

      {/* Info & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 2px' }}>
        <div>
          <div style={{ fontSize: 11, color: '#8D93A5', fontWeight: 500, marginBottom: 3 }}>
            {toy.category || toy.plastic_type || '3D-виріб'}
          </div>
          <h3
            style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: '#F3F4F8',
              margin: 0,
              lineHeight: 1.3,
              minHeight: isMobile ? 36 : 42,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {toy.name}
          </h3>
        </div>

        {sizes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {sizes.map((s, idx) => {
              const isSel = idx === Math.min(sizeIdx, sizes.length - 1);
              return (
                <button
                  key={`${s.label}-${idx}`}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSizeIdx(idx); }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: `1px solid ${isSel ? '#93A2FA' : 'rgba(255,255,255,0.12)'}`,
                    background: isSel ? 'rgba(147, 162, 250, 0.18)' : 'rgba(255,255,255,0.03)',
                    color: isSel ? '#F3F4F8' : '#8D93A5',
                    fontSize: 11,
                    fontWeight: isSel ? 700 : 500,
                    cursor: 'pointer',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: hasDiscount ? '#F4A97B' : '#93A2FA' }}>
              {finalPrice} ₴
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 12, color: '#8D93A5', textDecoration: 'line-through' }}>
                {basePrice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart?.({
                ...toy,
                selectedSize: activeSize?.label || '',
                price: basePrice
              });
            }}
            style={{
              height: isMobile ? 34 : 36,
              padding: isMobile ? '0 12px' : '0 15px',
              borderRadius: 999,
              border: '1px solid rgba(147, 162, 250, 0.4)',
              background: inCartQty > 0 ? '#93A2FA' : 'rgba(147, 162, 250, 0.16)',
              color: inCartQty > 0 ? '#13151B' : '#F3F4F8',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingCart size={13} />
            <span>{inCartQty > 0 ? `У кошику (${inCartQty})` : 'В кошик'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HitsContent({ cart, addToCart, searchQuery, setSelectedProduct, isMobile }) {
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc'
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [spotSizeIdx, setSpotSizeIdx] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadHits() {
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_trending', true)
        .order('created_at', { ascending: false });

      if (active) {
        if (!error && Array.isArray(data)) {
          setHits(data);
        }
        setLoading(false);
      }
    }
    loadHits();
    return () => { active = false; };
  }, []);

  const topSpotlight = useMemo(() => hits.slice(0, Math.min(3, hits.length)), [hits]);
  const activeSpot = topSpotlight[spotlightIdx % Math.max(1, topSpotlight.length)] || null;
  const spotSizes = useMemo(() => parseProductSizes(activeSpot), [activeSpot]);
  const activeSpotSize = spotSizes[Math.min(spotSizeIdx, Math.max(0, spotSizes.length - 1))] || null;
  const spotBasePrice = activeSpotSize ? activeSpotSize.price : (Number(activeSpot?.price) || 0);
  const spotFinalPrice = Math.round(spotBasePrice * (1 - (activeSpot?.discount || 0) / 100));

  useEffect(() => {
    setSpotSizeIdx(0);
  }, [activeSpot?.id]);

  const filteredHits = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const list = hits.filter(p =>
      !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [hits, searchQuery, sortBy]);

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: isMobile ? '14px 12px 44px' : '26px 24px 64px', display: 'flex', flexDirection: 'column', gap: isMobile ? 22 : 30 }}>
      {/* Editorial Hero + #1 Spotlight */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
          gap: isMobile ? 14 : 20,
          alignItems: 'stretch'
        }}
      >
        {/* Left: Editorial Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: 22,
            background: 'linear-gradient(145deg, #181B24 0%, #13151B 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: isMobile ? '22px 18px' : '34px 36px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 20
          }}
        >
          {/* Ambient Dusk Glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -40,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244, 169, 123, 0.16) 0%, rgba(147, 162, 250, 0.08) 45%, transparent 72%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative' }}>
            <h1
              style={{
                fontSize: isMobile ? 26 : 36,
                fontWeight: 800,
                color: '#F3F4F8',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                margin: 0
              }}
            >
              Найпопулярніші 3D-фігурки
            </h1>

            <p style={{ fontSize: isMobile ? 13.5 : 15, color: '#9EA5B8', lineHeight: 1.55, margin: '12px 0 0', maxWidth: 520 }}>
              Моделі, які наші клієнти обирають найчастіше для подарунків та колекцій. Друкуємо з екологічного PLA у кількох розмірах.
            </p>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link
                href="/catalog"
                style={{
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 11,
                  background: '#93A2FA',
                  color: '#13151B',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7
                }}
              >
                <span>Весь каталог</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Interactive Top-3 Spotlight */}
        <div
          style={{
            borderRadius: 22,
            background: '#181B22',
            border: '1px solid rgba(147, 162, 250, 0.22)',
            padding: isMobile ? 16 : 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          {activeSpot ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#F4A97B' }}>
                  <Trophy size={14} />
                  <span>Лідер добірки #{(spotlightIdx % topSpotlight.length) + 1}</span>
                </div>

                {topSpotlight.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setSpotlightIdx(i => (i - 1 + topSpotlight.length) % topSpotlight.length)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#13151B',
                        color: '#F3F4F8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpotlightIdx(i => (i + 1) % topSpotlight.length)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#13151B',
                        color: '#F3F4F8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div
                onClick={() => setSelectedProduct?.(activeSpot)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '110px 1fr' : '150px 1fr',
                  gap: 14,
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: '#13151B',
                  borderRadius: 16,
                  padding: 12,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div style={{ aspectRatio: '1 / 1', borderRadius: 12, overflow: 'hidden', background: '#0F1117' }}>
                  {activeSpot.image_url && (
                    <img
                      src={activeSpot.image_url}
                      alt={activeSpot.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                </div>

                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#8D93A5' }}>{activeSpot.category}</div>
                  <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#F3F4F8', lineHeight: 1.25 }}>
                    {activeSpot.name}
                  </div>

                  {spotSizes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {spotSizes.map((s, idx) => {
                        const isSel = idx === Math.min(spotSizeIdx, spotSizes.length - 1);
                        return (
                          <button
                            key={s.label}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSpotSizeIdx(idx); }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: `1px solid ${isSel ? '#93A2FA' : 'rgba(255,255,255,0.12)'}`,
                              background: isSel ? 'rgba(147, 162, 250, 0.18)' : 'transparent',
                              color: isSel ? '#F3F4F8' : '#8D93A5',
                              fontSize: 11,
                              fontWeight: isSel ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ fontSize: 20, fontWeight: 800, color: '#93A2FA', fontVariantNumeric: 'tabular-nums' }}>
                    {spotFinalPrice} ₴
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => addToCart?.({ ...activeSpot, selectedSize: activeSpotSize?.label || '', price: spotBasePrice })}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(147, 162, 250, 0.18)',
                    color: '#F3F4F8',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <ShoppingCart size={14} /> В кошик
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct?.(activeSpot)}
                  style={{
                    height: 38,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#13151B',
                    color: '#B8BDCB',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Eye size={14} /> Детальніше
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D93A5', fontSize: 13 }}>
              Завантаження хітів...
            </div>
          )}
        </div>
      </section>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: '#F3F4F8', margin: 0 }}>
            Топ-добірка хітів
          </h2>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(147, 162, 250, 0.14)',
              color: '#93A2FA',
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {filteredHits.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, background: '#181B22', padding: 4, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'featured', label: 'За рейтингом' },
            { id: 'price_asc', label: 'Дешевші' },
            { id: 'price_desc', label: 'Дорожчі' }
          ].map(tab => {
            const active = sortBy === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSortBy(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: active ? '#93A2FA' : 'transparent',
                  color: active ? '#13151B' : '#8D93A5',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Balanced 3-Column (Desktop) / 2-Column (Mobile) Showcase Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 18 }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} style={{ height: isMobile ? 270 : 380, borderRadius: 18, background: '#181B22', opacity: 0.6 }} />
          ))}
        </div>
      ) : filteredHits.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 18 }}>
          {filteredHits.map((toy, idx) => {
            const qty = (cart || [])
              .filter(item => item.id === toy.id)
              .reduce((sum, item) => sum + (item.quantity || 1), 0);
            return (
              <HitCard
                key={toy.id}
                toy={toy}
                rank={idx + 1}
                inCartQty={qty}
                isMobile={isMobile}
                onProductClick={setSelectedProduct}
                addToCart={addToCart}
              />
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', background: '#181B22', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', color: '#8D93A5' }}>
          Поки що за вашим запитом хітів не знайдено.
        </div>
      )}
    </div>
  );
}

export default function HitsPage() {
  return (
    <StoreShell>
      {({ cart, addToCart, searchQuery, setSelectedProduct, isMobile }) => (
        <HitsContent
          cart={cart}
          addToCart={addToCart}
          searchQuery={searchQuery}
          setSelectedProduct={setSelectedProduct}
          isMobile={isMobile}
        />
      )}
    </StoreShell>
  );
}
