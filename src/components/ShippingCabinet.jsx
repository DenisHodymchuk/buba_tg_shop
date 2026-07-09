"use client";
import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Truck, Search, User, Phone, MapPin, Home, 
  CheckCircle2, Clock, ClipboardList, Printer, Send, XCircle,
  Coins, Copy, Check, ExternalLink, Loader2, ShoppingBag, 
  ArrowRight, RefreshCw, ChevronDown, ChevronUp, Star
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
  threads: { label: 'Threads', color: '#ffffff' },
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
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'nova_poshta' | 'pickup'
  const [savingTtnId, setSavingTtnId] = useState(null);
  const [tempTtn, setTempTtn] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);

  const toggleExpand = (orderId) => {
    setExpandedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // Main filter logic (only show active/non-completed/non-cancelled orders) and sorting (priority first, then created_at desc)
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      // 1. Filter out completed, cancelled, and shipped orders
      const matchesStatus = order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'shipped';
      
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

    // Sort: priority first, then created_at descending (newest first)
    return filtered.sort((a, b) => {
      const aPriority = a.shipping_details?.is_priority ? 1 : 0;
      const bPriority = b.shipping_details?.is_priority ? 1 : 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, deliveryFilter, searchQuery]);

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

  // Toggle order priority status (stored in shipping_details.is_priority)
  const togglePriority = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const currentPriority = !!order.shipping_details?.is_priority;
      const updatedDetails = {
        ...(order.shipping_details || {}),
        is_priority: !currentPriority
      };

      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);

      if (error) throw error;

      // Update parent state
      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      showToast(
        !currentPriority ? 'Замовлення додано в пріоритет' : 'Замовлення вилучено з пріоритету', 
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(`Помилка оновлення пріоритету: ${err.message}`, 'error');
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

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', width: '100%' }}>
          
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

          {/* Expand/Collapse Actions */}
          <div style={{ display: 'flex', gap: 8, alignSelf: isMobile ? 'flex-start' : 'flex-end', marginTop: isMobile ? -4 : 0 }}>
            <button
              onClick={() => setExpandedOrderIds(filteredOrders.map(o => o.id))}
              style={{
                padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              Розгорнути всі
            </button>
            <button
              onClick={() => setExpandedOrderIds([])}
              style={{
                padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              Згорнути всі
            </button>
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

            const isExpanded = expandedOrderIds.includes(order.id);

            return (
              <div 
                key={order.id}
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: isMobile ? 18 : 24, 
                  border: details.is_priority ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid var(--border)', 
                  padding: isMobile ? 16 : 24, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isMobile && !isExpanded ? 0 : (isMobile ? 16 : 20),
                  position: 'relative', 
                  overflow: 'hidden',
                  boxShadow: details.is_priority ? '0 0 16px rgba(251, 191, 36, 0.05)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {/* Clickable Header/Summary block */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  {/* Row 1: Order details & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={(e) => togglePriority(order.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={details.is_priority ? "Прибрати з пріоритету" : "Зробити пріоритетним"}
                      >
                        <Star 
                          size={16} 
                          fill={details.is_priority ? "#fbbf24" : "transparent"} 
                          stroke={details.is_priority ? "#fbbf24" : "var(--text-muted)"}
                          style={{
                            opacity: details.is_priority ? 1 : 0.3,
                            transition: 'all 0.2s'
                          }}
                        />
                      </button>
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
                      {details.notes && (
                        <span style={{ 
                          fontSize: 9, fontWeight: 900, 
                          color: '#fbbf24', background: 'rgba(245,158,11,0.1)',
                          padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)'
                        }}>
                          ⚠️ УТОЧНЕННЯ
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

                      {/* Chevron Toggle Icon */}
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {/* Row 2: Customer Name and Destination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 750, color: '#e2e8f0' }}>
                      {clientName} {clientPhone ? `(${clientPhone})` : ''}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 650, color: '#ec4899' }}>
                      {details.city || 'Самовивіз'}
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                      {details.notes && (
                        <div style={{ 
                          padding: '10px 14px', borderRadius: 12, 
                          background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)',
                          color: '#fbbf24', fontSize: 12, fontWeight: 750, display: 'flex', gap: 6, alignItems: 'center'
                        }}>
                          <span>⚠️ <strong>Уточнення:</strong> {details.notes}</span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: isMobile ? 14 : 24 }}>
                        
                        {/* Column 1: Recipient and Destination details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Отримувач та адреса</div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.15)', padding: isMobile ? 12 : 14, borderRadius: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                {clientName}
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(clientName); showToast("Ім'я скопійовано"); }}
                                style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                title="Скопіювати ім'я"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e2e8f0' }}>
                                <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                                {clientPhone}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <a 
                                  href={`tel:${clientPhone}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ background: 'rgba(34,197,94,0.1)', border: 'none', color: '#22c55e', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                  title="Подзвонити"
                                >
                                  <Phone size={12} />
                                </a>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(clientPhone); showToast("Телефон скопійовано"); }}
                                  style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                  title="Скопіювати телефон"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                              <MapPin size={14} style={{ color: '#ec4899', marginTop: 2, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <strong>{details.city || 'Місто не вказано'}</strong>
                                  {details.city && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(details.city); showToast("Місто скопійовано"); }}
                                      style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                      title="Скопіювати місто"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  )}
                                </div>
                                {isNovaPoshta ? (
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                    <Home size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                      <span>{details.warehouse || 'Відділення не вказано'}</span>
                                      {details.warehouse && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(details.warehouse); showToast("Відділення скопійовано"); }}
                                          style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', marginLeft: 4 }}
                                          title="Скопіювати відділення"
                                        >
                                          <Copy size={10} />
                                        </button>
                                      )}
                                    </div>
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
                            onClick={(e) => { e.stopPropagation(); copyAddressInfo(order, order.id); }}
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
                              {(() => {
                                const totalVal = parseFloat(order.total || 0);
                                const codVal = parseFloat(codAmount || 0);
                                const prepaymentVal = Math.max(0, totalVal - codVal);
                                const prepaymentPct = totalVal > 0 ? Math.round((prepaymentVal / totalVal) * 100) : 0;
                                return (
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 650, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span>Передплата ({prepaymentPct}% — {prepaymentVal} ₴):</span>
                                    <strong style={{ 
                                      color: order.payment_status === 'partially_paid' || order.payment_status === 'paid' ? '#22c55e' : '#f59e0b',
                                      fontSize: 11
                                    }}>
                                      {order.payment_status === 'partially_paid' ? 'Оплачено частково ✅' : order.payment_status === 'paid' ? 'Оплачено повністю ✅' : 'Очікує оплати ⏳'}
                                    </strong>
                                  </div>
                                );
                              })()}
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
                                Статус оплати: <strong style={{ color: order.payment_status === 'paid' ? '#22c55e' : order.payment_status === 'partially_paid' ? '#38bdf8' : order.payment_status === 'verifying' ? '#f97316' : '#f59e0b' }}>
                                  {order.payment_status === 'paid' ? 'Оплачено' : order.payment_status === 'partially_paid' ? 'Частково оплачено' : order.payment_status === 'verifying' ? 'Перевірка' : 'Очікує'}
                                </strong>
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
                                  onClick={(e) => { e.stopPropagation(); saveTtn(order.id); }}
                                  disabled={savingTtnId === order.id || currentTtnVal === ttnValue}
                                  style={{ 
                                    padding: isMobile ? '0 10px' : '0 12px', background: currentTtnVal === ttnValue ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                                    border: 'none', borderRadius: 10, color: '#fff', fontSize: isMobile ? 9 : 10, fontWeight: 900, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  {savingTtnId === order.id ? <Loader2 size={14} className="animate-spin" /> : (isMobile ? 'OK' : 'ЗБЕРЕГТИ')}
                                </button>
                              </div>
                              
                              {/* If TTN exists, render copy and tracking links */}
                              {ttnValue && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(ttnValue, order.id); }}
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
                                    onClick={(e) => e.stopPropagation()}
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
                      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: isMobile ? 4 : 8 }}>Швидкі дії:</span>
                        
                        {order.status !== 'preparing' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'preparing'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', 
                              color: '#f59e0b', fontSize: isMobile ? 10 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <ClipboardList size={isMobile ? 10 : 12} /> {isMobile ? 'В роботу' : 'Почати підготовку'}
                          </button>
                        )}

                        {order.status !== 'shipping' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'shipping'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', 
                              color: '#ec4899', fontSize: isMobile ? 10 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Truck size={isMobile ? 10 : 12} /> {isMobile ? 'Готово' : 'Готово до відправки'}
                          </button>
                        )}

                        {order.status !== 'shipped' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'shipped'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', 
                              color: '#10b981', fontSize: isMobile ? 10 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Send size={isMobile ? 10 : 12} /> {isMobile ? 'Відправлено' : 'Відправлено поштою (ТТН)'}
                          </button>
                        )}

                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', 
                              color: '#22c55e', fontSize: isMobile ? 10 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <CheckCircle2 size={isMobile ? 10 : 12} /> {isMobile ? 'Виконати' : 'Завершити замовлення'}
                          </button>
                        )}

                        {statusChangingId === order.id && (
                          <Loader2 size={16} className="animate-spin" style={{ color: '#fff', marginLeft: 8 }} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
