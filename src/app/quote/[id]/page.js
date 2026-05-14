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
    <div style={{ minHeight: '100vh', background: '#02020a', color: '#fff', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      {/* Dynamic Cosmic Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        
        {/* Animated Stars */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 5 
            }}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: 2, height: 2,
              background: '#fff',
              borderRadius: '50%',
              boxShadow: '0 0 10px #fff'
            }}
          />
        ))}
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '60px 20px' }}>
        {/* Brand/Header */}
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', 
              background: 'rgba(255,255,255,0.03)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 32, backdropFilter: 'blur(10px)'
            }}
          >
            <Sparkles size={16} color="#7c3aed" />
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>BUBA • EXCLUSIVE QUOTE</span>
          </motion.div>
          
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 950, marginBottom: 12, letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            Твій виріб <span style={{ background: 'linear-gradient(to right, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>майже готовий</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ color: '#64748b', fontSize: 16, fontWeight: 600 }}
          >
            Ми підготували для тебе найкращу пропозицію
          </motion.p>
        </header>

        {/* Main Quote Card */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}
          style={{ 
            position: 'relative',
            background: 'rgba(15, 15, 35, 0.6)',
            borderRadius: 48, padding: 48, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)',
            marginBottom: 48, overflow: 'hidden'
          }}
        >
          {/* Decorative Corner Glow */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle at top right, rgba(124,58,237,0.2), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Модель</div>
                <h2 style={{ fontSize: 32, fontWeight: 950, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{quote.model_name || quote.name}</h2>
              </div>
              <div style={{ width: 64, height: 64, borderRadius: 24, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Package size={28} color="#7c3aed" />
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: 32, padding: '32px', border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 40, position: 'relative'
            }}>
               <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, marginBottom: 12 }}>Вартість виготовлення</div>
               <div style={{ fontSize: 64, fontWeight: 950, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 12, lineHeight: 1 }}>
                 {quote.suggested_price.toFixed(0)} 
                 <span style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed' }}>₴</span>
               </div>
               
               {/* Shine Effect */}
               <motion.div 
                 animate={{ left: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                 style={{ position: 'absolute', top: 0, bottom: 0, width: 100, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)', skewX: -20, pointerEvents: 'none' }}
               />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
               <InfoBadge icon={<Clock size={16} />} label="Час друку" value={`${quote.time_h} год`} color="#7c3aed" />
               <InfoBadge icon={<Zap size={16} />} label="Матеріал" value={quote.plastic_type} color="#ec4899" />
            </div>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 60 }}>
           <BenefitCard icon={<ShieldCheck size={20} />} title="Якість" sub="Контроль кожного шару" />
           <FeatureBadge icon={<CheckCircle2 size={20} />} title="Доставка" sub="Швидка відправка" />
        </div>

        {/* Action Section */}
        <div style={{ position: 'sticky', bottom: 40, zIndex: 10 }}>
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCheckout(true)}
            style={{ 
              width: '100%', padding: '24px 40px', borderRadius: 28, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899, #7c3aed)', 
              backgroundSize: '200% auto',
              color: '#fff', fontWeight: 950, fontSize: 18, cursor: 'pointer',
              boxShadow: '0 20px 50px rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
            animate={{ backgroundPosition: ['0% center', '200% center'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <ShoppingCart size={24} /> ПІДТВЕРДИТИ ТА ЗАМОВИТИ
          </motion.button>
        </div>
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

      <footer style={{ textAlign: 'center', padding: '60px 20px', color: '#334155', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
        POWERED BY BUBA COSMIC ENGINE
      </footer>
    </div>
  );
}

function InfoBadge({ icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{value}</div>
    </div>
  );
}

function BenefitCard({ icon, title, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(45, 212, 191, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2dd4bf' }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function FeatureBadge({ icon, title, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6' }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{sub}</div>
    </div>
  );
}
