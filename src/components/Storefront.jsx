"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Storefront({ addToCart, searchQuery }) {
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
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = products
      .map(p => p.category)
      .filter(Boolean);
    return ['Всі', ...new Set(cats)];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'Всі') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
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
    <section style={{ padding: '0 32px 60px', width: '100%', position: 'relative', zIndex: 10 }}>
      {/* Categories Bar */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '24px 0 32px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              whiteSpace: 'nowrap', padding: '10px 24px', borderRadius: 16,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.08)',
              background: activeCategory === cat ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? '#fff' : '#6b6b8a',
              boxShadow: activeCategory === cat ? '0 8px 20px rgba(124,58,237,0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>Каталог іграшок</h2>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '6px 16px', borderRadius: 20, textTransform: 'uppercase' }}>
          {filtered.length} ТОВАРІВ
        </span>
      </div>

      {/* Product Grid - Smaller card sizes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Зменшили з 260 до 220
        gap: 20,
        justifyItems: 'start'
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0', width: '100%' }}>
            <p style={{ color: '#6b6b8a', fontWeight: 700, fontSize: 18 }}>Порожньо</p>
          </div>
        ) : (
          filtered.map((toy) => (
            <div key={toy.id} style={{ 
              display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', 
              borderRadius: 24, padding: 8, border: '1px solid rgba(255,255,255,0.04)',
              transition: 'all 0.3s ease',
              width: '100%', maxWidth: 240, // ОБМЕЖУЄМО ШИРИНУ ТУТ
            }} className="hover:translate-y-[-4px] hover:border-[#7c3aed]/40 hover:bg-white/[0.04] group">
              {/* Image/Model Box */}
              <div style={{ position: 'relative', aspectRatio: '1', background: 'linear-gradient(135deg, #f0eef5, #e8e4f0)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 10, left: 10, zIndex: 2,
                  padding: '4px 10px', borderRadius: 8, fontSize: 8, fontWeight: 900, 
                  textTransform: 'uppercase', color: '#fff',
                  background: toy.status === 'in_stock' ? '#10b981' : '#ef4444',
                }}>
                  {toy.status === 'in_stock' ? 'Є' : 'Немає'}
                </div>

                {toy.model_3d ? (
                  <model-viewer
                    src={toy.model_3d} alt={toy.name}
                    auto-rotate camera-controls touch-action="pan-y"
                    shadow-intensity="1" environment-image="neutral"
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                  ></model-viewer>
                ) : toy.images?.[0] || toy.image_url ? (
                  <img 
                    src={toy.images?.[0] || toy.image_url} 
                    alt={toy.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={40} style={{ color: '#c4b5fd', opacity: 0.4 }} />
                  </div>
                )}
              </div>

              {/* Info Area */}
              <div style={{ padding: '12px 6px 4px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                  {toy.name}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    {toy.discount > 0 && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontWeight: 700, marginBottom: 4 }}>
                        {toy.price} ₴
                      </div>
                    )}
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
                      {(toy.price * (1 - (toy.discount || 0) / 100)).toFixed(0)}<span style={{ fontSize: 14, marginLeft: 2, opacity: 0.8 }}>₴</span>
                    </div>
                  </div>
                  
                  <button onClick={() => addToCart(toy)} style={{
                    width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 6px 12px rgba(124,58,237,0.3)'
                  }}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
