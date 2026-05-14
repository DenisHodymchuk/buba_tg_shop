"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator as CalcIcon, Trash2, Save, Plus, 
  Zap, Clock, Package, RefreshCw, AlertCircle, 
  TrendingUp, DollarSign, Layers, CheckCircle2,
  ChevronDown, ChevronUp, Search, Filter, Copy, 
  ShieldCheck, Sparkles, Loader2, Share2, Upload, X
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

export default function Calculator() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [materialsLibrary, setMaterialsLibrary] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', type: 'PLA', manufacturer: '', color: '', cost_per_kg: 750 });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [catalogs, setCatalogs] = useState({ manufacturers: [], types: [], colors: [] });

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
    labor_cost_h: 50,
    profit_margin: 50
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
    // 1. Plastic cost
    const totalWeight = Number(formData.weight_g) + (Number(formData.ams_swaps) * Number(formData.purge_g));
    const plasticCost = (totalWeight / 1000) * Number(formData.plastic_cost_roll);
    
    // 2. Electricity cost
    const kwh = (Number(formData.time_h) * Number(formData.printer_wattage)) / 1000;
    const electricityCost = kwh * Number(formData.electricity_cost_kwh);
    
    // 3. Wear cost
    const wearCost = Number(formData.time_h) * Number(formData.wear_cost_h);
    
    // 4. Base prime cost
    const basePrimeCost = plasticCost + electricityCost + wearCost;
    
    // 5. Failure margin
    const elec = kwh * Number(formData.electricity_cost_kwh);
    const wear = Number(formData.time_h) * Number(formData.wear_cost_h);
    const prime = plasticCost + elec + wear + ((plasticCost + elec + wear) * (Number(formData.failure_margin) / 100));
    
    const labor = Number(formData.time_h) * Number(formData.labor_cost_h);
    const suggested = (prime + labor) * (1 + Number(formData.profit_margin) / 100);
    const discountAmount = suggested * (Number(formData.discount) / 100);
    const final = suggested - discountAmount;

    return {
      plastic: plasticCost.toFixed(0),
      electricity: elec.toFixed(0),
      wear: wear.toFixed(0),
      failure: (prime - (plasticCost + elec + wear)).toFixed(0),
      prime: prime.toFixed(0),
      labor: labor.toFixed(0),
      suggested: suggested.toFixed(0),
      final: final.toFixed(0),
      totalWeight: totalWeight.toFixed(0)
    };
  }, [formData]);

  async function handleSave() {
    setSaving(true);
    try {
      const isEdit = !!formData.id;
      const dataToSave = {
        ...formData,
        total_prime_cost: parseFloat(results.prime),
        suggested_price: parseFloat(results.final)
      };

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
      labor_cost_h: 50,
      profit_margin: 50,
      discount: 0,
      image_url: ''
    });
    setActivePreset(null);
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
    setFormData(prev => ({
      ...prev,
      plastic_type: m.type,
      plastic_cost_roll: m.cost_per_kg,
    }));
    setActivePreset(m.id);
  };

  const startEditCalculation = (calc) => {
    setFormData({
      ...calc,
      // Ensure all fields are present or defaulted
    });
    // Scroll to top
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
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
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={resetForm}
                style={{ 
                  padding: '12px 20px', borderRadius: 14, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Plus size={18} /> НОВИЙ
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  padding: '12px 24px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'var(--text-main)',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
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
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>Матеріал та вартість</label>
                <button 
                  onClick={() => setShowMaterialForm(!showMaterialForm)}
                  style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'none', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                >
                  {showMaterialForm ? 'СХОВАТИ' : '+ БІБЛІОТЕКА'}
                </button>
              </div>

              {showMaterialForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 16, border: '1px solid #7c3aed40', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}
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

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }} className="hide-scrollbar">
                {materialsLibrary.map(m => (
                  <div 
                    key={m.id} onClick={() => selectFromLibrary(m)}
                    style={{ 
                      flexShrink: 0, padding: '12px 16px', borderRadius: 16, border: '1px solid',
                      borderColor: activePreset === m.id ? '#7c3aed' : 'var(--border)',
                      background: activePreset === m.id ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)',
                      color: activePreset === m.id ? '#7c3aed' : 'var(--text-main)',
                      cursor: 'pointer', textAlign: 'left', minWidth: 200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 4, lineHeight: 1.2 }}>{m.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 600 }}>{m.manufacturer || '—'} • {m.cost_per_kg} ₴</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={(e) => startEditMaterial(m, e)} style={{ background: 'rgba(124,58,237,0.1)', border: 'none', padding: 6, borderRadius: 8, color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalcIcon size={12} />
                      </button>
                      <button onClick={(e) => handleDeleteMaterial(m.id, e)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: 6, borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {materialsLibrary.length === 0 && PRESETS.materials.map(m => (
                   <button 
                    key={m.name} onClick={() => applyMaterialPreset(m)}
                    style={{ 
                      flexShrink: 0, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)',
                      background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Обладнання та енергія</label>
                <div style={{ display: 'flex', gap: 6 }}>
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

            {/* Labor & Discount Section */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(59,130,246,0.05)', borderRadius: 20, padding: 20, border: '1px solid rgba(59,130,246,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} style={{ color: '#3b82f6' }} />
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Праця та Знижка</label>
                </div>
                
                <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
                  <div style={{ position: 'relative', flex: 1, maxWidth: 150 }}>
                    <input 
                      type="number" value={formData.labor_cost_h} onChange={e => setFormData({...formData, labor_cost_h: e.target.value})}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 35px 10px 10px', color: 'var(--text-main)', outline: 'none', fontSize: 13 }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 9, fontWeight: 800 }}>₴/год</span>
                  </div>

                  <div style={{ position: 'relative', flex: 1, maxWidth: 120 }}>
                    <input 
                      type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                      style={{ width: '100%', background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 10, padding: '10px 35px 10px 10px', color: 'var(--text-main)', outline: 'none', fontSize: 13 }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#ec4899', fontSize: 9, fontWeight: 900 }}>% ЗНИЖКИ</span>
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

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 14, letterSpacing: '0.05em' }}>СОБІВАРТІСТЬ</span>
              </div>
              <span style={{ color: '#22c55e', fontSize: 24, fontWeight: 950 }}>{results.prime} ₴</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Робота</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>+ {results.labor} ₴</span>
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
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
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
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => { setIsOpen(false); setIsAddMode(false); }} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, 
                background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 101, overflow: 'hidden', padding: 6
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => { if(newValue) { onAdd(newValue); onChange(newValue); } setIsAddMode(false); setNewValue(''); setIsOpen(false); }}
                      style={{ flex: 1, padding: 8, borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                    >
                      ЗБЕРЕГТИ
                    </button>
                    <button 
                      onClick={() => { setIsAddMode(false); setNewValue(''); }}
                      style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                    >
                      СКАСУВАТИ
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
