"use client";
import React, { useState } from 'react';
import { ShoppingCart, Award, Search, Box, User, MessageSquare, Share2, X } from 'lucide-react';
import Link from 'next/link';

export default function Header({ cartCount, bonuses, onOpenCart, onOpenHistory, onOpenReviews, onSearch }) {
  const [localQuery, setLocalQuery] = useState('');

  const handleSearchChange = (val) => {
    setLocalQuery(val);
    onSearch?.(val);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(19, 21, 27, 0.86)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      width: '100%'
    }}>
      <div style={{
        maxWidth: 1360,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        gap: 16
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'rgba(147, 162, 250, 0.14)',
            border: '1px solid rgba(147, 162, 250, 0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#93A2FA'
          }}>
            <Box size={20} strokeWidth={2} />
          </div>
          <div className="hidden sm:block">
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#F3F4F8',
              letterSpacing: '-0.02em',
              lineHeight: 1.15
            }}>
              BUBA Store
            </div>
            <div style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: '#8D93A5',
              letterSpacing: '0.02em'
            }}>
              Майстерня 3D виробів
            </div>
          </div>
        </Link>

        {/* Desktop Centered Search Bar */}
        <div style={{ flex: 1, maxWidth: 460 }} className="hidden md:block">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: 13, color: '#8D93A5', pointerEvents: 'none' }} />
            <input
              type="text"
              value={localQuery}
              placeholder="Пошук моделі за назвою або категорією…"
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                background: '#181B22',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '0 34px 0 38px',
                fontSize: 13.5,
                color: '#F3F4F8',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#93A2FA';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(147, 162, 250, 0.16)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'transparent',
                  border: 'none',
                  color: '#8D93A5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Bonuses Pill */}
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <div
              title="Бонусний рахунок"
              style={{
                height: 38,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: '#181B22',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0 13px',
                borderRadius: 10,
                color: '#F3F4F8',
                fontSize: 13,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              <Award size={15} style={{ color: '#F4A97B', flexShrink: 0 }} />
              <span>{bonuses}</span>
            </div>
          </Link>

          {/* Social Links Hub */}
          <Link href="/links" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              title="Соцмережі та контакти"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#181B22',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B8BDCB',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Share2 size={16} />
            </button>
          </Link>

          {/* Reviews Button */}
          <button
            type="button"
            onClick={onOpenReviews}
            title="Відгуки покупців"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#181B22',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B8BDCB',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={16} />
          </button>

          {/* Profile Button */}
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              title="Особистий кабінет"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#181B22',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B8BDCB',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={16} />
            </button>
          </Link>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            title="Кошик"
            style={{
              height: 38,
              padding: cartCount > 0 ? '0 13px' : '0 11px',
              borderRadius: 10,
              border: cartCount > 0 ? '1px solid rgba(147, 162, 250, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: cartCount > 0 ? 'rgba(147, 162, 250, 0.14)' : '#181B22',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              color: cartCount > 0 ? '#93A2FA' : '#F3F4F8',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              fontSize: 13,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span style={{
                background: '#93A2FA',
                color: '#13151B',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: 11.5,
                fontWeight: 700,
                lineHeight: 1.3
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden" style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, color: '#8D93A5', pointerEvents: 'none' }} />
          <input
            type="text"
            value={localQuery}
            placeholder="Пошук виробів…"
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              background: '#181B22',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '0 32px 0 34px',
              fontSize: 13,
              color: '#F3F4F8',
              outline: 'none'
            }}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                background: 'transparent',
                border: 'none',
                color: '#8D93A5',
                cursor: 'pointer',
                padding: 2
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
