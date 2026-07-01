"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator as CalcIcon, Trash2, Save, Plus, 
  Zap, Clock, Package, RefreshCw, AlertCircle, 
  TrendingUp, DollarSign, Layers, CheckCircle2,
  ChevronDown, ChevronUp, Search, Filter, Copy, 
  ShieldCheck, Sparkles, Loader2, Share2, Upload, X, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const PRESETS = {
  materials: [
    { name: 'PLA Standard', cost: 650, density: 1.24 },
    { name: 'PLA Premium', cost: 950, density: 1.24 },
    { name: 'PETG', cost: 700, density: 1.27 },
    { name: 'ABS', cost: 600, density: 1.04 },
    { name: 'TPU', cost: 1200, density: 1.21 },
    { name: 'ASA', cost: 1100, density: 1.07 },
  ],
  printers: [
    { name: 'Bambu Lab X1C', wattage: 150, wear: 6 },
    { name: 'Bambu Lab P1S/P1P', wattage: 150, wear: 5 },
    { name: 'Bambu Lab A1', wattage: 90, wear: 4 },
    { name: 'Bambu Lab A1 Mini', wattage: 70, wear: 3 },
    { name: 'Voron 2.4 (350)', wattage: 250, wear: 4 },
    { name: 'Creality K1 Max', wattage: 200, wear: 5 },
  ]
};

const getColorStyle = (colorName) => {
  if (!colorName) return { background: 'var(--border)' };
  
  const name = colorName.trim().toLowerCase();
  
  const colorMap = {
    'чорний': { background: '#111827', border: '1px solid rgba(255,255,255,0.15)' },
    'black': { background: '#111827', border: '1px solid rgba(255,255,255,0.15)' },
    'темно-сірий': { background: '#374151' },
    'dark grey': { background: '#374151' },
    'dark gray': { background: '#374151' },
    'білий': { background: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', color: '#000000' },
    'white': { background: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', color: '#000000' },
    'сірий': { background: '#64748b' },
    'grey': { background: '#64748b' },
    'gray': { background: '#64748b' },
    'світло-сірий': { background: '#cbd5e1' },
    'light grey': { background: '#cbd5e1' },
    'light gray': { background: '#cbd5e1' },
    'червоний': { background: '#ef4444' },
    'red': { background: '#ef4444' },
    'рожевий': { background: '#ec4899' },
    'pink': { background: '#ec4899' },
    'фіолетовий': { background: '#8b5cf6' },
    'purple': { background: '#8b5cf6' },
    'violet': { background: '#8b5cf6' },
    'бузковий': { background: '#a78bfa' },
    'синій': { background: '#2563eb' },
    'blue': { background: '#2563eb' },
    'блакитний': { background: '#06b6d4' },
    'cyan': { background: '#06b6d4' },
    'sky blue': { background: '#38bdf8' },
    'зелений': { background: '#16a34a' },
    'green': { background: '#16a34a' },
    'салатовий': { background: '#84cc16' },
    'lime': { background: '#84cc16' },
    'м\'ятний': { background: '#2dd4bf' },
    'mint': { background: '#2dd4bf' },
    'жовтий': { background: '#eab308' },
    'yellow': { background: '#eab308' },
    'помаранчевий': { background: '#f97316' },
    'orange': { background: '#f97316' },
    'коричневий': { background: '#78350f' },
    'brown': { background: '#78350f' },
    'бежевий': { background: '#f59e0b', opacity: 0.7 },
    'beige': { background: '#f59e0b', opacity: 0.7 },
    'золотий': { background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', boxShadow: '0 0 8px rgba(217,119,6,0.3)' },
    'gold': { background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', boxShadow: '0 0 8px rgba(217,119,6,0.3)' },
    'срібний': { background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)' },
    'silver': { background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)' },
    'бронзовий': { background: 'linear-gradient(135deg, #ca8a04 0%, #78350f 100%)' },
    'bronze': { background: 'linear-gradient(135deg, #ca8a04 0%, #78350f 100%)' },
    'прозорий': { 
      background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%), linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%)',
      backgroundPosition: '0 0, 4px 4px',
      backgroundSize: '8px 8px',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    'clear': { 
      background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%), linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%)',
      backgroundPosition: '0 0, 4px 4px',
      backgroundSize: '8px 8px',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    'transparent': { 
      background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%), linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.15) 75%)',
      backgroundPosition: '0 0, 4px 4px',
      backgroundSize: '8px 8px',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    'різнокольоровий': { background: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)' },
    'rainbow': { background: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)' },
    'multicolor': { background: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)' },
    'мультиколор': { background: 'linear-gradient(45deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)' },
    'переливний': { background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)' }
  };
  
  if (colorMap[name]) return colorMap[name];
  
  for (const key of Object.keys(colorMap)) {
    if (name.includes(key)) return colorMap[key];
  }
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return { background: `hsl(${hue}, 70%, 45%)` };
};

export default function Calculator() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Materials Library filter and multi-select states
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState('All');
  
  const [materialsLibrary, setMaterialsLibrary] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [catalogs, setCatalogs] = useState({ manufacturers: [], types: [], colors: [] });
  const [isMobile, setIsMobile] = useState(false);

  // Dynamic filter helpers derived from materials library
  const availableTypes = useMemo(() => {
    const types = materialsLibrary.map(m => m.type).filter(Boolean);
    return ['All', ...new Set(types)];
  }, [materialsLibrary]);

  const availableColors = useMemo(() => {
    const colors = materialsLibrary.map(m => m.color).filter(Boolean);
    return ['All', ...new Set(colors)];
  }, [materialsLibrary]);

  const getTypeCount = (type) => {
    if (type === 'All') return materialsLibrary.length;
    return materialsLibrary.filter(m => m.type === type).length;
  };

  const filteredMaterials = useMemo(() => {
    return materialsLibrary.filter(m => {
      const query = materialSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        m.name.toLowerCase().includes(query) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(query)) ||
        (m.type && m.type.toLowerCase().includes(query)) ||
        (m.color && m.color.toLowerCase().includes(query));
      
      const matchesType = selectedTypeFilter === 'All' || m.type === selectedTypeFilter;
      const matchesColor = selectedColorFilter === 'All' || m.color === selectedColorFilter;
      
      return matchesSearch && matchesType && matchesColor;
    });
  }, [materialsLibrary, materialSearchQuery, selectedTypeFilter, selectedColorFilter]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: 'Новий розрахунок',
    model_name: '',
    weight_g: 100,
    time_h: 5,
    plastic_cost_roll: 750,
    plastic_type: 'PLA',
    electricity_cost_kwh: 4.32,
    printer_wattage: 350,
    wear_cost_h: 5,
    failure_margin: 10,
    ams_swaps: 0,
    purge_g: 0.5,
    labor_cost: 50,
    additional_costs: 0,
    profit_margin: 50,
    discount: 0
  });

  useEffect(() => {
    fetchCalculations();
    fetchMaterials();
    fetchCatalogs();
  }, []);

  async function fetchCatalogs() {
    try {
      const [m, t, c] = await Promise.all([
        supabase.from('m_manufacturers').select('name').order('name'),
        supabase.from('m_plastic_types').select('name').order('name'),
        supabase.from('m_colors').select('name').order('name')
      ]);
      setCatalogs({
        manufacturers: m.data?.map(i => i.name) || [],
        types: t.data?.map(i => i.name) || [],
        colors: c.data?.map(i => i.name) || []
      });
    } catch (err) { console.error('Error fetching catalogs:', err); }
  }

  async function addToCatalog(table, name) {
    if (!name) return;
    const key = table.replace('m_', '');
    if (catalogs[key]?.includes(name)) return;
    
    try {
      const { error } = await supabase.from(table).insert([{ name }]);
      if (error) throw error;
      await fetchCatalogs();
      showToast(`${name} додано до списку!`);
    } catch (err) { 
      console.error('Error adding to catalog:', err);
      showToast('Помилка: Спершу виконайте SQL запит у Supabase!', 'error');
    }
  }


  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    const autoName = `${newMaterial.type} ${newMaterial.color} (${newMaterial.cost_per_kg} грн)`.replace(/\s+/g, ' ').trim();
    setNewMaterial(prev => ({ ...prev, name: autoName }));
  }, [newMaterial.type, newMaterial.color, newMaterial.cost_per_kg]);

  async function fetchMaterials() {
    try {
      const { data, error } = await supabase.from('material_library').select('*').order('name');
      if (data) setMaterialsLibrary(data);
    } catch (e) {
      console.error('Error fetching materials:', e);
    }
  }

  async function fetchCalculations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setCalculations(data);
    } catch (e) {
      console.error('Error fetching calculations:', e);
    } finally {
      setLoading(false);
    }
  }

  const results = useMemo(() => {
    const weight = Number(formData.weight_g || 0);
    const swaps = Number(formData.ams_swaps || 0);
    const purge = Number(formData.purge_g || 0);
    const time = Number(formData.time_h || 0);
    const pCost = Number(formData.plastic_cost_roll || 0);
    const wattage = Number(formData.printer_wattage || 0);
    const elecTariff = Number(formData.electricity_cost_kwh || 0);
    const failMargin = Number(formData.failure_margin || 0);
    const laborTotal = Number(formData.labor_cost || 0);
    const extraCosts = Number(formData.additional_costs || 0);
    const profit = Number(formData.profit_margin || 0);
    const discount = Number(formData.discount || 0);

    const wearH = Number(formData.wear_cost_h || 0);

    // 1. Plastic cost
    const totalWeight = weight + (swaps * purge);
    const plasticCost = (totalWeight / 1000) * pCost;
    
    // 2. Electricity cost
    const kwh = (time * wattage) / 1000;
    const electricityCost = kwh * elecTariff;
    
    // 3. Wear cost
    const wearCost = time * wearH;
    
    // 5. Failure/Risk cost (based on plastic+elec+wear)
    const baseHardwareCost = plasticCost + electricityCost + wearCost;
    const failureCost = baseHardwareCost * (failMargin / 100);
    
    // 6. Total Prime Cost (Hardware + Risks + Labor + Extras)
    const prime = baseHardwareCost + failureCost + laborTotal + extraCosts;
    
    // 7. Pricing
    const suggested = prime * (1 + profit / 100);
    const discountAmount = suggested * (discount / 100);
    const finalPrice = suggested - discountAmount;

    return {
      plastic: plasticCost.toFixed(0),
      electricity: electricityCost.toFixed(0),
      wear: wearCost.toFixed(0),
      failure: failureCost.toFixed(0),
      prime: prime.toFixed(0),
      labor: laborTotal.toFixed(0),
      extras: extraCosts.toFixed(0),
      suggested: suggested.toFixed(0),
      final: finalPrice.toFixed(0),
      totalWeight: totalWeight.toFixed(0)
    };
  }, [formData]);

  async function handleSave() {
    setSaving(true);
    try {
      const isEdit = !!formData.id;
      const dataToSave = {
        name: formData.name,
        model_name: formData.model_name,
        weight_g: Number(formData.weight_g) || 0,
        time_h: Number(formData.time_h) || 0,
        plastic_cost_roll: Number(formData.plastic_cost_roll) || 0,
        plastic_type: formData.plastic_type,
        electricity_cost_kwh: Number(formData.electricity_cost_kwh) || 0,
        printer_wattage: Number(formData.printer_wattage) || 0,
        wear_cost_h: Number(formData.wear_cost_h) || 0,
        failure_margin: Number(formData.failure_margin) || 0,
        ams_swaps: parseInt(formData.ams_swaps) || 0,
        purge_g: Number(formData.purge_g) || 0,
        labor_cost_h: Number(formData.labor_cost) || 0,
        profit_margin: Number(formData.profit_margin) || 0,
        additional_costs: Number(formData.additional_costs) || 0,
        discount: Number(formData.discount) || 0,
        image_url: formData.image_url || '',
        total_prime_cost: parseInt(results.prime) || 0,
        suggested_price: parseInt(results.final) || 0
      };

      if (formData.id) {
        dataToSave.id = formData.id;
      }

      const { data, error } = await supabase
        .from('calculations')
        .upsert(dataToSave)
        .select();

      if (error) throw error;
      
      if (isEdit) {
        setCalculations(calculations.map(c => c.id === formData.id ? data[0] : c));
      } else {
        setCalculations([data[0], ...calculations]);
      }
      
      showToast(isEdit ? 'Розрахунок оновлено!' : 'Розрахунок збережено!');
    } catch (e) {
      showToast('Помилка збереження: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const resetForm = () => {
    setFormData({
      name: 'Новий розрахунок',
      model_name: '',
      weight_g: 100,
      time_h: 5,
      plastic_cost_roll: 750,
      plastic_type: 'PLA',
      electricity_cost_kwh: 4.32,
      printer_wattage: 350,
      wear_cost_h: 5,
      failure_margin: 10,
      ams_swaps: 0,
      purge_g: 0.5,
      labor_cost: 50,
      additional_costs: 0,
      profit_margin: 50,
      discount: 0,
      image_url: ''
    });
    setSelectedMaterialIds([]);
  };

  async function handleDelete(id) {
    try {
      const { error } = await supabase.from('calculations').delete().eq('id', id);
      if (error) throw error;
      setCalculations(calculations.filter(c => c.id !== id));
    } catch (e) {
      showToast('Помилка видалення: ' + e.message, 'error');
    }
  }

  const handleShare = (calc) => {
    const url = `${window.location.origin}/quote/${calc.id}`;
    navigator.clipboard.writeText(url);
    showToast('Посилання для клієнта скопійовано!');
  };

  const applyMaterialPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      plastic_type: preset.name,
      plastic_cost_roll: preset.cost
    }));
  };

  const applyPrinterPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      printer_wattage: preset.wattage,
      wear_cost_h: preset.wear
    }));
  };

  async function handleSaveToLibrary() {
    try {
      if (editingMaterialId) {
        const { data, error } = await supabase.from('material_library').update(newMaterial).eq('id', editingMaterialId).select();
        if (error) throw error;
        setMaterialsLibrary(materialsLibrary.map(m => m.id === editingMaterialId ? data[0] : m));
        setEditingMaterialId(null);
      } else {
        const { data, error } = await supabase.from('material_library').insert([newMaterial]).select();
        if (error) throw error;
        setMaterialsLibrary([data[0], ...materialsLibrary]);
      }
      setShowMaterialForm(false);
      setNewMaterial({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 });
    } catch (e) {
      console.error('Save error:', e);
      throw e;
    }
  }

  async function handleDeleteMaterial(id, e) {
    e.stopPropagation();
    if (!confirm('Видалити цей матеріал?')) return;
    try {
      const { error } = await supabase.from('material_library').delete().eq('id', id);
      if (error) throw error;
      setMaterialsLibrary(materialsLibrary.filter(m => m.id !== id));
      showToast('Матеріал видалено');
    } catch (e) {
      showToast('Помилка видалення: ' + e.message, 'error');
    }
  }

  const startEditMaterial = (m, e) => {
    e.stopPropagation();
    setNewMaterial(m);
    setEditingMaterialId(m.id);
    setShowMaterialForm(true);
  };

  const selectFromLibrary = (m) => {
    setSelectedMaterialIds(prev => {
      let next;
      if (prev.includes(m.id)) {
        next = prev.filter(id => id !== m.id);
      } else {
        next = [...prev, m.id];
      }
      
      if (next.length === 0) {
        // If nothing is selected, we keep current form data but clear selection
      } else {
        const selectedMaterials = materialsLibrary.filter(mat => next.includes(mat.id));
        if (selectedMaterials.length > 0) {
          const totalCost = selectedMaterials.reduce((acc, curr) => acc + Number(curr.cost_per_kg), 0);
          const avgCost = Math.round(totalCost / selectedMaterials.length);
          
          const types = [...new Set(selectedMaterials.map(mat => mat.type || ''))].filter(Boolean);
          const colors = selectedMaterials.map(mat => mat.color || '').filter(Boolean);
          
          let combinedType = '';
          if (types.length === 1) {
            const type = types[0];
            if (colors.length > 0) {
              combinedType = `${type} (${colors.join(' + ')})`;
            } else {
              combinedType = type;
            }
          } else if (types.length > 1) {
            combinedType = selectedMaterials.map(mat => `${mat.type || ''} ${mat.color || ''}`.trim()).join(' + ');
          } else {
            combinedType = colors.join(' + ') || 'Змішаний';
          }
          
          setFormData(f => ({
            ...f,
            plastic_type: combinedType,
            plastic_cost_roll: avgCost
          }));
        }
      }
      return next;
    });
  };

  const startEditCalculation = (calc) => {
    setFormData({
      ...calc,
      labor_cost: calc.labor_cost_h || 0,
      additional_costs: calc.additional_costs || 0,
      discount: calc.discount || 0,
      image_url: calc.image_url || ''
    });
    setSelectedMaterialIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCalculations = calculations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.model_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', width: '100%' }}>
      {/* LEFT: CALCULATION FORM */}
      <div style={{ flex: '1 1 600px', minWidth: 0 }}>
        <div style={{ 
          background: 'var(--bg-card)', borderRadius: 32, border: '1px solid var(--border)',
          padding: 32, backdropFilter: 'blur(10px)', boxSizing: 'border-box', width: '100%'
        }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 16, background: 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed'
              }}>
                <CalcIcon size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-main)', margin: 0 }}>Smart Calc 3.0</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Точний розрахунок собівартості</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
              <button 
                onClick={resetForm}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  padding: '12px 20px', borderRadius: 14, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Plus size={18} /> НОВИЙ
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  padding: '12px 24px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'var(--text-main)',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 16px rgba(124,58,237,0.2)', opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {formData.id ? 'ОНОВИТИ' : 'ЗБЕРЕГТИ'}
              </button>
            </div>
          </div>

          {/* Image Upload Section */}
          <div style={{ marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Фото виробу</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {formData.image_url ? (
                <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => setFormData({...formData, image_url: ''})}
                    style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label style={{ 
                  width: 120, height: 120, borderRadius: 16, border: '2px dashed var(--border)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', gap: 8, color: 'var(--text-muted)', transition: 'all 0.2s'
                }}>
                  <Upload size={24} />
                  <span style={{ fontSize: 10, fontWeight: 800 }}>ДОДАТИ ФОТО</span>
                  <input type="file" hidden accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `calc-${Math.random()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
                      if (uploadError) throw uploadError;
                      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                      setFormData({...formData, image_url: publicUrl});
                      showToast('Фото завантажено!');
                    } catch (err) {
                      showToast('Помилка завантаження: ' + err.message, 'error');
                    }
                  }} />
                </label>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Це фото буде бачити клієнт на сторінці пропозиції та в замовленні. Використовуйте якісне фото готового виробу або 3D-моделі.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {/* Model Info */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Назва розрахунку</label>
                <input 
                  type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Назва моделі</label>
                <input 
                  type="text" value={formData.model_name} onChange={e => setFormData({...formData, model_name: e.target.value})}
                  placeholder="напр. Dragon_Articulated_v2"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            </div>

            {/* Core Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Вага моделі (г)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" value={formData.weight_g} onChange={e => setFormData({...formData, weight_g: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                />
                <Package size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Час друку (год)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" value={formData.time_h} onChange={e => setFormData({...formData, time_h: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                />
                <Clock size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Material Presets */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 950, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> Бібліотека матеріалів
                </label>
                <button 
                  onClick={() => setShowMaterialForm(!showMaterialForm)}
                  style={{ 
                    background: showMaterialForm ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)', 
                    color: showMaterialForm ? '#ef4444' : '#a78bfa', 
                    border: showMaterialForm ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(124,58,237,0.2)', 
                    padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                  }}
                >
                  <Plus size={14} style={{ transform: showMaterialForm ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                  {showMaterialForm ? 'Сховати форму' : 'Додати новий'}
                </button>
              </div>

              {showMaterialForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 16, border: '1px solid #7c3aed40', marginBottom: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}
                >
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Назва (автоматично)</label>
                    <input disabled value={newMaterial.name} style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-muted)', fontSize: 12 }} />
                  </div>
                  <ModernSelect 
                    label="Тип пластику"
                    value={newMaterial.type}
                    options={catalogs.types}
                    onChange={(val) => setNewMaterial({...newMaterial, type: val})}
                    onAdd={(val) => addToCatalog('m_plastic_types', val)}
                  />
                  <ModernSelect 
                    label="Виробник"
                    value={newMaterial.manufacturer}
                    options={catalogs.manufacturers}
                    onChange={(val) => setNewMaterial({...newMaterial, manufacturer: val})}
                    onAdd={(val) => addToCatalog('m_manufacturers', val)}
                  />
                  <ModernSelect 
                    label="Колір"
                    value={newMaterial.color}
                    options={catalogs.colors}
                    onChange={(val) => setNewMaterial({...newMaterial, color: val})}
                    onAdd={(val) => addToCatalog('m_colors', val)}
                  />
                  <div>
                    <label style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Ціна грн/кг</label>
                    <input type="number" value={newMaterial.cost_per_kg} onChange={e => setNewMaterial({...newMaterial, cost_per_kg: e.target.value})} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-main)', fontSize: 12 }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    <button 
                      onClick={async () => {
                        try {
                          await handleSaveToLibrary();
                          showToast(editingMaterialId ? 'Матеріал оновлено!' : 'Матеріал збережено в бібліотеку!');
                        } catch (err) {
                          showToast('Помилка збереження!', 'error');
                        }
                      }} 
                      style={{ 
                        padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                        border: 'none', borderRadius: 100, color: '#fff', fontWeight: 900, fontSize: 12, 
                        cursor: 'pointer', boxShadow: '0 10px 20px rgba(124,58,237,0.2)',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}
                    >
                      {editingMaterialId ? 'Оновити в бібліотеці' : 'Зберегти в бібліотеку'}
                    </button>
                    {editingMaterialId && (
                      <button 
                        onClick={() => { setEditingMaterialId(null); setShowMaterialForm(false); setNewMaterial({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 }); }} 
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: 8, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                      >
                        СКАСУВАТИ РЕДАГУВАННЯ
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Search and Filters Panel */}
              <div style={{ 
                background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', 
                padding: 16, borderRadius: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 
              }}>
                {/* Text Search */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Шукати матеріал за назвою, виробником, типом..." 
                    value={materialSearchQuery} 
                    onChange={e => setMaterialSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', 
                      borderRadius: 12, padding: '10px 14px 10px 38px', color: 'var(--text-main)', 
                      fontSize: 12, outline: 'none', boxSizing: 'border-box' 
                    }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  {materialSearchQuery && (
                    <button 
                      onClick={() => setMaterialSearchQuery('')}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Type Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Тип пластику</span>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                    {availableTypes.map(type => {
                      const count = getTypeCount(type);
                      const isSelected = selectedTypeFilter === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedTypeFilter(type)}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '6px 12px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 800,
                            border: isSelected ? '1px solid #7c3aed' : '1px solid var(--border)',
                            background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(0,0,0,0.1)',
                            color: isSelected ? '#a78bfa' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {type === 'All' ? 'Всі типи' : type} <span style={{ opacity: 0.5, fontSize: 9, marginLeft: 2 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Колір пластику</span>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }} className="hide-scrollbar">
                    {availableColors.map(color => {
                      const isSelected = selectedColorFilter === color;
                      const isAll = color === 'All';
                      const colorStyle = getColorStyle(isAll ? '' : color);
                      
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColorFilter(color)}
                          title={isAll ? 'Всі кольори' : color}
                          style={{
                            position: 'relative',
                            flexShrink: 0,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'all 0.2s',
                            ...colorStyle,
                            border: isSelected 
                              ? '2px solid #8b5cf6' 
                              : (colorStyle.border || '1px solid rgba(255,255,255,0.1)'),
                            transform: isSelected ? 'scale(1.15)' : 'none',
                            boxShadow: isSelected 
                              ? '0 0 10px rgba(124,58,237,0.5)' 
                              : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isAll && (
                            <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Всі</span>
                          )}
                          {isSelected && !isAll && (
                            <CheckCircle2 size={12} style={{ color: colorStyle.color || '#fff', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Multi-select Summary Banner */}
              {selectedMaterialIds.length > 0 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))',
                  border: '1px solid rgba(124,58,237,0.25)',
                  padding: 16, borderRadius: 20, marginBottom: 16,
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> Вибрано {selectedMaterialIds.length} {selectedMaterialIds.length === 1 ? 'матеріал' : selectedMaterialIds.length < 5 ? 'матеріали' : 'матеріалів'}
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedMaterialIds([]);
                        setFormData(f => ({ ...f, plastic_type: 'PLA', plastic_cost_roll: 750 }));
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Скинути вибір
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {materialsLibrary.filter(mat => selectedMaterialIds.includes(mat.id)).map(mat => (
                      <div 
                        key={mat.id} 
                        style={{ 
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                          padding: '6px 12px', borderRadius: 10, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 
                        }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: '50%', ...getColorStyle(mat.color) }} />
                        <span style={{ fontWeight: 700, color: '#fff' }}>{mat.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({mat.cost_per_kg} ₴)</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); selectFromLibrary(mat); }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Розрахункова ціна (середня): </span>
                      <strong style={{ color: '#4ade80', fontSize: 13 }}>{formData.plastic_cost_roll} ₴/кг</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Тип для калькулятора: </span>
                      <strong style={{ color: '#a78bfa' }}>{formData.plastic_type}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of Materials */}
              {materialsLibrary.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(170px, 1fr))', 
                  gap: 12, 
                  marginBottom: 16 
                }}>
                  {filteredMaterials.map(m => {
                    const isSelected = selectedMaterialIds.includes(m.id);
                    const colorStyle = getColorStyle(m.color);
                    
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => selectFromLibrary(m)}
                        style={{ 
                          position: 'relative',
                          padding: '16px 14px', 
                          borderRadius: 20, 
                          border: isSelected ? '1px solid #7c3aed' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.02)',
                          boxShadow: isSelected ? '0 0 15px rgba(124,58,237,0.15)' : 'none',
                          cursor: 'pointer', 
                          textAlign: 'left', 
                          transition: 'all 0.2s ease-in-out',
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 12,
                          overflow: 'hidden'
                        }}
                      >
                        {/* Color swatch & Selection indicator */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div 
                            style={{ 
                              width: 22, 
                              height: 22, 
                              borderRadius: '50%', 
                              ...colorStyle,
                              border: colorStyle.border || '1px solid rgba(255,255,255,0.15)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              visibility: selectedColorFilter === 'All' ? 'visible' : 'hidden'
                            }}
                            title={`Колір: ${m.color || 'Не вказано'}`}
                          />
                          <div 
                            style={{ 
                              width: 18, 
                              height: 18, 
                              borderRadius: 6, 
                              border: isSelected ? 'none' : '2px solid var(--border)',
                              background: isSelected ? '#7c3aed' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isSelected && <CheckCircle2 size={12} style={{ color: '#fff' }} />}
                          </div>
                        </div>

                        {/* Core Metadata */}
                        <div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ 
                              fontSize: 9, 
                              fontWeight: 900, 
                              background: 'rgba(124,58,237,0.15)', 
                              color: '#c084fc', 
                              padding: '2px 6px', 
                              borderRadius: 6,
                              textTransform: 'uppercase'
                            }}>
                              {m.type || 'PLA'}
                            </span>
                            {m.manufacturer && (
                              <span style={{ 
                                fontSize: 9, 
                                fontWeight: 800, 
                                background: 'rgba(255,255,255,0.05)', 
                                color: 'var(--text-muted)', 
                                padding: '2px 6px', 
                                borderRadius: 6 
                              }}>
                                {m.manufacturer}
                              </span>
                            )}
                          </div>

                          <div style={{ 
                            fontWeight: 800, 
                            fontSize: 12, 
                            color: '#fff', 
                            lineHeight: 1.3,
                            marginBottom: 4,
                            wordBreak: 'break-word'
                          }}>
                            {m.name}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: 4,
                          borderTop: '1px solid rgba(255,255,255,0.03)',
                          paddingTop: 8
                        }}>
                          <span style={{ fontWeight: 900, fontSize: 13, color: '#4ade80' }}>
                            {m.cost_per_kg} ₴<span style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)' }}>/кг</span>
                          </span>
                          
                          <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={(e) => startEditMaterial(m, e)} 
                              title="Редагувати матеріал"
                              style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: 'none', 
                                padding: 6, 
                                borderRadius: 8, 
                                color: 'var(--text-muted)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center'
                              }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteMaterial(m.id, e)} 
                              title="Видалити матеріал"
                              style={{ 
                                background: 'rgba(239,68,68,0.05)', 
                                border: 'none', 
                                padding: 6, 
                                borderRadius: 8, 
                                color: 'rgba(239,68,68,0.7)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredMaterials.length === 0 && (
                    <div style={{ 
                      gridColumn: '1 / -1', 
                      textAlign: 'center', 
                      padding: '40px 20px', 
                      color: 'var(--text-muted)', 
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px dashed var(--border)',
                      borderRadius: 20
                    }}>
                      Матеріалів не знайдено за поточними фільтрами
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: 20, textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ваша бібліотека порожня. Використовуйте стандартні пресети:</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {PRESETS.materials.map(m => (
                      <button 
                        key={m.name} 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            plastic_type: m.name,
                            plastic_cost_roll: m.cost
                          }));
                        }}
                        style={{ 
                          padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                          background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 11, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        {m.name} ({m.cost} ₴)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Тип пластику</label>
                  <input 
                    type="text" value={formData.plastic_type} onChange={e => setFormData({...formData, plastic_type: e.target.value})}
                    placeholder="напр. PLA"
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ціна за кг</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" value={formData.plastic_cost_roll} onChange={e => setFormData({...formData, plastic_cost_roll: e.target.value})}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, color: 'var(--text-main)', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>₴/кг</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Printer Presets */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 12, gap: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Обладнання та енергія</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRESETS.printers.map(p => (
                    <button 
                      key={p.name} onClick={() => applyPrinterPreset(p)}
                      style={{ 
                        fontSize: 9, padding: '4px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)',
                        color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Потужність (Вт)</span>
                  <input 
                    type="number" value={formData.printer_wattage} onChange={e => setFormData({...formData, printer_wattage: e.target.value})}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Знос (₴/год)</span>
                  <input 
                    type="number" value={formData.wear_cost_h} onChange={e => setFormData({...formData, wear_cost_h: e.target.value})}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Тариф (₴/кВт)</span>
                  <input 
                    type="number" value={formData.electricity_cost_kwh} onChange={e => setFormData({...formData, electricity_cost_kwh: e.target.value})}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* AMS Section */}
            <div style={{ background: 'rgba(236,72,153,0.05)', borderRadius: 20, padding: 20, border: '1px solid rgba(236,72,153,0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', marginBottom: 16 }}>
                <Layers size={14} /> AMS / Multi-color
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#6b6b8a' }}>Замін кольору</span>
                  <input 
                    type="number" value={formData.ams_swaps} onChange={e => setFormData({...formData, ams_swaps: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#6b6b8a' }}>Purge (г/заміна)</span>
                  <input 
                    type="number" step="0.1" value={formData.purge_g} onChange={e => setFormData({...formData, purge_g: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Margin Section */}
            <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: 20, padding: 20, border: '1px solid rgba(34,197,94,0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', marginBottom: 16 }}>
                <TrendingUp size={14} /> Рентабельність
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#6b6b8a' }}>Брак (%)</span>
                  <input 
                    type="number" value={formData.failure_margin} onChange={e => setFormData({...formData, failure_margin: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#6b6b8a' }}>Прибуток (%)</span>
                  <input 
                    type="number" value={formData.profit_margin} onChange={e => setFormData({...formData, profit_margin: e.target.value})}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Labor, Extras & Discount Section */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(59,130,246,0.05)', borderRadius: 24, padding: 24, border: '1px solid rgba(59,130,246,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Вартість роботи (грн)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" value={formData.labor_cost} onChange={e => setFormData({...formData, labor_cost: e.target.value})}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-main)', outline: 'none', fontSize: 13, fontWeight: 800 }}
                    />
                    <DollarSign size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(59,130,246,0.5)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Дод. витрати (пакет, брілок)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" value={formData.additional_costs} onChange={e => setFormData({...formData, additional_costs: e.target.value})}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-main)', outline: 'none', fontSize: 13, fontWeight: 800 }}
                    />
                    <Plus size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(59,130,246,0.5)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#ec4899', textTransform: 'uppercase' }}>Знижка (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                      style={{ 
                        width: '100%', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', 
                        borderRadius: 12, padding: '12px 14px', color: '#ec4899', outline: 'none', 
                        fontSize: 13, fontWeight: 900, textAlign: 'center'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 950 }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: RESULTS & SAVED */}
      <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Results Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 32, padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
          boxSizing: 'border-box', width: '100%'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: '#f59e0b' }} /> Результат
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Пластик {formData.ams_swaps > 0 && `(+AMS)`}</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{results.plastic} ₴</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Електроенергія</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{results.electricity} ₴</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Амортизація</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{results.wear} ₴</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Ризики (брак)</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>+ {results.failure} ₴</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Дод. витрати</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>+ {results.extras} ₴</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Робота</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>+ {results.labor} ₴</span>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 14, letterSpacing: '0.05em' }}>СОБІВАРТІСТЬ</span>
              </div>
              <span style={{ color: '#22c55e', fontSize: 24, fontWeight: 950 }}>{results.prime} ₴</span>
            </div>


            <div style={{ marginTop: 20, padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8 }}>Рекомендована ціна</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 950, color: 'var(--text-main)', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{results.suggested}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>₴</span>
              </div>
              <p style={{ fontSize: 11, color: '#6b6b8a', margin: '12px 0 0 0', lineHeight: 1.5 }}>
                Враховуючи роботу та {formData.profit_margin}% маржі.
              </p>
            </div>
            
            <button 
              onClick={() => {
                const text = `Собівартість: ${results.prime} ₴\nПластик: ${results.plastic} ₴ (${results.totalWeight}г)\nЧас: ${formData.time_h} год\nРекомендована ціна: ${results.suggested} ₴`;
                navigator.clipboard.writeText(text);
                showToast('Скопійовано для Admin Notes!');
              }}
              style={{ 
                width: '100%', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'var(--text-main)', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s'
              }}
            >
              <Copy size={16} /> КОПІЮВАТИ В НОТАТКИ
            </button>
          </div>
        </div>

        {/* Saved List */}
        <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 32, padding: 24, border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>Збережені ({calculations.length})</h4>
            <button 
              onClick={fetchCalculations}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: 8, borderRadius: 10, color: '#fff', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
            <input 
              type="text" placeholder="Пошук розрахунків..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px 10px 36px', color: 'var(--text-main)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }} className="hide-scrollbar">
            <AnimatePresence>
              {filteredCalculations.map((calc) => (
                <motion.div 
                  key={calc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{calc.name}</div>
                    <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4 }}>{calc.plastic_type} • {calc.weight_g}г • {calc.time_h}г</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 950, color: '#22c55e' }}>{calc.suggested_price} ₴</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ціна</div>
                    </div>
                    <button 
                      onClick={() => handleShare(calc)}
                      style={{ background: 'rgba(124,58,237,0.1)', border: 'none', padding: 8, borderRadius: 10, color: '#7c3aed', cursor: 'pointer' }}
                      title="Поділитися з клієнтом"
                    >
                      <Share2 size={14} />
                    </button>
                    <button 
                      onClick={() => startEditCalculation(calc)}
                      style={{ background: 'rgba(59,130,246,0.1)', border: 'none', padding: 8, borderRadius: 10, color: '#3b82f6', cursor: 'pointer' }}
                    >
                      <CalcIcon size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(calc.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: 8, borderRadius: 10, color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredCalculations.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12 }}>
                Нічого не знайдено
              </div>
            )}
            {loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#7c3aed' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed', bottom: 40, left: '50%',
              padding: '16px 24px', borderRadius: 20,
              background: notification.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(124,58,237,0.9)',
              color: '#fff', fontWeight: 800, fontSize: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CUSTOM MODERN SELECT COMPONENT (MOVED OUTSIDE TO PREVENT RE-RENDER LOOPS)
const ModernSelect = ({ label, value, options, onChange, onAdd, placeholder = "Виберіть..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newValue, setNewValue] = useState('');
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsAddMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      <label style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', 
          color: value ? 'var(--text-main)' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s',
          border: isOpen ? '1px solid #7c3aed' : '1px solid var(--border)'
        }}
      >
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || placeholder}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0 }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, 
              background: '#1e293b', border: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: 16, 
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 101, overflow: 'hidden', padding: 6
            }}
          >
            {!isAddMode ? (
              <>
                <div style={{ maxHeight: 200, overflowY: 'auto' }} className="hide-scrollbar">
                  {options.map(opt => (
                    <div 
                      key={opt}
                      onClick={(e) => { e.stopPropagation(); onChange(opt); setIsOpen(false); }}
                      style={{ 
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#e6edf3',
                        background: value === opt ? 'rgba(124,58,237,0.2)' : 'transparent',
                        fontWeight: value === opt ? 800 : 500, transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = value === opt ? 'rgba(124,58,237,0.2)' : 'transparent'}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); setIsAddMode(true); }}
                  style={{ 
                    padding: '12px', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#7c3aed', fontSize: 12, fontWeight: 900, cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  + ДОДАТИ НОВИЙ
                </div>
              </>
            ) : (
              <div style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
                <input 
                  autoFocus
                  placeholder={`Назва ${label.toLowerCase()}...`}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #7c3aed40', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => { if(newValue) { onAdd(newValue); onChange(newValue); } setIsAddMode(false); setNewValue(''); setIsOpen(false); }}
                    style={{ flex: 1, height: 40, borderRadius: 10, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 900, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                    onMouseEnter={(e) => e.target.style.background = '#6d28d9'}
                    onMouseLeave={(e) => e.target.style.background = '#7c3aed'}
                  >
                    Зберегти
                  </button>
                  <button 
                    onClick={() => { setIsAddMode(false); setNewValue(''); }}
                    style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#94a3b8'; }}
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
