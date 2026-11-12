// Hallmark Dusk Theme — OrderCalendar (Production Deadlines & Workload Scheduler)
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

  const getOrderItemsList = (order) => {
    const items = Array.isArray(order.shipping_details?.items) ? order.shipping_details.items : [];
    if (items.length === 0) return [{ name: 'Замовлення', qty: 1 }];
    return items.map(it => ({
      name: it?.name || it?.title || 'Фігурка',
      qty: Number(it?.quantity) || 1
    }));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', paddingBottom: isMobile ? 76 : 12 }}>
      {/* Top Glass Header & Controls */}
      <div className="dusk-glass" style={{ padding: isMobile ? 14 : '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div>
            <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={20} style={{ color: 'var(--color-accent)' }} />
              <span>Календар замовлень</span>
            </h1>
            <p className="dusk-subheading" style={{ marginTop: 2 }}>
              Планування дедлайнів, завантаження по днях та перетягування замовлень між датами
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Daily Capacity Control */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)',
              borderRadius: 999, padding: '3px 8px 3px 12px', height: 34
            }}>
              <span style={{ fontSize: 11.5, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>Ліміт/день:</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setDailyCapacity(c => Math.max(1, c - 1))}
                  style={{ width: 22, height: 22, borderRadius: 999, border: '1px solid var(--color-rule)', background: 'var(--color-paper)', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13 }}
                >
                  −
                </button>
                <span className="dusk-num" style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
                  {dailyCapacity}
                </span>
                <button
                  type="button"
                  onClick={() => setDailyCapacity(c => Math.min(50, c + 1))}
                  style={{ width: 22, height: 22, borderRadius: 999, border: '1px solid var(--color-rule)', background: 'var(--color-paper)', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13 }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Show/Hide Completed Toggle */}
            <button
              type="button"
              onClick={() => setShowDoneOrders(!showDoneOrders)}
              className={`dusk-facet-pill ${showDoneOrders ? 'active' : ''}`}
              style={{ height: 34, padding: '0 12px', fontSize: 12 }}
            >
              <CheckCircle2 size={13} />
              <span>Готові</span>
            </button>

            {/* Month / Week Switcher */}
            <div className="dusk-segmented">
              <button
                type="button"
                onClick={() => setViewType('month')}
                className={`dusk-segmented__item ${viewType === 'month' ? 'active' : ''}`}
              >
                Місяць
              </button>
              <button
                type="button"
                onClick={() => setViewType('week')}
                className={`dusk-segmented__item ${viewType === 'week' ? 'active' : ''}`}
              >
                Тиждень
              </button>
            </div>

            {/* Period Navigation */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => navigatePeriod(-1)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => jumpToDate(todayKey)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ height: 32, padding: '0 10px', fontSize: 12 }}
              >
                Сьогодні
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <span className="dusk-heading" style={{ fontSize: 15, minWidth: 130, textAlign: 'right' }}>
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
          <div className="dusk-tally__cell" style={{ padding: '11px 16px' }}>
            <span className="dusk-tally__label">На сьогодні / прострочені</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 21, color: metrics.dueTodayOrOverdue > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {metrics.dueTodayOrOverdue} <span className="dusk-currency">зам.</span>
            </div>
            <span className="dusk-tally__sub">Потребують уваги зараз</span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '11px 16px' }}>
            <span className="dusk-tally__label">Заплановано в роботі</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 21, color: 'var(--color-accent)' }}>
              {metrics.totalScheduledActive} <span className="dusk-currency">зам.</span>
            </div>
            <span className="dusk-tally__sub">Мають дату готовності</span>
          </div>

          <div
            className="dusk-tally__cell"
            onClick={() => jumpToDate(nearestFreeDay)}
            style={{ padding: '11px 16px', cursor: 'pointer' }}
            title="Клікніть, щоб перейти до найближчого вільного дня"
          >
            <span className="dusk-tally__label">Найближчий вільний день</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 21, color: 'var(--color-accent)' }}>
              {nearestFreeDay === todayKey ? 'Сьогодні' : formatShortDateUa(nearestFreeDay)}
            </div>
            <span className="dusk-tally__sub">
              Завантаження: {workloadMap[nearestFreeDay]?.activeCount || 0} / {dailyCapacity}
            </span>
          </div>

          <div className="dusk-tally__cell" style={{ padding: '11px 16px' }}>
            <span className="dusk-tally__label">Без дати (не розплановані)</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 21, color: metrics.unscheduledCount > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {metrics.unscheduledCount} <span className="dusk-currency">зам.</span>
            </div>
            <span className="dusk-tally__sub">Перетягніть у календар</span>
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
        <div className="dusk-panel" style={{ padding: isMobile ? 10 : 14, overflow: 'hidden' }}>
          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
            {WEEKDAYS_UA.map((wd, idx) => (
              <div
                key={wd}
                style={{
                  textAlign: 'center',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: idx >= 5 ? 'var(--color-muted)' : 'var(--color-ink-2)',
                  padding: '4px 0'
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
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
                    minHeight: viewType === 'week' ? 320 : (isMobile ? 74 : 132),
                    borderRadius: 10,
                    padding: isMobile ? 6 : 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: isDragTarget
                      ? 'var(--color-accent-soft)'
                      : isToday
                        ? 'rgba(164, 174, 248, 0.06)'
                        : cell.inCurrentMonth
                          ? 'var(--color-paper-2)'
                          : 'var(--color-paper)',
                    border: isDragTarget
                      ? '1.5px dashed var(--color-accent)'
                      : isToday
                        ? '1px solid var(--color-accent-border)'
                        : (isMobile && selectedDayMobile === cell.key)
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-rule)',
                    opacity: cell.inCurrentMonth ? 1 : 0.45,
                    transition: 'all 0.14s ease',
                    position: 'relative'
                  }}
                >
                  {/* Day Header: Number + Workload Indicator + Quick Add */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        className="dusk-num"
                        style={{
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: isToday ? 700 : 600,
                          color: isToday ? 'var(--color-accent)' : (isPast ? 'var(--color-muted)' : 'var(--color-ink)')
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {dayData.activeCount > 0 ? (
                        <span
                          className="dusk-num"
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: tone === 'full' ? 'var(--color-accent-2-soft)' : 'var(--color-accent-soft)',
                            color: tone === 'full' ? 'var(--color-accent-2)' : 'var(--color-accent)',
                            border: `1px solid ${tone === 'full' ? 'var(--color-accent-2-border)' : 'var(--color-accent-border)'}`
                          }}
                          title={`Активних замовлень: ${dayData.activeCount} із ${dailyCapacity} · Фігурок: ${dayData.itemsCount} шт.`}
                        >
                          {dayData.activeCount}/{dailyCapacity} · {dayData.itemsCount}шт
                        </span>
                      ) : (
                        !isPast && !isMobile && (
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
                  </div>

                  {/* Thin Capacity Progress Bar */}
                  {dayData.activeCount > 0 && (
                    <div style={{ height: 3, borderRadius: 999, background: 'var(--color-paper)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${loadPct}%`,
                        height: '100%',
                        background: tone === 'full' ? 'var(--color-accent-2)' : 'var(--color-accent)',
                        transition: 'width 0.2s ease'
                      }} />
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
                              padding: '5px 7px',
                              borderRadius: 7,
                              background: isOverdue
                                ? 'var(--color-accent-2-soft)'
                                : isDone
                                  ? 'oklch(100% 0 0 / 0.02)'
                                  : isMultiDay
                                    ? 'oklch(75% 0.08 265 / 0.07)'
                                    : 'var(--color-paper)',
                              border: isOverdue
                                ? '1px solid var(--color-accent-2-border)'
                                : isMultiDay
                                  ? '1px solid var(--color-accent-border)'
                                  : '1px solid var(--color-rule)',
                              borderLeft: isMultiDay
                                ? `3px solid ${isOverdue ? 'var(--color-accent-2)' : 'var(--color-accent)'}`
                                : undefined,
                              cursor: 'grab',
                              opacity: isDone ? 0.55 : 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3
                            }}
                            title="Перетягніть на інший день або клікніть для редагування"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 600, color: 'var(--color-ink)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                {isPriority && <Star size={10} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" style={{ flexShrink: 0 }} />}
                                {isDone && <CheckCircle2 size={10} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                                <span>{getOrderDisplayTitle(order)}</span>
                              </span>

                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                {multiDayBadge && (
                                  <span
                                    className="dusk-num"
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 600,
                                      color: 'var(--color-accent)',
                                      background: 'var(--color-accent-soft)',
                                      border: '1px solid var(--color-accent-border)',
                                      padding: '0 4px',
                                      borderRadius: 4
                                    }}
                                    title={`Замовлення на ${order._spanTotalDays} дн.: ${formatShortDateUa(spanStartKey)} – ${formatShortDateUa(spanEndKey)}`}
                                  >
                                    {multiDayBadge}
                                  </span>
                                )}
                                <span className="dusk-num" style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                                  ×{itemsQty}
                                </span>
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {itemsList.map((it, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 10,
                                    color: 'var(--color-muted)',
                                    lineHeight: 1.25
                                  }}
                                  title={`${it.name} ×${it.qty}`}
                                >
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {itemsList.length > 1 ? `• ${it.name}` : it.name}
                                  </span>
                                  {(itemsList.length > 1 || it.qty > 1) && (
                                    <span className="dusk-num" style={{ flexShrink: 0, fontSize: 9.5, color: 'var(--color-ink-2)' }}>
                                      ×{it.qty}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <span className="dusk-num" style={{ fontSize: 9, color: isMultiDay ? 'var(--color-accent)' : 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {isMultiDay ? `${formatShortDateUa(spanStartKey)}–${formatShortDateUa(spanEndKey)}` : ''}
                              </span>

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
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  return (
                    <div
                      key={order.id}
                      onClick={() => onEditOrder?.(order)}
                      style={{
                        padding: 10, borderRadius: 10,
                        background: isMultiDay ? 'oklch(75% 0.08 265 / 0.07)' : 'var(--color-paper-2)',
                        border: isMultiDay ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                        borderLeft: isMultiDay ? '3px solid var(--color-accent)' : undefined,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
            </div>
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
