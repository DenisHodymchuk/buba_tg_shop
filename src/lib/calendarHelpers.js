// Shared Date, Deadline & Workload Helpers for Order Calendar and Sales Modal

const CAPACITY_STORAGE_KEY = 'buba_daily_capacity_v1';
export const DEFAULT_DAILY_CAPACITY = 4;

export const ACTIVE_PRODUCTION_STATUSES = ['new', 'printing', 'painting', 'preparing'];
export const DONE_OR_SHIPPED_STATUSES = ['shipping', 'shipped', 'completed'];

export function formatDateKey(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null;
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

export function addDaysToKey(dateKey, deltaDays) {
  const base = parseDateKey(dateKey) || new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + deltaDays);
  return formatDateKey(base);
}

export function getTodayKey() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return formatDateKey(now);
}

export function formatShortDateUa(dateKey) {
  const d = parseDateKey(dateKey);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

export function getRelativeDateLabel(dateKey) {
  if (!dateKey) return '';
  const today = getTodayKey();
  const tomorrow = addDaysToKey(today, 1);
  if (dateKey === today) return 'Сьогодні';
  if (dateKey === tomorrow) return 'Завтра';
  if (dateKey < today) return 'Прострочено';
  return formatShortDateUa(dateKey);
}

export function getDailyCapacity() {
  if (typeof window === 'undefined') return DEFAULT_DAILY_CAPACITY;
  const raw = Number(localStorage.getItem(CAPACITY_STORAGE_KEY));
  return Number.isFinite(raw) && raw >= 1 && raw <= 50 ? raw : DEFAULT_DAILY_CAPACITY;
}

export function saveDailyCapacity(val) {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(1, Math.min(50, Number(val) || DEFAULT_DAILY_CAPACITY));
  localStorage.setItem(CAPACITY_STORAGE_KEY, String(clamped));
}

export function getOrderScheduledDates(order) {
  const dueDate = order?.shipping_details?.due_date;
  if (!dueDate) return [];
  const days = Math.max(1, Math.min(14, Number(order?.shipping_details?.due_days) || 1));
  const dates = [];
  for (let i = 0; i < days; i += 1) {
    dates.push(i === 0 ? dueDate : addDaysToKey(dueDate, i));
  }
  return dates;
}

export function getWorkloadMap(orders = [], excludeOrderId = null) {
  const map = {};
  (orders || []).forEach(order => {
    if (!order || order.status === 'cancelled') return;
    if (excludeOrderId && String(order.id) === String(excludeOrderId)) return;

    const scheduledDates = getOrderScheduledDates(order);
    if (scheduledDates.length === 0) return;

    const isDone = DONE_OR_SHIPPED_STATUSES.includes(order.status);
    const items = Array.isArray(order.shipping_details?.items) ? order.shipping_details.items : [];
    const itemsSum = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 1;

    scheduledDates.forEach((dateKey, dayIdx) => {
      if (!map[dateKey]) {
        map[dateKey] = { orders: [], activeCount: 0, totalCount: 0, itemsCount: 0 };
      }

      map[dateKey].orders.push({
        ...order,
        _spanDayIndex: dayIdx,
        _spanTotalDays: scheduledDates.length
      });
      map[dateKey].totalCount += 1;
      if (!isDone) {
        map[dateKey].activeCount += 1;
        map[dateKey].itemsCount += itemsSum;
      }
    });
  });
  return map;
}

export function findNearestFreeDate(workloadMap, capacity = DEFAULT_DAILY_CAPACITY, startOffsetDays = 1, durationDays = 1) {
  const today = getTodayKey();
  const span = Math.max(1, Number(durationDays) || 1);
  for (let i = startOffsetDays; i < 60; i += 1) {
    const startKey = addDaysToKey(today, i);
    let allFree = true;
    for (let d = 0; d < span; d += 1) {
      const checkKey = d === 0 ? startKey : addDaysToKey(startKey, d);
      if ((workloadMap[checkKey]?.activeCount || 0) >= capacity) {
        allFree = false;
        break;
      }
    }
    if (allFree) return startKey;
  }
  return addDaysToKey(today, startOffsetDays);
}

export function getWorkloadTone(activeCount, capacity = DEFAULT_DAILY_CAPACITY) {
  if (activeCount <= 0) return 'free';
  if (activeCount < capacity) return 'normal';
  return 'full';
}
