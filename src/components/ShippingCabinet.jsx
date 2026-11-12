// Hallmark Dusk Theme — ShippingCabinet
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, Search, Copy, Check, ExternalLink, Send, CheckCircle2, 
  Clock, Printer, Palette, ClipboardList, XCircle, MapPin, Phone, 
  User, Package, Coins, Star, ChevronDown, ChevronUp, Edit3, X,
  MessageSquare, Loader2, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMeta } from '@/lib/orderHelpers';

const STATUS_META = {
  new: { label: 'Нове', signal: 'apricot', icon: Clock },
  printing: { label: 'Друк', signal: 'apricot', icon: Printer },
  painting: { label: 'Склейка / Розфарб.', signal: 'apricot', icon: Palette },
  preparing: { label: 'Пакування', signal: 'apricot', icon: ClipboardList },
  shipping: { label: 'Готово до відправки', signal: 'apricot', icon: Truck },
  shipped: { label: 'В дорозі', signal: 'periwinkle', icon: Send },
  completed: { label: 'Виконано', signal: 'periwinkle', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', signal: 'muted', icon: XCircle }
};

const PLATFORM_LABELS = {
  website: 'Сайт',
  telegram: 'Telegram',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  olx: 'OLX',
  prom: 'Prom',
  rozetka: 'Rozetka',
  shafa: 'Shafa',
  manual: 'Вручну',
  other: 'Інше'
};

// Formats phone for Nova Poshta copy: 0XXXXXXXXX (10 digits)
const formatCleanPhoneForCopy = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.startsWith('380') && digits.length === 12) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('80') && digits.length === 11) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return '0' + digits;
  }
  return digits || phoneStr.trim();
};

export default function ShippingCabinet({ orders = [], setOrders, supabase, showToast, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageTab, setStageTab] = useState('ready'); // 'ready' | 'packing' | 'in_work' | 'shipped' | 'all_active' | 'completed'
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // 'all' | 'nova_poshta' | 'ukrposhta' | 'pickup'
  const [codFilter, setCodFilter] = useState('all'); // 'all' | 'cod_only' | 'prepaid_only'
  const [tempTtn, setTempTtn] = useState({});
  const [savingTtnId, setSavingTtnId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Edit Shipping Modal State
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

  // Nova Poshta autocomplete for edit modal
  const [npCityQuery, setNpCityQuery] = useState('');
  const [npCities, setNpCities] = useState([]);
  const [npShowCities, setNpShowCities] = useState(false);
  const [npLoadingCities, setNpLoadingCities] = useState(false);

  const [npWarehouseQuery, setNpWarehouseQuery] = useState('');
  const [npWarehouses, setNpWarehouses] = useState([]);
  const [npShowWarehouses, setNpShowWarehouses] = useState(false);
  const [npLoadingWarehouses, setNpLoadingWarehouses] = useState(false);

  // City search effect
  useEffect(() => {
    if (!editingOrder || editForm.shipping_method !== 'nova_poshta') return;
    if (npCityQuery.trim().length < 2 || npCityQuery === editForm.city) {
      setNpCities([]);
      return;
    }
    const timer = setTimeout(async () => {
      setNpLoadingCities(true);
      try {
        const res = await fetch('/api/novaposhta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'searchCities', query: npCityQuery })
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNpCities(json.data);
          setNpShowCities(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setNpLoadingCities(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [npCityQuery, editForm.city, editForm.shipping_method, editingOrder]);

  // Warehouses load effect
  useEffect(() => {
    if (!editingOrder || editForm.shipping_method !== 'nova_poshta' || !editForm.cityRef) {
      setNpWarehouses([]);
      return;
    }
    let active = true;
    const fetchWh = async () => {
      setNpLoadingWarehouses(true);
      try {
        const res = await fetch('/api/novaposhta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getWarehouses', cityRef: editForm.cityRef })
        });
        const json = await res.json();
        if (active && json.success && Array.isArray(json.data)) {
          setNpWarehouses(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setNpLoadingWarehouses(false);
      }
    };
    fetchWh();
    return () => { active = false; };
  }, [editForm.cityRef, editForm.shipping_method, editingOrder]);

  const npFilteredWarehouses = useMemo(() => {
    if (!npWarehouseQuery.trim()) return npWarehouses;
    const q = npWarehouseQuery.toLowerCase();
    return npWarehouses.filter(w => w.Description.toLowerCase().includes(q));
  }, [npWarehouses, npWarehouseQuery]);

  const openEditModal = (order, e) => {
    if (e) e.stopPropagation();
    const details = order.shipping_details || {};
    const fName = details.firstName || order.customers?.first_name || '';
    const lName = details.lastName || order.customers?.last_name || '';
    const ph = details.phone || order.customers?.phone || '';
    const cityVal = details.city || '';
    const whVal = details.warehouse || '';

    setEditingOrder(order);
    setEditForm({
      firstName: fName,
      lastName: lName,
      phone: ph,
      shipping_method: order.shipping_method || (cityVal === 'Самовивіз' ? 'pickup' : 'nova_poshta'),
      city: cityVal === 'Самовивіз' ? '' : cityVal,
      cityRef: details.cityRef || '',
      warehouse: whVal,
      payment_status: order.payment_status || 'pending',
      is_cod: !!details.is_cod,
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || ''
    });
    setNpCityQuery(cityVal === 'Самовивіз' ? '' : cityVal);
    setNpWarehouseQuery(whVal);
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
        city: editForm.shipping_method === 'pickup' ? 'Самовивіз' : (editForm.city || npCityQuery).trim(),
        cityRef: editForm.shipping_method === 'nova_poshta' ? editForm.cityRef : '',
        warehouse: editForm.shipping_method === 'pickup' ? '' : (editForm.warehouse || npWarehouseQuery).trim(),
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
      showToast('Дані доставки оновлено', 'success');
      setEditingOrder(null);
    } catch (err) {
      console.error(err);
      showToast(`Помилка збереження: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleExpand = (orderId) => {
    if (typeof window !== 'undefined' && window.getSelection()?.toString().length > 0) return;
    setExpandedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // Stage counts & financial tally
  const stageCounts = useMemo(() => {
    const counts = { ready: 0, packing: 0, in_work: 0, shipped: 0, all_active: 0, completed: 0, codTotal: 0, codOrdersCount: 0 };
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      if (o.status === 'shipping') {
        counts.ready++;
        counts.all_active++;
      } else if (o.status === 'preparing') {
        counts.packing++;
        counts.all_active++;
      } else if (['new', 'printing', 'painting'].includes(o.status)) {
        counts.in_work++;
        counts.all_active++;
      } else if (o.status === 'shipped') {
        counts.shipped++;
      } else if (o.status === 'completed') {
        counts.completed++;
      }

      if (o.status !== 'completed' && o.shipping_details?.is_cod) {
        counts.codOrdersCount++;
        counts.codTotal += parseFloat(o.shipping_details?.cod_amount || 0);
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
      } else if (stageTab === 'packing') {
        matchesStage = order.status === 'preparing';
      } else if (stageTab === 'in_work') {
        matchesStage = ['new', 'printing', 'painting'].includes(order.status);
      } else if (stageTab === 'shipped') {
        matchesStage = order.status === 'shipped';
      } else if (stageTab === 'completed') {
        matchesStage = order.status === 'completed';
      } else {
        matchesStage = order.status !== 'completed' && order.status !== 'shipped';
      }

      const method = order.shipping_method || 'pickup';
      const matchesDelivery = deliveryFilter === 'all' || method === deliveryFilter;

      const isCod = !!order.shipping_details?.is_cod;
      const matchesCod = codFilter === 'all' || (codFilter === 'cod_only' ? isCod : !isCod);

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

      return matchesStage && matchesDelivery && matchesCod && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aPriority = a.shipping_details?.is_priority ? 1 : 0;
      const bPriority = b.shipping_details?.is_priority ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      const aReady = a.status === 'shipping' ? 1 : 0;
      const bReady = b.status === 'shipping' ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, stageTab, deliveryFilter, codFilter, searchQuery]);

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
      showToast(ttnValue ? 'ТТН збережено' : 'ТТН видалено', 'success');
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
        !currentPriority ? 'Замовлення додано в пріоритет' : 'Замовлення вилучено з пріоритету', 
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
    showToast('Всі дані для ТТН скопійовано');
    setTimeout(() => setCopiedAddressId(null), 2000);
  };

  const copyClientTtnMessage = (order, ttn) => {
    const details = order.shipping_details || {};
    const firstName = details.firstName || order.customers?.first_name || '';
    const codLine = details.is_cod && details.cod_amount > 0 ? `\nДо сплати при отриманні (наложка): ${details.cod_amount} ₴` : '';
    const msg = `Привіт${firstName ? `, ${firstName}` : ''}! Ваше замовлення відправлено\n\nНомер ТТН Нової Пошти: ${ttn}${codLine}\n\nДякуємо, що обрали BUBA Store!`;
    navigator.clipboard.writeText(msg);
    setCopiedMsgId(order.id);
    showToast('Повідомлення з ТТН для клієнта скопійовано');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const activeMobileFilterCount = (deliveryFilter !== 'all' ? 1 : 0) + (codFilter !== 'all' ? 1 : 0) + (stageTab !== 'ready' ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16, width: '100%', paddingBottom: isMobile ? 75 : 0 }}>
      
      {/* Dusk Glass Header & Logistics Command Bar */}
      <div className="dusk-glass" style={{ padding: isMobile ? '10px 12px' : 20, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 16 }}>
        
        {/* Row 1: Title + Search + Expand/Collapse */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12 }}>
          <div>
            <h1 className="dusk-heading" style={{ fontSize: isMobile ? 17 : 22, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Кабінет відправок</span>
            </h1>
            {!isMobile && (
              <p className="dusk-subheading" style={{ marginTop: 2 }}>
                Пакування виробів, швидке копіювання реквізитів, ТТН та контроль посилок у дорозі
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: isMobile ? '100%' : 'auto' }}>
              <div style={{ position: 'relative', flex: isMobile ? 1 : 'none', minWidth: isMobile ? 0 : 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Отримувач, телефон, місто, ТТН..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="dusk-input"
                  style={{ paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, height: isMobile ? 32 : 34, fontSize: 12.5, borderRadius: 999, width: '100%' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {isMobile && (
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(prev => !prev)}
                  className={`dusk-facet-pill ${mobileFiltersOpen || activeMobileFilterCount > 0 ? 'active' : ''}`}
                  style={{ padding: '5px 10px', fontSize: 11.5, flexShrink: 0, height: 32 }}
                >
                  <SlidersHorizontal size={12} />
                  <span>Фільтри{activeMobileFilterCount > 0 ? ` (${activeMobileFilterCount})` : ''}</span>
                  <ChevronDown size={12} style={{ transform: mobileFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
              )}
            </div>

            {!isMobile && (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedOrderIds(filteredOrders.map(o => o.id))}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  Розгорнути всі
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedOrderIds([])}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  Згорнути всі
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stage Pipeline + Tally + Facet Filters (always on desktop, smoothly collapsible on mobile) */}
        <AnimatePresence initial={false}>
          {(!isMobile || mobileFiltersOpen) && (
            <motion.div
              key="shipping-filters-drawer"
              initial={isMobile ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={isMobile ? { opacity: 0, height: 0 } : undefined}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: isMobile ? 'hidden' : 'visible', display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}
            >

        {/* Stage Pipeline Strip */}
        <div className="dusk-pipeline hide-scrollbar">
          {[
            { id: 'all_active', label: isMobile ? 'Всі' : 'Усі активні', count: stageCounts.all_active, dot: null },
            { id: 'ready', label: isMobile ? 'До відправки' : 'Готово до відправки', count: stageCounts.ready, dot: 'apricot' },
            { id: 'packing', label: 'Пакування', count: stageCounts.packing, dot: 'apricot' },
            { id: 'in_work', label: isMobile ? 'В роботі' : 'Друк / Склейка', count: stageCounts.in_work, dot: 'apricot' },
            { id: 'shipped', label: 'В дорозі', count: stageCounts.shipped, dot: 'periwinkle' },
            { id: 'completed', label: 'Виконано', count: stageCounts.completed, dot: 'periwinkle' }
          ].map(tab => {
            const active = stageTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  setStageTab(tab.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                className={`dusk-pipeline__step ${active ? 'active' : ''}`}
                style={{
                  flexShrink: 0,
                  padding: isMobile ? '5px 8px' : undefined,
                  fontSize: isMobile ? 11.5 : undefined,
                  gap: isMobile ? 5 : undefined
                }}
              >
                {tab.dot && <span className={`dusk-dot ${tab.dot === 'periwinkle' ? 'dusk-dot--periwinkle' : 'dusk-dot--apricot'}`} />}
                <span>{tab.label}</span>
                <span className="dusk-pipeline__count">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Dusk Ruled Tally — 4 Key Logistics Figures */}
        <div
          className="dusk-tally"
          style={{
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            borderTop: '1px solid var(--color-rule)',
            borderBottom: '1px solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            borderRadius: 10
          }}
        >
          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Готово до відправки</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: stageCounts.ready > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {stageCounts.ready} <span className="dusk-currency">посил.</span>
            </div>
            <span className="dusk-tally__sub">Чекають оформлення ТТН</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">На етапі пакування</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22 }}>
              {stageCounts.packing} <span className="dusk-currency">замовл.</span>
            </div>
            <span className="dusk-tally__sub">У роботі цеху: {stageCounts.in_work}</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Посилок у дорозі</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: stageCounts.shipped > 0 ? 'var(--color-accent)' : 'var(--color-ink)' }}>
              {stageCounts.shipped}
            </div>
            <span className="dusk-tally__sub">Виконано всього: {stageCounts.completed}</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Очікувана наложка</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: stageCounts.codTotal > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {stageCounts.codTotal.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            <span className="dusk-tally__sub">{stageCounts.codOrdersCount} відправлень із післяплатою</span>
          </div>
        </div>

        {/* Row 3: Delivery Method & COD Facet Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Служба:</span>
            {[
              { val: 'all', label: 'Усі служби' },
              { val: 'nova_poshta', label: 'Нова Пошта' },
              { val: 'ukrposhta', label: 'Укрпошта' },
              { val: 'pickup', label: 'Самовивіз' }
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setDeliveryFilter(item.val)}
                className={`dusk-facet-pill ${deliveryFilter === item.val ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Оплата:</span>
            {[
              { val: 'all', label: 'Будь-яка' },
              { val: 'cod_only', label: 'З наложкою', apricot: true },
              { val: 'prepaid_only', label: 'Повна передоплата' }
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setCodFilter(item.val)}
                className={`dusk-facet-pill ${codFilter === item.val ? (item.apricot ? 'active-apricot' : 'active') : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shipment Cards List */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stageTab}
          initial={isMobile ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: -4 } : undefined}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: isMobile ? '55vh' : 'auto' }}
        >
        {filteredOrders.length === 0 ? (
          <div className="dusk-panel" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-muted)', fontSize: 13 }}>
            Немає замовлень у цій вкладці за вибраними фільтрами.
          </div>
        ) : (
          filteredOrders.map(order => {
            const details = order.shipping_details || {};
            const fromDetails = `${details.firstName || details.first_name || ''} ${details.lastName || details.last_name || ''}`.trim();
            const fromCust = `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim();
            const clientName = fromDetails || fromCust || order.client_name || 'Гість';
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
                className="dusk-panel"
                style={{ 
                  border: details.is_priority 
                    ? '1px solid var(--color-accent-2-border)' 
                    : isReadyToShip 
                      ? '1px solid var(--color-accent-border)' 
                      : '1px solid var(--color-rule)', 
                  padding: isMobile ? 14 : 18, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isExpanded ? 14 : 10,
                  transition: 'all 0.16s ease'
                }}
              >
                {/* Clickable Header/Summary block */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                >
                  {/* Row 1: Priority, Number, Platform, COD badge, Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => togglePriority(order.id, e)}
                        style={{
                          background: 'transparent', border: 'none', padding: 2, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title={details.is_priority ? "Прибрати з пріоритету" : "Зробити пріоритетним"}
                      >
                        <Star 
                          size={15} 
                          fill={details.is_priority ? "var(--color-accent-2)" : "transparent"} 
                          stroke={details.is_priority ? "var(--color-accent-2)" : "var(--color-muted)"}
                        />
                      </button>

                      {(() => {
                        const meta = STATUS_META[order.status] || STATUS_META.new;
                        return (
                          <span className={`dusk-badge ${meta.signal === 'periwinkle' ? 'dusk-badge--periwinkle' : meta.signal === 'apricot' ? 'dusk-badge--apricot' : 'dusk-badge--neutral'}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                            <span className={`dusk-dot ${meta.signal === 'periwinkle' ? 'dusk-dot--periwinkle' : meta.signal === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5 }} />
                            {meta.label}
                          </span>
                        );
                      })()}

                      {isCod ? (
                        <span className="dusk-badge dusk-badge--apricot dusk-num" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                          Наложка: {codAmount} ₴
                        </span>
                      ) : (
                        <span className={`dusk-badge ${order.payment_status === 'paid' ? 'dusk-badge--periwinkle' : 'dusk-badge--apricot'}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                          <span className={`dusk-dot ${order.payment_status === 'paid' ? 'dusk-dot--periwinkle' : 'dusk-dot--apricot'}`} style={{ width: 5, height: 5 }} />
                          {order.payment_status === 'paid' ? 'Оплачено' : 'Очікує оплати'}
                        </span>
                      )}

                      {ttnValue && (
                        <span className="dusk-badge dusk-badge--periwinkle dusk-mono" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                          ТТН: {ttnValue}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(order, e)}
                        title="Редагувати дані доставки"
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                      >
                        <Edit3 size={11} /> {!isMobile && 'Змінити'}
                      </button>
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--color-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
                    </div>
                  </div>

                  {/* Row 2: High-Visibility Recipient Contacts & Delivery Address */}
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: isMobile ? 8 : 16,
                    padding: isMobile ? '10px 12px' : '10px 14px',
                    borderRadius: 10,
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 15.5 : 15, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.25, wordBreak: 'break-word' }}>
                        {clientName}{' '}
                        <span className="dusk-mono" style={{ fontSize: isMobile ? 12.5 : 12, fontWeight: 500, color: 'var(--color-muted)' }}>
                          ({order.order_number ? order.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${String(order.id).slice(0, 8)}`})
                        </span>
                      </div>
                      {clientPhone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(cleanPhone || clientPhone, `hd-ph-${order.id}`, `Телефон скопійовано: ${cleanPhone || clientPhone}`);
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                            color: 'var(--color-accent)', fontSize: isMobile ? 15 : 14.5, fontWeight: 600, letterSpacing: '0.02em'
                          }}
                          className="dusk-mono"
                          title="Натисніть, щоб скопіювати номер"
                        >
                          <Phone size={13} style={{ flexShrink: 0 }} />
                          <span>{cleanPhone || clientPhone}</span>
                          {copiedId === `hd-ph-${order.id}` && <Check size={13} />}
                        </button>
                      )}
                    </div>

                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 2,
                      alignItems: isMobile ? 'flex-start' : 'flex-end',
                      textAlign: isMobile ? 'left' : 'right',
                      maxWidth: isMobile ? '100%' : '56%',
                      paddingTop: isMobile ? 6 : 0,
                      borderTop: isMobile ? '1px solid var(--color-rule)' : 'none'
                    }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 13.5 : 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                        <MapPin size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                        <span>{details.city || 'Самовивіз'}</span>
                      </div>
                      {details.warehouse && (
                        <div style={{ fontSize: isMobile ? 13 : 12.5, fontWeight: 500, color: 'var(--color-ink-2)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                          {details.warehouse}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsed Quick Items + Colors Preview */}
                  {!isExpanded && items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                      {items.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {items.map((item, idx) => {
                            const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                            const itemNote = item.item_note || item.color_details || item.note || '';
                            return (
                              <span key={idx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                                background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)',
                                padding: isMobile ? '6px 10px' : '4px 9px', borderRadius: 8,
                                fontSize: isMobile ? 13 : 12, color: 'var(--color-ink)', fontWeight: 600
                              }}>
                                {item.is_manufactured && <Check size={12} style={{ color: 'var(--color-accent)' }} />}
                                <span>{item.name} <strong className="dusk-num" style={{ color: 'var(--color-accent)' }}>×{item.quantity || 1}</strong></span>
                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10.5, lineHeight: 1, color: 'var(--color-ink-2)', background: 'var(--color-paper)', padding: '3px 6px', borderRadius: 4, fontWeight: 500 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, flexShrink: 0 }} />
                                      <span>{cMeta.label}</span>
                                    </span>
                                  );
                                })}
                                {itemNote && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>({itemNote})</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 1-Tap Quick Copy Bar (Desktop only) */}
                {!isPickup && !isMobile && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--color-rule)' }}
                  >
                    {cleanPhone && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(cleanPhone, null, `Телефон скопійовано: ${cleanPhone}`)}
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm dusk-mono"
                        style={{ height: 26, fontSize: 11 }}
                      >
                        <Copy size={11} /> Тел: {cleanPhone}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(clientName, null, `ПІБ скопійовано: ${clientName}`)}
                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                      style={{ height: 26, fontSize: 11 }}
                    >
                      <Copy size={11} /> ПІБ
                    </button>
                    {details.city && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${details.city}${details.warehouse ? `, ${details.warehouse}` : ''}`, null, 'Адресу скопійовано')}
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ height: 26, fontSize: 11 }}
                      >
                        <Copy size={11} /> Адреса
                      </button>
                    )}
                    {isCod && codAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(codAmount), null, `Суму наложки (${codAmount} ₴) скопійовано`)}
                        className="dusk-btn dusk-btn--sm dusk-num"
                        style={{
                          height: 26, fontSize: 11,
                          background: 'var(--color-accent-2-soft)', color: 'var(--color-accent-2)', borderColor: 'var(--color-accent-2-border)'
                        }}
                      >
                        <Copy size={11} /> Наложка: {codAmount} ₴
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyAddressInfo(order, order.id)}
                      className="dusk-btn dusk-btn--sm"
                      style={{
                        height: 26, fontSize: 11, marginLeft: 'auto',
                        background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderColor: 'var(--color-accent-border)'
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
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                      <div style={{ borderTop: '1px solid var(--color-rule)' }} />

                      {details.notes && (
                        <div className="dusk-apricot-strip">
                          <strong>Уточнення до замовлення:</strong> {details.notes}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1.2fr 1.1fr', gap: isMobile ? 14 : 18 }}>
                        
                        {/* Column 1: Recipient and Destination details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Отримувач та адреса</span>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(order, e)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit3 size={11} /> Редагувати
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-paper)', border: '1px solid var(--color-rule)', padding: 14, borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                                <User size={14} style={{ color: 'var(--color-muted)' }} />
                                {clientName}
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(clientName, null, "Ім'я скопійовано"); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 4 }}
                              >
                                <Copy size={13} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div className="dusk-mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-ink-2)' }}>
                                <Phone size={14} style={{ color: 'var(--color-muted)' }} />
                                {clientPhone || 'Не вказано'}
                              </div>
                              {clientPhone && (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <a 
                                    href={`tel:${clientPhone}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="dusk-badge dusk-badge--periwinkle"
                                    style={{ textDecoration: 'none', fontSize: 10.5 }}
                                  >
                                    <Phone size={10} /> Дзвінок
                                  </a>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(cleanPhone, null, "Телефон скопійовано"); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 4 }}
                                  >
                                    <Copy size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div style={{ borderTop: '1px solid var(--color-rule)', margin: '2px 0' }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                              <MapPin size={14} style={{ color: 'var(--color-accent-2)', marginTop: 2, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <strong>{details.city || 'Місто не вказано'}</strong>
                                  {details.city && (
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(details.city, null, "Місто скопійовано"); }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 4 }}
                                    >
                                      <Copy size={12} />
                                    </button>
                                  )}
                                </div>
                                {!isPickup ? (
                                  <div style={{ fontSize: 11.5, color: 'var(--color-ink-2)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <span>{details.warehouse || 'Відділення не вказано'}</span>
                                    {details.warehouse && (
                                      <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(details.warehouse, null, "Відділення скопійовано"); }}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                                      >
                                        <Copy size={12} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11.5, color: 'var(--color-accent)', marginTop: 4, fontWeight: 500 }}>
                                    Самовивіз (Хмельницький)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Items checklist with Colors & Clarifications */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>
                            Вироби для пакування ({items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0)} шт.)
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-paper)', border: '1px solid var(--color-rule)', padding: 12, borderRadius: 12, maxHeight: 240, overflowY: 'auto' }}>
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
                                      padding: '8px 10px', borderRadius: 8,
                                      background: isDone ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                                      border: isDone ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <div 
                                        onClick={() => toggleItemManufactured(order.id, idx)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}
                                      >
                                        <div style={{
                                          width: 16, height: 16, borderRadius: 4,
                                          border: isDone ? 'none' : '1.5px solid var(--color-muted)',
                                          background: isDone ? 'var(--color-accent)' : 'transparent',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                          {isDone && <Check size={11} style={{ color: 'var(--color-accent-ink)', strokeWidth: 2.5 }} />}
                                        </div>
                                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-ink)' }}>
                                          {item.name}
                                        </span>
                                      </div>
                                      <span className="dusk-badge dusk-badge--periwinkle dusk-num" style={{ padding: '2px 7px', fontSize: 11 }}>
                                        ×{item.quantity || 1}
                                      </span>
                                    </div>

                                    {itemColors.length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 24 }}>
                                        {itemColors.map((cName, cIdx) => {
                                          const cMeta = getColorMeta(cName);
                                          return (
                                            <span key={cIdx} style={{
                                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                              fontSize: 10.5, fontWeight: 500, lineHeight: 1, padding: '3px 7px', borderRadius: 5,
                                              background: 'var(--color-paper)', color: 'var(--color-ink)',
                                              border: '1px solid var(--color-rule)'
                                            }}>
                                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, flexShrink: 0 }} />
                                              <span>{cMeta.label}</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {itemNote && (
                                      <div style={{ paddingLeft: 24, fontSize: 11, color: 'var(--color-accent-2)', fontWeight: 500 }}>
                                        Уточнення: {itemNote}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--color-muted)', padding: '10px 0' }}>Немає інформації про товари</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Загальна сума замовлення:</span>
                            <span className="dusk-num" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
                              {order.total} <span className="dusk-currency">₴</span>
                            </span>
                          </div>
                        </div>

                        {/* Column 3: Payment details, COD & TTN setup */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Оплата та ТТН пошти</div>
                          
                          {isCod ? (
                            <div style={{ background: 'var(--color-accent-2-soft)', border: '1px solid var(--color-accent-2-border)', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-accent-2)', fontWeight: 600 }}>
                                  <Coins size={14} />
                                  Накладений платіж
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(String(codAmount), null, 'Суму наложки скопійовано')}
                                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                  style={{ height: 22, padding: '0 7px', fontSize: 10.5 }}
                                >
                                  Копіювати
                                </button>
                              </div>
                              <div className="dusk-num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>
                                {codAmount} <span className="dusk-currency">₴</span>
                              </div>
                              {(() => {
                                const totalVal = parseFloat(order.total || 0);
                                const codVal = parseFloat(codAmount || 0);
                                const prepaymentVal = Math.max(0, totalVal - codVal);
                                return (
                                  <div style={{ fontSize: 11, color: 'var(--color-ink-2)', marginTop: 2 }}>
                                    {prepaymentVal > 0 ? (
                                      <span>Передоплата: <strong style={{ color: 'var(--color-accent)' }}>{prepaymentVal} ₴</strong> (залишок {codVal} ₴ на пошті)</span>
                                    ) : (
                                      <span style={{ color: 'var(--color-accent-2)' }}>Повна післяплата на пошті (без передоплати)</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
                                <CheckCircle2 size={14} />
                                Без наложки (Передоплата 100%)
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-ink-2)' }}>
                                Статус оплати: <strong style={{ color: order.payment_status === 'paid' ? 'var(--color-accent)' : 'var(--color-accent-2)' }}>
                                  {order.payment_status === 'paid' ? 'Оплачено' : 'Очікує підтвердження'}
                                </strong>
                              </div>
                            </div>
                          )}

                          {/* TTN Input & Tracking */}
                          {!isPickup && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Номер ТТН пошти</label>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const clip = await navigator.clipboard.readText();
                                      if (clip) {
                                        const cleanTtn = clip.replace(/\D/g, '').slice(0, 14) || clip.trim();
                                        setTempTtn({ ...tempTtn, [order.id]: cleanTtn });
                                        showToast('ТТН вставлено з буфера');
                                      }
                                    } catch (_) {}
                                  }}
                                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
                                >
                                  Вставити з буфера
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: 6 }}>
                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  placeholder="20450..." 
                                  value={currentTtnVal} 
                                  onChange={(e) => setTempTtn({ ...tempTtn, [order.id]: e.target.value })}
                                  className="dusk-input dusk-mono"
                                  style={{ flex: 1, height: 36, fontSize: 13 }}
                                />
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); saveTtn(order.id, false); }}
                                  disabled={savingTtnId === order.id || currentTtnVal === ttnValue}
                                  className="dusk-btn dusk-btn--ghost"
                                  style={{ height: 36, padding: '0 14px', fontSize: 12 }}
                                >
                                  {savingTtnId === order.id ? <Loader2 size={14} className="animate-spin" /> : 'Зберегти'}
                                </button>
                              </div>

                              {currentTtnVal.trim().length >= 10 && order.status !== 'shipped' && order.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); saveTtn(order.id, true); }}
                                  className="dusk-btn dusk-btn--primary"
                                  style={{ width: '100%', justifyContent: 'center', height: 36 }}
                                >
                                  <Send size={13} /> Зберегти ТТН і позначити «В дорозі»
                                </button>
                              )}
                              
                              {ttnValue && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(ttnValue, order.id, 'ТТН скопійовано'); }}
                                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                      style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                      {copiedId === order.id ? <Check size={12} style={{ color: 'var(--color-accent)' }} /> : <Copy size={12} />}
                                      Копіювати ТТН
                                    </button>
                                    <a 
                                      href={trackingUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                      style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                                    >
                                      Відстежити НП <ExternalLink size={11} />
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); copyClientTtnMessage(order, ttnValue); }}
                                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                    style={{ width: '100%', justifyContent: 'center' }}
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
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--color-rule)', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', marginRight: 4 }}>Змінити етап:</span>
                        
                        {[
                          { st: 'printing', label: 'Друк', icon: Printer },
                          { st: 'painting', label: 'Склейка / Розфарб.', icon: Palette },
                          { st: 'preparing', label: 'Пакування', icon: ClipboardList },
                          { st: 'shipping', label: 'Готово до відправки', icon: Truck },
                          { st: 'shipped', label: 'В дорозі', icon: Send }
                        ].map(btn => {
                          if (order.status === btn.st || order.status === 'completed') return null;
                          const Icon = btn.icon;
                          return (
                            <button
                              key={btn.st}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateStatus(order.id, btn.st); }}
                              disabled={statusChangingId === order.id}
                              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            >
                              <Icon size={12} /> {btn.label}
                            </button>
                          );
                        })}

                        {order.status !== 'completed' && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }}
                            disabled={statusChangingId === order.id}
                            className="dusk-btn dusk-btn--primary dusk-btn--sm"
                            style={{ marginLeft: 'auto' }}
                          >
                            <CheckCircle2 size={13} /> Виконано
                          </button>
                        )}

                        {statusChangingId === order.id && (
                          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-ink)' }} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        </motion.div>
      </AnimatePresence>

      {/* Quick Edit Shipping Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div
            onClick={() => setEditingOrder(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)', zIndex: 1100,
              display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
              padding: isMobile ? 0 : 20
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 40 : 0, scale: isMobile ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 40 : 0, scale: isMobile ? 1 : 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="dusk-glass"
              style={{
                borderRadius: isMobile ? '20px 20px 0 0' : 18,
                padding: isMobile ? 18 : 24,
                width: '100%',
                maxWidth: 540,
                maxHeight: '92vh',
                overflowY: 'auto',
                color: 'var(--color-ink)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-rule)' }}>
                <h3 className="dusk-heading" style={{ fontSize: 17 }}>
                  Редагувати доставку та оплату
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ padding: 6 }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveEditedShipping} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Ім'я</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="dusk-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Прізвище</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="dusk-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Телефон</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="dusk-input dusk-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>Спосіб доставки</label>
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
                        className={`dusk-facet-pill ${editForm.shipping_method === m.id ? 'active' : ''}`}
                        style={{ flex: 1, justifyContent: 'center', height: 34 }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {editForm.shipping_method !== 'pickup' && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Місто доставки</label>
                      <input
                        type="text"
                        placeholder="Введіть місто..."
                        value={npCityQuery}
                        onChange={(e) => {
                          setNpCityQuery(e.target.value);
                          setEditForm(prev => ({ ...prev, city: '', cityRef: '' }));
                          setNpShowCities(true);
                        }}
                        onFocus={() => { if (npCities.length > 0) setNpShowCities(true); }}
                        onBlur={() => setTimeout(() => setNpShowCities(false), 200)}
                        className="dusk-input"
                      />
                      {npLoadingCities && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 12, bottom: 12, color: 'var(--color-accent)' }} />}
                      {npShowCities && npCities.length > 0 && (
                        <div className="dusk-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {npCities.map(c => (
                            <button
                              key={c.Ref}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setEditForm(prev => ({ ...prev, city: c.Description, cityRef: c.Ref, warehouse: '' }));
                                setNpCityQuery(c.Description);
                                setNpWarehouseQuery('');
                                setNpShowCities(false);
                                setNpShowWarehouses(true);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12.5, cursor: 'pointer', borderRadius: 6 }}
                            >
                              {c.Description} <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>({c.AreaDescription})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Відділення / поштомат / адреса
                        {editForm.cityRef && !npLoadingWarehouses && npWarehouses.length > 0 && (
                          <span style={{ color: 'var(--color-accent)', marginLeft: 6 }}>({npWarehouses.length})</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Введіть номер або адресу відділення..."
                        value={npWarehouseQuery}
                        onChange={(e) => {
                          setNpWarehouseQuery(e.target.value);
                          setEditForm(prev => ({ ...prev, warehouse: '' }));
                          setNpShowWarehouses(true);
                        }}
                        onFocus={() => {
                          setNpShowCities(false);
                          if (editForm.cityRef || npWarehouses.length > 0) setNpShowWarehouses(true);
                        }}
                        onBlur={() => setTimeout(() => setNpShowWarehouses(false), 200)}
                        className="dusk-input"
                      />
                      {npLoadingWarehouses && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 12, bottom: 12, color: 'var(--color-accent)' }} />}
                      {npShowWarehouses && npFilteredWarehouses.length > 0 && (
                        <div className="dusk-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40, marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {npFilteredWarehouses.slice(0, 60).map(wh => (
                            <button
                              key={wh.Ref}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setEditForm(prev => ({ ...prev, warehouse: wh.Description }));
                                setNpWarehouseQuery(wh.Description);
                                setNpShowWarehouses(false);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}
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
                <div style={{ background: 'var(--color-paper-2)', padding: 12, borderRadius: 12, border: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.is_cod}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          is_cod: e.target.checked,
                          cod_amount: e.target.checked && !editForm.cod_amount ? String(editingOrder.total || '') : editForm.cod_amount
                        })}
                        style={{ accentColor: 'var(--color-accent-2)' }}
                      />
                      Накладений платіж (Наложка)
                    </label>

                    <select
                      value={editForm.payment_status}
                      onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                      className="dusk-select"
                      style={{ width: 'auto', height: 32, fontSize: 12 }}
                    >
                      <option value="pending">Очікує оплати</option>
                      <option value="partially_paid">Частково оплачено</option>
                      <option value="paid">Оплачено повністю</option>
                    </select>
                  </div>

                  {editForm.is_cod && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-accent-2)', display: 'block', marginBottom: 4 }}>Сума наложки (₴)</label>
                      <input
                        type="number"
                        value={editForm.cod_amount}
                        onChange={(e) => setEditForm({ ...editForm, cod_amount: e.target.value })}
                        placeholder="Сума до сплати на пошті"
                        className="dusk-input dusk-num"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Уточнення / нотатки</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="dusk-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="dusk-btn dusk-btn--primary"
                    style={{ flex: 1, justifyContent: 'center', height: 40 }}
                  >
                    {savingEdit ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="dusk-btn dusk-btn--ghost"
                    style={{ height: 40, padding: '0 18px' }}
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
