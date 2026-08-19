"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Zap, 
  BatteryCharging, 
  Usb, 
  ShieldCheck, 
  Sparkles, 
  KeyRound, 
  Eye, 
  CheckCircle2, 
  HelpCircle, 
  Send, 
  ChevronDown, 
  ArrowRight,
  Flame,
  Award,
  Clock,
  Layers,
  Heart,
  Moon,
  Sun
} from 'lucide-react';
import Link from 'next/link';

export default function SmartKeyholderClient() {
  const [selectedModel, setSelectedModel] = useState('deer'); // 'deer' | 'lake'
  const [viewType, setViewType] = useState('night'); // 'night' | 'printer'
  const [openFaq, setOpenFaq] = useState(null);

  const telegramManagerUrl = "https://t.me/buba_lab_manager";

  const models = {
    deer: {
      id: 'deer',
      title: 'Олені на Заході Сонця',
      subtitle: 'Тепле контурне світло вечірнього сонця у гірському лісі',
      nightImg: '/images/smart-keyholder/deer-sunset-lamp.jpg',
      printerImg: '/images/smart-keyholder/deer-sunset-printed.jpg',
      badge: '🔥 ХІТ ПРОДАЖІВ',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницю-світильник "Олені на Заході Сонця".')
    },
    lake: {
      id: 'lake',
      title: 'Нічне Озеро та Вірний Друг',
      subtitle: 'Атмосферний зоряний пейзаж людини з собакою на березі',
      nightImg: '/images/smart-keyholder/man-dog-lake-lamp.jpg',
      printerImg: '/images/smart-keyholder/man-dog-printed.jpg',
      badge: '✨ АВТОРСЬКИЙ ДИЗАЙН',
      tgText: encodeURIComponent('Доброго дня! Хочу замовити розумну ключницю-світильник "Нічне Озеро та Вірний Друг".')
    }
  };

  const currentModel = models[selectedModel];
  const activeImage = viewType === 'night' ? currentModel.nightImg : currentModel.printerImg;

  const features = [
    {
      icon: <Zap size={28} className="text-amber-400" />,
      title: "Датчик Руху & Контурне Світло",
      desc: "Миттєво реагує при наближенні на 2-3 метри. М'яко освітлює коридор і самостійно вимикається через 20 секунд.",
      color: "from-amber-500/20 to-orange-500/10",
      borderColor: "rgba(245, 158, 11, 0.25)"
    },
    {
      icon: <BatteryCharging size={28} className="text-amber-400" />,
      title: "Акумулятор Samsung 3000 мА·год",
      desc: "Забезпечує до 7-10 днів повністю автономної роботи. Жодних дротів на стіні чи постійної заміни батарейок.",
      color: "from-orange-500/20 to-red-500/10",
      borderColor: "rgba(249, 115, 22, 0.25)"
    },
    {
      icon: <Usb size={28} className="text-sky-400" />,
      title: "Сучасний Роз'єм Type-C",
      desc: "Швидке та зручне заряджання від звичайного зарядного пристрою смартфона або повербанка за 1.5 години.",
      color: "from-sky-500/20 to-indigo-500/10",
      borderColor: "rgba(56, 189, 248, 0.25)"
    },
    {
      icon: <ShieldCheck size={28} className="text-emerald-400" />,
      title: "Промислова Пожежна Безпека",
      desc: "Вбудована плата захисту від короткого замикання, перегріву та перезаряджання для повної безпеки вашої оселі.",
      color: "from-emerald-500/20 to-teal-500/10",
      borderColor: "rgba(52, 211, 153, 0.25)"
    },
    {
      icon: <KeyRound size={28} className="text-purple-400" />,
      title: "Авторський 3D Друк & 5 Гачків",
      desc: "Високоточний 3D-друк з міцного екологічного PETG пластику. 5 надійних гачків витримують будь-які в'язки ключів.",
      color: "from-purple-500/20 to-pink-500/10",
      borderColor: "rgba(192, 132, 252, 0.25)"
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
      a: "Світильник оснащений роз'ємом Type-C. Ви можете зарядити його від будь-якого блоку живлення телефону або навіть від павербанка прямо на стіні за 1.5 години."
    },
    {
      q: "Чи безпечно залишати у коридорі?",
      a: "Абсолютно. Пристрій має вбудовану систему захисту від короткого замикання, перенапруги та контролер пожежної безпеки промислового стандарту."
    },
    {
      q: "Як оформити замовлення та яка доставка?",
      a: "Натисніть кнопку 'Замовити в Telegram'. Менеджер з'ясує потрібний дизайн, адресу та відправить замовлення Новою Поштою (є післяплата або оплата на картку)."
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
      {/* Sticky Header */}
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
              href={`${telegramManagerUrl}?text=${currentModel.tgText}`} 
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
      <section style={{ position: 'relative', padding: '40px 20px 60px', overflow: 'hidden' }}>
        {/* Glow ambient background */}
        <div style={{ 
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.18) 0%, rgba(234, 179, 8, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
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

          {/* Main Title */}
          <h1 style={{ 
            fontSize: 'clamp(32px, 5.5vw, 64px)', 
            fontWeight: 950, 
            textAlign: 'center',
            lineHeight: 1.1,
            margin: '0 0 16px',
            background: 'linear-gradient(180deg, #ffffff 30%, #fdba74 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Розумна Ключница-Світильник<br />З Датчиком Руху
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            color: '#d1d5db',
            textAlign: 'center',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Світло там, де воно дійсно потрібне. Автоматично реагує на рух, позбавляє від темряви у передпокої та надійно зберігає ваші ключі.
          </p>

          {/* Interactive Model Selector Tabs */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 12, 
            marginBottom: 30,
            flexWrap: 'wrap'
          }}>
            {Object.values(models).map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: selectedModel === m.id ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedModel === m.id ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: selectedModel === m.id ? '#fff' : '#9ca3af',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedModel === m.id ? '0 0 20px rgba(249, 115, 22, 0.3)' : 'none'
                }}
              >
                <span>{m.id === 'deer' ? '🌄' : '🌌'}</span>
                <span>{m.title}</span>
              </button>
            ))}
          </div>

          {/* Product Visual Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '32px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Left: Image Showcase with toggle */}
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'relative', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                aspectRatio: '4/5',
                background: '#090d16',
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={`${selectedModel}-${viewType}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    src={activeImage}
                    alt={currentModel.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </AnimatePresence>

                {/* Badge Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'rgba(3, 7, 18, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fb923c'
                }}>
                  {currentModel.badge}
                </div>

                {/* View Switcher Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(3, 7, 18, 0.85)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  gap: 4
                }}>
                  <button
                    onClick={() => setViewType('night')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: 'none',
                      background: viewType === 'night' ? '#f97316' : 'transparent',
                      color: viewType === 'night' ? '#fff' : '#9ca3af',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Moon size={14} /> Вночі (Світло)
                  </button>
                  <button
                    onClick={() => setViewType('printer')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: 'none',
                      background: viewType === 'printer' ? '#f97316' : 'transparent',
                      color: viewType === 'printer' ? '#fff' : '#9ca3af',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Layers size={14} /> 3D Друк (Деталі)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Model Info & Quick Order */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#fb923c', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Модель: {currentModel.title}
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>
                {currentModel.subtitle}
              </h2>

              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  "Автоматичний датчик руху (вимикання через 20с)",
                  "Оригінальний акумулятор Samsung 3000 мА·год (до 7 днів)",
                  "Живлення через роз'єм Type-C",
                  "Промисловий пожежний захист від замикань",
                  "5 міцних гачків для ключів та авторський 3D-дизайн"
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#e5e7eb' }}>
                    <CheckCircle2 size={18} className="text-amber-400" style={{ color: '#f97316', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Order Button CTA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a
                  href={`${telegramManagerUrl}?text=${currentModel.tgText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    padding: '18px 28px',
                    borderRadius: '20px',
                    fontSize: 18,
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 12px 30px rgba(249, 115, 22, 0.4)',
                    transition: 'transform 0.2s, boxShadow 0.2s',
                    letterSpacing: '0.02em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(249, 115, 22, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(249, 115, 22, 0.4)';
                  }}
                >
                  <Send size={22} />
                  <span>ЗАМОВИТИ В TELEGRAM</span>
                </a>
                
                <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  ⚡ Безкоштовна консультація менеджера • Доставка Новою Поштою
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid Section */}
      <section style={{ padding: '60px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, margin: '0 0 12px', color: '#fff' }}>
            Чому ця ключниця — ідеальний вибір?
          </h2>
          <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 600, margin: '0 auto' }}>
            Інженерний підхід до кожного виробу: поєднання затишку, автономності та безпеки
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24
        }}>
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.4))`,
                padding: '28px',
                borderRadius: '24px',
                border: `1px solid ${feat.borderColor}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Before / After Practical Scenarios */}
      <section style={{ 
        padding: '60px 20px', 
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0) 100%)' 
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ color: '#f97316', fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              КОМФОРТ КОЖНОГО ДНЯ
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 900, color: '#fff', marginTop: 8 }}>
              Як розумна ключниця змінює ваш коридор?
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {/* Without Lamp */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '24px',
              padding: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>❌</span> Без розумної ключниці
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: '#9ca3af', fontSize: 14 }}>
                <li>• Пошук вимикача напомацки у повній темряві з пакетами у руках</li>
                <li>• Різке яскраве верхнє світло бісить, коли треба просто забрати ключі вночі</li>
                <li>• Ключі губляться по всій квартирі, створюючи хаос перед виходом</li>
                <li>• Плутанина з дротами або потреба міняти батарейки щотижня</li>
              </ul>
            </div>

            {/* With Lamp */}
            <div style={{
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 0 30px rgba(249, 115, 22, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fb923c', fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>✅</span> З розумною ключницею BUBA
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: '#e5e7eb', fontSize: 14 }}>
                <li>• М'яке затишне світло вмикається самите, щойно ви заходите у двері</li>
                <li>• Комфортне контурне підсвічування не засліплює та вимикається автоматично</li>
                <li>• Всі ключі завжди на своєму місці на 5 міцних гачках</li>
                <li>• До 14 днів роботи від 1 заряду Type-C без жодних дротів на стіні</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Models Gallery Section */}
      <section style={{ padding: '60px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
            Оберіть свій авторський дизайн
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 16 }}>
            Кожен виріб виготовляється з високою деталізацією та проходить перевірку якості
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32
        }}>
          {Object.values(models).map((m) => (
            <div 
              key={m.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '28px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={m.nightImg} 
                  alt={m.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 20,
                  right: 20
                }}>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#fdba74', margin: '4px 0 0' }}>
                    {m.subtitle}
                  </p>
                </div>
              </div>

              <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: '#9ca3af' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', color: '#6b7280', fontSize: 10, fontWeight: 700 }}>АКУМУЛЯТОР</span>
                      <strong style={{ color: '#fff', fontSize: 13 }}>3000 мА·год</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '12px' }}>
                      <span style={{ display: 'block', color: '#6b7280', fontSize: 10, fontWeight: 700 }}>ЖИВЛЕННЯ</span>
                      <strong style={{ color: '#fff', fontSize: 13 }}>Type-C</strong>
                    </div>
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
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                    color: '#fb923c',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: 15,
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f97316';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                    e.currentTarget.style.color = '#fb923c';
                  }}
                >
                  <Send size={16} />
                  <span>Замовити цей дизайн</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Specifications Section */}
      <section style={{ padding: '60px 20px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '36px 28px',
          backdropFilter: 'blur(16px)'
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 24, textAlign: 'center' }}>
            📋 Технічні характеристики
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { label: "Датчик руху", val: "Інфрачервоний (радіус 2-3м, 20с таймер)" },
              { label: "Елемент живлення", val: "Samsung 18650 Li-ion 3000 мА·год" },
              { label: "Автономна робота", val: "До 7–14 днів без підзаряджання" },
              { label: "Роз'єм зарядки", val: "USB Type-C (5V)" },
              { label: "Пожежна безпека", val: "BMS-плата із захистом від КЗ та перегріву" },
              { label: "Матеріал корпусу", val: "PETG / PLA преміум 3D-друк" },
              { label: "Кількість гачків", val: "5 надійних інтегрованих гачків" },
              { label: "Тип кріплення", val: "Легкий монтаж на стіну (у комплекті)" }
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
      <section style={{ padding: '60px 20px', maxWidth: 1000, margin: '0 auto' }}>
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
            { step: "01", title: "Перехід в Telegram", desc: "Натискаєте кнопку замовлення — відкривається чат з нашим менеджером." },
            { step: "02", title: "Уточнення деталей", desc: "Обираєте дизайн світильника та вказуєте дані для доставки." },
            { step: "03", title: "Швидка доставка", desc: "Відправляємо Новою Поштою. Оплата при отриманні або на картку." }
          ].map((s, idx) => (
            <div key={idx} style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative'
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
      <section style={{ padding: '60px 20px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 900, color: '#fff' }}>
            Популярні запитання (FAQ)
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
                overflow: 'hidden',
                transition: 'border-color 0.2s'
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
      <section style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
          borderRadius: '36px',
          padding: '48px 24px',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          boxShadow: '0 20px 50px rgba(249, 115, 22, 0.15)'
        }}>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 44px)', fontWeight: 950, color: '#fff', margin: '0 0 16px' }}>
            Готові додати затишку у свій дім?
          </h2>
          <p style={{ fontSize: 16, color: '#d1d5db', maxWidth: 600, margin: '0 auto 32px' }}>
            Зв'яжіться з нами в Telegram зараз для швидкого замовлення та відповіді на всі ваші запитання.
          </p>

          <a
            href={`${telegramManagerUrl}?text=${currentModel.tgText}`}
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
              fontSize: 20,
              fontWeight: 900,
              textDecoration: 'none',
              boxShadow: '0 15px 35px rgba(249, 115, 22, 0.4)',
              transition: 'transform 0.2s'
            }}
          >
            <Send size={24} />
            <span>НАПИСАТИ В TELEGRAM</span>
          </a>
        </div>
      </section>

      {/* Floating Bottom Bar for Mobile / Ad Conversion */}
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
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 900 }}>{currentModel.title}</span>
        </div>

        <a
          href={`${telegramManagerUrl}?text=${currentModel.tgText}`}
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
