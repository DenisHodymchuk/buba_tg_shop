"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Sparkles, 
  Send, 
  ChevronDown,
  Palette,
  Zap,
  BatteryCharging,
  Usb,
  ShieldCheck,
  KeyRound,
  Layers,
  Award,
  Cpu
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
      badge: '🔥 В наявності',
      price: '1 200 грн',
      priceRaw: '1 200 грн',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницу-світильник "Олені на Заході Сонця" за 1200 грн.')
    },
    {
      id: 'lake',
      title: 'Нічне Озеро та Вірний Друг',
      subtitle: 'Атмосферний зоряний пейзаж людини з собакою на березі',
      img: '/images/smart-keyholder/man-dog-lake-lamp.jpg',
      badge: '✨ В наявності',
      price: '1 200 грн',
      priceRaw: '1 200 грн',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницу-світильник "Нічне Озеро та Вірний Друг" за 1200 грн.')
    }
  ];

  const specs = [
    {
      icon: <Zap size={22} style={{ color: '#f97316' }} />,
      label: "Датчик руху",
      val: "Інфрачервоний (радіус 2-3м, 20с таймер)",
      accent: "#f97316",
      bgGlow: "rgba(249, 115, 22, 0.08)",
      borderGlow: "rgba(249, 115, 22, 0.25)"
    },
    {
      icon: <BatteryCharging size={22} style={{ color: '#10b981' }} />,
      label: "Акумулятор Samsung",
      val: "3000 мА·год (до 7 днів роботи)",
      accent: "#10b981",
      bgGlow: "rgba(16, 185, 129, 0.08)",
      borderGlow: "rgba(16, 185, 129, 0.25)"
    },
    {
      icon: <Usb size={22} style={{ color: '#38bdf8' }} />,
      label: "Роз'єм живлення",
      val: "Сучасний роз'єм Type-C (5V)",
      accent: "#38bdf8",
      bgGlow: "rgba(56, 189, 248, 0.08)",
      borderGlow: "rgba(56, 189, 248, 0.25)"
    },
    {
      icon: <ShieldCheck size={22} style={{ color: '#ef4444' }} />,
      label: "Пожежна безпека",
      val: "Захист від замикань промислового стандарту",
      accent: "#ef4444",
      bgGlow: "rgba(239, 68, 68, 0.08)",
      borderGlow: "rgba(239, 68, 68, 0.25)"
    },
    {
      icon: <Sparkles size={22} style={{ color: '#c084fc' }} />,
      label: "Авторський вигляд",
      val: "Високоточний 3D-друк з PETG пластику",
      accent: "#c084fc",
      bgGlow: "rgba(192, 132, 252, 0.08)",
      borderGlow: "rgba(192, 132, 252, 0.25)"
    },
    {
      icon: <KeyRound size={22} style={{ color: '#eab308' }} />,
      label: "Гачки для ключів",
      val: "5 надійних інтегрованих гачків",
      accent: "#eab308",
      bgGlow: "rgba(234, 179, 8, 0.08)",
      borderGlow: "rgba(234, 179, 8, 0.25)"
    },
    {
      icon: <Layers size={22} style={{ color: '#60a5fa' }} />,
      label: "Монтаж на стіну",
      val: "Швидке та просте кріплення у комплекті",
      accent: "#60a5fa",
      bgGlow: "rgba(96, 165, 250, 0.08)",
      borderGlow: "rgba(96, 165, 250, 0.25)"
    },
    {
      icon: <Award size={22} style={{ color: '#f59e0b' }} />,
      label: "Гарантія якості",
      val: "12 місяців на електроніку та батарею",
      accent: "#f59e0b",
      bgGlow: "rgba(245, 158, 11, 0.08)",
      borderGlow: "rgba(245, 158, 11, 0.25)"
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
      a: "Натисніть кнопку замовлення у Telegram. Менеджер уточнить модель або малюнок, виставить рахунок за офіційними реквізитами (працюємо офіційно) та відправить замовлення Новою Поштою."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#030712', 
      color: '#f9fafb', 
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
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
            fontSize: 13, fontWeight: 700, transition: 'color 0.2s', letterSpacing: '-0.01em'
          }}>
            <ChevronLeft size={18} /> Назад в магазин
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'linear-gradient(135deg, #f97316, #eab308)',
              color: '#000',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '0.02em'
            }}>
              Buba Light 💡
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
                padding: '7px 16px',
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
      <section style={{ position: 'relative', padding: '52px 20px 44px', overflow: 'hidden' }}>
        {/* Glow background */}
        <div style={{ 
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.18) 0%, rgba(234, 179, 8, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
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
              fontWeight: 700,
              letterSpacing: '0.01em'
            }}>
              <Sparkles size={14} /> Тепле світло та порядок у коридорі
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(34px, 5.8vw, 62px)', 
            fontWeight: 800, 
            textAlign: 'center',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            margin: '0 0 18px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            background: 'linear-gradient(180deg, #ffffff 40%, #fdba74 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Розумна ключниця-світильник<br />з датчиком руху
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.1vw, 19px)',
            color: '#d1d5db',
            textAlign: 'center',
            maxWidth: 720,
            margin: '0 auto 44px',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Світло там, де воно дійсно потрібне. Більше жодної темряви у коридорі — м'яке контурне підсвічування автоматично спалахує при вашій появі та береже ваш час.
          </p>

          {/* Product Cards Grid: Perfectly aligned equal-height cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 28,
            marginTop: 20,
            alignItems: 'stretch'
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
                  height: '100%',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                {/* Image Container with Fixed Height */}
                <div style={{ position: 'relative', height: '280px', width: '100%', overflow: 'hidden', background: '#090d16' }}>
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
                    fontWeight: 700,
                    color: '#fb923c'
                  }}>
                    {m.badge}
                  </div>
                </div>

                {/* Content Container (flexGrow: 1 to fill height) */}
                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Title (fixed minHeight for 2-line alignment) */}
                  <div style={{ minHeight: '58px', display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ 
                      fontSize: 21, 
                      fontWeight: 800, 
                      color: '#fff', 
                      margin: 0, 
                      lineHeight: 1.25,
                      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '-0.01em'
                    }}>
                      {m.title}
                    </h3>
                  </div>

                  {/* Subtitle (fixed minHeight) */}
                  <div style={{ minHeight: '44px', display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.45, fontWeight: 400 }}>
                      {m.subtitle}
                    </p>
                  </div>

                  {/* Price Box (fixed height) */}
                  <div style={{ 
                    height: '52px',
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 8, 
                    marginBottom: 20,
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '0 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(249, 115, 22, 0.2)'
                  }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Ціна:</span>
                    <span style={{ 
                      fontSize: 22, 
                      fontWeight: 800, 
                      color: '#f97316',
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '-0.02em'
                    }}>{m.price}</span>
                  </div>

                  {/* Button anchored to bottom */}
                  <a
                    href={`${telegramManagerUrl}?text=${m.tgText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      height: '52px',
                      borderRadius: '18px',
                      fontSize: 15,
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)',
                      transition: 'transform 0.2s, boxShadow 0.2s'
                    }}
                  >
                    <Send size={16} />
                    <span>Замовити за {m.price}</span>
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
                height: '100%',
                boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.15)',
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Custom Image Banner with exact same height: 280px */}
              <div style={{ 
                position: 'relative', 
                height: '280px', 
                width: '100%',
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
                  width: 64,
                  height: 64,
                  borderRadius: '20px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Palette size={32} style={{ color: '#c084fc' }} />
                </div>
                <h4 style={{ 
                  fontSize: 19, 
                  fontWeight: 800, 
                  color: '#fff', 
                  margin: '0 0 6px',
                  fontFamily: "'Outfit', sans-serif" 
                }}>
                  Індивідуальний 3D-дизайн
                </h4>
                <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.45, maxWidth: '240px', fontWeight: 400 }}>
                  Створимо унікальний малюнок за вашим фото, логотипом або ескізом
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
                  fontWeight: 700,
                  color: '#e9d5ff'
                }}>
                  🎨 На замовлення
                </div>
              </div>

              {/* Content Container (flexGrow: 1) */}
              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Title (fixed minHeight: 58px) */}
                <div style={{ minHeight: '58px', display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 style={{ 
                    fontSize: 21, 
                    fontWeight: 800, 
                    color: '#fff', 
                    margin: 0, 
                    lineHeight: 1.25,
                    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                    letterSpacing: '-0.01em'
                  }}>
                    Свій власний малюнок
                  </h3>
                </div>

                {/* Subtitle (fixed minHeight: 44px) */}
                <div style={{ minHeight: '44px', display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.45, fontWeight: 400 }}>
                    Будь-який сюжет: тварини, авто, портрет, емблема чи напис
                  </p>
                </div>

                {/* Price Box (fixed height: 52px) */}
                <div style={{ 
                  height: '52px',
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 8, 
                  marginBottom: 20,
                  background: 'rgba(168, 85, 247, 0.1)',
                  padding: '0 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }}>
                  <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>Ціна:</span>
                  <span style={{ 
                    fontSize: 16, 
                    fontWeight: 800, 
                    color: '#c084fc',
                    fontFamily: "'Outfit', sans-serif" 
                  }}>За домовленістю</span>
                </div>

                {/* Button anchored to bottom */}
                <a
                  href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Хочу розробити індивідуальний дизайн розумної ключниці.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                    color: '#ffffff',
                    height: '52px',
                    borderRadius: '18px',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px rgba(147, 51, 234, 0.35)',
                    transition: 'transform 0.2s, boxShadow 0.2s'
                  }}
                >
                  <Send size={16} />
                  <span>Обговорити дизайн ✈️</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upgraded High-Tech Specifications Grid */}
      <section style={{ padding: '50px 20px 70px', maxWidth: 1050, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.45) 100%)',
          borderRadius: '36px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          padding: '44px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 52, 
              height: 52, 
              borderRadius: '18px', 
              background: 'rgba(249, 115, 22, 0.15)', 
              border: '1px solid rgba(249, 115, 22, 0.3)',
              marginBottom: 14 
            }}>
              <Cpu size={26} style={{ color: '#f97316' }} />
            </div>

            <h2 style={{ 
              fontSize: 'clamp(26px, 3.5vw, 36px)', 
              fontWeight: 800, 
              color: '#fff', 
              margin: '0 0 8px', 
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.01em'
            }}>
              Технічні характеристики
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, fontWeight: 400 }}>
              Кожен виріб оснащений преміальною та безпечною електронікою
            </p>
          </div>

          {/* Cards Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: 20 
          }}>
            {specs.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: item.bgGlow,
                  border: `1px solid ${item.borderGlow}`,
                  padding: '20px',
                  borderRadius: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    background: 'rgba(3, 7, 18, 0.6)',
                    border: `1px solid ${item.borderGlow}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>

                  <span style={{ 
                    fontSize: 12, 
                    color: item.accent, 
                    fontWeight: 700, 
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.02em'
                  }}>
                    {item.label}
                  </span>
                </div>

                <strong style={{ 
                  fontSize: 14, 
                  color: '#f3f4f6', 
                  fontWeight: 600, 
                  lineHeight: 1.45,
                  fontFamily: "'Plus Jakarta Sans', sans-serif" 
                }}>
                  {item.val}
                </strong>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Order Steps (Updated with Official Payment & Delivery Steps) */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ 
            fontSize: 'clamp(26px, 3.5vw, 36px)', 
            fontWeight: 800, 
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.01em'
          }}>
            Простий процес замовлення
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20
        }}>
          {[
            { step: "01", title: "Перехід в Telegram", desc: "Натискаєте кнопку замовлення — відкривається чат з менеджером." },
            { step: "02", title: "Уточнення деталей", desc: "Обираєте бажану модель або надсилаєте малюнок для індивідуального дизайну." },
            { step: "03", title: "Офіційна оплата", desc: "Оплата за офіційними реквізитами (працюємо офіційно ФОП, надаємо чек)." },
            { step: "04", title: "Швидка доставка", desc: "Відправляємо вашу ключницю Новою Поштою у найкоротші терміни." }
          ].map((s, idx) => (
            <div key={idx} style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: 36, 
                fontWeight: 900, 
                color: '#f97316', 
                opacity: 0.85, 
                marginBottom: 12,
                fontFamily: "'Outfit', sans-serif" 
              }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6, fontWeight: 400 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '40px 20px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ 
            fontSize: 'clamp(26px, 3.5vw, 36px)', 
            fontWeight: 800, 
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.01em'
          }}>
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
                  gap: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                    <div style={{ padding: '0 24px 20px', color: '#9ca3af', fontSize: 14, lineHeight: 1.7, fontWeight: 400 }}>
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
          <h2 style={{ 
            fontSize: 'clamp(28px, 4.5vw, 42px)', 
            fontWeight: 800, 
            color: '#fff', 
            margin: '0 0 16px',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Бажаєте замовити чи маєте питання?
          </h2>
          <p style={{ fontSize: 16, color: '#d1d5db', maxWidth: 600, margin: '0 auto 32px', fontWeight: 400 }}>
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
              fontSize: 18,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 15px 35px rgba(249, 115, 22, 0.4)',
              transition: 'transform 0.2s'
            }}
          >
            <Send size={20} />
            <span>Написати в Telegram</span>
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
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Розумна ключниця</span>
          <span style={{ fontSize: 14, color: '#f97316', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>1 200 грн</span>
        </div>

        <a
          href={`${telegramManagerUrl}?text=${encodeURIComponent('Доброго дня! Хочу замовити розумну ключницу-світильник.')}`}
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
            fontWeight: 800,
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
