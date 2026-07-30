'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lightbulb, Cpu, Wrench, Layers, DollarSign, Plus, Trash2, Edit3, 
  Save, BarChart3, Package, Box, Zap, CheckCircle2, AlertTriangle, 
  TrendingUp, PieChart, Sparkles, RefreshCw, Play, Sliders, Copy,
  Check, ArrowRight, ShieldAlert, Clock, Sparkle, Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Default initial components if DB is empty or loading
const INITIAL_COMPONENTS = [
  { id: 'comp-1', name: 'Світлодіодна стрічка COB 12V (Нейтральна)', category: 'Світлодіоди/LED', supplier: 'AliExpress', unit: 'м', purchase_price: 95, stock_qty: 45, min_stock_alert: 10 },
  { id: 'comp-2', name: 'Блок живлення 12V 2A 24W (компактний)', category: 'Драйвери/БЖ', supplier: 'KSE', unit: 'шт', purchase_price: 140, stock_qty: 18, min_stock_alert: 5 },
  { id: 'comp-3', name: 'Сенсорний діммер з підсвіткою', category: 'Вимикачі/Діммери', supplier: 'Prom', unit: 'шт', purchase_price: 75, stock_qty: 12, min_stock_alert: 4 },
  { id: 'comp-4', name: 'Кабель з вилкою та перемикачем 1.8m', category: 'Кабелі/Штекери', supplier: 'Epicentr', unit: 'шт', purchase_price: 65, stock_qty: 30, min_stock_alert: 8 },
  { id: 'comp-5', name: 'Гніздо живлення DC 5.5x2.1mm', category: 'Кабелі/Штекери', supplier: 'Prom', unit: 'шт', purchase_price: 15, stock_qty: 60, min_stock_alert: 15 },
  { id: 'comp-6', name: 'Подарункова коробка крафт 20x20x30cm', category: 'Пакування', supplier: 'PackBox', unit: 'шт', purchase_price: 48, stock_qty: 25, min_stock_alert: 10 },
];

// Default initial materials if DB is empty
const INITIAL_MATERIALS = [
  { id: 'mat-1', name: 'PLA White Translucent (Bambu Lab)', type: 'PLA', cost_per_kg: 850 },
  { id: 'mat-2', name: 'PETG Matte Black (Sunlu)', type: 'PETG', cost_per_kg: 680 },
  { id: 'mat-3', name: 'PLA Silk Gold (eSUN)', type: 'PLA', cost_per_kg: 920 },
];

export default function LampStudio() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'components' | 'models' | 'analytics'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- Components Library State ---
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [componentSearch, setComponentSearch] = useState('');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState('All');
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [compForm, setCompForm] = useState({
    name: '',
    category: 'Світлодіоди/LED',
    supplier: '',
    unit: 'шт',
    purchase_price: '',
    stock_qty: '',
    min_stock_alert: 5,
    notes: ''
  });

  // --- Saved Lamp Models State ---
  const [lampModels, setLampModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);

  // --- Active Calculator / Builder Form State ---
  const [lampName, setLampName] = useState('Новий Авторський Виріб');
  const [targetMargin, setTargetMargin] = useState(100); // 100% margin default
  const [defectMarginPercent, setDefectMarginPercent] = useState(5); // 5% reserve for defects
  const [packagingCost, setPackagingCost] = useState(48);
  const [electricityRate, setElectricityRate] = useState(4.32); // UAH / kWh
  const [printerPower, setPrinterPower] = useState(120); // Watts

  // 3D Printed Parts
  const [printParts, setPrintParts] = useState([
    { id: 'part-1', name: 'Плафон / Розсіювач', material_type: 'PLA', cost_per_kg: 850, weight_g: 180, print_time_h: 8 },
    { id: 'part-2', name: 'Основа лампи', material_type: 'PETG', cost_per_kg: 680, weight_g: 220, print_time_h: 6 }
  ]);

  // BOM Hardware Components in this lamp
  const [bomItems, setBomItems] = useState([
    { id: 'bom-1', component_id: 'comp-1', component_name: 'Світлодіодна стрічка COB 12V', quantity: 0.8, unit_price: 95 },
    { id: 'bom-2', component_id: 'comp-2', component_name: 'Блок живлення 12V 2A', quantity: 1, unit_price: 140 },
    { id: 'bom-3', component_id: 'comp-3', component_name: 'Сенсорний діммер', quantity: 1, unit_price: 75 },
    { id: 'bom-4', component_id: 'comp-5', component_name: 'Гніздо живлення DC', quantity: 1, unit_price: 15 }
  ]);

  // Multi-stage Labor
  const [laborStages, setLaborStages] = useState([
    { id: 'stage-1', stage_name: '3D-друк та обробка підтримки', duration_hours: 0.3, hourly_rate: 150, fixed_cost: 0 },
    { id: 'stage-2', stage_name: 'Шліфування & Нанесення лаку', duration_hours: 0.5, hourly_rate: 180, fixed_cost: 0 },
    { id: 'stage-3', stage_name: 'Пайка світлодіодів & Монтаж', duration_hours: 0.75, hourly_rate: 200, fixed_cost: 0 },
    { id: 'stage-4', stage_name: 'Фінальна збірка, тест & Пакування', duration_hours: 0.25, hourly_rate: 150, fixed_cost: 0 }
  ]);

  // Production batch modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState(1);

  // Load Data on Mount
  useEffect(() => {
    fetchStudioData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchStudioData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetch Components
      const { data: compData, error: compErr } = await supabase.from('lamp_components').select('*').order('created_at', { ascending: false });
      if (!compErr && compData && compData.length > 0) {
        setComponents(compData);
      }

      // Fetch Models
      const { data: modelData, error: modelErr } = await supabase.from('lamp_models').select('*').order('created_at', { ascending: false });
      if (!modelErr && modelData) {
        setLampModels(modelData);
      }
    } catch (err) {
      console.warn('Error fetching studio data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATIONS ENGINE ---
  const calculations = useMemo(() => {
    // 1. Plastic Cost & Printing Electricity
    let totalPlasticCost = 0;
    let totalPrintHours = 0;
    let totalWeightG = 0;

    printParts.forEach(part => {
      const weightG = Number(part.weight_g) || 0;
      const costKg = Number(part.cost_per_kg) || 0;
      const hours = Number(part.print_time_h) || 0;
      
      totalPlasticCost += (weightG / 1000) * costKg;
      totalPrintHours += hours;
      totalWeightG += weightG;
    });

    // Electricity cost for printer: Watts * Hours / 1000 * Rate
    const totalKwh = (totalPrintHours * (printerPower || 120)) / 1000;
    const electricityCost = totalKwh * (electricityRate || 4.32);

    // 2. Hardware BOM Cost
    let totalHardwareCost = 0;
    bomItems.forEach(item => {
      totalHardwareCost += (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    });

    // 3. Labor Cost
    let totalLaborCost = 0;
    let totalLaborHours = 0;
    laborStages.forEach(stage => {
      const hrs = Number(stage.duration_hours) || 0;
      const rate = Number(stage.hourly_rate) || 0;
      const fixed = Number(stage.fixed_cost) || 0;
      totalLaborCost += (hrs * rate) + fixed;
      totalLaborHours += hrs;
    });

    // 4. Subtotal & Defect Reserve & Packaging
    const baseCostBeforeDefects = totalPlasticCost + totalHardwareCost + totalLaborCost + electricityCost + (Number(packagingCost) || 0);
    const defectReserveAmount = baseCostBeforeDefects * ((Number(defectMarginPercent) || 0) / 100);

    // 5. Total Prime Cost (Собівартість)
    const primeCost = baseCostBeforeDefects + defectReserveAmount;

    // 6. Target Price & Profit
    const profitMarginDecimal = (Number(targetMargin) || 0) / 100;
    const suggestedPrice = primeCost * (1 + profitMarginDecimal);
    const netProfit = suggestedPrice - primeCost;
    const profitPerLaborHour = totalLaborHours > 0 ? (netProfit / totalLaborHours) : netProfit;

    // Visual Shares for Charts (%)
    const safeCost = primeCost > 0 ? primeCost : 1;
    const shares = {
      plastic: Math.round((totalPlasticCost / safeCost) * 100),
      hardware: Math.round((totalHardwareCost / safeCost) * 100),
      labor: Math.round((totalLaborCost / safeCost) * 100),
      electricity: Math.round((electricityCost / safeCost) * 100),
      packagingAndDefect: Math.round(((defectReserveAmount + Number(packagingCost || 0)) / safeCost) * 100)
    };

    return {
      totalPlasticCost,
      totalPrintHours,
      totalWeightG,
      electricityCost,
      totalHardwareCost,
      totalLaborCost,
      totalLaborHours,
      defectReserveAmount,
      primeCost,
      suggestedPrice,
      netProfit,
      profitPerLaborHour,
      shares
    };
  }, [printParts, bomItems, laborStages, electricityRate, printerPower, packagingCost, defectMarginPercent, targetMargin]);

  // --- SAVE LAMP MODEL TO DB ---
  const handleSaveModel = async () => {
    if (!lampName.trim()) {
      showToast('Введіть назву лампи!', 'error');
      return;
    }

    setLoading(true);
    try {
      const modelPayload = {
        name: lampName,
        target_margin: targetMargin,
        sale_price: calculations.suggestedPrice,
        defect_margin_percent: defectMarginPercent,
        packaging_cost: packagingCost,
        electricity_cost_kwh: electricityRate,
        printer_wattage: printerPower
      };

      let savedModelId = selectedModelId;

      if (supabase) {
        if (selectedModelId) {
          await supabase.from('lamp_models').update(modelPayload).eq('id', selectedModelId);
          // Delete old relations and re-insert
          await supabase.from('lamp_bom_items').delete().eq('lamp_model_id', selectedModelId);
          await supabase.from('lamp_labor_stages').delete().eq('lamp_model_id', selectedModelId);
          await supabase.from('lamp_print_parts').delete().eq('lamp_model_id', selectedModelId);
        } else {
          const { data, error } = await supabase.from('lamp_models').insert(modelPayload).select().single();
          if (error) throw error;
          savedModelId = data.id;
          setSelectedModelId(savedModelId);
        }

        // Insert BOM items
        if (bomItems.length > 0) {
          const bItems = bomItems.map(item => ({
            lamp_model_id: savedModelId,
            component_id: item.component_id && String(item.component_id).startsWith('comp-') ? null : item.component_id,
            component_name: item.component_name,
            quantity: item.quantity,
            unit_price: item.unit_price
          }));
          await supabase.from('lamp_bom_items').insert(bItems);
        }

        // Insert Labor Stages
        if (laborStages.length > 0) {
          const lStages = laborStages.map(s => ({
            lamp_model_id: savedModelId,
            stage_name: s.stage_name,
            duration_hours: s.duration_hours,
            hourly_rate: s.hourly_rate,
            fixed_cost: s.fixed_cost
          }));
          await supabase.from('lamp_labor_stages').insert(lStages);
        }

        // Insert Print Parts
        if (printParts.length > 0) {
          const pParts = printParts.map(p => ({
            lamp_model_id: savedModelId,
            part_name: p.name,
            material_type: p.material_type,
            cost_per_kg: p.cost_per_kg,
            weight_g: p.weight_g,
            print_time_h: p.print_time_h
          }));
          await supabase.from('lamp_print_parts').insert(pParts);
        }

        fetchStudioData();
      } else {
        // Fallback local save
        const newModel = {
          id: selectedModelId || `model-${Date.now()}`,
          ...modelPayload,
          created_at: new Date().toISOString()
        };
        setLampModels(prev => [newModel, ...prev.filter(m => m.id !== newModel.id)]);
      }

      showToast(`Модель "${lampName}" успішно збережено!`);
    } catch (err) {
      console.error('Error saving model:', err);
      showToast('Помилка при збереженні моделі', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- BATCH PRODUCTION & AUTOMATIC STOCK DEDUCTION ---
  const handleExecuteBatchProduction = async () => {
    const qty = Number(batchCount) || 1;
    if (qty <= 0) return;

    setLoading(true);
    try {
      // 1. Deduct component stocks locally and in Supabase
      const updatedComponents = [...components];
      
      for (const bomItem of bomItems) {
        const totalNeeded = (Number(bomItem.quantity) || 0) * qty;
        const compIndex = updatedComponents.findIndex(c => c.id === bomItem.component_id || c.name === bomItem.component_name);
        
        if (compIndex !== -1) {
          const currentStock = Number(updatedComponents[compIndex].stock_qty) || 0;
          const newStock = Math.max(0, currentStock - totalNeeded);
          updatedComponents[compIndex].stock_qty = newStock;

          if (supabase && updatedComponents[compIndex].id && !String(updatedComponents[compIndex].id).startsWith('comp-')) {
            await supabase.from('lamp_components').update({ stock_qty: newStock }).eq('id', updatedComponents[compIndex].id);
          }
        }
      }

      setComponents(updatedComponents);
      setShowBatchModal(false);
      showToast(`Успішно виготовлено ${qty} шт. лампи! Деталі та пластик вираховано зі складу.`, 'success');
    } catch (err) {
      console.error('Error in batch production:', err);
      showToast('Помилка при зніманні матеріалів зі складу', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- HARDWARE COMPONENT FORM MODAL ---
  const handleSaveComponent = async (e) => {
    e.preventDefault();
    if (!compForm.name.trim() || !compForm.purchase_price) {
      showToast('Заповніть назву та ціну деталі', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: compForm.name,
        category: compForm.category,
        supplier: compForm.supplier,
        unit: compForm.unit || 'шт',
        purchase_price: Number(compForm.purchase_price) || 0,
        stock_qty: Number(compForm.stock_qty) || 0,
        min_stock_alert: Number(compForm.min_stock_alert) || 5,
        notes: compForm.notes
      };

      if (supabase) {
        if (editingComp) {
          const { error } = await supabase.from('lamp_components').update(payload).eq('id', editingComp.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('lamp_components').insert(payload);
          if (error) throw error;
        }
        await fetchStudioData();
      } else {
        // Fallback local update
        if (editingComp) {
          setComponents(prev => prev.map(c => c.id === editingComp.id ? { ...c, ...payload } : c));
        } else {
          setComponents(prev => [{ id: `comp-${Date.now()}`, ...payload }, ...prev]);
        }
      }

      setShowCompModal(false);
      setEditingComp(null);
      setCompForm({ name: '', category: 'Світлодіоди/LED', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5, notes: '' });
      showToast(editingComp ? 'Деталь оновлено!' : 'Деталь додано в склад!');
    } catch (err) {
      console.error('Error saving component:', err);
      showToast('Помилка збереження деталі', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!confirm('Видалити цю деталь зі складу?')) return;
    try {
      if (supabase && !String(id).startsWith('comp-')) {
        await supabase.from('lamp_components').delete().eq('id', id);
      }
      setComponents(prev => prev.filter(c => c.id !== id));
      showToast('Деталь видалено');
    } catch (err) {
      showToast('Помилка видалення', 'error');
    }
  };

  // Categories list
  const categoriesList = ['All', 'Світлодіоди/LED', 'Драйвери/БЖ', 'Вимикачі/Діммери', 'Кабелі/Штекери', 'Фурнітура/Кріплення', 'Пакування', 'Різне'];

  const filteredComponents = useMemo(() => {
    return components.filter(c => {
      const matchCat = componentCategoryFilter === 'All' || c.category === componentCategoryFilter;
      const matchSearch = c.name.toLowerCase().includes(componentSearch.toLowerCase()) || 
                          (c.supplier && c.supplier.toLowerCase().includes(componentSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [components, componentCategoryFilter, componentSearch]);

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
              notification.type === 'error' 
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' 
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {notification.type === 'error' ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            <span className="font-medium text-sm">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400">
                <Box className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-100 to-slate-100 bg-clip-text text-transparent">
                  Студія Виробництва
                </h1>
                <p className="text-xs md:text-sm text-slate-400 font-medium">
                  Облік себевартості, комплектуючих, 3D-друку та робіт для будь-якого виробу
                </p>
              </div>
            </div>
          </div>

          {/* Unified Navigation Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Конструктор & BOM
            </button>

            <button
              onClick={() => setActiveTab('components')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === 'components'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Склад Деталей
              {components.filter(c => c.stock_qty <= c.min_stock_alert).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'models'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Box className="w-4 h-4" />
              Каталог Моделей
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Аналітика Маржі
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UNIFIED CONSTRUCTOR & COST CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: BOM & Inputs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Lamp Model Header Input */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Назва Моделі / Виробу
                </label>
                <input
                  type="text"
                  value={lampName}
                  onChange={(e) => setLampName(e.target.value)}
                  placeholder="напр. Настільна Лампа, Арт-декор, Гаджет v2"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-base font-bold text-slate-100 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={handleSaveModel}
                  disabled={loading}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {selectedModelId ? 'Оновити Модель' : 'Зберегти Модель'}
                </button>
              </div>
            </div>

            {/* SECTION A: 3D PRINTING & PLASTIC */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">1. 3D-Друк & Корпусні Деталі</h2>
                    <p className="text-xs text-slate-400">Витрата пластику, вага та тривалість друку</p>
                  </div>
                </div>
                <button
                  onClick={() => setPrintParts([...printParts, { id: `part-${Date.now()}`, name: 'Нова деталь', material_type: 'PLA', cost_per_kg: 750, weight_g: 50, print_time_h: 2 }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Додати деталь
                </button>
              </div>

              <div className="space-y-3">
                {printParts.map((part, idx) => (
                  <div key={part.id || idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4">
                      <label className="text-[10px] text-slate-400 block mb-1">Деталь / Плафон</label>
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => {
                          const updated = [...printParts];
                          updated[idx].name = e.target.value;
                          setPrintParts(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Тип пластику / Ціна за кг</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={part.material_type}
                          onChange={(e) => {
                            const updated = [...printParts];
                            updated[idx].material_type = e.target.value;
                            setPrintParts(updated);
                          }}
                          className="w-1/2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                        />
                        <div className="relative w-1/2">
                          <input
                            type="number"
                            value={part.cost_per_kg}
                            onChange={(e) => {
                              const updated = [...printParts];
                              updated[idx].cost_per_kg = e.target.value;
                              setPrintParts(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">₴</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Вага (грам)</label>
                      <input
                        type="number"
                        value={part.weight_g}
                        onChange={(e) => {
                          const updated = [...printParts];
                          updated[idx].weight_g = e.target.value;
                          setPrintParts(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Друк (годин)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={part.print_time_h}
                        onChange={(e) => {
                          const updated = [...printParts];
                          updated[idx].print_time_h = e.target.value;
                          setPrintParts(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => setPrintParts(printParts.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-summary banner for plastic */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-wrap items-center justify-between text-xs text-indigo-200 gap-2">
                <span>Загальна вага: <strong>{calculations.totalWeightG}г</strong></span>
                <span>Час друку: <strong>{calculations.totalPrintHours} год</strong></span>
                <span>Електроенергія принтера: <strong>{calculations.electricityCost.toFixed(2)} ₴</strong></span>
                <span className="font-bold text-indigo-300">Пластик: {calculations.totalPlasticCost.toFixed(2)} ₴</span>
              </div>
            </div>

            {/* SECTION B: HARDWARE & ELECTRICAL COMPONENTS (BOM) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">2. Електроніка та Специфікація (BOM)</h2>
                    <p className="text-xs text-slate-400">Куповані компоненти зі складу або за ринковою ціною</p>
                  </div>
                </div>
                <button
                  onClick={() => setBomItems([...bomItems, { id: `bom-${Date.now()}`, component_name: 'Новий компонент', quantity: 1, unit_price: 50 }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Додати деталь
                </button>
              </div>

              <div className="space-y-3">
                {bomItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    
                    {/* Component Picker / Name */}
                    <div className="md:col-span-5">
                      <label className="text-[10px] text-slate-400 block mb-1">Обрати зі складу або назва</label>
                      <select
                        value={item.component_id || ''}
                        onChange={(e) => {
                          const compId = e.target.value;
                          const comp = components.find(c => c.id === compId);
                          const updated = [...bomItems];
                          if (comp) {
                            updated[idx].component_id = comp.id;
                            updated[idx].component_name = comp.name;
                            updated[idx].unit_price = comp.purchase_price;
                          } else {
                            updated[idx].component_id = null;
                          }
                          setBomItems(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                      >
                        <option value="">-- Ввести вручну або обрати зі складу --</option>
                        {components.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.purchase_price}₴ / {c.unit}, склад: {c.stock_qty})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Назва компонента</label>
                      <input
                        type="text"
                        value={item.component_name}
                        onChange={(e) => {
                          const updated = [...bomItems];
                          updated[idx].component_name = e.target.value;
                          setBomItems(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">К-сть / Ціна (₴)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...bomItems];
                            updated[idx].quantity = e.target.value;
                            setBomItems(updated);
                          }}
                          className="w-1/2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                        />
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => {
                            const updated = [...bomItems];
                            updated[idx].unit_price = e.target.value;
                            setBomItems(updated);
                          }}
                          className="w-1/2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1 text-right text-xs font-bold text-amber-400">
                      {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(0)}₴
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => setBomItems(bomItems.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
                <span>Всього позицій BOM: <strong>{bomItems.length} шт</strong></span>
                <span className="font-bold text-amber-300">Електроніка & Деталі: {calculations.totalHardwareCost.toFixed(2)} ₴</span>
              </div>
            </div>

            {/* SECTION C: MULTI-STAGE LABOR */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">3. Поетапні Роботи (Labor Breakdown)</h2>
                    <p className="text-xs text-slate-400">Оплата за час майстра, шліфування, пайка та монтаж</p>
                  </div>
                </div>
                <button
                  onClick={() => setLaborStages([...laborStages, { id: `stage-${Date.now()}`, stage_name: 'Нова стадія', duration_hours: 0.5, hourly_rate: 150, fixed_cost: 0 }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Додати етап
                </button>
              </div>

              <div className="space-y-3">
                {laborStages.map((stage, idx) => (
                  <div key={stage.id || idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5">
                      <label className="text-[10px] text-slate-400 block mb-1">Назва Етапу</label>
                      <input
                        type="text"
                        value={stage.stage_name}
                        onChange={(e) => {
                          const updated = [...laborStages];
                          updated[idx].stage_name = e.target.value;
                          setLaborStages(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Години / Ставка (₴/год)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={stage.duration_hours}
                          onChange={(e) => {
                            const updated = [...laborStages];
                            updated[idx].duration_hours = e.target.value;
                            setLaborStages(updated);
                          }}
                          className="w-1/2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                        />
                        <input
                          type="number"
                          value={stage.hourly_rate}
                          onChange={(e) => {
                            const updated = [...laborStages];
                            updated[idx].hourly_rate = e.target.value;
                            setLaborStages(updated);
                          }}
                          className="w-1/2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Фіксована доплата (₴)</label>
                      <input
                        type="number"
                        value={stage.fixed_cost}
                        onChange={(e) => {
                          const updated = [...laborStages];
                          updated[idx].fixed_cost = e.target.value;
                          setLaborStages(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-1 text-right text-xs font-bold text-emerald-400">
                      {((Number(stage.duration_hours) || 0) * (Number(stage.hourly_rate) || 0) + (Number(stage.fixed_cost) || 0)).toFixed(0)}₴
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => setLaborStages(laborStages.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-200">
                <span>Загальний час майстра: <strong>{calculations.totalLaborHours.toFixed(2)} год</strong></span>
                <span className="font-bold text-emerald-300">Вартість робіт: {calculations.totalLaborCost.toFixed(2)} ₴</span>
              </div>
            </div>

            {/* SECTION D: OVERHEADS & DEFECT RESERVE */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Резерв на брак (%)
                </label>
                <input
                  type="number"
                  value={defectMarginPercent}
                  onChange={(e) => setDefectMarginPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Додає {calculations.defectReserveAmount.toFixed(1)}₴ на покриття непередбачуваного браку</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Упаковка та брендинг (₴)
                </label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Вартість фірмової коробки та наклейок</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Тариф електроенергії (₴/кВт·год)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Потужність принтера: {printerPower}W</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Analytics & Pricing Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* PRICING & COST BREAKDOWN CARD */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl space-y-6 sticky top-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Собівартість & Маржа
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                  {lampName}
                </span>
              </div>

              {/* Total Prime Cost */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Підсумкова Собівартість</span>
                <span className="text-3xl font-black bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent my-1 block">
                  {calculations.primeCost.toFixed(2)} ₴
                </span>
                <span className="text-[11px] text-slate-500">
                  (Пластик + BOM + Робота + Електрика + Брак)
                </span>
              </div>

              {/* Cost Breakdown Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Структура Витрат</span>
                  <span>100%</span>
                </div>
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 gap-0.5">
                  <div style={{ width: `${calculations.shares.plastic}%` }} className="bg-indigo-500 h-full rounded-l-full" title={`Пластик ${calculations.shares.plastic}%`} />
                  <div style={{ width: `${calculations.shares.hardware}%` }} className="bg-amber-500 h-full" title={`Електроніка ${calculations.shares.hardware}%`} />
                  <div style={{ width: `${calculations.shares.labor}%` }} className="bg-emerald-500 h-full" title={`Робота ${calculations.shares.labor}%`} />
                  <div style={{ width: `${calculations.shares.electricity}%` }} className="bg-cyan-500 h-full" title={`Електрика ${calculations.shares.electricity}%`} />
                  <div style={{ width: `${calculations.shares.packagingAndDefect}%` }} className="bg-rose-500 h-full rounded-r-full" title={`Упаковка & Брак ${calculations.shares.packagingAndDefect}%`} />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Пластик: <strong>{calculations.totalPlasticCost.toFixed(0)}₴</strong> ({calculations.shares.plastic}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>BOM Деталі: <strong>{calculations.totalHardwareCost.toFixed(0)}₴</strong> ({calculations.shares.hardware}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Робота: <strong>{calculations.totalLaborCost.toFixed(0)}₴</strong> ({calculations.shares.labor}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Брак & Бокс: <strong>{(calculations.defectReserveAmount + Number(packagingCost)).toFixed(0)}₴</strong></span>
                  </div>
                </div>
              </div>

              {/* Profit Margin Slider */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Бажана Націнка (Маржа):</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                    +{targetMargin}%
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>20% (Мінімум)</span>
                  <span>100% (Стандарт)</span>
                  <span>300% (Преміум)</span>
                </div>
              </div>

              {/* Final Selling Price & Net Profit */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-300 font-semibold block uppercase">Рекомендована Ціна Продажу</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {calculations.suggestedPrice.toFixed(0)} ₴
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Чистий прибуток</span>
                    <span className="text-lg font-extrabold text-emerald-300">
                      +{calculations.netProfit.toFixed(0)} ₴
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Прибуток на 1 годину робіт:</span>
                  <strong className="text-amber-400 font-bold">{calculations.profitPerLaborHour.toFixed(0)} ₴/год</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  Запустити у Виробництво (Списати деталь)
                </button>

                <button
                  onClick={handleSaveModel}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  Зберегти Рецепт Лампи в Каталог
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HARDWARE & COMPONENTS INVENTORY (SKLAD) */}
      {/* ========================================================================= */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Пошук деталі..."
                  value={componentSearch}
                  onChange={(e) => setComponentSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={componentCategoryFilter}
                onChange={(e) => setComponentCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'Усі Категорії' : cat}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingComp(null);
                setCompForm({ name: '', category: 'Світлодіоди/LED', supplier: '', unit: 'шт', purchase_price: '', stock_qty: '', min_stock_alert: 5, notes: '' });
                setShowCompModal(true);
              }}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              Додати Нову Деталь
            </button>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComponents.map(comp => {
              const isLowStock = Number(comp.stock_qty) <= Number(comp.min_stock_alert);
              return (
                <div 
                  key={comp.id}
                  className={`p-5 rounded-2xl bg-slate-900/80 border transition-all hover:border-slate-700 relative flex flex-col justify-between ${
                    isLowStock ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
                  }`}
                >
                  {isLowStock && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      Закінчується!
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block mb-2">
                      {comp.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mb-1">{comp.name}</h4>
                    <p className="text-xs text-slate-400 mb-4">Постачальник: {comp.supplier || 'Не вказано'}</p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs mb-4">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Ціна закупівлі:</span>
                        <strong className="text-emerald-400 font-extrabold">{comp.purchase_price} ₴ / {comp.unit}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Залишок на складі:</span>
                        <strong className={`font-extrabold ${isLowStock ? 'text-rose-400' : 'text-slate-200'}`}>
                          {comp.stock_qty} {comp.unit}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-500 text-[11px]">Мін. поріг: {comp.min_stock_alert} {comp.unit}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingComp(comp);
                          setCompForm({
                            name: comp.name,
                            category: comp.category || 'Світлодіоди/LED',
                            supplier: comp.supplier || '',
                            unit: comp.unit || 'шт',
                            purchase_price: comp.purchase_price,
                            stock_qty: comp.stock_qty,
                            min_stock_alert: comp.min_stock_alert || 5,
                            notes: comp.notes || ''
                          });
                          setShowCompModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(comp.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED LAMP CATALOG & RECIPES */}
      {/* ========================================================================= */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-100">Збережені Моделі & Специфікації</h3>
            <span className="text-xs text-slate-400">Всього моделей: {lampModels.length}</span>
          </div>

          {lampModels.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <Box className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-300">Немає збережених рецептів ламп</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Створіть та збережіть нову модель лампи в Конструкторі, щоб швидко розраховувати її та запускати у виробництво!
              </p>
              <button
                onClick={() => setActiveTab('calculator')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
              >
                Перейти в Конструктор
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lampModels.map(model => (
                <div key={model.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{model.name}</h4>
                      <span className="text-xs text-slate-400">Цільова маржа: +{model.target_margin}%</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                      {model.sale_price ? `${Number(model.sale_price).toFixed(0)} ₴` : 'Ціну розраховано'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setLampName(model.name);
                        setTargetMargin(model.target_margin || 100);
                        setSelectedModelId(model.id);
                        setActiveTab('calculator');
                        showToast(`Завантажено модель "${model.name}" в конструктор!`);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-all"
                    >
                      Завантажити в Конструктор
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROFITABILITY ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Аналітика Маржинальності Виробництва
            </h3>
            <p className="text-xs text-slate-400">
              Поточна лампа ("{lampName}") має собівартість <strong>{calculations.primeCost.toFixed(0)}₴</strong> та генерує 
              чистий прибуток <strong>+{calculations.netProfit.toFixed(0)}₴</strong> при націнці {targetMargin}%.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Прибуток з 1 лампи</span>
                <span className="text-xl font-black text-emerald-400">+{calculations.netProfit.toFixed(0)} ₴</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Прибуток за 1 год роботи</span>
                <span className="text-xl font-black text-amber-400">{calculations.profitPerLaborHour.toFixed(0)} ₴/год</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Загальний час виготовлення</span>
                <span className="text-xl font-black text-indigo-400">{(calculations.totalPrintHours + calculations.totalLaborHours).toFixed(1)} год</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Рентабельність (ROI)</span>
                <span className="text-xl font-black text-teal-400">+{targetMargin}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT HARDWARE COMPONENT */}
      {/* ========================================================================= */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                {editingComp ? 'Редагувати Деталь' : 'Додати Деталь у Склад'}
              </h3>
              <button 
                onClick={() => setShowCompModal(false)}
                className="text-slate-500 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Назва деталі *</label>
                <input
                  type="text"
                  required
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  placeholder="напр. Діммер сенсорний 12V"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Категорія</label>
                  <select
                    value={compForm.category}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  >
                    {categoriesList.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Од. виміру</label>
                  <input
                    type="text"
                    value={compForm.unit}
                    onChange={(e) => setCompForm({ ...compForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ціна закупівлі (₴) *</label>
                  <input
                    type="number"
                    required
                    value={compForm.purchase_price}
                    onChange={(e) => setCompForm({ ...compForm, purchase_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Залишок в наявності</label>
                  <input
                    type="number"
                    value={compForm.stock_qty}
                    onChange={(e) => setCompForm({ ...compForm, stock_qty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Постачальник</label>
                <input
                  type="text"
                  value={compForm.supplier}
                  onChange={(e) => setCompForm({ ...compForm, supplier: e.target.value })}
                  placeholder="напр. AliExpress, KSE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingComp ? 'Зберегти' : 'Створити'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH PRODUCTION EXECUTION */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Запуск партії у Виробництво
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-500 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Введіть кількість ламп <strong>"{lampName}"</strong> для виготовлення. 
                Система автоматично спише необхідну кількість компонентів та грамів пластику зі складу.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Кількість ламп (шт)</label>
                <input
                  type="number"
                  min="1"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Витрати пластику:</span>
                  <strong className="text-slate-200">{(calculations.totalWeightG * batchCount)} г</strong>
                </div>
                <div className="flex justify-between">
                  <span>Загальна собівартість партії:</span>
                  <strong className="text-amber-400">{(calculations.primeCost * batchCount).toFixed(0)} ₴</strong>
                </div>
                <div className="flex justify-between">
                  <span>Очікувана виручка партії:</span>
                  <strong className="text-emerald-400">{(calculations.suggestedPrice * batchCount).toFixed(0)} ₴</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchProduction}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Підтвердити & Списати зі складу
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
