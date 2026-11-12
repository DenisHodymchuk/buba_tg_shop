"use client";
import React from 'react';
import Link from 'next/link';
import StoreShell from '@/components/StoreShell';
import { AdvantagesAndDelivery } from '@/components/StoreSections';
import { Truck, ArrowRight } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <StoreShell>
      {({ isMobile }) => (
        <>
          <section style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: isMobile ? '16px 12px 0' : '26px 20px 0'
          }}>
            <div style={{
              background: '#181B22',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: isMobile ? '18px 16px' : '26px 30px',
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
                  color: '#93A2FA',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6
                }}>
                  <Truck size={13} />
                  <span>Умови сервісу</span>
                </div>
                <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#F3F4F8', margin: 0, letterSpacing: '-0.02em' }}>
                  Доставка, оплата та гарантія якості
                </h1>
                <p style={{ fontSize: 13.5, color: '#8D93A5', margin: '6px 0 0', maxWidth: 620 }}>
                  Відправляємо Новою Поштою по всій Україні за 1–2 робочі дні. Оплачуйте онлайн карткою або при отриманні.
                </p>
              </div>

              <Link
                href="/catalog"
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 10,
                  background: '#93A2FA',
                  color: '#13151B',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>До каталогу</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <AdvantagesAndDelivery isMobile={isMobile} />
        </>
      )}
    </StoreShell>
  );
}
