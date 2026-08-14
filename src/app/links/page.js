"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Box, Share2, Copy, Check, QrCode, X, Sparkles, 
  ShoppingBag, Layers, MessageCircle, ExternalLink, ArrowRight,
  ShieldCheck, Heart, Globe, Flame, Star
} from 'lucide-react';

export const DEFAULT_SOCIAL_LINKS = [
  {
    id: 'store',
    iconType: 'store',
    title: 'Онлайн-Магазин 3D Виробів',
    subtitle: 'Переглянути повний каталог товарів',
    url: '/',
    badge: 'Каталог',
    isInternal: true,
    featured: true,
    colorGradient: 'from-purple-600 via-pink-600 to-amber-500',
    borderGlow: 'rgba(124, 58, 237, 0.4)',
  },
  {
    id: 'telegram_channel',
    iconType: 'telegram',
    title: 'Telegram Канал',
    subtitle: 'Ексклюзивні новинки, знижки та анонси',
    url: 'https://t.me/your_telegram_channel',
    badge: 'Новини',
    isInternal: false,
    colorGradient: 'from-sky-500 to-blue-600',
    borderGlow: 'rgba(56, 189, 248, 0.4)',
  },
  {
    id: 'tiktok',
    iconType: 'tiktok',
    title: 'TikTok Профіль',
    subtitle: 'Відеопроцес 3D друку та готові вироби',
    url: 'https://www.tiktok.com/@your_tiktok_username',
    badge: 'Тренди',
    isInternal: false,
    colorGradient: 'from-cyan-500 via-slate-900 to-rose-500',
    borderGlow: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'instagram',
    iconType: 'instagram',
    title: 'Instagram',
    subtitle: 'Фото, портфоліо робіт та сторіз',
    url: 'https://instagram.com/your_instagram_username',
    badge: 'Фото',
    isInternal: false,
    colorGradient: 'from-amber-500 via-rose-500 to-purple-600',
    borderGlow: 'rgba(244, 63, 94, 0.4)',
  },
  {
    id: 'custom_modeling',
    iconType: 'custom_modeling',
    title: 'Замовити 3D Моделювання',
    subtitle: 'Розрахунок вартості за вашою моделлю або ідеєю',
    url: '/custom-modeling',
    badge: 'Послуга',
    isInternal: true,
    colorGradient: 'from-purple-600 to-indigo-600',
    borderGlow: 'rgba(147, 51, 234, 0.4)',
  },
  {
    id: 'telegram_manager',
    iconType: 'manager',
    title: 'Написати Менеджеру',
    subtitle: 'Консультація та відповіді на будь-які питання',
    url: 'https://t.me/your_manager_username',
    badge: '24/7',
    isInternal: false,
    colorGradient: 'from-emerald-500 to-teal-700',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
  }
];

export function renderLinkIcon(iconType, props = { size: 22 }) {
  switch (iconType) {
    case 'store':
      return <ShoppingBag {...props} />;
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={props.size} height={props.size}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .54-1.43.53-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.07-.78 4.2-1.83 7-3.04 8.4-3.63 4-.17 4.84.97 4.78 1.95z"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={props.size} height={props.size}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.83.1v-3.6a6.45 6.45 0 0 0-1-.08 6.4 6.4 0 1 0 6.46 6.4V9a8.28 8.28 0 0 0 4.82 1.56V7a4.84 4.84 0 0 1-1-.31z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={props.size} height={props.size}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case 'custom_modeling':
      return <Layers {...props} />;
    case 'manager':
      return <MessageCircle {...props} />;
    case 'flame':
      return <Flame {...props} />;
    case 'star':
      return <Star {...props} />;
    default:
      return <Globe {...props} />;
  }
}

export default function LinksPage() {
  const [links, setLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
      // Спробуємо спочатку завантажити з локального сховища для швидкого рендеру
      const cached = localStorage.getItem('buba_bio_links');
      if (cached) {
        try { setLinks(JSON.parse(cached)); } catch (e) {}
      }
    }

    // Завантаження з Supabase settings
    async function loadLinksFromDB() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'bio_links')
          .single();

        if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
          setLinks(data.value);
          if (typeof window !== 'undefined') {
            localStorage.setItem('buba_bio_links', JSON.stringify(data.value));
          }
        }
      } catch (err) {
        console.log('Using default bio links:', err?.message);
      }
    }
    loadLinksFromDB();
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const qrImageUrl = pageUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pageUrl)}&color=ffffff&bgcolor=161630`
    : '';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a1a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 16px 80px',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Космічний фон і блури */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 80%)',
          filter: 'blur(60px)', borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%',
          width: '450px', height: '450px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
          filter: 'blur(70px)', borderRadius: '50%'
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', zIndex: 1, position: 'relative' }}>
        
        {/* Профіль / Брендова шапка */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Анімований логотип бренду */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{
              position: 'absolute', inset: '-6px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899, #f97316)',
              opacity: 0.6,
              filter: 'blur(12px)',
              animation: 'cosmicPulse 3s ease-in-out infinite'
            }} />
            
            <div style={{
              width: '92px', height: '92px',
              borderRadius: '26px',
              background: '#0a0a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              padding: '6px'
            }}>
              <img 
                src="/images/buba-logo.png" 
                alt="BUBA STORE Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '20px' }} 
              />
            </div>

            <div style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              padding: '4px',
              border: '2px solid #0a0a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} title="Офіційна сторінка">
              <ShieldCheck size={14} style={{ color: '#fff' }} />
            </div>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #ffffff 40%, #a1a1c5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            BUBA STORE
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '100px',
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            fontSize: '11px',
            fontWeight: 800,
            color: '#c084fc',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            <Sparkles size={12} />
            <span>Студія 3D Друку & Дизайну</span>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#a1a1c5',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: '340px'
          }}>
            Унікальні 3D вироби, лампа-кастоми та створення моделей будь-якої складності!
          </p>
        </motion.div>

        {/* Список посилань */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {links.filter(item => !item.hidden).map((item, index) => {
            const isInternal = item.isInternal;
            const LinkWrapper = isInternal ? Link : 'a';
            const linkProps = isInternal 
              ? { href: item.url || '/' } 
              : { href: item.url || '#', target: '_blank', rel: 'noopener noreferrer' };

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <LinkWrapper
                  {...linkProps}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    background: 'rgba(22, 22, 48, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: item.featured ? `0 8px 24px ${item.borderGlow || 'rgba(124,58,237,0.3)'}` : '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  className="group hover:border-purple-500/50 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Ліва колірна смужка */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, width: '4px',
                  }} className={`bg-gradient-to-b ${item.colorGradient || 'from-purple-600 to-pink-600'}`} />

                  {/* Основний вміст картки */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                    {/* Іконка */}
                    <div style={{
                      width: '46px', height: '46px',
                      borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      flexShrink: 0
                    }} className={`bg-gradient-to-br ${item.colorGradient || 'from-purple-600 to-pink-600'}`}>
                      {renderLinkIcon(item.iconType, { size: 22 })}
                    </div>

                    {/* Текстова частина */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#ffffff',
                          lineHeight: 1.2
                        }}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#a78bfa',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <span style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          marginTop: '3px',
                          display: 'block',
                          lineHeight: 1.3
                        }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Стрілка переходу */}
                  <div style={{
                    color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    zIndex: 1
                  }} className="group-hover:text-white group-hover:translate-x-1">
                    {isInternal ? <ArrowRight size={18} /> : <ExternalLink size={18} />}
                  </div>
                </LinkWrapper>
              </motion.div>
            );
          })}
        </div>

        {/* Кнопки дій внизу (Share & QR) */}
        <div style={{
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px',
          marginBottom: '8px'
        }}>
          <button
            onClick={() => setShowQr(true)}
            title="Показати QR-код"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            className="hover:bg-white/[0.1] hover:scale-105 active:scale-95"
          >
            <QrCode size={18} style={{ color: '#a78bfa' }} />
            <span>QR-код</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Копіювати посилання"
            style={{
              height: '42px',
              padding: '0 22px',
              borderRadius: '14px',
              background: copied 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)'
            }}
            className="hover:scale-105 active:scale-95"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            <span>{copied ? 'Скопійовано!' : 'Поділитись'}</span>
          </button>
        </div>

        {/* Футер сторінки */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>Зроблено з</span>
            <Heart size={12} style={{ color: '#ec4899', fill: '#ec4899' }} />
            <span>в Україні • BUBA STORE</span>
          </div>

          <div style={{ fontSize: '11px', color: '#475569' }}>
            © {new Date().getFullYear()} Всі права захищені
          </div>
        </div>

      </div>

      {/* Модальне вікно QR-Коду */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQr(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 15, 0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#161630',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '28px',
                padding: '32px 24px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setShowQr(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: 'none',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#fff'
              }}>
                <QrCode size={24} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                QR-код сторінки
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
                Відскануйте смартфоном для швидкого переходу
              </p>

              {/* QR картинка */}
              <div style={{
                background: '#0a0a1a',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-block',
                marginBottom: '20px'
              }}>
                {qrImageUrl && (
                  <img 
                    src={qrImageUrl} 
                    alt="QR Code"
                    width={200}
                    height={200}
                    style={{ borderRadius: '12px', display: 'block' }}
                  />
                )}
              </div>

              <button
                onClick={handleCopyLink}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Посилання скопійовано!' : 'Скопіювати лінк'}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
