"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Construction, Settings, Award, Package, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LegoCranePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#02020a', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      {/* Navigation Header */}
      <nav style={{ 
        padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(2,2,10,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ 
          display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none',
          fontSize: 14, fontWeight: 700, opacity: 0.8
        }}>
          <ChevronLeft size={20} /> НАЗАД В МАГАЗИН
        </Link>
        <div style={{ 
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
          padding: '4px 12px', borderRadius: '100px', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em'
        }}>
          PREMIUM EDITION
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <img 
            src="/images/lego-crane.png" 
            alt="Lego Crane Premium" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(to bottom, transparent 20%, #02020a 100%)' 
          }} />
        </motion.div>

        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1, padding: '0 20px' }}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h1 style={{ 
              fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 950, margin: 0, lineHeight: 1,
              background: 'linear-gradient(to bottom, #fff, #666)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              LEGO TECHNIC<br />TITAN CRANE
            </h1>
            <p style={{ 
              marginTop: 20, fontSize: 16, color: '#888', maxWidth: 600, marginInline: 'auto',
              fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.6
            }}>
              Вершина інженерної думки у форматі LEGO. Потужність, точність та неймовірна деталізація в одному наборі.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '40px 20px' }}>
        <div style={{ 
          maxWidth: 1000, margin: '0 auto', display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 
        }}>
          {[
            { icon: <Construction size={24} />, label: 'Деталей', value: '4,108' },
            { icon: <Settings size={24} />, label: 'Механізми', value: 'Пневматика' },
            { icon: <Award size={24} />, label: 'Складність', value: 'Advanced' },
            { icon: <Package size={24} />, label: 'Вага', value: '2.4 kg' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ 
                background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'
              }}
            >
              <div style={{ color: '#7c3aed', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Feature Section */}
      <section style={{ padding: '80px 20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>Реалістична гідравліка</h2>
            <p style={{ color: '#888', lineHeight: 1.8 }}>
              Цей кран оснащений повністю функціональною пневматичною системою, яка дозволяє піднімати та опускати стрілу, а також керувати виносними опорами. Кожен рух плавний та точний, як у справжній будівельній техніці.
            </p>
            <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 12, fontWeight: 700 }}>
                <ShieldCheck size={16} /> ОРИГІНАЛЬНИЙ LEGO
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
              borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Технічні особливості:</h3>
              <ul style={{ listStyle: 'none', padding: 0, color: '#ccc', fontSize: 14 }}>
                <li style={{ marginBottom: 10 }}>• 8-колісне рульове управління</li>
                <li style={{ marginBottom: 10 }}>• Обертання башти на 360 градусів</li>
                <li style={{ marginBottom: 10 }}>• Телескопічна стріла (до 78 см)</li>
                <li style={{ marginBottom: 10 }}>• Потужний V8 двигун з рухомими поршнями</li>
              </ul>
            </div>
            <div style={{ 
              position: 'absolute', top: -20, right: -20, opacity: 0.1, color: '#7c3aed' 
            }}>
              <Settings size={200} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer style={{ padding: '100px 20px', textAlign: 'center', background: 'linear-gradient(to bottom, #02020a, #050515)' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: 40, fontWeight: 950, marginBottom: 30 }}>ГОТОВІ ДО БУДІВНИЦТВА?</h2>
          <Link href="/" style={{ 
            display: 'inline-block', padding: '20px 40px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff',
            textDecoration: 'none', fontWeight: 1000, fontSize: 18,
            boxShadow: '0 20px 40px rgba(124,58,237,0.3)',
            transition: 'transform 0.2s'
          }}>
            ЗАМОВИТИ ЗАРАЗ
          </Link>
          <p style={{ marginTop: 24, fontSize: 12, color: '#444', fontWeight: 700, letterSpacing: '0.1em' }}>
            LIMITED AVAILABILITY • BUBA PREMIUM SERIES
          </p>
        </motion.div>
      </footer>

      {/* Background Glows */}
      <div style={{ 
        position: 'fixed', top: '10%', left: '-10%', width: '40vw', height: '40vw', 
        background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'fixed', bottom: '10%', right: '-10%', width: '50vw', height: '50vw', 
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', pointerEvents: 'none' 
      }} />
    </div>
  );
}
