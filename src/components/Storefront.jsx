"use client";
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Storefront({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="storefront px-4 py-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-700 font-bold italic">Каталог порожній</div>
        ) : (
          products.map((toy) => (
            <div key={toy.id} className="flex flex-col bg-transparent">
              
              {/* Product Image - Fixed Aspect Ratio Container */}
              <div className="relative w-full aspect-square bg-white rounded-[28px] overflow-hidden shadow-sm flex items-center justify-center">
                <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter z-10 ${
                  toy.status === 'in_stock' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {toy.status === 'in_stock' ? 'В наявності' : 'Немає'}
                </div>

                <div className="w-full h-full p-2">
                  <model-viewer
                    src={toy.model_3d}
                    alt={toy.name}
                    auto-rotate
                    camera-controls
                    touch-action="pan-y"
                    shadow-intensity="1"
                    environment-image="neutral"
                    style={{ width: '100%', height: '100%' }}
                  ></model-viewer>
                </div>
              </div>

              {/* Product Info - Guaranteed Spacing */}
              <div className="mt-3 px-1 flex flex-col flex-1">
                <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-2 h-[36px] overflow-hidden">
                  {toy.name}
                </h3>
                
                <div className="mt-2">
                  <span className="text-[10px] text-slate-600 line-through font-bold">
                    {(Number(toy.price) * 1.2).toFixed(0)} ₴
                  </span>
                  <div className="flex justify-between items-end mt-0.5">
                    <span className="text-xl font-black text-emerald-400 leading-none">
                      {toy.price} <span className="text-sm">₴</span>
                    </span>
                    <button 
                      onClick={() => addToCart(toy)}
                      className="w-9 h-9 bg-[#1a1a1a] border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
