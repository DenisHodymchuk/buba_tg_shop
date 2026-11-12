// Compact Hallmark Dusk Inline Calendar Picker with Live Daily Workload
'use client';

import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addDaysToKey,
  findNearestFreeDate,
  formatDateKey,
  formatShortDateUa,
  getDailyCapacity,
  getTodayKey,
  getWorkloadMap,
  getWorkloadTone,
  parseDateKey
} from '@/lib/calendarHelpers';

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export default function DeadlineMiniPicker({
  value = '',
  days = 1,
  onChange,
  onDaysChange,
  orders = [],
  excludeOrderId = null
}) {
  const todayKey = getTodayKey();
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const parsed = parseDateKey(value);
    const d = parsed || new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const safeDays = Math.max(1, Math.min(7, Number(days) || 1));
  const capacity = useMemo(() => getDailyCapacity(), []);
  const workloadMap = useMemo(
    () => getWorkloadMap(orders, excludeOrderId),
    [orders, excludeOrderId]
  );

  const selectedDateSet = useMemo(() => {
    const set = new Set();
    if (!value) return set;
    for (let i = 0; i < safeDays; i += 1) {
      set.add(i === 0 ? value : addDaysToKey(value, i));
    }
    return set;
  }, [value, safeDays]);

  const tomorrowKey = addDaysToKey(todayKey, 1);
  const plus2Key = addDaysToKey(todayKey, 2);
  const nearestFreeKey = useMemo(
    () => findNearestFreeDate(workloadMap, capacity, 0, safeDays),
    [workloadMap, capacity, safeDays]
  );

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = (first.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: totalCells }, (_, idx) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + idx);
      return {
        date: d,
        key: formatDateKey(d),
        inMonth: d.getMonth() === month
      };
    });
  }, [monthCursor]);

  const selectedLoad = value ? (workloadMap[value]?.activeCount || 0) : 0;

  const rangeLabel = useMemo(() => {
    if (!value) return '';
    if (safeDays <= 1) return formatShortDateUa(value);
    const endKey = addDaysToKey(value, safeDays - 1);
    return `${formatShortDateUa(value)}–${formatShortDateUa(endKey)} (${safeDays}д)`;
  }, [value, safeDays]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon size={13} style={{ color: 'var(--color-accent)' }} />
          <span>Дата готовності</span>
        </span>

        {/* Duration selector: 1, 2 or 3 days */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', marginRight: 2 }}>Днів:</span>
          {[1, 2, 3].map(dCount => {
            const active = safeDays === dCount;
            return (
              <button
                key={dCount}
                type="button"
                onClick={() => onDaysChange?.(dCount)}
                className={`dusk-facet-pill ${active ? 'active' : ''}`}
                style={{ padding: '2px 7px', fontSize: 10.5, minHeight: 20 }}
                title={`Замовлення займає ${dCount} ${dCount === 1 ? 'день' : 'дні'}`}
              >
                {dCount}д
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick 1-Click Deadline Chips + Calendar Toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onChange('')}
          className={`dusk-facet-pill ${!value ? 'active' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          Без дати
        </button>
        <button
          type="button"
          onClick={() => onChange(todayKey)}
          className={`dusk-facet-pill ${value === todayKey ? 'active' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          Сьогодні
        </button>
        <button
          type="button"
          onClick={() => onChange(tomorrowKey)}
          className={`dusk-facet-pill ${value === tomorrowKey ? 'active' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          Завтра
        </button>
        <button
          type="button"
          onClick={() => onChange(plus2Key)}
          className={`dusk-facet-pill ${value === plus2Key ? 'active' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          +2 дні
        </button>
        <button
          type="button"
          onClick={() => onChange(nearestFreeKey)}
          className={`dusk-facet-pill ${value === nearestFreeKey ? 'active' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
          title="Автоматично обрати найближчий день із вільним лімітом"
        >
          Вільний ({formatShortDateUa(nearestFreeKey)})
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`dusk-facet-pill ${open ? 'active' : ''}`}
          style={{ padding: '3px 10px', fontSize: 11, marginLeft: 'auto' }}
        >
          <CalendarIcon size={11} />
          <span>{rangeLabel || 'Календар'}</span>
        </button>
      </div>

      {/* Expandable Mini-Calendar with Workload Counts */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-rule)',
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {/* Month Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--color-rule)', background: 'var(--color-paper-2)', color: 'var(--color-ink)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={13} />
                </button>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                  {MONTHS_UA[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--color-rule)', background: 'var(--color-paper-2)', color: 'var(--color-ink)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Weekdays */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
                {WEEKDAYS_SHORT.map(wd => (
                  <div key={wd} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: 'var(--color-muted)' }}>
                    {wd}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
                {monthDays.map(cell => {
                  const dayStats = workloadMap[cell.key];
                  const count = dayStats?.activeCount || 0;
                  const itemsCount = dayStats?.itemsCount || 0;
                  const tone = getWorkloadTone(count, capacity);
                  const isSelected = selectedDateSet.has(cell.key);
                  const isToday = cell.key === todayKey;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => {
                        onChange(cell.key);
                        setOpen(false);
                      }}
                      style={{
                        height: 36,
                        borderRadius: 7,
                        padding: '3px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        opacity: cell.inMonth ? 1 : 0.35,
                        background: isSelected
                          ? 'var(--color-accent-soft)'
                          : isToday
                            ? 'rgba(164, 174, 248, 0.08)'
                            : 'var(--color-paper-2)',
                        border: isSelected
                          ? '1px solid var(--color-accent)'
                          : isToday
                            ? '1px solid var(--color-accent-border)'
                            : '1px solid var(--color-rule)',
                        color: 'var(--color-ink)'
                      }}
                      title={`${formatShortDateUa(cell.key)} — активних замовлень: ${count} / ${capacity}, фігурок: ${itemsCount} шт.`}
                    >
                      <span className="dusk-num" style={{ fontSize: 11.5, fontWeight: isSelected || isToday ? 700 : 500, lineHeight: 1 }}>
                        {cell.date.getDate()}
                      </span>
                      <span
                        className="dusk-num"
                        style={{
                          fontSize: 8.5,
                          lineHeight: 1,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          color: tone === 'full'
                            ? 'var(--color-accent-2)'
                            : count > 0
                              ? 'var(--color-accent)'
                              : 'var(--color-muted)'
                        }}
                      >
                        {count > 0 ? `${count}з · ${itemsCount}шт` : 'вільно'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
