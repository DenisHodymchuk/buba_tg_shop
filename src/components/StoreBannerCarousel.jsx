"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FALLBACK_BANNERS = [
  {
    id: 'default-1',
    title: 'КОЛЕКЦІЯ',
    accent_title: '3D',
    subtitle: 'Маленькі світи та фігурки з великим характером',
    button_text: 'Дивитися колекцію',
    image_url: '/images/custom-modeling.png',
    action_type: 'url',
    product_ids: [],
    category: '',
    url: '/catalog',
    is_active: true
  }
];

export default function StoreBannerCarousel({ isMobile, products = [], onProductClick }) {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function loadBanners() {
      if (!supabase) {
        setBanners(FALLBACK_BANNERS);
        setLoaded(true);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'store_banners')
          .single();

        if (!error && data && Array.isArray(data.value)) {
          setBanners(data.value.filter(b => b && b.is_active !== false));
        } else {
          setBanners(FALLBACK_BANNERS);
        }
      } catch {
        setBanners(FALLBACK_BANNERS);
      }
      setLoaded(true);
    }
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length, isHovered]);

  useEffect(() => {
    if (currentIndex >= banners.length && banners.length > 0) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  if (!loaded || banners.length === 0) return null;

  const activeBanner = banners[currentIndex] || banners[0];
  const fullTitle = [activeBanner.title, activeBanner.accent_title].filter(Boolean).join(' ');
  const hasOverlayText = Boolean(
    activeBanner.title?.trim() ||
    activeBanner.accent_title?.trim() ||
    activeBanner.subtitle?.trim()
  );

  const handleBannerAction = async () => {
    const type = activeBanner.action_type || 'url';

    if (type === 'products' && Array.isArray(activeBanner.product_ids) && activeBanner.product_ids.length > 0) {
      if (activeBanner.product_ids.length === 1) {
        const targetId = String(activeBanner.product_ids[0]);
        let found = products.find(p => String(p.id) === targetId);
        if (!found && supabase) {
          const { data } = await supabase.from('products').select('*').eq('id', targetId).single();
          if (data) found = data;
        }
        if (found && onProductClick) {
          onProductClick(found);
          return;
        }
      }
      const idsParam = activeBanner.product_ids.map(String).join(',');
      router.push(`/catalog?ids=${encodeURIComponent(idsParam)}&bannerTitle=${encodeURIComponent(fullTitle || 'Підбірка')}`);
      return;
    }

    if (type === 'category' && activeBanner.category) {
      router.push(`/catalog?category=${encodeURIComponent(activeBanner.category)}`);
      return;
    }

    const targetUrl = activeBanner.url || '/catalog';
    if (/^https?:\/\//i.test(targetUrl)) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <section
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '12px 12px 2px' : '20px 20px 6px'
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleBannerAction}
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? (hasOverlayText ? 200 : 'auto') : 320,
          borderRadius: isMobile ? 16 : 22,
          overflow: 'hidden',
          background: '#181B22',
          border: isHovered && !isMobile
            ? '1px solid rgba(147, 162, 250, 0.42)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isHovered && !isMobile
            ? '0 22px 52px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 16px 40px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          transform: isHovered && !isMobile ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.24s ease',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id || currentIndex}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.35 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={isMobile && !hasOverlayText ? { position: 'relative', width: '100%' } : { position: 'absolute', inset: 0 }}
          >
            {activeBanner.image_url && (
              <img
                src={activeBanner.image_url}
                alt={fullTitle || 'Банер магазину'}
                style={isMobile && !hasOverlayText
                  ? {
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }
                  : {
                      position: hasOverlayText ? 'absolute' : 'relative',
                      inset: hasOverlayText ? 0 : 'auto',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      transform: isHovered && !isMobile ? 'scale(1.015)' : 'scale(1)',
                      transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
              />
            )}

            {/* Left Content */}
            {hasOverlayText && (
            <div style={{
              position: 'relative',
              zIndex: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: isMobile ? '18px 40px 26px 42px' : '28px 64px',
              maxWidth: isMobile ? '88%' : '56%',
              gap: isMobile ? 8 : 12
            }}>
              {(activeBanner.title || activeBanner.accent_title) && (
                <h2 style={{
                  fontSize: isMobile ? 24 : 44,
                  fontWeight: 800,
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                  color: '#F3F4F8',
                  margin: 0,
                  textTransform: 'uppercase'
                }}>
                  {activeBanner.title}{' '}
                  {activeBanner.accent_title && (
                    <span style={{ color: '#93A2FA' }}>{activeBanner.accent_title}</span>
                  )}
                </h2>
              )}

              {activeBanner.subtitle && (
                <p style={{
                  fontSize: isMobile ? 13 : 17,
                  lineHeight: 1.38,
                  color: '#D4D8E3',
                  margin: 0,
                  fontWeight: 500,
                  maxWidth: 420
                }}>
                  {activeBanner.subtitle}
                </p>
              )}

              {activeBanner.button_text && (
                <div style={{ paddingTop: isMobile ? 4 : 6 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: isMobile ? 36 : 44,
                    padding: isMobile ? '0 16px' : '0 22px',
                    borderRadius: 999,
                    background: '#93A2FA',
                    color: '#13151B',
                    fontSize: isMobile ? 12.5 : 14,
                    fontWeight: 700,
                    boxShadow: '0 8px 20px rgba(147, 162, 250, 0.28)'
                  }}>
                    <span>{activeBanner.button_text}</span>
                    <ArrowRight size={isMobile ? 14 : 16} />
                  </span>
                </div>
              )}
            </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Left / Right Arrows */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Попередній банер"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
              }}
              style={{
                position: 'absolute',
                left: isMobile ? 8 : 14,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 4,
                width: isMobile ? 28 : 36,
                height: isMobile ? 28 : 36,
                borderRadius: '50%',
                background: 'rgba(19, 21, 27, 0.65)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#F3F4F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={isMobile ? 16 : 19} />
            </button>

            <button
              type="button"
              aria-label="Наступний банер"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(prev => (prev + 1) % banners.length);
              }}
              style={{
                position: 'absolute',
                right: isMobile ? 8 : 14,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 4,
                width: isMobile ? 28 : 36,
                height: isMobile ? 28 : 36,
                borderRadius: '50%',
                background: 'rgba(19, 21, 27, 0.65)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#F3F4F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={isMobile ? 16 : 19} />
            </button>

            {/* Pagination Dots */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: isMobile ? 10 : 14,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(19, 21, 27, 0.55)',
                backdropFilter: 'blur(6px)'
              }}
            >
              {banners.map((b, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={b.id || idx}
                    type="button"
                    aria-label={`Слайд ${idx + 1}`}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: active ? 18 : 7,
                      height: 7,
                      borderRadius: 999,
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: active ? '#93A2FA' : 'rgba(255, 255, 255, 0.45)',
                      transition: 'width 0.2s ease, background-color 0.2s ease'
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
