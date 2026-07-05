"use client";
import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Truck, Search, User, Phone, MapPin, Home, 
  CheckCircle2, Clock, ClipboardList, Printer, Send, XCircle,
  Coins, Copy, Check, ExternalLink, Loader2, ShoppingBag, 
  ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Reusable platform badges helper
const PLATFORM_META = {
  website: { label: 'Сайт', color: '#3b82f6' },
  olx: { label: 'OLX', color: '#23e5db' },
  instagram: { label: 'Instagram', color: '#f43f5e' },
  facebook: { label: 'Facebook', color: '#1877f2' },
  telegram: { label: 'Telegram', color: '#0ea5e9' },
  tiktok: { label: 'TikTok', color: '#ff0050' },
  offline: { label: 'Магазин (офлайн)', color: '#22c55e' },
  other: { label: 'Інше', color: '#a855f7' }
};

const STATUS_META = {
  new: { label: 'Нове', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  preparing: { label: 'Підготовка', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
  shipping: { label: 'Очікує на відправку', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
  shipped: { label: 'Відправлено поштою', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send },
  completed: { label: 'Виконано', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle }
};

export default function ShippingCabinet({ orders, setOrders, showToast, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['shipping']); // Default to 'shipping'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'nova_poshta' | 'pickup'
  const [savingTtnId, setSavingTtnId] = useState(null);
  const [tempTtn, setTempTtn] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);

  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? (prev.length > 1 ? prev.filter(s => s !== status) : prev) // keep at least one
        : [...prev, status]
    );
  };

  // Main filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by shipping status
      const matchesStatus = selectedStatuses.includes(order.status);
      
      // 2. Filter by delivery method
      const method = order.shipping_method || 'pickup';
      const matchesDelivery = deliveryFilter === 'all' || method === deliveryFilter;
      
      // 3. Filter by search query
      const name = `${order.shipping_details?.firstName || ''} ${order.shipping_details?.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.toLowerCase();
      const phone = `${order.shipping_details?.phone || ''} ${order.customers?.phone || ''}`;
      const num = order.order_number || '';
      const ttn = order.shipping_details?.ttn || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        name.includes(query) || 
        phone.includes(query) || 
        num.toLowerCase().includes(query) ||
        ttn.includes(query);

      return matchesStatus && matchesDelivery && matchesSearch;
    });
  }, [orders, selectedStatuses, deliveryFilter, searchQuery]);

  // Update order status directly in Supabase
  const updateStatus = async (orderId, newStatus) => {
    setStatusChangingId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

      // Trigger client notification
      const customer = order?.customers;
      if (customer?.tg_id) {
        try {
          await fetch('/api/order-status-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg_id: customer.tg_id,
              order_number: order.order_number || order.id,
              status: newStatus,
              total_amount: order.total
            })
          });
        } catch (notifyErr) {
          console.error('Failed to send status notification:', notifyErr);
        }
      }

      // 5% Cashback on completion
      if (newStatus === 'completed' && order.status !== 'completed' && order.customer_id) {
        const cashback = Math.floor(order.total * 0.05);
        if (cashback > 0) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('bonuses')
            .eq('id', order.customer_id)
            .single();

          const currentBonuses = customerData?.bonuses || 0;
          await supabase
            .from('customers')
            .update({ bonuses: currentBonuses + cashback })
            .eq('id', order.customer_id);

          await supabase.from('bonus_history').insert([{
            customer_id: order.customer_id,
            amount: cashback,
            type: 'earn',
            description: `Кешбек 5% за замовлення ${order.order_number || order.id.slice(0,8)}`
          }]);
        }
      }

      // Update parent state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Статус змінено на: ${STATUS_META[newStatus].label}`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`Помилка зміни статусу: ${e.message}`, 'error');
    } finally {
      setStatusChangingId(null);
    }
  };

  // Update TTN tracking code
  const saveTtn = async (orderId) => {
    const ttnValue = tempTtn[orderId]?.trim() || '';
    setSavingTtnId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedDetails = {
        ...(order.shipping_details || {}),
        ttn: ttnValue
      };

      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);

      if (error) throw error;

      // Update parent state
      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      showToast(ttnValue ? 'ТТН успішно збережено' : 'ТТН видалено', 'success');
    } catch (e) {
      console.error(e);
      showToast(`Помилка збереження ТТН: ${e.message}`, 'error');
    } finally {
      setSavingTtnId(null);
    }
  };

  // Copy TTN to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy formatted address details for Nova Poshta
  const copyAddressInfo = (order, id) => {
    const details = order.shipping_details || {};
    const codText = details.is_cod ? `\nНакладений платіж: ${details.cod_amount} ₴` : '\nБез накладного платежу (передплата)';
    const text = `${details.firstName || ''} ${details.lastName || ''}\n${details.phone || ''}\n${details.city || ''}\n${details.warehouse || ''}${codText}`;
    navigator.clipboard.writeText(text);
    setCopiedAddressId(id);
    setTimeout(() => setCopiedAddressId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      
      {/* Top Title */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={28} style={{ color: '#ec4899' }} /> Кабінет Відправок
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Керування доставкою, накладними платежами (наложка) та ТТН кодів пошти</p>
      </div>

      {/* Main filter container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Шукати отримувача, телефон, ТТН чи номер замовлення..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, justifyContent: 'space-between' }}>
          
          {/* Status checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Статус відправки:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(STATUS_META).map(key => {
                const meta = STATUS_META[key];
                const active = selectedStatuses.includes(key);
                const Icon = meta.icon;
                return (
                  <button 
                    key={key}
                    onClick={() => toggleStatusFilter(key)}
                    style={{ 
                      padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                      background: active ? meta.color : 'rgba(255,255,255,0.03)', 
                      color: active ? '#fff' : 'var(--text-muted)', 
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {Icon && <Icon size={12} />}
                    {meta.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Method Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Спосіб доставки:</label>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', alignSelf: 'flex-start' }}>
              {[
                { val: 'all', label: 'Всі' },
                { val: 'nova_poshta', label: 'Нова Пошта' },
                { val: 'pickup', label: 'Самовивіз' }
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => setDeliveryFilter(item.val)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: deliveryFilter === item.val ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent',
                    color: deliveryFilter === item.val ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Shipment Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
            Немає замовлень для відправки за вибраними фільтрами.
          </div>
        ) : (
          filteredOrders.map(order => {
            const details = order.shipping_details || {};
            const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Гість';
            const clientPhone = details.phone || order.customers?.phone || 'Не вказано';
            const ttnValue = details.ttn || '';
            const isCod = !!details.is_cod;
            const codAmount = details.cod_amount || 0;
            const isNovaPoshta = order.shipping_method === 'nova_poshta';
            const platform = order.source || 'website';
            
            // Format tracking URL for Nova Poshta
            const trackingUrl = ttnValue ? `https://novaposhta.ua/tracking/search?cargo_number=${ttnValue}` : '';

            // Handle TTN local value change
            const currentTtnVal = tempTtn[order.id] !== undefined ? tempTtn[order.id] : ttnValue;

            return (
              <div 
                key={order.id}
                style={{ 
                  background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', 
                  padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Platform tag line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 950, color: '#fff' }}>
                      {order.order_number || `#${order.id.slice(0, 8)}`}
                    </span>
                    <span style={{ 
                      fontSize: 10, fontWeight: 900, 
                      color: PLATFORM_META[platform]?.color || PLATFORM_META.other.color,
                      background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 8
                    }}>
                      {PLATFORM_META[platform]?.label || PLATFORM_META.other.label}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  {(() => {
                    const meta = STATUS_META[order.status] || STATUS_META.new;
                    const Icon = meta.icon;
                    return (
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, 
                        background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 6
                      }}>
                        {Icon && <Icon size={12} />}
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: 24 }}>
                  
                  {/* Column 1: Recipient and Destination details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Отримувач та адреса</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#fff' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        {clientName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e2e8f0' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {clientPhone}
                      </div>
                      
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                        <MapPin size={14} style={{ color: '#ec4899', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <strong>{details.city || 'Місто не вказано'}</strong>
                          {isNovaPoshta ? (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                              <Home size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                              {details.warehouse || 'Відділення не вказано'}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: '#2dd4bf', marginTop: 4, fontWeight: 700 }}>
                              Самовивіз (Хмельницький, ТЦ Дитячий світ)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Copy actions */}
                    <button 
                      onClick={() => copyAddressInfo(order, order.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
                        padding: '10px 14px', borderRadius: 12, color: '#fff', fontSize: 12, 
                        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                    >
                      {copiedAddressId === order.id ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                      {copiedAddressId === order.id ? 'Адресу скопійовано!' : 'Копіювати дані для ТТН'}
                    </button>
                  </div>

                  {/* Column 2: Items checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Вироби (склад замовлення)</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14, borderRadius: 16, maxHeight: 180, overflowY: 'auto' }}>
                      {details.items && details.items.length > 0 ? (
                        details.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < details.items.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                            <span style={{ fontSize: 12, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ShoppingBag size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                              {item.name}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', borderRadius: 6 }}>
                              x{item.quantity || 1}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>Немає інформації про товари</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Загальна сума:</span>
                      <span style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>{order.total} ₴</span>
                    </div>
                  </div>

                  {/* Column 3: Payment details, COD & TTN setup */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Оплата та наложка</div>
                    
                    {/* COD / Payment Info block */}
                    {isCod ? (
                      <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', padding: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f97316', fontWeight: 900 }}>
                          <Coins size={14} />
                          НАКЛАДЕНИЙ ПЛАТІЖ (НАЛОЖКА)
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', marginTop: 4 }}>
                          {codAmount} ₴
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 650 }}>
                          Передплата 30% має бути отримана окремо
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#22c55e', fontWeight: 900 }}>
                          <CheckCircle2 size={14} />
                          ПЕРЕДПЛАТА 100%
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                          Без накладеного платежу
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 650 }}>
                          Статус оплати: {order.payment_status === 'paid' ? 'Оплачено' : 'Очікує підтвердження'}
                        </div>
                      </div>
                    )}

                    {/* TTN Input & Tracking */}
                    {isNovaPoshta && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>НОМЕР ТТН НОВОЇ ПОШТИ</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input 
                            type="text" 
                            placeholder="Введіть 14-значний код ТТН" 
                            value={currentTtnVal} 
                            onChange={(e) => setTempTtn({ ...tempTtn, [order.id]: e.target.value })}
                            style={{ 
                              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', 
                              borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none' 
                            }}
                          />
                          <button 
                            onClick={() => saveTtn(order.id)}
                            disabled={savingTtnId === order.id || currentTtnVal === ttnValue}
                            style={{ 
                              padding: '0 12px', background: currentTtnVal === ttnValue ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                              border: 'none', borderRadius: 10, color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            {savingTtnId === order.id ? <Loader2 size={14} className="animate-spin" /> : 'ЗБЕРЕГТИ'}
                          </button>
                        </div>
                        
                        {/* If TTN exists, render copy and tracking links */}
                        {ttnValue && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button 
                              onClick={() => copyToClipboard(ttnValue, order.id)}
                              style={{ 
                                flex: 1, padding: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: 8, color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 
                              }}
                            >
                              {copiedId === order.id ? <Check size={10} style={{ color: '#22c55e' }} /> : <Copy size={10} />}
                              {copiedId === order.id ? 'Скопійовано' : 'Копіювати ТТН'}
                            </button>
                            <a 
                              href={trackingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                flex: 1, padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
                                borderRadius: 8, color: '#ef4444', fontSize: 10, fontWeight: 900, textAlign: 'center',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none'
                              }}
                            >
                              Відстежити <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Bottom Quick Status Transition Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 8 }}>Швидкі дії:</span>
                  
                  {order.status !== 'preparing' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'preparing')}
                      disabled={statusChangingId === order.id}
                      style={{ 
                        padding: '8px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', 
                        color: '#f59e0b', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <ClipboardList size={12} /> Почати підготовку
                    </button>
                  )}

                  {order.status !== 'shipping' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'shipping')}
                      disabled={statusChangingId === order.id}
                      style={{ 
                        padding: '8px 14px', borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', 
                        color: '#ec4899', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Truck size={12} /> Готово до відправки
                    </button>
                  )}

                  {order.status !== 'shipped' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'shipped')}
                      disabled={statusChangingId === order.id}
                      style={{ 
                        padding: '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', 
                        color: '#10b981', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Send size={12} /> Відправлено поштою (ТТН)
                    </button>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      disabled={statusChangingId === order.id}
                      style={{ 
                        padding: '8px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', 
                        color: '#22c55e', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <CheckCircle2 size={12} /> Завершити замовлення
                    </button>
                  )}

                  {statusChangingId === order.id && (
                    <Loader2 size={16} className="animate-spin" style={{ color: '#fff', marginLeft: 8 }} />
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
