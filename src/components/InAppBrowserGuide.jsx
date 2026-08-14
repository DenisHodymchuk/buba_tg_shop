"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';

export default function InAppBrowserGuide() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [browserName, setBrowserName] = useState('TikTok');
  const [dismissed, setDismissed] = useState(false);
  const [activeVariant, setActiveVariant] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const paramVariant = parseInt(urlParams.get('v') || urlParams.get('variant') || '1');
    const forceInApp = urlParams.get('inapp') === 'true' || urlParams.get('test_inapp') === '1' || urlParams.has('v');

    if (paramVariant >= 1 && paramVariant <= 4) {
      setActiveVariant(paramVariant);
    }

    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isTikTok = /TikTok|musically|ByteLocale|BytedanceWebview/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isTelegram = /Telegram/i.test(ua);
    const isFB = /FBAN|FBAV/i.test(ua);

    if (isTikTok || isInstagram || isTelegram || isFB || forceInApp) {
      setIsInAppBrowser(true);
      if (isTikTok) setBrowserName('TikTok');
      else if (isInstagram) setBrowserName('Instagram');
      else if (isTelegram) setBrowserName('Telegram');
      else if (isFB) setBrowserName('Facebook');
      else setBrowserName('TikTok');
    }
  }, []);

  if (!isInAppBrowser || dismissed) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '20px', zIndex: 60 }}>
      
      {/* ПЕРЕМИКАЧ ВАРІАНТІВ ДЛЯ ТЕСТУВАННЯ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        gap: '6px',
        marginBottom: '10px',
        padding: '6px 12px',
        background: 'rgba(15, 15, 30, 0.8)',
        borderRadius: '100px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        width: 'fit-content',
        margin: '0 auto 12px'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
          Оберіть варіант дизайну:
        </span>
        {[1, 2, 3, 4].map(v => (
          <button
            key={v}
            onClick={() => setActiveVariant(v)}
            style={{
              padding: '2px 10px',
              borderRadius: '100px',
              border: activeVariant === v ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
              background: activeVariant === v ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            #{v}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ======================================================== */}
        {/* ВАРІАНТ 1: Ультра-стильний матовий тост із золотим чипом */}
        {/* ======================================================== */}
        {activeVariant === 1 && (
          <motion.div
            key="v1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(22, 18, 48, 0.95), rgba(35, 20, 65, 0.95))',
              borderRadius: '20px',
              padding: '14px 16px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 10px 35px rgba(124, 58, 237, 0.35)',
              position: 'relative',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '16px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#0f172a', fontWeight: 900, fontSize: '10px',
              padding: '2px 9px', borderRadius: '100px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <span>Натисніть ⋯ зверху</span>
              <ArrowUpRight size={12} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0
              }}>
                <Compass size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                  Браузер {browserName} блокує переходи?
                </div>
                <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px', lineHeight: 1.3 }}>
                  Натисніть <strong style={{ color: '#fef08a' }}>`⋯` (3 крапки)</strong> у кутку ➔ <strong style={{ color: '#fff' }}>"Відкрити в браузері"</strong>
                </div>
              </div>

              <button
                onClick={() => setDismissed(true)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* ВАРІАНТ 2: Темний киберпанк із яскравою фіолетовою рамкою */}
        {/* ======================================================== */}
        {activeVariant === 2 && (
          <motion.div
            key="v2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              width: '100%',
              background: '#0d0d1e',
              borderRadius: '20px',
              padding: '16px',
              border: '1.5px solid #8b5cf6',
              boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                    💡 Порада для відкриття додатка
                  </span>
                  <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  У {browserName} натисніть верхнє меню <strong>`⋮` / `⋯`</strong> та виберіть <strong>"Відкрити у браузері"</strong> для миттєвого переходу в Telegram.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* ВАРІАНТ 3: Помаранчево-жовта попереджувальна картка */}
        {/* ======================================================== */}
        {activeVariant === 3 && (
          <motion.div
            key="v3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))',
              borderRadius: '20px',
              padding: '14px 16px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fef08a' }}>
                  Помилка при переході? Відкрийте через <strong>`⋯` у браузері</strong>!
                </div>
              </div>
              <button onClick={() => setDismissed(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* ВАРІАНТ 4: Нижній плаваючий банер-шторка (Bottom Sheet) */}
        {/* ======================================================== */}
        {activeVariant === 4 && (
          <motion.div
            key="v4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)', maxWidth: '440px',
              background: 'rgba(15, 15, 30, 0.95)',
              borderRadius: '22px',
              padding: '16px 20px',
              border: '1px solid rgba(124, 58, 237, 0.5)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(20px)',
              zIndex: 99999
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡 Перехід з {browserName}</span>
              </div>
              <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: 1.4 }}>
              Якщо TikTok не відкриває посилання: натисніть <strong>`⋯` зверху ➔ "Відкрити в браузері"</strong>.
            </p>
            <button
              onClick={() => setDismissed(true)}
              style={{ width: '100%', padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            >
              Зрозуміло!
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
