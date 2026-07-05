"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Hammer, Search, Check, ShoppingBag, User, Clock, 
  ClipboardList, Printer, Truck, Send, CheckCircle2, 
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Meta definitions for order statuses
const STATUS_META = {
  new: { label: 'Нові', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  preparing: { label: 'Підготовка', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
  printing: { label: 'Друк', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
  shipping: { label: 'Очікують', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
  shipped: { label: 'Відправлені', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send }
};

export default function ProductionCabinet({ orders, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'preparing', 'printing', 'shipping']);
  const [expandedProductNames, setExpandedProductNames] = useState([]);
  const [checkedProducts, setCheckedProducts] = useState({});

  // Load checked items checklist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('buba_production_checklist');
      if (saved) {
        setCheckedProducts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load production checklist:', e);
    }
  }, []);

  // Save checklist to localStorage
  const toggleCheckProduct = (productName) => {
    setCheckedProducts(prev => {
      const updated = { ...prev, [productName]: !prev[productName] };
      localStorage.setItem('buba_production_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all checked items
  const clearChecklist = () => {
    if (window.confirm('Очистити весь список відмічених виробів?')) {
      setCheckedProducts({});
      localStorage.removeItem('buba_production_checklist');
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
            orders: []
          };
        }

        itemsMap[name].totalQuantity += (item.quantity || 1);
        itemsMap[name].orders.push({
          orderId: order.id,
          orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
          clientName,
          quantity: item.quantity || 1,
          status: order.status
        });
      });
    });

    return Object.values(itemsMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders, selectedStatuses, searchQuery]);

  // Totals calculations
  const totals = useMemo(() => {
    let totalItems = 0;
    let checkedCount = 0;

    productionList.forEach(item => {
      totalItems += item.totalQuantity;
      if (checkedProducts[item.name]) {
        checkedCount += item.totalQuantity;
      }
    });

    return {
      totalItems,
      checkedCount,
      uniqueProducts: productionList.length
    };
  }, [productionList, checkedProducts]);

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
              fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
                      onClick={() => toggleCheckProduct(item.name)}
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
                      {item.totalQuantity} шт
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
                                fontSize: 12, gap: 12, flexWrap: 'wrap'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 150 }}>
                                <strong style={{ color: '#fff' }}>{ord.orderNumber}</strong>
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 650 }}>{ord.clientName}</span>
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
