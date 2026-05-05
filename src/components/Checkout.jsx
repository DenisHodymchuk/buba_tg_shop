"use client";
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Trash2, Minus, Plus, CreditCard, Truck, 
  User, Phone, MapPin, MessageSquare, Coins, CheckCircle2,
  Check, ArrowRight, Home, ReceiptText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { novaPoshta } from '@/lib/novaposhta';
import { Loader2 } from 'lucide-react';

export default function Checkout({ items, onClose, onUpdateQuantity, onRemove, bonuses }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [useBonuses, setUseBonuses] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [deliveryMethod, setDeliveryMethod] = useState('nova_poshta');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', city: '', cityRef: '', warehouse: '', warehouseRef: '', comment: '', noCall: false
  });
  const [bonusInput, setBonusInput] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);
  const [showWarehouseResults, setShowWarehouseResults] = useState(false);

  // Пошук міст
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      // Не шукаємо, якщо запит порожній або вже збігається з вибраним містом
      if (cityQuery.length >= 2 && deliveryMethod === 'nova_poshta' && cityQuery !== formData.city) {
        setLoadingCities(true);
        const data = await novaPoshta.getCities(cityQuery);
        setCities(data);
        setLoadingCities(false);
        setShowCityResults(true);
      } else {
        setCities([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cityQuery, deliveryMethod, formData.city]);

  // Отримання відділень
  React.useEffect(() => {
    async function fetchWarehouses() {
      if (formData.cityRef && deliveryMethod === 'nova_poshta') {
        setLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(formData.cityRef);
        setWarehouses(data);
        setLoadingWarehouses(false);
      } else {
        setWarehouses([]);
      }
    }
    fetchWarehouses();
  }, [formData.cityRef, deliveryMethod]);

  const filteredWarehouses = useMemo(() => {
    if (!warehouseQuery) return warehouses;
    // Не фільтруємо, якщо запит вже збігається з вибраним відділенням
    if (warehouseQuery === formData.warehouse) return [];
    return warehouses.filter(w => 
      w.Description.toLowerCase().includes(warehouseQuery.toLowerCase())
    );
  }, [warehouses, warehouseQuery, formData.warehouse]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.price * (1 - (item.discount || 0) / 100);
      return sum + (price * (item.quantity || 1));
    }, 0);
  }, [items]);

  const bonusDiscount = useMemo(() => {
    if (!useBonuses) return 0;
    const requestedCoins = parseInt(bonusInput) || 0;
    const maxCoinsAllowedByTotal = subtotal * 0.10; // 10% ліміт від суми замовлення
    const coinsToUse = Math.min(requestedCoins, bonuses, maxCoinsAllowedByTotal);
    return Math.floor(coinsToUse); // 1 монета = 1 ₴
  }, [useBonuses, bonusInput, subtotal, bonuses]);

  const total = subtotal - bonusDiscount;

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.phone) {
      alert('Будь ласка, заповніть ім\'я та телефон');
      return;
    }

    setIsSubmitting(true);
    const newOrderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(100 + Math.random() * 899)}`;
    setOrderNumber(newOrderNumber);

    if (!supabase) {
      console.warn('Supabase not initialized. Order not saved to database.');
      setTimeout(() => {
        setIsSuccess(true);
        setIsSubmitting(false);
      }, 800);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          total: total,
          status: 'new',
          shipping_method: deliveryMethod,
          payment_status: paymentMethod === 'online' ? 'pending' : 'cash',
          shipping_details: {
            ...formData,
            bonus_used: useBonuses ? parseInt(bonusInput) || 0 : 0,
            items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity || 1 }))
          },
          order_number: newOrderNumber
        }])
        .select();

      if (error) throw error;

      // Оновлюємо профіль користувача (прив'язуємо телефон до Telegram ID)
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        await supabase.from('profiles').upsert({
          telegram_id: tgUser.id.toString(),
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone
        }, { onConflict: 'telegram_id' });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('buba_customer_phone', formData.phone);
      }
      setIsSuccess(true);
    } catch (error) {
      console.error('Order error:', error);
      alert('Помилка при створенні замовлення. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: '#05050f', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '60px 20px', textAlign: 'center'
        }}
      >
        {/* Circle for Checkmark */}
        <div style={{
          width: 90, height: 90, borderRadius: '50%', background: 'rgba(45, 212, 191, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf',
          marginBottom: 32, border: '2px solid rgba(45, 212, 191, 0.2)', boxShadow: '0 0 30px rgba(45, 212, 191, 0.15)'
        }}>
          <Check size={44} strokeWidth={4} />
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 950, color: '#fff', marginBottom: 12 }}>Замовлення Прийнято!</h2>
        <p style={{ color: '#6b6b8a', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Номер вашого замовлення:</p>
        <div style={{ fontSize: 24, fontWeight: 950, color: '#fff', marginBottom: 40, letterSpacing: '0.05em' }}>{orderNumber}</div>

        <div style={{ 
          width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24,
          textAlign: 'left', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 18, color: '#5b5bff', fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Що далі? 🚚
          </h3>
          <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, fontWeight: 600 }}>
            Невдовзі наш менеджер обробить ваше замовлення та підготує його до відправки. 
            Ми створимо електронну накладну "Нової Пошти" і відразу надішлемо вам номер ТТН для відстеження посилки!
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            onClick={() => {
              window.location.reload(); // Найпростіший спосіб скинути все
            }}
            style={{ 
              width: '100%', padding: '18px', borderRadius: 20, border: 'none', 
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', fontWeight: 950, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)', fontSize: 16
            }}
          >
            ПОВЕРНУТИСЬ ДО МАГАЗИНУ
          </button>
          <button 
            onClick={() => {
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openOrderHistory'));
              }, 100);
            }}
            style={{ 
              width: '100%', padding: '18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 800, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
              fontSize: 14
            }}
          >
            МОЇ ЗАМОВЛЕННЯ
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: '#05050f', display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden'
      }}
    >
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '20px 16px', background: 'rgba(5,5,15,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Оформлення</h2>
          <p style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Замовлення завершено</p>
        </div>
      </header>

      <div style={{ padding: '24px 16px 120px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Your Order */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
             <CheckCircle2 size={18} style={{ color: '#2dd4bf' }} />
             <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Ваше замовлення</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 20, padding: 12, display: 'flex', gap: 12, alignItems: 'center' 
              }}>
                <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden' }}>
                  <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{item.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
                        <button onClick={() => onUpdateQuantity(idx, -1)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: '#6b6b8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14}/></button>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', minWidth: 20, textAlign: 'center' }}>{item.quantity || 1}</span>
                        <button onClick={() => onUpdateQuantity(idx, 1)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14}/></button>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{(item.price * (1 - (item.discount || 0)/100) * (item.quantity || 1)).toFixed(0)} ₴</div>
                  </div>
                </div>
                <button onClick={() => onRemove(idx)} style={{ color: '#ef4444', opacity: 0.5, border: 'none', background: 'transparent' }}><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </section>

        {/* Bonuses */}
        <section style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 24, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                <Coins size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Використати бонуси</div>
                <div style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 700 }}>У вас {bonuses} монет (1 монета = 1 гривня)</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setUseBonuses(!useBonuses);
                if (!useBonuses) setBonusInput(Math.min(bonuses, subtotal).toString());
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, background: useBonuses ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: useBonuses ? 23 : 3, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'all 0.3s' }} />
            </button>
          </div>
          {useBonuses && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  placeholder="Скільки монет списати?"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 12, padding: '10px 16px', color: '#fff', fontSize: 13, outline: 'none',
                    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield'
                  }}
                />
                <style>{`
                  input::-webkit-outer-spin-button,
                  input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                `}</style>
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#6b6b8a', fontWeight: 800 }}>монет</span>
              </div>
              <div style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 800 }}>
                {bonusDiscount > 0 ? (
                  <>✨ Ви отримуєте знижку {bonusDiscount.toFixed(0)} ₴ (максимум 10% від замовлення)</>
                ) : (
                  <>Вкажіть кількість монет</>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Payment */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Оплата</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectorItem active={paymentMethod === 'online'} onClick={() => setPaymentMethod('online')} icon={<CreditCard size={20}/>} title="Онлайн Оплата" sub="Monobank / Apple Pay / Картка" />
            <SelectorItem active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} icon={<MapPin size={20}/>} title="При отриманні" sub="Оплата у відділенні (післяплата)" />
          </div>
        </section>

        {/* Delivery */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Доставка</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectorItem active={deliveryMethod === 'nova_poshta'} onClick={() => setDeliveryMethod('nova_poshta')} icon={<Truck size={20}/>} title="Нова Пошта" sub="Доставка у відділення або поштомат" color="#ef4444" />
            <SelectorItem active={deliveryMethod === 'pickup'} onClick={() => setDeliveryMethod('pickup')} icon={<MapPin size={20}/>} title="Самовивіз" sub="Хмельницький, ТЦ Дитячий світ" color="#2dd4bf" />
          </div>
        </section>

        {/* Receiver Details */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Дані отримувача</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
               <Input icon={<User size={16}/>} placeholder="Ім'я" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
               <Input placeholder="Прізвище" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
            </div>
            <Input icon={<Phone size={16}/>} placeholder="+38 (0XX) XXX XX XX" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            
            {deliveryMethod === 'nova_poshta' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* City Selection */}
                <div style={{ position: 'relative' }}>
                  <Input 
                    icon={<MapPin size={16}/>} 
                    placeholder="Населений пункт..." 
                    value={cityQuery || formData.city} 
                    onChange={v => { setCityQuery(v); setShowCityResults(true); }} 
                  />
                  {loadingCities && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#7c3aed' }} />}
                  
                  <AnimatePresence>
                    {showCityResults && cities.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#161630', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', marginTop: 8, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      >
                        {cities.map((city) => (
                          <button
                            key={city.Ref}
                            onClick={() => {
                              setFormData({...formData, city: city.Description, cityRef: city.Ref, warehouse: '', warehouseRef: ''});
                              setCityQuery(city.Description);
                              setShowCityResults(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          >
                            {city.Description} ({city.AreaDescription})
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Warehouse Selection */}
                {formData.cityRef && (
                  <div style={{ position: 'relative' }}>
                    <Input 
                      icon={<Home size={16}/>} 
                      placeholder="Виберіть відділення або поштомат..." 
                      value={warehouseQuery || formData.warehouse} 
                      onChange={v => { setWarehouseQuery(v); setShowWarehouseResults(true); }} 
                      onFocus={() => setShowWarehouseResults(true)}
                    />
                    
                    <AnimatePresence>
                      {showWarehouseResults && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90, background: '#161630', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', marginTop: 8, maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                        >
                          {loadingWarehouses ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>Завантаження списку...</div>
                          ) : filteredWarehouses.length > 0 ? (
                            filteredWarehouses.map((wh) => (
                              <button
                                key={wh.Ref}
                                onClick={() => {
                                  setFormData({...formData, warehouse: wh.Description, warehouseRef: wh.Ref});
                                  setWarehouseQuery(wh.Description);
                                  setShowWarehouseResults(false);
                                }}
                                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', lineHeight: 1.4 }}
                              >
                                {wh.Description}
                              </button>
                            ))
                          ) : (
                            <div style={{ padding: 20, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>Нічого не знайдено</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {loadingWarehouses && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#7c3aed' }} />}
                  </div>
                )}
              </div>
            ) : (
              <Input icon={<MapPin size={16}/>} placeholder="Адреса (для самовивозу)" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
            )}
            <div style={{ position: 'relative' }}>
              <textarea 
                placeholder="Додаткові побажання..." 
                value={formData.comment}
                onChange={e => setFormData({...formData, comment: e.target.value})}
                style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none' }}
              />
            </div>
            <button 
              onClick={() => setFormData({...formData, noCall: !formData.noCall})}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: '#fff', cursor: 'pointer' }}
            >
              <div style={{ width: 18, height: 18, border: '2px solid #7c3aed', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.noCall ? '#7c3aed' : 'transparent' }}>
                 {formData.noCall && <CheckCircle2 size={12}/>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Не телефонувати для підтвердження</span>
            </button>
          </div>
        </section>

      </div>

      {/* Sticky Footer Summary */}
      <footer style={{
        position: 'sticky', bottom: 0, padding: '24px 16px 32px',
        background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(30px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#6b6b8a', fontWeight: 700 }}>Сума:</span>
          <span style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>{subtotal.toFixed(0)} ₴</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, color: '#fff', fontWeight: 900 }}>До оплати:</span>
          <span style={{ fontSize: 26, color: '#2dd4bf', fontWeight: 950 }}>{total.toFixed(0)} ₴</span>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '18px', borderRadius: 20, border: 'none',
            background: isSubmitting ? '#4a4a6a' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: '#fff', fontWeight: 950, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em',
            boxShadow: '0 10px 30px rgba(124,58,237,0.4)', cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Обробка...' : 'Підтвердити замовлення'}
        </button>
      </footer>
    </motion.div>
  );
}

function SelectorItem({ active, onClick, icon, title, sub, color = "#7c3aed" }) {
  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%', padding: 16, borderRadius: 20, textAlign: 'left',
        background: active ? `rgba(${active ? '124,58,237' : '255,255,255'}, 0.05)` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
        display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? color : '#3a3a5a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? `${color}15` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? color : '#6b6b8a' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 700 }}>{sub}</div>
      </div>
    </button>
  );
}

function Input({ icon, placeholder, value, onChange, onFocus }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }}>{icon}</div>}
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 16, padding: `14px 16px 14px ${icon ? 44 : 16}px`, color: '#fff', fontSize: 16, outline: 'none'
        }}
      />
    </div>
  );
}
