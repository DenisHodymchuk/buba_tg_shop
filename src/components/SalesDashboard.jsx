"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { novaPoshta } from '@/lib/novaposhta';
import { 
  Coins, Search, Plus, Trash2, Calendar, ShoppingBag, 
  ArrowUpRight, AlertCircle, Edit3, X, ChevronDown, 
  CheckCircle2, Info, Loader2, Filter, Receipt, ExternalLink,
  Clock, ClipboardList, Printer, Truck, Send, XCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Reusable custom themed dropdown component
function ThemeSelect({ label, value, options, onChange, displayValue, placeholder = "Виберіть...", inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', background: 'rgba(0,0,0,0.3)', border: isOpen ? '1px solid #7c3aed' : '1px solid var(--border)', borderRadius: 12, padding: 12, 
          color: '#fff', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          userSelect: 'none', transition: 'border-color 0.2s'
        }}
      >
        <span style={{ fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayValue || value || placeholder}</span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              position: inline ? 'relative' : 'absolute', 
              top: inline ? 'auto' : 'calc(100% + 6px)', 
              left: 0, right: 0, 
              marginTop: 6,
              background: '#1e293b', border: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: 12, 
              zIndex: inline ? 1 : 1000, padding: 6, maxHeight: 200, overflowY: 'auto', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.5)'
            }}
          >
            {options.filter(opt => opt.value !== '').map(opt => (
              <div 
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                style={{ 
                  padding: '10px 14px', fontSize: 13, color: '#fff', borderRadius: 8, cursor: 'pointer', 
                  fontWeight: value === opt.value ? 800 : 500, 
                  background: value === opt.value ? 'rgba(124,58,237,0.2)' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = value === opt.value ? 'rgba(124,58,237,0.2)' : 'transparent'}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_META = {
  new: { label: 'Нове', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  preparing: { label: 'Підготовка', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
  shipping: { label: 'Очікує на відправку', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
  shipped: { label: 'Відправлено поштою', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send },
  completed: { label: 'Виконано', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle }
};

export default function SalesDashboard({ showToast }) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [salesFilterTemplates, setSalesFilterTemplates] = useState([]);
  const [newSalesTemplateName, setNewSalesTemplateName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buba_sales_filter_templates');
      if (saved) {
        const templates = JSON.parse(saved);
        setSalesFilterTemplates(templates);
        const defaultTemplate = templates.find(t => t.isDefault);
        if (defaultTemplate) {
          setSelectedSources(defaultTemplate.selectedSources || []);
          setSelectedPayments(defaultTemplate.selectedPayments || []);
          setSelectedStatuses(defaultTemplate.selectedStatuses || []);
        }
      }
    }
  }, []);

  const saveSalesFilterTemplate = (name) => {
    if (!name.trim()) return;
    const newTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      selectedSources,
      selectedPayments,
      selectedStatuses,
      isDefault: false
    };
    const updated = [...salesFilterTemplates, newTemplate];
    setSalesFilterTemplates(updated);
    localStorage.setItem('buba_sales_filter_templates', JSON.stringify(updated));
    setNewSalesTemplateName('');
    showToast('Шаблон збережено', 'success');
  };

  const deleteSalesFilterTemplate = (id, e) => {
    e.stopPropagation();
    const updated = salesFilterTemplates.filter(t => t.id !== id);
    setSalesFilterTemplates(updated);
    localStorage.setItem('buba_sales_filter_templates', JSON.stringify(updated));
    showToast('Шаблон видалено', 'info');
  };

  const toggleSalesTemplateDefault = (id, e) => {
    e.stopPropagation();
    const updated = salesFilterTemplates.map(t => {
      if (t.id === id) {
        return { ...t, isDefault: !t.isDefault };
      }
      return { ...t, isDefault: false };
    });
    setSalesFilterTemplates(updated);
    localStorage.setItem('buba_sales_filter_templates', JSON.stringify(updated));
    showToast('Налаштування оновлено', 'success');
  };

  const applySalesTemplate = (template) => {
    setSelectedSources(template.selectedSources || []);
    setSelectedPayments(template.selectedPayments || []);
    setSelectedStatuses(template.selectedStatuses || []);
    showToast(`Застосовано шаблон "${template.name}"`, 'success');
  };

  const toggleSourceFilter = (source) => {
    if (source === 'Всі') {
      setSelectedSources([]);
    } else {
      setSelectedSources(prev => 
        prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
      );
    }
  };

  const togglePaymentFilter = (payment) => {
    if (payment === 'Всі') {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(prev => 
        prev.includes(payment) ? prev.filter(p => p !== payment) : [...prev, payment]
      );
    }
  };

  const toggleStatusFilter = (status) => {
    if (status === 'Всі') {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(prev => 
        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
      );
    }
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [periodType, setPeriodType] = useState('month'); // 'week' | 'month' | 'quarter'
  
  // Form state
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    source: 'olx',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    cityRef: '',
    warehouse: '',
    total: '',
    payment_status: 'pending',
    status: 'new',
    items: [], // array of { name, quantity, price }
    is_cod: false,
    cod_amount: '',
    notes: ''
  });
  
  // Tab inside cart adder: 'catalog' | 'manual'
  const [itemTab, setItemTab] = useState('catalog');

  // Nova Poshta autocomplete states
  const [npCityQuery, setNpCityQuery] = useState('');
  const [npCities, setNpCities] = useState([]);
  const [npLoadingCities, setNpLoadingCities] = useState(false);
  const [npShowCities, setNpShowCities] = useState(false);
  const [npWarehouses, setNpWarehouses] = useState([]);
  const [npWarehouseQuery, setNpWarehouseQuery] = useState('');
  const [npLoadingWarehouses, setNpLoadingWarehouses] = useState(false);
  const [npShowWarehouses, setNpShowWarehouses] = useState(false);

  // City search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (npCityQuery.length >= 2 && npCityQuery !== formData.city) {
        setNpLoadingCities(true);
        const data = await novaPoshta.getCities(npCityQuery);
        setNpCities(data);
        setNpLoadingCities(false);
        setNpShowCities(true);
      } else {
        setNpCities([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [npCityQuery, formData.city]);

  // Warehouse fetch effect
  useEffect(() => {
    async function fetchWarehouses() {
      if (formData.cityRef) {
        setNpLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(formData.cityRef);
        setNpWarehouses(data);
        setNpLoadingWarehouses(false);
      } else {
        setNpWarehouses([]);
      }
    }
    fetchWarehouses();
  }, [formData.cityRef]);

  const npFilteredWarehouses = useMemo(() => {
    if (!npWarehouseQuery) return npWarehouses;
    if (npWarehouseQuery === formData.warehouse) return [];
    return npWarehouses.filter(w => 
      w.Description.toLowerCase().includes(npWarehouseQuery.toLowerCase())
    );
  }, [npWarehouses, npWarehouseQuery, formData.warehouse]);

  // Custom manual item inputs
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: '' });
  const [selectedProductId, setSelectedProductId] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  async function fetchSales() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
      showToast('Помилка завантаження продажів', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }

  // Statistics calculation
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let counts = { website: 0, olx: 0, instagram: 0, facebook: 0, telegram: 0, tiktok: 0, threads: 0, offline: 0, other: 0 };
    let sums = { website: 0, olx: 0, instagram: 0, facebook: 0, telegram: 0, tiktok: 0, threads: 0, offline: 0, other: 0 };
    
    sales.forEach(sale => {
      const amt = parseFloat(sale.total || 0);
      totalRevenue += amt;
      if (sale.payment_status === 'paid') {
        paidRevenue += amt;
      } else if (sale.payment_status === 'partially_paid') {
        const isCod = !!sale.shipping_details?.is_cod;
        const codAmount = parseFloat(sale.shipping_details?.cod_amount || 0);
        if (isCod && codAmount > 0) {
          paidRevenue += Math.max(0, amt - codAmount);
        } else {
          paidRevenue += amt * 0.3;
        }
      }
      
      const src = sale.source || 'website';
      if (counts[src] !== undefined) {
        counts[src]++;
        sums[src] += amt;
      } else {
        counts.other++;
        sums.other += amt;
      }
    });

    return {
      totalRevenue,
      paidRevenue,
      counts,
      sums
    };
  }, [sales]);

  const periodData = useMemo(() => {
    const groups = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const amt = parseFloat(sale.total || 0);
      const isPaid = sale.payment_status === 'paid';
      
      let key = '';
      let label = '';
      
      if (periodType === 'week') {
        const tempDate = new Date(date);
        const day = tempDate.getDay();
        const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(tempDate.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        key = monday.toISOString().slice(0, 10);
        label = `${monday.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' })} – ${sunday.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
      } else if (periodType === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      } else if (periodType === 'quarter') {
        const q = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${q}`;
        label = `${q}-й квартал ${date.getFullYear()}`;
      }
      
      if (!groups[key]) {
        groups[key] = { label, total: 0, paid: 0, count: 0, key };
      }
      let paidAmt = 0;
      if (sale.payment_status === 'paid') {
        paidAmt = amt;
      } else if (sale.payment_status === 'partially_paid') {
        const isCod = !!sale.shipping_details?.is_cod;
        const codAmount = parseFloat(sale.shipping_details?.cod_amount || 0);
        if (isCod && codAmount > 0) {
          paidAmt = Math.max(0, amt - codAmount);
        } else {
          paidAmt = amt * 0.3;
        }
      }
      
      groups[key].total += amt;
      groups[key].paid += paidAmt;
      groups[key].count++;
    });
    
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [sales, periodType]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const src = s.source || 'website';
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(src);
      const matchesPayment = selectedPayments.length === 0 || selectedPayments.includes(s.payment_status);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
      
      const name = `${s.shipping_details?.firstName || ''} ${s.shipping_details?.lastName || ''} ${s.customers?.first_name || ''} ${s.customers?.last_name || ''}`.toLowerCase();
      const phone = `${s.shipping_details?.phone || ''} ${s.customers?.phone || ''}`;
      const num = s.order_number || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || name.includes(query) || phone.includes(query) || num.toLowerCase().includes(query);

      return matchesSource && matchesPayment && matchesStatus && matchesSearch;
    });
  }, [sales, selectedSources, selectedPayments, selectedStatuses, searchQuery]);

  const handleAddManualItem = () => {
    if (!newItem.name || !newItem.price) {
      showToast('Введіть назву та ціну товару', 'error');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, {
        name: newItem.name,
        quantity: parseInt(newItem.quantity) || 1,
        price: parseFloat(newItem.price) || 0
      }]
    });
    setNewItem({ name: '', quantity: 1, price: '' });
    setSelectedProductId('');
  };

  const handleProductSelect = (prodId) => {
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setNewItem({
        name: prod.name,
        quantity: 1,
        price: prod.price
      });
      setSelectedProductId(prodId);
    }
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0 && !formData.total) {
      showToast('Додайте хоча б один товар або введіть загальну суму', 'error');
      return;
    }

    setSaving(true);
    try {
      // Calculate total if not manually entered
      const itemsTotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const finalTotal = parseFloat(formData.total) || itemsTotal;

      const orderNumber = editingSale?.order_number || `MAN-${formData.source.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const saleData = {
        total: finalTotal,
        status: formData.status,
        payment_status: formData.payment_status,
        shipping_method: formData.city ? 'nova_poshta' : 'pickup',
        source: formData.source,
        order_number: orderNumber,
        shipping_details: {
          ...(editingSale?.shipping_details || {}),
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          warehouse: formData.warehouse,
          items: formData.items,
          is_cod: formData.is_cod,
          cod_amount: formData.is_cod ? (parseFloat(formData.cod_amount) || 0) : 0,
          notes: formData.notes
        }
      };

      if (editingSale) {
        const { error } = await supabase
          .from('orders')
          .update(saleData)
          .eq('id', editingSale.id);
        if (error) throw error;
        showToast('Продаж оновлено успішно!');
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([saleData]);
        if (error) throw error;
        showToast('Продаж додано успішно!');
      }

      setShowAddForm(false);
      setEditingSale(null);
      resetForm();
      fetchSales();
    } catch (err) {
      console.error('Error saving sale:', err);
      showToast(`Помилка при збереженні: ${err.message || err.details || JSON.stringify(err)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      source: sale.source || 'olx',
      firstName: sale.shipping_details?.firstName || '',
      lastName: sale.shipping_details?.lastName || '',
      phone: sale.shipping_details?.phone || '',
      city: sale.shipping_details?.city || '',
      warehouse: sale.shipping_details?.warehouse || '',
      total: sale.total || '',
      payment_status: sale.payment_status || 'paid',
      status: sale.status || 'completed',
      items: sale.shipping_details?.items || [],
      is_cod: sale.shipping_details?.is_cod || false,
      cod_amount: sale.shipping_details?.cod_amount || '',
      notes: sale.shipping_details?.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей запис про продаж?')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      showToast('Запис видалено');
      fetchSales();
    } catch (err) {
      console.error(err);
      showToast(`Помилка видалення: ${err.message || err.details || JSON.stringify(err)}`, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      source: 'olx',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      cityRef: '',
      warehouse: '',
      total: '',
      payment_status: 'pending',
      status: 'new',
      items: [],
      is_cod: false,
      cod_amount: '',
      notes: ''
    });
    setNewItem({ name: '', quantity: 1, price: '' });
    setSelectedProductId('');
    setEditingSale(null);
    setItemTab('catalog');
    setNpCityQuery('');
    setNpCities([]);
    setNpShowCities(false);
    setNpWarehouseQuery('');
    setNpWarehouses([]);
    setNpShowWarehouses(false);
  };

  const handleQuickFill = () => {
    setFormData({
      ...formData,
      firstName: 'Гість',
      lastName: getPlatformBadgeName(formData.source),
      phone: '+380000000000',
      city: 'Самовивіз'
    });
  };

  const getPlatformBadgeColor = (plat) => {
    const p = plat?.toLowerCase();
    if (p === 'website') return '#3b82f6';
    if (p === 'olx') return '#23e5db';
    if (p === 'instagram') return '#f43f5e';
    if (p === 'facebook') return '#1877f2';
    if (p === 'telegram') return '#0ea5e9';
    if (p === 'tiktok') return '#ff0050';
    if (p === 'threads') return '#ffffff';
    if (p === 'offline') return '#22c55e';
    return '#a855f7';
  };

  const getPlatformBadgeName = (plat) => {
    const p = plat?.toLowerCase();
    if (p === 'website') return 'Сайт';
    if (p === 'olx') return 'OLX';
    if (p === 'instagram') return 'Instagram';
    if (p === 'facebook') return 'Facebook';
    if (p === 'telegram') return 'Telegram';
    if (p === 'tiktok') return 'TikTok';
    if (p === 'threads') return 'Threads';
    if (p === 'offline') return 'Магазин (офлайн)';
    return 'Інше';
  };

  const productOptions = useMemo(() => {
    const addedNames = new Set(formData.items.map(item => item.name));
    return [
      { value: '', label: '-- Виберіть наявний товар --' },
      ...products
        .filter(p => !addedNames.has(p.name))
        .map(p => ({ value: p.id, label: `${p.name} (${p.price} ₴)` }))
    ];
  }, [products, formData.items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coins size={28} style={{ color: '#2dd4bf' }} /> Кабінет Продажів
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Облік всіх продажів (сайт, соцмережі, маркетплейси, офлайн)</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddForm(true); }}
          style={{ 
            padding: '12px 24px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)', color: '#fff',
            fontWeight: 850, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(45,212,191,0.2)'
          }}
        >
          <Plus size={18} /> ДОДАТИ ПРОДАЖ
        </button>
      </div>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        
        {/* Total Revenue Card */}
        <div style={{ background: 'linear-gradient(135deg, #0e1e38, #0a192f)', borderRadius: 24, border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Загальна каса (Всі канали)</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,212,191,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 950, color: '#fff' }}>{stats.totalRevenue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 8, fontWeight: 700 }}>Всього замовлень та продажів: {sales.length}</div>
        </div>

        {/* Paid Revenue Card */}
        <div style={{ background: 'linear-gradient(135deg, #062319, #0a192f)', borderRadius: 24, border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Оплачено (Отримано)</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 950, color: '#4ade80' }}>{stats.paidRevenue.toLocaleString('uk-UA')} ₴</div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 8, fontWeight: 700 }}>Очікує оплати: {(stats.totalRevenue - stats.paidRevenue).toLocaleString('uk-UA')} ₴</div>
        </div>

        {/* Platform breakdown Card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Продажі за джерелами</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(stats.sums).map(key => {
              if (stats.sums[key] === 0) return null;
              return (
                <div key={key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 750 }}>
                  <span style={{ color: getPlatformBadgeColor(key), marginRight: 6 }}>●</span>
                  {getPlatformBadgeName(key)}: <strong style={{ color: '#fff' }}>{stats.sums[key]} ₴</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Period Analytics */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={22} style={{ color: '#8b5cf6' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Аналітика за періодами</h2>
          </div>
          
          {/* Period selector tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', alignSelf: isMobile ? 'flex-start' : 'auto' }}>
            {[
              { type: 'week', label: 'По тижнях' },
              { type: 'month', label: 'По місяцях' },
              { type: 'quarter', label: 'По кварталах' }
            ].map(tab => (
              <button
                key={tab.type}
                onClick={() => setPeriodType(tab.type)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  background: periodType === tab.type ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                  color: periodType === tab.type ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of periods */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {periodData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Немає даних для відображення статистики.</div>
          ) : (
            periodData.slice(0, 6).map(item => {
              const paidPercent = item.total > 0 ? (item.paid / item.total) * 100 : 0;
              return (
                <div key={item.key} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 700 }}>
                        {item.count} {item.count === 1 ? 'продаж' : item.count < 5 ? 'продажі' : 'продажів'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>{item.total.toLocaleString('uk-UA')} ₴</div>
                      <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2, fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span>Оплачено: {item.paid.toLocaleString('uk-UA')} ₴</span>
                        {item.total - item.paid > 0 && (
                          <span style={{ color: '#fbbf24' }}>Очікує: {(item.total - item.paid).toLocaleString('uk-UA')} ₴</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    {/* Unpaid base overlay (violet) */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'rgba(139,92,246,0.25)', borderRadius: 3 }} />
                    {/* Paid overlay (teal) */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${paidPercent}%`, background: '#2dd4bf', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Пошук клієнта, телефону чи номера замовлення..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} 
          />
        </div>

        {/* Multi-Select Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Блок шаблонів фільтрів */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={14} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Шаблони фільтрів</span>
              </div>
              
              {/* Швидке створення шаблону */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="text" 
                  placeholder="Назва шаблону..." 
                  value={newSalesTemplateName}
                  onChange={(e) => setNewSalesTemplateName(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: 11, outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => saveSalesFilterTemplate(newSalesTemplateName)}
                  disabled={!newSalesTemplateName.trim()}
                  style={{ padding: '6px 12px', borderRadius: 10, background: newSalesTemplateName.trim() ? '#7c3aed' : 'rgba(255,255,255,0.02)', color: newSalesTemplateName.trim() ? '#fff' : '#6b6b8a', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Зберегти поточні
                </button>
              </div>
            </div>

            {/* Список існуючих шаблонів */}
            {salesFilterTemplates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {salesFilterTemplates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => applySalesTemplate(t)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', 
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                  >
                    <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{t.name}</span>
                    
                    {/* Зірочка за замовчуванням */}
                    <button 
                      type="button"
                      onClick={(e) => toggleSalesTemplateDefault(t.id, e)}
                      title={t.isDefault ? "Використовується при відкритті" : "Встановити за замовчуванням при відкритті"}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: 11, color: t.isDefault ? '#fbbf24' : '#4a4a6a' }}>
                        {t.isDefault ? '★' : '☆'}
                      </span>
                    </button>

                    {/* Видалити */}
                    <button 
                      type="button"
                      onClick={(e) => deleteSalesFilterTemplate(t.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, display: 'flex', alignItems: 'center', fontSize: 10 }}
                      title="Видалити шаблон"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Source/Channel Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Джерело замовлення (можна обрати декілька):</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { val: 'Всі', label: 'ВСІ', color: '#6b6b8a' },
                { val: 'website', label: 'САЙТ', color: '#3b82f6' },
                { val: 'olx', label: 'OLX', color: '#23e5db' },
                { val: 'instagram', label: 'INSTAGRAM', color: '#f43f5e' },
                { val: 'facebook', label: 'FACEBOOK', color: '#1877f2' },
                { val: 'telegram', label: 'TELEGRAM', color: '#0ea5e9' },
                { val: 'tiktok', label: 'TIKTOK', color: '#ff0050' },
                { val: 'threads', label: 'THREADS', color: '#ffffff' },
                { val: 'offline', label: 'ОФЛАЙН', color: '#22c55e' },
                { val: 'other', label: 'ІНШЕ', color: '#a855f7' }
              ].map(item => {
                const active = item.val === 'Всі' 
                  ? selectedSources.length === 0 
                  : selectedSources.includes(item.val);
                return (
                  <button 
                    key={item.val} 
                    onClick={() => toggleSourceFilter(item.val)} 
                    style={{ 
                      padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                      background: active ? item.color : 'rgba(255,255,255,0.03)', 
                      color: active ? '#fff' : 'var(--text-muted)', 
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Payment Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Статус оплати (можна обрати декілька):</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { val: 'Всі', label: 'ВСІ' },
                { val: 'pending', label: 'ОЧІКУЄ' },
                { val: 'verifying', label: 'ПЕРЕВІРКА' },
                { val: 'partially_paid', label: 'ЧАСТКОВО' },
                { val: 'paid', label: 'ОПЛАЧЕНО' }
              ].map(item => {
                const active = item.val === 'Всі' 
                  ? selectedPayments.length === 0 
                  : selectedPayments.includes(item.val);
                return (
                  <button 
                    key={item.val} 
                    onClick={() => togglePaymentFilter(item.val)} 
                    style={{ 
                      padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                      background: active ? '#f97316' : 'rgba(255,255,255,0.03)', 
                      color: active ? '#fff' : 'var(--text-muted)', 
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Статус замовлення (можна обрати декілька):</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { val: 'Всі', label: 'ВСІ', color: '#6b6b8a', icon: null },
                ...Object.keys(STATUS_META).map(key => ({
                  val: key,
                  label: STATUS_META[key].label.toUpperCase(),
                  color: STATUS_META[key].color,
                  icon: STATUS_META[key].icon
                }))
              ].map(item => {
                const Icon = item.icon;
                const active = item.val === 'Всі' 
                  ? selectedStatuses.length === 0 
                  : selectedStatuses.includes(item.val);
                return (
                  <button 
                    key={item.val} 
                    onClick={() => toggleStatusFilter(item.val)} 
                    style={{ 
                      padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                      background: active ? item.color : 'rgba(255,255,255,0.03)', 
                      color: active ? '#fff' : 'var(--text-muted)', 
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {Icon && <Icon size={12} />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sales List Container */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
              Продажів не знайдено.
            </div>
          ) : (
            filteredSales.map(sale => {
              const clientName = `${sale.shipping_details?.firstName || ''} ${sale.shipping_details?.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
              const clientPhone = sale.shipping_details?.phone || sale.customers?.phone || 'Не вказано';
              
              return (
                <div key={sale.id} style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  
                  {/* Header: Date and Platform */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                      {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                    </span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 900, 
                      color: getPlatformBadgeColor(sale.source),
                      background: 'rgba(255,255,255,0.05)',
                      padding: '4px 8px',
                      borderRadius: 8
                    }}>
                      {getPlatformBadgeName(sale.source)}
                    </span>
                  </div>

                  {/* Order Number & Client */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 900, marginBottom: 2 }}>НОМЕР ЗАМОВЛЕННЯ</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{sale.order_number || `#${sale.id.slice(0, 8)}`}</div>
                  </div>

                  {/* Client Info */}
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{clientName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Тел: {clientPhone}</div>
                    {sale.shipping_details?.city && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Доставка: {sale.shipping_details.city} {sale.shipping_details.warehouse ? `(${sale.shipping_details.warehouse})` : ''}</div>
                    )}
                    {sale.shipping_details?.notes && (
                      <div style={{ 
                        marginTop: 6, padding: '6px 10px', borderRadius: 10, 
                        background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)',
                        color: '#fbbf24', fontSize: 11, fontWeight: 750, display: 'flex', gap: 6, alignItems: 'center'
                      }}>
                        <span>⚠️ {sale.shipping_details.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  {sale.shipping_details?.items && sale.shipping_details.items.length > 0 && (
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 900, marginBottom: 6, textTransform: 'uppercase' }}>Товари ({sale.shipping_details.items.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sale.shipping_details.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{item.name} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>x{item.quantity}</span></span>
                            <span style={{ fontWeight: 800 }}>{item.price * item.quantity} ₴</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial block */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 16 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 850, textTransform: 'uppercase', marginBottom: 4 }}>Сума</div>
                      <div style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>{sale.total} ₴</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 850, textTransform: 'uppercase', marginBottom: 4 }}>Оплата</div>
                      <div style={{ 
                        fontSize: 9, fontWeight: 900, display: 'inline-block', padding: '4px 6px', borderRadius: 6,
                        background: sale.payment_status === 'paid' ? 'rgba(34,197,94,0.15)' : sale.payment_status === 'partially_paid' ? 'rgba(14,165,233,0.15)' : sale.payment_status === 'verifying' ? 'rgba(249,115,22,0.15)' : 'rgba(245,158,11,0.15)',
                        color: sale.payment_status === 'paid' ? '#22c55e' : sale.payment_status === 'partially_paid' ? '#38bdf8' : sale.payment_status === 'verifying' ? '#f97316' : '#fbbf24',
                        textAlign: 'center', width: '100%', boxSizing: 'border-box', whiteSpace: 'nowrap'
                      }}>
                        {sale.payment_status === 'paid' ? 'ОПЛ.' : sale.payment_status === 'partially_paid' ? 'ЧАСТ.' : sale.payment_status === 'verifying' ? 'ПЕРЕВ.' : 'ОЧІК.'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 850, textTransform: 'uppercase', marginBottom: 4 }}>Статус</div>
                      {(() => {
                        const meta = STATUS_META[sale.status] || STATUS_META.new;
                        const Icon = meta.icon;
                        return (
                          <div style={{ 
                            fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 6px', borderRadius: 6,
                            background: meta.bg, color: meta.color, textAlign: 'center', width: '100%', boxSizing: 'border-box', whiteSpace: 'nowrap',
                            textTransform: 'uppercase'
                          }}>
                            <Icon size={10} />
                            <span>{meta.label === 'Відправлено поштою' ? 'ВІДПР.' : meta.label.toUpperCase()}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
                    <button 
                      onClick={() => handleEdit(sale)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Edit3 size={14} /> Редагувати
                    </button>
                    <button 
                      onClick={() => handleDelete(sale.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДАТА</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДЖЕРЕЛО</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>НОМЕР</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>КЛІЄНТ</th>
                  <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ТОВАРИ</th>
                  <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>СУМА</th>
                  <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ОПЛАТА</th>
                  <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>СТАТУС</th>
                  <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                      Продажів не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => {
                    const clientName = `${sale.shipping_details?.firstName || ''} ${sale.shipping_details?.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
                    const clientPhone = sale.shipping_details?.phone || sale.customers?.phone || '—';

                    return (
                      <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700 }}>
                          {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            fontSize: 11, fontWeight: 900, 
                            color: getPlatformBadgeColor(sale.source),
                            background: 'rgba(255,255,255,0.05)',
                            padding: '4px 8px', borderRadius: 8
                          }}>
                            {getPlatformBadgeName(sale.source)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 900 }}>
                          {sale.order_number || `#${sale.id.slice(0, 8)}`}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{clientName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{clientPhone}</div>
                          {sale.shipping_details?.notes && (
                            <div style={{ 
                              marginTop: 6, padding: '4px 8px', borderRadius: 8, 
                              background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)',
                              color: '#fbbf24', fontSize: 11, fontWeight: 700, display: 'inline-flex', gap: 4, alignItems: 'center'
                            }}>
                              <span>⚠️ {sale.shipping_details.notes}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 12, maxWidth: 220 }}>
                          {sale.shipping_details?.items?.map((item, idx) => (
                            <div key={idx} style={{ color: '#fff', fontSize: 12 }}>
                              • {item.name} <strong style={{ color: '#8b5cf6' }}>x{item.quantity}</strong>
                            </div>
                          )) || '—'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#2dd4bf' }}>
                          {sale.total} ₴
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 6,
                            background: sale.payment_status === 'paid' ? 'rgba(34,197,94,0.15)' : sale.payment_status === 'partially_paid' ? 'rgba(14,165,233,0.15)' : sale.payment_status === 'verifying' ? 'rgba(249,115,22,0.15)' : 'rgba(245,158,11,0.15)',
                            color: sale.payment_status === 'paid' ? '#22c55e' : sale.payment_status === 'partially_paid' ? '#38bdf8' : sale.payment_status === 'verifying' ? '#f97316' : '#fbbf24'
                          }}>
                            {sale.payment_status === 'paid' ? 'ОПЛАЧЕНО' : sale.payment_status === 'partially_paid' ? 'ЧАСТКОВО ОПЛАЧЕНО' : sale.payment_status === 'verifying' ? 'ПЕРЕВІРКА' : 'ОЧІКУЄ'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          {(() => {
                            const meta = STATUS_META[sale.status] || STATUS_META.new;
                            const Icon = meta.icon;
                            return (
                              <span style={{ 
                                fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 6,
                                background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 4,
                                textTransform: 'uppercase'
                              }}>
                                <Icon size={12} />
                                {meta.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleEdit(sale)}
                              style={{ border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(sale.id)}
                              style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, padding: 6, cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div 
            onClick={() => {
              // Any general outer click defaults
            }}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.85)', 
              backdropFilter: 'blur(10px)', 
              zIndex: 1000, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 20px',
              overflowY: 'auto'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: '#0a192f', 
                borderRadius: 32, 
                padding: 32, 
                width: '100%', 
                maxWidth: 540, 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', 
                overflow: 'visible',
                margin: 'auto 0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>{editingSale ? 'Редагувати запис' : 'Новий запис про продаж'}</h2>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {/* Platform select using ThemeSelect */}
                    <ThemeSelect 
                      label="Канал продажу"
                      value={formData.source}
                      onChange={(val) => setFormData({ ...formData, source: val })}
                      displayValue={getPlatformBadgeName(formData.source)}
                      options={[
                        { value: 'olx', label: 'OLX' },
                        { value: 'instagram', label: 'Instagram' },
                        { value: 'facebook', label: 'Facebook' },
                        { value: 'telegram', label: 'Telegram' },
                        { value: 'tiktok', label: 'TikTok' },
                        { value: 'threads', label: 'Threads' },
                        { value: 'offline', label: 'Магазин (офлайн)' },
                        { value: 'other', label: 'Інше' }
                      ]}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleQuickFill}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)',
                      color: '#2dd4bf', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                      cursor: 'pointer', transition: 'all 0.2s', height: 41, whiteSpace: 'nowrap'
                    }}
                  >
                    <Sparkles size={14} /> Заповнити як Гість
                  </button>
                </div>

                {/* Client Info */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Ім'я</label>
                    <input 
                      type="text" placeholder="Дмитро" value={formData.firstName} 
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Прізвище</label>
                    <input 
                      type="text" placeholder="Коваленко" value={formData.lastName} 
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Телефон</label>
                    <input 
                      type="text" placeholder="+380" value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Місто доставки</label>
                    <input 
                      type="text" placeholder="Почніть вводити місто..." value={npCityQuery || formData.city} 
                      onChange={e => { setNpCityQuery(e.target.value); setNpShowCities(true); }}
                      onFocus={() => { if (npCities.length > 0) setNpShowCities(true); }}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: npShowCities && npCities.length > 0 ? '1px solid #7c3aed' : '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                    />
                    {npLoadingCities && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 12, bottom: 14, color: '#7c3aed' }} />}
                    
                    <AnimatePresence>
                      {npShowCities && npCities.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#1e293b', borderRadius: 14, border: '1px solid rgba(124,58,237,0.4)', marginTop: 6, maxHeight: 200, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: 6 }}
                          className="hide-scrollbar"
                        >
                          {npCities.map(city => (
                            <button
                              key={city.Ref} type="button"
                              onClick={() => {
                                setFormData({ ...formData, city: city.Description, cityRef: city.Ref, warehouse: '' });
                                setNpCityQuery(city.Description);
                                setNpShowCities(false);
                                setNpWarehouseQuery('');
                              }}
                              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {city.Description} <span style={{ color: '#6b6b8a', fontSize: 11 }}>({city.AreaDescription})</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Warehouse / Post office selection */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                    Відділення / Поштомат
                    {formData.cityRef && !npLoadingWarehouses && npWarehouses.length > 0 && (
                      <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 6 }}>({npWarehouses.length} знайдено)</span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    placeholder={formData.cityRef ? "Пошук відділення або поштомату..." : "Спочатку оберіть місто..."} 
                    value={npWarehouseQuery || formData.warehouse || ''} 
                    onChange={e => { setNpWarehouseQuery(e.target.value); setNpShowWarehouses(true); }}
                    onFocus={() => { if (formData.cityRef) setNpShowWarehouses(true); }}
                    disabled={!formData.cityRef}
                    style={{ 
                      width: '100%', background: 'rgba(0,0,0,0.3)', 
                      border: npShowWarehouses && npFilteredWarehouses.length > 0 ? '1px solid #7c3aed' : '1px solid var(--border)', 
                      borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none',
                      opacity: formData.cityRef ? 1 : 0.5,
                      transition: 'border-color 0.2s'
                    }}
                  />
                  {npLoadingWarehouses && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 12, bottom: 14, color: '#7c3aed' }} />}
                  
                  <AnimatePresence>
                    {npShowWarehouses && formData.cityRef && (
                      <motion.div 
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90, background: '#1e293b', borderRadius: 14, border: '1px solid rgba(124,58,237,0.4)', marginTop: 6, maxHeight: 250, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: 6 }}
                        className="hide-scrollbar"
                      >
                        {npLoadingWarehouses ? (
                          <div style={{ padding: 16, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>Завантаження відділень...</div>
                        ) : npFilteredWarehouses.length > 0 ? (
                          npFilteredWarehouses.map(wh => (
                            <button
                              key={wh.Ref} type="button"
                              onClick={() => {
                                setFormData({ ...formData, warehouse: wh.Description });
                                setNpWarehouseQuery(wh.Description);
                                setNpShowWarehouses(false);
                              }}
                              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 12, borderRadius: 8, cursor: 'pointer', lineHeight: 1.4, fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {wh.Description}
                            </button>
                          ))
                        ) : (
                          <div style={{ padding: 16, textAlign: 'center', color: '#6b6b8a', fontSize: 13 }}>Нічого не знайдено</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, overflow: 'visible' }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>Склад кошика замовлення</label>
                  
                  {/* Existing items list */}
                  {formData.items.length > 0 ? (
                    <div style={{ 
                      display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16,
                      background: 'rgba(45, 212, 191, 0.03)', border: '1px solid rgba(45, 212, 191, 0.15)',
                      padding: 12, borderRadius: 14
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#2dd4bf', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBag size={12} /> ВАШ КОШИК ({formData.items.length})
                      </div>
                      {formData.items.map((item, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', alignItems: 'center', justifyBehavior: 'space-between', gap: 12, 
                          background: 'rgba(0,0,0,0.15)', padding: '10px 12px', borderRadius: 10, 
                          fontSize: 12, border: '1px solid rgba(255,255,255,0.02)' 
                        }}>
                          <CheckCircle2 size={12} style={{ color: '#2dd4bf', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontWeight: 650, lineHeight: '1.4' }}>
                            {item.name}
                          </div>
                          
                          {/* Quantity Controls and Price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <button 
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.items];
                                  if (updated[idx].quantity > 1) {
                                    updated[idx].quantity -= 1;
                                    setFormData({ ...formData, items: updated });
                                  } else {
                                    handleRemoveItem(idx);
                                  }
                                }}
                                style={{ width: 20, height: 20, border: 'none', background: 'transparent', color: '#6b6b8a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
                              >
                                -
                              </button>
                              <span style={{ minWidth: 16, textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                                {item.quantity}
                              </span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.items];
                                  updated[idx].quantity += 1;
                                  setFormData({ ...formData, items: updated });
                                }}
                                style={{ width: 20, height: 20, border: 'none', background: 'transparent', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
                              >
                                +
                              </button>
                            </div>
                            <span style={{ fontWeight: 800, color: '#2dd4bf', whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>
                              {item.price * item.quantity} ₴
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(idx)} 
                              style={{ 
                                background: 'none', border: 'none', color: '#ef4444', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                              }}
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Cart Total Display */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, pt: 8, borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 900, color: '#fff' }}>
                        <span>РАЗОМ КОШИК:</span>
                        <span style={{ color: '#2dd4bf', fontSize: 13 }}>
                          {formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)} ₴
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', padding: '20px 12px', borderRadius: 14, 
                      background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border)',
                      color: 'var(--text-muted)', fontSize: 12, marginBottom: 16
                    }}>
                      Кошик порожній. Додайте товари нижче.
                    </div>
                  )}

                  {/* Tab Selector */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => setItemTab('catalog')}
                      style={{
                        flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                        background: itemTab === 'catalog' ? 'rgba(124,58,237,0.2)' : 'transparent',
                        color: itemTab === 'catalog' ? '#a78bfa' : '#6b6b8a',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      З каталогу
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemTab('manual')}
                      style={{
                        flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                        background: itemTab === 'manual' ? 'rgba(124,58,237,0.2)' : 'transparent',
                        color: itemTab === 'manual' ? '#a78bfa' : '#6b6b8a',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      Власний товар
                    </button>
                  </div>

                  {/* Add item to form fields based on Tab */}
                  {itemTab === 'catalog' ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <ThemeSelect 
                          value={selectedProductId}
                          onChange={(prodId) => {
                            if (!prodId) return;
                            const prod = products.find(p => p.id === prodId);
                            if (prod) {
                              // Direct fast add to the cart
                              setFormData({
                                ...formData,
                                items: [...formData.items, { name: prod.name, price: prod.price, quantity: 1 }]
                              });
                              showToast(`Додано: ${prod.name}`);
                              setSelectedProductId('');
                            }
                          }}
                          displayValue=""
                          placeholder="-- Оберіть товар з каталогу --"
                          options={productOptions}
                          inline={true}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <input 
                            type="text" placeholder="Назва власного товару..." value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none' }}
                          />
                        </div>
                        <input 
                          type="text" inputMode="numeric" placeholder="Кількість" value={newItem.quantity}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setNewItem({ ...newItem, quantity: val });
                          }}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }}
                        />
                        <input 
                          type="text" inputMode="decimal" placeholder="Ціна (₴)" value={newItem.price}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setNewItem({ ...newItem, price: val });
                          }}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddManualItem}
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(45,212,191,0.15))', 
                          color: '#fff', border: '1px solid rgba(45,212,191,0.2)', padding: 12, borderRadius: 12, 
                          fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.2s'
                        }}
                      >
                        <Plus size={14} style={{ color: '#2dd4bf' }} /> ДОДАТИ ДО КОШИКА
                      </button>
                    </div>
                  )}
                </div>

                {/* Financial overview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, overflow: 'visible' }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Сума (₴) (залишіть пустим для авто-розрахунку)</label>
                    <input 
                      type="text" inputMode="decimal" placeholder="Наприклад: 1200" value={formData.total} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setFormData({ ...formData, total: val });
                      }}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  
                  <ThemeSelect 
                    label="Оплата"
                    value={formData.payment_status}
                    onChange={(val) => {
                      const updated = { payment_status: val };
                      if (val === 'partially_paid') {
                        updated.is_cod = true;
                        const calculatedTotal = parseFloat(formData.total) || formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                        updated.cod_amount = Math.round(calculatedTotal * 0.7).toString();
                      } else {
                        updated.is_cod = false;
                        updated.cod_amount = '';
                      }
                      setFormData({ ...formData, ...updated });
                    }}
                    displayValue={formData.payment_status === 'paid' ? 'Оплачено' : formData.payment_status === 'partially_paid' ? 'Частково оплачено' : formData.payment_status === 'pending' ? 'Очікує' : 'Перевірка'}
                    options={[
                      { value: 'paid', label: 'Оплачено' },
                      { value: 'partially_paid', label: 'Частково оплачено' },
                      { value: 'pending', label: 'Очікує' },
                      { value: 'verifying', label: 'Перевірка' }
                    ]}
                  />
                </div>

                {/* Накладений платіж */}
                {formData.payment_status === 'partially_paid' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16 }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        const newIsCod = !formData.is_cod;
                        let newCodAmount = formData.cod_amount;
                        if (newIsCod && !newCodAmount) {
                          const calculatedTotal = parseFloat(formData.total) || formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                          newCodAmount = Math.round(calculatedTotal * 0.7).toString();
                        }
                        setFormData({ ...formData, is_cod: newIsCod, cod_amount: newCodAmount });
                      }}
                    >
                      <div style={{ width: 18, height: 18, border: '2px solid #7c3aed', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.is_cod ? '#7c3aed' : 'transparent', transition: 'all 0.2s' }}>
                        {formData.is_cod && <CheckCircle2 size={12} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 750, color: '#fff' }}>Накладений платіж (наложка)</span>
                    </div>

                    {formData.is_cod && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Сума наложки (₴)</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            type="text" inputMode="decimal" placeholder="Наприклад: 840" value={formData.cod_amount} 
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setFormData({ ...formData, cod_amount: val });
                            }}
                            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none' }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const calculatedTotal = parseFloat(formData.total) || formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                              const calculated = Math.round(calculatedTotal * 0.7);
                              setFormData({ ...formData, cod_amount: calculated.toString() });
                            }}
                            style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            70%
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                <ThemeSelect 
                  label="Статус замовлення"
                  value={formData.status}
                  onChange={(val) => {
                    const updated = { status: val };
                    if (val === 'completed') {
                      updated.payment_status = 'paid';
                    }
                    setFormData({ ...formData, ...updated });
                  }}
                  displayValue={STATUS_META[formData.status]?.label || STATUS_META.new.label}
                  options={Object.keys(STATUS_META).map(key => ({ value: key, label: STATUS_META[key].label }))}
                />

                {/* Уточнення / Нотатки */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Уточнення / Нотатки до замовлення</label>
                  <textarea 
                    placeholder="Наприклад: клієнт просив інший колір, відправити подарунком тощо..." 
                    value={formData.notes || ''} 
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Submit buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{ flex: 1, padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'ЗБЕРЕЖЕННЯ...' : 'ЗБЕРЕГТИ'}
                  </button>
                  <button 
                    type="button"                     onClick={() => setShowAddForm(false)} 
                    style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                  >
                    СКАСУВАТИ
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
