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
    { id: 'bambu-x1c', name: 'Bambu Lab X1C', wattage: 150, wear: 6 },
    { id: 'bambu-p1s', name: 'Bambu Lab P1S/P1P', wattage: 150, wear: 5 },
    { id: 'bambu-a1', name: 'Bambu Lab A1', wattage: 90, wear: 4 },
    { id: 'bambu-a1mini', name: 'Bambu Lab A1 Mini', wattage: 70, wear: 3 },
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
    'червоний': { background: 'var(--color-danger)' },
    'red': { background: 'var(--color-danger)' },
    'рожевий': { background: 'var(--color-accent-2)' },
    'pink': { background: 'var(--color-accent-2)' },
    'фіолетовий': { background: 'var(--color-accent)' },
    'purple': { background: 'var(--color-accent)' },
    'violet': { background: 'var(--color-accent)' },
    'бузковий': { background: 'var(--color-accent)' },
    'синій': { background: '#2563eb' },
    'blue': { background: '#2563eb' },
    'блакитний': { background: '#06b6d4' },
    'cyan': { background: '#06b6d4' },
    'sky blue': { background: '#38bdf8' },
    'зелений': { background: '#16a34a' },
    'green': { background: '#16a34a' },
    'салатовий': { background: '#84cc16' },
    'lime': { background: '#84cc16' },
    'м\'ятний': { background: 'oklch(76% 0.14 155)' },
    'mint': { background: 'oklch(76% 0.14 155)' },
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
    'різнокольоровий': { background: 'linear-gradient(45deg, var(--color-danger), #f97316, #eab308, oklch(76% 0.14 155), var(--color-accent), var(--color-accent))' },
    'rainbow': { background: 'linear-gradient(45deg, var(--color-danger), #f97316, #eab308, oklch(76% 0.14 155), var(--color-accent), var(--color-accent))' },
    'multicolor': { background: 'linear-gradient(45deg, var(--color-danger), #f97316, #eab308, oklch(76% 0.14 155), var(--color-accent), var(--color-accent))' },
    'мультиколор': { background: 'linear-gradient(45deg, var(--color-danger), #f97316, #eab308, oklch(76% 0.14 155), var(--color-accent), var(--color-accent))' },
    'переливний': { background: 'linear-gradient(45deg, var(--color-accent), var(--color-accent), var(--color-accent-2), var(--color-accent))' }
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

export default function Calculator({ isMobile: isMobileProp }) {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Materials Library filter and multi-select states
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState('All');
  const [selectedManufacturerFilter, setSelectedManufacturerFilter] = useState('All');
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  
  const [materialsLibrary, setMaterialsLibrary] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [catalogs, setCatalogs] = useState({ manufacturers: [], types: [], colors: [] });
  const [mobileTab, setMobileTab] = useState('params');
  const [isMobileState, setIsMobileState] = useState(false);
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileState;
  const [deleteConfirmMaterial, setDeleteConfirmMaterial] = useState(null);
  const [printersList, setPrintersList] = useState([]);
  const [showAddPrinterForm, setShowAddPrinterForm] = useState(false);
  const [newPrinterData, setNewPrinterData] = useState({ name: '', wattage: '', wear: '' });

  // Dynamic filter helpers derived from materials library
  const availableTypes = useMemo(() => {
    const types = materialsLibrary.map(m => m.type).filter(Boolean);
    return ['All', ...new Set(types)];
  }, [materialsLibrary]);

  const availableColors = useMemo(() => {
    const colors = materialsLibrary.map(m => m.color).filter(Boolean);
    return ['All', ...new Set(colors)];
  }, [materialsLibrary]);

  const availableManufacturers = useMemo(() => {
    const manufacturers = materialsLibrary.map(m => m.manufacturer).filter(Boolean);
    return ['All', ...new Set(manufacturers)];
  }, [materialsLibrary]);

  const visibleColors = useMemo(() => {
    if (showAllColors || availableColors.length <= 7) {
      return availableColors;
    }
    return availableColors.slice(0, 7);
  }, [availableColors, showAllColors]);

  const getTypeCount = (type) => {
    if (type === 'All') return materialsLibrary.length;
    return materialsLibrary.filter(m => m.type === type).length;
  };

  const getManufacturerCount = (man) => {
    if (man === 'All') return materialsLibrary.length;
    return materialsLibrary.filter(m => m.manufacturer === man).length;
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
      const matchesManufacturer = selectedManufacturerFilter === 'All' || m.manufacturer === selectedManufacturerFilter;
      
      return matchesSearch && matchesType && matchesColor && matchesManufacturer;
    });
  }, [materialsLibrary, materialSearchQuery, selectedTypeFilter, selectedColorFilter, selectedManufacturerFilter]);

  const visibleMaterials = useMemo(() => {
    if (showAllMaterials || filteredMaterials.length <= 6) {
      return filteredMaterials;
    }
    return filteredMaterials.slice(0, 6);
  }, [filteredMaterials, showAllMaterials]);

  useEffect(() => {
    const handleResize = () => setIsMobileState(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setShowAllMaterials(false);
  }, [selectedTypeFilter, selectedColorFilter, selectedManufacturerFilter, materialSearchQuery]);

  useEffect(() => {
    const stored = localStorage.getItem('buba_printers');
    if (stored) {
      try {
        setPrintersList(JSON.parse(stored));
      } catch (e) {
        setPrintersList(PRESETS.printers);
      }
    } else {
      setPrintersList(PRESETS.printers);
      localStorage.setItem('buba_printers', JSON.stringify(PRESETS.printers));
    }
  }, []);

  const handleAddPrinter = () => {
    if (!newPrinterData.name.trim()) {
      showToast('Введіть назву принтера', 'error');
      return;
    }
    const printer = {
      id: Date.now().toString(),
      name: newPrinterData.name.trim(),
      wattage: Number(newPrinterData.wattage) || 0,
      wear: Number(newPrinterData.wear) || 0
    };
    const updated = [...printersList, printer];
    setPrintersList(updated);
    localStorage.setItem('buba_printers', JSON.stringify(updated));
    setShowAddPrinterForm(false);
    setNewPrinterData({ name: '', wattage: '', wear: '' });
    showToast(`Принтер "${printer.name}" додано`);
  };

  const deletePrinter = (id, e) => {
    e.stopPropagation();
    const printerToDelete = printersList.find(p => p.id === id || p.name === id);
    const printerName = printerToDelete ? printerToDelete.name : 'Принтер';
    
    const updated = printersList.filter(p => p.id !== id && p.name !== id);
    setPrintersList(updated);
    localStorage.setItem('buba_printers', JSON.stringify(updated));
    showToast(`Принтер "${printerName}" видалено`);
  };

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

  const requestDeleteMaterial = (m, e) => {
    e.stopPropagation();
    setDeleteConfirmMaterial(m);
  };

  async function executeDeleteMaterial() {
    if (!deleteConfirmMaterial) return;
    const { id, name } = deleteConfirmMaterial;
    try {
      const { error } = await supabase.from('material_library').delete().eq('id', id);
      if (error) throw error;
      setMaterialsLibrary(materialsLibrary.filter(m => m.id !== id));
      setSelectedMaterialIds(prev => prev.filter(mid => mid !== id));
      showToast(`Матеріал "${name}" видалено`);
    } catch (e) {
      showToast('Помилка видалення: ' + e.message, 'error');
    } finally {
      setDeleteConfirmMaterial(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20, width: '100%' }}>
      {/* ================= UNIFIED DUSK COMMAND HEADER ================= */}
      <div className="dusk-glass" style={{ padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              borderRadius: 12,
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              flexShrink: 0
            }}>
              <CalcIcon size={isMobile ? 18 : 20} />
            </div>
            <div>
              <h1 className="dusk-heading" style={{ fontSize: isMobile ? 17 : 21, margin: 0 }}>
                Калькулятор друку
              </h1>
              {!isMobile && (
                <p className="dusk-subheading" style={{ marginTop: 2 }}>
                  Розрахунок собівартості 3D-друку: пластик, амортизація, електроенергія та маржа
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={resetForm}
              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              style={{ height: isMobile ? 32 : 34, padding: isMobile ? '0 10px' : '0 14px', fontSize: 12 }}
            >
              <Plus size={14} />
              <span>Новий</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="dusk-btn dusk-btn--primary dusk-btn--sm"
              style={{ height: isMobile ? 32 : 34, padding: isMobile ? '0 12px' : '0 16px', fontSize: 12, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{formData.id ? 'Оновити' : 'Зберегти'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Live Summary Strip + Segmented Tabs */}
        {isMobile && (
          <>
            <div
              onClick={() => setMobileTab('result')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--color-paper-2)',
                border: '1px solid var(--color-rule)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Собівартість</div>
                  <div className="dusk-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent)' }}>{results.prime} ₴</div>
                </div>
                <span className="dusk-badge dusk-badge--neutral dusk-num" style={{ fontSize: 11 }}>
                  {results.totalWeight} г · {formData.time_h} год
                </span>
              </div>
            </div>

            <div className="dusk-segmented" style={{ width: '100%', display: 'flex' }}>
              {[
                { id: 'params', label: 'Параметри' },
                { id: 'result', label: 'Результат' },
                { id: 'saved', label: `Збережені (${calculations.length})` }
              ].map(({ id, label }) => {
                const isActive = mobileTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMobileTab(id)}
                    className={`dusk-segmented__item ${isActive ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center', height: 30, fontSize: 12, position: 'relative', background: 'transparent', boxShadow: 'none' }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="calcMobileTabSlider"
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
          </>
        )}
      </div>

      {/* ================= MAIN WORKSPACE GRID ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.45fr) minmax(350px, 1fr)',
        gap: isMobile ? 12 : 20,
        alignItems: 'start',
        width: '100%'
      }}>
        {/* LEFT COLUMN: PARAMETERS */}
        {(!isMobile || mobileTab === 'params') && (
          <motion.div
            key="calc-params"
            initial={isMobile ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}
          >
            {/* CARD 1: PHOTO, MODEL & CORE STATS */}
            <div className="dusk-panel" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {formData.image_url ? (
                  <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-rule)', flexShrink: 0 }}>
                    <img src={formData.image_url} alt="Фото виробу" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      style={{
                        position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                        color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    width: 72, height: 72, borderRadius: 12, border: '1.5px dashed var(--color-rule)',
                    background: 'var(--color-paper-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', gap: 4, color: 'var(--color-muted)', flexShrink: 0, transition: 'border-color 120ms ease-out'
                  }}>
                    <Upload size={18} />
                    <span style={{ fontSize: 9.5, fontWeight: 600 }}>ФОТО</span>
                    <input type="file" hidden accept="image/*" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `calc-${Math.random()}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                        setFormData({ ...formData, image_url: publicUrl });
                        showToast('Фото завантажено!');
                      } catch (err) {
                        showToast('Помилка завантаження: ' + err.message, 'error');
                      }
                    }} />
                  </label>
                )}

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Назва розрахунку</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="dusk-input"
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Назва моделі</label>
                    <input
                      type="text"
                      value={formData.model_name}
                      onChange={e => setFormData({ ...formData, model_name: e.target.value })}
                      placeholder="напр. Dragon_Articulated_v2"
                      className="dusk-input"
                      style={{ height: 36, fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Вага моделі (г)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={formData.weight_g}
                      onChange={e => setFormData({ ...formData, weight_g: e.target.value })}
                      className="dusk-input dusk-num"
                      style={{ height: 38, paddingRight: 34, fontSize: 14, fontWeight: 600 }}
                    />
                    <Package size={15} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Час друку (год)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={formData.time_h}
                      onChange={e => setFormData({ ...formData, time_h: e.target.value })}
                      className="dusk-input dusk-num"
                      style={{ height: 38, paddingRight: 34, fontSize: 14, fontWeight: 600 }}
                    />
                    <Clock size={15} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: MATERIAL LIBRARY */}
            <div className="dusk-panel" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> Бібліотека матеріалів
                </label>
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(!showMaterialForm)}
                  className={`dusk-btn dusk-btn--sm ${showMaterialForm ? 'dusk-btn--danger' : 'dusk-btn--ghost'}`}
                  style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                >
                  <Plus size={13} style={{ transform: showMaterialForm ? 'rotate(45deg)' : 'none', transition: 'transform 150ms ease' }} />
                  <span>{showMaterialForm ? 'Сховати' : 'Додати матеріал'}</span>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showMaterialForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        background: 'var(--color-paper-2)',
                        padding: 14,
                        borderRadius: 12,
                        border: '1px solid var(--color-accent-border)',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                        gap: 10
                      }}
                    >
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 10.5, color: 'var(--color-muted)', marginBottom: 4, display: 'block' }}>Назва (автоматично)</label>
                      <input disabled value={newMaterial.name} className="dusk-input" style={{ height: 34, fontSize: 12, opacity: 0.7 }} />
                    </div>
                    <ModernSelect
                      label="Тип пластику"
                      value={newMaterial.type}
                      options={catalogs.types}
                      onChange={(val) => setNewMaterial({ ...newMaterial, type: val })}
                      onAdd={(val) => addToCatalog('m_plastic_types', val)}
                    />
                    <ModernSelect
                      label="Виробник"
                      value={newMaterial.manufacturer}
                      options={catalogs.manufacturers}
                      onChange={(val) => setNewMaterial({ ...newMaterial, manufacturer: val })}
                      onAdd={(val) => addToCatalog('m_manufacturers', val)}
                    />
                    <ModernSelect
                      label="Колір"
                      value={newMaterial.color}
                      options={catalogs.colors}
                      onChange={(val) => setNewMaterial({ ...newMaterial, color: val })}
                      onAdd={(val) => addToCatalog('m_colors', val)}
                    />
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 4, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ціна грн/кг</label>
                      <input
                        type="number"
                        value={newMaterial.cost_per_kg}
                        onChange={e => setNewMaterial({ ...newMaterial, cost_per_kg: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 12 }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await handleSaveToLibrary();
                            showToast(editingMaterialId ? 'Матеріал оновлено!' : 'Матеріал збережено в бібліотеку!');
                          } catch (err) {
                            showToast('Помилка збереження!', 'error');
                          }
                        }}
                        className="dusk-btn dusk-btn--primary dusk-btn--sm"
                        style={{ flex: 1, height: 34, justifyContent: 'center' }}
                      >
                        {editingMaterialId ? 'Оновити в бібліотеці' : 'Зберегти в бібліотеку'}
                      </button>
                      {editingMaterialId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMaterialId(null);
                            setShowMaterialForm(false);
                            setNewMaterial({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 });
                          }}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ height: 34 }}
                        >
                          Скасувати
                        </button>
                      )}
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search & Filters */}
              {materialsLibrary.length > 0 && (
                <div style={{
                  background: 'var(--color-paper-2)',
                  border: '1px solid var(--color-rule)',
                  padding: isMobile ? 10 : 14,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input
                      type="text"
                      placeholder="Пошук матеріалу за назвою, виробником, типом…"
                      value={materialSearchQuery}
                      onChange={e => setMaterialSearchQuery(e.target.value)}
                      className="dusk-input"
                      style={{ height: 34, paddingLeft: 32, paddingRight: materialSearchQuery ? 28 : 12, fontSize: 12.5, borderRadius: 999 }}
                    />
                    {materialSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMaterialSearchQuery('')}
                        style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 2 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Type + Manufacturer Pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', scrollbarWidth: 'none' }}>
                      {availableTypes.map(type => {
                        const count = getTypeCount(type);
                        const isSelected = selectedTypeFilter === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedTypeFilter(type)}
                            className={`dusk-facet-pill ${isSelected ? 'active' : ''}`}
                            style={{ flexShrink: 0, padding: '4px 10px', fontSize: 11.5 }}
                          >
                            <span>{type === 'All' ? 'Всі типи' : type}</span>
                            <span className="dusk-num" style={{ opacity: 0.7 }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {availableManufacturers.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', scrollbarWidth: 'none' }}>
                        {availableManufacturers.map(man => {
                          const count = getManufacturerCount(man);
                          const isSelected = selectedManufacturerFilter === man;
                          return (
                            <button
                              key={man}
                              type="button"
                              onClick={() => setSelectedManufacturerFilter(man)}
                              className={`dusk-facet-pill ${isSelected ? 'active' : ''}`}
                              style={{ flexShrink: 0, padding: '4px 10px', fontSize: 11.5 }}
                            >
                              <span>{man === 'All' ? 'Всі виробники' : man}</span>
                              <span className="dusk-num" style={{ opacity: 0.7 }}>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Color Swatches */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: showAllColors ? 'wrap' : 'nowrap', overflowX: showAllColors ? 'visible' : 'auto', padding: '4px 2px', alignItems: 'center', scrollbarWidth: 'none' }}>
                    {visibleColors.map(color => {
                      const isSelected = selectedColorFilter === color;
                      const isAll = color === 'All';
                      const colorStyle = getColorStyle(isAll ? '' : color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColorFilter(color)}
                          title={isAll ? 'Всі кольори' : color}
                          style={{
                            position: 'relative',
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'transform 120ms ease-out, border-color 120ms ease-out',
                            ...colorStyle,
                            border: isSelected ? '2px solid var(--color-accent)' : (colorStyle.border || '1px solid var(--color-rule)'),
                            transform: isSelected ? 'scale(1.14)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isAll && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--color-ink)' }}>Всі</span>}
                          {isSelected && !isAll && (
                            <CheckCircle2 size={12} style={{ color: colorStyle.color || '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                          )}
                        </button>
                      );
                    })}
                    {availableColors.length > 7 && (
                      <button
                        type="button"
                        onClick={() => setShowAllColors(!showAllColors)}
                        className="dusk-facet-pill"
                        style={{ flexShrink: 0, height: 26, padding: '0 9px', fontSize: 11 }}
                      >
                        {showAllColors ? 'Сховати' : `+${availableColors.length - 7}`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-select Summary Banner */}
              {selectedMaterialIds.length > 0 && (
                <div style={{
                  background: 'var(--color-accent-soft)',
                  border: '1px solid var(--color-accent-border)',
                  padding: 12,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Вибрано {selectedMaterialIds.length} {selectedMaterialIds.length === 1 ? 'матеріал' : selectedMaterialIds.length < 5 ? 'матеріали' : 'матеріалів'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMaterialIds([]);
                        setFormData(f => ({ ...f, plastic_type: 'PLA', plastic_cost_roll: 750 }));
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Скинути
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {materialsLibrary.filter(mat => selectedMaterialIds.includes(mat.id)).map(mat => (
                      <div
                        key={mat.id}
                        style={{
                          background: 'var(--color-paper)',
                          border: '1px solid var(--color-rule)',
                          padding: '4px 8px',
                          borderRadius: 8,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <div style={{ width: 9, height: 9, borderRadius: '50%', ...getColorStyle(mat.color) }} />
                        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{mat.name}</span>
                        <span className="dusk-num" style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>({mat.cost_per_kg} ₴)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectFromLibrary(mat); }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11.5, paddingTop: 6, borderTop: '1px solid var(--color-accent-border)' }}>
                    <span>Середня ціна: <strong className="dusk-num" style={{ color: 'var(--color-ink)' }}>{formData.plastic_cost_roll} ₴/кг</strong></span>
                    <span>Тип: <strong style={{ color: 'var(--color-accent)' }}>{formData.plastic_type}</strong></span>
                  </div>
                </div>
              )}

              {/* Grid of Materials */}
              {materialsLibrary.length > 0 ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: 10
                  }}>
                    {visibleMaterials.map(m => {
                      const isSelected = selectedMaterialIds.includes(m.id);
                      const colorStyle = getColorStyle(m.color);
                      return (
                        <div
                          key={m.id}
                          onClick={() => selectFromLibrary(m)}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            border: isSelected ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                            background: isSelected ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                            cursor: 'pointer',
                            transition: 'border-color 140ms ease-out, background-color 140ms ease-out',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                ...colorStyle,
                                border: colorStyle.border || '1px solid var(--color-rule)',
                                visibility: selectedColorFilter === 'All' ? 'visible' : 'hidden'
                              }}
                              title={`Колір: ${m.color || 'Не вказано'}`}
                            />
                            <div style={{
                              width: 17,
                              height: 17,
                              borderRadius: 5,
                              border: isSelected ? 'none' : '1.5px solid var(--color-rule)',
                              background: isSelected ? 'var(--color-accent)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isSelected && <CheckCircle2 size={11} style={{ color: 'var(--color-accent-ink)' }} />}
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                                {m.type || 'PLA'}
                              </span>
                              {m.manufacturer && (
                                <span className="dusk-badge dusk-badge--neutral" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                                  {m.manufacturer}
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--color-ink)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                              {m.name}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--color-rule)' }}>
                            <span className="dusk-num" style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-accent)' }}>
                              {m.cost_per_kg} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>₴/кг</span>
                            </span>
                            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => startEditMaterial(m, e)}
                                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
                                title="Редагувати"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => requestDeleteMaterial(m, e)}
                                className="dusk-btn dusk-btn--danger dusk-btn--sm"
                                style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
                                title="Видалити"
                              >
                                <Trash2 size={11} />
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
                        padding: '24px 16px',
                        color: 'var(--color-muted)',
                        fontSize: 12.5,
                        background: 'var(--color-paper-2)',
                        border: '1px dashed var(--color-rule)',
                        borderRadius: 12
                      }}>
                        Матеріалів не знайдено за поточними фільтрами
                      </div>
                    )}
                  </div>

                  {filteredMaterials.length > 6 && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowAllMaterials(!showAllMaterials)}
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ height: 30, fontSize: 12 }}
                      >
                        {showAllMaterials ? 'Сховати список' : `Показати ще ${filteredMaterials.length - 6}`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: 'var(--color-paper-2)', border: '1px dashed var(--color-rule)', borderRadius: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Бібліотека порожня. Швидкі пресети:</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {PRESETS.materials.map(m => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, plastic_type: m.name, plastic_cost_roll: m.cost }))}
                        className="dusk-facet-pill"
                      >
                        {m.name} ({m.cost} ₴)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Тип пластику</label>
                  <input
                    type="text"
                    value={formData.plastic_type}
                    onChange={e => setFormData({ ...formData, plastic_type: e.target.value })}
                    placeholder="напр. PLA"
                    className="dusk-input"
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>Ціна за кг</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={formData.plastic_cost_roll}
                      onChange={e => setFormData({ ...formData, plastic_cost_roll: e.target.value })}
                      className="dusk-input dusk-num"
                      style={{ height: 36, paddingRight: 42, fontSize: 13, fontWeight: 600 }}
                    />
                    <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: 11.5 }}>₴/кг</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: PRINTERS & ENERGY */}
            <div className="dusk-panel" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} /> Обладнання та енергія
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {printersList.map(p => (
                    <div
                      key={p.id || p.name}
                      onClick={() => applyPrinterPreset(p)}
                      className="dusk-facet-pill"
                      style={{ padding: '3px 9px', fontSize: 11, cursor: 'pointer' }}
                    >
                      <span>{p.name}</span>
                      <button
                        type="button"
                        onClick={(e) => deletePrinter(p.id || p.name, e)}
                        title="Видалити принтер"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--color-danger)' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                  >
                    <Plus size={12} /> Додати
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showAddPrinterForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        background: 'var(--color-paper-2)',
                        border: '1px dashed var(--color-accent-border)',
                        padding: 12,
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Назва принтера (напр. Bambu Lab A1)"
                        value={newPrinterData.name}
                        onChange={e => setNewPrinterData({ ...newPrinterData, name: e.target.value })}
                        className="dusk-input"
                        style={{ height: 34, fontSize: 12 }}
                      />
                      <input
                        type="number"
                        placeholder="Потужність (Вт)"
                        value={newPrinterData.wattage}
                        onChange={e => setNewPrinterData({ ...newPrinterData, wattage: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 12 }}
                      />
                      <input
                        type="number"
                        placeholder="Знос (₴/год)"
                        value={newPrinterData.wear}
                        onChange={e => setNewPrinterData({ ...newPrinterData, wear: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 12 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" onClick={() => setShowAddPrinterForm(false)} className="dusk-btn dusk-btn--ghost dusk-btn--sm" style={{ height: 28 }}>
                        Скасувати
                      </button>
                      <button type="button" onClick={handleAddPrinter} className="dusk-btn dusk-btn--primary dusk-btn--sm" style={{ height: 28 }}>
                        Зберегти
                      </button>
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Потужність (Вт)</label>
                  <input
                    type="number"
                    value={formData.printer_wattage}
                    onChange={e => setFormData({ ...formData, printer_wattage: e.target.value })}
                    className="dusk-input dusk-num"
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Знос (₴/год)</label>
                  <input
                    type="number"
                    value={formData.wear_cost_h}
                    onChange={e => setFormData({ ...formData, wear_cost_h: e.target.value })}
                    className="dusk-input dusk-num"
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Тариф (₴/кВт)</label>
                  <input
                    type="number"
                    value={formData.electricity_cost_kwh}
                    onChange={e => setFormData({ ...formData, electricity_cost_kwh: e.target.value })}
                    className="dusk-input dusk-num"
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: AMS, MARGINS, LABOR & EXTRAS */}
            <div className="dusk-panel" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--color-accent-2-soft)', border: '1px solid var(--color-accent-2-border)', borderRadius: 12, padding: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--color-accent-2)', marginBottom: 10 }}>
                    <Layers size={13} /> AMS / Multi-color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Замін кольору</span>
                      <input
                        type="number"
                        value={formData.ams_swaps}
                        onChange={e => setFormData({ ...formData, ams_swaps: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Purge (г/заміна)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.purge_g}
                        onChange={e => setFormData({ ...formData, purge_g: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', borderRadius: 12, padding: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 10 }}>
                    <TrendingUp size={13} /> Рентабельність
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Брак (%)</span>
                      <input
                        type="number"
                        value={formData.failure_margin}
                        onChange={e => setFormData({ ...formData, failure_margin: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Прибуток (%)</span>
                      <input
                        type="number"
                        value={formData.profit_margin}
                        onChange={e => setFormData({ ...formData, profit_margin: e.target.value })}
                        className="dusk-input dusk-num"
                        style={{ height: 34, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Робота (₴)</label>
                  <input
                    type="number"
                    value={formData.labor_cost}
                    onChange={e => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="dusk-input dusk-num"
                    style={{ height: 36, fontSize: 13, fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Дод. витрати (₴)</label>
                  <input
                    type="number"
                    value={formData.additional_costs}
                    onChange={e => setFormData({ ...formData, additional_costs: e.target.value })}
                    className="dusk-input dusk-num"
                    style={{ height: 36, fontSize: 13, fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-accent-2)' }}>Знижка (%)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="dusk-input dusk-num"
                    style={{
                      height: 36,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-accent-2)',
                      background: 'var(--color-accent-2-soft)',
                      borderColor: 'var(--color-accent-2-border)'
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RIGHT COLUMN: RESULTS (STICKY ON DESKTOP) & SAVED */}
        {(!isMobile || mobileTab === 'result' || mobileTab === 'saved') && (
          <div style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 12 : 16,
            position: isMobile ? 'static' : 'sticky',
            top: 16
          }}>
            {/* Results Card */}
            {(!isMobile || mobileTab === 'result') && (
              <motion.div
                key="calc-result"
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="dusk-panel"
                style={{ padding: isMobile ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="dusk-heading" style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} style={{ color: 'var(--color-accent-2)' }} /> Результат розрахунку
                  </h3>
                  <span className="dusk-badge dusk-badge--neutral dusk-num" style={{ fontSize: 11 }}>
                    {results.totalWeight} г · {formData.time_h} год
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Пластик {formData.ams_swaps > 0 && `(+AMS)`}</span>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{results.plastic} ₴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Електроенергія</span>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{results.electricity} ₴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Амортизація</span>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{results.wear} ₴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Ризики (брак)</span>
                    <span className="dusk-num" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>+ {results.failure} ₴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Дод. витрати</span>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>+ {results.extras} ₴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Робота</span>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>+ {results.labor} ₴</span>
                  </div>

                  <div style={{ height: 1, background: 'var(--color-rule)', margin: '2px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={16} style={{ color: 'var(--color-accent)' }} />
                      <span style={{ color: 'var(--color-ink)', fontWeight: 700, fontSize: 13 }}>СОБІВАРТІСТЬ</span>
                    </div>
                    <span className="dusk-num" style={{ color: 'var(--color-ink)', fontSize: 22, fontWeight: 700 }}>{results.prime} ₴</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Saved List */}
            {(!isMobile || mobileTab === 'saved') && (
              <motion.div
                key="calc-saved"
                initial={isMobile ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="dusk-panel"
                style={{ padding: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="dusk-heading" style={{ fontSize: 14, margin: 0 }}>
                    Збережені ({calculations.length})
                  </h4>
                  <button
                    type="button"
                    onClick={fetchCalculations}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                    title="Оновити список"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                  <input
                    type="text"
                    placeholder="Пошук розрахунків…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="dusk-input"
                    style={{ height: 34, paddingLeft: 32, fontSize: 12.5, borderRadius: 999 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: isMobile ? 'none' : 380, overflowY: isMobile ? 'visible' : 'auto' }} className="hide-scrollbar">
                  <AnimatePresence>
                    {filteredCalculations.map((calc) => (
                      <motion.div
                        key={calc.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          background: 'var(--color-paper-2)',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid var(--color-rule)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {calc.name}
                          </div>
                          <div className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                            {calc.plastic_type} · {calc.weight_g}г · {calc.time_h}г
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <div className="dusk-num" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-accent)', marginRight: 4 }}>
                            {calc.suggested_price} ₴
                          </div>
                          <button
                            type="button"
                            onClick={() => handleShare(calc)}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                            title="Поділитися з клієнтом"
                          >
                            <Share2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { startEditCalculation(calc); if (isMobile) setMobileTab('params'); }}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                            title="Завантажити в калькулятор"
                          >
                            <CalcIcon size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(calc.id)}
                            className="dusk-btn dusk-btn--danger dusk-btn--sm"
                            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                            title="Видалити"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredCalculations.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)', fontSize: 12.5 }}>
                      Нічого не знайдено
                    </div>
                  )}
                  {loading && (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto' }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed', bottom: 28, left: '50%',
              padding: '12px 18px', borderRadius: 12,
              background: notification.type === 'error' ? 'var(--color-danger-soft)' : 'var(--color-paper-3)',
              color: notification.type === 'error' ? 'var(--color-danger)' : 'var(--color-ink)',
              fontWeight: 600, fontSize: 13,
              boxShadow: 'var(--shadow-card)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
              border: `1px solid ${notification.type === 'error' ? 'var(--color-danger-border)' : 'var(--color-accent-border)'}`
            }}
          >
            {notification.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} style={{ color: 'var(--color-accent)' }} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MATERIAL CONFIRM MODAL */}
      <AnimatePresence>
        {deleteConfirmMaterial && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'oklch(10% 0.015 268 / 0.80)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 16
          }} onClick={() => setDeleteConfirmMaterial(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="dusk-panel"
              style={{
                padding: 22, borderRadius: 16, maxWidth: 400, width: '100%',
                display: 'flex', flexDirection: 'column', gap: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--color-danger-soft)',
                  border: '1px solid var(--color-danger-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)'
                }}>
                  <AlertCircle size={19} />
                </div>
                <div>
                  <h3 className="dusk-heading" style={{ fontSize: 16, margin: 0 }}>Видалити матеріал?</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '2px 0 0' }}>Підтвердження дії</p>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
                Ви впевнені, що хочете видалити матеріал <strong style={{ color: 'var(--color-ink)' }}>{deleteConfirmMaterial.name}</strong>? Це видалить його з бібліотеки назавжди.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmMaterial(null)}
                  className="dusk-btn dusk-btn--ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={executeDeleteMaterial}
                  className="dusk-btn dusk-btn--danger"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Видалити
                </button>
              </div>
            </motion.div>
          </div>
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
          border: isOpen ? '1px solid var(--color-accent)' : '1px solid var(--border)'
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
              background: 'var(--color-paper-2)', border: '1px solid var(--color-accent-soft)', borderRadius: 16, 
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
                        background: value === opt ? 'var(--color-accent-soft)' : 'transparent',
                        fontWeight: value === opt ? 800 : 500, transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = value === opt ? 'var(--color-accent-soft)' : 'transparent'}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); setIsAddMode(true); }}
                  style={{ 
                    padding: '12px', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--color-accent)', fontSize: 12, fontWeight: 900, cursor: 'pointer', textAlign: 'center'
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
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-accent-border)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => { if(newValue) { onAdd(newValue); onChange(newValue); } setIsAddMode(false); setNewValue(''); setIsOpen(false); }}
                    style={{ flex: 1, height: 40, borderRadius: 10, background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 900, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                    onMouseEnter={(e) => e.target.style.background = '#6d28d9'}
                    onMouseLeave={(e) => e.target.style.background = 'var(--color-accent)'}
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
