"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Package, X, ShieldCheck, Weight, Droplets, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Storefront({ addToCart, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [selectedProduct, setSelectedProduct] = useState(null);

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
              onClick={() => setSelectedProduct(toy)}
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

                {toy.discount > 0 && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', fontSize: 10, fontWeight: 950,
                    padding: '4px 10px', borderRadius: 10, boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                    zIndex: 20
                  }}>
                    -{toy.discount}%
                  </div>
                )}
              </div>

              <div style={{ padding: '0 4px 4px' }}>
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

      <AnimatePresence>
        {selectedProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }}
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 450, background: '#0a0a1a', 
                borderRadius: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px' }}>
                <div style={{ width: '100%', height: 320, position: 'relative', marginTop: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 32, overflow: 'hidden' }}>
                  {selectedProduct.model_3d ? (
                    <model-viewer
                      src={selectedProduct.model_3d} alt={selectedProduct.name}
                      auto-rotate camera-controls touch-action="pan-y"
                      shadow-intensity="1" environment-image="neutral"
                      style={{ width: '100%', height: '100%' }}
                    ></model-viewer>
                  ) : (
                    <img src={selectedProduct.image_url} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 20 }} />
                  )}
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 }}>{selectedProduct.category}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 16 }}>{selectedProduct.name}</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Droplets size={12} style={{ color: '#3b82f6' }} /> Матеріал
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.plastic_type || 'PLA Пластик'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <ShieldCheck size={12} style={{ color: '#22c55e' }} /> Безпека
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.safety_info || 'Безпечний'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Weight size={12} style={{ color: '#ec4899' }} /> Вага
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.weight || '---'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Droplets size={12} style={{ color: '#7c3aed' }} /> Колір
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{selectedProduct.color || 'Базовий'}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b8a', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                      <Info size={12} /> Опис товару
                    </div>
                    <p style={{ color: '#6b6b8a', lineHeight: 1.5, fontSize: 14 }}>{selectedProduct.description || 'Опис скоро з\'явиться...'}</p>
                  </div>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', background: '#0a0a1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#6b6b8a', marginBottom: 2 }}>Ціна товару</div>
                    <div style={{ fontSize: 24, fontWeight: 950, color: '#f97316' }}>
                      {(selectedProduct.price * (1 - (selectedProduct.discount || 0) / 100)).toFixed(0)}₴
                    </div>
                  </div>
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{ 
                      padding: '14px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                      color: '#fff', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(124,58,237,0.3)'
                    }}
                  >
                    В КОШИК
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
