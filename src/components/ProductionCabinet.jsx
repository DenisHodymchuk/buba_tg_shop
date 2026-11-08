"use client";
import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Hammer, Search, Check, Clock, 
  ClipboardList, Printer, Truck, Send, 
  ChevronDown, ChevronUp, AlertCircle, Palette, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMeta } from '@/lib/orderHelpers';

// Meta definitions for order statuses
const STATUS_META = {
  new: { label: 'Нові', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  preparing: { label: 'В підготовці', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: ClipboardList },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
  painting: { label: 'Розфарбовується', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Palette },
  shipping: { label: 'Готово до відправки', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
  shipped: { label: 'Відправлені', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send }
};

export default function ProductionCabinet({ orders, setOrders, showToast, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'preparing', 'printing', 'painting', 'shipping']);
  const [expandedProductNames, setExpandedProductNames] = useState([]);

  // Aggregate items from active orders
  const productionList = useMemo(() => {
    const itemsMap = {};
    const query = searchQuery.toLowerCase();

    const activeOrders = orders.filter(o => 
      o.status !== 'completed' && 
      o.status !== 'cancelled' && 
      (selectedStatuses.length === 0 || selectedStatuses.includes(o.status))
    );

    activeOrders.forEach(order => {
      const details = order.shipping_details || {};
      const items = Array.isArray(details.items) ? details.items : [];
      const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Гість';
      const isPriority = !!details.is_priority;
      
      items.forEach((item, itemIdx) => {
        const name = item.name || 'Невідомий виріб';
        const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
        const itemNote = item.item_note || item.color_details || item.note || '';
        const orderNotes = details.notes || '';

        const searchText = `${name} ${clientName} ${itemColors.join(' ')} ${itemNote} ${orderNotes}`.toLowerCase();
        if (query && !searchText.includes(query)) return;

        if (!itemsMap[name]) {
          itemsMap[name] = {
            name,
            totalQuantity: 0,
            manufacturedQuantity: 0,
            hasPriority: false,
            hasCustomSpecs: false,
            orders: []
          };
        }

        const isItemManufactured = !!item.is_manufactured;
        const qty = parseInt(item.quantity) || 1;
        itemsMap[name].totalQuantity += qty;
        if (isItemManufactured) {
          itemsMap[name].manufacturedQuantity += qty;
        }
        if (isPriority) itemsMap[name].hasPriority = true;
        if (itemColors.length > 0 || itemNote || orderNotes) {
          itemsMap[name].hasCustomSpecs = true;
        }

        itemsMap[name].orders.push({
          orderId: order.id,
          itemIdx,
          orderNumber: order.order_number ? order.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${order.id.slice(0, 8)}`,
          clientName,
          quantity: qty,
          status: order.status,
          isManufactured: isItemManufactured,
          isPriority,
          colors: itemColors,
          itemNote,
          orderNotes
        });
      });
    });

    return Object.values(itemsMap).sort((a, b) => {
      if (a.hasPriority !== b.hasPriority) return b.hasPriority ? 1 : -1;
      return b.totalQuantity - a.totalQuantity;
    });
  }, [orders, selectedStatuses, searchQuery]);

  const checkedProducts = useMemo(() => {
    const checked = {};
    productionList.forEach(item => {
      checked[item.name] = item.manufacturedQuantity === item.totalQuantity && item.totalQuantity > 0;
    });
    return checked;
  }, [productionList]);

  const totals = useMemo(() => {
    let totalItems = 0;
    let checkedCount = 0;

    productionList.forEach(item => {
      totalItems += item.totalQuantity;
      checkedCount += item.manufacturedQuantity;
    });

    return {
      totalItems,
      checkedCount,
      uniqueProducts: productionList.length
    };
  }, [productionList]);

  // Toggle manufactured state of a product across ALL filtered active orders
  const toggleCheckProduct = async (productName, currentChecked) => {
    if (!supabase) return;
    try {
      const activeOrders = orders.filter(o => 
        o.status !== 'completed' && 
        o.status !== 'cancelled' && 
        (selectedStatuses.length === 0 || selectedStatuses.includes(o.status))
      );

      const newCheckedState = !currentChecked;

      const updatePromises = activeOrders.map(async (order) => {
        const details = order.shipping_details || {};
        const items = Array.isArray(details.items) ? details.items : [];

        const hasItem = items.some(item => item.name === productName);
        if (!hasItem) return null;

        const updatedItems = items.map(item => {
          if (item.name === productName) {
            return { ...item, is_manufactured: newCheckedState };
          }
          return item;
        });

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
        showToast(newCheckedState ? 'Виріб відмічено як виготовлений ✅' : 'Відмітку виготовлення знято');
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
    setExpandedProductNames(prev => 
      prev.includes(productName) 
        ? prev.filter(name => name !== productName) 
        : [...prev, productName]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24, width: '100%', paddingBottom: isMobile ? 70 : 0 }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hammer size={26} style={{ color: '#a78bfa' }} /> Черга Виготовлення
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Список виробів, кольори друку та уточнення по кожному замовленню
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {productionList.length > 0 && (
            <>
              <button
                onClick={() => setExpandedProductNames(productionList.map(p => p.name))}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                Розгорнути всі
              </button>
              <button
                onClick={() => setExpandedProductNames([])}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                Згорнути всі
              </button>
            </>
          )}
          {totals.checkedCount > 0 && (
            <button 
              onClick={clearChecklist}
              style={{ 
                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                fontWeight: 800, fontSize: 11, cursor: 'pointer'
              }}
            >
              Скинути відмітки
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: isMobile ? 16 : 24, border: '1px solid var(--border)', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Моделей</div>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 950, color: '#fff' }}>{totals.uniqueProducts}</div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: isMobile ? 16 : 24, border: '1px solid var(--border)', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>До друку</div>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 950, color: '#a78bfa' }}>{totals.totalItems} шт</div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: isMobile ? 16 : 24, border: '1px solid var(--border)', padding: isMobile ? 12 : 20 }}>
          <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Готово</div>
          <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 950, color: '#2dd4bf', display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {totals.checkedCount} <span style={{ fontSize: isMobile ? 11 : 14, color: 'var(--text-muted)', fontWeight: 700 }}>/ {totals.totalItems}</span>
          </div>
        </div>
      </div>

      {/* Filters Cabinet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: isMobile ? 18 : 24, padding: isMobile ? 14 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Шукати виріб, клієнта або колір..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статуси замовлень для обліку:</label>
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
                    padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, 
                    background: active ? meta.bg : 'rgba(255,255,255,0.03)', 
                    color: active ? meta.color : 'var(--text-muted)', 
                    border: active ? `1px solid ${meta.color}44` : '1px solid transparent', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.2s'
                  }}
                >
                  {Icon && <Icon size={12} />}
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Production List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {productionList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            Немає активних виробів для виготовлення за вибраними статусами.
          </div>
        ) : (
          productionList.map(item => {
            const isChecked = !!checkedProducts[item.name];
            const isExpanded = expandedProductNames.includes(item.name);

            return (
              <div 
                key={item.name}
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: 20, 
                  border: item.hasPriority && !isChecked ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid var(--border)', 
                  padding: isMobile ? 14 : 18, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: isExpanded ? 14 : 8,
                  position: 'relative', 
                  overflow: 'hidden',
                  opacity: isChecked ? 0.55 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div 
                      onClick={() => toggleCheckProduct(item.name, isChecked)}
                      style={{ 
                        width: 22, height: 22, border: isChecked ? 'none' : '2px solid var(--text-muted)', 
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: isChecked ? '#2dd4bf' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      {isChecked && <Check size={14} style={{ color: '#000', fontWeight: 900 }} />}
                    </div>
                    
                    <div 
                      onClick={() => toggleProductExpand(item.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, cursor: 'pointer' }}
                    >
                      {item.hasPriority && <Star size={14} fill="#fbbf24" stroke="#fbbf24" style={{ flexShrink: 0 }} />}
                      <span style={{ 
                        fontSize: isMobile ? 13.5 : 15, fontWeight: 850, color: isChecked ? 'var(--text-muted)' : '#fff', 
                        textDecoration: isChecked ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {item.name}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: 12, fontWeight: 900, 
                      color: isChecked ? 'var(--text-muted)' : '#a78bfa',
                      background: isChecked ? 'rgba(255,255,255,0.03)' : 'rgba(167,139,250,0.12)', 
                      padding: '4px 10px', borderRadius: 8
                    }}>
                      {item.manufacturedQuantity > 0 && item.manufacturedQuantity < item.totalQuantity ? (
                        `${item.manufacturedQuantity} / ${item.totalQuantity} шт`
                      ) : (
                        `${item.totalQuantity} шт`
                      )}
                    </span>
                    <button 
                      onClick={() => toggleProductExpand(item.name)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Inline Preview of Colors / Notes even when collapsed! */}
                {!isExpanded && item.hasCustomSpecs && (
                  <div 
                    onClick={() => toggleProductExpand(item.name)}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 32, cursor: 'pointer' }}
                  >
                    {item.orders.map((ord, idx) => {
                      if (ord.colors.length === 0 && !ord.itemNote && !ord.orderNotes) return null;
                      return (
                        <div 
                          key={idx}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
                            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8, padding: '3px 8px', fontSize: 10.5,
                            opacity: ord.isManufactured ? 0.45 : 1
                          }}
                        >
                          <span style={{ fontWeight: 800, color: '#94a3b8' }}>x{ord.quantity}:</span>
                          {ord.colors.map((cName, cIdx) => {
                            const cMeta = getColorMeta(cName);
                            return (
                              <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 800, color: '#fff' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: `1px solid ${cMeta.border || '#fff'}` }} />
                                {cMeta.label}
                              </span>
                            );
                          })}
                          {ord.itemNote && (
                            <span style={{ color: '#38bdf8', fontWeight: 750 }}>({ord.itemNote})</span>
                          )}
                          {ord.orderNotes && !ord.itemNote && (
                            <span style={{ color: '#fbbf24', fontWeight: 750 }}>⚠️ {ord.orderNotes}</span>
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
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0 10px 0' }} />
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                        Замовлення з цим виробом ({item.orders.length}):
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.orders.map((ord, idx) => {
                          const statusMeta = STATUS_META[ord.status] || STATUS_META.new;
                          const StatusIcon = statusMeta.icon;
                          
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', flexDirection: 'column',
                                background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 12,
                                fontSize: 12, gap: 8, border: '1px solid rgba(255,255,255,0.04)',
                                opacity: ord.isManufactured ? 0.55 : 1,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 150 }}>
                                  <div 
                                    onClick={() => toggleOrderItemCheck(ord.orderId, ord.itemIdx, item.name, ord.isManufactured)}
                                    style={{ 
                                      width: 18, height: 18, border: ord.isManufactured ? 'none' : '2px solid var(--text-muted)', 
                                      borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      background: ord.isManufactured ? '#2dd4bf' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                                      flexShrink: 0
                                    }}
                                  >
                                    {ord.isManufactured && <Check size={12} style={{ color: '#000', fontWeight: 900 }} />}
                                  </div>
                                  
                                  {ord.isPriority && <Star size={12} fill="#fbbf24" stroke="#fbbf24" />}
                                  <strong style={{ color: '#fff', textDecoration: ord.isManufactured ? 'line-through' : 'none' }}>{ord.orderNumber}</strong>
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  <span style={{ color: '#e2e8f0', fontWeight: 700, textDecoration: ord.isManufactured ? 'line-through' : 'none' }}>{ord.clientName}</span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontWeight: 900, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                                    x{ord.quantity}
                                  </span>
                                  
                                  <span style={{ 
                                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, 
                                    background: statusMeta.bg, color: statusMeta.color,
                                    display: 'inline-flex', alignItems: 'center', gap: 4
                                  }}>
                                    {StatusIcon && <StatusIcon size={10} />}
                                    {statusMeta.label}
                                  </span>
                                </div>
                              </div>

                              {/* Color Chips & Clarifications for this specific order item */}
                              {(ord.colors.length > 0 || ord.itemNote || ord.orderNotes) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 28 }}>
                                  {ord.colors.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>🎨 Кольори:</span>
                                      {ord.colors.map((cName, cIdx) => {
                                        const cMeta = getColorMeta(cName);
                                        return (
                                          <span key={cIdx} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                                            background: 'rgba(255,255,255,0.06)', color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.12)'
                                          }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: `1px solid ${cMeta.border || '#fff'}` }} />
                                            {cMeta.label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {ord.itemNote && (
                                    <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 750, background: 'rgba(56,189,248,0.08)', padding: '4px 8px', borderRadius: 7, alignSelf: 'flex-start' }}>
                                      🎨 Уточнення по виробу: <strong>{ord.itemNote}</strong>
                                    </div>
                                  )}
                                  {ord.orderNotes && (
                                    <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 750, background: 'rgba(245,158,11,0.08)', padding: '4px 8px', borderRadius: 7, alignSelf: 'flex-start' }}>
                                      ⚠️ До замовлення: <strong>{ord.orderNotes}</strong>
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

    </div>
  );
}
