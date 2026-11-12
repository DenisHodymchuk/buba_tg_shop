// Hallmark Dusk Theme — ProductionCabinet
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Hammer, CheckCircle2, Clock, Printer, Palette, ClipboardList, 
  Truck, Search, Star, AlertCircle, Check, ChevronDown, ChevronUp, X,
  ExternalLink, Phone, MapPin, Copy, CreditCard, MessageSquare, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMeta, FILAMENT_COLORS, getChannelMeta } from '@/lib/orderHelpers';

const STATUS_META = {
  new: { label: 'Нове', signal: 'apricot', icon: Clock },
  printing: { label: 'Друк', signal: 'apricot', icon: Printer },
  painting: { label: 'Склейка / Розфарб.', signal: 'apricot', icon: Palette },
  preparing: { label: 'Пакування', signal: 'apricot', icon: ClipboardList },
  shipping: { label: 'До відправки', signal: 'apricot', icon: Truck }
};

export default function ProductionCabinet({ orders = [], setOrders, supabase, showToast, isMobile, onOpenOrderInSales }) {
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'printing', 'painting']);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductNames, setExpandedProductNames] = useState([]);
  const [specFilter, setSpecFilter] = useState('all'); // 'all' | 'priority' | 'custom_colors' | 'pending_only'
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (showToast) showToast(`Статус замовлення змінено на "${STATUS_META[newStatus]?.label || newStatus}"`);
    } catch (e) {
      console.error('Error updating order status:', e);
      if (showToast) showToast('Помилка зміни статусу замовлення', 'error');
    }
  };

  // Extract and group products that need to be manufactured
  const productionList = useMemo(() => {
    const map = {};

    orders.forEach(order => {
      if (!selectedStatuses.includes(order.status)) return;

      const details = order.shipping_details || {};
      const items = Array.isArray(details.items) ? details.items : [];
      const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Гість';
      const isPriority = !!details.is_priority;
      const orderNum = order.order_number ? order.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${String(order.id).slice(0, 6)}`;
      const orderNotes = details.notes || '';

      items.forEach((item, idx) => {
        if (!item.name) return;
        const nameKey = item.name.trim();
        const qty = parseInt(item.quantity || 1, 10);
        const isManufactured = !!item.is_manufactured;
        const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
        const itemNote = item.item_note || item.color_details || item.note || '';

        if (!map[nameKey]) {
          map[nameKey] = {
            name: nameKey,
            totalQuantity: 0,
            manufacturedQuantity: 0,
            orders: [],
            hasPriority: false,
            hasCustomSpecs: false
          };
        }

        map[nameKey].totalQuantity += qty;
        if (isManufactured) {
          map[nameKey].manufacturedQuantity += qty;
        }
        if (isPriority && !isManufactured) {
          map[nameKey].hasPriority = true;
        }
        if (itemColors.length > 0 || itemNote || orderNotes) {
          map[nameKey].hasCustomSpecs = true;
        }

        map[nameKey].orders.push({
          orderId: order.id,
          itemIdx: idx,
          orderNumber: orderNum,
          clientName,
          quantity: qty,
          status: order.status,
          isPriority,
          createdAt: order.created_at,
          isManufactured,
          colors: itemColors,
          itemNote,
          orderNotes
        });
      });
    });

    let list = Object.values(map);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.orders.some(o => 
          o.clientName.toLowerCase().includes(q) || 
          o.orderNumber.toLowerCase().includes(q) ||
          o.itemNote.toLowerCase().includes(q) ||
          o.orderNotes.toLowerCase().includes(q) ||
          o.colors.some(c => getColorMeta(c).label.toLowerCase().includes(q))
        )
      );
    }

    if (specFilter === 'priority') {
      list = list.filter(p => p.hasPriority);
    } else if (specFilter === 'custom_colors') {
      list = list.filter(p => p.hasCustomSpecs);
    } else if (specFilter === 'pending_only') {
      list = list.filter(p => p.manufacturedQuantity < p.totalQuantity);
    }

    // Sort: priority first, then highest remaining quantity
    return list.sort((a, b) => {
      const aDone = a.manufacturedQuantity >= a.totalQuantity && a.totalQuantity > 0;
      const bDone = b.manufacturedQuantity >= b.totalQuantity && b.totalQuantity > 0;
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (a.hasPriority !== b.hasPriority) return b.hasPriority ? 1 : -1;
      return (b.totalQuantity - b.manufacturedQuantity) - (a.totalQuantity - a.manufacturedQuantity);
    });
  }, [orders, selectedStatuses, searchQuery, specFilter]);

  const checkedProducts = useMemo(() => {
    const map = {};
    productionList.forEach(item => {
      map[item.name] = item.totalQuantity > 0 && item.manufacturedQuantity >= item.totalQuantity;
    });
    return map;
  }, [productionList]);

  const statusOrderCounts = useMemo(() => {
    const counts = {};
    Object.keys(STATUS_META).forEach(k => { counts[k] = 0; });
    orders.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return counts;
  }, [orders]);

  const totals = useMemo(() => {
    const totalItems = productionList.reduce((acc, item) => acc + item.totalQuantity, 0);
    const uniqueProducts = productionList.length;
    const checkedCount = productionList.reduce((acc, item) => acc + item.manufacturedQuantity, 0);
    const priorityModels = productionList.filter(i => i.hasPriority).length;
    return { totalItems, uniqueProducts, checkedCount, remainingCount: Math.max(0, totalItems - checkedCount), priorityModels };
  }, [productionList]);

  // Toggle manufactured state of all instances of a product in active orders
  const toggleCheckProduct = async (productName, currentChecked) => {
    if (!supabase) return;
    const newCheckedState = !currentChecked;

    try {
      const relevantOrders = orders.filter(order => selectedStatuses.includes(order.status));
      const updatePromises = relevantOrders.map(async (order) => {
        const details = order.shipping_details || {};
        const items = Array.isArray(details.items) ? details.items : [];

        let modified = false;
        const updatedItems = items.map(item => {
          if (item.name && item.name.trim() === productName) {
            modified = true;
            return { ...item, is_manufactured: newCheckedState };
          }
          return item;
        });

        if (!modified) return null;

        const updatedDetails = { ...details, items: updatedItems };
        const { error } = await supabase
          .from('orders')
          .update({ shipping_details: updatedDetails })
          .eq('id', order.id);

        if (error) throw error;
        return { orderId: order.id, updatedDetails };
      });

      const results = await Promise.all(updatePromises);

      let updatedOrders = [...orders];
      results.forEach(res => {
        if (res) {
          updatedOrders = updatedOrders.map(o => o.id === res.orderId ? { ...o, shipping_details: res.updatedDetails } : o);
        }
      });
      setOrders(updatedOrders);
      if (showToast) {
        showToast(newCheckedState ? `Всі одиниці "${productName}" відмічено як виготовлені` : `Відмітки виготовлення для "${productName}" знято`);
      }
    } catch (e) {
      console.error('Error toggling product manufactured state:', e);
      if (showToast) showToast('Помилка оновлення статусу виготовлення', 'error');
    }
  };

  // Toggle manufactured state of a specific item in a specific order
  const toggleOrderItemCheck = async (orderId, itemIdx, productName, currentChecked) => {
    if (!supabase) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const details = order.shipping_details || {};
      const items = Array.isArray(details.items) ? details.items : [];
      const newCheckedState = !currentChecked;

      const updatedItems = items.map((item, idx) => {
        if (itemIdx !== undefined ? idx === itemIdx : item.name === productName) {
          return { ...item, is_manufactured: newCheckedState };
        }
        return item;
      });

      const updatedDetails = { ...details, items: updatedItems };

      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      if (showToast) {
        showToast(newCheckedState ? 'Виріб відмічено як виготовлений' : 'Відмітку виготовлення знято');
      }
    } catch (e) {
      console.error('Error toggling order item manufactured state:', e);
      if (showToast) showToast('Помилка оновлення статусу виготовлення', 'error');
    }
  };

  const clearChecklist = async () => {
    if (!supabase) return;
    if (!window.confirm('Очистити статус виготовлення для всіх виробів у активних замовленнях?')) return;

    try {
      const activeOrders = orders.filter(o => 
        o.status !== 'completed' && 
        o.status !== 'cancelled'
      );

      const updatePromises = activeOrders.map(async (order) => {
        const details = order.shipping_details || {};
        const items = Array.isArray(details.items) ? details.items : [];

        const hasManufactured = items.some(item => item.is_manufactured);
        if (!hasManufactured) return null;

        const updatedItems = items.map(item => ({ ...item, is_manufactured: false }));
        const updatedDetails = { ...details, items: updatedItems };

        const { error } = await supabase
          .from('orders')
          .update({ shipping_details: updatedDetails })
          .eq('id', order.id);

        if (error) throw error;

        return { orderId: order.id, updatedDetails };
      });

      const results = await Promise.all(updatePromises);

      let updatedOrders = [...orders];
      results.forEach(res => {
        if (res) {
          updatedOrders = updatedOrders.map(o => o.id === res.orderId ? { ...o, shipping_details: res.updatedDetails } : o);
        }
      });
      setOrders(updatedOrders);
      if (showToast) showToast('Всі відмітки виготовлення скинуто');
    } catch (e) {
      console.error('Error clearing checklist:', e);
      if (showToast) showToast('Помилка при скиданні відміток', 'error');
    }
  };

  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleProductExpand = (productName) => {
    if (typeof window !== 'undefined' && window.getSelection()?.toString().length > 0) return;
    setExpandedProductNames(prev => 
      prev.includes(productName) 
        ? prev.filter(name => name !== productName) 
        : [...prev, productName]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: isMobile ? 70 : 0 }}>
      
      {/* Dusk Glass Header & Filter Command Bar */}
      <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Top Row: Title + Search + Expand/Collapse Actions */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div>
            <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>
              Черга виготовлення
            </h1>
            <p className="dusk-subheading" style={{ marginTop: 2 }}>
              Чек-лист моделей до 3D-друку, кольори пластику та уточнення по кожному замовленню
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Пошук виробу, кольору, клієнта..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dusk-input"
                style={{ paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, height: 34, fontSize: 12.5, borderRadius: 999 }}
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

            {productionList.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedProductNames(productionList.map(p => p.name))}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  Розгорнути всі
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedProductNames([])}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  Згорнути всі
                </button>
              </>
            )}

            {totals.checkedCount > 0 && (
              <button
                type="button"
                onClick={clearChecklist}
                className="dusk-btn dusk-btn--danger dusk-btn--sm"
              >
                Скинути відмітки
              </button>
            )}
          </div>
        </div>

        {/* Dusk Ruled Tally — 4 Key Production Figures */}
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
            <span className="dusk-tally__label">Унікальних моделей</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22 }}>
              {totals.uniqueProducts} <span className="dusk-currency"> поз.</span>
            </div>
            <span className="dusk-tally__sub">У вибраних етапах</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Залишилось виготовити</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: totals.remainingCount > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {totals.remainingCount} <span className="dusk-currency"> шт.</span>
            </div>
            <span className="dusk-tally__sub">Із {totals.totalItems} шт. загалом</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Вже готово</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: totals.checkedCount > 0 ? 'var(--color-accent)' : 'var(--color-ink)' }}>
              {totals.checkedCount} <span className="dusk-currency">/ {totals.totalItems} шт.</span>
            </div>
            <span className="dusk-tally__sub">
              {totals.totalItems > 0 ? `${Math.round((totals.checkedCount / totals.totalItems) * 100)}% виконано` : 'Немає в черзі'}
            </span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
            <span className="dusk-tally__label">Пріоритетні моделі</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: totals.priorityModels > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {totals.priorityModels}
            </div>
            <span className="dusk-tally__sub">Термінові замовлення</span>
          </div>
        </div>

        {/* Filter Strip: Stage Multi-Select + Spec Quick Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Етапи в обліку:</span>
            {Object.keys(STATUS_META).map(key => {
              const meta = STATUS_META[key];
              const active = selectedStatuses.includes(key);
              const count = statusOrderCounts[key] || 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleStatusFilter(key)}
                  className={`dusk-facet-pill ${active ? 'active' : ''}`}
                >
                  <span className={`dusk-dot ${active ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 6, height: 6 }} />
                  <span>{meta.label}</span>
                  <span className="dusk-num" style={{ fontSize: 10.5, opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Spec Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Фільтр:</span>
            {[
              { id: 'all', label: 'Усі моделі' },
              { id: 'pending_only', label: 'Тільки не виготовлені' },
              { id: 'priority', label: 'Пріоритетні', apricot: true },
              { id: 'custom_colors', label: 'З кольорами / уточненням' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSpecFilter(f.id)}
                className={`dusk-facet-pill ${specFilter === f.id ? (f.apricot ? 'active-apricot' : 'active') : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Production List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {productionList.length === 0 ? (
          <div className="dusk-panel" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-muted)', fontSize: 13 }}>
            <AlertCircle size={28} style={{ color: 'var(--color-muted)', margin: '0 auto 10px auto', opacity: 0.6 }} />
            Немає активних виробів для виготовлення за вибраними фільтрами.
          </div>
        ) : (
          productionList.map(item => {
            const isChecked = !!checkedProducts[item.name];
            const isExpanded = expandedProductNames.includes(item.name);

            return (
              <div 
                key={item.name}
                className="dusk-panel"
                style={{ 
                  border: item.hasPriority && !isChecked
                    ? '1px solid var(--color-accent-2-border)'
                    : '1px solid var(--color-rule)', 
                  padding: isMobile ? 14 : 16, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isExpanded ? 12 : 8,
                  opacity: isChecked ? 0.55 : 1,
                  transition: 'all 0.16s ease'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div 
                      onClick={() => toggleCheckProduct(item.name, isChecked)}
                      style={{ 
                        width: 20, height: 20,
                        border: isChecked ? 'none' : '1.5px solid var(--color-muted)', 
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: isChecked ? 'var(--color-accent)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.16s ease',
                        flexShrink: 0
                      }}
                      title={isChecked ? 'Зняти відмітку з усіх' : 'Відмітити всі як виготовлені'}
                    >
                      {isChecked && <Check size={13} style={{ color: 'var(--color-accent-ink)', strokeWidth: 2.5 }} />}
                    </div>
                    
                    <div 
                      onClick={() => toggleProductExpand(item.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, cursor: 'pointer' }}
                    >
                      {item.hasPriority && (
                        <Star size={14} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ 
                        fontSize: isMobile ? 13.5 : 14.5, fontWeight: 600,
                        color: isChecked ? 'var(--color-muted)' : 'var(--color-ink)', 
                        textDecoration: isChecked ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {item.name}
                      </span>
                      <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                        ({item.orders.length} замовл.)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span className={`dusk-badge dusk-num ${isChecked ? 'dusk-badge--neutral' : 'dusk-badge--periwinkle'}`} style={{ fontSize: 12, padding: '3px 10px' }}>
                      {item.manufacturedQuantity > 0 && item.manufacturedQuantity < item.totalQuantity
                        ? `${item.manufacturedQuantity} / ${item.totalQuantity} шт.`
                        : `${item.totalQuantity} шт.`}
                    </span>
                    <button 
                      type="button"
                      onClick={() => toggleProductExpand(item.name)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Inline Preview of Colors / Notes when collapsed */}
                {!isExpanded && item.hasCustomSpecs && (
                  <div 
                    onClick={() => toggleProductExpand(item.name)}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 30, cursor: 'pointer' }}
                  >
                    {item.orders.map((ord, idx) => {
                      if (ord.colors.length === 0 && !ord.itemNote && !ord.orderNotes) return null;
                      return (
                        <div 
                          key={idx}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                            background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                            borderRadius: 6, padding: '4px 9px', fontSize: 11.5, lineHeight: 1,
                            opacity: ord.isManufactured ? 0.45 : 1
                          }}
                        >
                          <span className="dusk-num" style={{ fontWeight: 600, color: 'var(--color-muted)', lineHeight: 1 }}>×{ord.quantity}:</span>
                          {ord.colors.map((cName, cIdx) => {
                            const cMeta = getColorMeta(cName);
                            return (
                              <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: cMeta.border ? `1px solid ${cMeta.border}` : '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }} />
                                <span>{cMeta.label}</span>
                              </span>
                            );
                          })}
                          {ord.itemNote && (
                            <span style={{ color: 'var(--color-accent-2)', fontWeight: 500 }}>({ord.itemNote})</span>
                          )}
                          {ord.orderNotes && !ord.itemNote && (
                            <span style={{ color: 'var(--color-accent-2)', fontWeight: 500 }}>• {ord.orderNotes}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expanded details (orders requiring this item) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ borderTop: '1px solid var(--color-rule)', margin: '4px 0 10px 0' }} />
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', marginBottom: 8 }}>
                        Замовлення з цим виробом ({item.orders.length}) — клікніть на замовлення для перегляду деталей:
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.orders.map((ord, idx) => {
                          const statusMeta = STATUS_META[ord.status] || STATUS_META.new;
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', flexDirection: 'column',
                                background: 'var(--color-paper)', padding: '10px 14px', borderRadius: 10,
                                fontSize: 12.5, gap: 8, border: '1px solid var(--color-rule)',
                                opacity: ord.isManufactured ? 0.55 : 1,
                                transition: 'opacity 0.16s ease, border-color 0.16s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOrderItemCheck(ord.orderId, ord.itemIdx, item.name, ord.isManufactured);
                                    }}
                                    title={ord.isManufactured ? 'Зняти відмітку виготовлення' : 'Відмітити як виготовлено'}
                                    style={{ 
                                      width: 18, height: 18,
                                      border: ord.isManufactured ? 'none' : '1.5px solid var(--color-muted)', 
                                      borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      background: ord.isManufactured ? 'var(--color-accent)' : 'transparent',
                                      cursor: 'pointer', flexShrink: 0
                                    }}
                                  >
                                    {ord.isManufactured && <Check size={11} style={{ color: 'var(--color-accent-ink)', strokeWidth: 2.5 }} />}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderId(ord.orderId)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      background: 'transparent',
                                      border: 'none',
                                      padding: '2px 6px',
                                      marginLeft: -6,
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      color: 'var(--color-ink)',
                                      textAlign: 'left',
                                      transition: 'background-color 0.14s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    title="Відкрити картку замовлення"
                                  >
                                    {ord.isPriority && <Star size={12} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" style={{ flexShrink: 0 }} />}
                                    <span className="dusk-mono" style={{ fontWeight: 600, color: 'var(--color-accent)', textDecoration: ord.isManufactured ? 'line-through' : 'underline', textUnderlineOffset: 3 }}>
                                      {ord.orderNumber}
                                    </span>
                                    <span style={{ color: 'var(--color-muted)' }}>—</span>
                                    <span style={{ color: 'var(--color-ink)', fontWeight: 500, textDecoration: ord.isManufactured ? 'line-through' : 'none' }}>
                                      {ord.clientName}
                                    </span>
                                  </button>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span className="dusk-badge dusk-badge--periwinkle dusk-num" style={{ padding: '4px 9px', fontSize: 11.5 }}>
                                    ×{ord.quantity}
                                  </span>
                                  
                                  <span className="dusk-badge dusk-badge--neutral" style={{ padding: '4px 10px', fontSize: 11.5 }}>
                                    <span className="dusk-dot dusk-dot--apricot" style={{ width: 6, height: 6 }} />
                                    <span>{statusMeta.label}</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderId(ord.orderId)}
                                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                    style={{ height: 26, padding: '0 9px', fontSize: 11.5 }}
                                  >
                                    <span>Замовлення</span>
                                    <ExternalLink size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Color Chips & Clarifications for this specific order item */}
                              {(ord.colors.length > 0 || ord.itemNote || ord.orderNotes) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 28 }}>
                                  {ord.colors.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                      <span style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1 }}>Кольори:</span>
                                      {ord.colors.map((cName, cIdx) => {
                                        const cMeta = getColorMeta(cName);
                                        return (
                                          <span key={cIdx} style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                            padding: '4px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, lineHeight: 1,
                                            background: 'var(--color-paper-2)', color: 'var(--color-ink)',
                                            border: '1px solid var(--color-rule)'
                                          }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: cMeta.border ? `1px solid ${cMeta.border}` : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                            <span>{cMeta.label}</span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {ord.itemNote && (
                                    <div className="dusk-apricot-strip">
                                      <span>Уточнення по виробу:</span>
                                      <strong style={{ color: 'var(--color-ink)' }}>{ord.itemNote}</strong>
                                    </div>
                                  )}
                                  {ord.orderNotes && (
                                    <div className="dusk-apricot-strip">
                                      <span>До замовлення:</span>
                                      <strong style={{ color: 'var(--color-ink)' }}>{ord.orderNotes}</strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Order Quick-View & Management Modal right inside ProductionCabinet */}
      <AnimatePresence>
        {selectedOrder && (() => {
          const details = selectedOrder.shipping_details || {};
          const items = Array.isArray(details.items) ? details.items : [];
          const clientName = `${details.firstName || ''} ${details.lastName || ''} ${selectedOrder.customers?.first_name || ''} ${selectedOrder.customers?.last_name || ''}`.trim() || 'Гість';
          const clientPhone = details.phone || selectedOrder.customers?.phone || '';
          const orderNum = selectedOrder.order_number ? selectedOrder.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${String(selectedOrder.id).slice(0, 6)}`;
          const channelMeta = getChannelMeta(details.channel || 'manual');
          const totalAmount = Number(selectedOrder.total_price || 0);
          const prepayment = Number(details.prepayment || 0);
          const codAmount = details.payment_status === 'paid' ? 0 : Math.max(0, totalAmount - prepayment);

          return (
            <div
              onClick={() => setSelectedOrderId(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'oklch(10% 0.014 268 / 0.78)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? 12 : 24
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className="dusk-panel"
                style={{
                  width: '100%', maxWidth: 640, maxHeight: '90vh',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  border: '1px solid var(--color-rule)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
                }}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--color-rule)',
                  background: 'var(--color-paper-2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="dusk-mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>
                      Замовлення {orderNum}
                    </span>
                    <span className="dusk-badge dusk-badge--periwinkle">
                      {channelMeta.label}
                    </span>
                    {details.is_priority && (
                      <span className="dusk-badge dusk-badge--apricot">
                        <Star size={11} fill="currentColor" /> Пріоритетне
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ width: 30, height: 30, padding: 0 }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Stage Switcher */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-muted)', marginBottom: 8 }}>
                      Етап виробництва / замовлення:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(STATUS_META).map(([stKey, stMeta]) => {
                        const active = selectedOrder.status === stKey;
                        return (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, stKey)}
                            className={`dusk-facet-pill ${active ? 'active' : ''}`}
                          >
                            <span className={`dusk-dot ${active ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 6, height: 6 }} />
                            <span>{stMeta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer & Delivery Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Клієнт</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{clientName}</div>
                      {clientPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--color-ink-2)' }}>
                          <Phone size={12} style={{ color: 'var(--color-muted)' }} />
                          <span className="dusk-mono">{clientPhone}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(clientPhone);
                              if (showToast) showToast('Телефон скопійовано');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 2 }}
                            title="Скопіювати телефон"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Доставка та Оплата</span>
                      <div style={{ fontSize: 12.5, color: 'var(--color-ink)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                        <MapPin size={13} style={{ color: 'var(--color-muted)', marginTop: 2, flexShrink: 0 }} />
                        <span>
                          {details.city ? `${details.city}${details.warehouse ? `, ${details.warehouse}` : ''}` : 'Самовивіз / Без адреси'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--color-ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={12} style={{ color: 'var(--color-muted)' }} />
                        <span className="dusk-num" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{totalAmount.toLocaleString('uk-UA')} ₴</span>
                        {codAmount > 0 ? (
                          <span className="dusk-badge dusk-badge--apricot" style={{ fontSize: 11, padding: '2px 8px' }}>
                            Наложка: {codAmount} ₴
                          </span>
                        ) : (
                          <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 11, padding: '2px 8px' }}>
                            Оплачено
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Note if present */}
                  {details.notes && (
                    <div className="dusk-apricot-strip">
                      <MessageSquare size={14} style={{ color: 'var(--color-accent-2)', flexShrink: 0 }} />
                      <span>Коментар до замовлення:</span>
                      <strong style={{ color: 'var(--color-ink)' }}>{details.notes}</strong>
                    </div>
                  )}

                  {/* All Items in this Order */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 8 }}>
                      Склад замовлення ({items.length} поз.):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((it, idx) => {
                        const isManuf = !!it.is_manufactured;
                        const itColors = Array.isArray(it.colors) ? it.colors : (it.color ? [it.color] : []);
                        const itNote = it.item_note || it.color_details || it.note || '';
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: 'var(--color-paper-2)',
                              border: '1px solid var(--color-rule)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <div
                                onClick={() => toggleOrderItemCheck(selectedOrder.id, idx, it.name, isManuf)}
                                style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', flex: 1 }}
                              >
                                <div style={{
                                  width: 18, height: 18, borderRadius: 5,
                                  border: isManuf ? 'none' : '1.5px solid var(--color-muted)',
                                  background: isManuf ? 'var(--color-accent)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                  {isManuf && <Check size={11} style={{ color: 'var(--color-accent-ink)', strokeWidth: 2.5 }} />}
                                </div>
                                <span style={{
                                  fontSize: 13.5, fontWeight: 600,
                                  color: isManuf ? 'var(--color-muted)' : 'var(--color-ink)',
                                  textDecoration: isManuf ? 'line-through' : 'none'
                                }}>
                                  {it.name}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="dusk-badge dusk-badge--periwinkle dusk-num">
                                  ×{it.quantity || 1} шт.
                                </span>
                                <span className="dusk-num" style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>
                                  {Number(it.price || 0).toLocaleString('uk-UA')} ₴
                                </span>
                              </div>
                            </div>

                            {(itColors.length > 0 || itNote) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 27, alignItems: 'center' }}>
                                {itColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span key={cIdx} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 5,
                                      padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, lineHeight: 1,
                                      background: 'var(--color-paper)', color: 'var(--color-ink)',
                                      border: '1px solid var(--color-rule)'
                                    }}>
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, flexShrink: 0 }} />
                                      <span>{cMeta.label}</span>
                                    </span>
                                  );
                                })}
                                {itNote && (
                                  <span style={{ fontSize: 12, color: 'var(--color-accent-2)', fontWeight: 500 }}>
                                    Уточнення: {itNote}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-rule)',
                  background: 'var(--color-paper-2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="dusk-btn dusk-btn--ghost"
                  >
                    Закрити
                  </button>

                  {onOpenOrderInSales && (
                    <button
                      type="button"
                      onClick={() => {
                        const ordToOpen = selectedOrder;
                        setSelectedOrderId(null);
                        onOpenOrderInSales(ordToOpen);
                      }}
                      className="dusk-btn dusk-btn--primary"
                    >
                      <span>Відкрити та редагувати в Продажах</span>
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
