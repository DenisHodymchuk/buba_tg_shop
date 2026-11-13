"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Truck, ShieldCheck, Layers, CreditCard,
  Award, Clock, ChevronDown, Box, CheckCircle2, MessageSquare, ShoppingBag, Plus, Globe, Gift
} from 'lucide-react';

const FAQ_ITEMS = [
  // {
  //   q: 'Скільки часу займає виготовлення та відправка?',
  //   a: 'Готові вироби зі складу відправляємо протягом 1 робочого дня. Якщо модель друкується під замовлення (або в потрібному кольорі), виготовлення займає 1–2 робочі дні.'
  // },
  {
    q: 'Які матеріали ви використовуєте і чи вони безпечні?',
    a: 'Основний матеріал — сертифікований еко-пластик PLA (на основі кукурудзяного крохмалю, без запаху, безпечний для дітей та інтер’єру) та міцний PETG для функціональних підставок і деталей.'
  },
  // {
  //   q: 'Чи можна замовити 3D-друк за власним фото, ескізом або STL-файлом?',
  //   a: 'Так! Натисніть «Індивідуальний 3D-друк», прикріпіть фото, креслення або 3D-модель — ми безкоштовно прорахуємо вартість і терміни виготовлення.'
  // },
  {
    q: 'Як здійснюється доставка та оплата?',
    a: 'Відправляємо Новою Поштою та Укрпоштою по всій Україні (за тарифами перевізника). Для замовлень на суму понад 3 000 ₴ доставка по Україні — безкоштовна! Також доставляємо за кордон Новою Поштою та Укрпоштою. Оплатити можна онлайн карткою або при отриманні.'
  },
  {
    q: 'Як працюють бонуси ANDE3D STORE?',
    a: 'Після кожного замовлення на ваш акаунт нараховуються бонуси, якими можна частково або повністю оплачувати наступні покупки в майстерні.'
  }
];

export function StoreHero({ isMobile, featuredProducts = [], onProductClick, addToCart }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = featuredProducts.slice(0, 3);
  const current = slides[activeSlide] || null;

  const finalPrice = current
    ? Math.round(current.price * (1 - (current.discount || 0) / 100))
    : null;

  return (
    <section style={{
      maxWidth: 1360,
      margin: '0 auto',
      width: '100%',
      padding: isMobile ? '14px 12px 6px' : '26px 20px 10px'
    }}>
      <div style={{
        background: '#181B22',
        borderRadius: isMobile ? 18 : 22,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 44px rgba(0, 0, 0, 0.32)',
        padding: isMobile ? '18px 16px' : '34px 38px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(0, 0.88fr)',
        gap: isMobile ? 20 : 34,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Column: Copy + CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(147, 162, 250, 0.14)',
              color: '#93A2FA',
              border: '1px solid rgba(147, 162, 250, 0.32)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#93A2FA' }} />
              <span>Власна 3D-майстерня в Україні</span>
            </span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 25 : 38,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: '#F3F4F8',
            margin: 0
          }}>
            Авторські 3D-вироби, фігурки та декор з характером
          </h1>

          <p style={{
            fontSize: isMobile ? 13.5 : 15,
            lineHeight: 1.55,
            color: '#B8BDCB',
            margin: 0,
            maxWidth: 560
          }}>
            Колекційні фігурки, підставки, рухомі антистреси та індивідуальний 3D-друк із безпечних PLA/PETG-пластиків. Відправляємо Новою Поштою та Укрпоштою за 1–2 дні.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 2 }}>
            <Link
              href="/catalog"
              style={{
                height: isMobile ? 42 : 46,
                padding: '0 20px',
                borderRadius: 11,
                background: '#93A2FA',
                color: '#13151B',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
            >
              <ShoppingBag size={16} />
              <span>Переглянути каталог</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/custom-modeling"
              style={{
                height: isMobile ? 42 : 46,
                padding: '0 18px',
                borderRadius: 11,
                background: '#13151B',
                color: '#F3F4F8',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontWeight: 600,
                fontSize: 13.5,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                transition: 'border-color 0.15s ease, background-color 0.15s ease'
              }}
            >
              <Sparkles size={15} style={{ color: '#F4A97B' }} />
              <span>Індивідуальний 3D-друк</span>
            </Link>
          </div>

          {/* Trust Micro-Metrics */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 20,
            flexWrap: 'wrap',
            paddingTop: 6,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {[
              { icon: Truck, text: 'Відправка 1–2 дні', color: '#93A2FA' },
              { icon: ShieldCheck, text: 'Еко-пластик PLA / PETG', color: '#F4A97B' },
              { icon: CreditCard, text: 'Картка або післяплата', color: '#B8BDCB' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B8BDCB', fontWeight: 500 }}>
                  <Icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Featured Showcase */}
        <div style={{
          background: '#13151B',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: isMobile ? 12 : 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#F4A97B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F4A97B' }} />
              <span>{current ? 'Популярний вибір' : '3D-моделювання'}</span>
            </span>

            {slides.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Показати товар ${idx + 1}`}
                    style={{
                      width: activeSlide === idx ? 18 : 7,
                      height: 7,
                      borderRadius: 999,
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: activeSlide === idx ? '#93A2FA' : 'rgba(255, 255, 255, 0.16)',
                      transition: 'width 0.2s ease, background-color 0.2s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {current ? (
            <div
              onClick={() => onProductClick?.(current)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: isMobile ? 96 : 124,
                height: isMobile ? 96 : 124,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#181B22',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                flexShrink: 0
              }}>
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box size={28} style={{ color: '#8D93A5' }} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {current.category && (
                  <div style={{ fontSize: 11, color: '#8D93A5', fontWeight: 500 }}>{current.category}</div>
                )}
                <div style={{
                  fontSize: isMobile ? 14.5 : 16,
                  fontWeight: 700,
                  color: '#F3F4F8',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {current.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: Number(current.discount) > 0 ? '#F4A97B' : '#F3F4F8' }}>
                      {finalPrice} <span style={{ fontSize: 13, color: '#8D93A5', fontWeight: 500 }}>₴</span>
                    </span>
                    {Number(current.discount) > 0 && (
                      <span style={{ fontSize: 12, color: '#8D93A5', textDecoration: 'line-through' }}>
                        {current.price} ₴
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); addToCart?.(current); }}
                    style={{
                      height: 32,
                      padding: '0 11px',
                      borderRadius: 9,
                      border: '1px solid rgba(147, 162, 250, 0.35)',
                      background: 'rgba(147, 162, 250, 0.14)',
                      color: '#93A2FA',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={14} />
                    <span>В кошик</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/custom-modeling" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="/images/custom-modeling.png"
                alt="3D Моделювання"
                style={{ width: 96, height: 96, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F8', marginBottom: 4 }}>
                  Друк за вашим ескізом
                </div>
                <div style={{ fontSize: 12.5, color: '#8D93A5' }}>
                  Надішліть фото або STL для швидкого прорахунку →
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function CustomPrintSection({ isMobile }) {
  return (
    <section
      id="custom-print"
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '12px 12px 0' : '20px 20px 0'
      }}
    >
      <div style={{
        background: '#181B22',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '18px 16px' : '26px 32px',
        border: '1px solid rgba(147, 162, 250, 0.2)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.3fr) auto',
        gap: isMobile ? 16 : 28,
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(147, 162, 250, 0.14)',
              color: '#93A2FA',
              border: '1px solid rgba(147, 162, 250, 0.32)'
            }}>
              <Sparkles size={11} />
              <span>Індивідуальне замовлення</span>
            </span>
          </div>

          <h2 style={{
            fontSize: isMobile ? 20 : 25,
            fontWeight: 700,
            color: '#F3F4F8',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            3D-друк і моделювання будь-якої складності
          </h2>

          <p style={{ fontSize: 13.5, color: '#B8BDCB', lineHeight: 1.5, margin: 0, maxWidth: 640 }}>
            Потрібна унікальна фігурка, запчастина, корпус або подарунок за вашим фото чи кресленням? Підберемо матеріал, колір і розрахуємо вартість.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingTop: 4 }}>
            {[
              '1. Фото, ескіз або STL',
              '2. Швидкий прорахунок',
              '3. Друк і відправка'
            ].map((step, i) => (
              <span key={i} style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#F3F4F8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckCircle2 size={13} style={{ color: '#93A2FA' }} />
                <span>{step}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!isMobile && (
            <img
              src="/images/custom-modeling.png"
              alt="3D Моделювання"
              style={{
                width: 84,
                height: 84,
                borderRadius: 14,
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          )}
          <Link
            href="/custom-modeling"
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 11,
              background: '#93A2FA',
              color: '#13151B',
              fontWeight: 700,
              fontSize: 13.5,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <span>Замовити прорахунок</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AdvantagesAndDelivery({ isMobile }) {
  return (
    <section
      id="delivery"
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '16px 12px 0' : '24px 20px 0'
      }}
    >
        {/* Free shipping highlight banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(147, 162, 250, 0.14) 0%, rgba(244, 169, 123, 0.1) 100%)',
          border: '1px solid rgba(147, 162, 250, 0.28)',
          borderRadius: 16,
          padding: isMobile ? '14px 16px' : '16px 22px',
          marginBottom: isMobile ? 10 : 14,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(147, 162, 250, 0.18)',
              border: '1px solid rgba(147, 162, 250, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#93A2FA',
              flexShrink: 0
            }}>
              <Gift size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F8' }}>
                Безкоштовна доставка при замовленні понад 3 000 ₴
              </div>
              <div style={{ fontSize: 12.5, color: '#B8BDCB', marginTop: 2 }}>
                Оформлюйте замовлення на суму більше 3 000 ₴ — і доставку по Україні Новою Поштою або Укрпоштою оплачуємо ми.
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          gap: isMobile ? 10 : 14
        }}>
          <div style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 16,
            padding: isMobile ? 16 : 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={18} style={{ color: '#93A2FA' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F8', margin: 0 }}>Нова Пошта по Україні</h3>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#93A2FA', background: 'rgba(147, 162, 250, 0.12)', padding: '3px 8px', borderRadius: 999 }}>
                1–2 дні
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#B8BDCB', margin: 0 }}>
              Відправляємо у відділення, поштомати або кур’єром за адресою по всій Україні. Вартість доставки — за тарифами Нової Пошти (для замовлень понад 3 000 ₴ — безкоштовно).
            </p>
          </div>

          <div style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 16,
            padding: isMobile ? 16 : 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Box size={18} style={{ color: '#F4A97B' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F8', margin: 0 }}>Укрпошта по Україні</h3>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#F4A97B', background: 'rgba(244, 169, 123, 0.12)', padding: '3px 8px', borderRadius: 999 }}>
                Вигідний тариф
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#B8BDCB', margin: 0 }}>
              Доставка у будь-яке відділення Укрпошти по всій Україні, включно з невеликими містами та селами. Вартість — за тарифами Укрпошти (понад 3 000 ₴ — безкоштовно).
            </p>
          </div>

          <div style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 16,
            padding: isMobile ? 16 : 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={18} style={{ color: '#93A2FA' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F8', margin: 0 }}>Доставка за кордон</h3>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#93A2FA', background: 'rgba(147, 162, 250, 0.12)', padding: '3px 8px', borderRadius: 999 }}>
                Worldwide
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#B8BDCB', margin: 0 }}>
              Відправляємо замовлення за кордон через Укрпошту та Нову Пошту (Nova Post). Надійно пакуємо кожен 3D-виріб для безпечного міжнародного перевезення за тарифами перевізника.
            </p>
          </div>

          <div style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 16,
            padding: isMobile ? 16 : 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={18} style={{ color: '#F4A97B' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F8', margin: 0 }}>Зручна оплата</h3>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#B8BDCB', margin: 0 }}>
              Доступна оплата на картку Monobank, оплата при отриманні (післяплата), а також списання накопичених бонусів ANDE3D STORE.
            </p>
          </div>
        </div>
      </section>
  );
}

export function StoreFAQ({ isMobile }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '28px 12px 12px' : '42px 20px 16px'
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#F4A97B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
          Часті запитання
        </div>
        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#F3F4F8', margin: 0, letterSpacing: '-0.02em' }}>
          Корисно знати перед замовленням
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                background: '#181B22',
                border: isOpen ? '1px solid rgba(147, 162, 250, 0.35)' : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'border-color 0.16s ease'
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: isMobile ? '14px 14px' : '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#F3F4F8',
                  fontSize: isMobile ? 13.5 : 14.5,
                  fontWeight: 600
                }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={17}
                  style={{
                    color: isOpen ? '#93A2FA' : '#8D93A5',
                    flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease, color 0.2s ease'
                  }}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: isMobile ? '0 14px 14px' : '0 20px 16px',
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: '#B8BDCB'
                    }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function StoreFooter({ isMobile, onOpenReviews }) {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
      background: '#111319',
      marginTop: 40,
      flexShrink: 0
    }}>
      <div style={{
        maxWidth: 1360,
        margin: '0 auto',
        padding: isMobile ? '28px 14px 90px' : '40px 20px 32px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr',
        gap: isMobile ? 22 : 36
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(147, 162, 250, 0.14)',
              border: '1px solid rgba(147, 162, 250, 0.32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#93A2FA'
            }}>
              <Box size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F8' }}>ANDE3D STORE</div>
              <div style={{ fontSize: 11, color: '#8D93A5' }}>Майстерня 3D-виробів</div>
            </div>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#8D93A5', margin: 0, maxWidth: 340 }}>
            Власне виробництво 3D-друкованих фігурок, декору, аксесуарів та індивідуальних моделей з доставкою по всій Україні.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F3F4F8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
            Навігація
          </div>
          {[
            { href: '/', label: 'Головна' },
            { href: '/hits', label: 'Хіти продажів' },
            { href: '/catalog', label: 'Каталог виробів' }
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: '#8D93A5', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F3F4F8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
            Сервіс
          </div>
          <Link href="/delivery" style={{ fontSize: 13, color: '#8D93A5', textDecoration: 'none' }}>
            Доставка та оплата
          </Link>
          <Link href="/faq" style={{ fontSize: 13, color: '#8D93A5', textDecoration: 'none' }}>
            Часті запитання
          </Link>
          {/* Тимчасово вимкнено особистий кабінет */}
          {false && (
            <Link href="/profile" style={{ fontSize: 13, color: '#8D93A5', textDecoration: 'none' }}>
              Особистий кабінет та бонуси
            </Link>
          )}
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '16px 20px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: 11.5, color: '#8D93A5', fontWeight: 500, margin: 0 }}>
          © 2026 ANDE3D STORE · Майстерня 3D виробів · Усі права захищено
        </p>
      </div>
    </footer>
  );
}
