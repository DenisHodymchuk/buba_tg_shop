"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Cpu, Wrench, Layers, Plus, Trash2, Edit3, 
  Save, BarChart3, Package, Play, Sliders, Search, 
  CheckCircle2, AlertCircle, TrendingUp, PieChart, ShieldAlert,
  ChevronDown, ChevronUp, DollarSign, Clock, Settings, RefreshCw, X, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Preset Filament types (identical to main Calculator.jsx)
const FILAMENT_PRESETS = [
  { name: 'PLA Standard', type: 'PLA', cost: 750 },
  { name: 'PLA Premium', type: 'PLA', cost: 950 },
  { name: 'PETG Matte', type: 'PETG', cost: 680 },
  { name: 'PLA Silk Gold', type: 'PLA', cost: 920 },
  { name: 'ABS', type: 'ABS', cost: 600 },
  { name: 'TPU Flex', type: 'TPU', cost: 1200 },
];

// Initial default hardware components
const INITIAL_COMPONENTS = [
  { id: 'comp-1', name: 'Світлодіодна стрічка COB 12V', category: 'Світлодіоди/LED', supplier: 'AliExpress', unit: 'м', purchase_price: 95, stock_qty: 45, min_stock_alert: 10 },
  { id: 'comp-2', name: 'Блок живлення 12V 2A 24W', category: 'Драйвери/БЖ', supplier: 'KSE', unit: 'шт', purchase_price: 140, stock_qty: 18, min_stock_alert: 5 },
  { id: 'comp-3', name: 'Сенсорний діммер / Перемикач', category: 'Вимикачі/Діммери', supplier: 'Prom', unit: 'шт', purchase_price: 75, stock_qty: 12, min_stock_alert: 4 },
  { id: 'comp-4', name: 'Кабель живлення 1.8m з вилкою', category: 'Кабелі/Штекери', supplier: 'Epicentr', unit: 'шт', purchase_price: 65, stock_qty: 30, min_stock_alert: 8 },
  { id: 'comp-5', name: 'Подарункова крафт-коробка', category: 'Пакування', supplier: 'PackBox', unit: 'шт', purchase_price: 48, stock_qty: 25, min_stock_alert: 10 },
];

export default function LampStudio() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'components'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- Inventory State ---
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [materialsLibrary, setMaterialsLibrary] = useState([]);
  const [componentSearch, setComponentSearch] = useState('');
  
  // Modals
  const [showCompModal, setShowCompModal] = useState(false); // Edit/Create Inventory Item
  const [showPickerModal, setShowPickerModal] = useState(false); // Pick Detail for Product
  const [pickerSearch, setPickerSearch] = useState('');
  const [editingComp, setEditingComp] = useState(null);

  const [compForm, setCompForm] = useState({
    name: '', category: 'Світлодіоди/LED', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5
  });

  // --- Product Form State ---
  const [productName, setProductName] = useState('Новий виріб');
  
  // Filament parameters (matching main Calculator.jsx)
  const [plasticType, setPlasticType] = useState('PLA Standard');
  const [plasticPricePerKg, setPlasticPricePerKg] = useState(750);
  const [plasticWeight, setPlasticWeight] = useState(250); // grams
  const [printHours, setPrintHours] = useState(8); // hours

  // Master's Labor COST PER ITEM (Фіксована вартість за виріб, не по годинах!)
  const [laborCostPerItem, setLaborCostPerItem] = useState(150); // ₴ за виріб

  // Target profit margin %
  const [targetMargin, setTargetMargin] = useState(100);

  // Selected Hardware Components in Product
  const [productComponents, setProductComponents] = useState([
    { id: 'bom-1', component_id: 'comp-1', name: 'Світлодіодна стрічка COB 12V', qty: 1, price: 95 },
    { id: 'bom-2', component_id: 'comp-2', name: 'Блок живлення 12V 2A 24W', qty: 1, price: 140 }
  ]);

  // Collapsible Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [packagingCost, setPackagingCost] = useState(40);
  const [defectMarginPercent, setDefectMarginPercent] = useState(5);
  const [electricityRate, setElectricityRate] = useState(4.32);
  const [printerWattage, setPrinterWattage] = useState(120);

  // Production batch modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchQty, setBatchQty] = useState(1);

  useEffect(() => {
    fetchStudioData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchStudioData = async () => {
    if (!supabase) return;
    try {
      const { data: compData } = await supabase.from('lamp_components').select('*').order('created_at', { ascending: false });
      if (compData && compData.length > 0) setComponents(compData);

      const { data: matData } = await supabase.from('material_library').select('*').order('name');
      if (matData && matData.length > 0) setMaterialsLibrary(matData);
    } catch (e) {
      console.warn('Error loading studio data:', e);
    }
  };

  // --- Calculations Engine ---
  const calculations = useMemo(() => {
    // 1. Plastic cost
    const plasticCost = ((Number(plasticWeight) || 0) / 1000) * (Number(plasticPricePerKg) || 0);

    // 2. Electricity cost
    const kwh = ((Number(printHours) || 0) * (Number(printerWattage) || 120)) / 1000;
    const electricityCost = kwh * (Number(electricityRate) || 4.32);

    // 3. Hardware Components cost
    const componentsCost = productComponents.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.price) || 0);
    }, 0);

    // 4. Labor cost (FIXED COST PER ITEM!)
    const laborCost = Number(laborCostPerItem) || 0;

    // 5. Subtotal & Defect Reserve & Packaging
    const baseSubtotal = plasticCost + electricityCost + componentsCost + laborCost + (Number(packagingCost) || 0);
    const defectReserve = baseSubtotal * ((Number(defectMarginPercent) || 0) / 100);

    // 6. Total Prime Cost & Sale Price
    const primeCost = baseSubtotal + defectReserve;
    const margin = (Number(targetMargin) || 0) / 100;
    const suggestedPrice = primeCost * (1 + margin);
    const netProfit = suggestedPrice - primeCost;

    return {
      plasticCost,
      electricityCost,
      componentsCost,
      laborCost,
      defectReserve,
      primeCost,
      suggestedPrice,
      netProfit
    };
  }, [plasticWeight, plasticPricePerKg, printHours, laborCostPerItem, productComponents, packagingCost, defectMarginPercent, electricityRate, printerWattage, targetMargin]);

  // Apply Filament Preset
  const handleApplyFilamentPreset = (preset) => {
    setPlasticType(preset.name);
    setPlasticPricePerKg(preset.cost);
    showToast(`Обрано філамент: ${preset.name} (${preset.cost} ₴/кг)`);
  };

  // Add component to product from picker
  const handleAddComponentToProduct = (comp) => {
    const existingIndex = productComponents.findIndex(p => p.component_id === comp.id);
    if (existingIndex !== -1) {
      const updated = [...productComponents];
      updated[existingIndex].qty += 1;
      setProductComponents(updated);
    } else {
      setProductComponents([
        ...productComponents,
        { id: `pc-${Date.now()}`, component_id: comp.id, name: comp.name, qty: 1, price: comp.purchase_price }
      ]);
    }
    showToast(`Додано: ${comp.name}`);
  };

  // Remove component from product
  const handleRemoveComponentFromProduct = (index) => {
    setProductComponents(productComponents.filter((_, i) => i !== index));
  };

  // Execute Production (Stock Deduction)
  const handleExecuteProduction = async () => {
    const qty = Number(batchQty) || 1;
    setLoading(true);
    try {
      const updatedComps = [...components];
      for (const item of productComponents) {
        const needed = (Number(item.qty) || 0) * qty;
        const compIndex = updatedComps.findIndex(c => c.id === item.component_id);
        if (compIndex !== -1) {
          const currentStock = Number(updatedComps[compIndex].stock_qty) || 0;
          const newStock = Math.max(0, currentStock - needed);
          updatedComps[compIndex].stock_qty = newStock;

          if (supabase && updatedComps[compIndex].id && !String(updatedComps[compIndex].id).startsWith('comp-')) {
            await supabase.from('lamp_components').update({ stock_qty: newStock }).eq('id', updatedComps[compIndex].id);
          }
        }
      }
      setComponents(updatedComps);
      setShowBatchModal(false);
      showToast(`Виготовлено ${qty} шт. Матеріали вираховано зі складу!`);
    } catch (e) {
      showToast('Помилка при зніманні матеріалів', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save / Edit Inventory Item
  const handleSaveInventoryComp = async (e) => {
    e.preventDefault();
    if (!compForm.name.trim() || !compForm.purchase_price) {
      showToast('Заповніть назву та ціну деталі', 'error');
      return;
    }

    const payload = {
      name: compForm.name,
      category: compForm.category || 'Деталі',
      supplier: compForm.supplier,
      unit: compForm.unit || 'шт',
      purchase_price: Number(compForm.purchase_price) || 0,
      stock_qty: Number(compForm.stock_qty) || 0,
      min_stock_alert: Number(compForm.min_stock_alert) || 5
    };

    if (supabase) {
      if (editingComp) {
        await supabase.from('lamp_components').update(payload).eq('id', editingComp.id);
      } else {
        await supabase.from('lamp_components').insert(payload);
      }
      fetchStudioData();
    } else {
      if (editingComp) {
        setComponents(components.map(c => c.id === editingComp.id ? { ...c, ...payload } : c));
      } else {
        setComponents([{ id: `comp-${Date.now()}`, ...payload }, ...components]);
      }
    }

    setShowCompModal(false);
    setEditingComp(null);
    setCompForm({ name: '', category: 'Світлодіоди/LED', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5 });
    showToast(editingComp ? 'Деталь оновлено!' : 'Деталь додано в склад!');
  };

  // DELETE Inventory Item
  const handleDeleteInventoryComp = async (id) => {
    if (!confirm('Видалити цю деталь зі складу?')) return;
    try {
      if (supabase && !String(id).startsWith('comp-')) {
        await supabase.from('lamp_components').delete().eq('id', id);
      }
      setComponents(components.filter(c => c.id !== id));
      showToast('Деталь видалено зі складу!');
    } catch (e) {
      showToast('Помилка видалення', 'error');
    }
  };

  const filteredPickerComponents = useMemo(() => {
    return components.filter(c => c.name.toLowerCase().includes(pickerSearch.toLowerCase()));
  }, [components, pickerSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', color: 'var(--color-text)' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000,
              padding: '11px 18px', borderRadius: 11,
              background: 'oklch(19% 0.018 268 / 0.96)',
              border: notification.type === 'error' ? '1px solid oklch(68% 0.16 20 / 0.45)' : '1px solid oklch(75% 0.14 265 / 0.4)',
              color: 'var(--color-text)', fontSize: 12.5, fontWeight: 600,
              boxShadow: '0 14px 32px rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {notification.type === 'error' ? <AlertCircle size={16} style={{ color: 'oklch(75% 0.14 20)' }} /> : <CheckCircle2 size={16} style={{ color: 'oklch(76% 0.14 155)' }} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & Sub-navigation */}
      <div className="dusk-glass" style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: 16,
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'oklch(75% 0.14 265 / 0.12)',
            border: '1px solid oklch(75% 0.14 265 / 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-accent)'
          }}>
            <Box size={20} />
          </div>
          <div>
            <h2 className="dusk-heading" style={{ margin: 0, fontSize: 18 }}>
              Студія Виробництва
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Розрахунок собівартості, комплектуючих та робіт для вашої продукції
            </p>
          </div>
        </div>

        {/* Navigation Switchers matching Dusk styling */}
        <div className="dusk-segmented">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`dusk-segmented__item ${activeTab === 'calculator' ? 'is-active' : ''}`}
          >
            Калькулятор виробу
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`dusk-segmented__item ${activeTab === 'components' ? 'is-active' : ''}`}
          >
            Склад деталей ({components.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCT CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, alignItems: 'flex-start' }}>
          
          {/* Left Column: Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Product Name Card */}
            <div className="dusk-panel" style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Назва виробу
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="напр. Настільна Лампа «Неон», Арт-декор"
                className="dusk-input"
                style={{ width: '100%', fontSize: 14, fontWeight: 600 }}
              />
            </div>

            {/* 1. 3D Print & Filament Selection */}
            <div className="dusk-panel" style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid oklch(24% 0.015 268)', paddingBottom: 10 }}>
                <Layers size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 className="dusk-heading" style={{ margin: 0, fontSize: 14 }}>
                  1. 3D-Друк & Вибір Філаменту
                </h3>
              </div>

              {/* Filament Presets Picker */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                  Швидкий вибір пластику (Пресет):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FILAMENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyFilamentPreset(preset)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 7,
                        border: plasticType === preset.name ? '1px solid var(--color-accent)' : '1px solid oklch(26% 0.015 268)',
                        background: plasticType === preset.name ? 'oklch(75% 0.14 265 / 0.15)' : 'oklch(15% 0.014 268)',
                        color: plasticType === preset.name ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {preset.name} ({preset.cost}₴)
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Library Quick Select if available */}
              {materialsLibrary.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                    З бази матеріалів:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 90, overflowY: 'auto' }}>
                    {materialsLibrary.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          setPlasticType(mat.name);
                          setPlasticPricePerKg(mat.cost_per_kg);
                          showToast(`Обрано матеріали: ${mat.name}`);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 7,
                          border: plasticType === mat.name ? '1px solid var(--color-accent)' : '1px solid oklch(26% 0.015 268)',
                          background: plasticType === mat.name ? 'oklch(75% 0.14 265 / 0.15)' : 'oklch(15% 0.014 268)',
                          color: plasticType === mat.name ? 'var(--color-text)' : 'var(--color-text-muted)',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {mat.name} ({mat.cost_per_kg} ₴/кг)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inputs: Plastic Type, Price/kg, Weight, Print Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Тип / Назва пластику
                  </label>
                  <input
                    type="text"
                    value={plasticType}
                    onChange={(e) => setPlasticType(e.target.value)}
                    className="dusk-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Ціна за 1 кг (₴)
                  </label>
                  <input
                    type="number"
                    value={plasticPricePerKg}
                    onChange={(e) => setPlasticPricePerKg(e.target.value)}
                    className="dusk-input dusk-mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Вага пластику (грам)
                  </label>
                  <input
                    type="number"
                    value={plasticWeight}
                    onChange={(e) => setPlasticWeight(e.target.value)}
                    className="dusk-input dusk-mono"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Час друку (годин)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={printHours}
                    onChange={(e) => setPrintHours(e.target.value)}
                    className="dusk-input dusk-mono"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', background: 'oklch(15% 0.014 268)', padding: '9px 12px', borderRadius: 8, border: '1px solid oklch(24% 0.015 268)' }}>
                <span>Вартість пластику ({plasticType}):</span>
                <strong className="dusk-mono" style={{ color: 'var(--color-accent)' }}>{calculations.plasticCost.toFixed(2)} ₴</strong>
              </div>
            </div>

            {/* 2. Hardware Components in Product */}
            <div className="dusk-panel" style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid oklch(24% 0.015 268)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cpu size={16} style={{ color: 'var(--color-accent-2)' }} />
                  <h3 className="dusk-heading" style={{ margin: 0, fontSize: 14 }}>
                    2. Комплектуючі зі складу
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  className="dusk-btn dusk-btn--primary dusk-btn--sm"
                >
                  <Plus size={13} /> Додати деталь
                </button>
              </div>

              {/* Added Components List */}
              {productComponents.length === 0 ? (
                <div 
                  onClick={() => setShowPickerModal(true)}
                  style={{
                    padding: 20, border: '1px dashed oklch(28% 0.016 268)', borderRadius: 10, textAlign: 'center',
                    color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer'
                  }}
                >
                  + Натисніть, щоб обрати деталі зі складу
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {productComponents.map((item, idx) => (
                    <div key={item.id || idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', background: 'oklch(15% 0.014 268)', border: '1px solid oklch(25% 0.015 268)', borderRadius: 10, gap: 10
                    }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>{item.name}</span>
                        <span className="dusk-mono" style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>{item.price} ₴ / шт</span>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...productComponents];
                            if (updated[idx].qty > 1) {
                              updated[idx].qty -= 1;
                              setProductComponents(updated);
                            }
                          }}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ width: 26, height: 26, padding: 0 }}
                        >
                          <Minus size={12} />
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...productComponents];
                            updated[idx].qty = Math.max(1, Number(e.target.value) || 1);
                            setProductComponents(updated);
                          }}
                          className="dusk-input dusk-mono"
                          style={{ width: 42, padding: '3px 4px', textAlign: 'center', fontWeight: 700, fontSize: 12 }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...productComponents];
                            updated[idx].qty += 1;
                            setProductComponents(updated);
                          }}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ width: 26, height: 26, padding: 0 }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="dusk-mono" style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 700, width: 62, textAlign: 'right' }}>
                        {(item.qty * item.price).toFixed(0)} ₴
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveComponentFromProduct(idx)}
                        title="Видалити деталь з виробу"
                        className="dusk-btn dusk-btn--danger dusk-btn--sm"
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', background: 'oklch(15% 0.014 268)', padding: '9px 12px', borderRadius: 8, border: '1px solid oklch(24% 0.015 268)' }}>
                <span>Разом деталі:</span>
                <strong className="dusk-mono" style={{ color: 'var(--color-accent-2)' }}>{calculations.componentsCost.toFixed(2)} ₴</strong>
              </div>
            </div>

            {/* 3. Labor Per Product & Margin */}
            <div className="dusk-panel" style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid oklch(24% 0.015 268)', paddingBottom: 10 }}>
                <Wrench size={16} style={{ color: 'oklch(76% 0.14 155)' }} />
                <h3 className="dusk-heading" style={{ margin: 0, fontSize: 14 }}>
                  3. Робота Майстра (за виріб) та Націнка
                </h3>
              </div>

              <div>
                <label style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Оплата майстру за виготовлення виробу (₴ / виріб)
                </label>
                <input
                  type="number"
                  value={laborCostPerItem}
                  onChange={(e) => setLaborCostPerItem(e.target.value)}
                  placeholder="напр. 150 ₴ за виріб"
                  className="dusk-input dusk-mono"
                  style={{ width: '100%', fontSize: 14, fontWeight: 700 }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Бажана Націнка (Маржа):</span>
                  <strong className="dusk-mono" style={{ color: 'oklch(76% 0.14 155)' }}>+{targetMargin}%</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'oklch(75% 0.14 265)', cursor: 'pointer' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                  fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', paddingTop: 4
                }}
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? 'Сховати додаткові налаштування' : 'Додаткові параметри (електрика, пакування, брак)'}
              </button>

              {showAdvanced && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'oklch(15% 0.014 268)', padding: 12, borderRadius: 10, border: '1px solid oklch(24% 0.015 268)' }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 3 }}>Упаковка (₴)</label>
                    <input
                      type="number"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                      className="dusk-input dusk-mono"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 3 }}>Резерв на брак (%)</label>
                    <input
                      type="number"
                      value={defectMarginPercent}
                      onChange={(e) => setDefectMarginPercent(e.target.value)}
                      className="dusk-input dusk-mono"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Clean & Beautiful Summary Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div className="dusk-panel" style={{
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              <div style={{ borderBottom: '1px solid oklch(24% 0.015 268)', paddingBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Результат розрахунку
                </span>
                <h3 className="dusk-heading" style={{ margin: '4px 0 0 0', fontSize: 19 }}>
                  {productName || 'Виріб'}
                </h3>
              </div>

              {/* Prime Cost Big Number */}
              <div style={{ background: 'oklch(15% 0.014 268)', borderRadius: 12, padding: 18, border: '1px solid oklch(25% 0.015 268)', textAlign: 'center' }}>
                <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Собівартість виробу
                </span>
                <div className="dusk-mono" style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-text)', margin: '6px 0' }}>
                  {calculations.primeCost.toFixed(2)} ₴
                </div>
                <span className="dusk-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Пластик: {calculations.plasticCost.toFixed(0)}₴ · Деталі: {calculations.componentsCost.toFixed(0)}₴ · Робота: {calculations.laborCost.toFixed(0)}₴
                </span>
              </div>

              {/* Suggested Price Card */}
              <div style={{
                background: 'oklch(75% 0.14 265 / 0.08)',
                border: '1px solid oklch(75% 0.14 265 / 0.25)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: 10.5, color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                    Ціна продажу (+{targetMargin}%)
                  </span>
                  <span className="dusk-mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)' }}>
                    {calculations.suggestedPrice.toFixed(0)} ₴
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>Прибуток</span>
                  <span className="dusk-mono" style={{ fontSize: 17, fontWeight: 700, color: 'oklch(76% 0.14 155)' }}>
                    +{calculations.netProfit.toFixed(0)} ₴
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(true)}
                  className="dusk-btn dusk-btn--primary"
                  style={{ padding: '12px 18px', width: '100%' }}
                >
                  <Play size={16} /> Списати зі складу (Виготовити)
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY COMPONENTS LIST WITH EDIT & DELETE BUTTONS */}
      {/* ========================================================================= */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <input
              type="text"
              placeholder="Пошук деталі..."
              value={componentSearch}
              onChange={(e) => setComponentSearch(e.target.value)}
              className="dusk-input"
              style={{ width: 260 }}
            />

            <button
              type="button"
              onClick={() => {
                setEditingComp(null);
                setCompForm({ name: '', category: 'Світлодіоди/LED', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5 });
                setShowCompModal(true);
              }}
              className="dusk-btn dusk-btn--primary"
            >
              <Plus size={15} /> Додати нову деталь у склад
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {components.filter(c => c.name.toLowerCase().includes(componentSearch.toLowerCase())).map(comp => (
              <div key={comp.id} className="dusk-panel" style={{
                padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{comp.name}</h4>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{comp.supplier || 'Постачальник не вказаний'}</span>
                  </div>
                  <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 10 }}>
                    {comp.category}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)', background: 'oklch(15% 0.014 268)', padding: 10, borderRadius: 8, border: '1px solid oklch(24% 0.015 268)' }}>
                  <span>Ціна: <strong className="dusk-mono" style={{ color: 'oklch(76% 0.14 155)' }}>{comp.purchase_price} ₴</strong></span>
                  <span>На складі: <strong className="dusk-mono" style={{ color: 'var(--color-text)' }}>{comp.stock_qty} {comp.unit}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid oklch(24% 0.015 268)', paddingTop: 10, gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComp(comp);
                      setCompForm({
                        name: comp.name,
                        category: comp.category || 'Деталі',
                        supplier: comp.supplier || '',
                        unit: comp.unit || 'шт',
                        purchase_price: comp.purchase_price,
                        stock_qty: comp.stock_qty,
                        min_stock_alert: comp.min_stock_alert || 5
                      });
                      setShowCompModal(true);
                    }}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ flex: 1 }}
                  >
                    <Edit3 size={13} /> Редагувати
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteInventoryComp(comp.id)}
                    className="dusk-btn dusk-btn--danger dusk-btn--sm"
                  >
                    <Trash2 size={13} /> Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BEAUTIFUL CUSTOM HARDWARE PICKER FOR PRODUCT */}
      {/* ========================================================================= */}
      {showPickerModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6, 7, 12, 0.82)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="dusk-panel" style={{
            padding: 22,
            maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '85vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid oklch(24% 0.015 268)', paddingBottom: 10 }}>
              <h3 className="dusk-heading" style={{ margin: 0, fontSize: 16 }}>
                Оберіть деталь зі складу
              </h3>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ padding: 6 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Пошук деталі за назвою..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="dusk-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 380, paddingRight: 4 }}>
              {filteredPickerComponents.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Нічого не знайдено
                </div>
              ) : (
                filteredPickerComponents.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => {
                      handleAddComponentToProduct(comp);
                      setShowPickerModal(false);
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'oklch(15% 0.014 268)', border: '1px solid oklch(25% 0.015 268)',
                      borderRadius: 10, cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{comp.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        На складі: <strong className="dusk-mono" style={{ color: 'var(--color-text)' }}>{comp.stock_qty} {comp.unit}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="dusk-mono" style={{ fontSize: 13, fontWeight: 700, color: 'oklch(76% 0.14 155)' }}>
                        {comp.purchase_price} ₴
                      </span>
                      <span className="dusk-btn dusk-btn--primary dusk-btn--sm">
                        + Додати
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH PRODUCTION MODAL */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6, 7, 12, 0.82)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="dusk-panel" style={{
            padding: 22,
            maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <h3 className="dusk-heading" style={{ margin: 0, fontSize: 16 }}>
              Списання матеріалів зі складу
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Вкажіть кількість виробу <strong style={{ color: 'var(--color-text)' }}>&ldquo;{productName}&rdquo;</strong>. Система автоматично спише деталі зі складу.
            </p>

            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Кількість штук:
              </label>
              <input
                type="number"
                min="1"
                value={batchQty}
                onChange={(e) => setBatchQty(e.target.value)}
                className="dusk-input dusk-mono"
                style={{ width: '100%', fontSize: 15, fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="dusk-btn dusk-btn--ghost"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleExecuteProduction}
                className="dusk-btn dusk-btn--primary"
              >
                Списати зі складу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT INVENTORY ITEM MODAL */}
      {/* ========================================================================= */}
      {showCompModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6, 7, 12, 0.82)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <form onSubmit={handleSaveInventoryComp} className="dusk-panel" style={{
            padding: 22,
            maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <h3 className="dusk-heading" style={{ margin: 0, fontSize: 16 }}>
              {editingComp ? 'Редагувати деталь у складі' : 'Додати деталь у склад'}
            </h3>

            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Назва деталі *</label>
              <input
                type="text"
                required
                value={compForm.name}
                onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                placeholder="напр. Перемикач 12V"
                className="dusk-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Ціна закупівлі (₴) *</label>
                <input
                  type="number"
                  required
                  value={compForm.purchase_price}
                  onChange={(e) => setCompForm({ ...compForm, purchase_price: e.target.value })}
                  className="dusk-input dusk-mono"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Кількість на складі</label>
                <input
                  type="number"
                  value={compForm.stock_qty}
                  onChange={(e) => setCompForm({ ...compForm, stock_qty: e.target.value })}
                  className="dusk-input dusk-mono"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowCompModal(false)}
                className="dusk-btn dusk-btn--ghost"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="dusk-btn dusk-btn--primary"
              >
                Зберегти
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
