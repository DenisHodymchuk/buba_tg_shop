"use client";
import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Hammer, Search, Check, Clock, 
  ClipboardList, Printer, Truck, Send, 
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Meta definitions for order statuses
const STATUS_META = {
  new: { label: 'Нові', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
  shipping: { label: 'Готово до відправки', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
  shipped: { label: 'Відправлені', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send }
};

export default function ProductionCabinet({ orders, setOrders, showToast, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'printing', 'shipping']);
  const [expandedProductNames, setExpandedProductNames] = useState([]);

  // Aggregate items from active orders
  const productionList = useMemo(() => {
    const itemsMap = {};
    const query = searchQuery.toLowerCase();

    // Filter active orders based on status
    const activeOrders = orders.filter(o => 
      o.status !== 'completed' && 
      o.status !== 'cancelled' && 
      (selectedStatuses.length === 0 || selectedStatuses.includes(o.status))
    );

    activeOrders.forEach(order => {
      const details = order.shipping_details || {};
      const items = details.items || [];
      const clientName = `${details.firstName || ''} ${details.lastName || ''} ${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Гість';
      
      items.forEach(item => {
        const name = item.name || 'Невідомий виріб';
        
        // Search filter matching
        if (query && !name.toLowerCase().includes(query)) return;

        if (!itemsMap[name]) {
          itemsMap[name] = {
            name,
            totalQuantity: 0,
            manufacturedQuantity: 0,
            orders: []
          };
        }

        const isItemManufactured = !!item.is_manufactured;
        itemsMap[name].totalQuantity += (item.quantity || 1);
        if (isItemManufactured) {
          itemsMap[name].manufacturedQuantity += (item.quantity || 1);
        }

        itemsMap[name].orders.push({
          orderId: order.id,
          orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
          clientName,
          quantity: item.quantity || 1,
          status: order.status,
          isManufactured: isItemManufactured
        });
      });
    });

    return Object.values(itemsMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders, selectedStatuses, searchQuery]);

  // Derived checkedProducts map (fully checked if manufacturedQuantity === totalQuantity)
  const checkedProducts = useMemo(() => {
    const checked = {};
    productionList.forEach(item => {
      checked[item.name] = item.manufacturedQuantity === item.totalQuantity;
    });
    return checked;
  }, [productionList]);

  // Totals calculations based on actual order-level manufactured statuses
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

      // Update orders in Supabase
      const updatePromises = activeOrders.map(async (order) => {
        const details = order.shipping_details || {};
        const items = details.items || [];

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

      // Update parent state
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

  // Toggle manufactured state of a product for a specific order
  const toggleOrderItemCheck = async (orderId, productName, currentChecked) => {
    if (!supabase) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const details = order.shipping_details || {};
      const items = details.items || [];
      const newCheckedState = !currentChecked;

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
        .eq('id', orderId);

      if (error) throw error;

      // Update parent state
      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      if (showToast) {
        showToast(newCheckedState ? 'Виріб відмічено як виготовлений' : 'Відмітку виготовлення знято');
      }
    } catch (e) {
      console.error('Error toggling order item manufactured state:', e);
      if (showToast) showToast('Помилка оновлення статусу виготовлення', 'error');
    }
  };

  // Clear all checked items
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
        const items = details.items || [];

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

      // Update parent state
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

  // Toggle single status filter
  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Toggle single product card accordion
  const toggleProductExpand = (productName) => {
    setExpandedProductNames(prev => 
      prev.includes(productName) 
        ? prev.filter(name => name !== productName) 
        : [...prev, productName]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hammer size={28} style={{ color: '#a78bfa' }} /> Черга Виготовлення
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Список виробів, які потрібно виготовити для активних замовлень</p>
        </div>
        {totals.checkedCount > 0 && (
          <button 
            onClick={clearChecklist}
            style={{ 
              padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', center: 6,
              transition: 'all 0.2s'
            }}
          >
            Скинути відмітки
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
        
        {/* Total Unique Products */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Унікальних виробів</div>
          <div style={{ fontSize: 24, fontWeight: 950, color: '#fff' }}>{totals.uniqueProducts}</div>
        </div>

        {/* Total Quantities */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Всього одиниць до друку/збірки</div>
          <div style={{ fontSize: 24, fontWeight: 950, color: '#a78bfa' }}>{totals.totalItems} шт</div>
        </div>

        {/* Completed checklist ratio */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Виготовлено (відмічено)</div>
          <div style={{ fontSize: 24, fontWeight: 950, color: '#2dd4bf', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {totals.checkedCount} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>з {totals.totalItems} шт</span>
          </div>
        </div>

      </div>

      {/* Filters Cabinet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
        
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Шукати виріб за назвою..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статуси замовлень для обліку:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(STATUS_META).map(key => {
              const meta = STATUS_META[key];
              const active = selectedStatuses.includes(key);
              const Icon = meta.icon;
              return (
                <button 
                  key={key} 
                  onClick={() => toggleStatusFilter(key)} 
                  style={{ 
                    padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, 
                    background: active ? meta.bg : 'rgba(255,255,255,0.03)', 
                    color: active ? meta.color : 'var(--text-muted)', 
                    border: active ? `1px solid ${meta.color}33` : '1px solid transparent', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
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
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
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
                  background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', 
                  padding: 16, display: 'flex', flexDirection: 'column', gap: isExpanded ? 16 : 0,
                  position: 'relative', overflow: 'hidden',
                  opacity: isChecked ? 0.6 : 1,
                  transition: 'opacity 0.2s, gap 0.2s'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  
                  {/* Left checklist & title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div 
                      onClick={() => toggleCheckProduct(item.name, isChecked)}
                      style={{ 
                        width: 20, height: 20, border: isChecked ? 'none' : '2px solid var(--text-muted)', 
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: isChecked ? '#2dd4bf' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      {isChecked && <Check size={14} style={{ color: '#000', fontWeight: 900 }} />}
                    </div>
                    
                    <span 
                      onClick={() => toggleProductExpand(item.name)}
                      style={{ 
                        fontSize: 14, fontWeight: 800, color: isChecked ? 'var(--text-muted)' : '#fff', 
                        textDecoration: isChecked ? 'line-through' : 'none', cursor: 'pointer',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
                      }}
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* Quantity badge & accordion trigger */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: 12, fontWeight: 900, 
                      color: isChecked ? 'var(--text-muted)' : '#a78bfa',
                      background: isChecked ? 'rgba(255,255,255,0.03)' : 'rgba(167,139,250,0.1)', 
                      padding: '4px 10px', borderRadius: 8
                    }}>
                      {item.manufacturedQuantity > 0 && item.manufacturedQuantity < item.totalQuantity ? (
                        `${item.manufacturedQuantity} з ${item.totalQuantity} шт`
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
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '12px 0 8px 0' }} />
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Замовлення з цим виробом:</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {item.orders.map((ord, idx) => {
                          const statusMeta = STATUS_META[ord.status] || STATUS_META.new;
                          const StatusIcon = statusMeta.icon;
                          
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: 12,
                                fontSize: 12, gap: 12, flexWrap: 'wrap',
                                opacity: ord.isManufactured ? 0.6 : 1,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 150 }}>
                                {/* Order level checkbox */}
                                <div 
                                  onClick={() => toggleOrderItemCheck(ord.orderId, item.name, ord.isManufactured)}
                                  style={{ 
                                    width: 16, height: 16, border: ord.isManufactured ? 'none' : '2px solid var(--text-muted)', 
                                    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    background: ord.isManufactured ? '#2dd4bf' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                                    flexShrink: 0
                                  }}
                                >
                                  {ord.isManufactured && <Check size={12} style={{ color: '#000', fontWeight: 900 }} />}
                                </div>
                                
                                <strong style={{ color: '#fff', textDecoration: ord.isManufactured ? 'line-through' : 'none' }}>{ord.orderNumber}</strong>
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 650, textDecoration: ord.isManufactured ? 'line-through' : 'none' }}>{ord.clientName}</span>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontWeight: 800, color: '#fff' }}>Кількість: <strong style={{ color: '#a78bfa' }}>x{ord.quantity}</strong></span>
                                
                                <span style={{ 
                                  padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 900, 
                                  background: statusMeta.bg, color: statusMeta.color,
                                  display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                  {StatusIcon && <StatusIcon size={10} />}
                                  {statusMeta.label}
                                </span>
                              </div>
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
