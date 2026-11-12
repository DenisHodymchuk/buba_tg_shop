"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import StoreShell from '@/components/StoreShell';
import Storefront from '@/components/Storefront';
import { Flame, ArrowRight } from 'lucide-react';

export default function HitsPage() {
  return (
    <StoreShell>
      {({ cart, addToCart, searchQuery, setSelectedProduct, isMobile }) => (
        <>
          <section style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: isMobile ? '16px 12px 4px' : '26px 20px 8px'
          }}>
            <div style={{
              background: '#181B22',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: isMobile ? '18px 16px' : '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#F4A97B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6
                }}>
                  <Flame size={13} />
                  <span>Найпопулярніше в майстерні</span>
                </div>
                <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#F3F4F8', margin: 0, letterSpacing: '-0.02em' }}>
                  Хіти продажів BUBA Store
                </h1>
                <p style={{ fontSize: 13.5, color: '#8D93A5', margin: '6px 0 0' }}>
                  Моделі, які наші клієнти замовляють найчастіше. Швидка відправка Новою Поштою.
                </p>
              </div>

              <Link
                href="/catalog"
                style={{
                  height: 38,
                  padding: '0 15px',
                  borderRadius: 10,
                  border: '1px solid rgba(147, 162, 250, 0.35)',
                  background: 'rgba(147, 162, 250, 0.14)',
                  color: '#93A2FA',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>Весь каталог</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <Suspense fallback={null}>
            <Storefront
              addToCart={addToCart}
              searchQuery={searchQuery}
              onProductClick={setSelectedProduct}
              cart={cart}
              onlyTrending
            />
          </Suspense>
        </>
      )}
    </StoreShell>
  );
}
