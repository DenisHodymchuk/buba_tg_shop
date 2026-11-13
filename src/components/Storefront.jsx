"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Package, Sparkles, Percent, Flame, X, Check, Eye, Box, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const COLOR_SWATCH_MAP = {
  'білий': '#ffffff',
  'чорний': '#18181b',
  'червоний': '#ef4444',
  'синій': '#3b82f6',
  'зелений': '#22c55e',
  'жовтий': '#eab308',
  'помаранчевий': '#f97316',
  'фіолетовий': '#a855f7',
  'рожевий': '#ec4899',
  'сірий': '#71717a',
  'золотий': '#fbbf24',
  'срібний': '#e4e4e7'
};

function SectionActionLink({ href, label }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 32,
        padding: '0 13px',
        borderRadius: 999,
        background: hovered ? '#212533' : '#181B22',
        border: hovered
          ? '1px solid rgba(147, 162, 250, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.09)',
        color: '#F3F4F8',
        fontSize: 12,
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background-color 0.16s ease, border-color 0.16s ease'
      }}
    >
      <span>{label}</span>
      <ArrowRight
        size={13}
        style={{
          color: '#93A2FA',
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 0.16s ease'
        }}
      />
    </Link>
  );
}

function CollectionCard({ col, isMobile, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isActiveHover = hovered && !isMobile;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: isActiveHover ? '#1C2029' : '#181B22',
        borderRadius: isMobile ? 14 : 18,
        overflow: 'hidden',
        border: isActiveHover
          ? '1px solid rgba(147, 162, 250, 0.42)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isActiveHover
          ? '0 18px 38px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 8px 22px rgba(0, 0, 0, 0.24)',
        transform: isActiveHover ? 'translateY(-3px)' : 'translateY(0)',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.24s ease'
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: '#13151B',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {col.coverImage ? (
          <img
            src={col.coverImage}
            alt={col.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: isActiveHover ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={28} style={{ color: '#8D93A5', opacity: 0.4 }} />
          </div>
        )}
      </div>

      <div style={{
        width: '100%',
        padding: isMobile ? '10px 11px' : '13px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        background: isActiveHover ? '#1C2029' : '#181B22',
        transition: 'background-color 0.2s ease'
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? 13 : 14.5,
            fontWeight: 700,
            color: '#F3F4F8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {col.name}
          </div>
          <div style={{
            fontSize: isMobile ? 11 : 12,
            color: '#8D93A5',
            marginTop: 2,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {col.count} {col.count === 1 ? 'виріб' : col.count < 5 ? 'вироби' : 'виробів'}
          </div>
        </div>

        <ArrowRight
          size={16}
          style={{
            color: isActiveHover ? '#93A2FA' : '#8D93A5',
            transform: isActiveHover ? 'translateX(3px)' : 'translateX(0)',
            transition: 'transform 0.2s ease, color 0.2s ease',
            flexShrink: 0
          }}
        />
      </div>
    </button>
  );
}

function ProductCard({ toy, inCartQty, isMobile, onProductClick, addToCart, compact = false }) {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const hasDiscount = Number(toy.discount) > 0;
  const finalPrice = Math.round(toy.price * (1 - (toy.discount || 0) / 100));
  const isActiveHover = hovered && !isMobile;

  return (
    <div
      onClick={() => onProductClick?.(toy)}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: isActiveHover ? '#1C2029' : '#181B22',
        borderRadius: isMobile ? 16 : 20,
        padding: compact
          ? (isMobile ? '8px 8px 12px' : '10px 10px 14px')
          : (isMobile ? '10px 10px 14px' : '12px 12px 18px'),
        border: inCartQty > 0
          ? '1px solid rgba(147, 162, 250, 0.5)'
          : isActiveHover
            ? '1px solid rgba(147, 162, 250, 0.36)'
            : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: isActiveHover
          ? '0 18px 38px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 8px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        transform: isActiveHover ? 'translateY(-3px)' : 'translateY(0)',
        width: '100%',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.24s ease'
      }}
    >
      {/* Image + Ribbon Badges */}
      <div style={{ position: 'relative', marginBottom: isMobile ? 10 : 12 }}>
        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: '#13151B',
          borderRadius: isMobile ? 12 : 15,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {toy.model_3d ? (
            <model-viewer
              src={toy.model_3d}
              alt={toy.name}
              auto-rotate
              camera-controls
              touch-action="pan-y"
              shadow-intensity="1"
              environment-image="neutral"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            />
          ) : toy.image_url ? (
            <img
              src={toy.image_url}
              alt={toy.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: isActiveHover ? 'scale(1.045)' : 'scale(1)',
                transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={30} style={{ color: '#8D93A5', opacity: 0.35 }} />
            </div>
          )}
        </div>

        {/* Stacked Folded Ribbon Badges (Bottom-Left, Dusk Palette) */}
        {(toy.is_trending || hasDiscount || toy.model_3d) && (
          <div style={{
            position: 'absolute',
            left: -5,
            bottom: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
            pointerEvents: 'none',
            zIndex: 6
          }}>
            {toy.is_trending && (
              <div style={{ position: 'relative' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#F4A97B',
                  color: '#13151B',
                  fontSize: isMobile ? 10.5 : 11.5,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  padding: '4px 10px',
                  borderRadius: '0 7px 7px 0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                }}>
                  Хіт
                </span>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  width: 0,
                  height: 0,
                  borderTop: '4px solid #A86B46',
                  borderLeft: '5px solid transparent'
                }} />
              </div>
            )}

            {hasDiscount && (
              <div style={{ position: 'relative' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#93A2FA',
                  color: '#13151B',
                  fontSize: isMobile ? 10.5 : 11.5,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  padding: '4px 10px',
                  borderRadius: '0 7px 7px 0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  −{toy.discount}%
                </span>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  width: 0,
                  height: 0,
                  borderTop: '4px solid #5965B0',
                  borderLeft: '5px solid transparent'
                }} />
              </div>
            )}

            {toy.model_3d && (
              <div style={{ position: 'relative' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#252A36',
                  color: '#F3F4F8',
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  padding: '4px 9px',
                  borderRadius: '0 7px 7px 0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderLeft: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                }}>
                  3D
                </span>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  width: 0,
                  height: 0,
                  borderTop: '4px solid #12151C',
                  borderLeft: '5px solid transparent'
                }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centered Info & Pill CTA */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        flex: 1,
        justifyContent: 'space-between',
        gap: 6,
        padding: '0 4px'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#8D93A5',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {toy.category || toy.plastic_type || '3D-виріб'}
          </div>

          <h3 style={{
            fontSize: isMobile ? 13 : 14.5,
            fontWeight: 700,
            color: '#F3F4F8',
            lineHeight: 1.32,
            margin: 0,
            minHeight: isMobile ? 34 : 38,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis'
          }}>
            {toy.name}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: '100%', marginTop: 2 }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 6,
            fontVariantNumeric: 'tabular-nums'
          }}>
            <span style={{
              fontSize: isMobile ? 16.5 : 18.5,
              fontWeight: 700,
              color: hasDiscount ? '#F4A97B' : '#93A2FA',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              {finalPrice} грн
            </span>
            {hasDiscount && (
              <span style={{
                fontSize: 12,
                color: '#8D93A5',
                textDecoration: 'line-through',
                fontWeight: 500,
                lineHeight: 1
              }}>
                {toy.price}
              </span>
            )}
          </div>

          <button
            type="button"
            onMouseEnter={() => !isMobile && setBtnHovered(true)}
            onMouseLeave={() => !isMobile && setBtnHovered(false)}
            onClick={(e) => { e.stopPropagation(); addToCart(toy); }}
            style={{
              height: isMobile ? 34 : 37,
              padding: isMobile ? '0 16px' : '0 22px',
              borderRadius: 999,
              border: inCartQty > 0
                ? '1px solid rgba(147, 162, 250, 0.7)'
                : '1px solid rgba(147, 162, 250, 0.35)',
              cursor: 'pointer',
              background: inCartQty > 0
                ? '#93A2FA'
                : btnHovered
                  ? '#93A2FA'
                  : 'rgba(147, 162, 250, 0.16)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: inCartQty > 0 || btnHovered ? '#13151B' : '#F3F4F8',
              fontSize: isMobile ? 12.5 : 13,
              fontWeight: 700,
              transition: 'all 0.16s ease'
            }}
          >
            {inCartQty > 0 && <Check size={14} strokeWidth={2.6} />}
            <span>{inCartQty > 0 ? `У кошику (${inCartQty})` : 'В кошик'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Storefront({
  addToCart,
  searchQuery,
  onProductClick,
  cart = [],
  onProductsLoaded,
  onlyTrending = false,
  hideBestsellers = false,
  bestsellersOnly = false,
  homeMode = false
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsParam = searchParams?.get('ids') || '';
  const categoryParam = searchParams?.get('category') || '';
  const bannerTitleParam = searchParams?.get('bannerTitle') || '';

  const selectedIdsSet = useMemo(() => {
    if (!idsParam) return null;
    const list = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    return list.length > 0 ? new Set(list) : null;
  }, [idsParam]);

  const [products, setProducts] = useState([]);
  const [collectionCovers, setCollectionCovers] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [sortBy, setSortBy] = useState('popular');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      if (!supabase) { setLoading(false); return; }
      const [{ data }, { data: coversRow }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('is_trending', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('settings')
          .select('value')
          .eq('key', 'collection_covers')
          .single(),
      ]);
      if (coversRow?.value && typeof coversRow.value === 'object') {
        setCollectionCovers(coversRow.value);
      }
      if (data) {
        const visible = data.filter(p => !p.is_hidden);
        setProducts(visible);
        onProductsLoaded?.(visible);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const categoriesWithCounts = useMemo(() => {
    const counts = { 'Всі': products.length };
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filtered = useMemo(() => {
    let result = onlyTrending ? products.filter(p => p.is_trending) : [...products];
    if (selectedIdsSet) {
      result = result.filter(p => selectedIdsSet.has(String(p.id)));
    }
    if (activeCategory !== 'Всі') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (onlyDiscounted) {
      result = result.filter(p => Number(p.discount) > 0);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const pa = a.price * (1 - (a.discount || 0) / 100);
        const pb = b.price * (1 - (b.discount || 0) / 100);
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const pa = a.price * (1 - (a.discount || 0) / 100);
        const pb = b.price * (1 - (b.discount || 0) / 100);
        return pb - pa;
      });
    } else if (sortBy === 'discount') {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return result;
  }, [products, activeCategory, onlyDiscounted, searchQuery, sortBy]);

  const collections = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      if (!p.category) return;
      const existing = map.get(p.category) || {
        name: p.category,
        count: 0,
        coverImage: collectionCovers[p.category] || '',
      };
      existing.count += 1;
      if (!existing.coverImage && p.image_url) {
        existing.coverImage = p.image_url;
      }
      map.set(p.category, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products, collectionCovers]);

  const bestsellers = useMemo(() => {
    const trending = products.filter(p => p.is_trending);
    return (trending.length > 0 ? trending : products).slice(0, isMobile ? 4 : 5);
  }, [products, isMobile]);

  const showCollections = !onlyTrending && !selectedIdsSet && activeCategory === 'Всі' && !(searchQuery && searchQuery.trim()) && collections.length > 0;
  const showBestsellers = !onlyTrending && !hideBestsellers && activeCategory === 'Всі' && !onlyDiscounted && !(searchQuery && searchQuery.trim()) && bestsellers.length > 0;

  const cartQtyMap = useMemo(() => {
    const map = {};
    (cart || []).forEach(item => {
      map[item.id] = (map[item.id] || 0) + (item.quantity || 1);
    });
    return map;
  }, [cart]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 34,
          height: 34,
          border: '2.5px solid rgba(147, 162, 250, 0.25)',
          borderTopColor: '#93A2FA',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1360,
      margin: '0 auto',
      padding: isMobile ? '0 12px 32px' : '0 20px 44px',
      width: '100%',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Bestsellers Section (compact, above Collections) */}
      {showBestsellers && (
        <section id="bestsellers" style={{ paddingTop: isMobile ? 16 : 24, paddingBottom: isMobile ? 10 : 14 }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: isMobile ? 10 : 14
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10.5,
                fontWeight: 600,
                color: '#F4A97B',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 3
              }}>
                <Flame size={12} />
                <span>Топ вибір покупців</span>
              </div>
              <h2 style={{
                fontSize: isMobile ? 19 : 22,
                fontWeight: 800,
                color: '#F3F4F8',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Хіти продажів
              </h2>
            </div>

            <SectionActionLink href="/hits" label="Дивитись усі" />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(5, minmax(0, 1fr))',
            gap: isMobile ? 10 : 12
          }}>
            {bestsellers.map((toy) => (
              <ProductCard
                key={`hit-${toy.id}`}
                toy={toy}
                inCartQty={cartQtyMap[toy.id] || 0}
                isMobile={isMobile}
                onProductClick={onProductClick}
                addToCart={addToCart}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Collections Section (hidden once a collection is selected) */}
      {showCollections && (
        <section id="collections" style={{ paddingTop: isMobile ? 16 : 24, paddingBottom: isMobile ? 6 : 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: isMobile ? 12 : 16
          }}>
            <h2 style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 800,
              color: '#F3F4F8',
              margin: 0,
              letterSpacing: '-0.025em'
            }}>
              Колекції
            </h2>
            <SectionActionLink href="/catalog" label="Всі колекції" />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(4, minmax(0, 1fr))',
            gap: isMobile ? 10 : 16
          }}>
            {collections.slice(0, isMobile ? 4 : 8).map((col) => (
              <CollectionCard
                key={col.name}
                col={col}
                isMobile={isMobile}
                onClick={() => {
                  if (homeMode) {
                    router.push(`/catalog?category=${encodeURIComponent(col.name)}`);
                  } else {
                    setActiveCategory(col.name);
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Catalog Section */}
      {!bestsellersOnly && (!homeMode || Boolean(searchQuery && searchQuery.trim())) && (
      <section id="catalog" style={{ paddingTop: isMobile ? 18 : 28 }}>
        {/* Unified Top Header & Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 16,
          marginBottom: isMobile ? 14 : 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{
              fontSize: isMobile ? 20 : 25,
              fontWeight: 800,
              color: '#F3F4F8',
              margin: 0,
              letterSpacing: '-0.025em'
            }}>
              {activeCategory !== 'Всі' ? activeCategory : 'Каталог 3D-виробів'}
            </h2>
            {activeCategory !== 'Всі' && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('Всі');
                  if (categoryParam) router.push('/catalog');
                }}
                style={{
                  height: 28,
                  padding: '0 11px',
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: '#181B22',
                  color: '#B8BDCB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <X size={12} />
                <span>Усі колекції</span>
              </button>
            )}
            {selectedIdsSet && (
              <button
                type="button"
                onClick={() => router.push('/catalog')}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(244, 169, 123, 0.35)',
                  background: 'rgba(244, 169, 123, 0.14)',
                  color: '#F4A97B',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span>{bannerTitleParam || 'Підбірка з банера'}</span>
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => setOnlyDiscounted(!onlyDiscounted)}
              style={{
                height: 36,
                padding: '0 13px',
                borderRadius: 11,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: onlyDiscounted
                  ? '1px solid rgba(244, 169, 123, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: onlyDiscounted
                  ? 'rgba(244, 169, 123, 0.16)'
                  : '#181B22',
                color: onlyDiscounted ? '#F4A97B' : '#B8BDCB',
                transition: 'all 0.15s ease'
              }}
            >
              <Percent size={13} style={{ color: '#F4A97B' }} />
              <span>Зі знижкою</span>
            </button>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#181B22',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 11,
              padding: 3,
              gap: 2
            }}>
              {[
                { id: 'popular', label: 'Популярні' },
                { id: 'price_asc', label: 'Дешевші' },
                { id: 'price_desc', label: 'Дорожчі' }
              ].map(opt => {
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id)}
                    style={{
                      position: 'relative',
                      height: 28,
                      padding: isMobile ? '0 10px' : '0 12px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: active ? '#F3F4F8' : '#8D93A5',
                      transition: 'color 0.14s ease'
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.1)',
                          zIndex: 0
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 16,
            padding: '56px 20px',
            textAlign: 'center',
            color: '#8D93A5'
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#F3F4F8', marginBottom: 6 }}>
              За вашим запитом нічого не знайдено
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              Спробуйте змінити категорію або очистити пошуковий запит
            </div>
            <button
              type="button"
              onClick={() => { setActiveCategory('Всі'); setOnlyDiscounted(false); }}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 9,
                border: '1px solid rgba(147, 162, 250, 0.35)',
                background: 'rgba(147, 162, 250, 0.14)',
                color: '#93A2FA',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Показати всі вироби
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(auto-fill, minmax(235px, 1fr))',
            gap: isMobile ? 10 : 16
          }}>
            {filtered.map((toy) => (
              <ProductCard
                key={toy.id}
                toy={toy}
                inCartQty={cartQtyMap[toy.id] || 0}
                isMobile={isMobile}
                onProductClick={onProductClick}
                addToCart={addToCart}
              />
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
