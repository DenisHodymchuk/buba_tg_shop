"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, CheckCircle2, ShoppingCart, ArrowLeft, 
  Package, Clock, ShieldCheck, Zap, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Checkout from '@/components/Checkout';

export default function QuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setQuote(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#7c3aed" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Помилка 🛸</h1>
        <p style={{ color: '#6b6b8a', textAlign: 'center' }}>Посилання недійсне або термін його дії закінчився.</p>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: 24, padding: '12px 24px', borderRadius: 16, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 800 }}>На головну</button>
      </div>
    );
  }

  const itemsForCheckout = [{
    id: quote.id,
    name: quote.model_name || quote.name,
    price: quote.suggested_price,
    quantity: 1,
    image_url: 'https://cdn.makerworld.com/3d-models/placeholder.png', // Placeholder or add real one
    isCustom: true
  }];

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Background Glows */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ display: 'inline-flex', padding: 12, borderRadius: 20, background: 'rgba(124,58,237,0.1)', marginBottom: 24 }}
          >
            <Sparkles size={32} color="#7c3aed" />
          </motion.div>
          <h1 style={{ fontSize: 32, fontWeight: 950, marginBottom: 8, letterSpacing: '-0.02em' }}>Пропозиція для вас</h1>
          <p style={{ color: '#6b6b8a', fontWeight: 700 }}>Індивідуальний розрахунок вартості 3D друку</p>
        </header>

        {/* Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ 
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(49,46,129,0.8))',
            borderRadius: 40, padding: 40, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
            marginBottom: 40
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Назва виробу</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>{quote.model_name || quote.name}</h2>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 24, padding: 32, marginBottom: 32 }}>
             <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>Вартість виготовлення:</div>
             <div style={{ fontSize: 48, fontWeight: 950, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 8 }}>
               {quote.suggested_price.toFixed(0)} <span style={{ fontSize: 24, color: '#7c3aed' }}>₴</span>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                <Clock size={16} color="#7c3aed" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{quote.time_h} год. друку</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                <Zap size={16} color="#ec4899" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{quote.plastic_type}</span>
             </div>
          </div>
        </motion.div>

        {/* Features */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 56 }}>
           <FeatureItem icon={<CheckCircle2 size={20} color="#2dd4bf" />} title="Гарантія якості" sub="Перевіряємо кожен виріб на дефекти перед відправкою" />
           <FeatureItem icon={<ShieldCheck size={20} color="#3b82f6" />} title="Міцний матеріал" sub={`Використовуємо високоякісний ${quote.plastic_type}`} />
        </section>

        {/* CTA */}
        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCheckout(true)}
          style={{ 
            width: '100%', padding: '24px', borderRadius: 24, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff',
            fontWeight: 950, fontSize: 18, cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
          }}
        >
          <ShoppingCart size={24} /> ПІДТВЕРДИТИ ТА ЗАМОВИТИ
        </motion.button>
      </main>

      {/* Checkout Overlay */}
      <AnimatePresence>
        {showCheckout && (
          <Checkout 
            items={itemsForCheckout} 
            bonuses={0}
            onClose={() => setShowCheckout(false)}
            onUpdateQuantity={() => {}}
            onRemove={() => setShowCheckout(false)}
            onOrderSuccess={() => {}}
          />
        )}
      </AnimatePresence>

      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#4a4a6a', fontSize: 12, fontWeight: 700 }}>
        BUBA STORE • COSMIC 3D PRINTING STUDIO
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 900, color: '#fff', fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div style={{ color: '#6b6b8a', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}
