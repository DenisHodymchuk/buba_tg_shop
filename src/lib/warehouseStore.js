// Shared Warehouse & Consumables Store (Syncs with Supabase 'settings' table + localStorage)

const STORAGE_KEY = 'buba_warehouse_data_v1';

export const WAREHOUSE_CATEGORIES = [
  { id: 'packaging', label: 'Пакування (Коробки, пакети)' },
  { id: 'gifts', label: 'Вкладення (Цукерки, листівки)' },
  { id: 'hardware', label: 'Фурнітура (Кільця, магніти, LED)' },
  { id: 'filament', label: 'Пластик / Філамент' },
  { id: 'other', label: 'Інші витратники' }
];

export const DEFAULT_WAREHOUSE_ITEMS = [
  {
    id: 'wh_box_s',
    name: 'Коробка мала (15×15×10 см)',
    category: 'packaging',
    unit: 'шт.',
    quantity: 45,
    min_quantity: 10,
    cost_unit: 12,
    quick_sale: true
  },
  {
    id: 'wh_box_m',
    name: 'Коробка середня (25×20×15 см)',
    category: 'packaging',
    unit: 'шт.',
    quantity: 25,
    min_quantity: 8,
    cost_unit: 18,
    quick_sale: true
  },
  {
    id: 'wh_candy',
    name: 'Цукерка у замовлення',
    category: 'gifts',
    unit: 'шт.',
    quantity: 120,
    min_quantity: 25,
    cost_unit: 3.5,
    quick_sale: true
  },
  {
    id: 'wh_card',
    name: 'Листівка-подяка / Візитка',
    category: 'gifts',
    unit: 'шт.',
    quantity: 150,
    min_quantity: 30,
    cost_unit: 2,
    quick_sale: true
  },
  {
    id: 'wh_keyring',
    name: 'Кільце для брелка з ланцюжком',
    category: 'hardware',
    unit: 'шт.',
    quantity: 80,
    min_quantity: 20,
    cost_unit: 4,
    quick_sale: true
  },
  {
    id: 'wh_bubble',
    name: 'Пухирчаста плівка / папір (порція)',
    category: 'packaging',
    unit: 'шт.',
    quantity: 60,
    min_quantity: 15,
    cost_unit: 4,
    quick_sale: false
  }
];

export function getLocalWarehouseData() {
  if (typeof window === 'undefined') {
    return { items: DEFAULT_WAREHOUSE_ITEMS, logs: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return {
          items: parsed.items,
          logs: Array.isArray(parsed.logs) ? parsed.logs : []
        };
      }
    }
  } catch (_) {}
  return { items: DEFAULT_WAREHOUSE_ITEMS, logs: [] };
}

export async function loadWarehouseData(supabase) {
  const local = getLocalWarehouseData();
  if (!supabase) return local;

  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', STORAGE_KEY)
      .maybeSingle();

    if (data && data.value && Array.isArray(data.value.items)) {
      const normalized = {
        items: data.value.items,
        logs: Array.isArray(data.value.logs) ? data.value.logs : []
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    } else if (local.items.length > 0) {
      // Seed initial data into settings if not present yet
      await supabase.from('settings').upsert({ key: STORAGE_KEY, value: local });
    }
  } catch (_) {}

  return local;
}

export async function saveWarehouseData(supabase, items, logs) {
  const payload = {
    items: Array.isArray(items) ? items : [],
    logs: Array.isArray(logs) ? logs.slice(0, 300) : []
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('buba_warehouse_updated', { detail: payload }));
  }

  if (supabase) {
    try {
      await supabase.from('settings').upsert({ key: STORAGE_KEY, value: payload });
    } catch (e) {
      console.error('Error syncing warehouse to Supabase:', e);
    }
  }

  return payload;
}

/**
 * Applies stock changes when an order is created or edited in SalesDashboard.
 * @param {object} supabase
 * @param {string} orderLabel - e.g. "#464465"
 * @param {string} clientName - e.g. "Поліна Богатирьова"
 * @param {Array} prevConsumables - previously saved consumables on this order (empty array if new order)
 * @param {Array} nextConsumables - new consumables selected on this order
 */
export async function applyOrderConsumablesDiff(supabase, orderLabel, clientName, prevConsumables = [], nextConsumables = []) {
  const current = await loadWarehouseData(supabase);
  const items = [...current.items];
  const logs = [...current.logs];

  const prevMap = {};
  (prevConsumables || []).forEach(c => {
    if (c && c.item_id) {
      prevMap[c.item_id] = (prevMap[c.item_id] || 0) + (Number(c.quantity) || 0);
    }
  });

  const nextMap = {};
  (nextConsumables || []).forEach(c => {
    if (c && c.item_id) {
      nextMap[c.item_id] = (nextMap[c.item_id] || 0) + (Number(c.quantity) || 0);
    }
  });

  const allIds = new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]);
  const changesSummary = [];

  allIds.forEach(itemId => {
    const oldQty = prevMap[itemId] || 0;
    const newQty = nextMap[itemId] || 0;
    const diff = newQty - oldQty; // positive means deduct more from stock, negative means return to stock
    if (diff === 0) return;

    const idx = items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      const currentStock = Number(items[idx].quantity) || 0;
      items[idx] = {
        ...items[idx],
        quantity: Math.max(0, Number((currentStock - diff).toFixed(2)))
      };
      changesSummary.push({
        item_id: itemId,
        name: items[idx].name,
        unit: items[idx].unit || 'шт.',
        diff,
        cost_unit: Number(items[idx].cost_unit) || 0
      });
    }
  });

  if (changesSummary.length > 0) {
    const nowIso = new Date().toISOString();
    changesSummary.forEach(ch => {
      logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        created_at: nowIso,
        type: ch.diff > 0 ? 'sale_out' : 'sale_return',
        item_id: ch.item_id,
        item_name: ch.name,
        unit: ch.unit,
        quantity: Math.abs(ch.diff),
        cost_unit: ch.cost_unit,
        total_cost: Math.round(Math.abs(ch.diff) * ch.cost_unit * 100) / 100,
        note: `${ch.diff > 0 ? 'Списано у продаж' : 'Повернено з продажу'} ${orderLabel}${clientName ? ` (${clientName})` : ''}`
      });
    });

    await saveWarehouseData(supabase, items, logs);
  }

  return { items, logs, changesSummary };
}
