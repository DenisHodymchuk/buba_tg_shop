"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, Settings, Trash2, Edit3, MoveLeft, MoveRight, 
  Clock, Printer, Truck, Send, CheckCircle2, XCircle, 
  Coins, User, Phone, ShoppingBag, AlertCircle, ArrowUpRight,
  Sparkles, Layers, ChevronRight, Eye, Tag, DollarSign, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Default columns setup
export const DEFAULT_KANBAN_COLUMNS = [
  {
    id: 'col_new',
    title: 'Нові замовлення',
    status: 'new',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    autoPaymentStatus: null, // 'paid', 'partially_paid', 'pending', etc.
    wipLimit: 0, // 0 = no limit
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
    autoPaymentStatus: 'paid', // Auto mark paid on completion if set
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
  { value: 'shipping', label: 'Готово до відправки' },
  { value: 'shipped', label: 'Відправлено поштою' },
  { value: 'completed', label: 'Виконано' },
  { value: 'cancelled', label: 'Скасовано' }
];

const SOURCE_LABELS = {
  website: { label: 'Сайт', color: '#3b82f6' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  telegram: { label: 'Telegram', color: '#0088cc' },
  olx: { label: 'OLX', color: '#ff5656' },
  facebook: { label: 'Facebook', color: '#1877f2' },
  tiktok: { label: 'TikTok', color: '#00f2fe' },
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
  onViewOrder,
  showToast 
}) {
  const [columns, setColumns] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);

  // Load columns configuration from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buba_kanban_columns');
      if (saved) {
        try {
          setColumns(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse kanban columns", e);
          setColumns(DEFAULT_KANBAN_COLUMNS);
        }
      } else {
        setColumns(DEFAULT_KANBAN_COLUMNS);
      }
    }
  }, []);

  const saveColumns = (newCols) => {
    setColumns(newCols);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_kanban_columns', JSON.stringify(newCols));
    }
  };

  const handleResetColumns = () => {
    if (confirm("Відновити початкові налаштування колонок?")) {
      saveColumns(DEFAULT_KANBAN_COLUMNS);
      showToast?.("Налаштування колонок скинуто до початкових", "success");
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    setDraggedOrderId(null);

    if (!orderId) return;

    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    // Check if moving to same status
    if (order.status === targetColumn.status) return;

    // Additional auto-actions configured for the target column
    const updates = {
      status: targetColumn.status
    };

    if (targetColumn.autoPaymentStatus) {
      updates.payment_status = targetColumn.autoPaymentStatus;
    }

    try {
      await onUpdateOrderStatus(order.id, updates);
      showToast?.(
        `Замовлення ${order.order_number || ''} переміщено в "${targetColumn.title}"`,
        "success"
      );
    } catch (err) {
      console.error("Error moving order:", err);
      showToast?.("Помилка змінення статусу замовлення", "error");
    }
  };

  // Column management actions
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

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header / Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 12,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '12px 18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
              Канбан Дошка Замовлень
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Перетягуйте картки між колонками для швидкої зміни статусу
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <Settings size={15} style={{ color: '#a78bfa' }} />
            Налаштувати колонки
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        overflowX: 'auto', 
        paddingBottom: 16,
        minHeight: 620,
        scrollSnapType: 'x mandatory'
      }}>
        {columns.map((col, index) => {
          // Filter orders matching column status
          const colOrders = orders.filter(o => o.status === col.status);
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
                flex: '0 0 320px',
                minWidth: 320,
                maxWidth: 340,
                background: isDropTarget ? `${col.color}15` : 'rgba(15, 23, 42, 0.45)',
                border: isDropTarget ? `2px dashed ${col.color}` : `1px solid ${col.borderColor || 'var(--border)'}`,
                borderRadius: 18,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                boxShadow: isDropTarget ? `0 0 20px ${col.color}30` : 'none'
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${col.borderColor || 'var(--border)'}`,
                background: col.bg || 'rgba(255,255,255,0.02)',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      width: 12, height: 12, borderRadius: '50%', 
                      background: col.color, 
                      boxShadow: `0 0 8px ${col.color}` 
                    }} />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      {col.title}
                    </h4>
                  </div>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 12, 
                    background: col.color + '22', color: col.color, 
                    fontSize: 12, fontWeight: 800 
                  }}>
                    {colOrders.length}
                    {col.wipLimit > 0 && ` / ${col.wipLimit}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Сума коштів:</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {colTotalSum.toLocaleString('uk-UA')} ₴
                  </span>
                </div>

                {isOverLimit && (
                  <div style={{ 
                    fontSize: 10, color: '#ef4444', fontWeight: 700, 
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 
                  }}>
                    <AlertCircle size={12} /> Превищено WIP ліміт колонки!
                  </div>
                )}
              </div>

              {/* Cards list */}
              <div style={{
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 280px)',
                minHeight: 200
              }}>
                {colOrders.length === 0 ? (
                  <div style={{
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 12,
                    gap: 6
                  }}>
                    <span>Немає замовлень</span>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KanbanCard 
                      key={order.id} 
                      order={order}
                      columnColor={col.color}
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onEditOrder={() => onEditOrder?.(order)}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button
                  onClick={handleResetColumns}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}
                >
                  Скинути до стандартних
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleAddColumn}
                    style={{ padding: '8px 14px', background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Додати колонку
                  </button>
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
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
function KanbanCard({ order, columnColor, onDragStart, onEditOrder, onViewOrder }) {
  const details = order.shipping_details || {};
  const customerName = details.fullName || details.name || details.first_name || (order.customers ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() : 'Клієнт');
  const items = details.items || [];
  const sourceInfo = SOURCE_LABELS[order.source] || SOURCE_LABELS.website;

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
      style={{
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: 14,
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.35), 0 0 12px ${columnColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
      }}
    >
      {/* Header: Order Number & Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 900, 
          color: '#fff', 
          fontFamily: 'monospace',
          letterSpacing: '0.03em'
        }}>
          #{order.order_number || String(order.id).slice(0, 8)}
        </span>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Source Tag */}
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 6,
            background: `${sourceInfo.color}20`,
            color: sourceInfo.color,
            border: `1px solid ${sourceInfo.color}35`
          }}>
            {sourceInfo.label}
          </span>

          {/* Payment Status Tag */}
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 6,
            background: paymentBadge.bg,
            color: paymentBadge.color
          }}>
            {paymentBadge.label}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', flexShrink: 0
        }}>
          <User size={14} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {customerName || 'Без імені'}
          </div>
          {details.phone && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={10} /> {details.phone}
            </div>
          )}
        </div>
      </div>

      {/* Products preview */}
      {items.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          padding: '6px 8px',
          fontSize: 11,
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <div style={{ fontWeight: 650, color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' }}>
            Товари ({items.length}):
          </div>
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {items.map(i => i.title || i.name).join(', ')}
          </div>
        </div>
      )}

      {/* Footer: Amount & Quick Action */}
      <div style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        marginTop: 4,
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#22c55e' }}>
          {Number(order.total || 0).toLocaleString('uk-UA')} ₴
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onEditOrder}
            title="Редагувати замовлення"
            style={{
              padding: 5,
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              color: '#a78bfa',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
