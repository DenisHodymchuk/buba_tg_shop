"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Box, Share2, Copy, Check, QrCode, X, Sparkles, 
  ShoppingBag, Layers, MessageCircle, ExternalLink, ArrowRight, ArrowUpRight,
  ShieldCheck, Heart, Globe, Flame, Star
} from 'lucide-react';

import InAppBrowserGuide from '@/components/InAppBrowserGuide';

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
  const size = props.size || 22;
  switch (iconType) {
    case 'store':
      return <ShoppingBag {...props} size={size} />;
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .54-1.43.53-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.07-.78 4.2-1.83 7-3.04 8.4-3.63 4-.17 4.84.97 4.78 1.95z"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.83.1v-3.6a6.45 6.45 0 0 0-1-.08 6.4 6.4 0 1 0 6.46 6.4V9a8.28 8.28 0 0 0 4.82 1.56V7a4.84 4.84 0 0 1-1-.31z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"></circle>
        </svg>
      );
    case 'custom_modeling':
      return <Box {...props} size={size} />;
    case 'manager':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .54-1.43.53-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.07-.78 4.2-1.83 7-3.04 8.4-3.63 4-.17 4.84.97 4.78 1.95z"/>
        </svg>
      );
    case 'flame':
      return <Flame {...props} size={size} />;
    case 'star':
      return <Star {...props} size={size} />;
    default:
      return <Sparkles {...props} size={size} />;
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

      // Трекінг перегляду сторінки
      const trackPageView = async () => {
        if (!supabase) return;
        if (sessionStorage.getItem('buba_links_page_view_tracked')) return;
        
        try {
          let referrer = 'direct';
          const urlParams = new URLSearchParams(window.location.search);
          const utmSource = urlParams.get('utm_source') || urlParams.get('ref') || urlParams.get('source');
          
          if (utmSource) {
            referrer = utmSource.toLowerCase();
          } else if (document.referrer) {
            const ref = document.referrer;
            if (ref.includes('instagram.com')) referrer = 'instagram';
            else if (ref.includes('t.co') || ref.includes('twitter.com')) referrer = 'twitter';
            else if (ref.includes('facebook.com')) referrer = 'facebook';
            else if (ref.includes('tiktok.com')) referrer = 'tiktok';
            else if (ref.includes('youtube.com')) referrer = 'youtube';
            else if (ref.includes('telegram') || ref.includes('tg') || ref.includes('android-app://org.telegram.messenger')) referrer = 'telegram';
            else if (ref.includes('google.com')) referrer = 'google';
            else {
              try {
                referrer = new URL(ref).hostname;
              } catch (e) {
                referrer = ref.substring(0, 100);
              }
            }
          }

          let deviceType = 'desktop';
          const ua = navigator.userAgent;
          if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            deviceType = 'tablet';
          } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
            deviceType = 'mobile';
          }

          const { error } = await supabase.from('bio_links_views').insert({
            referrer,
            user_agent: ua.substring(0, 500),
            device_type: deviceType
          });
          
          if (!error) {
            sessionStorage.setItem('buba_links_page_view_tracked', 'true');
          }
        } catch (err) {
          console.error('Error tracking page view:', err);
        }
      };

      trackPageView();
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

  const handleLinkClick = async (item) => {
    if (!supabase) return;
    try {
      await supabase.from('bio_links_clicks').insert({
        link_id: item.id || 'unknown',
        link_title: item.title || 'Untitled',
        url: item.url || ''
      });
    } catch (err) {
      console.error('Error tracking link click:', err);
    }
  };

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
        
        {/* Автоматична підказка для вбудованих браузерів (TikTok/Instagram) */}
        <InAppBrowserGuide />

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
              borderRadius: '26px',
              background: 'linear-gradient(135deg, #5b21b6, #7c3aed, #a855f7, #6366f1)',
              opacity: 0.65,
              filter: 'blur(14px)',
              animation: 'cosmicPulse 3s ease-in-out infinite'
            }} />
            
            <div style={{
              width: '90px', height: '90px',
              borderRadius: '22px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 10px 35px rgba(124, 58, 237, 0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img 
                src="/images/buba-logo.png" 
                alt="BUBA STORE Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
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
                  onClick={() => handleLinkClick(item)}
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
                  {/* Основний вміст картки */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1, flex: 1, minWidth: 0 }}>
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
                    <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                            fontSize: '9.5px',
                            fontWeight: 900,
                            padding: '3px 9px',
                            borderRadius: '100px',
                            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(236, 72, 153, 0.2))',
                            border: '1px solid rgba(192, 132, 252, 0.35)',
                            color: '#f3e8ff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backdropFilter: 'blur(8px)',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{
                              width: '4px', height: '4px', borderRadius: '50%',
                              background: '#e879f9',
                              boxShadow: '0 0 6px #e879f9'
                            }} />
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

                  {/* Стрілка переходу (однакова для всіх карт та притиснута до правого краю) */}
                  <div style={{
                    color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    zIndex: 1,
                    marginLeft: '12px',
                    flexShrink: 0
                  }} className="group-hover:text-white group-hover:translate-x-1">
                    <ArrowUpRight size={20} />
                  </div>
                </LinkWrapper>
              </motion.div>
            );
          })}
        </div>

        {/* Футер сторінки */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '24px',
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
