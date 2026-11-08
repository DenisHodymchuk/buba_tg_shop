"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { novaPoshta } from '@/lib/novaposhta';
import { 
  Truck, Search, User, Phone, MapPin, Home, 
  CheckCircle2, Clock, ClipboardList, Printer, Send, XCircle,
  Coins, Copy, Check, ExternalLink, Loader2, ShoppingBag, 
  ChevronDown, ChevronUp, Star, Palette, Edit3, X, MessageSquare, Sparkles, PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMeta, formatCleanPhoneForCopy } from '@/lib/orderHelpers';

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
  new: { label: 'Нове', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Clock },
  preparing: { label: 'Підготовка', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: ClipboardList },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: Printer },
  painting: { label: 'Розфарбовується', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Palette },
  shipping: { label: 'Готово до відправки', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', icon: Truck },
  shipped: { label: 'Відправлено поштою', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: Send },
  completed: { label: 'Виконано', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle }
};

export default function ShippingCabinet({ orders, setOrders, showToast, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageTab, setStageTab] = useState('all_active'); // 'ready' | 'in_work' | 'shipped' | 'all_active' | 'completed'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'nova_poshta' | 'ukrposhta' | 'pickup'
  const [savingTtnId, setSavingTtnId] = useState(null);
  const [tempTtn, setTempTtn] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);

  // Quick Edit Shipping Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    shipping_method: 'nova_poshta',
    city: '',
    cityRef: '',
    warehouse: '',
    payment_status: 'pending',
    is_cod: false,
    cod_amount: '',
    notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [npCityQuery, setNpCityQuery] = useState('');
  const [npCities, setNpCities] = useState([]);
  const [npLoadingCities, setNpLoadingCities] = useState(false);
  const [npShowCities, setNpShowCities] = useState(false);
  const [npWarehouses, setNpWarehouses] = useState([]);
  const [npWarehouseQuery, setNpWarehouseQuery] = useState('');
  const [npLoadingWarehouses, setNpLoadingWarehouses] = useState(false);
  const [npShowWarehouses, setNpShowWarehouses] = useState(false);

  useEffect(() => {
    if (!editingOrder) return;
    const timer = setTimeout(async () => {
      if (npCityQuery.length >= 2 && npCityQuery !== editForm.city) {
        setNpLoadingCities(true);
        const data = await novaPoshta.getCities(npCityQuery);
        setNpCities(data);
        setNpLoadingCities(false);
        setNpShowCities(true);
      } else {
        setNpCities([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [npCityQuery, editForm.city, editingOrder]);

  useEffect(() => {
    if (!editingOrder) return;
    async function fetchWh() {
      if (editForm.cityRef) {
        setNpLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(editForm.cityRef);
        setNpWarehouses(data);
        setNpLoadingWarehouses(false);
      } else {
        setNpWarehouses([]);
      }
    }
    fetchWh();
  }, [editForm.cityRef, editingOrder]);

  const npFilteredWarehouses = useMemo(() => {
    if (!npWarehouses || !Array.isArray(npWarehouses)) return [];
    if (!npWarehouseQuery || npWarehouseQuery === editForm.warehouse) return npWarehouses;
    return npWarehouses.filter(w =>
      w?.Description && String(w.Description).toLowerCase().includes(String(npWarehouseQuery).toLowerCase())
    );
  }, [npWarehouses, npWarehouseQuery, editForm.warehouse]);

  const openEditModal = (order, e) => {
    if (e) e.stopPropagation();
    const details = order.shipping_details || {};
    const firstName = details.firstName || order.customers?.first_name || '';
    const lastName = details.lastName || order.customers?.last_name || '';
    const phone = details.phone || order.customers?.phone || '';
    setEditingOrder(order);
    setEditForm({
      firstName,
      lastName,
      phone,
      shipping_method: order.shipping_method || (details.city && details.city !== 'Самовивіз' ? 'nova_poshta' : 'pickup'),
      city: details.city || '',
      cityRef: details.cityRef || '',
      warehouse: details.warehouse || '',
      payment_status: order.payment_status || 'pending',
      is_cod: !!details.is_cod,
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || ''
    });
    setNpCityQuery(details.city || '');
    setNpWarehouseQuery(details.warehouse || '');
  };

  const saveEditedShipping = async (e) => {
    e.preventDefault();
    if (!editingOrder || !supabase) return;
    setSavingEdit(true);
    try {
      const updatedDetails = {
        ...(editingOrder.shipping_details || {}),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        city: editForm.shipping_method === 'pickup' ? 'Самовивіз' : editForm.city.trim(),
        cityRef: editForm.shipping_method === 'nova_poshta' ? editForm.cityRef : '',
        warehouse: editForm.shipping_method === 'pickup' ? '' : editForm.warehouse.trim(),
        is_cod: editForm.is_cod,
        cod_amount: editForm.is_cod ? (parseFloat(editForm.cod_amount) || 0) : 0,
        notes: editForm.notes.trim()
      };

      const updatePayload = {
        shipping_method: editForm.shipping_method,
        payment_status: editForm.payment_status,
        shipping_details: updatedDetails
      };

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', editingOrder.id);

      if (error) throw error;

      setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, ...updatePayload } : o));
      showToast('Дані доставки оновлено ✅', 'success');
      setEditingOrder(null);
    } catch (err) {
      console.error(err);
      showToast(`Помилка збереження: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts = { ready: 0, in_work: 0, shipped: 0, all_active: 0, completed: 0 };
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      if (o.status === 'shipping') {
        counts.ready++;
        counts.all_active++;
      } else if (['new', 'preparing', 'printing', 'painting'].includes(o.status)) {
        counts.in_work++;
        counts.all_active++;
      } else if (o.status === 'shipped') {
        counts.shipped++;
      } else if (o.status === 'completed') {
        counts.completed++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      if (order.status === 'cancelled') return false;

      let matchesStage = false;
      if (stageTab === 'ready') {
        matchesStage = order.status === 'shipping';
      } else if (stageTab === 'in_work') {
        matchesStage = ['new', 'preparing', 'printing', 'painting'].includes(order.status);
      } else if (stageTab === 'shipped') {
        matchesStage = order.status === 'shipped';
      } else if (stageTab === 'completed') {
        matchesStage = order.status === 'completed';
      } else {
        // all_active: ready + in_work
        matchesStage = order.status !== 'completed' && order.status !== 'shipped';
      }

      const method = order.shipping_method || 'pickup';
      const matchesDelivery = deliveryFilter === 'all' || method === deliveryFilter;

      const details = order.shipping_details || {};
      const name = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.toLowerCase();
      const phone = `${details.phone || ''} ${order.customers?.phone || ''}`;
      const num = order.order_number || '';
      const ttn = details.ttn || '';
      const city = (details.city || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        name.includes(query) || 
        phone.includes(query) || 
        num.toLowerCase().includes(query) ||
        ttn.includes(query) ||
        city.includes(query);

      return matchesStage && matchesDelivery && matchesSearch;
    });

    // Sort: priority first, then "shipping" (ready to ship) first, then newest
    return filtered.sort((a, b) => {
      const aPriority = a.shipping_details?.is_priority ? 1 : 0;
      const bPriority = b.shipping_details?.is_priority ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      const aReady = a.status === 'shipping' ? 1 : 0;
      const bReady = b.status === 'shipping' ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, stageTab, deliveryFilter, searchQuery]);

  const updateStatus = async (orderId, newStatus, customTtn) => {
    setStatusChangingId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.payment_status = 'paid';
      }

      let updatedDetails = order?.shipping_details || {};
      if (customTtn !== undefined) {
        updatedDetails = { ...updatedDetails, ttn: customTtn };
        updateData.shipping_details = updatedDetails;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;

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
              total_amount: order.total,
              ttn: customTtn || updatedDetails?.ttn || undefined
            })
          });
        } catch (notifyErr) {
          console.error('Failed to send status notification:', notifyErr);
        }
      }

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

      setOrders(orders.map(o => o.id === orderId ? { 
        ...o, 
        ...updateData
      } : o));
      showToast(`Статус змінено на: ${STATUS_META[newStatus]?.label || newStatus}`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`Помилка зміни статусу: ${e.message}`, 'error');
    } finally {
      setStatusChangingId(null);
    }
  };

  const saveTtn = async (orderId, andMarkShipped = false) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const rawVal = tempTtn[orderId] !== undefined ? tempTtn[orderId] : (order.shipping_details?.ttn || '');
    const ttnValue = rawVal.replace(/\s+/g, '').trim();

    if (andMarkShipped) {
      await updateStatus(orderId, 'shipped', ttnValue);
      return;
    }

    setSavingTtnId(orderId);
    try {
      const updatedDetails = {
        ...(order.shipping_details || {}),
        ttn: ttnValue
      };

      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      showToast(ttnValue ? 'ТТН успішно збережено ✅' : 'ТТН видалено', 'success');
    } catch (e) {
      console.error(e);
      showToast(`Помилка збереження ТТН: ${e.message}`, 'error');
    } finally {
      setSavingTtnId(null);
    }
  };

  const toggleItemManufactured = async (orderId, itemIndex) => {
    if (!supabase) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const details = order.shipping_details || {};
    const items = Array.isArray(details.items) ? [...details.items] : [];
    if (!items[itemIndex]) return;

    items[itemIndex] = { ...items[itemIndex], is_manufactured: !items[itemIndex].is_manufactured };
    const updatedDetails = { ...details, items };

    try {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
    } catch (e) {
      showToast('Помилка оновлення статусу виробу', 'error');
    }
  };

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

      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      showToast(
        !currentPriority ? 'Замовлення додано в пріоритет ⭐' : 'Замовлення вилучено з пріоритету', 
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(`Помилка оновлення пріоритету: ${err.message}`, 'error');
    }
  };

  const copyToClipboard = (text, id, toastText) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    if (toastText) showToast(toastText);
  };

  const copyAddressInfo = (order, id) => {
    const details = order.shipping_details || {};
    const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim();
    const phone = formatCleanPhoneForCopy(details.phone || order.customers?.phone || '');
    const codText = details.is_cod ? `\nНакладений платіж: ${details.cod_amount} ₴` : '\nБез накладного платежу (оплачено)';
    const text = `${clientName}\n${phone}\n${details.city || ''}\n${details.warehouse || ''}${codText}`;
    navigator.clipboard.writeText(text);
    setCopiedAddressId(id);
    showToast('Всі дані для ТТН скопійовано 📋');
    setTimeout(() => setCopiedAddressId(null), 2000);
  };

  const copyClientTtnMessage = (order, ttn) => {
    const details = order.shipping_details || {};
    const firstName = details.firstName || order.customers?.first_name || '';
    const codLine = details.is_cod && details.cod_amount > 0 ? `\n💰 До сплати при отриманні (наложка): ${details.cod_amount} ₴` : '';
    const msg = `Привіт${firstName ? `, ${firstName}` : ''}! Ваше замовлення відправлено 🚀\n\n📦 Номер ТТН Нової Пошти: ${ttn}${codLine}\n\nДякуємо, що обрали BUBA Store! 💜`;
    navigator.clipboard.writeText(msg);
    setCopiedMsgId(order.id);
    showToast('Повідомлення з ТТН для клієнта скопійовано! 💬');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', paddingBottom: isMobile ? 75 : 0 }}>
      
      {/* Top Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={isMobile ? 24 : 28} style={{ color: '#ec4899' }} /> Кабінет Відправок
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Пакування виробів, швидке копіювання реквізитів, ТТН та контроль посилок у дорозі
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setExpandedOrderIds(filteredOrders.map(o => o.id))}
            style={{
              padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)'
            }}
          >
            Розгорнути всі
          </button>
          <button
            onClick={() => setExpandedOrderIds([])}
            style={{
              padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)'
            }}
          >
            Згорнути всі
          </button>
        </div>
      </div>

      {/* Stage Tabs (Ready / In Work / Shipped / All Active / Completed) */}
      <div 
        className="hide-scrollbar"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
      >
        {[
          { id: 'all_active', label: 'Всі до відправки', count: stageCounts.all_active, color: '#a78bfa' },
          { id: 'ready', label: '🔥 Готові пакувати', count: stageCounts.ready, color: '#ec4899' },
          { id: 'in_work', label: '🔨 В роботі', count: stageCounts.in_work, color: '#3b82f6' },
          { id: 'shipped', label: '🚀 В дорозі (ТТН)', count: stageCounts.shipped, color: '#10b981' },
          { id: 'completed', label: '✅ Отримані', count: stageCounts.completed, color: '#22c55e' }
        ].map(tab => {
          const active = stageTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStageTab(tab.id)}
              style={{
                padding: isMobile ? '9px 12px' : '10px 16px',
                borderRadius: 14,
                border: active ? `1px solid ${tab.color}` : '1px solid var(--border)',
                background: active ? `${tab.color}20` : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text-muted)',
                fontSize: isMobile ? 11.5 : 12.5,
                fontWeight: 850,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                padding: '2px 7px',
                borderRadius: 8,
                fontSize: 10.5,
                fontWeight: 900,
                background: active ? tab.color : 'rgba(255,255,255,0.06)',
                color: active ? '#fff' : 'var(--text-muted)'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Delivery Method Filter Bar */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: isMobile ? 12 : 16, alignItems: isMobile ? 'stretch' : 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Пошук отримувача, телефону, міста, ТТН..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
          {searchQuery && (
            <X size={15} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
          )}
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', overflowX: 'auto' }}>
          {[
            { val: 'all', label: 'Всі' },
            { val: 'nova_poshta', label: 'Нова Пошта' },
            { val: 'ukrposhta', label: 'Укрпошта' },
            { val: 'pickup', label: 'Самовивіз' }
          ].map(item => (
            <button
              key={item.val}
              onClick={() => setDeliveryFilter(item.val)}
              style={{
                flex: isMobile ? 1 : 'initial',
                padding: '7px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                background: deliveryFilter === item.val ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent',
                color: deliveryFilter === item.val ? '#fff' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipment Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
            Немає замовлень у цій вкладці за вибраними фільтрами.
          </div>
        ) : (
          filteredOrders.map(order => {
            const details = order.shipping_details || {};
            const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Гість';
            const clientPhone = details.phone || order.customers?.phone || '';
            const cleanPhone = formatCleanPhoneForCopy(clientPhone);
            const ttnValue = details.ttn || '';
            const isCod = !!details.is_cod;
            const codAmount = details.cod_amount || 0;
            const isPickup = order.shipping_method === 'pickup' || details.city === 'Самовивіз';
            const platform = order.source || 'website';
            const items = Array.isArray(details.items) ? details.items : [];
            
            const trackingUrl = ttnValue ? `https://novaposhta.ua/tracking/?cargo_number=${ttnValue}` : '';
            const currentTtnVal = tempTtn[order.id] !== undefined ? tempTtn[order.id] : ttnValue;
            const isExpanded = expandedOrderIds.includes(order.id);
            const isReadyToShip = order.status === 'shipping';

            return (
              <div 
                key={order.id}
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: isMobile ? 18 : 22, 
                  border: details.is_priority 
                    ? '1.5px solid rgba(251, 191, 36, 0.45)' 
                    : isReadyToShip 
                      ? '1.5px solid rgba(236, 72, 153, 0.35)' 
                      : '1px solid var(--border)', 
                  padding: isMobile ? 14 : 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isExpanded ? 14 : 10,
                  position: 'relative', 
                  overflow: 'hidden',
                  boxShadow: details.is_priority ? '0 0 18px rgba(251, 191, 36, 0.08)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {/* Clickable Header/Summary block */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  {/* Row 1: Priority, Number, Platform, COD badge, Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => togglePriority(order.id, e)}
                        style={{
                          background: 'transparent', border: 'none', padding: 2, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title={details.is_priority ? "Прибрати з пріоритету" : "Зробити пріоритетним"}
                      >
                        <Star 
                          size={16} 
                          fill={details.is_priority ? "#fbbf24" : "transparent"} 
                          stroke={details.is_priority ? "#fbbf24" : "var(--text-muted)"}
                          style={{ opacity: details.is_priority ? 1 : 0.4 }}
                        />
                      </button>

                      <span style={{ fontSize: 12, fontWeight: 950, color: '#fff', fontFamily: 'monospace' }}>
                        {order.order_number ? order.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${order.id.slice(0, 8)}`}
                      </span>

                      <span style={{ 
                        fontSize: 10, fontWeight: 900, 
                        color: PLATFORM_META[platform]?.color || PLATFORM_META.other.color,
                        background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 7
                      }}>
                        {PLATFORM_META[platform]?.label || PLATFORM_META.other.label}
                      </span>

                      {isCod ? (
                        <span style={{
                          fontSize: 10, fontWeight: 900, color: '#f97316',
                          background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
                          padding: '3px 8px', borderRadius: 7
                        }}>
                          💰 Наложка: {codAmount} ₴
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 900, color: order.payment_status === 'paid' ? '#22c55e' : '#fbbf24',
                          background: order.payment_status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          padding: '3px 8px', borderRadius: 7
                        }}>
                          {order.payment_status === 'paid' ? '✅ Оплачено' : '⏳ Очікує оплати'}
                        </span>
                      )}

                      {ttnValue && (
                        <span style={{
                          fontSize: 10, fontWeight: 900, color: '#10b981',
                          background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 7, fontFamily: 'monospace'
                        }}>
                          ТТН: {ttnValue}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(order, e)}
                        title="Редагувати дані доставки"
                        style={{
                          padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800
                        }}
                      >
                        <Edit3 size={12} /> {!isMobile && 'Змінити'}
                      </button>

                      {(() => {
                        const meta = STATUS_META[order.status] || STATUS_META.new;
                        const Icon = meta.icon;
                        return (
                          <span style={{ 
                            padding: '4px 9px', borderRadius: 8, fontSize: 10, fontWeight: 900, 
                            background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 5
                          }}>
                            {Icon && <Icon size={12} />}
                            {meta.label}
                          </span>
                        );
                      })()}
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {/* Row 2: Recipient Name, Phone & City/Warehouse */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                        {clientName}
                      </div>
                      {clientPhone && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {clientPhone}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', maxWidth: isMobile ? '100%' : '55%' }}>
                      <div style={{ fontSize: 12, fontWeight: 850, color: '#ec4899' }}>
                        {details.city || 'Самовивіз'}
                      </div>
                      {details.warehouse && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 240 : 340 }}>
                          {details.warehouse}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsed Quick Items + Colors + Notes Preview */}
                  {!isExpanded && (items.length > 0 || details.notes) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                      {items.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {items.map((item, idx) => {
                            const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                            const itemNote = item.item_note || item.color_details || item.note || '';
                            return (
                              <span key={idx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
                                background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.05)',
                                padding: '3px 8px', borderRadius: 8, fontSize: 11, color: '#e2e8f0', fontWeight: 700
                              }}>
                                {item.is_manufactured && <Check size={11} style={{ color: '#2dd4bf' }} />}
                                <span>{item.name} <strong style={{ color: '#a78bfa' }}>x{item.quantity || 1}</strong></span>
                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 5 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                      {cMeta.label}
                                    </span>
                                  );
                                })}
                                {itemNote && <span style={{ fontSize: 10, color: '#38bdf8' }}>({itemNote})</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {details.notes && (
                        <div style={{ fontSize: 11, fontWeight: 750, color: '#fbbf24', background: 'rgba(245,158,11,0.08)', padding: '4px 8px', borderRadius: 8, alignSelf: 'flex-start' }}>
                          ⚠️ {details.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 1-Tap Quick Copy Bar for Mobile / Desktop (always accessible when creating TTN!) */}
                {!isPickup && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {cleanPhone && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(cleanPhone, null, `Телефон скопійовано: ${cleanPhone}`)}
                        style={{
                          padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(167,139,250,0.25)',
                          background: 'rgba(124,58,237,0.1)', color: '#ddd6fe', fontSize: 11, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Copy size={11} /> Тел: {cleanPhone}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(clientName, null, `ПІБ скопійовано: ${clientName}`)}
                      style={{
                        padding: '6px 10px', borderRadius: 9, border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                      }}
                    >
                      <Copy size={11} /> ПІБ
                    </button>
                    {details.city && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${details.city}${details.warehouse ? `, ${details.warehouse}` : ''}`, null, 'Адресу скопійовано')}
                        style={{
                          padding: '6px 10px', borderRadius: 9, border: '1px solid var(--border)',
                          background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: 11, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Copy size={11} /> Адреса
                      </button>
                    )}
                    {isCod && codAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(codAmount), null, `Суму наложки (${codAmount} ₴) скопійовано`)}
                        style={{
                          padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(249,115,22,0.3)',
                          background: 'rgba(249,115,22,0.1)', color: '#fdba74', fontSize: 11, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Copy size={11} /> Наложка: {codAmount} ₴
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyAddressInfo(order, order.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(45,212,191,0.3)',
                        background: 'rgba(45,212,191,0.08)', color: '#2dd4bf', fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto'
                      }}
                    >
                      {copiedAddressId === order.id ? <Check size={11} /> : <Copy size={11} />}
                      Всі дані
                    </button>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                      {details.notes && (
                        <div style={{ 
                          padding: '10px 14px', borderRadius: 12, 
                          background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.35)',
                          color: '#fbbf24', fontSize: 12, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center'
                        }}>
                          <span>⚠️ <strong>Уточнення до замовлення:</strong> {details.notes}</span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1.2fr 1.1fr', gap: isMobile ? 14 : 20 }}>
                        
                        {/* Column 1: Recipient and Destination details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Отримувач та адреса</span>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(order, e)}
                              style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit3 size={11} /> Редагувати
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                {clientName}
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(clientName, null, "Ім'я скопійовано"); }}
                                style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4 }}
                              >
                                <Copy size={13} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e2e8f0' }}>
                                <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                                {clientPhone || 'Не вказано'}
                              </div>
                              {clientPhone && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <a 
                                    href={`tel:${clientPhone}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 10, fontWeight: 800 }}
                                  >
                                    <Phone size={11} /> Дзвінок
                                  </a>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(cleanPhone, null, "Телефон скопійовано"); }}
                                    style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4 }}
                                  >
                                    <Copy size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0' }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                              <MapPin size={14} style={{ color: '#ec4899', marginTop: 2, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <strong>{details.city || 'Місто не вказано'}</strong>
                                  {details.city && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(details.city, null, "Місто скопійовано"); }}
                                      style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4 }}
                                    >
                                      <Copy size={12} />
                                    </button>
                                  )}
                                </div>
                                {!isPickup ? (
                                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <span>{details.warehouse || 'Відділення не вказано'}</span>
                                    {details.warehouse && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(details.warehouse, null, "Відділення скопійовано"); }}
                                        style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                                      >
                                        <Copy size={12} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: '#2dd4bf', marginTop: 4, fontWeight: 700 }}>
                                    Самовивіз (Хмельницький)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Items checklist with Colors & Clarifications */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Вироби для пакування ({items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0)} шт)
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', padding: 12, borderRadius: 16, maxHeight: 240, overflowY: 'auto' }}>
                            {items.length > 0 ? (
                              items.map((item, idx) => {
                                const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                                const itemNote = item.item_note || item.color_details || item.note || '';
                                const isDone = !!item.is_manufactured;

                                return (
                                  <div 
                                    key={idx} 
                                    style={{ 
                                      display: 'flex', flexDirection: 'column', gap: 5, 
                                      padding: '8px 10px', borderRadius: 10,
                                      background: isDone ? 'rgba(45,212,191,0.06)' : 'rgba(255,255,255,0.02)',
                                      border: isDone ? '1px solid rgba(45,212,191,0.2)' : '1px solid rgba(255,255,255,0.04)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <div 
                                        onClick={() => toggleItemManufactured(order.id, idx)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}
                                      >
                                        <div style={{
                                          width: 17, height: 17, borderRadius: 5,
                                          border: isDone ? 'none' : '2px solid var(--text-muted)',
                                          background: isDone ? '#2dd4bf' : 'transparent',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                          {isDone && <Check size={12} style={{ color: '#000', fontWeight: 900 }} />}
                                        </div>
                                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>
                                          {item.name}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 900, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                                        x{item.quantity || 1}
                                      </span>
                                    </div>

                                    {/* Item Colors */}
                                    {itemColors.length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 25 }}>
                                        {itemColors.map((cName, cIdx) => {
                                          const cMeta = getColorMeta(cName);
                                          return (
                                            <span key={cIdx} style={{
                                              display: 'inline-flex', alignItems: 'center', gap: 4,
                                              fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
                                              background: 'rgba(255,255,255,0.07)', color: '#fff',
                                              border: '1px solid rgba(255,255,255,0.12)'
                                            }}>
                                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: `1px solid ${cMeta.border || '#fff'}` }} />
                                              {cMeta.label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Item Note */}
                                    {itemNote && (
                                      <div style={{ paddingLeft: 25, fontSize: 11, color: '#38bdf8', fontWeight: 750 }}>
                                        🎨 {itemNote}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>Немає інформації про товари</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Загальна сума замовлення:</span>
                            <span style={{ fontSize: 15, fontWeight: 950, color: '#2dd4bf' }}>{order.total} ₴</span>
                          </div>
                        </div>

                        {/* Column 3: Payment details, COD & TTN setup */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Оплата та ТТН пошти</div>
                          
                          {isCod ? (
                            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', padding: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f97316', fontWeight: 900 }}>
                                  <Coins size={14} />
                                  НАКЛАДЕНИЙ ПЛАТІЖ
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(String(codAmount), null, 'Суму наложки скопійовано')}
                                  style={{ background: 'rgba(249,115,22,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Копіювати
                                </button>
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 950, color: '#fff', marginTop: 2 }}>
                                {codAmount} ₴
                              </div>
                              {(() => {
                                const totalVal = parseFloat(order.total || 0);
                                const codVal = parseFloat(codAmount || 0);
                                const prepaymentVal = Math.max(0, totalVal - codVal);
                                return (
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
                                    {prepaymentVal > 0 ? (
                                      <span>Передоплата: <strong style={{ color: '#22c55e' }}>{prepaymentVal} ₴</strong> (залишок {codVal} ₴ на пошті)</span>
                                    ) : (
                                      <span style={{ color: '#fbbf24' }}>Повна післяплата на пошті (без передоплати)</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#22c55e', fontWeight: 900 }}>
                                <CheckCircle2 size={14} />
                                БЕЗ НАЛОЖКИ (ПЕРЕДОПЛАТА 100%)
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                                Статус оплати: <strong style={{ color: order.payment_status === 'paid' ? '#22c55e' : '#f59e0b' }}>
                                  {order.payment_status === 'paid' ? 'Оплачено ✅' : 'Очікує підтвердження'}
                                </strong>
                              </div>
                            </div>
                          )}

                          {/* TTN Input & Tracking */}
                          {!isPickup && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>НОМЕР ТТН ПОШТИ</label>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const clip = await navigator.clipboard.readText();
                                      if (clip) {
                                        const cleanTtn = clip.replace(/\D/g, '').slice(0, 14) || clip.trim();
                                        setTempTtn({ ...tempTtn, [order.id]: cleanTtn });
                                        showToast('ТТН вставлено з буфера 📋');
                                      }
                                    } catch (_) {}
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                                >
                                  📋 Вставити з буфера
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: 6 }}>
                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  placeholder="20450..." 
                                  value={currentTtnVal} 
                                  onChange={(e) => setTempTtn({ ...tempTtn, [order.id]: e.target.value })}
                                  style={{ 
                                    flex: 1, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', 
                                    borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 800, outline: 'none', fontFamily: 'monospace'
                                  }}
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); saveTtn(order.id, false); }}
                                  disabled={savingTtnId === order.id || currentTtnVal === ttnValue}
                                  style={{ 
                                    padding: '0 12px', background: currentTtnVal === ttnValue ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.25)', 
                                    border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer'
                                  }}
                                >
                                  {savingTtnId === order.id ? <Loader2 size={14} className="animate-spin" /> : 'Зберегти'}
                                </button>
                              </div>

                              {/* One-tap Save TTN + Mark Shipped button */}
                              {currentTtnVal.trim().length >= 10 && order.status !== 'shipped' && order.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); saveTtn(order.id, true); }}
                                  style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                                    fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                                  }}
                                >
                                  <Send size={13} /> Зберегти ТТН і позначити «Відправлено» 🚀
                                </button>
                              )}
                              
                              {/* If TTN exists, render copy, message template, and tracking links */}
                              {ttnValue && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(ttnValue, order.id, 'ТТН скопійовано'); }}
                                      style={{ 
                                        flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: 9, color: '#e2e8f0', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 
                                      }}
                                    >
                                      {copiedId === order.id ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                                      Копіювати ТТН
                                    </button>
                                    <a 
                                      href={trackingUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ 
                                        flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', 
                                        borderRadius: 9, color: '#f87171', fontSize: 11, fontWeight: 850, textAlign: 'center',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none'
                                      }}
                                    >
                                      Відстежити НП <ExternalLink size={11} />
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); copyClientTtnMessage(order, ttnValue); }}
                                    style={{
                                      width: '100%', padding: '8px 12px', borderRadius: 9,
                                      background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
                                      color: '#38bdf8', fontSize: 11, fontWeight: 850, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}
                                  >
                                    {copiedMsgId === order.id ? <Check size={13} /> : <MessageSquare size={13} />}
                                    {copiedMsgId === order.id ? 'Повідомлення скопійовано!' : 'Скопіювати повідомлення з ТТН для клієнта'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Bottom Quick Status Transition Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>Змінити етап:</span>
                        
                        {order.status !== 'printing' && order.status !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'printing'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', 
                              color: '#a78bfa', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Printer size={12} /> Друкується
                          </button>
                        )}

                        {order.status !== 'painting' && order.status !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'painting'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', 
                              color: '#fbbf24', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Palette size={12} /> Фарбується
                          </button>
                        )}

                        {order.status !== 'shipping' && order.status !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'shipping'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: 10, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', 
                              color: '#f472b6', fontSize: 11, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Truck size={12} /> Готово до відправки
                          </button>
                        )}

                        {order.status !== 'shipped' && order.status !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'shipped'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', 
                              color: '#34d399', fontSize: 11, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Send size={12} /> Відправлено поштою
                          </button>
                        )}

                        {order.status !== 'completed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }}
                            disabled={statusChangingId === order.id}
                            style={{ 
                              padding: '8px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', 
                              color: '#22c55e', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto'
                            }}
                          >
                            <CheckCircle2 size={13} /> Отримано / Виконано ✅
                          </button>
                        )}

                        {statusChangingId === order.id && (
                          <Loader2 size={16} className="animate-spin" style={{ color: '#fff' }} />
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

      {/* Quick Edit Shipping Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div
            onClick={() => setEditingOrder(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1100,
              display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
              padding: isMobile ? 0 : 20
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 40 : 0, scale: isMobile ? 1 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 40 : 0, scale: isMobile ? 1 : 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0f172a',
                borderRadius: isMobile ? '24px 24px 0 0' : 24,
                padding: isMobile ? 18 : 24,
                width: '100%',
                maxWidth: 540,
                maxHeight: '92vh',
                overflowY: 'auto',
                border: '1px solid rgba(236,72,153,0.35)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                  ✏️ Редагувати доставку та оплату
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 8, padding: 6, cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveEditedShipping} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ІМ'Я</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ПРІЗВИЩЕ</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ТЕЛЕФОН</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>СПОСІБ ДОСТАВКИ</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'nova_poshta', label: 'Нова Пошта' },
                      { id: 'ukrposhta', label: 'Укрпошта' },
                      { id: 'pickup', label: 'Самовивіз' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, shipping_method: m.id })}
                        style={{
                          flex: 1, padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                          border: editForm.shipping_method === m.id ? '1px solid #ec4899' : '1px solid var(--border)',
                          background: editForm.shipping_method === m.id ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.03)',
                          color: editForm.shipping_method === m.id ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {editForm.shipping_method !== 'pickup' && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>МІСТО ДОСТАВКИ</label>
                      <input
                        type="text"
                        placeholder="Введіть місто..."
                        value={npCityQuery}
                        onChange={(e) => {
                          setNpCityQuery(e.target.value);
                          setEditForm({ ...editForm, city: e.target.value });
                          setNpShowCities(true);
                        }}
                        onFocus={() => { if (npCities.length > 0) setNpShowCities(true); }}
                        style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                      />
                      {npLoadingCities && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 12, bottom: 12, color: '#ec4899' }} />}
                      {npShowCities && npCities.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#1e293b', borderRadius: 12, border: '1px solid rgba(236,72,153,0.4)', marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {npCities.map(c => (
                            <button
                              key={c.Ref}
                              type="button"
                              onClick={() => {
                                setEditForm({ ...editForm, city: c.Description, cityRef: c.Ref, warehouse: '' });
                                setNpCityQuery(c.Description);
                                setNpWarehouseQuery('');
                                setNpShowCities(false);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}
                            >
                              {c.Description} <span style={{ color: '#94a3b8', fontSize: 10 }}>({c.AreaDescription})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ВІДДІЛЕННЯ / ПОШТОМАТ / АДРЕСА</label>
                      <input
                        type="text"
                        placeholder="Введіть номер або адресу відділення..."
                        value={npWarehouseQuery}
                        onChange={(e) => {
                          setNpWarehouseQuery(e.target.value);
                          setEditForm({ ...editForm, warehouse: e.target.value });
                          setNpShowWarehouses(true);
                        }}
                        onFocus={() => { if (npWarehouses.length > 0) setNpShowWarehouses(true); }}
                        style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                      />
                      {npShowWarehouses && npFilteredWarehouses.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40, background: '#1e293b', borderRadius: 12, border: '1px solid rgba(236,72,153,0.4)', marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {npFilteredWarehouses.slice(0, 60).map(wh => (
                            <button
                              key={wh.Ref}
                              type="button"
                              onClick={() => {
                                setEditForm({ ...editForm, warehouse: wh.Description });
                                setNpWarehouseQuery(wh.Description);
                                setNpShowWarehouses(false);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}
                            >
                              {wh.Description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Payment & COD */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 14, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, fontWeight: 850, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.is_cod}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          is_cod: e.target.checked,
                          cod_amount: e.target.checked && !editForm.cod_amount ? String(editingOrder.total || '') : editForm.cod_amount
                        })}
                      />
                      Накладений платіж (Наложка)
                    </label>

                    <select
                      value={editForm.payment_status}
                      onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: 8, background: '#1e293b', border: '1px solid var(--border)', color: '#fff', fontSize: 11, fontWeight: 800 }}
                    >
                      <option value="pending">Очікує оплати</option>
                      <option value="partially_paid">Частково оплачено</option>
                      <option value="paid">Оплачено повністю</option>
                    </select>
                  </div>

                  {editForm.is_cod && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#f97316', display: 'block', marginBottom: 4 }}>СУМА НАЛОЖКИ (₴)</label>
                      <input
                        type="number"
                        value={editForm.cod_amount}
                        onChange={(e) => setEditForm({ ...editForm, cod_amount: e.target.value })}
                        placeholder="Сума до сплати на пошті"
                        style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(249,115,22,0.4)', color: '#fff', fontSize: 14, fontWeight: 900 }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>УТОЧНЕННЯ / НОТАТКИ</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ec4899, #7c3aed)', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                  >
                    {savingEdit ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
