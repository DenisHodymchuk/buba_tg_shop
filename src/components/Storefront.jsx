"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Storefront({ addToCart, searchQuery, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Всі');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('is_trending', { ascending: false })
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return ['Всі', ...new Set(cats)];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'Всі') result = result.filter(p => p.category === activeCategory);
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #7c3aed', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <section style={{ padding: '0 16px 60px', width: '100%', position: 'relative', zIndex: 10 }}>
      {/* Categories Bar */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '20px 0 24px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              whiteSpace: 'nowrap', padding: '10px 22px', borderRadius: 16,
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.06)',
              background: activeCategory === cat ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.02)',
              color: activeCategory === cat ? '#fff' : '#6b6b8a',
              boxShadow: activeCategory === cat ? '0 10px 20px rgba(124,58,237,0.2)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        justifyItems: 'center'
      }}>
        {filtered.map((toy) => {
          const finalPrice = (toy.price * (1 - (toy.discount || 0) / 100)).toFixed(0);
          return (
            <div 
              key={toy.id} 
              onClick={() => onProductClick?.(toy)}
              style={{ 
                display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', 
                borderRadius: 32, padding: 10, border: '1px solid rgba(255,255,255,0.04)',
                width: '100%', position: 'relative',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer'
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1', background: 'rgba(255,255,255,0.03)', borderRadius: 24, overflow: 'hidden', marginBottom: 12 }}>
                {toy.model_3d ? (
                  <model-viewer
                    src={toy.model_3d} alt={toy.name}
                    auto-rotate camera-controls touch-action="pan-y"
                    shadow-intensity="1" environment-image="neutral"
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                  ></model-viewer>
                ) : toy.image_url ? (
                  <img src={toy.image_url} alt={toy.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={32} style={{ color: '#4a4a6a', opacity: 0.2 }} />
                  </div>
                )}

              <div style={{ padding: '0 4px 4px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, height: 20 }}>
                  {toy.is_trending && (
                    <div style={{
                      background: 'rgba(124, 58, 237, 0.1)', 
                      color: '#a78bfa', fontSize: 8, fontWeight: 900,
                      padding: '2px 8px', borderRadius: 6, 
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      display: 'flex', alignItems: 'center', gap: 3
                    }}>
                      ТРЕНД 🔥
                    </div>
                  )}
                  {toy.discount > 0 && (
                    <div style={{
                      background: 'rgba(249, 115, 22, 0.1)', 
                      color: '#f97316', fontSize: 8, fontWeight: 900,
                      padding: '2px 8px', borderRadius: 6, 
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      textTransform: 'uppercase'
                    }}>
                      -{toy.discount}%
                    </div>
                  )}
                </div>

                <h3 style={{ 
                  fontSize: 13, fontWeight: 800, color: '#fff', 
                  lineHeight: '1.25', marginBottom: 10, 
                  height: '34px', overflow: 'hidden', 
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis'
                }}>
                  {toy.name}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ height: 14, marginBottom: 4 }}>
                      {toy.discount > 0 && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', fontWeight: 700 }}>
                          {toy.price}₴
                        </span>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: 21, fontWeight: 950, color: '#f97316', 
                      letterSpacing: '-0.02em', lineHeight: 1,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {finalPrice}<span style={{ fontSize: 13, marginLeft: 1, opacity: 0.8 }}>₴</span>
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(toy); }}
                    style={{
                      width: 42, height: 42, borderRadius: 16, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0,
                      boxShadow: '0 6px 15px rgba(124,58,237,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                      transition: 'all 0.2s',
                    }}
                    className="active:scale-90 hover:brightness-110"
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
