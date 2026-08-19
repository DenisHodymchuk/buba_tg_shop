"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Sparkles, 
  Send, 
  ChevronDown,
  Palette,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function SmartKeyholderClient() {
  const [openFaq, setOpenFaq] = useState(null);
  const telegramManagerUrl = "https://t.me/buba_lab_manager";

  const models = [
    {
      id: 'deer',
      title: 'Олені на Заході Сонця',
      subtitle: 'Тепле контурне світло вечірнього сонця у гірському лісі',
      img: '/images/smart-keyholder/deer-sunset-lamp.jpg',
      badge: '🔥 В НАЯВНОСТІ',
      price: '1 200 грн',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницю-світильник "Олені на Заході Сонця" за 1200 грн.')
    },
    {
      id: 'lake',
      title: 'Нічне Озеро та Вірний Друг',
      subtitle: 'Атмосферний зоряний пейзаж людини з собакою на березі',
      img: '/images/smart-keyholder/man-dog-lake-lamp.jpg',
      badge: '✨ В НАЯВНОСТІ',
      price: '1 200 грн',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницю-світильник "Нічне Озеро та Вірний Друг" за 1200 грн.')
    }
  ];

  const faqs = [
    {
      q: "Як ключниця кріпиться до стіни?",
      a: "У комплекті додається надійне кріплення (двосторонній преміум-скотч або монтажні отвори), завдяки чому її можна легко закріпити без свердління за кілька секунд."
    },
    {
      q: "Скільки часу працює від одного заряду?",
      a: "Завдяки оригінальному акумулятору Samsung 3000 мА·год та енергоефективним світлодіодам світильник працює від 7 до 14 днів (залежно від частоти спрацьовування датчика руху)."
    },
    {
      q: "Як відбувається підзарядка?",
      a: "Світильник оснащений роз'ємом Type-C. Ви можете зарядити його від будь-якого блоку живлення телефону або від павербанка за 1.5 години."
    },
    {
      q: "Як створити свій індивідуальний дизайн?",
      a: "Натисніть кнопку 'Обговорити свій дизайн'. Ви можете надіслати фото, картинку чи просто описати вашу ідею. Ми розробимо 3D-макет та узгодимо вартість і терміни."
    },
    {
      q: "Чи безпечно залишати у коридорі?",
      a: "Абсолютно. Пристрій має вбудовану систему захисту від короткого замикання, перенапруги та контролер пожежної безпеки промислового стандарту."
    },
    {
      q: "Як оформити замовлення та яка доставка?",
      a: "Натисніть кнопку замовлення у Telegram. Менеджер уточнить модель, адресу та відправить замовлення Новою Поштою (є післяплата або оплата на картку)."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#030712', 
      color: '#f9fafb', 
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
      paddingBottom: '90px'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 20px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ 
            display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', textDecoration: 'none',
            fontSize: 13, fontWeight: 700, transition: 'color 0.2s'
          }}>
            <ChevronLeft size={18} /> НАЗАД В МАГАЗИН
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'linear-gradient(135deg, #f97316, #eab308)',
              color: '#000',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.05em'
            }}>
              BUBA LIGHT 💡
            </span>

            <a 
              href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Цікавить розумна ключниця-світильник.')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Send size={14} /> Telegram
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '48px 20px 40px', overflow: 'hidden' }}>
        {/* Glow background */}
        <div style={{ 
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.18) 0%, rgba(234, 179, 8, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: '#fb923c',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              <Sparkles size={14} /> ТЕПЛЕ СВІТЛО ТА ПОРЯДОК У КОРИДОРІ
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(32px, 5.5vw, 60px)', 
            fontWeight: 950, 
            textAlign: 'center',
            lineHeight: 1.1,
            margin: '0 0 16px',
            background: 'linear-gradient(180deg, #ffffff 30%, #fdba74 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Розумна Ключниця-Світильник<br />З Датчиком Руху
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#d1d5db',
            textAlign: 'center',
            maxWidth: 720,
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            Світло там, де воно дійсно потрібне. Більше жодної темряви у коридорі — м'яке контурне підсвічування автоматично спалахує при вашій появі та береже ваш час.
          </p>

          {/* Product Cards Grid (Standard 1200 UAH models + Custom order card) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 28,
            marginTop: 20
          }}>
            {/* Standard Models */}
            {models.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '28px',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                {/* Image Container */}
                <div style={{ position: 'relative', aspectRatio: '4/4.5', overflow: 'hidden', background: '#090d16' }}>
                  <img
                    src={m.img}
                    alt={m.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    background: 'rgba(3, 7, 18, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fb923c'
                  }}>
                    {m.badge}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                      {m.title}
                    </h3>
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px', lineHeight: 1.5 }}>
                      {m.subtitle}
                    </p>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: 8, 
                      marginBottom: 20,
                      background: 'rgba(249, 115, 22, 0.1)',
                      padding: '10px 16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(249, 115, 22, 0.2)'
                    }}>
                      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>ЦІНА:</span>
                      <span style={{ fontSize: 24, fontWeight: 950, color: '#f97316' }}>{m.price}</span>
                    </div>
                  </div>

                  <a
                    href={`${telegramManagerUrl}?text=${m.tgText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      padding: '14px 20px',
                      borderRadius: '18px',
                      fontSize: 15,
                      fontWeight: 900,
                      textDecoration: 'none',
                      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)',
                      transition: 'transform 0.2s, boxShadow 0.2s'
                    }}
                  >
                    <Send size={16} />
                    <span>ЗАМОВИТИ ЗА {m.price}</span>
                  </a>
                </div>
              </div>
            ))}

            {/* Custom Unique Design Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                borderRadius: '28px',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.15)',
                backdropFilter: 'blur(12px)',
                position: 'relative'
              }}
            >
              {/* Custom Image Banner */}
              <div style={{ 
                position: 'relative', 
                aspectRatio: '4/4.5', 
                overflow: 'hidden', 
                background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '24px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Palette size={36} className="text-purple-400" style={{ color: '#c084fc' }} />
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                  Індивідуальний 3D-Дизайн
                </h4>
                <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                  Створимо унікальний силует чи малюнок за вашим фото, логотипом або побажанням
                </p>
                <div style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  background: 'rgba(168, 85, 247, 0.25)',
                  backdropFilter: 'blur(8px)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#e9d5ff'
                }}>
                  🎨 НА ЗАМОВЛЕННЯ
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                    Свій власний малюнок
                  </h3>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Будь-який сюжет: тварини, авто, портрет, емблема чи напис
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'baseline', 
                    gap: 8, 
                    marginBottom: 20,
                    background: 'rgba(168, 85, 247, 0.1)',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.25)'
                  }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>ЦІНА:</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#c084fc' }}>Обговорюється індивідуально</span>
                  </div>
                </div>

                <a
                  href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Хочу розробити індивідуальний дизайн розумної ключниці.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                    color: '#ffffff',
                    padding: '14px 20px',
                    borderRadius: '18px',
                    fontSize: 15,
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px rgba(147, 51, 234, 0.35)',
                    transition: 'transform 0.2s, boxShadow 0.2s'
                  }}
                >
                  <Send size={16} />
                  <span>ОБГОВОРИТИ ДИЗАЙН ✈️</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Technical Specifications Section */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '36px 28px',
          backdropFilter: 'blur(16px)'
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
            📋 Технічні характеристики
          </h2>
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, margin: '0 0 24px' }}>
            Всі ключниці оснащені надійною преміальною електронікою:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {[
              { label: "Датчик руху", val: "Інфрачервоний (радіус 2-3м, 20с таймер)" },
              { label: "Акумулятор", val: "Samsung 3000 мА·год (до 7 днів роботи)" },
              { label: "Роз'єм живлення", val: "Сучасний роз'єм Type-C (5V)" },
              { label: "Пожежна безпека", val: "Захист від замикань промислового стандарту" },
              { label: "Авторський вигляд", val: "Високоточний 3D-друк з PETG пластику" },
              { label: "Гачки для ключів", val: "5 надійних інтегрованих гачків" },
              { label: "Монтаж", val: "Швидке та просте кріплення на стіну у комплекті" },
              { label: "Гарантія", val: "12 місяців на електроніку та батарею" }
            ].map((spec, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {spec.label}
                </span>
                <strong style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 700 }}>
                  {spec.val}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Order Steps */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 900, color: '#fff' }}>
            Простий процес замовлення
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20
        }}>
          {[
            { step: "01", title: "Перехід в Telegram", desc: "Натискаєте кнопку замовлення — відкривається чат з менеджером." },
            { step: "02", title: "Уточнення деталей", desc: "Обираєте готову модель за 1200 грн або надсилаєте свій малюнок." },
            { step: "03", title: "Швидка доставка", desc: "Відправляємо Новою Поштою. Оплата при отриманні або на картку." }
          ].map((s, idx) => (
            <div key={idx} style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <div style={{ fontSize: 36, fontWeight: 950, color: '#f97316', opacity: 0.8, marginBottom: 12 }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 900, color: '#fff' }}>
            Часті запитання (FAQ)
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <span>{faq.q}</span>
                <ChevronDown 
                  size={20} 
                  style={{ 
                    transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: '#f97316',
                    flexShrink: 0
                  }} 
                />
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ padding: '0 24px 20px', color: '#9ca3af', fontSize: 14, lineHeight: 1.7 }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
          borderRadius: '36px',
          padding: '48px 24px',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          boxShadow: '0 20px 50px rgba(249, 115, 22, 0.15)'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 950, color: '#fff', margin: '0 0 16px' }}>
            Бажаєте замовити чи маєте питання?
          </h2>
          <p style={{ fontSize: 16, color: '#d1d5db', maxWidth: 600, margin: '0 auto 32px' }}>
            Напишіть нам у Telegram — менеджер відповість за кілька хвилин!
          </p>

          <a
            href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Хочу замовити розумну ключницу-світильник.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              padding: '20px 40px',
              borderRadius: '24px',
              fontSize: 19,
              fontWeight: 900,
              textDecoration: 'none',
              boxShadow: '0 15px 35px rgba(249, 115, 22, 0.4)',
              transition: 'transform 0.2s'
            }}
          >
            <Send size={22} />
            <span>НАПИСАТИ В TELEGRAM</span>
          </a>
        </div>
      </section>

      {/* Floating Bottom Bar for Mobile */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '100vw'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>РОЗУМНА КЛЮЧНИЦЯ</span>
          <span style={{ fontSize: 14, color: '#f97316', fontWeight: 900 }}>1 200 грн</span>
        </div>

        <a
          href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Хочу замовити розумну ключницю-світильник.')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: '999px',
            fontSize: 14,
            fontWeight: 900,
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
          }}
        >
          <Send size={16} />
          <span>Замовити</span>
        </a>
      </div>
    </div>
  );
}
