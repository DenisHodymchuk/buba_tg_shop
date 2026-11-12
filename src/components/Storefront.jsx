"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Package, Sparkles, Percent, Flame, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

function ProductCard({ toy, inCartQty, isMobile, onProductClick, addToCart }) {
  const hasDiscount = Number(toy.discount) > 0;
  const finalPrice = Math.round(toy.price * (1 - (toy.discount || 0) / 100));

  return (
    <div
      onClick={() => onProductClick?.(toy)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#181B22',
        borderRadius: isMobile ? 14 : 16,
        padding: isMobile ? 10 : 12,
        border: inCartQty > 0
          ? '1px solid rgba(147, 162, 250, 0.42)'
          : '1px solid rgba(255, 255, 255, 0.07)',
        width: '100%',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = inCartQty > 0
            ? 'rgba(147, 162, 250, 0.6)'
            : 'rgba(255, 255, 255, 0.16)';
          e.currentTarget.style.background = '#1C2029';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = inCartQty > 0
            ? 'rgba(147, 162, 250, 0.42)'
            : 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.background = '#181B22';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div>
        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: '#13151B',
          borderRadius: isMobile ? 10 : 12,
          overflow: 'hidden',
          marginBottom: 10,
          border: '1px solid rgba(255, 255, 255, 0.04)'
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={30} style={{ color: '#8D93A5', opacity: 0.35 }} />
            </div>
          )}

          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 5,
            pointerEvents: 'none',
            zIndex: 5
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {toy.is_trending && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(19, 21, 27, 0.86)',
                  backdropFilter: 'blur(8px)',
                  color: '#93A2FA',
                  fontSize: 10.5,
                  fontWeight: 600,
                  lineHeight: 1,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(147, 162, 250, 0.35)'
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#93A2FA' }} />
                  <span>Хіт</span>
                </span>
              )}
            </div>

            {hasDiscount && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(244, 169, 123, 0.18)',
                backdropFilter: 'blur(8px)',
                color: '#F4A97B',
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid rgba(244, 169, 123, 0.4)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                −{toy.discount}%
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '0 2px' }}>
          {toy.category && (
            <div style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: '#8D93A5',
              marginBottom: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {toy.category}
            </div>
          )}
          <h3 style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            color: '#F3F4F8',
            lineHeight: 1.32,
            marginBottom: 10,
            minHeight: isMobile ? 34 : 37,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis'
          }}>
            {toy.name}
          </h3>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 8,
        padding: '8px 2px 2px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {hasDiscount ? (
            <span style={{
              fontSize: 11,
              color: '#8D93A5',
              textDecoration: 'line-through',
              fontWeight: 500,
              lineHeight: 1.1,
              marginBottom: 2,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {toy.price} ₴
            </span>
          ) : (
            <span style={{ fontSize: 10, color: '#8D93A5', lineHeight: 1.1, marginBottom: 2 }}>
              Ціна
            </span>
          )}
          <span style={{
            fontSize: isMobile ? 17 : 19,
            fontWeight: 700,
            color: hasDiscount ? '#F4A97B' : '#F3F4F8',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {finalPrice} <span style={{ fontSize: 13, fontWeight: 500, color: '#8D93A5' }}>₴</span>
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); addToCart(toy); }}
          style={{
            height: isMobile ? 34 : 36,
            padding: isMobile ? '0 10px' : '0 13px',
            borderRadius: 10,
            border: inCartQty > 0
              ? '1px solid rgba(147, 162, 250, 0.5)'
              : '1px solid rgba(147, 162, 250, 0.3)',
            cursor: 'pointer',
            background: inCartQty > 0 ? '#93A2FA' : 'rgba(147, 162, 250, 0.14)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color: inCartQty > 0 ? '#13151B' : '#93A2FA',
            fontSize: 12.5,
            fontWeight: 600,
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>{inCartQty > 0 ? `У кошику (${inCartQty})` : (isMobile ? 'Купити' : 'В кошик')}</span>
        </button>
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
  bestsellersOnly = false
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
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('is_trending', { ascending: false })
        .order('created_at', { ascending: false });
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

  const bestsellers = useMemo(() => {
    const trending = products.filter(p => p.is_trending);
    return (trending.length > 0 ? trending : products).slice(0, 4);
  }, [products]);

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
      {/* Bestsellers Section */}
      {showBestsellers && (
        <section id="bestsellers" style={{ paddingTop: isMobile ? 22 : 34, paddingBottom: isMobile ? 16 : 26 }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: isMobile ? 12 : 16
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#F4A97B',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 4
              }}>
                <Flame size={12} />
                <span>Топ вибір покупців</span>
              </div>
              <h2 style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: '#F3F4F8',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Хіти продажів
              </h2>
            </div>

            <Link
              href="/catalog"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#93A2FA',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              Дивитись усі ({products.length}) →
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(4, minmax(0, 1fr))',
            gap: isMobile ? 10 : 16
          }}>
            {bestsellers.map((toy) => (
              <ProductCard
                key={`hit-${toy.id}`}
                toy={toy}
                inCartQty={cartQtyMap[toy.id] || 0}
                isMobile={isMobile}
                onProductClick={onProductClick}
                addToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Catalog Section */}
      {!bestsellersOnly && (
      <section id="catalog" style={{ paddingTop: isMobile ? 18 : 26 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: '#93A2FA',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 4
            }}>
              <Sparkles size={12} />
              <span>Асортимент майстерні</span>
            </div>
            <h2 style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              color: '#F3F4F8',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Каталог 3D-виробів
            </h2>
          </div>
        </div>

        {/* Filter & Sort Controls Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingBottom: isMobile ? 14 : 20
        }}>
          {/* Row 1: Category Facet Pills */}
          <div className="no-scrollbar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            overflowX: 'auto',
            paddingBottom: 2
          }}>
            {categoriesWithCounts.map(({ name, count }) => {
              const active = activeCategory === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveCategory(name)}
                  style={{
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    height: 34,
                    padding: '0 14px',
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: active
                      ? '1px solid rgba(147, 162, 250, 0.42)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                    background: '#181B22',
                    color: active ? '#F3F4F8' : '#8D93A5',
                    transition: 'color 0.15s ease, border-color 0.15s ease'
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="storefrontCategoryPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 999,
                        background: 'rgba(147, 162, 250, 0.14)',
                        zIndex: 0
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {active && (
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#93A2FA',
                        flexShrink: 0
                      }} />
                    )}
                    <span>{name}</span>
                    <span style={{
                      fontSize: 11,
                      color: active ? '#93A2FA' : 'rgba(141, 147, 165, 0.7)',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Active count + Discount filter + Sort selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, color: '#8D93A5', fontWeight: 500 }}>
              Показано <strong style={{ color: '#F3F4F8', fontVariantNumeric: 'tabular-nums' }}>{filtered.length}</strong> виробів
              {activeCategory !== 'Всі' && <span> у категорії «{activeCategory}»</span>}
            </div>
            {selectedIdsSet && (
              <button
                type="button"
                onClick={() => router.push('/catalog')}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(147, 162, 250, 0.35)',
                  background: 'rgba(147, 162, 250, 0.14)',
                  color: '#93A2FA',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: onlyDiscounted
                    ? '1px solid rgba(244, 169, 123, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  background: onlyDiscounted
                    ? 'rgba(244, 169, 123, 0.14)'
                    : '#181B22',
                  color: onlyDiscounted ? '#F4A97B' : '#B8BDCB',
                  transition: 'all 0.15s ease'
                }}
              >
                <Percent size={12} style={{ color: '#F4A97B' }} />
                <span>Зі знижкою</span>
              </button>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#181B22',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 8,
                padding: 2,
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
                        height: 26,
                        padding: '0 10px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 11.5,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        background: 'transparent',
                        color: active ? '#F3F4F8' : '#8D93A5',
                        transition: 'color 0.14s ease'
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="storefrontSortPill"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.09)',
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
