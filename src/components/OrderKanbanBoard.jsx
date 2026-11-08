"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Settings, Trash2, Edit3, 
  Clock, Printer, Truck, Send, CheckCircle2, XCircle, Palette,
  Coins, User, Phone, ShoppingBag, AlertCircle,
  Layers, ChevronRight, ChevronLeft, Copy, Star, MapPin, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorMeta } from '@/lib/orderHelpers';

// Default columns setup
export const DEFAULT_KANBAN_COLUMNS = [
  {
    id: 'col_new',
    title: 'Нові замовлення',
    status: 'new',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'Clock'
  },
  {
    id: 'col_printing',
    title: 'У виготовленні / Друк',
    status: 'printing',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'Printer'
  },
  {
    id: 'col_painting',
    title: 'Розфарбовується',
    status: 'painting',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'Palette'
  },
  {
    id: 'col_shipping',
    title: 'Готово до відправки',
    status: 'shipping',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.08)',
    borderColor: 'rgba(236, 72, 153, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'Truck'
  },
  {
    id: 'col_shipped',
    title: 'Відправлено поштою',
    status: 'shipped',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'Send'
  },
  {
    id: 'col_completed',
    title: 'Виконано',
    status: 'completed',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    autoPaymentStatus: 'paid',
    wipLimit: 0,
    icon: 'CheckCircle2'
  },
  {
    id: 'col_cancelled',
    title: 'Скасовано',
    status: 'cancelled',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    autoPaymentStatus: null,
    wipLimit: 0,
    icon: 'XCircle'
  }
];

const AVAILABLE_STATUSES = [
  { value: 'new', label: 'Нове' },
  { value: 'preparing', label: 'В підготовці' },
  { value: 'printing', label: 'Друкується / Виготовляється' },
  { value: 'painting', label: 'Розфарбовується' },
  { value: 'shipping', label: 'Готово до відправки' },
  { value: 'shipped', label: 'Відправлено поштою' },
  { value: 'completed', label: 'Виконано' },
  { value: 'cancelled', label: 'Скасовано' }
];

const SOURCE_LABELS = {
  website: { label: 'Сайт', color: '#3b82f6' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  telegram: { label: 'Telegram', color: '#0088cc' },
  olx: { label: 'OLX', color: '#23e5db' },
  facebook: { label: 'Facebook', color: '#1877f2' },
  tiktok: { label: 'TikTok', color: '#ff0050' },
  threads: { label: 'Threads', color: '#a855f7' },
  offline: { label: 'Офлайн', color: '#10b981' },
  other: { label: 'Інше', color: '#64748b' }
};

const COLOR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
  '#10b981', '#06b6d4', '#ef4444', '#a855f7', '#64748b'
];

export default function OrderKanbanBoard({ 
  orders = [], 
  onUpdateOrderStatus, 
  onEditOrder,
  onDuplicateOrder,
  onViewOrder,
  onAddOrder,
  showToast 
}) {
  const [columns, setColumns] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileColId, setActiveMobileColId] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollBoard = (direction) => {
    if (boardRef.current) {
      boardRef.current.scrollBy({ left: direction * 340, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || isMobile) return;

    const handleWheelNative = (e) => {
      if (e.deltaY === 0) return;

      let target = e.target;
      let cardsListEl = null;

      while (target && target !== boardEl && target !== document.body) {
        if (target.getAttribute && target.getAttribute('data-kanban-cards-list') === 'true') {
          cardsListEl = target;
          break;
        }
        target = target.parentElement;
      }

      if (cardsListEl) {
        e.preventDefault();
        cardsListEl.scrollTop += e.deltaY;
      } else {
        e.preventDefault();
        boardEl.scrollLeft += e.deltaY * 1.5;
      }
    };

    boardEl.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      boardEl.removeEventListener('wheel', handleWheelNative);
    };
  }, [isMobile]);

  // Load columns configuration from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buba_kanban_columns');
      let loadedCols = DEFAULT_KANBAN_COLUMNS;
      if (saved) {
        try {
          loadedCols = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse kanban columns", e);
        }
      }
      setColumns(loadedCols);
      if (loadedCols.length > 0) {
        setActiveMobileColId(loadedCols[0].id);
      }
    }
  }, []);

  const saveColumns = (newCols) => {
    setColumns(newCols);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_kanban_columns', JSON.stringify(newCols));
    }
  };

  const autoScrollAnimationRef = useRef(null);

  const stopAutoScroll = () => {
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  const autoScrollBoard = (e) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const mouseX = e.clientX;

    const edgeThreshold = 160;
    const maxSpeed = 22;

    if (mouseX > rect.right - edgeThreshold && mouseX < rect.right + 60) {
      const intensity = Math.min(1, Math.max(0.15, (edgeThreshold - (rect.right - mouseX)) / edgeThreshold));
      const speed = Math.round(intensity * maxSpeed);
      if (!autoScrollAnimationRef.current) {
        const step = () => {
          if (boardRef.current) boardRef.current.scrollLeft += speed;
          autoScrollAnimationRef.current = requestAnimationFrame(step);
        };
        autoScrollAnimationRef.current = requestAnimationFrame(step);
      }
    } else if (mouseX < rect.left + edgeThreshold && mouseX > rect.left - 60) {
      const intensity = Math.min(1, Math.max(0.15, (edgeThreshold - (mouseX - rect.left)) / edgeThreshold));
      const speed = Math.round(intensity * maxSpeed);
      if (!autoScrollAnimationRef.current) {
        const step = () => {
          if (boardRef.current) boardRef.current.scrollLeft -= speed;
          autoScrollAnimationRef.current = requestAnimationFrame(step);
        };
        autoScrollAnimationRef.current = requestAnimationFrame(step);
      }
    } else {
      stopAutoScroll();
    }
  };

  const handleResetColumns = () => {
    if (confirm("Відновити початкові налаштування колонок?")) {
      saveColumns(DEFAULT_KANBAN_COLUMNS);
      showToast?.("Налаштування колонок скинуто до початкових", "success");
    }
  };

  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedOrderId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
    autoScrollBoard(e);
  };

  const handleBoardDragOver = (e) => {
    e.preventDefault();
    autoScrollBoard(e);
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const moveOrderToColumn = async (order, targetColumn) => {
    if (!order || !targetColumn) return;
    if (order.status === targetColumn.status) return;

    const updates = { status: targetColumn.status };
    if (targetColumn.autoPaymentStatus) {
      updates.payment_status = targetColumn.autoPaymentStatus;
    }

    try {
      await onUpdateOrderStatus(order.id, updates);
      showToast?.(
        `Замовлення ${order.order_number || ''} → "${targetColumn.title}"`,
        "success"
      );
    } catch (err) {
      console.error("Error moving order:", err);
      showToast?.(`Помилка: ${err.message || err.details || "Неможливо змінити статус"}`, "error");
    }
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    stopAutoScroll();
    setDragOverColumnId(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    setDraggedOrderId(null);

    if (!orderId) return;
    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    await moveOrderToColumn(order, targetColumn);
  };

  const handleAddColumn = () => {
    const newCol = {
      id: 'col_' + Date.now(),
      title: 'Нова колонка',
      status: 'new',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      autoPaymentStatus: null,
      wipLimit: 0
    };
    saveColumns([...columns, newCol]);
    setEditingColumn(newCol);
  };

  const handleUpdateColumn = (updatedCol) => {
    const newCols = columns.map(c => c.id === updatedCol.id ? updatedCol : c);
    saveColumns(newCols);
    setEditingColumn(null);
    showToast?.("Колонку успішно оновлено", "success");
  };

  const handleDeleteColumn = (colId) => {
    if (columns.length <= 1) {
      showToast?.("Неможливо видалити останню колонку", "error");
      return;
    }
    if (confirm("Видалити цю колонку з дошки?")) {
      const newCols = columns.filter(c => c.id !== colId);
      saveColumns(newCols);
      showToast?.("Колонку видалено", "success");
    }
  };

  const handleMoveColumn = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= columns.length) return;
    const updated = [...columns];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    saveColumns(updated);
  };

  const visibleColumns = isMobile && activeMobileColId
    ? columns.filter(c => c.id === activeMobileColId)
    : columns;

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Sub Toolbar Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={14} style={{ color: '#a78bfa' }} />
          <span>Канбан дошка</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              <button
                type="button"
                onClick={() => scrollBoard(-1)}
                title="Прокрутити ліворуч"
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => scrollBoard(1)}
                title="Прокрутити праворуч"
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              color: '#e2e8f0',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer'
            }}
          >
            <Settings size={13} style={{ color: '#a78bfa' }} />
            Колонки
          </button>
        </div>
      </div>

      {/* Mobile Column Switcher Tabs */}
      {isMobile && (
        <div 
          className="hide-scrollbar"
          style={{ 
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 
          }}
        >
          {columns.map(col => {
            const count = orders.filter(o => o.status === col.status).length;
            const active = activeMobileColId === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveMobileColId(col.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: active ? `1px solid ${col.color}` : '1px solid var(--border)',
                  background: active ? `${col.color}22` : 'rgba(255,255,255,0.03)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span>{col.title}</span>
                <span style={{
                  padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 900,
                  background: active ? col.color : 'rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Kanban Board Container */}
      <div 
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        onDragLeave={() => stopAutoScroll()}
        style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 14, 
          overflowX: isMobile ? 'hidden' : 'auto', 
          overflowY: isMobile ? 'visible' : 'hidden',
          flex: 1,
          minHeight: 0,
          paddingBottom: 8,
          scrollBehavior: draggedOrderId ? 'auto' : 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#7c3aed rgba(15, 23, 42, 0.6)'
        }}
      >
        {visibleColumns.map((col) => {
          const colIndex = columns.findIndex(c => c.id === col.id);
          const prevCol = colIndex > 0 ? columns[colIndex - 1] : null;
          const nextCol = colIndex < columns.length - 1 ? columns[colIndex + 1] : null;

          const colOrders = orders
            .filter(o => o.status === col.status)
            .sort((a, b) => {
              const aPrio = a.shipping_details?.is_priority ? 1 : 0;
              const bPrio = b.shipping_details?.is_priority ? 1 : 0;
              if (aPrio !== bPrio) return bPrio - aPrio;
              return new Date(b.created_at) - new Date(a.created_at);
            });

          const colTotalSum = colOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
          const isOverLimit = col.wipLimit > 0 && colOrders.length > col.wipLimit;
          const isDropTarget = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col)}
              style={{
                flex: isMobile ? '1 1 auto' : '0 0 320px',
                minWidth: isMobile ? '100%' : 320,
                maxWidth: isMobile ? '100%' : 340,
                height: isMobile ? 'auto' : '100%',
                background: isDropTarget ? `${col.color}15` : 'rgba(15, 23, 42, 0.45)',
                border: isDropTarget ? `2px dashed ${col.color}` : `1px solid ${col.borderColor || 'var(--border)'}`,
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                boxShadow: isDropTarget ? `0 0 20px ${col.color}30` : 'none'
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${col.borderColor || 'var(--border)'}`,
                background: col.bg || 'rgba(255,255,255,0.02)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      width: 10, height: 10, borderRadius: '50%', 
                      background: col.color, 
                      boxShadow: `0 0 8px ${col.color}` 
                    }} />
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 850, color: '#fff' }}>
                      {col.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOrder?.(col.status);
                      }}
                      title={`Додати продаж у "${col.title}"`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 10, 
                      background: col.color + '22', color: col.color, 
                      fontSize: 11, fontWeight: 900 
                    }}>
                      {colOrders.length}
                      {col.wipLimit > 0 && ` / ${col.wipLimit}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Сума в колонці:</span>
                  <span style={{ fontWeight: 800, color: '#2dd4bf' }}>
                    {colTotalSum.toLocaleString('uk-UA')} ₴
                  </span>
                </div>

                {isOverLimit && (
                  <div style={{ 
                    fontSize: 10, color: '#ef4444', fontWeight: 700, 
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 
                  }}>
                    <AlertCircle size={12} /> Перевищено WIP ліміт колонки!
                  </div>
                )}
              </div>

              {/* Cards list */}
              <div 
                data-kanban-cards-list="true"
                style={{
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flex: 1,
                  minHeight: isMobile ? 160 : 0,
                  overflowY: isMobile ? 'visible' : 'auto'
                }}
              >
                {colOrders.length === 0 ? (
                  <div 
                    onClick={() => onAddOrder?.(col.status)}
                    style={{
                      height: 110,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 12,
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={18} />
                    <span>Додати замовлення сюди</span>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KanbanCard 
                      key={order.id} 
                      order={order}
                      columnColor={col.color}
                      prevCol={prevCol}
                      nextCol={nextCol}
                      onMovePrev={prevCol ? () => moveOrderToColumn(order, prevCol) : null}
                      onMoveNext={nextCol ? () => moveOrderToColumn(order, nextCol) : null}
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      onEditOrder={() => onEditOrder?.(order)}
                      onDuplicateOrder={() => onDuplicateOrder?.(order)}
                      onViewOrder={() => onViewOrder?.(order)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1e293b', border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 20, width: '100%', maxWidth: 550, maxHeight: '90vh',
                overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  ⚙️ Налаштування колонок Kanban
                </h3>
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {columns.map((c, i) => (
                  <div key={c.id} style={{
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.color }} />
                      <div>
                        <div style={{ fontWeight: 750, fontSize: 14 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Статус: <strong style={{ color: '#a78bfa' }}>{c.status}</strong>
                          {c.autoPaymentStatus && ` • Оплата → ${c.autoPaymentStatus}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        onClick={() => handleMoveColumn(i, -1)} 
                        disabled={i === 0}
                        style={{ padding: 6, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => handleMoveColumn(i, 1)} 
                        disabled={i === columns.length - 1}
                        style={{ padding: 6, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', opacity: i === columns.length - 1 ? 0.3 : 1 }}
                      >
                        ↓
                      </button>
                      <button 
                        onClick={() => setEditingColumn(c)} 
                        style={{ padding: 6, background: 'rgba(124,58,237,0.2)', border: 'none', borderRadius: 6, color: '#a78bfa', cursor: 'pointer' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteColumn(c.id)} 
                        style={{ padding: 6, background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={handleResetColumns}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, cursor: 'pointer', fontSize: 12 }}
                >
                  Скинути до стандартних
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleAddColumn}
                    style={{ padding: '8px 14px', background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Додати колонку
                  </button>
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                  >
                    Готово
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Single Column Sub-Modal */}
      <AnimatePresence>
        {editingColumn && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#0f172a', border: '1px solid #7c3aed',
                borderRadius: 18, width: '100%', maxWidth: 440, padding: 22,
                color: '#fff'
              }}
            >
              <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800 }}>
                Редагувати колонку
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    НАЗВА КОЛОНКИ
                  </label>
                  <input 
                    type="text"
                    value={editingColumn.title}
                    onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                    style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    ПРИВ'ЯЗАНИЙ СТАТУС ЗАМОВЛЕННЯ
                  </label>
                  <select
                    value={editingColumn.status}
                    onChange={(e) => setEditingColumn({ ...editingColumn, status: e.target.value })}
                    style={{ width: '100%', padding: 10, background: '#1e293b', border: '1px solid var(--border)', borderRadius: 10, color: '#fff' }}
                  >
                    {AVAILABLE_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label} ({s.value})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    КОЛІР КОЛОНКИ
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLOR_PALETTE.map(hex => (
                      <div 
                        key={hex}
                        onClick={() => setEditingColumn({ 
                          ...editingColumn, 
                          color: hex,
                          bg: `${hex}15`,
                          borderColor: `${hex}40`
                        })}
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: hex, cursor: 'pointer',
                          border: editingColumn.color === hex ? '3px solid #fff' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    АВТО-ЗМІНА СТАТУСУ ОПЛАТИ (НЕОБОВ'ЯЗКОВО)
                  </label>
                  <select
                    value={editingColumn.autoPaymentStatus || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, autoPaymentStatus: e.target.value || null })}
                    style={{ width: '100%', padding: 10, background: '#1e293b', border: '1px solid var(--border)', borderRadius: 10, color: '#fff' }}
                  >
                    <option value="">Без змін статусу оплати</option>
                    <option value="paid">Позначити як "Оплачено"</option>
                    <option value="partially_paid">Позначити як "Частково оплачено"</option>
                    <option value="pending">Позначити як "Очікує оплату"</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    WIP ЛІМІТ (МАКС. КІЛЬКІСТЬ КАРТОК, 0 = БЕЗ ЛІМІТУ)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={editingColumn.wipLimit || 0}
                    onChange={(e) => setEditingColumn({ ...editingColumn, wipLimit: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setEditingColumn(null)}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}
                >
                  Скасувати
                </button>
                <button
                  onClick={() => handleUpdateColumn(editingColumn)}
                  style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
                >
                  Зберегти
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Single Order Kanban Card Component
function KanbanCard({ 
  order, 
  columnColor, 
  prevCol, 
  nextCol, 
  onMovePrev, 
  onMoveNext, 
  onDragStart, 
  onDragEnd, 
  onEditOrder, 
  onDuplicateOrder 
}) {
  const details = order.shipping_details || {};
  const firstName = details.firstName || details.first_name || order.customers?.first_name || '';
  const lastName = details.lastName || details.last_name || order.customers?.last_name || '';
  const combinedFullName = `${firstName} ${lastName}`.trim();
  const customerName = combinedFullName || details.fullName || details.name || details.recipientName || 'Гість';
  const items = Array.isArray(details.items) ? details.items : [];
  const sourceInfo = SOURCE_LABELS[order.source] || SOURCE_LABELS.website;
  const isPriority = !!details.is_priority;

  const getPaymentBadge = (status) => {
    switch(status) {
      case 'paid':
        return { label: 'ОПЛАЧЕНО', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'partially_paid':
        return { label: 'ЧАСТКОВО', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
      case 'verifying':
        return { label: 'ПЕРЕВІРКА', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' };
      default:
        return { label: 'ОЧІКУЄ', bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' };
    }
  };

  const paymentBadge = getPaymentBadge(order.payment_status);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEditOrder}
      style={{
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(10px)',
        border: isPriority ? '1px solid rgba(251, 191, 36, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: 13,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        position: 'relative',
        boxShadow: isPriority ? '0 4px 16px rgba(251, 191, 36, 0.12)' : '0 4px 12px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      {/* Header: Order Number & Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isPriority && <Star size={13} fill="#fbbf24" stroke="#fbbf24" />}
          <span style={{ 
            fontSize: 12, 
            fontWeight: 900, 
            color: '#fff', 
            fontFamily: 'monospace'
          }}>
            {order.order_number ? order.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${String(order.id).slice(0, 8)}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9,
            fontWeight: 850,
            padding: '2px 6px',
            borderRadius: 6,
            background: `${sourceInfo.color}20`,
            color: sourceInfo.color,
            border: `1px solid ${sourceInfo.color}35`
          }}>
            {sourceInfo.label}
          </span>

          <span style={{
            fontSize: 9,
            fontWeight: 850,
            padding: '2px 6px',
            borderRadius: 6,
            background: paymentBadge.bg,
            color: paymentBadge.color
          }}>
            {paymentBadge.label}
          </span>
        </div>
      </div>

      {/* Customer Info & City */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {customerName}
          </div>
          {details.phone && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Phone size={10} /> {details.phone}
            </div>
          )}
        </div>
        {details.city && (
          <div style={{ fontSize: 10, fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, background: 'rgba(236,72,153,0.1)', padding: '3px 7px', borderRadius: 6 }}>
            <MapPin size={10} />
            <span>{details.city}</span>
          </div>
        )}
      </div>

      {/* Products with Per-Item Colors & Notes */}
      {items.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.28)',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 11,
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          {items.map((item, idx) => {
            const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
            const itemNote = item.item_note || item.color_details || item.note || '';
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: idx < items.length - 1 ? 5 : 0, borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 750, color: '#fff', fontSize: 11.5, lineHeight: 1.3 }}>
                    • {item.title || item.name}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#a78bfa', background: 'rgba(124,58,237,0.2)', padding: '1px 6px', borderRadius: 5, flexShrink: 0 }}>
                    x{item.quantity || 1}
                  </span>
                </div>

                {/* Color Badges */}
                {itemColors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 1 }}>
                    {itemColors.map((colName, cIdx) => {
                      const cMeta = getColorMeta(colName);
                      return (
                        <span key={cIdx} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 5,
                          background: 'rgba(255,255,255,0.06)', color: '#e2e8f0',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: cMeta.gradient || cMeta.hex,
                            border: `1px solid ${cMeta.border || '#fff'}`
                          }} />
                          {cMeta.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Item specific note / color details */}
                {itemNote && (
                  <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700, background: 'rgba(56,189,248,0.08)', padding: '2px 6px', borderRadius: 5, lineHeight: 1.3 }}>
                    🎨 {itemNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* General Order Notes / Clarifications */}
      {details.notes && (
        <div style={{
          padding: '6px 9px', borderRadius: 8,
          background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.35)',
          color: '#fbbf24', fontSize: 10.5, fontWeight: 750, lineHeight: 1.35
        }}>
          ⚠️ {details.notes}
        </div>
      )}

      {/* Footer: Amount & Quick Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 2,
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>
            {Number(order.total || 0).toLocaleString('uk-UA')} ₴
          </div>
          {details.is_cod && details.cod_amount > 0 && (
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#f97316' }}>
              Наложка: {details.cod_amount} ₴
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          {onMovePrev && (
            <button
              type="button"
              onClick={onMovePrev}
              title={`Перемістити в "${prevCol?.title}"`}
              style={{
                padding: '5px 7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 7, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronLeft size={13} />
            </button>
          )}
          {onMoveNext && (
            <button
              type="button"
              onClick={onMoveNext}
              title={`Перемістити в "${nextCol?.title}"`}
              style={{
                padding: '5px 8px', background: `${nextCol?.color || '#7c3aed'}22`, border: `1px solid ${nextCol?.color || '#7c3aed'}44`,
                borderRadius: 7, color: nextCol?.color || '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800
              }}
            >
              <ChevronRight size={13} />
            </button>
          )}
          {onDuplicateOrder && (
            <button
              type="button"
              onClick={onDuplicateOrder}
              title="Дублювати замовлення"
              style={{
                padding: 5, background: 'rgba(124, 58, 237, 0.15)', border: 'none',
                borderRadius: 7, color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <Copy size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onEditOrder}
            title="Редагувати замовлення"
            style={{
              padding: 5, background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: 7, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <Edit3 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
