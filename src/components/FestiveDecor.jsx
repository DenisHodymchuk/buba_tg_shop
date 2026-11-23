"use client";
import React, { useEffect, useRef, useState } from 'react';

const SNOW_PREF_KEY = 'ande3d_festive_snow_v1';

export function FestiveSnowfall() {
  const canvasRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNOW_PREF_KEY);
      if (saved === 'off') setEnabled(false);
    } catch (_) {}
    setHydrated(true);
  }, []);

  const toggleSnow = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SNOW_PREF_KEY, next ? 'on' : 'off');
      } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = width < 720 ? 34 : 68;
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.1 + Math.random() * 2.5,
      speedY: 0.35 + Math.random() * 0.85,
      swayAmp: 0.3 + Math.random() * 0.7,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.015,
      opacity: 0.25 + Math.random() * 0.55,
      tint: Math.random() > 0.78 ? '#C7D2FE' : '#FFFFFF'
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.swayPhase += f.swaySpeed;
        f.y += f.speedY;
        f.x += Math.sin(f.swayPhase) * f.swayAmp;

        if (f.y > height + 8) {
          f.y = -8;
          f.x = Math.random() * width;
        }
        if (f.x > width + 8) f.x = -8;
        if (f.x < -8) f.x = width + 8;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.tint;
        ctx.globalAlpha = f.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, hydrated]);

  if (!hydrated) return null;

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 90
          }}
        />
      )}
      <button
        type="button"
        onClick={toggleSnow}
        title={enabled ? 'Вимкнути сніг' : 'Увімкнути сніг'}
        aria-label={enabled ? 'Вимкнути сніг' : 'Увімкнути сніг'}
        style={{
          position: 'fixed',
          left: 14,
          bottom: 14,
          zIndex: 95,
          width: 34,
          height: 34,
          borderRadius: 999,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: enabled ? 'rgba(147, 162, 250, 0.16)' : 'rgba(19, 21, 27, 0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: enabled ? '#E0E7FF' : '#8D93A5',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
          opacity: enabled ? 0.85 : 0.5,
          transition: 'opacity 0.2s, transform 0.2s'
        }}
      >
        ❄
      </button>
    </>
  );
}

const GARLAND_BULBS = [
  { x: 4, color: '#FDE68A', delay: '0s' },
  { x: 11, color: '#93A2FA', delay: '0.6s' },
  { x: 18, color: '#F87171', delay: '1.2s' },
  { x: 25, color: '#6EE7B7', delay: '0.3s' },
  { x: 32, color: '#FDE68A', delay: '1.5s' },
  { x: 39, color: '#93A2FA', delay: '0.9s' },
  { x: 46, color: '#F87171', delay: '0.2s' },
  { x: 53, color: '#6EE7B7', delay: '1.1s' },
  { x: 60, color: '#FDE68A', delay: '0.5s' },
  { x: 67, color: '#93A2FA', delay: '1.4s' },
  { x: 74, color: '#F87171', delay: '0.8s' },
  { x: 81, color: '#6EE7B7', delay: '0.1s' },
  { x: 88, color: '#FDE68A', delay: '1.3s' },
  { x: 95, color: '#93A2FA', delay: '0.4s' }
];

export function FestiveGarland() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -11,
        height: 14,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5
      }}
    >
      <style>{`
        @keyframes festiveTwinkle {
          0%, 100% { opacity: 0.45; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.12); }
        }
      `}</style>
      <svg
        viewBox="0 0 1000 18"
        preserveAspectRatio="none"
        style={{ width: '100%', height: 14, display: 'block', opacity: 0.35 }}
      >
        <path
          d="M0,1 Q62,12 125,2 T250,2 T375,2 T500,2 T625,2 T750,2 T875,2 T1000,2"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.2"
        />
      </svg>
      {GARLAND_BULBS.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: i % 2 === 0 ? 5 : 7,
            width: 5,
            height: 6,
            borderRadius: '50% 50% 60% 60%',
            background: b.color,
            boxShadow: `0 0 7px 1.5px ${b.color}`,
            animation: `festiveTwinkle 2.8s ease-in-out ${b.delay} infinite`
          }}
        />
      ))}
    </div>
  );
}

export function FestiveFooterTrees() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0,
        pointerEvents: 'none',
        marginTop: 12,
        position: 'relative'
      }}
    >
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="xMidYMax slice"
        style={{ width: '100%', height: 84, display: 'block' }}
      >
        <defs>
          <linearGradient id="snowHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E2436" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#13151B" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pineDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D403C" />
            <stop offset="100%" stopColor="#0F2326" />
          </linearGradient>
          <linearGradient id="pineMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24534D" />
            <stop offset="100%" stopColor="#122B2E" />
          </linearGradient>
        </defs>

        {/* Soft snow hills */}
        <path
          d="M0,92 Q220,66 460,84 T940,80 T1440,88 L1440,110 L0,110 Z"
          fill="url(#snowHill)"
        />
        <path
          d="M0,92 Q220,66 460,84 T940,80 T1440,88"
          fill="none"
          stroke="rgba(224, 231, 255, 0.22)"
          strokeWidth="2"
        />

        {/* Pine Trees Cluster Left */}
        <g transform="translate(80, 18)">
          <polygon points="28,0 6,34 50,34" fill="url(#pineMid)" />
          <polygon points="28,16 2,54 54,54" fill="url(#pineDark)" />
          <polygon points="28,34 -4,76 60,76" fill="url(#pineDark)" />
          {/* Snow cap */}
          <polygon points="28,0 18,15 24,13 28,17 33,13 38,15" fill="rgba(241,245,249,0.75)" />
          {/* Tiny ornaments */}
          <circle cx="22" cy="30" r="2.2" fill="#FDE68A" />
          <circle cx="35" cy="44" r="2.2" fill="#F87171" />
          <circle cx="18" cy="58" r="2.2" fill="#93A2FA" />
          <circle cx="38" cy="64" r="2.2" fill="#FDE68A" />
        </g>

        <g transform="translate(148, 38) scale(0.76)">
          <polygon points="26,0 6,32 46,32" fill="url(#pineMid)" />
          <polygon points="26,16 0,54 52,54" fill="url(#pineDark)" />
          <polygon points="26,0 17,14 26,16 35,14" fill="rgba(241,245,249,0.7)" />
          <circle cx="28" cy="36" r="2.4" fill="#93A2FA" />
          <circle cx="19" cy="45" r="2.2" fill="#FDE68A" />
        </g>

        {/* Subtle Center-Left Pine */}
        <g transform="translate(410, 42) scale(0.68)">
          <polygon points="26,0 6,32 46,32" fill="url(#pineMid)" />
          <polygon points="26,18 0,54 52,54" fill="url(#pineDark)" />
          <polygon points="26,0 18,13 26,15 34,13" fill="rgba(241,245,249,0.65)" />
          <circle cx="24" cy="34" r="2.2" fill="#FDE68A" />
        </g>

        {/* Subtle Center-Right Pine */}
        <g transform="translate(990, 38) scale(0.72)">
          <polygon points="26,0 6,32 46,32" fill="url(#pineMid)" />
          <polygon points="26,18 0,54 52,54" fill="url(#pineDark)" />
          <polygon points="26,0 18,13 26,15 34,13" fill="rgba(241,245,249,0.65)" />
          <circle cx="30" cy="35" r="2.2" fill="#F87171" />
          <circle cx="20" cy="44" r="2.2" fill="#FDE68A" />
        </g>

        {/* Pine Trees Cluster Right */}
        <g transform="translate(1250, 34) scale(0.8)">
          <polygon points="26,0 6,32 46,32" fill="url(#pineMid)" />
          <polygon points="26,16 0,54 52,54" fill="url(#pineDark)" />
          <polygon points="26,0 17,14 26,16 35,14" fill="rgba(241,245,249,0.7)" />
          <circle cx="24" cy="32" r="2.4" fill="#F87171" />
          <circle cx="32" cy="44" r="2.2" fill="#FDE68A" />
        </g>

        <g transform="translate(1310, 14)">
          <polygon points="28,0 6,34 50,34" fill="url(#pineMid)" />
          <polygon points="28,16 2,54 54,54" fill="url(#pineDark)" />
          <polygon points="28,34 -4,76 60,76" fill="url(#pineDark)" />
          <polygon points="28,0 18,15 24,13 28,17 33,13 38,15" fill="rgba(241,245,249,0.75)" />
          <circle cx="24" cy="28" r="2.2" fill="#93A2FA" />
          <circle cx="36" cy="42" r="2.2" fill="#FDE68A" />
          <circle cx="18" cy="56" r="2.2" fill="#F87171" />
          <circle cx="38" cy="64" r="2.2" fill="#6EE7B7" />
        </g>
      </svg>
    </div>
  );
}
