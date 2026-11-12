// Hallmark Dusk Theme — OrderKanbanBoard
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Clock, Printer, Palette, ClipboardList, Truck, 
  CheckCircle2, XCircle, Star, Phone, MapPin, Copy, 
  Check, ChevronDown, ChevronUp, Edit3, Trash2, Send,
  ExternalLink, Package, Coins, MessageSquare, User,
  ArrowRight, ArrowLeft, MoreHorizontal, AlertCircle, GripVertical
} from 'lucide-react';
import { getColorMeta } from '@/lib/orderHelpers';
import { formatShortDateUa, getTodayKey, DONE_OR_SHIPPED_STATUSES } from '@/lib/calendarHelpers';

export const KANBAN_COLUMNS = [
  { id: 'new', title: 'Нове', shortTitle: 'Нові', signal: 'apricot', icon: Clock },
  { id: 'printing', title: 'Друк', shortTitle: 'Друк', signal: 'apricot', icon: Printer },
  { id: 'painting', title: 'Склейка / Розфарб.', shortTitle: 'Склейка', signal: 'apricot', icon: Palette },
  { id: 'preparing', title: 'Пакування', shortTitle: 'Пакування', signal: 'apricot', icon: ClipboardList },
  { id: 'shipping', title: 'Готово до відправки', shortTitle: 'До відправки', signal: 'apricot', icon: Truck },
  { id: 'shipped', title: 'В дорозі', shortTitle: 'В дорозі', signal: 'periwinkle', icon: Send },
  { id: 'completed', title: 'Виконано', shortTitle: 'Виконано', signal: 'periwinkle', icon: CheckCircle2 },
  { id: 'cancelled', title: 'Скасовано', shortTitle: 'Скасовано', signal: 'muted', icon: XCircle }
];

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

const getClientDisplayName = (sale) => {
  const details = sale?.shipping_details || {};
  const fromDetails = `${details.firstName || details.first_name || ''} ${details.lastName || details.last_name || ''}`.trim();
  if (fromDetails) return fromDetails;
  const fromCustomer = `${sale?.customers?.first_name || ''} ${sale?.customers?.last_name || ''}`.trim();
  if (fromCustomer) return fromCustomer;
  if (sale?.client_name) return sale.client_name;
  return 'Гість';
};

const formatCleanPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.startsWith('380') && digits.length === 12) return '0' + digits.slice(3);
  if (digits.startsWith('80') && digits.length === 11) return '0' + digits.slice(2);
  if (digits.length === 9 && !digits.startsWith('0')) return '0' + digits;
  return digits || String(phoneStr).trim();
};

export default function OrderKanbanBoard({
  sales = [],
  isMobile = false,
  selectedOrderIds = [],
  onToggleSelectOrder,
  isSelectMode = false,
  onStatusChange,
  onTogglePriority,
  onToggleItemManufactured,
  onSaveTtn,
  onEditSale,
  onDeleteSale,
  onDuplicateSale,
  showToast
}) {
  const [activeMobileCol, setActiveMobileCol] = useState('new');
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]);
  const [ttnInputs, setTtnInputs] = useState({});
  const [savingTtnId, setSavingTtnId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [hideCancelled, setHideCancelled] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  const boardScrollRef = useRef(null);
  const isBoardDraggingRef = useRef(false);
  const boardStartXRef = useRef(0);
  const boardScrollLeftRef = useRef(0);
  const dragAnimationFrameRef = useRef(null);

  const handleBoardMouseDown = (e) => {
    if (isMobile || !boardScrollRef.current) return;
    if (e.button !== 0) return;

    const target = e.target;
    if (
      target.closest('[data-kanban-card="true"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }

    isBoardDraggingRef.current = true;
    boardStartXRef.current = e.pageX - boardScrollRef.current.offsetLeft;
    boardScrollLeftRef.current = boardScrollRef.current.scrollLeft;
    boardScrollRef.current.style.cursor = 'grabbing';
    boardScrollRef.current.style.userSelect = 'none';
  };

  const handleBoardMouseMove = (e) => {
    if (!isBoardDraggingRef.current || !boardScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardScrollRef.current.offsetLeft;
    const walk = (x - boardStartXRef.current) * 1.35;
    boardScrollRef.current.scrollLeft = boardScrollLeftRef.current - walk;
  };

  const stopBoardDragging = () => {
    if (!isBoardDraggingRef.current) return;
    isBoardDraggingRef.current = false;
    if (boardScrollRef.current) {
      boardScrollRef.current.style.cursor = 'grab';
      boardScrollRef.current.style.userSelect = '';
    }
  };

  const handleBoardDragOverAutoScroll = (e) => {
    if (!draggedOrderId || !boardScrollRef.current) return;
    const container = boardScrollRef.current;
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 110;
    const maxSpeed = 18;

    if (dragAnimationFrameRef.current) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = null;
    }

    if (e.clientX - rect.left < edgeThreshold) {
      const intensity = Math.max(0.2, 1 - (e.clientX - rect.left) / edgeThreshold);
      container.scrollLeft -= Math.round(maxSpeed * intensity);
    } else if (rect.right - e.clientX < edgeThreshold) {
      const intensity = Math.max(0.2, 1 - (rect.right - e.clientX) / edgeThreshold);
      container.scrollLeft += Math.round(maxSpeed * intensity);
    }
  };

  useEffect(() => {
    return () => {
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }
    };
  }, []);

  const toggleExpandCard = (id, e) => {
    if (e) e.stopPropagation();
    if (typeof window !== 'undefined' && window.getSelection()?.toString().length > 0) return;
    setExpandedCards(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const copyText = (text, key, msg) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    if (key) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
    if (showToast && msg) showToast(msg, 'success');
  };

  const copyAllShippingData = (sale, e) => {
    if (e) e.stopPropagation();
    const details = sale.shipping_details || {};
    const clientName = getClientDisplayName(sale);
    const cleanPhone = formatCleanPhone(sale.client_phone || details.phone || sale.customers?.phone || '');
    const city = details.city || '';
    const warehouse = details.warehouse || '';
    const isCod = !!details.is_cod;
    const codAmount = details.cod_amount || sale.total || 0;
    const codLine = isCod ? `\nНакладений платіж: ${codAmount} ₴` : '\nОплачено (без наложки)';

    const fullText = `${clientName}\n${cleanPhone}${city ? `\n${city}` : ''}${warehouse ? `\n${warehouse}` : ''}${codLine}`;
    copyText(fullText, `all-${sale.id}`, 'Дані для ТТН скопійовано');
  };

  const copyTtnClientMessage = (sale, ttn, e) => {
    if (e) e.stopPropagation();
    const details = sale.shipping_details || {};
    const firstName = details.firstName || details.first_name || sale.customers?.first_name || (sale.client_name ? sale.client_name.split(' ')[0] : '');
    const isCod = !!details.is_cod;
    const codAmount = details.cod_amount || 0;
    const codLine = isCod && codAmount > 0 ? `\nДо сплати при отриманні (наложка): ${codAmount} ₴` : '';
    const msg = `Привіт${firstName ? `, ${firstName}` : ''}! Ваше замовлення відправлено\n\nНомер ТТН Нової Пошти: ${ttn}${codLine}\n\nДякуємо, що обрали BUBA Store!`;
    copyText(msg, `msg-${sale.id}`, 'Повідомлення з ТТН для клієнта скопійовано');
  };

  const handleSaveTtnClick = async (sale, andShip = false, e) => {
    if (e) e.stopPropagation();
    const currentVal = ttnInputs[sale.id] !== undefined ? ttnInputs[sale.id] : (sale.shipping_details?.ttn || '');
    const cleanTtn = currentVal.replace(/\s+/g, '').trim();
    setSavingTtnId(sale.id);
    try {
      await onSaveTtn(sale, cleanTtn, andShip);
    } finally {
      setSavingTtnId(null);
    }
  };

  // Group sales by column
  const columnsData = useMemo(() => {
    const map = {};
    KANBAN_COLUMNS.forEach(c => {
      map[c.id] = [];
    });

    sales.forEach(sale => {
      const st = sale.status && map[sale.status] ? sale.status : 'new';
      map[st].push(sale);
    });

    Object.keys(map).forEach(colId => {
      map[colId].sort((a, b) => {
        const aPrio = a.shipping_details?.is_priority ? 1 : 0;
        const bPrio = b.shipping_details?.is_priority ? 1 : 0;
        if (aPrio !== bPrio) return bPrio - aPrio;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    });

    return map;
  }, [sales]);

  const visibleColumns = useMemo(() => {
    return KANBAN_COLUMNS.filter(c => !hideCancelled || c.id !== 'cancelled' || (columnsData.cancelled?.length > 0));
  }, [hideCancelled, columnsData]);

  // Drag & Drop handlers
  const handleDragStart = (e, sale) => {
    setDraggedOrderId(sale.id);
    e.dataTransfer.setData('text/plain', String(sale.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    setDragOverColId(null);
    const droppedId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    setDraggedOrderId(null);

    if (!droppedId) return;
    const sale = sales.find(s => String(s.id) === String(droppedId));
    if (!sale || sale.status === targetColId) return;

    await onStatusChange(sale, targetColId);
  };

  const renderCard = (sale, colMeta) => {
    const details = sale.shipping_details || {};
    const isPriority = !!details.is_priority;
    const isCod = !!details.is_cod;
    const codAmount = parseFloat(details.cod_amount || 0);
    const totalAmount = parseFloat(sale.total || 0);
    const prepayment = isCod && codAmount > 0 ? Math.max(0, totalAmount - codAmount) : 0;
    const items = Array.isArray(sale.items) ? sale.items : (Array.isArray(details.items) ? details.items : []);
    const totalItemsCount = items.reduce((acc, it) => acc + (parseInt(it.quantity || it.count || 1, 10)), 0);
    const manufacturedCount = items.reduce((acc, it) => acc + (it.is_manufactured ? (parseInt(it.quantity || it.count || 1, 10)) : 0), 0);
    const allManufactured = items.length > 0 && manufacturedCount >= totalItemsCount;

    const cleanPhone = formatCleanPhone(sale.client_phone || details.phone || '');
    const ttnValue = details.ttn || '';
    const currentTtnInput = ttnInputs[sale.id] !== undefined ? ttnInputs[sale.id] : ttnValue;
    const isExpanded = expandedCards.includes(sale.id);
    const isSelected = selectedOrderIds.includes(sale.id);
    const platformLabel = PLATFORM_LABELS[sale.source] || PLATFORM_LABELS.other;
    const isPickup = sale.shipping_method === 'pickup' || details.city === 'Самовивіз';

    const colIdx = KANBAN_COLUMNS.findIndex(c => c.id === (sale.status || 'new'));
    const prevCol = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1] : null;
    const nextCol = colIdx >= 0 && colIdx < KANBAN_COLUMNS.length - 2 ? KANBAN_COLUMNS[colIdx + 1] : null;

    return (
      <div
        key={sale.id}
        data-kanban-card="true"
        draggable={!isMobile}
        onDragStart={(e) => handleDragStart(e, sale)}
        onDragEnd={() => { setDraggedOrderId(null); setDragOverColId(null); }}
        style={{
          background: isSelected
            ? 'var(--color-accent-soft)'
            : 'var(--color-paper)',
          borderRadius: 12,
          border: isSelected
            ? '1px solid var(--color-accent-border)'
            : isPriority
              ? '1px solid var(--color-accent-2-border)'
              : '1px solid var(--color-rule)',
          padding: compactCards ? '10px 12px' : '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: compactCards ? 7 : 10,
          position: 'relative',
          opacity: draggedOrderId === sale.id ? 0.45 : 1,
          cursor: isMobile ? 'default' : 'grab',
          transition: 'border-color 0.16s ease, background 0.16s ease, transform 0.16s ease'
        }}
      >
        {/* Top Row: Select, Priority, Order Number, Source, Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {(isSelectMode || isSelected) && onToggleSelectOrder && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => { e.stopPropagation(); onToggleSelectOrder(sale.id); }}
                style={{ width: 14, height: 14, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
            )}

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePriority(sale); }}
              title={isPriority ? 'Зняти пріоритет' : 'Пріоритетне замовлення'}
              style={{
                background: 'transparent', border: 'none', padding: 2, cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: isPriority ? 'var(--color-accent-2)' : 'var(--color-muted)'
              }}
            >
              <Star size={14} fill={isPriority ? 'var(--color-accent-2)' : 'transparent'} stroke={isPriority ? 'var(--color-accent-2)' : 'currentColor'} />
            </button>

            <span style={{
              fontSize: 10.5, fontWeight: 500, color: 'var(--color-ink-2)',
              background: 'var(--color-paper-2)', padding: '1px 7px', borderRadius: 999,
              border: '1px solid var(--color-rule)'
            }}>
              {platformLabel}
            </span>

            {details.due_date && (
              <span
                className="dusk-num"
                style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
                  background: (!DONE_OR_SHIPPED_STATUSES.includes(sale.status) && sale.status !== 'cancelled' && details.due_date <= getTodayKey())
                    ? 'var(--color-accent-2-soft)'
                    : 'var(--color-accent-soft)',
                  color: (!DONE_OR_SHIPPED_STATUSES.includes(sale.status) && sale.status !== 'cancelled' && details.due_date <= getTodayKey())
                    ? 'var(--color-accent-2)'
                    : 'var(--color-accent)',
                  border: `1px solid ${(!DONE_OR_SHIPPED_STATUSES.includes(sale.status) && sale.status !== 'cancelled' && details.due_date <= getTodayKey()) ? 'var(--color-accent-2-border)' : 'var(--color-accent-border)'}`
                }}
                title="Дата готовності"
              >
                До {formatShortDateUa(details.due_date)}{Number(details.due_days) > 1 ? ` (${details.due_days}д)` : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span className="dusk-num" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', marginRight: 2 }}>
              {totalAmount.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </span>
            {onEditSale && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditSale(sale); }}
                style={{
                  background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', color: 'var(--color-ink-2)',
                  borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
                title="Редагувати замовлення"
              >
                <Edit3 size={11.5} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => toggleExpandCard(sale.id, e)}
              style={{
                background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', color: 'var(--color-ink-2)',
                borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              title={isExpanded ? 'Згорнути картку' : 'Розгорнути всі деталі'}
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Client & Payment Badges */}
        <div
          onClick={(e) => toggleExpandCard(sale.id, e)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3, wordBreak: 'break-word' }}>
              {getClientDisplayName(sale)}
            </div>
            {cleanPhone && (
              <div className="dusk-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink-2)', marginTop: 3, letterSpacing: '0.01em' }}>
                {cleanPhone}
              </div>
            )}
          </div>

          {/* Payment / COD Signal Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            {isCod ? (
              <span className="dusk-badge dusk-badge--apricot" style={{ padding: '2px 7px', fontSize: 10.5 }}>
                Наложка: {codAmount} ₴
              </span>
            ) : sale.payment_status === 'paid' ? (
              <span className="dusk-badge dusk-badge--periwinkle" style={{ padding: '2px 7px', fontSize: 10.5 }}>
                <span className="dusk-dot dusk-dot--periwinkle" style={{ width: 5, height: 5 }} />
                Оплачено
              </span>
            ) : sale.payment_status === 'partially_paid' ? (
              <span className="dusk-badge dusk-badge--apricot" style={{ padding: '2px 7px', fontSize: 10.5 }}>
                Частково
              </span>
            ) : (
              <span className="dusk-badge dusk-badge--apricot" style={{ padding: '2px 7px', fontSize: 10.5 }}>
                <span className="dusk-dot dusk-dot--apricot" style={{ width: 5, height: 5 }} />
                Очікує
              </span>
            )}
          </div>
        </div>

        {/* Destination & TTN Badge (right under client & phone) */}
        {(details.city || ttnValue) && !compactCards && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, fontSize: 11.5, color: 'var(--color-ink-2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, minWidth: 0, flex: 1 }}>
              <MapPin size={12} style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word' }}>
                {details.city || 'Самовивіз'} {details.warehouse ? `• ${details.warehouse}` : ''}
              </span>
            </div>
            {ttnValue && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); copyText(ttnValue, `ttn-${sale.id}`, 'ТТН скопійовано'); }}
                className="dusk-mono"
                style={{
                  background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)',
                  color: 'var(--color-accent)', padding: '2px 6px', borderRadius: 5, fontSize: 10, fontWeight: 500,
                  cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3
                }}
                title="Скопіювати ТТН"
              >
                <Copy size={9} /> {ttnValue.slice(-6)}
              </button>
            )}
          </div>
        )}

        {/* Products & Colors list */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'var(--color-paper-2)', padding: '7px 9px', borderRadius: 8, border: '1px solid var(--color-rule)' }}>
            {items.map((item, idx) => {
              const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
              const itemNote = item.item_note || item.color_details || item.note || '';
              const isDone = !!item.is_manufactured;
              const qty = item.quantity || item.count || 1;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 3,
                    paddingBottom: idx < items.length - 1 ? 5 : 0,
                    borderBottom: idx < items.length - 1 ? '1px solid var(--color-rule)' : 'none',
                    opacity: isDone && sale.status === 'completed' ? 0.65 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); onToggleItemManufactured && onToggleItemManufactured(sale, idx); }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer', flex: 1, minWidth: 0 }}
                      title={isDone ? 'Виготовлено (клікніть щоб зняти)' : 'Відмітити як виготовлений'}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 4, flexShrink: 0, marginTop: 1.5,
                        border: isDone ? 'none' : '1.5px solid var(--color-muted)',
                        background: isDone ? 'var(--color-accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isDone && <Check size={10} style={{ color: 'var(--color-accent-ink)', strokeWidth: 2.5 }} />}
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word',
                        color: isDone ? 'var(--color-ink-2)' : 'var(--color-ink)',
                        textDecoration: isDone && ['shipping', 'shipped', 'completed'].includes(sale.status) ? 'none' : (isDone ? 'line-through' : 'none')
                      }}>
                        {item.name || item.title}
                      </span>
                    </div>

                    <span className="dusk-num" style={{
                      fontSize: 10.5, fontWeight: 600, color: 'var(--color-ink-2)',
                      background: 'var(--color-paper-3)', padding: '1px 6px', borderRadius: 5, flexShrink: 0
                    }}>
                      ×{qty}
                    </span>
                  </div>

                  {/* Colors & item note */}
                  {(itemColors.length > 0 || itemNote) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 20 }}>
                      {itemColors.map((cName, cIdx) => {
                        const cMeta = getColorMeta(cName);
                        return (
                          <span key={cIdx} style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            fontSize: 10, fontWeight: 500, lineHeight: 1, color: 'var(--color-ink-2)',
                            background: 'var(--color-paper)', padding: '3px 6px', borderRadius: 4,
                            border: '1px solid var(--color-rule)'
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, flexShrink: 0 }} />
                            <span>{cMeta.label}</span>
                          </span>
                        );
                      })}
                      {itemNote && (
                        <span style={{ fontSize: 10.5, color: 'var(--color-accent-2)', fontWeight: 500 }}>
                          ({itemNote})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Order General Note — Clean Dusk Note Strip */}
        {details.notes && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
            padding: '6px 9px',
            borderRadius: 7,
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid var(--color-rule)',
            borderLeft: '2px solid var(--color-accent-2)',
            fontSize: 11.5,
            lineHeight: 1.4,
            color: 'var(--color-ink-2)',
            wordBreak: 'break-word'
          }}>
            <MessageSquare size={12} style={{ color: 'var(--color-accent-2)', flexShrink: 0, marginTop: 2.5 }} />
            <span>{details.notes}</span>
          </div>
        )}

        {/* Expanded Section: 1-Click Copy, TTN Input, Edit/Delete */}
        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              paddingTop: 8, borderTop: '1px solid var(--color-rule)'
            }}
          >
            {/* Quick Copy Pills for Nova Poshta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              {cleanPhone && (
                <button
                  type="button"
                  onClick={() => copyText(cleanPhone, `ph-${sale.id}`, `Телефон скопійовано: ${cleanPhone}`)}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ height: 24, minHeight: 24, padding: '0 6px', fontSize: 10.5, gap: 3, whiteSpace: 'nowrap' }}
                >
                  <Copy size={10} /> Тел
                </button>
              )}
              <button
                type="button"
                onClick={() => copyText(getClientDisplayName(sale), `nm-${sale.id}`, 'ПІБ скопійовано')}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ height: 24, minHeight: 24, padding: '0 6px', fontSize: 10.5, gap: 3, whiteSpace: 'nowrap' }}
              >
                <Copy size={10} /> ПІБ
              </button>
              {details.city && (
                <button
                  type="button"
                  onClick={() => copyText(`${details.city}${details.warehouse ? `, ${details.warehouse}` : ''}`, `ad-${sale.id}`, 'Адресу скопійовано')}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ height: 24, minHeight: 24, padding: '0 6px', fontSize: 10.5, gap: 3, whiteSpace: 'nowrap' }}
                >
                  <Copy size={10} /> Адреса
                </button>
              )}
              <button
                type="button"
                onClick={(e) => copyAllShippingData(sale, e)}
                className="dusk-btn dusk-btn--sm"
                style={{
                  height: 24, minHeight: 24, padding: '0 7px', fontSize: 10.5, gap: 3, whiteSpace: 'nowrap',
                  flex: '1 0 auto', justifyContent: 'center',
                  background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderColor: 'var(--color-accent-border)'
                }}
              >
                {copiedKey === `all-${sale.id}` ? <Check size={10} /> : <Copy size={10} />} Всі дані
              </button>
            </div>

            {/* Inline TTN Input */}
            {!isPickup && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Введіть ТТН (20450...)"
                    value={currentTtnInput}
                    onChange={(e) => setTtnInputs({ ...ttnInputs, [sale.id]: e.target.value })}
                    className="dusk-input dusk-mono"
                    style={{ height: 30, fontSize: 11.5, padding: '0 10px' }}
                  />
                  <button
                    type="button"
                    disabled={savingTtnId === sale.id}
                    onClick={(e) => handleSaveTtnClick(sale, false, e)}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                  >
                    Зберегти
                  </button>
                </div>

                {currentTtnInput.trim().length >= 10 && sale.status !== 'shipped' && sale.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveTtnClick(sale, true, e)}
                    className="dusk-btn dusk-btn--primary dusk-btn--sm"
                    style={{ width: '100%', justifyContent: 'center', height: 30 }}
                  >
                    <Send size={11} /> Зберегти ТТН і позначити «В дорозі»
                  </button>
                )}

                {ttnValue && (
                  <button
                    type="button"
                    onClick={(e) => copyTtnClientMessage(sale, ttnValue, e)}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ width: '100%', justifyContent: 'center', height: 28, fontSize: 11 }}
                  >
                    <MessageSquare size={11} /> Повідомлення з ТТН клієнту
                  </button>
                )}
              </div>
            )}

            {/* Card Management Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onEditSale && onEditSale(sale)}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ height: 26, padding: '0 9px', fontSize: 11 }}
                >
                  <Edit3 size={11} /> Редагувати
                </button>
                {onDuplicateSale && (
                  <button
                    type="button"
                    onClick={() => onDuplicateSale(sale)}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                    title="Дублювати замовлення"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>

              {onDeleteSale && (
                <button
                  type="button"
                  onClick={() => onDeleteSale(sale.id)}
                  style={{
                    padding: '4px 7px', borderRadius: 6, border: '1px solid rgba(248, 113, 113, 0.22)',
                    background: 'rgba(248, 113, 113, 0.08)', color: 'var(--color-danger)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center'
                  }}
                  title="Видалити замовлення"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Stage Stepper Footer */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
            paddingTop: 6, borderTop: '1px solid var(--color-rule)'
          }}
        >
          {prevCol ? (
            <button
              type="button"
              onClick={() => onStatusChange(sale, prevCol.id)}
              title={`Назад: ${prevCol.title}`}
              style={{
                padding: '3px 7px', borderRadius: 6, border: '1px solid var(--color-rule)',
                background: 'var(--color-paper-2)', color: 'var(--color-muted)', fontSize: 10.5, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
              }}
            >
              <ArrowLeft size={10} /> {prevCol.shortTitle}
            </button>
          ) : <div />}

          {allManufactured && ['new', 'printing', 'painting'].includes(sale.status) && (
            <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 9.5, padding: '1px 6px' }}>
              Виготовлено
            </span>
          )}

          {nextCol ? (
            <button
              type="button"
              onClick={() => onStatusChange(sale, nextCol.id)}
              title={`Далі: ${nextCol.title}`}
              style={{
                padding: '3px 9px', borderRadius: 6,
                border: '1px solid var(--color-accent-border)',
                background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontSize: 10.5, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto'
              }}
            >
              {nextCol.shortTitle} <ArrowRight size={10} />
            </button>
          ) : sale.status === 'shipped' ? (
            <button
              type="button"
              onClick={() => onStatusChange(sale, 'completed')}
              style={{
                padding: '3px 9px', borderRadius: 6, border: '1px solid var(--color-accent-border)',
                background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontSize: 10.5, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto'
              }}
            >
              Виконано <Check size={10} />
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12, width: '100%' }}>
      {/* Kanban Toolbar Controls (Desktop only) */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
            <span>
              Перетягуйте картки між колонками або натискайте стрілки переходу етапів
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCompactCards(!compactCards)}
              className={`dusk-facet-pill ${compactCards ? 'active' : ''}`}
            >
              {compactCards ? 'Компактні картки' : 'Звичайні картки'}
            </button>

            <button
              type="button"
              onClick={() => setExpandedCards(expandedCards.length > 0 ? [] : sales.map(s => s.id))}
              className="dusk-facet-pill"
            >
              {expandedCards.length > 0 ? 'Згорнути всі' : 'Розгорнути всі'}
            </button>

            <button
              type="button"
              onClick={() => setHideCancelled(!hideCancelled)}
              className={`dusk-facet-pill ${!hideCancelled ? 'active' : ''}`}
            >
              {hideCancelled ? 'Показати скасовані' : 'Скасовані видно'}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW: Column Tabs + Single Active Column */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="dusk-pipeline hide-scrollbar" style={{ position: 'sticky', top: 4, zIndex: 20, backdropFilter: 'blur(12px)' }}>
            {visibleColumns.map(col => {
              const count = columnsData[col.id]?.length || 0;
              const isActive = activeMobileCol === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={(e) => {
                    setActiveMobileCol(col.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`dusk-pipeline__step ${isActive ? 'active' : ''}`}
                  style={{ flexShrink: 0, transition: 'background-color 0.18s, color 0.18s, border-color 0.18s' }}
                >
                  <span className={`dusk-dot ${col.signal === 'periwinkle' ? 'dusk-dot--periwinkle' : col.signal === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} />
                  <span>{col.shortTitle}</span>
                  <span className="dusk-pipeline__count">{count}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {(() => {
              const currentCol = KANBAN_COLUMNS.find(c => c.id === activeMobileCol) || KANBAN_COLUMNS[0];
              const colOrders = columnsData[currentCol.id] || [];
              const colSum = colOrders.reduce((acc, s) => acc + parseFloat(s.total || 0), 0);

              return (
                <motion.div
                  key={currentCol.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="dusk-panel"
                  style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: '55vh' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--color-rule)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`dusk-dot ${currentCol.signal === 'periwinkle' ? 'dusk-dot--periwinkle' : currentCol.signal === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>{currentCol.title}</span>
                      <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>({colOrders.length})</span>
                    </div>
                    <span className="dusk-num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-2)' }}>
                      {colSum.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                    </span>
                  </div>

                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-muted)', fontSize: 12 }}>
                      Немає замовлень на етапі «{currentCol.title}»
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {colOrders.map(sale => renderCard(sale, currentCol))}
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      ) : (
        /* DESKTOP VIEW: Horizontal Multi-Column Dusk Board */
        <div
          ref={boardScrollRef}
          onMouseDown={handleBoardMouseDown}
          onMouseMove={handleBoardMouseMove}
          onMouseUp={stopBoardDragging}
          onMouseLeave={stopBoardDragging}
          onDragOver={handleBoardDragOverAutoScroll}
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            paddingBottom: 16,
            alignItems: 'flex-start',
            minHeight: 'calc(100vh - 280px)',
            cursor: 'grab'
          }}
        >
          {visibleColumns.map(col => {
            const colOrders = columnsData[col.id] || [];
            const colSum = colOrders.reduce((acc, s) => acc + parseFloat(s.total || 0), 0);
            const isDragOver = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  minWidth: 350,
                  width: 350,
                  flexShrink: 0,
                  background: isDragOver ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                  borderRadius: 14,
                  border: isDragOver ? '1.5px dashed var(--color-accent)' : '1px solid var(--color-rule)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 190px)',
                  transition: 'all 0.16s ease'
                }}
              >
                {/* Column Header (Single Compact Row) */}
                <div style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--color-rule)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <span className={`dusk-dot ${col.signal === 'periwinkle' ? 'dusk-dot--periwinkle' : col.signal === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {col.title}
                    </span>
                    <span className="dusk-num" style={{
                      padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600, flexShrink: 0,
                      background: colOrders.length > 0 ? 'var(--color-paper-3)' : 'transparent',
                      color: colOrders.length > 0 ? 'var(--color-ink)' : 'var(--color-muted)',
                      border: '1px solid var(--color-rule)'
                    }}>
                      {colOrders.length}
                    </span>
                  </div>

                  {colOrders.length > 0 && (
                    <span className="dusk-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {colSum.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                    </span>
                  )}
                </div>

                {/* Column Cards Container */}
                <div style={{
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {colOrders.length === 0 ? (
                    <div style={{
                      padding: '32px 12px',
                      textAlign: 'center',
                      color: 'var(--color-muted)',
                      fontSize: 11.5,
                      border: '1px dashed var(--color-rule)',
                      borderRadius: 10
                    }}>
                      Перетягніть замовлення сюди
                    </div>
                  ) : (
                    colOrders.map(sale => renderCard(sale, col))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
