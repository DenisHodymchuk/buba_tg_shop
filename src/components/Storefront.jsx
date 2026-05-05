"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Package, Check } from 'lucide-react';
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
      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '20px 0 24px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: 16,
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

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
        justifyItems: 'center'
      }}>
        {filtered.map((toy) => {
          const finalPrice = (toy.price * (1 - (toy.discount || 0) / 100)).toFixed(0);
          return (
            <div key={toy.id} style={{ 
              display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', 
              borderRadius: 28, padding: 10, border: '1px solid rgba(255,255,255,0.03)',
              width: '100%', maxWidth: 240, position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              {/* Badge: Top Right Pill */}
              <div style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                padding: '4px 10px', borderRadius: 20, fontSize: 9, fontWeight: 900, 
                textTransform: 'uppercase', color: '#fff',
                background: toy.status === 'in_stock' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${toy.status === 'in_stock' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: toy.status === 'in_stock' ? '#10b981' : '#ef4444' }} />
                {toy.status === 'in_stock' ? 'Є' : 'Немає'}
              </div>

              {/* Image Container */}
              <div style={{ position: 'relative', aspectRatio: '1', background: 'rgba(255,255,255,0.02)', borderRadius: 22, overflow: 'hidden', marginBottom: 14 }}>
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

                {/* Discount Tag */}
                {toy.discount > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 900,
                    padding: '2px 8px', borderRadius: 8, boxShadow: '0 4px 10px rgba(239,68,68,0.3)'
                  }}>
                    -{toy.discount}%
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div style={{ padding: '0 4px 6px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 34, opacity: 0.9 }}>
                  {toy.name}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {toy.discount > 0 && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through', fontWeight: 600, marginBottom: -2 }}>
                        {toy.price}₴
                      </span>
                    )}
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                      {finalPrice}<span style={{ fontSize: 12, marginLeft: 2, color: '#7c3aed' }}>₴</span>
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => addToCart(toy)}
                    style={{
                      width: 40, height: 40, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: '0 8px 16px rgba(124,58,237,0.3)',
                      transition: 'all 0.2s'
                    }}
                    className="active:scale-90"
                  >
                    <Plus size={22} />
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
