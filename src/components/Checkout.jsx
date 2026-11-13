"use client";
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, Trash2, Minus, Plus, CreditCard, Truck,
  User, Phone, MapPin, Coins, CheckCircle2,
  Check, Home, ReceiptText, Loader2, X, Globe, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { novaPoshta } from '@/lib/novaposhta';

export default function Checkout({ items, onClose, onUpdateQuantity, onRemove, bonuses, onOrderSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [finalAmount, setFinalAmount] = useState(0);
  const [useBonuses, setUseBonuses] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card_transfer');
  const [deliveryMethod, setDeliveryMethod] = useState('nova_poshta');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '+380', city: '', cityRef: '', warehouse: '', warehouseRef: '', comment: '', noCall: false
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  React.useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            setIsKeyboardOpen(false);
          }
        }, 100);
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (cityQuery.length >= 2 && deliveryMethod === 'nova_poshta' && cityQuery !== formData.city) {
        setLoadingCities(true);
        const data = await novaPoshta.getCities(cityQuery);
        setCities(data);
        setLoadingCities(false);
        setShowCityResults(true);
      } else {
        setCities([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cityQuery, deliveryMethod, formData.city]);

  React.useEffect(() => {
    async function fetchWarehouses() {
      if (formData.cityRef && deliveryMethod === 'nova_poshta') {
        setLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(formData.cityRef);
        setWarehouses(data || []);
        setLoadingWarehouses(false);
      } else {
        setWarehouses([]);
      }
    }
    fetchWarehouses();
  }, [formData.cityRef, deliveryMethod]);

  // Live server search for warehouses when user types number or address
  React.useEffect(() => {
    const q = String(warehouseQuery || '').trim();
    if (!formData.cityRef || deliveryMethod !== 'nova_poshta' || !q || q === String(formData.warehouse || '').trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingWarehouses(true);
        const results = await novaPoshta.getWarehouses(formData.cityRef, q);
        if (Array.isArray(results) && results.length > 0) {
          setWarehouses(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const existingRefs = new Set(list.map(w => w.Ref));
            const newItems = results.filter(w => !existingRefs.has(w.Ref));
            return [...results, ...newItems, ...list.filter(w => !results.some(r => r.Ref === w.Ref))];
          });
        }
      } catch (err) {
        console.error('Error searching warehouses in checkout:', err);
      } finally {
        setLoadingWarehouses(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [warehouseQuery, formData.cityRef, formData.warehouse, deliveryMethod]);

  const filteredWarehouses = useMemo(() => {
    if (!warehouses || !Array.isArray(warehouses)) return [];
    if (!warehouseQuery) return warehouses;
    if (warehouseQuery === formData.warehouse) return [];
    const q = warehouseQuery.toLowerCase();
    const cleanNum = q.replace(/\D/g, '');
    return warehouses.filter(w => {
      if (!w) return false;
      const desc = (w.Description || '').toLowerCase();
      const num = String(w.Number || '').toLowerCase();
      return desc.includes(q) || num === q || (cleanNum && num === cleanNum) || (cleanNum && desc.includes(cleanNum));
    }).sort((a, b) => {
      const aNum = String(a.Number || '');
      const bNum = String(b.Number || '');
      const aExact = aNum === q || (cleanNum && aNum === cleanNum) ? 0 : 1;
      const bExact = bNum === q || (cleanNum && bNum === cleanNum) ? 0 : 1;
      return aExact - bExact;
    });
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
    const maxCoinsAllowedByTotal = subtotal * 0.10;
    const coinsToUse = Math.min(requestedCoins, bonuses, maxCoinsAllowedByTotal);
    return Math.floor(coinsToUse);
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
      setTimeout(() => {
        setIsSuccess(true);
        setIsSubmitting(false);
      }, 800);
      return;
    }

    try {
      let customerId = null;
      const tgUser = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;

      if (tgUser) {
        const { data: existingCust } = await supabase
          .from('customers')
          .select('id, bonuses')
          .eq('tg_id', tgUser.id.toString())
          .single();

        const bonusesToDeduct = useBonuses ? bonusDiscount : 0;
        const newBonusBalance = existingCust ? Math.max(0, (existingCust.bonuses || 0) - bonusesToDeduct) : 0;

        const { data: customerData } = await supabase.from('customers').upsert({
          tg_id: tgUser.id.toString(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          bonuses: newBonusBalance,
          last_login: new Date().toISOString(),
          allow_notifications: true
        }, { onConflict: 'tg_id' }).select().single();

        if (customerData) customerId = customerData.id;
      }

      const { error } = await supabase
        .from('orders')
        .insert([{
          total: total,
          status: 'new',
          source: 'website',
          customer_id: customerId,
          shipping_method: deliveryMethod,
          payment_status: paymentMethod === 'card_transfer' ? 'pending_transfer' : 'cash',
          shipping_details: {
            ...formData,
            tg_id: tgUser?.id?.toString(),
            bonus_used: useBonuses ? bonusDiscount : 0,
            items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity || 1 })),
            is_cod: paymentMethod === 'cash',
            cod_amount: paymentMethod === 'cash' ? Math.round(total * 0.7) : 0
          },
          order_number: newOrderNumber
        }])
        .select()
        .single();

      if (error) throw error;

      if (typeof window !== 'undefined') {
        localStorage.setItem('buba_customer_phone', formData.phone);
      }
      setFinalAmount(total);
      setIsSuccess(true);
      if (onOrderSuccess) onOrderSuccess();
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
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: '#13151B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#F3F4F8'
        }}
      >
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(147, 162, 250, 0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#93A2FA',
          marginBottom: 24,
          border: '1px solid rgba(147, 162, 250, 0.35)'
        }}>
          <Check size={34} strokeWidth={2.5} />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F3F4F8', marginBottom: 8 }}>Замовлення прийнято</h2>
        <p style={{ color: '#8D93A5', fontSize: 13, marginBottom: 4 }}>Номер вашого замовлення:</p>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#93A2FA', marginBottom: 20, fontFamily: 'monospace' }}>
          {orderNumber}
        </div>

        <AnimatePresence>
          {paymentConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(147, 162, 250, 0.14)',
                color: '#93A2FA',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid rgba(147, 162, 250, 0.32)',
                marginBottom: 20
              }}
            >
              Дякуємо! Перевіряємо оплату
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!paymentConfirmed && (
            <motion.div
              initial={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                width: '100%',
                maxWidth: 420,
                background: '#181B22',
                borderRadius: 16,
                padding: 20,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: 20,
                textAlign: 'left',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8D93A5', fontWeight: 500, marginBottom: 6 }}>
                    {paymentMethod === 'card_transfer' ? 'Реквізити для повної оплати:' : 'Реквізити для передоплати 30%:'}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#F3F4F8', marginBottom: 4, fontFamily: 'monospace' }}>
                    4441 1110 5788 6511
                  </div>
                  <div style={{ fontSize: 12.5, color: '#93A2FA', fontWeight: 500 }}>Годимчук Денис Д.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('4441111057886511');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: copied ? 'rgba(147, 162, 250, 0.2)' : '#13151B',
                    border: '1px solid rgba(147, 162, 250, 0.35)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#93A2FA',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? 'Скопійовано ✓' : 'Копіювати'}
                </button>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F4A97B', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                Сума до сплати зараз: {paymentMethod === 'card_transfer' ? finalAmount.toFixed(0) : (finalAmount * 0.3).toFixed(0)} ₴
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!paymentConfirmed ? (
            <button
              type="button"
              onClick={async () => {
                setIsConfirmingPayment(true);
                try {
                  await supabase.from('orders').update({ payment_status: 'verifying' }).eq('order_number', orderNumber);
                  setPaymentConfirmed(true);
                } catch (e) { console.error(e); }
                setIsConfirmingPayment(false);
              }}
              disabled={isConfirmingPayment}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 11,
                border: 'none',
                background: '#93A2FA',
                color: '#13151B',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {isConfirmingPayment ? <Loader2 className="animate-spin" size={18} /> : 'Я оплатив(ла)'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onClose()}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 11,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#181B22',
              color: '#F3F4F8',
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer'
            }}
          >
            Повернутись до магазину
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(10, 12, 16, 0.78)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100%',
          background: '#13151B',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          color: '#F3F4F8'
        }}
      >
        {/* Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '14px 20px',
          background: 'rgba(19, 21, 27, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#181B22',
                color: '#F3F4F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F8', lineHeight: 1.2, margin: 0 }}>Оформлення замовлення</h2>
              <p style={{ fontSize: 11.5, color: '#8D93A5', margin: 0 }}>Перевірте товари та вкажіть відділення доставки</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#8D93A5', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </header>

        <div style={{
          padding: `18px 20px ${isKeyboardOpen ? '24px' : '110px'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          flex: 1
        }}>
          {/* Cart Items */}
          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8D93A5', marginBottom: 10 }}>
              Товари в кошику ({items.reduce((s, i) => s + (i.quantity || 1), 0)} шт.)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{
                  background: '#181B22',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  <div style={{ width: 52, height: 52, background: '#13151B', borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
                    {item.image_url && <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F8', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#13151B', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: 8, height: 28 }}>
                        <button type="button" onClick={() => onUpdateQuantity(idx, -1)} style={{ width: 26, height: '100%', border: 'none', background: 'transparent', color: '#8D93A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#F3F4F8', minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.quantity || 1}</span>
                        <button type="button" onClick={() => onUpdateQuantity(idx, 1)} style={{ width: 26, height: '100%', border: 'none', background: 'transparent', color: '#93A2FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F3F4F8', fontVariantNumeric: 'tabular-nums' }}>
                        {(item.price * (1 - (item.discount || 0) / 100) * (item.quantity || 1)).toFixed(0)} ₴
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => onRemove(idx)} style={{ color: '#E66B72', border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Bonuses */}
          <section style={{
            background: '#181B22',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 12,
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244, 169, 123, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F4A97B' }}>
                  <Coins size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F8' }}>Бонусні монети</div>
                  <div style={{ fontSize: 11, color: '#8D93A5' }}>
                    {bonuses > 0 ? `Доступно: ${bonuses} монет (1 монета = 1 ₴)` : 'Кешбек монетами нараховується після замовлення'}
                  </div>
                </div>
              </div>
              {bonuses > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setUseBonuses(!useBonuses);
                    if (!useBonuses) setBonusInput(Math.min(bonuses, subtotal).toString());
                  }}
                  style={{
                    width: 38, height: 21, borderRadius: 999,
                    background: useBonuses ? '#93A2FA' : '#13151B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative', cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'absolute', top: 2, left: useBonuses ? 19 : 2, width: 15, height: 15, background: useBonuses ? '#13151B' : '#8D93A5', borderRadius: '50%', transition: 'all 0.2s' }} />
                </button>
              )}
            </div>
            {bonuses > 0 && useBonuses && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Скільки монет списати?"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%', background: '#13151B', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 9, padding: '8px 12px', color: '#F3F4F8', fontSize: 13, outline: 'none'
                  }}
                />
                <div style={{ fontSize: 11.5, color: '#93A2FA', fontWeight: 500 }}>
                  {bonusDiscount > 0 ? `Знижка: −${bonusDiscount.toFixed(0)} ₴ (до 10% вартості)` : 'Вкажіть кількість монет'}
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8D93A5', marginBottom: 8 }}>Спосіб оплати</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SelectorItem
                active={paymentMethod === 'card_transfer'}
                onClick={() => setPaymentMethod('card_transfer')}
                icon={<CreditCard size={17} />}
                title="Оплата на картку Monobank"
                sub="Повна передоплата без комісії пошти за наложку"
              />
              <SelectorItem
                active={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
                icon={<ReceiptText size={17} />}
                title="Післяплата (накладений платіж)"
                sub="Аванс 30% на картку, залишок при отриманні на пошті"
              />
            </div>
          </section>

          {/* Delivery */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8D93A5' }}>Служба доставки</span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: total > 3000 ? '#4ADE80' : '#93A2FA'
              }}>
                {total > 3000 ? 'Безкоштовна доставка по Україні!' : 'Понад 3 000 ₴ — доставка безкоштовна'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SelectorItem
                active={deliveryMethod === 'nova_poshta'}
                onClick={() => setDeliveryMethod('nova_poshta')}
                icon={<Truck size={17} />}
                title="Нова Пошта (по Україні)"
                sub="За тарифами Нової Пошти · відділення, поштомат або кур’єр"
              />
              <SelectorItem
                active={deliveryMethod === 'ukrposhta'}
                onClick={() => setDeliveryMethod('ukrposhta')}
                icon={<Package size={17} />}
                title="Укрпошта (по Україні)"
                sub="За тарифами Укрпошти · доставка у відділення"
              />
              <SelectorItem
                active={deliveryMethod === 'international_np'}
                onClick={() => setDeliveryMethod('international_np')}
                icon={<Globe size={17} />}
                title="За кордон — Нова Пошта"
                sub="Міжнародна доставка Nova Post за тарифами перевізника"
              />
              <SelectorItem
                active={deliveryMethod === 'international_ukr'}
                onClick={() => setDeliveryMethod('international_ukr')}
                icon={<Globe size={17} />}
                title="За кордон — Укрпошта"
                sub="Міжнародне відправлення за тарифами Укрпошти"
              />
              <SelectorItem
                active={deliveryMethod === 'pickup'}
                onClick={() => setDeliveryMethod('pickup')}
                icon={<MapPin size={17} />}
                title="Самовивіз (м. Хмельницький)"
                sub="ТЦ Дитячий світ"
              />
            </div>
          </section>

          {/* Receiver Details */}
          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8D93A5', marginBottom: 8 }}>Дані отримувача</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input icon={<User size={15} />} placeholder="Ім'я" value={formData.firstName} onChange={v => setFormData({ ...formData, firstName: v })} />
                <Input placeholder="Прізвище" value={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} />
              </div>
              <Input
                icon={<Phone size={15} />}
                placeholder={deliveryMethod.startsWith('international_') ? '+...' : '+380'}
                value={formData.phone}
                onChange={v => {
                  const cleaned = v.replace(/[^\d+]/g, '');
                  if (!deliveryMethod.startsWith('international_') && cleaned.length < 4) {
                    setFormData({ ...formData, phone: '+380' });
                  } else {
                    setFormData({ ...formData, phone: cleaned });
                  }
                }}
              />

              {deliveryMethod === 'nova_poshta' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <Input
                      icon={<MapPin size={15} />}
                      placeholder="Місто або населений пункт…"
                      value={cityQuery || formData.city}
                      onChange={v => { setCityQuery(v); setShowCityResults(true); }}
                    />
                    {loadingCities && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#93A2FA' }} />}

                    <AnimatePresence>
                      {showCityResults && cities.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#181B22', borderRadius: 11, border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 4, maxHeight: 190, overflowY: 'auto', boxShadow: '0 14px 34px rgba(0,0,0,0.6)' }}
                        >
                          {cities.map((city) => (
                            <button
                              key={city.Ref}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, city: city.Description, cityRef: city.Ref, warehouse: '', warehouseRef: '' });
                                setCityQuery(city.Description);
                                setShowCityResults(false);
                              }}
                              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#F3F4F8', fontSize: 13, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                            >
                              {city.Description} <span style={{ color: '#8D93A5', fontSize: 11.5 }}>({city.AreaDescription})</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {formData.cityRef && (
                    <div style={{ position: 'relative' }}>
                      <Input
                        icon={<Home size={15} />}
                        placeholder="Відділення або поштомат…"
                        value={warehouseQuery || formData.warehouse}
                        onChange={v => { setWarehouseQuery(v); setShowWarehouseResults(true); }}
                        onFocus={() => setShowWarehouseResults(true)}
                      />

                      <AnimatePresence>
                        {showWarehouseResults && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90, background: '#181B22', borderRadius: 11, border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 14px 34px rgba(0,0,0,0.6)' }}
                          >
                            {loadingWarehouses ? (
                              <div style={{ padding: 16, textAlign: 'center', color: '#8D93A5', fontSize: 12.5 }}>Завантаження відділень…</div>
                            ) : filteredWarehouses.length > 0 ? (
                              filteredWarehouses.map((wh) => (
                                <button
                                  key={wh.Ref}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, warehouse: wh.Description, warehouseRef: wh.Ref });
                                    setWarehouseQuery(wh.Description);
                                    setShowWarehouseResults(false);
                                  }}
                                  style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#F3F4F8', fontSize: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', lineHeight: 1.35 }}
                                >
                                  {wh.Description}
                                </button>
                              ))
                            ) : (
                              <div style={{ padding: 16, textAlign: 'center', color: '#8D93A5', fontSize: 12.5 }}>Відділення не знайдено</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : deliveryMethod === 'ukrposhta' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Input
                    icon={<MapPin size={15} />}
                    placeholder="Місто або населений пункт…"
                    value={formData.city}
                    onChange={v => setFormData({ ...formData, city: v })}
                  />
                  <Input
                    icon={<Home size={15} />}
                    placeholder="Поштовий індекс та адреса / № відділення Укрпошти…"
                    value={formData.warehouse}
                    onChange={v => setFormData({ ...formData, warehouse: v })}
                  />
                </div>
              ) : deliveryMethod.startsWith('international_') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Input
                    icon={<Globe size={15} />}
                    placeholder="Країна та місто (напр. Poland, Warsaw)…"
                    value={formData.city}
                    onChange={v => setFormData({ ...formData, city: v })}
                  />
                  <Input
                    icon={<Home size={15} />}
                    placeholder="Повна адреса доставки, поштовий індекс (ZIP) або відділення…"
                    value={formData.warehouse}
                    onChange={v => setFormData({ ...formData, warehouse: v })}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '11px 14px',
                  background: 'rgba(147, 162, 250, 0.1)',
                  border: '1px solid rgba(147, 162, 250, 0.28)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <MapPin size={16} color="#93A2FA" />
                  <div style={{ fontSize: 13, color: '#F3F4F8', fontWeight: 500 }}>м. Хмельницький, ТЦ Дитячий світ</div>
                </div>
              )}

              <textarea
                placeholder="Коментар до замовлення (бажаний колір, уточнення)…"
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                style={{
                  width: '100%',
                  height: 76,
                  background: '#181B22',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#F3F4F8',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'none'
                }}
              />

              <button
                type="button"
                onClick={() => setFormData({ ...formData, noCall: !formData.noCall })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: '#181B22',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 10,
                  color: '#F3F4F8',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  border: '1.5px solid #93A2FA',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: formData.noCall ? '#93A2FA' : 'transparent'
                }}>
                  {formData.noCall && <Check size={11} style={{ color: '#13151B', strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Не телефонувати для підтвердження</span>
              </button>
            </div>
          </section>
        </div>

        {/* Sticky Footer Summary */}
        <footer style={{
          position: isKeyboardOpen ? 'relative' : 'sticky',
          bottom: 0,
          padding: '14px 20px 20px',
          background: 'rgba(24, 27, 34, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: '#8D93A5' }}>Доставка:</span>
            <span style={{
              fontWeight: 600,
              color: deliveryMethod === 'pickup' || (!deliveryMethod.startsWith('international_') && total > 3000) ? '#4ADE80' : '#B8BDCB'
            }}>
              {deliveryMethod === 'pickup'
                ? 'Безкоштовно (самовивіз)'
                : deliveryMethod.startsWith('international_')
                  ? 'За тарифами перевізника (міжнародна)'
                  : total > 3000
                    ? 'Безкоштовно (замовлення > 3 000 ₴)'
                    : 'За тарифами перевізника'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: '#8D93A5', fontWeight: 500 }}>Разом до сплати:</span>
            <span style={{ fontSize: 22, color: '#F3F4F8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {total.toFixed(0)} <span style={{ fontSize: 14, color: '#93A2FA', fontWeight: 500 }}>₴</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 11,
              border: 'none',
              background: isSubmitting ? '#2A2F3D' : '#93A2FA',
              color: '#13151B',
              fontWeight: 600,
              fontSize: 14,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? 'Оформлення…' : 'Підтвердити замовлення'}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

function SelectorItem({ active, onClick, icon, title, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '11px 13px',
        borderRadius: 11,
        textAlign: 'left',
        background: active ? 'rgba(147, 162, 250, 0.12)' : '#181B22',
        border: active ? '1px solid rgba(147, 162, 250, 0.42)' : '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        background: active ? 'rgba(147, 162, 250, 0.2)' : '#13151B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? '#93A2FA' : '#8D93A5',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F8' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#8D93A5', marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: `1.5px solid ${active ? '#93A2FA' : 'rgba(255, 255, 255, 0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#93A2FA' }} />}
      </div>
    </button>
  );
}

function Input({ icon, placeholder, value, onChange, onFocus }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8D93A5', pointerEvents: 'none' }}>{icon}</div>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        style={{
          width: '100%',
          height: 38,
          background: '#181B22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          padding: `0 12px 0 ${icon ? 36 : 12}px`,
          color: '#F3F4F8',
          fontSize: 13.5,
          outline: 'none'
        }}
      />
    </div>
  );
}
