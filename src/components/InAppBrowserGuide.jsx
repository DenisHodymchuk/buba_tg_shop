"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, Copy, Check, ExternalLink, ArrowUpRight, Sparkles } from 'lucide-react';

export default function InAppBrowserGuide({ onLinkClick }) {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [browserName, setBrowserName] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [selectedLinkModal, setSelectedLinkModal] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isTikTok = /TikTok|musically|ByteLocale|BytedanceWebview/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isTelegram = /Telegram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);
    
    // Перевірка на тестовий параметр у посиланні (?inapp=true)
    const urlParams = new URLSearchParams(window.location.search);
    const forceInApp = urlParams.get('inapp') === 'true' || urlParams.get('test_inapp') === '1';

    if (isTikTok || isInstagram || isTelegram || isFB || forceInApp) {
      setIsInAppBrowser(true);
      if (isTikTok) setBrowserName('TikTok');
      else if (isInstagram) setBrowserName('Instagram');
      else if (isTelegram) setBrowserName('Telegram');
      else if (isFB) setBrowserName('Facebook');
      else setBrowserName('додатку');
    }
  }, []);

  const handleCopy = (url) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isInAppBrowser) return null;

  return (
    <>
      {/* Верхній неоновий банер підказки */}
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(236, 72, 153, 0.95))',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '16px',
              marginBottom: '20px',
              boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              position: 'relative',
              backdropFilter: 'blur(12px)',
              zIndex: 50
            }}
          >
            {/* Анімована вказуюча стрілочка вгору-праворуч */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '16px',
              background: '#fbbf24',
              color: '#000',
              fontWeight: 900,
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)',
              animation: 'bounce 2s infinite'
            }}>
              <span>Натисніть ⋯ зверху</span>
              <ArrowUpRight size={14} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px'
                }}>
                  <Compass size={20} style={{ color: '#fff' }} />
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1.3 }}>
                    Ви відкрили посилання у {browserName}!
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '2px', lineHeight: 1.4 }}>
                    Щоб посилання Telegram/TikTok відкривалися без помилок: натисніть <strong>`⋯` (3 крапки)</strong> зверху ➔ <strong>"Відкрити в браузері"</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDismissed(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Закрити підказку"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
