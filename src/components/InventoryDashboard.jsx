"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Minus, Trash2, Search, Package, ArrowDownLeft, ArrowUpRight,
  RefreshCw, Edit3, Check, X, AlertCircle, Layers, History, Box, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WAREHOUSE_CATEGORIES,
  loadWarehouseData,
  saveWarehouseData
} from '@/lib/warehouseStore';

const QUICK_MATERIAL_TEMPLATES = [
  { name: 'Коробка Нова Пошта 0.5 кг', category: 'packaging', unit: 'шт.', min_quantity: 10, cost_unit: 10 },
  { name: 'Коробка 15×15×10 см', category: 'packaging', unit: 'шт.', min_quantity: 15, cost_unit: 12 },
  { name: 'Коробка 20×20×15 см', category: 'packaging', unit: 'шт.', min_quantity: 10, cost_unit: 16 },
  { name: 'Цукерка до замовлення', category: 'gifts', unit: 'шт.', min_quantity: 30, cost_unit: 3.5 },
  { name: 'Листівка-подяка / Візитка', category: 'gifts', unit: 'шт.', min_quantity: 50, cost_unit: 2 },
  { name: 'Наліпка брендована (стікер)', category: 'gifts', unit: 'шт.', min_quantity: 50, cost_unit: 1.5 },
  { name: 'Кільце для брелка з ланцюжком', category: 'hardware', unit: 'шт.', min_quantity: 30, cost_unit: 4 },
  { name: 'Магніт неодимовий', category: 'hardware', unit: 'шт.', min_quantity: 20, cost_unit: 5 },
  { name: 'LED-підсвітка / USB модуль', category: 'hardware', unit: 'шт.', min_quantity: 5, cost_unit: 85 },
  { name: 'Пластик PLA Базовий (котушка 1 кг)', category: 'filament', unit: 'шт.', min_quantity: 3, cost_unit: 580 }
];

export default function InventoryDashboard({ showToast, isMobile: isMobileProp }) {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | category id | 'low_stock'
  const [viewTab, setViewTab] = useState('stock'); // 'stock' | 'history'
  const [isMobileState, setIsMobileState] = useState(false);
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileState;

  // Add / Edit Material Modal
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: 'packaging',
    unit: 'шт.',
    quantity: '',
    min_quantity: '10',
    cost_unit: '',
    pack_total_cost: '',
    quick_sale: true
  });

  // Quick Receive (+ Прийняти) or Write-Off (- Списати) Modal
  const [stockActionModal, setStockActionModal] = useState({
    open: false,
    mode: 'in', // 'in' (прихід) | 'out' (списання)
    item: null,
    quantity: '',
    cost_unit: '',
    total_pack_price: '',
    note: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobileState(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchWarehouse = async () => {
    setLoading(true);
    const data = await loadWarehouseData(supabase);
    setItems(data.items || []);
    setLogs(data.logs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouse();
    const onUpdated = (e) => {
      if (e.detail) {
        setItems(e.detail.items || []);
        setLogs(e.detail.logs || []);
      }
    };
    window.addEventListener('buba_warehouse_updated', onUpdated);
    return () => window.removeEventListener('buba_warehouse_updated', onUpdated);
  }, []);

  // KPI Metrics
  const stats = useMemo(() => {
    let totalStockValue = 0;
    let totalUnits = 0;
    let lowStockCount = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.cost_unit) || 0;
      const minQty = Number(item.min_quantity) || 0;
      totalStockValue += qty * cost;
      totalUnits += qty;
      if (qty <= minQty) lowStockCount += 1;
    });

    const writtenOffLogs = logs.filter(l => l.type === 'sale_out' || l.type === 'manual_out');
    const totalWrittenOffCost = writtenOffLogs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
    const totalWrittenOffUnits = writtenOffLogs.reduce((s, l) => s + (Number(l.quantity) || 0), 0);

    return {
      totalItems: items.length,
      totalUnits: Math.round(totalUnits * 100) / 100,
      totalStockValue: Math.round(totalStockValue),
      lowStockCount,
      totalWrittenOffCost: Math.round(totalWrittenOffCost),
      totalWrittenOffUnits: Math.round(totalWrittenOffUnits * 100) / 100
    };
  }, [items, logs]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (categoryFilter === 'low_stock') {
        if ((Number(item.quantity) || 0) > (Number(item.min_quantity) || 0)) return false;
      } else if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (item.name || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, categoryFilter, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(l =>
      (l.item_name || '').toLowerCase().includes(q) ||
      (l.note || '').toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const openCreateModal = () => {
    setEditingItem(null);
    setMaterialForm({
      name: '',
      category: 'packaging',
      unit: 'шт.',
      quantity: '',
      min_quantity: '10',
      cost_unit: '',
      pack_total_cost: '',
      quick_sale: true
    });
    setShowMaterialModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setMaterialForm({
      name: item.name || '',
      category: item.category || 'packaging',
      unit: item.unit || 'шт.',
      quantity: String(item.quantity ?? 0),
      min_quantity: String(item.min_quantity ?? 10),
      cost_unit: String(item.cost_unit ?? 0),
      pack_total_cost: '',
      quick_sale: item.quick_sale !== false
    });
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.name.trim()) {
      showToast?.('Введіть назву матеріалу', 'error');
      return;
    }

    const qty = parseFloat(materialForm.quantity) || 0;
    const minQty = parseFloat(materialForm.min_quantity) || 0;
    const costUnit = parseFloat(materialForm.cost_unit) || 0;

    let updatedItems;
    let updatedLogs = [...logs];

    if (editingItem) {
      const prevQty = Number(editingItem.quantity) || 0;
      const diff = qty - prevQty;
      updatedItems = items.map(it =>
        it.id === editingItem.id
          ? {
              ...it,
              name: materialForm.name.trim(),
              category: materialForm.category,
              unit: materialForm.unit || 'шт.',
              quantity: qty,
              min_quantity: minQty,
              cost_unit: costUnit,
              quick_sale: materialForm.quick_sale
            }
          : it
      );

      if (diff !== 0) {
        updatedLogs.unshift({
          id: `log_${Date.now()}`,
          created_at: new Date().toISOString(),
          type: diff > 0 ? 'in' : 'manual_out',
          item_id: editingItem.id,
          item_name: materialForm.name.trim(),
          unit: materialForm.unit || 'шт.',
          quantity: Math.abs(diff),
          cost_unit: costUnit,
          total_cost: Math.round(Math.abs(diff) * costUnit * 100) / 100,
          note: 'Коригування залишку при редагуванні'
        });
      }
      showToast?.('Матеріал оновлено');
    } else {
      const newItemObj = {
        id: `wh_${Date.now()}`,
        name: materialForm.name.trim(),
        category: materialForm.category,
        unit: materialForm.unit || 'шт.',
        quantity: qty,
        min_quantity: minQty,
        cost_unit: costUnit,
        quick_sale: materialForm.quick_sale
      };
      updatedItems = [newItemObj, ...items];

      if (qty > 0) {
        updatedLogs.unshift({
          id: `log_${Date.now()}`,
          created_at: new Date().toISOString(),
          type: 'in',
          item_id: newItemObj.id,
          item_name: newItemObj.name,
          unit: newItemObj.unit,
          quantity: qty,
          cost_unit: costUnit,
          total_cost: Math.round(qty * costUnit * 100) / 100,
          note: 'Початковий прихід на склад'
        });
      }
      showToast?.(`Додано на склад: ${newItemObj.name}`);
    }

    setItems(updatedItems);
    setLogs(updatedLogs);
    setShowMaterialModal(false);
    await saveWarehouseData(supabase, updatedItems, updatedLogs);
  };

  const handleOpenStockAction = (item, mode) => {
    setStockActionModal({
      open: true,
      mode,
      item,
      quantity: mode === 'out' ? '1' : '',
      cost_unit: String(item.cost_unit ?? 0),
      total_pack_price: '',
      note: ''
    });
  };

  const handleExecuteStockAction = async (e) => {
    e.preventDefault();
    const { mode, item, quantity, cost_unit, note } = stockActionModal;
    if (!item) return;

    const delta = parseFloat(quantity);
    if (!delta || delta <= 0) {
      showToast?.('Вкажіть кількість більше 0', 'error');
      return;
    }

    const unitCostVal = parseFloat(cost_unit) >= 0 ? parseFloat(cost_unit) : (Number(item.cost_unit) || 0);
    const currentQty = Number(item.quantity) || 0;
    const newQty = mode === 'in'
      ? Number((currentQty + delta).toFixed(2))
      : Math.max(0, Number((currentQty - delta).toFixed(2)));

    const updatedItems = items.map(it =>
      it.id === item.id
        ? {
            ...it,
            quantity: newQty,
            cost_unit: mode === 'in' && unitCostVal > 0 ? unitCostVal : it.cost_unit
          }
        : it
    );

    const newLog = {
      id: `log_${Date.now()}`,
      created_at: new Date().toISOString(),
      type: mode === 'in' ? 'in' : 'manual_out',
      item_id: item.id,
      item_name: item.name,
      unit: item.unit || 'шт.',
      quantity: delta,
      cost_unit: unitCostVal,
      total_cost: Math.round(delta * unitCostVal * 100) / 100,
      note: note.trim() || (mode === 'in' ? 'Прихід матеріалів на склад' : 'Ручне списання зі складу')
    };

    const updatedLogs = [newLog, ...logs];
    setItems(updatedItems);
    setLogs(updatedLogs);
    setStockActionModal({ open: false, mode: 'in', item: null, quantity: '', cost_unit: '', total_pack_price: '', note: '' });
    await saveWarehouseData(supabase, updatedItems, updatedLogs);
    showToast?.(mode === 'in' ? `Прийнято +${delta} ${item.unit} (${item.name})` : `Списано −${delta} ${item.unit} (${item.name})`);
  };

  const toggleQuickSale = async (item) => {
    const updatedItems = items.map(it =>
      it.id === item.id ? { ...it, quick_sale: !it.quick_sale } : it
    );
    setItems(updatedItems);
    await saveWarehouseData(supabase, updatedItems, logs);
    showToast?.(!item.quick_sale ? `«${item.name}» додано у швидкі списання в продажах` : `«${item.name}» приховано з швидких кнопок продажу`);
  };

  const handleDeleteMaterial = async (item) => {
    const updatedItems = items.filter(it => it.id !== item.id);
    setItems(updatedItems);
    await saveWarehouseData(supabase, updatedItems, logs);
    showToast?.(`Матеріал «${item.name}» видалено`);
  };

  const getCategoryLabel = (catId) => {
    return WAREHOUSE_CATEGORIES.find(c => c.id === catId)?.label || 'Інше';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16, width: '100%' }}>
      {/* Dusk Glass Header & Command Bar */}
      <div className="dusk-glass" style={{ padding: isMobile ? '10px 12px' : 20, display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 8 : 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 22, margin: 0 }}>
                {isMobile ? 'Склад матеріалів' : 'Склад матеріалів та пакування'}
              </h1>
              {!isMobile && (
                <p className="dusk-subheading" style={{ marginTop: 2 }}>
                  Прийом коробок, цукерок, пластику й фурнітури та автоматичне списання у продажах
                </p>
              )}
            </div>

            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={fetchWarehouse}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ height: 30, width: 30, padding: 0, justifyContent: 'center' }}
                  title="Оновити склад"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="dusk-btn dusk-btn--primary dusk-btn--sm"
                  style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>Додати</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 0 auto', minWidth: isMobile ? 0 : 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Пошук матеріалу (коробка, цукерка)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dusk-input"
                style={{ width: '100%', paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, height: isMobile ? 32 : 34, fontSize: 12.5, borderRadius: 999 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {!isMobile && (
              <>
                <button
                  type="button"
                  onClick={fetchWarehouse}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ height: 34, padding: '0 10px' }}
                  title="Оновити склад"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="dusk-btn dusk-btn--primary"
                  style={{ height: 34 }}
                >
                  <Plus size={15} />
                  <span>Прийняти новий матеріал</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dusk Ruled Tally — 4 Key Warehouse Metrics */}
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
          <div className="dusk-tally__cell" style={{ padding: isMobile ? '7px 10px' : '12px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10.5 } : undefined}>Позицій</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 22 }}>
              {stats.totalItems} <span className="dusk-currency" style={isMobile ? { fontSize: 11 } : undefined}>найм. · {stats.totalUnits} од.</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Загалом: {stats.totalUnits} од.</span>}
          </div>

          <div className="dusk-tally__cell" style={{ padding: isMobile ? '7px 10px' : '12px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10.5 } : undefined}>Вартість запасів</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 22, color: 'var(--color-accent)' }}>
              {stats.totalStockValue.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">За закупівельною собівартістю</span>}
          </div>

          <div className="dusk-tally__cell" style={{ padding: isMobile ? '7px 10px' : '12px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10.5 } : undefined}>Закінчуються</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 22, color: stats.lowStockCount > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {stats.lowStockCount} <span className="dusk-currency">поз.</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Нижче мінімального залишку</span>}
          </div>

          <div className="dusk-tally__cell" style={{ padding: isMobile ? '7px 10px' : '12px 16px' }}>
            <span className="dusk-tally__label" style={isMobile ? { fontSize: 10.5 } : undefined}>Списано</span>
            <div className="dusk-tally__value" style={{ fontSize: isMobile ? 15 : 22 }}>
              {stats.totalWrittenOffCost.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
            </div>
            {!isMobile && <span className="dusk-tally__sub">Усього списано: {stats.totalWrittenOffUnits} од.</span>}
          </div>
        </div>

        {/* View Switcher + Category Pipeline Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            width: isMobile ? '100%' : 'auto',
            paddingBottom: isMobile ? 2 : 0,
            scrollbarWidth: 'none'
          }}>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`dusk-facet-pill ${categoryFilter === 'all' ? 'active' : ''}`}
              style={isMobile ? { flexShrink: 0, padding: '4px 10px', fontSize: 11.5 } : undefined}
            >
              Усі ({items.length})
            </button>
            {WAREHOUSE_CATEGORIES.map(cat => {
              const count = items.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`dusk-facet-pill ${categoryFilter === cat.id ? 'active' : ''}`}
                  style={isMobile ? { flexShrink: 0, padding: '4px 10px', fontSize: 11.5 } : undefined}
                >
                  <span>{cat.label.split(' (')[0]}</span>
                  <span className="dusk-num" style={{ opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
            {stats.lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoryFilter('low_stock')}
                className={`dusk-facet-pill ${categoryFilter === 'low_stock' ? 'active-apricot' : ''}`}
                style={isMobile ? { flexShrink: 0, padding: '4px 10px', fontSize: 11.5 } : undefined}
              >
                <span className="dusk-dot dusk-dot--apricot" style={{ width: 6, height: 6 }} />
                <span>Закінчуються ({stats.lowStockCount})</span>
              </button>
            )}
          </div>

          <div className="dusk-segmented" style={isMobile ? { width: '100%', display: 'flex' } : undefined}>
            {[
              { id: 'stock', label: `Запаси (${items.length})`, Icon: Layers },
              { id: 'history', label: `Історія руху (${logs.length})`, Icon: History }
            ].map(({ id, label, Icon }) => {
              const isActive = viewTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewTab(id)}
                  className={`dusk-segmented__item ${isActive ? 'active' : ''}`}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    boxShadow: 'none',
                    ...(isMobile ? { flex: 1, justifyContent: 'center', height: 30, fontSize: 12 } : {})
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="inventoryViewTabSlider"
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
                  <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center' }}>
                    <Icon size={13} style={{ marginRight: 5 }} />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
      {/* ================= VIEW 1: WAREHOUSE STOCK ITEMS ================= */}
      {viewTab === 'stock' ? (
        <div className="dusk-panel" style={{ overflow: 'hidden' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <Box size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>
                Матеріалів у цій категорії немає
              </div>
              <div style={{ fontSize: 12.5, marginBottom: 14 }}>
                Додайте коробки, цукерки, листівки або пластик, щоб вести облік і списувати їх у продажах
              </div>
              <button type="button" onClick={openCreateModal} className="dusk-btn dusk-btn--primary dusk-btn--sm">
                <Plus size={14} /> Додати матеріал
              </button>
            </div>
          ) : isMobile ? (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredItems.map(item => {
                const qty = Number(item.quantity) || 0;
                const minQty = Number(item.min_quantity) || 0;
                const isLow = qty <= minQty && qty > 0;
                const isEmpty = qty <= 0;
                const costUnit = Number(item.cost_unit) || 0;
                const totalVal = Math.round(qty * costUnit);

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--color-paper-2)',
                      border: isEmpty
                        ? '1px solid var(--color-danger-border)'
                        : isLow
                          ? '1px solid var(--color-accent-2-border)'
                          : '1px solid var(--color-rule)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {/* Header: Icon + Name + Qty */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: isEmpty
                            ? 'var(--color-danger-soft)'
                            : isLow
                              ? 'var(--color-accent-2-soft)'
                              : 'var(--color-accent-soft)',
                          border: isEmpty
                            ? '1px solid var(--color-danger-border)'
                            : isLow
                              ? '1px solid var(--color-accent-2-border)'
                              : '1px solid var(--color-accent-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-accent-2)' : 'var(--color-accent)',
                          flexShrink: 0
                        }}>
                          <Package size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                            Мін. норма: {minQty} {item.unit || 'шт.'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="dusk-num" style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-accent-2)' : 'var(--color-ink)'
                        }}>
                          {qty} <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-muted)' }}>{item.unit || 'шт.'}</span>
                        </div>
                        {(isLow || isEmpty) && (
                          <span className={`dusk-badge ${isEmpty ? 'dusk-badge--danger' : 'dusk-badge--apricot'}`} style={{ fontSize: 10, padding: '1px 7px', marginTop: 2 }}>
                            {isEmpty ? 'Немає' : 'Мало'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta: Category + Quick Sale toggle */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid var(--color-rule)' }}>
                      <span className="dusk-badge dusk-badge--neutral" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                        {getCategoryLabel(item.category).split(' (')[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleQuickSale(item)}
                        className={`dusk-facet-pill ${item.quick_sale !== false ? 'active' : ''}`}
                        style={{ padding: '2px 8px', fontSize: 10.5 }}
                      >
                        <span className={`dusk-dot ${item.quick_sale !== false ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5 }} />
                        <span>{item.quick_sale !== false ? 'У продажах' : 'Приховано'}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenStockAction(item, 'in')}
                        className="dusk-btn dusk-btn--primary dusk-btn--sm"
                        style={{ flex: 1, height: 32, justifyContent: 'center', fontSize: 12 }}
                      >
                        <Plus size={13} />
                        <span>Прийняти</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenStockAction(item, 'out')}
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ flex: 1, height: 32, justifyContent: 'center', fontSize: 12 }}
                      >
                        <Minus size={13} />
                        <span>Списати</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
                        title="Редагувати"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(item)}
                        className="dusk-btn dusk-btn--danger dusk-btn--sm"
                        style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
                        title="Видалити"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dusk-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: 18 }}>Матеріал / Витратник</th>
                    <th style={{ textAlign: 'left' }}>Категорія</th>
                    <th style={{ textAlign: 'center' }}>У формі продажу</th>
                    <th style={{ textAlign: 'right' }}>Залишок на складі</th>
                    <th style={{ textAlign: 'right' }}>Собівартість</th>
                    <th style={{ textAlign: 'right' }}>Сума запасу</th>
                    <th style={{ textAlign: 'right', paddingRight: 18 }}>Швидкий прихід / списання</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const qty = Number(item.quantity) || 0;
                    const minQty = Number(item.min_quantity) || 0;
                    const isLow = qty <= minQty && qty > 0;
                    const isEmpty = qty <= 0;
                    const costUnit = Number(item.cost_unit) || 0;
                    const totalVal = Math.round(qty * costUnit);

                    return (
                      <tr key={item.id}>
                        <td style={{ paddingLeft: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: isEmpty
                                ? 'var(--color-danger-soft)'
                                : isLow
                                  ? 'var(--color-accent-2-soft)'
                                  : 'var(--color-accent-soft)',
                              border: isEmpty
                                ? '1px solid var(--color-danger-border)'
                                : isLow
                                  ? '1px solid var(--color-accent-2-border)'
                                  : '1px solid var(--color-accent-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-accent-2)' : 'var(--color-accent)',
                              flexShrink: 0
                            }}>
                              <Package size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                                Мін. норма: {minQty} {item.unit || 'шт.'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="dusk-badge dusk-badge--neutral" style={{ fontSize: 11, padding: '3px 9px' }}>
                            {getCategoryLabel(item.category).split(' (')[0]}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleQuickSale(item)}
                            className={`dusk-facet-pill ${item.quick_sale !== false ? 'active' : ''}`}
                            style={{ padding: '3px 10px', fontSize: 11 }}
                            title="Показувати як кнопку швидкого списання у вікні оформлення продажу"
                          >
                            <span className={`dusk-dot ${item.quick_sale !== false ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5 }} />
                            <span>{item.quick_sale !== false ? 'Активно в продажах' : 'Приховано'}</span>
                          </button>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {(isLow || isEmpty) && (
                              <span className={`dusk-badge ${isEmpty ? 'dusk-badge--danger' : 'dusk-badge--apricot'}`} style={{ fontSize: 10, padding: '2px 7px' }}>
                                {isEmpty ? 'Немає' : 'Мало'}
                              </span>
                            )}
                            <span className="dusk-num" style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-accent-2)' : 'var(--color-ink)'
                            }}>
                              {qty} <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-muted)' }}>{item.unit || 'шт.'}</span>
                            </span>
                          </div>
                        </td>

                        <td className="dusk-num" style={{ textAlign: 'right', fontSize: 13, color: 'var(--color-ink-2)' }}>
                          {costUnit} <span className="dusk-currency">₴</span>
                          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}> / {item.unit || 'шт.'}</span>
                        </td>

                        <td className="dusk-num" style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                          {totalVal.toLocaleString('uk-UA')} <span className="dusk-currency">₴</span>
                        </td>

                        <td style={{ textAlign: 'right', paddingRight: 18 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenStockAction(item, 'in')}
                              className="dusk-btn dusk-btn--primary dusk-btn--sm"
                              style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                              title="Оприбуткувати нову поставку на склад"
                            >
                              <Plus size={12} />
                              <span>Прийняти</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenStockAction(item, 'out')}
                              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                              style={{ height: 28, padding: '0 9px', fontSize: 11.5 }}
                              title="Списати зі складу"
                            >
                              <Minus size={12} />
                              <span>Списати</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                              style={{ height: 28, width: 28, padding: 0 }}
                              title="Редагувати"
                            >
                              <Edit3 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(item)}
                              className="dusk-btn dusk-btn--danger dusk-btn--sm"
                              style={{ height: 28, width: 28, padding: 0 }}
                              title="Видалити"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ================= VIEW 2: MOVEMENT & WRITE-OFF LOGS ================= */
        <div className="dusk-panel" style={{ overflow: 'hidden' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Історія руху матеріалів порожня. Прийміть матеріали на склад або спишіть їх у замовленні.
            </div>
          ) : isMobile ? (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredLogs.map(log => {
                const isIn = log.type === 'in' || log.type === 'sale_return';
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--color-paper-2)',
                      border: '1px solid var(--color-rule)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span className={`dusk-badge ${isIn ? 'dusk-badge--periwinkle' : 'dusk-badge--apricot'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        {isIn ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        <span>
                          {log.type === 'in' ? 'Прихід' : log.type === 'sale_out' ? 'У продаж' : log.type === 'sale_return' ? 'Повернення' : 'Списання'}
                        </span>
                      </span>
                      <span className="dusk-mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--color-ink)' }}>
                        {log.item_name}
                      </span>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="dusk-num" style={{ fontWeight: 700, fontSize: 14, color: isIn ? 'var(--color-accent)' : 'var(--color-accent-2)' }}>
                          {isIn ? '+' : '−'}{log.quantity} <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>{log.unit || 'шт.'}</span>
                        </span>
                        {log.total_cost ? (
                          <div className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                            {log.total_cost} ₴
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {log.note && (
                      <div style={{ fontSize: 12, color: 'var(--color-ink-2)', paddingTop: 4, borderTop: '1px solid var(--color-rule)' }}>
                        {log.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dusk-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: 18 }}>Дата та час</th>
                    <th style={{ textAlign: 'left' }}>Операція</th>
                    <th style={{ textAlign: 'left' }}>Матеріал</th>
                    <th style={{ textAlign: 'right' }}>Кількість</th>
                    <th style={{ textAlign: 'right' }}>Сума</th>
                    <th style={{ textAlign: 'left', paddingRight: 18 }}>Примітка / Замовлення</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const isIn = log.type === 'in' || log.type === 'sale_return';
                    return (
                      <tr key={log.id}>
                        <td className="dusk-mono" style={{ paddingLeft: 18, fontSize: 11.5, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td>
                          <span className={`dusk-badge ${isIn ? 'dusk-badge--periwinkle' : 'dusk-badge--apricot'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                            {isIn ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                            <span>
                              {log.type === 'in' ? 'Прихід' : log.type === 'sale_out' ? 'У продаж' : log.type === 'sale_return' ? 'Повернення' : 'Списання'}
                            </span>
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>
                          {log.item_name}
                        </td>
                        <td className="dusk-num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13.5, color: isIn ? 'var(--color-accent)' : 'var(--color-accent-2)' }}>
                          {isIn ? '+' : '−'}{log.quantity} <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>{log.unit || 'шт.'}</span>
                        </td>
                        <td className="dusk-num" style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--color-ink-2)' }}>
                          {log.total_cost ? `${log.total_cost} ₴` : '—'}
                        </td>
                        <td style={{ paddingRight: 18, fontSize: 12.5, color: 'var(--color-ink-2)' }}>
                          {log.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* ================= MODAL 1: RECEIVE (+Прийняти) OR WRITE-OFF (-Списати) ================= */}
      <AnimatePresence>
        {stockActionModal.open && stockActionModal.item && (
          <div
            onClick={() => setStockActionModal({ ...stockActionModal, open: false })}
            style={{
              position: 'fixed', inset: 0, zIndex: 1200,
              background: 'oklch(10% 0.015 268 / 0.80)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="dusk-panel"
              style={{ width: '100%', maxWidth: 440, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-rule)' }}
            >
              <div style={{
                padding: '14px 18px',
                background: 'var(--color-paper-2)',
                borderBottom: '1px solid var(--color-rule)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 className="dusk-heading" style={{ fontSize: 16, margin: 0 }}>
                    {stockActionModal.mode === 'in' ? 'Прийняти поставку на склад' : 'Списати зі складу'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '2px 0 0' }}>
                    {stockActionModal.item.name} (поточний залишок: {stockActionModal.item.quantity} {stockActionModal.item.unit})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStockActionModal({ ...stockActionModal, open: false })}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ width: 28, height: 28, padding: 0 }}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleExecuteStockAction} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>
                    {stockActionModal.mode === 'in' ? `Кількість для оприбуткування (${stockActionModal.item.unit})` : `Кількість для списання (${stockActionModal.item.unit})`}
                  </label>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {(stockActionModal.mode === 'in' ? [5, 10, 25, 50, 100] : [1, 2, 5, 10]).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const totalPack = parseFloat(stockActionModal.total_pack_price);
                          const nextCost = totalPack > 0 ? String(Math.round((totalPack / preset) * 100) / 100) : stockActionModal.cost_unit;
                          setStockActionModal({ ...stockActionModal, quantity: String(preset), cost_unit: nextCost });
                        }}
                        className={`dusk-facet-pill ${Number(stockActionModal.quantity) === preset ? 'active' : ''}`}
                        style={{ padding: '4px 10px', fontSize: 11.5 }}
                      >
                        {stockActionModal.mode === 'in' ? `+${preset}` : `−${preset}`} {stockActionModal.item.unit}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="Введіть кількість…"
                    value={stockActionModal.quantity}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const qtyNum = parseFloat(val);
                      const totalPack = parseFloat(stockActionModal.total_pack_price);
                      const nextCost = (totalPack > 0 && qtyNum > 0) ? String(Math.round((totalPack / qtyNum) * 100) / 100) : stockActionModal.cost_unit;
                      setStockActionModal({ ...stockActionModal, quantity: val, cost_unit: nextCost });
                    }}
                    className="dusk-input dusk-num"
                    style={{ height: 38, fontSize: 15, fontWeight: 600 }}
                  />
                </div>

                {stockActionModal.mode === 'in' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Ціна за 1 {stockActionModal.item.unit} (₴)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={stockActionModal.cost_unit}
                        onChange={e => setStockActionModal({ ...stockActionModal, cost_unit: e.target.value.replace(/[^0-9.]/g, ''), total_pack_price: '' })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Або сума за всю пачку (₴)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Авторозрахунок за 1 шт"
                        value={stockActionModal.total_pack_price}
                        onChange={e => {
                          const packVal = e.target.value.replace(/[^0-9.]/g, '');
                          const packNum = parseFloat(packVal);
                          const qtyNum = parseFloat(stockActionModal.quantity);
                          const calcUnit = (packNum > 0 && qtyNum > 0) ? String(Math.round((packNum / qtyNum) * 100) / 100) : stockActionModal.cost_unit;
                          setStockActionModal({ ...stockActionModal, total_pack_price: packVal, cost_unit: calcUnit });
                        }}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                    Примітка ({stockActionModal.mode === 'in' ? 'постачальник, накладна' : 'причина списання'})
                  </label>
                  <input
                    type="text"
                    placeholder={stockActionModal.mode === 'in' ? 'Напр. Закупівля коробок Нова Пошта…' : 'Напр. Пакування замовлення / брак…'}
                    value={stockActionModal.note}
                    onChange={e => setStockActionModal({ ...stockActionModal, note: e.target.value })}
                    className="dusk-input"
                    style={{ height: 34, fontSize: 12.5 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setStockActionModal({ ...stockActionModal, open: false })}
                    className="dusk-btn dusk-btn--ghost"
                  >
                    Скасувати
                  </button>
                  <button type="submit" className="dusk-btn dusk-btn--primary">
                    <Check size={14} />
                    <span>{stockActionModal.mode === 'in' ? 'Оприбуткувати на склад' : 'Підтвердити списання'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: CREATE / EDIT WAREHOUSE MATERIAL ================= */}
      <AnimatePresence>
        {showMaterialModal && (
          <div
            onClick={() => setShowMaterialModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1200,
              background: 'oklch(10% 0.015 268 / 0.80)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="dusk-panel"
              style={{ width: '100%', maxWidth: 540, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-rule)' }}
            >
              <div style={{
                padding: '14px 20px',
                background: 'var(--color-paper-2)',
                borderBottom: '1px solid var(--color-rule)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 className="dusk-heading" style={{ fontSize: 17, margin: 0 }}>
                    {editingItem ? 'Редагувати матеріал' : 'Новий матеріал / витратник на склад'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '2px 0 0' }}>
                    Коробки, цукерки, листівки, кільця для брелків, пластик або будь-які комплектуючі
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  style={{ width: 28, height: 28, padding: 0 }}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '82vh', overflowY: 'auto' }}>
                {!editingItem && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Sparkles size={12} style={{ color: 'var(--color-accent)' }} />
                      <span>Швидкі шаблони (клікніть для заповнення):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {QUICK_MATERIAL_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => setMaterialForm({
                            ...materialForm,
                            name: tpl.name,
                            category: tpl.category,
                            unit: tpl.unit,
                            min_quantity: String(tpl.min_quantity),
                            cost_unit: String(tpl.cost_unit)
                          })}
                          className="dusk-facet-pill"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          + {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 11.5, color: 'var(--color-ink-2)', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    Назва матеріалу *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Напр. Коробка 20×15×10 см, Цукерка, Листівка…"
                    value={materialForm.name}
                    onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                    className="dusk-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                      Категорія
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {WAREHOUSE_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setMaterialForm({ ...materialForm, category: cat.id })}
                          className={`dusk-facet-pill ${materialForm.category === cat.id ? 'active' : ''}`}
                          style={{ padding: '4px 9px', fontSize: 11 }}
                        >
                          {cat.label.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                      Од. виміру
                    </label>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {['шт.', 'уп.', 'кг', 'м'].map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setMaterialForm({ ...materialForm, unit: u })}
                          className={`dusk-facet-pill ${materialForm.unit === u ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                      Кількість зараз ({materialForm.unit})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="50"
                      value={materialForm.quantity}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        const qNum = parseFloat(val);
                        const packNum = parseFloat(materialForm.pack_total_cost);
                        const calcUnit = (packNum > 0 && qNum > 0) ? String(Math.round((packNum / qNum) * 100) / 100) : materialForm.cost_unit;
                        setMaterialForm({ ...materialForm, quantity: val, cost_unit: calcUnit });
                      }}
                      className="dusk-input dusk-num"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                      Ціна за 1 {materialForm.unit} (₴)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="12"
                      value={materialForm.cost_unit}
                      onChange={e => setMaterialForm({ ...materialForm, cost_unit: e.target.value.replace(/[^0-9.]/g, ''), pack_total_cost: '' })}
                      className="dusk-input dusk-num"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                      Мін. залишок
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="10"
                      value={materialForm.min_quantity}
                      onChange={e => setMaterialForm({ ...materialForm, min_quantity: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="dusk-input dusk-num"
                    />
                  </div>
                </div>

                {/* Optional Pack Calculator */}
                <div style={{
                  background: 'var(--color-paper-2)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}>
                  <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    Купили упаковкою? Введіть суму за всю пачку, і ціна за 1 {materialForm.unit} порахується автоматично:
                  </span>
                  <div style={{ position: 'relative', width: 120, flexShrink: 0 }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Сума пачки"
                      value={materialForm.pack_total_cost}
                      onChange={e => {
                        const packVal = e.target.value.replace(/[^0-9.]/g, '');
                        const packNum = parseFloat(packVal);
                        const qNum = parseFloat(materialForm.quantity);
                        const calcUnit = (packNum > 0 && qNum > 0) ? String(Math.round((packNum / qNum) * 100) / 100) : materialForm.cost_unit;
                        setMaterialForm({ ...materialForm, pack_total_cost: packVal, cost_unit: calcUnit });
                      }}
                      className="dusk-input dusk-num"
                      style={{ height: 30, fontSize: 12, paddingRight: 22 }}
                    />
                    <span style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-muted)' }}>₴</span>
                  </div>
                </div>

                {/* Toggle Quick Sale Button */}
                <div
                  onClick={() => setMaterialForm({ ...materialForm, quick_sale: !materialForm.quick_sale })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                    background: materialForm.quick_sale ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                    border: materialForm.quick_sale ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                      Показувати у вікні «Новий продаж» для швидкого списання
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                      Дозволяє в 1 клік додавати цей матеріал (коробку, цукерку тощо) до замовлення клієнта
                    </div>
                  </div>
                  <div style={{
                    width: 34, height: 19, borderRadius: 999,
                    background: materialForm.quick_sale ? 'var(--color-accent)' : 'var(--color-paper)',
                    border: '1px solid var(--color-rule)', position: 'relative', flexShrink: 0
                  }}>
                    <span style={{
                      position: 'absolute', top: 2, left: materialForm.quick_sale ? 16 : 2,
                      width: 13, height: 13, borderRadius: '50%',
                      background: materialForm.quick_sale ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                      transition: 'left 0.16s ease'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
                  <button type="button" onClick={() => setShowMaterialModal(false)} className="dusk-btn dusk-btn--ghost">
                    Скасувати
                  </button>
                  <button type="submit" className="dusk-btn dusk-btn--primary">
                    <Check size={14} />
                    <span>{editingItem ? 'Зберегти зміни' : 'Додати на склад'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
