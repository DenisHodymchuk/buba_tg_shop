"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Cpu, Wrench, Layers, Plus, Trash2, Edit3, 
  Save, BarChart3, Package, Play, Sliders, Search, 
  CheckCircle2, AlertCircle, TrendingUp, PieChart, ShieldAlert,
  ChevronDown, ChevronUp, DollarSign, Clock, Settings, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Default initial hardware components
const INITIAL_COMPONENTS = [
  { id: 'comp-1', name: 'Світлодіодна стрічка COB 12V', category: 'Світлодіоди/LED', supplier: 'AliExpress', unit: 'м', purchase_price: 95, stock_qty: 45, min_stock_alert: 10 },
  { id: 'comp-2', name: 'Блок живлення 12V 2A 24W', category: 'Драйвери/БЖ', supplier: 'KSE', unit: 'шт', purchase_price: 140, stock_qty: 18, min_stock_alert: 5 },
  { id: 'comp-3', name: 'Сенсорний діммер / Перемикач', category: 'Вимикачі/Діммери', supplier: 'Prom', unit: 'шт', purchase_price: 75, stock_qty: 12, min_stock_alert: 4 },
  { id: 'comp-4', name: 'Кабель живлення 1.8m з вилкою', category: 'Кабелі/Штекери', supplier: 'Epicentr', unit: 'шт', purchase_price: 65, stock_qty: 30, min_stock_alert: 8 },
  { id: 'comp-5', name: 'Подарункова крафт-коробка', category: 'Пакування', supplier: 'PackBox', unit: 'шт', purchase_price: 48, stock_qty: 25, min_stock_alert: 10 },
];

export default function LampStudio() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'components' | 'models'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- Components Library State ---
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [componentSearch, setComponentSearch] = useState('');
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [compForm, setCompForm] = useState({
    name: '', category: 'Деталі', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5
  });

  // --- Saved Product Recipes ---
  const [lampModels, setLampModels] = useState([]);

  // --- Main Product Calculator Form ---
  const [productName, setProductName] = useState('Новий виріб');
  const [plasticWeight, setPlasticWeight] = useState(250); // grams
  const [plasticPricePerKg, setPlasticPricePerKg] = useState(750); // ₴/kg
  const [printHours, setPrintHours] = useState(8); // hours
  const [laborHours, setLaborHours] = useState(1); // hours
  const [laborRate, setLaborRate] = useState(150); // ₴/hour
  const [targetMargin, setTargetMargin] = useState(100); // % margin

  // Selected Hardware Components from Inventory for this product
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

  // Batch production modal
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

      const { data: modelData } = await supabase.from('lamp_models').select('*').order('created_at', { ascending: false });
      if (modelData) setLampModels(modelData);
    } catch (e) {
      console.warn('Error loading studio data:', e);
    }
  };

  // --- Simple Cost Calculations ---
  const calculations = useMemo(() => {
    // 1. Plastic cost
    const plasticCost = ((Number(plasticWeight) || 0) / 1000) * (Number(plasticPricePerKg) || 0);

    // 2. Electricity cost
    const kwh = ((Number(printHours) || 0) * (Number(printerWattage) || 120)) / 1000;
    const electricityCost = kwh * (Number(electricityRate) || 4.32);

    // 3. Components cost
    const componentsCost = productComponents.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.price) || 0);
    }, 0);

    // 4. Labor cost
    const laborCost = (Number(laborHours) || 0) * (Number(laborRate) || 0);

    // 5. Packaging & Defect Reserve
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
  }, [plasticWeight, plasticPricePerKg, printHours, laborHours, laborRate, productComponents, packagingCost, defectMarginPercent, electricityRate, printerWattage, targetMargin]);

  // Add component to product
  const handleAddComponentToProduct = (compId) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    // Check if already added
    const existing = productComponents.find(p => p.component_id === comp.id);
    if (existing) {
      setProductComponents(productComponents.map(p => 
        p.component_id === comp.id ? { ...p, qty: p.qty + 1 } : p
      ));
    } else {
      setProductComponents([
        ...productComponents,
        { id: `pc-${Date.now()}`, component_id: comp.id, name: comp.name, qty: 1, price: comp.purchase_price }
      ]);
    }
  };

  // Execute Batch Production (Stock Deduction)
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

  // Save Component to Inventory
  const handleSaveInventoryComp = async (e) => {
    e.preventDefault();
    if (!compForm.name.trim() || !compForm.purchase_price) {
      showToast('Заповніть назву та ціну деталі', 'error');
      return;
    }

    const payload = {
      name: compForm.name,
      category: compForm.category,
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
    setCompForm({ name: '', category: 'Деталі', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5 });
    showToast(editingComp ? 'Деталь оновлено!' : 'Деталь додано!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', color: 'var(--text-main)' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000,
              padding: '12px 20px', borderRadius: 14,
              background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: 10
            }}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & Sub-navigation */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: 16,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Box size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Студія Виробництва
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Розрахунок собівартості та облік деталей для ваших виробів
            </p>
          </div>
        </div>

        {/* Tab Switchers matching site buttons */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('calculator')}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: activeTab === 'calculator' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
              color: activeTab === 'calculator' ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            🧮 Калькулятор Виробу
          </button>
          <button
            onClick={() => setActiveTab('components')}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: activeTab === 'components' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
              color: activeTab === 'components' ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            📦 Склад Деталей ({components.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SIMPLE CLEAN CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* Left Column: Simple Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Product Name Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Назва виробу
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="напр. Настільна Лампа «Неон», Арт-декор"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* 1. 3D Print & Material */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <Layers size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  1. 3D-Друк & Пластик
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Вага пластику (грам)
                  </label>
                  <input
                    type="number"
                    value={plasticWeight}
                    onChange={(e) => setPlasticWeight(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Ціна пластику (₴/кг)
                  </label>
                  <input
                    type="number"
                    value={plasticPricePerKg}
                    onChange={(e) => setPlasticPricePerKg(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Час друку (годин)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={printHours}
                  onChange={(e) => setPrintHours(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
                <span>Вартість пластику:</span>
                <strong style={{ color: '#3b82f6' }}>{calculations.plasticCost.toFixed(2)} ₴</strong>
              </div>
            </div>

            {/* 2. Hardware Components from Inventory */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cpu size={18} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    2. Комплектуючі зі складу
                  </h3>
                </div>
              </div>

              {/* Add Component Dropdown */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Додати деталь зі складу:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddComponentToProduct(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>-- Оберіть деталь --</option>
                  {components.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.purchase_price}₴ / {c.unit}, на складі: {c.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              {/* List of Added Components */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {productComponents.map((item, idx) => (
                  <div key={item.id || idx} style={{
                    display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
                    padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 10, gap: 8
                  }}>
                    <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...productComponents];
                          updated[idx].qty = Number(e.target.value) || 1;
                          setProductComponents(updated);
                        }}
                        style={{
                          width: 45, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '4px 6px', color: '#fff', fontSize: 12, textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700, width: 60, textAlign: 'right' }}>
                        {(item.qty * item.price).toFixed(0)}₴
                      </span>
                      <button
                        onClick={() => setProductComponents(productComponents.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', justifyBetween: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
                <span>Разом деталі:</span>
                <strong style={{ color: '#8b5cf6' }}>{calculations.componentsCost.toFixed(2)} ₴</strong>
              </div>
            </div>

            {/* 3. Labor & Margin */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <Wrench size={18} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  3. Робота та Націнка
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Години роботи (збірка, пайка)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Ставка майстра (₴/год)
                  </label>
                  <input
                    type="number"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Бажана Націнка (Маржа):</span>
                  <strong style={{ color: '#2dd4bf' }}>+{targetMargin}%</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2dd4bf', cursor: 'pointer' }}
                />
              </div>

              {/* Collapsible Advanced Settings */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', paddingTop: 4
                }}
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? 'Сховати додаткові налаштування' : 'Додаткові параметри (електрика, пакування, брак)'}
              </button>

              {showAdvanced && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Упаковка (₴)</label>
                    <input
                      type="number"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 11 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Резерв на брак (%)</label>
                    <input
                      type="number"
                      value={defectMarginPercent}
                      onChange={(e) => setDefectMarginPercent(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 11 }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Clean & Beautiful Summary Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(2, 11, 24, 0.95))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>
                  Результат розрахунку
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                  {productName || 'Виріб'}
                </h3>
              </div>

              {/* Prime Cost Big Number */}
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Собівартість виробу
                </span>
                <div style={{ fontSize: 32, fontWeight: 950, color: '#3b82f6', margin: '4px 0' }}>
                  {calculations.primeCost.toFixed(2)} ₴
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  (Пластик: {calculations.plasticCost.toFixed(0)}₴ | Деталі: {calculations.componentsCost.toFixed(0)}₴ | Робота: {calculations.laborCost.toFixed(0)}₴)
                </span>
              </div>

              {/* Suggested Price Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 16,
                padding: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                    Ціна продажу (+{targetMargin}%)
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 950, color: '#2dd4bf' }}>
                    {calculations.suggestedPrice.toFixed(0)} ₴
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Прибуток</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>
                    +{calculations.netProfit.toFixed(0)} ₴
                  </span>
                </div>
              </div>

              {/* Action Buttons matching site style */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setShowBatchModal(true)}
                  style={{
                    padding: '14px 20px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff',
                    fontWeight: 850, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 8px 20px rgba(16,185,129,0.25)', transition: 'all 0.2s'
                  }}
                >
                  <Play size={18} /> Списати зі складу (Виготовити)
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY COMPONENTS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <input
              type="text"
              placeholder="Пошук деталі..."
              value={componentSearch}
              onChange={(e) => setComponentSearch(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 16px', color: '#fff', fontSize: 13, width: 260
              }}
            />

            <button
              onClick={() => {
                setEditingComp(null);
                setCompForm({ name: '', category: 'Деталі', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5 });
                setShowCompModal(true);
              }}
              style={{
                padding: '10px 18px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Plus size={16} /> Додати нову деталь
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {components.filter(c => c.name.toLowerCase().includes(componentSearch.toLowerCase())).map(comp => (
              <div key={comp.id} style={{
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border)', borderRadius: 16, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{comp.name}</h4>
                  <span style={{ fontSize: 10, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    {comp.category}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Ціна: <strong style={{ color: '#10b981' }}>{comp.purchase_price}₴</strong></span>
                  <span>На складі: <strong style={{ color: '#fff' }}>{comp.stock_qty} {comp.unit}</strong></span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH PRODUCTION MODAL */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid var(--border)', borderRadius: 24, padding: 24,
            maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
              Списання матеріалів зі складу
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Вкажіть кількість виробу <strong>"{productName}"</strong>. Система автоматично спише деталі зі складу.
            </p>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Кількість штук:
              </label>
              <input
                type="number"
                min="1"
                value={batchQty}
                onChange={(e) => setBatchQty(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px', color: '#fff', fontSize: 16, fontWeight: 800
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                Скасувати
              </button>
              <button
                onClick={handleExecuteProduction}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
              >
                Списати зі складу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD COMPONENT MODAL */}
      {/* ========================================================================= */}
      {showCompModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <form onSubmit={handleSaveInventoryComp} style={{
            background: '#0f172a', border: '1px solid var(--border)', borderRadius: 24, padding: 24,
            maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
              Додати деталь у склад
            </h3>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Назва деталі *</label>
              <input
                type="text"
                required
                value={compForm.name}
                onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                placeholder="напр. Перемикач 12V"
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 12 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ціна закупівлі (₴) *</label>
                <input
                  type="number"
                  required
                  value={compForm.purchase_price}
                  onChange={(e) => setCompForm({ ...compForm, purchase_price: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Кількість на складі</label>
                <input
                  type="number"
                  value={compForm.stock_qty}
                  onChange={(e) => setCompForm({ ...compForm, stock_qty: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowCompModal(false)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                Скасувати
              </button>
              <button
                type="submit"
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
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
