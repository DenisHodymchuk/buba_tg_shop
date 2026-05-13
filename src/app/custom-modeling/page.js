"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, PenTool, Ruler, FileImage, Camera, CheckCircle2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function CustomModelingPage() {
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
          background: 'linear-gradient(135deg, #3b82f6, #9333ea)', 
          padding: '4px 12px', borderRadius: '100px', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em'
        }}>
          ІНДИВІДУАЛЬНО
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
            src="/images/custom-modeling.png" 
            alt="Custom 3D Modeling" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
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
              background: 'linear-gradient(to bottom, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              МОДЕЛЮВАННЯ<br />НА ЗАМОВЛЕННЯ
            </h1>
            <p style={{ 
              marginTop: 20, fontSize: 16, color: '#999', maxWidth: 600, marginInline: 'auto',
              fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.6
            }}>
              Вироби будь-якої складності. Вартість визначається після аналізу складності. Терміни індивідуально під кожен виріб.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats / Process Section */}
      <section style={{ padding: '40px 20px' }}>
        <div style={{ 
          maxWidth: 1000, margin: '0 auto', display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 
        }}>
          {[
            { icon: <PenTool size={24} />, label: 'Підхід', value: 'Індивідуальний' },
            { icon: <CheckCircle2 size={24} />, label: 'Складність', value: 'Будь-яка' },
            { icon: <Ruler size={24} />, label: 'Аналіз', value: 'Точний' },
            { icon: <Settings size={24} />, label: 'Терміни', value: 'Гнучкі' },
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
              <div style={{ color: '#3b82f6', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Requirements Section */}
      <section style={{ padding: '80px 20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>Втілюємо ідеї в реальність</h2>
            <p style={{ color: '#888', lineHeight: 1.8 }}>
              Від простої деталі до складного механізму — ми допоможемо вам створити необхідний 3D-виріб. Вартість та час виготовлення залежать від складності завдання.
            </p>
            <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={16} /> КОМПЛЕКСНИЙ ПІДХІД
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))',
              borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Що потрібно для моделювання:</h3>
              <ul style={{ listStyle: 'none', padding: 0, color: '#ccc', fontSize: 15 }}>
                <li style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(59,130,246,0.2)', padding: 8, borderRadius: '50%' }}>
                    <Ruler size={18} color="#3b82f6" />
                  </div>
                  Заміри
                </li>
                <li style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(147,51,234,0.2)', padding: 8, borderRadius: '50%' }}>
                    <FileImage size={18} color="#9333ea" />
                  </div>
                  Креслення (при можливості)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(236,72,153,0.2)', padding: 8, borderRadius: '50%' }}>
                    <Camera size={18} color="#ec4899" />
                  </div>
                  Фото
                </li>
              </ul>
            </div>
            <div style={{ 
              position: 'absolute', top: -20, right: -20, opacity: 0.1, color: '#3b82f6' 
            }}>
              <PenTool size={200} />
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
          <h2 style={{ fontSize: 40, fontWeight: 950, marginBottom: 30 }}>МАЄТЕ ІДЕЮ?</h2>
          <a href="https://t.me/Denis_Buba" target="_blank" rel="noopener noreferrer" style={{ 
            display: 'inline-block', padding: '20px 40px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6, #9333ea)', color: '#fff',
            textDecoration: 'none', fontWeight: 1000, fontSize: 18,
            boxShadow: '0 20px 40px rgba(59,130,246,0.3)',
            transition: 'transform 0.2s'
          }}>
            ЗВ'ЯЗАТИСЯ ДЛЯ ОЦІНКИ
          </a>
          <p style={{ marginTop: 24, fontSize: 12, color: '#444', fontWeight: 700, letterSpacing: '0.1em' }}>
            ПЕРСОНАЛЬНИЙ РОЗРАХУНОК • БЕЗКОШТОВНА КОНСУЛЬТАЦІЯ
          </p>
        </motion.div>
      </footer>

      {/* Background Glows */}
      <div style={{ 
        position: 'fixed', top: '10%', left: '-10%', width: '40vw', height: '40vw', 
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'fixed', bottom: '10%', right: '-10%', width: '50vw', height: '50vw', 
        background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)', pointerEvents: 'none' 
      }} />
    </div>
  );
}
