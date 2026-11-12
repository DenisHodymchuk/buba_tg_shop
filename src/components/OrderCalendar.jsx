// Hallmark Dusk Theme — OrderCalendar (Production Deadlines & Workload Scheduler)
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Star,
  AlertCircle,
  Search,
  X,
  ArrowRight,
  Edit3,
  GripVertical
} from 'lucide-react';
import {
  ACTIVE_PRODUCTION_STATUSES,
  DONE_OR_SHIPPED_STATUSES,
  addDaysToKey,
  findNearestFreeDate,
  formatDateKey,
  formatShortDateUa,
  getDailyCapacity,
  getTodayKey,
  getWorkloadMap,
  getWorkloadTone,
  parseDateKey,
  saveDailyCapacity
} from '@/lib/calendarHelpers';

const WEEKDAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const STATUS_LABELS = {
  new: 'Нові',
  printing: 'Друк',
  painting: 'Склейка',
  preparing: 'Пакування',
  shipping: 'До відпр.',
  shipped: 'В дорозі',
  completed: 'Виконано',
  cancelled: 'Скасовано'
};

export default function OrderCalendar({
  orders = [],
  setOrders,
  supabase,
  showToast,
  isMobile = false,
  onEditOrder,
  onCreateOrderWithDate
}) {
  const todayKey = getTodayKey();
  const [viewType, setViewType] = useState(isMobile ? 'week' : 'month'); // 'month' | 'week'
  const [cursorDate, setCursorDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dailyCapacity, setDailyCapacity] = useState(() => getDailyCapacity());
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverDateKey, setDragOverDateKey] = useState(null);
  const [dragOverUnscheduled, setDragOverUnscheduled] = useState(false);
  const [unscheduledSearch, setUnscheduledSearch] = useState('');
  const [showDoneOrders, setShowDoneOrders] = useState(true);
  const [selectedDayMobile, setSelectedDayMobile] = useState(todayKey);

  useEffect(() => {
    saveDailyCapacity(dailyCapacity);
  }, [dailyCapacity]);

  const workloadMap = useMemo(() => getWorkloadMap(orders), [orders]);

  // Nearest free day starting from today
  const nearestFreeDay = useMemo(
    () => findNearestFreeDate(workloadMap, dailyCapacity, 0),
    [workloadMap, dailyCapacity]
  );

  // Active unscheduled orders
  const unscheduledOrders = useMemo(() => {
    const q = unscheduledSearch.trim().toLowerCase();
    return (orders || [])
      .filter(o => {
        if (!o || o.status === 'cancelled') return false;
        if (!ACTIVE_PRODUCTION_STATUSES.includes(o.status)) return false;
        if (o.shipping_details?.due_date) return false;
        if (!q) return true;
        const details = o.shipping_details || {};
        const name = `${details.firstName || ''} ${details.lastName || ''} ${o.client_name || ''}`.toLowerCase();
        const itemsText = (details.items || []).map(i => i.name || '').join(' ').toLowerCase();
        const num = (o.order_number || '').toLowerCase();
        return name.includes(q) || itemsText.includes(q) || num.includes(q);
      })
      .sort((a, b) => {
        const aP = a.shipping_details?.is_priority ? 1 : 0;
        const bP = b.shipping_details?.is_priority ? 1 : 0;
        if (aP !== bP) return bP - aP;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [orders, unscheduledSearch]);

  // KPI metrics
  const metrics = useMemo(() => {
    let dueTodayOrOverdue = 0;
    let totalScheduledActive = 0;

    (orders || []).forEach(o => {
      if (!o || o.status === 'cancelled') return;
      if (DONE_OR_SHIPPED_STATUSES.includes(o.status)) return;
      const due = o.shipping_details?.due_date;
      if (!due) return;
      totalScheduledActive += 1;
      if (due <= todayKey) dueTodayOrOverdue += 1;
    });

    return {
      dueTodayOrOverdue,
      totalScheduledActive,
      unscheduledCount: unscheduledOrders.length
    };
  }, [orders, todayKey, unscheduledOrders.length]);

  // Build calendar cells for Month or Week view
  const calendarDays = useMemo(() => {
    const base = new Date(cursorDate);
    base.setHours(0, 0, 0, 0);

    if (viewType === 'week') {
      const dayOfWeek = (base.getDay() + 6) % 7; // Mon = 0 .. Sun = 6
      const monday = new Date(base);
      monday.setDate(base.getDate() - dayOfWeek);

      return Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        return {
          date: d,
          key: formatDateKey(d),
          inCurrentMonth: true
        };
      });
    }

    // Month grid (Mon..Sun, 5 or 6 weeks)
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + lastOfMonth.getDate()) / 7) * 7;

    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: totalCells }, (_, idx) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + idx);
      return {
        date: d,
        key: formatDateKey(d),
        inCurrentMonth: d.getMonth() === month
      };
    });
  }, [cursorDate, viewType]);

  const navigatePeriod = (dir) => {
    const next = new Date(cursorDate);
    if (viewType === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setCursorDate(next);
  };

  const jumpToDate = (dateKey) => {
    const d = parseDateKey(dateKey);
    if (!d) return;
    setCursorDate(d);
    if (isMobile) setSelectedDayMobile(dateKey);
  };

  // Persist due_date & optional due_days update to Supabase & local state
  const updateOrderDueDate = async (orderId, newDueDate, newDays = undefined) => {
    const target = orders.find(o => String(o.id) === String(orderId));
    if (!target) return;

    const oldDetails = target.shipping_details || {};
    const targetDate = newDueDate !== undefined ? newDueDate : (oldDetails.due_date || '');
    const targetDays = newDays !== undefined ? Math.max(1, Math.min(7, Number(newDays) || 1)) : (Number(oldDetails.due_days) || 1);

    if ((oldDetails.due_date || '') === targetDate && (Number(oldDetails.due_days) || 1) === targetDays) return;

    const updatedDetails = { ...oldDetails };
    if (targetDate) {
      updatedDetails.due_date = targetDate;
      if (targetDays > 1) {
        updatedDetails.due_days = targetDays;
      } else {
        delete updatedDetails.due_days;
      }
    } else {
      delete updatedDetails.due_date;
      delete updatedDetails.due_days;
    }

    // Optimistic update
    setOrders(prev => prev.map(o =>
      String(o.id) === String(orderId) ? { ...o, shipping_details: updatedDetails } : o
    ));

    try {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);
      if (error) throw error;

      showToast?.(
        !targetDate
          ? 'Дату готовності знято'
          : newDays !== undefined && newDueDate === undefined
            ? `Тривалість: ${targetDays} дн.`
            : `Заплановано на ${formatShortDateUa(targetDate)}${targetDays > 1 ? ` (${targetDays} дн.)` : ''}`,
        'success'
      );
    } catch (err) {
      // Rollback
      setOrders(prev => prev.map(o =>
        String(o.id) === String(orderId) ? target : o
      ));
      showToast?.('Не вдалося оновити дату замовлення', 'error');
    }
  };

  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', String(orderId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDay = async (e, targetDateKey) => {
    e.preventDefault();
    setDragOverDateKey(null);
    const id = e.dataTransfer.getData('text/plain') || draggedOrderId;
    setDraggedOrderId(null);
    if (!id) return;
    await updateOrderDueDate(id, targetDateKey);
  };

  const getOrderDisplayTitle = (order) => {
    const details = order.shipping_details || {};
    const name = `${details.firstName || ''} ${details.lastName || ''}`.trim() || order.client_name || 'Гість';
    return name;
  };

  const getOrderItemsCount = (order) => {
    const items = Array.isArray(order.shipping_details?.items) ? order.shipping_details.items : [];
    return items.reduce((s, i) => s + (Number(i.quantity) || 1), 0) || 1;
  };

  const getFirstItemName = (order) => {
    const items = Array.isArray(order.shipping_details?.items) ? order.shipping_details.items : [];
    return items[0]?.name || items[0]?.title || 'Замовлення';
  };

  const formatCalendarItemName = (rawName) => {
    const cleaned = String(rawName || 'Фігурка')
      .replace(/^(Колекційна\s+фігурка|Фігурка)\s+/i, '')
      .trim();
    return cleaned.replace(/^["«](.+)["»]$/, '$1').trim() || rawName || 'Фігурка';
  };

  const getOrderItemsList = (order) => {
    const items = Array.isArray(order.shipping_details?.items) ? order.shipping_details.items : [];
    if (items.length === 0) return [{ name: 'Замовлення', shortName: 'Замовлення', qty: 1 }];
    return items.map(it => {
      const full = it?.name || it?.title || 'Фігурка';
      return {
        name: full,
        shortName: formatCalendarItemName(full),
        qty: Number(it?.quantity) || 1
      };
    });
  };

  const getMultiDayBadgeText = (order) => {
    const total = order._spanTotalDays || 1;
    if (total <= 1) return null;
    const idx = order._spanDayIndex || 0;
    if (idx === 0) return `1/${total}д →`;
    if (idx === total - 1) return `← ${idx + 1}/${total}д`;
    return `← ${idx + 1}/${total}д →`;
  };

  const headerLabel = useMemo(() => {
    if (viewType === 'week' && calendarDays.length === 7) {
      return `${formatShortDateUa(calendarDays[0].key)} — ${formatShortDateUa(calendarDays[6].key)} · ${calendarDays[0].date.getFullYear()}`;
    }
    return `${MONTHS_UA[cursorDate.getMonth()]} ${cursorDate.getFullYear()}`;
  }, [cursorDate, viewType, calendarDays]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14, width: '100%', paddingBottom: isMobile ? 76 : 12 }}>
      {/* Top Glass Header & Controls */}
      <div className="dusk-glass" style={{ padding: isMobile ? '10px 12px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 14 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 8 : 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 22, display: 'flex', alignItems: 'center', gap: 7, margin: 0 }}>
                <CalendarIcon size={isMobile ? 16 : 20} style={{ color: 'var(--color-accent)' }} />
                <span>{isMobile ? 'Календар' : 'Календар замовлень'}</span>
              </h1>
              {!isMobile && (
                <p className="dusk-subheading" style={{ marginTop: 2 }}>
                  Планування дедлайнів, завантаження по днях та перетягування замовлень між датами
                </p>
              )}
            </div>

            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowDoneOrders(!showDoneOrders)}
                  className={`dusk-facet-pill ${showDoneOrders ? 'active' : ''}`}
                  style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                >
                  <CheckCircle2 size={12} />
                  <span>Готові</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexWrap: 'wrap', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            {!isMobile && (
              <button
                type="button"
                onClick={() => setShowDoneOrders(!showDoneOrders)}
                className={`dusk-facet-pill ${showDoneOrders ? 'active' : ''}`}
                style={{ height: 34, padding: '0 12px', fontSize: 12 }}
              >
                <CheckCircle2 size={13} />
                <span>Готові</span>
              </button>
            )}

            {/* Month / Week Switcher */}
            <div className="dusk-segmented">
              {[
                { id: 'month', label: 'Місяць' },
                { id: 'week', label: 'Тиждень' }
              ].map(({ id, label }) => {
                const isActive = viewType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setViewType(id)}
                    className={`dusk-segmented__item ${isActive ? 'active' : ''}`}
                    style={{
                      position: 'relative',
                      background: 'transparent',
                      boxShadow: 'none',
                      ...(isMobile ? { height: 26, padding: '0 9px', fontSize: 11 } : {})
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="calendarViewSlider"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 7,
                          background: 'var(--color-paper-3)',
                          boxShadow: 'inset 0 0 0 1px var(--color-accent-border)',
                          zIndex: 0
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Period Navigation */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => navigatePeriod(-1)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, padding: 0, justifyContent: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => jumpToDate(todayKey)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ height: isMobile ? 28 : 32, padding: isMobile ? '0 8px' : '0 10px', fontSize: isMobile ? 11 : 12 }}
              >
                Сьогодні
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, padding: 0, justifyContent: 'center' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <span className="dusk-heading" style={{ fontSize: isMobile ? 13 : 15, minWidth: isMobile ? '100%' : 130, textAlign: isMobile ? 'left' : 'right' }}>
              {headerLabel}
            </span>
          </div>
        </div>

        {/* 4-Cell Dusk Workload Tally */}
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
          <div className="dusk-tally__cell" style={{ padding: isMobile ? '6px 10px' : '11px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10 } : undefined}>
              {isMobile ? 'Сьогодні / простр.' : 'На сьогодні / прострочені'}
            </span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 21, color: metrics.dueTodayOrOverdue > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {metrics.dueTodayOrOverdue} <span className="dusk-currency">зам.</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Потребують уваги зараз</span>}
          </div>

          <div className="dusk-tally__cell" style={{ padding: isMobile ? '6px 10px' : '11px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10 } : undefined}>
              {isMobile ? 'В роботі' : 'Заплановано в роботі'}
            </span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 21, color: 'var(--color-accent)' }}>
              {metrics.totalScheduledActive} <span className="dusk-currency">зам.</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Мають дату готовності</span>}
          </div>

          <div
            className="dusk-tally__cell"
            onClick={() => jumpToDate(nearestFreeDay)}
            style={{ padding: isMobile ? '6px 10px' : '11px 16px', cursor: 'pointer' }}
            title="Клікніть, щоб перейти до найближчого вільного дня"
          >
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10 } : undefined}>
              {isMobile ? 'Вільний день' : 'Найближчий вільний день'}
            </span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 21, color: 'var(--color-accent)' }}>
              {nearestFreeDay === todayKey ? 'Сьогодні' : formatShortDateUa(nearestFreeDay)}
            </div>
            {!isMobile && (
              <span className="dusk-tally__sub">
                Заплановано: {workloadMap[nearestFreeDay]?.activeCount || 0} зам.
              </span>
            )}
          </div>

          <div className="dusk-tally__cell" style={{ padding: isMobile ? '6px 10px' : '11px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10 } : undefined}>
              {isMobile ? 'Без дати' : 'Без дати (не розплановані)'}
            </span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 21, color: metrics.unscheduledCount > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {metrics.unscheduledCount} <span className="dusk-currency">зам.</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Перетягніть у календар</span>}
          </div>
        </div>
      </div>

      {/* Main Workspace: Calendar Grid + Unscheduled Sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px',
        gap: 14,
        alignItems: 'start'
      }}>
        {/* LEFT: CALENDAR GRID */}
        <div className="dusk-panel" style={{ padding: isMobile ? 8 : 14, overflow: 'hidden' }}>
          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isMobile ? 3 : 6, marginBottom: isMobile ? 4 : 8 }}>
            {WEEKDAYS_UA.map((wd, idx) => (
              <div
                key={wd}
                style={{
                  textAlign: 'center',
                  fontSize: isMobile ? 10.5 : 11.5,
                  fontWeight: 600,
                  color: idx >= 5 ? 'var(--color-muted)' : 'var(--color-ink-2)',
                  padding: '3px 0'
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isMobile ? 3 : 6 }}>
            {calendarDays.map(cell => {
              const dayData = workloadMap[cell.key] || { orders: [], activeCount: 0, totalCount: 0 };
              const visibleOrders = (dayData.orders || []).filter(o =>
                showDoneOrders ? true : !DONE_OR_SHIPPED_STATUSES.includes(o.status)
              );
              const isToday = cell.key === todayKey;
              const isPast = cell.key < todayKey;
              const tone = getWorkloadTone(dayData.activeCount, dailyCapacity);
              const isDragTarget = dragOverDateKey === cell.key;
              const loadPct = Math.min(100, Math.round((dayData.activeCount / Math.max(1, dailyCapacity)) * 100));
              const isSelectedMobile = isMobile && selectedDayMobile === cell.key;

              return (
                <div
                  key={cell.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverDateKey !== cell.key) setDragOverDateKey(cell.key);
                  }}
                  onDragLeave={() => {
                    if (dragOverDateKey === cell.key) setDragOverDateKey(null);
                  }}
                  onDrop={(e) => handleDropOnDay(e, cell.key)}
                  onClick={() => isMobile && setSelectedDayMobile(cell.key)}
                  style={{
                    minHeight: isMobile ? (viewType === 'week' ? 76 : 56) : (viewType === 'week' ? 320 : 132),
                    borderRadius: isMobile ? 8 : 10,
                    padding: isMobile ? '5px 4px' : 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    gap: isMobile ? 3 : 6,
                    background: isDragTarget
                      ? 'var(--color-accent-soft)'
                      : isSelectedMobile
                        ? 'var(--color-accent-soft)'
                        : isToday
                          ? 'rgba(164, 174, 248, 0.06)'
                          : cell.inCurrentMonth
                            ? 'var(--color-paper-2)'
                            : 'var(--color-paper)',
                    border: isDragTarget
                      ? '1.5px dashed var(--color-accent)'
                      : isSelectedMobile
                        ? '1px solid var(--color-accent)'
                        : isToday
                          ? '1px solid var(--color-accent-border)'
                          : '1px solid var(--color-rule)',
                    opacity: cell.inCurrentMonth ? 1 : 0.42,
                    transition: 'background-color 140ms ease, border-color 140ms ease',
                    position: 'relative',
                    cursor: isMobile ? 'pointer' : 'default'
                  }}
                >
                  {/* Day Header: Number + Workload Indicator + Quick Add */}
                  <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        className="dusk-num"
                        style={{
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: isToday || isSelectedMobile ? 700 : 600,
                          color: isToday || isSelectedMobile ? 'var(--color-accent)' : (isPast ? 'var(--color-muted)' : 'var(--color-ink)')
                        }}
                      >
                        {cell.date.getDate()}
                      </span>
                      {isToday && !isMobile && (
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--color-accent)', background: 'var(--color-accent-soft)', padding: '1px 5px', borderRadius: 4 }}>
                          Сьогодні
                        </span>
                      )}
                    </div>

                    {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {dayData.activeCount > 0 ? (
                        <span
                          className="dusk-num"
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 999,
                            whiteSpace: 'nowrap',
                            background: 'var(--color-accent-soft)',
                            color: 'var(--color-accent)',
                            border: '1px solid var(--color-accent-border)'
                          }}
                          title={`Активних замовлень: ${dayData.activeCount} · Фігурок: ${dayData.itemsCount} шт.`}
                        >
                          {dayData.activeCount}з · {dayData.itemsCount}шт
                        </span>
                      ) : (
                        !isPast && (
                          <span style={{ fontSize: 9.5, color: 'var(--color-muted)', opacity: 0.7 }}>
                            вільно
                          </span>
                        )
                      )}

                      {onCreateOrderWithDate && !isMobile && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onCreateOrderWithDate(cell.key); }}
                          title={`Додати замовлення на ${formatShortDateUa(cell.key)}`}
                          style={{
                            width: 18, height: 18, borderRadius: 5,
                            border: '1px solid var(--color-rule)', background: 'var(--color-paper)',
                            color: 'var(--color-muted)', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      )}
                    </div>
                    )}
                  </div>

                  {/* Mobile Compact Orders & Figurines Indicator */}
                  {isMobile && dayData.activeCount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, lineHeight: 1.15 }}>
                      <span
                        className="dusk-num"
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {dayData.activeCount} зам
                      </span>
                      <span
                        className="dusk-num"
                        style={{
                          fontSize: 8.5,
                          color: 'var(--color-muted)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {dayData.itemsCount} шт
                      </span>
                    </div>
                  )}

                  {/* Orders List inside Cell (Desktop) */}
                  {!isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
                      {visibleOrders.map(order => {
                        const isDone = DONE_OR_SHIPPED_STATUSES.includes(order.status);
                        const isPriority = !!order.shipping_details?.is_priority;
                        const isOverdue = !isDone && isPast;
                        const itemsQty = getOrderItemsCount(order);
                        const itemsList = getOrderItemsList(order);
                        const isMultiDay = (order._spanTotalDays || 1) > 1;
                        const multiDayBadge = getMultiDayBadgeText(order);
                        const spanStartKey = order.shipping_details?.due_date || cell.key;
                        const spanEndKey = isMultiDay ? addDaysToKey(spanStartKey, (order._spanTotalDays || 1) - 1) : spanStartKey;

                        return (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order.id)}
                            onClick={(e) => { e.stopPropagation(); onEditOrder?.(order); }}
                            style={{
                              padding: '7px 8px',
                              borderRadius: 8,
                              background: (isOverdue || (isPriority && !isDone))
                                ? 'var(--color-accent-2-soft)'
                                : isDone
                                  ? 'oklch(100% 0 0 / 0.02)'
                                  : isMultiDay
                                    ? 'oklch(75% 0.08 265 / 0.07)'
                                    : 'var(--color-paper)',
                              border: (isOverdue || (isPriority && !isDone))
                                ? '1px solid var(--color-accent-2-border)'
                                : isMultiDay
                                  ? '1px solid var(--color-accent-border)'
                                  : '1px solid var(--color-rule)',
                              borderLeft: (isPriority && !isDone) || (isMultiDay && isOverdue)
                                ? '3px solid var(--color-accent-2)'
                                : isMultiDay
                                  ? '3px solid var(--color-accent)'
                                  : undefined,
                              cursor: 'grab',
                              opacity: isDone ? 0.55 : 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                            title="Перетягніть на інший день або клікніть для редагування"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                {isPriority && <Star size={10} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" style={{ flexShrink: 0 }} />}
                                {isDone && <CheckCircle2 size={10} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                                <span>{getOrderDisplayTitle(order)}</span>
                              </span>

                              <span className="dusk-num" style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
                                ×{itemsQty}
                              </span>
                            </div>

                            {multiDayBadge && (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span
                                  className="dusk-num"
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    color: 'var(--color-accent)',
                                    background: 'var(--color-accent-soft)',
                                    border: '1px solid var(--color-accent-border)',
                                    padding: '1px 6px',
                                    borderRadius: 5,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {multiDayBadge} · {formatShortDateUa(spanStartKey)}–{formatShortDateUa(spanEndKey)}
                                </span>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2, borderTop: '1px solid var(--color-rule-soft)' }}>
                              {itemsList.map((it, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 10.5,
                                    color: 'var(--color-ink-2)',
                                    lineHeight: 1.25
                                  }}
                                  title={`${it.name} ×${it.qty}`}
                                >
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {itemsList.length > 1 ? `• ${it.shortName}` : it.shortName}
                                  </span>
                                  {(itemsList.length > 1 || it.qty > 1) && (
                                    <span className="dusk-num" style={{ flexShrink: 0, fontSize: 9.5, color: 'var(--color-muted)' }}>
                                      ×{it.qty}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                {!isDone && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const curDays = Number(order.shipping_details?.due_days) || 1;
                                        const nextDays = curDays >= 3 ? 1 : curDays + 1;
                                        updateOrderDueDate(order.id, undefined, nextDays);
                                      }}
                                      title="Змінити тривалість (1д → 2д → 3д)"
                                      style={{
                                        fontSize: 9.5, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                                        border: order._spanTotalDays > 1 ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                                        background: order._spanTotalDays > 1 ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                                        color: order._spanTotalDays > 1 ? 'var(--color-accent)' : 'var(--color-ink-2)',
                                        cursor: 'pointer', flexShrink: 0
                                      }}
                                    >
                                      {order._spanTotalDays || 1}д
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const baseStart = order.shipping_details?.due_date || cell.key;
                                        updateOrderDueDate(order.id, addDaysToKey(baseStart, 1));
                                      }}
                                      title="Перенести на +1 день"
                                      style={{
                                        fontSize: 9.5, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                                        border: '1px solid var(--color-rule)', background: 'var(--color-paper-2)',
                                        color: 'var(--color-ink-2)', cursor: 'pointer', flexShrink: 0
                                      }}
                                    >
                                      +1д
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderDueDate(order.id, '');
                                  }}
                                  title="Прибрати дату (повернути в «Без дати»)"
                                  style={{
                                    width: 17, height: 17, borderRadius: 4,
                                    border: '1px solid var(--color-rule)', background: 'var(--color-paper-2)',
                                    color: 'var(--color-muted)', cursor: 'pointer', flexShrink: 0,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Selected Day Details */}
          {isMobile && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDayMobile}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                    Замовлення на {formatShortDateUa(selectedDayMobile)}
                  </span>
                  {onCreateOrderWithDate && (
                    <button
                      type="button"
                      onClick={() => onCreateOrderWithDate(selectedDayMobile)}
                      className="dusk-btn dusk-btn--primary dusk-btn--sm"
                      style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                    >
                      <Plus size={12} /> Додати на день
                    </button>
                  )}
                </div>
                {(workloadMap[selectedDayMobile]?.orders || []).length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: 'var(--color-muted)', background: 'var(--color-paper-2)', borderRadius: 10 }}>
                    Цей день вільний
                  </div>
                ) : (
                  (workloadMap[selectedDayMobile]?.orders || []).map(order => {
                    const itemsList = getOrderItemsList(order);
                    const multiDayBadge = getMultiDayBadgeText(order);
                    const isMultiDay = (order._spanTotalDays || 1) > 1;
                    const isPriority = !!order.shipping_details?.is_priority;
                    const isDone = DONE_OR_SHIPPED_STATUSES.includes(order.status);
                    return (
                      <div
                        key={order.id}
                        onClick={() => onEditOrder?.(order)}
                        style={{
                          padding: 10, borderRadius: 10,
                          background: (isPriority && !isDone)
                            ? 'var(--color-accent-2-soft)'
                            : isMultiDay
                              ? 'oklch(75% 0.08 265 / 0.07)'
                              : 'var(--color-paper-2)',
                          border: (isPriority && !isDone)
                            ? '1px solid var(--color-accent-2-border)'
                            : isMultiDay
                              ? '1px solid var(--color-accent-border)'
                              : '1px solid var(--color-rule)',
                          borderLeft: (isPriority && !isDone)
                            ? '3px solid var(--color-accent-2)'
                            : isMultiDay
                              ? '3px solid var(--color-accent)'
                              : undefined,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                          opacity: isDone ? 0.55 : 1
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {isPriority && <Star size={12} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" style={{ flexShrink: 0 }} />}
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{getOrderDisplayTitle(order)}</span>
                            {multiDayBadge && (
                              <span className="dusk-num" style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-accent)', background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', padding: '0 5px', borderRadius: 4 }}>
                                {multiDayBadge}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 3 }}>
                            {itemsList.map((it, idx) => (
                              <div key={idx} style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                                {itemsList.length > 1 ? `• ${it.name}` : it.name} ×{it.qty}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateOrderDueDate(order.id, addDaysToKey(selectedDayMobile, 1)); }}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                          >
                            +1 день
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateOrderDueDate(order.id, ''); }}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }}
                            title="Прибрати дату"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* RIGHT: UNSCHEDULED ORDERS SIDEBAR (Drop target to clear due_date) */}
        <div
          className="dusk-panel"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!dragOverUnscheduled) setDragOverUnscheduled(true);
          }}
          onDragLeave={() => {
            if (dragOverUnscheduled) setDragOverUnscheduled(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setDragOverUnscheduled(false);
            const id = e.dataTransfer.getData('text/plain') || draggedOrderId;
            setDraggedOrderId(null);
            if (id) await updateOrderDueDate(id, '');
          }}
          style={{
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: isMobile ? 'none' : 'calc(100vh - 250px)',
            border: dragOverUnscheduled ? '1.5px dashed var(--color-accent)' : undefined,
            background: dragOverUnscheduled ? 'var(--color-accent-soft)' : undefined,
            transition: 'all 0.14s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
              Без дати ({unscheduledOrders.length})
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Перетягніть у день
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Пошук замовлення…"
              value={unscheduledSearch}
              onChange={(e) => setUnscheduledSearch(e.target.value)}
              className="dusk-input"
              style={{ height: 32, paddingLeft: 30, fontSize: 12, borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 2 }}>
            {unscheduledOrders.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 12, color: 'var(--color-muted)', border: '1px dashed var(--color-rule)', borderRadius: 10 }}>
                Усі активні замовлення розплановано!
              </div>
            ) : (
              unscheduledOrders.map(order => {
                const isPriority = !!order.shipping_details?.is_priority;
                return (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'var(--color-paper-2)',
                      border: isPriority ? '1px solid var(--color-accent-2-border)' : '1px solid var(--color-rule)',
                      cursor: 'grab',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div
                        onClick={() => onEditOrder?.(order)}
                        style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isPriority && <Star size={11} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" />}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getOrderDisplayTitle(order)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getFirstItemName(order)} · ×{getOrderItemsCount(order)} · {STATUS_LABELS[order.status] || order.status}
                        </div>
                      </div>
                      <GripVertical size={13} style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: 2 }} />
                    </div>

                    {/* 1-Click Quick Assign Buttons */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => updateOrderDueDate(order.id, todayKey)}
                        className="dusk-facet-pill"
                        style={{ padding: '2px 7px', fontSize: 10.5 }}
                      >
                        Сьогодні
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderDueDate(order.id, addDaysToKey(todayKey, 1))}
                        className="dusk-facet-pill"
                        style={{ padding: '2px 7px', fontSize: 10.5 }}
                      >
                        Завтра
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderDueDate(order.id, nearestFreeDay)}
                        className="dusk-facet-pill active"
                        style={{ padding: '2px 7px', fontSize: 10.5 }}
                        title="Поставити на найближчий вільний день"
                      >
                        Вільний ({formatShortDateUa(nearestFreeDay)})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
