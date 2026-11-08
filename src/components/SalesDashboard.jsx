"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { novaPoshta } from '@/lib/novaposhta';
import OrderKanbanBoard from '@/components/OrderKanbanBoard';
import { 
  Coins, Search, Plus, Trash2, ShoppingBag, 
  Edit3, X, ChevronDown, ChevronUp, 
  CheckCircle2, Loader2, Filter, 
  Clock, ClipboardList, Printer, Truck, Send, XCircle, Sparkles, Copy,
  LayoutGrid, List, Palette, Star, ClipboardPaste, UserCheck, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FILAMENT_COLORS, 
  QUICK_ITEM_TAGS, 
  QUICK_ORDER_NOTES, 
  getColorMeta, 
  parseSmartShippingText 
} from '@/lib/orderHelpers';

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', background: 'rgba(0,0,0,0.3)', border: isOpen ? '1px solid #7c3aed' : '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', 
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
              zIndex: inline ? 1 : 1000, padding: 6, maxHeight: 220, overflowY: 'auto', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}
          >
            {options.filter(opt => opt.value !== '').map(opt => {
              const isDisabled = opt.disabled || opt.isHeader || (typeof opt.value === 'string' && opt.value.startsWith('header-'));
              if (isDisabled) {
                return (
                  <div 
                    key={opt.value || opt.label}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      padding: '8px 12px', fontSize: 11, fontWeight: 900, color: '#a78bfa', 
                      background: 'rgba(124, 58, 237, 0.12)', borderRadius: 6, marginTop: 4, marginBottom: 2,
                      cursor: 'default', userSelect: 'none'
                    }}
                  >
                    {opt.label}
                  </div>
                );
              }

              return (
                <div 
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                  style={{ 
                    padding: '10px 14px', fontSize: 13, color: '#fff', borderRadius: 8, cursor: 'pointer', 
                    fontWeight: value === opt.value ? 800 : 500, 
                    background: value === opt.value ? 'rgba(124,58,237,0.2)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_META = {
  new: { label: 'Нове', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Clock },
  preparing: { label: 'Підготовка', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: ClipboardList },
  printing: { label: 'Друкується', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: Printer },
  painting: { label: 'Розфарбовується', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Palette },
  shipping: { label: 'Готово до відправки', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: Truck },
  shipped: { label: 'Відправлено поштою', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Send },
  completed: { label: 'Виконано', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle2 },
  cancelled: { label: 'Скасовано', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle }
};

const CHANNELS = [
  { value: 'instagram', label: 'Instagram', color: '#f43f5e' },
  { value: 'telegram', label: 'Telegram', color: '#0ea5e9' },
  { value: 'olx', label: 'OLX', color: '#23e5db' },
  { value: 'tiktok', label: 'TikTok', color: '#ff0050' },
  { value: 'threads', label: 'Threads', color: '#e2e8f0' },
  { value: 'website', label: 'Сайт', color: '#3b82f6' },
  { value: 'facebook', label: 'Facebook', color: '#1877f2' },
  { value: 'offline', label: 'Офлайн', color: '#22c55e' },
  { value: 'other', label: 'Інше', color: '#a855f7' }
];

export default function SalesDashboard({ showToast, externalOpenAdd, onClearExternalOpenAdd, onOrdersChanged }) {
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  const [showAddForm, setShowAddForm] = useState(false);
  const [ads, setAds] = useState([]);
  const [expandedSalesIds, setExpandedSalesIds] = useState([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Smart paste state
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [pendingWarehouseNumber, setPendingWarehouseNumber] = useState('');

  // Active item index for editing colors/notes inside the cart
  const [openColorEditorIdx, setOpenColorEditorIdx] = useState(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Form state
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    source: 'instagram',
    shipping_method: 'nova_poshta',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    cityRef: '',
    warehouse: '',
    total: '',
    payment_status: 'pending',
    status: 'new',
    items: [], // array of { product_id, name, quantity, price, colors: [], item_note: '', is_manufactured: false }
    is_cod: false,
    prepayment_amount: '',
    cod_amount: '',
    notes: '',
    is_priority: false,
    sold_via_ad: false,
    attributed_ad_id: ''
  });

  const [itemTab, setItemTab] = useState('catalog'); // 'catalog' | 'manual'
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: '', colors: [], item_note: '' });

  // Nova Poshta autocomplete states
  const [npCityQuery, setNpCityQuery] = useState('');
  const [npCities, setNpCities] = useState([]);
  const [npLoadingCities, setNpLoadingCities] = useState(false);
  const [npShowCities, setNpShowCities] = useState(false);
  const [npWarehouses, setNpWarehouses] = useState([]);
  const [npWarehouseQuery, setNpWarehouseQuery] = useState('');
  const [npLoadingWarehouses, setNpLoadingWarehouses] = useState(false);
  const [npShowWarehouses, setNpShowWarehouses] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('buba_sales_view_mode');
      if (savedView) setViewMode(savedView);
      const saved = localStorage.getItem('buba_sales_filter_templates');
      if (saved) {
        try {
          const templates = JSON.parse(saved);
          setSalesFilterTemplates(templates);
          const defaultTemplate = templates.find(t => t.isDefault);
          if (defaultTemplate) {
            setSelectedSources(defaultTemplate.selectedSources || []);
            setSelectedPayments(defaultTemplate.selectedPayments || []);
            setSelectedStatuses(defaultTemplate.selectedStatuses || []);
          }
        } catch (_) {}
      }
    }
  }, []);

  // External trigger from AdminPanel mobile bottom bar
  useEffect(() => {
    if (externalOpenAdd) {
      resetForm();
      setShowAddForm(true);
      onClearExternalOpenAdd?.();
    }
  }, [externalOpenAdd]);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchAds();
  }, []);

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
    }, 350);
    return () => clearTimeout(timer);
  }, [npCityQuery, formData.city]);

  // Warehouse fetch effect
  useEffect(() => {
    async function fetchWarehouses() {
      if (formData.cityRef) {
        setNpLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(formData.cityRef);
        setNpWarehouses(data || []);
        setNpLoadingWarehouses(false);

        // If Smart Paste set a pending warehouse number, match it automatically!
        if (pendingWarehouseNumber && Array.isArray(data) && data.length > 0) {
          const numStr = String(pendingWarehouseNumber);
          const exactMatch = data.find(w => 
            String(w.Number) === numStr || 
            new RegExp(`(?:№|відділення|поштомат)\\s*${numStr}\\b`, 'i').test(w.Description)
          );
          if (exactMatch) {
            setFormData(prev => ({ ...prev, warehouse: exactMatch.Description }));
            setNpWarehouseQuery(exactMatch.Description);
          }
          setPendingWarehouseNumber('');
        }
      } else {
        setNpWarehouses([]);
      }
    }
    fetchWarehouses();
  }, [formData.cityRef, pendingWarehouseNumber]);

  const npFilteredWarehouses = useMemo(() => {
    if (!npWarehouses || !Array.isArray(npWarehouses)) return [];
    if (!npWarehouseQuery || npWarehouseQuery === formData.warehouse) return npWarehouses;
    return npWarehouses.filter(w => 
      w && w.Description && String(w.Description).toLowerCase().includes(String(npWarehouseQuery).toLowerCase())
    );
  }, [npWarehouses, npWarehouseQuery, formData.warehouse]);

  // Previous customers index for quick autofill
  const knownCustomers = useMemo(() => {
    const map = new Map();
    sales.forEach(s => {
      const d = s.shipping_details || {};
      const phone = (d.phone || s.customers?.phone || '').trim();
      const firstName = (d.firstName || s.customers?.first_name || '').trim();
      const lastName = (d.lastName || s.customers?.last_name || '').trim();
      if (!phone && !firstName) return;
      if (firstName === 'Гість') return;
      const key = phone || `${firstName}_${lastName}`;
      if (!map.has(key)) {
        map.set(key, {
          firstName,
          lastName,
          phone,
          city: d.city || '',
          cityRef: d.cityRef || '',
          warehouse: d.warehouse || '',
          source: s.source || 'instagram'
        });
      }
    });
    return Array.from(map.values());
  }, [sales]);

  const matchingCustomers = useMemo(() => {
    const pQuery = formData.phone.replace(/\D/g, '');
    const nQuery = `${formData.firstName} ${formData.lastName}`.trim().toLowerCase();
    if (pQuery.length < 4 && nQuery.length < 2) return [];
    return knownCustomers.filter(c => {
      const cPhone = c.phone.replace(/\D/g, '');
      const cName = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (pQuery.length >= 4 && cPhone.includes(pQuery)) return true;
      if (nQuery.length >= 2 && cName.includes(nQuery) && cName !== nQuery) return true;
      return false;
    }).slice(0, 4);
  }, [knownCustomers, formData.phone, formData.firstName, formData.lastName]);

  const switchViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_sales_view_mode', mode);
    }
  };

  async function fetchAds() {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('id, platform, product_id, product_name, ad_date')
        .order('ad_date', { ascending: false });
      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  }

  async function adjustAdRevenue(adId, amountChange) {
    if (!adId) return;
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('revenue')
        .eq('id', adId)
        .single();
      if (error) throw error;
      
      const currentRevenue = parseFloat(data.revenue || 0);
      const newRevenue = currentRevenue + amountChange;
      
      await supabase
        .from('advertisements')
        .update({ revenue: newRevenue })
        .eq('id', adId);
    } catch (err) {
      console.error('Error adjusting ad revenue:', err);
    }
  }

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
            phone,
            tg_id
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSales(data || []);
      onOrdersChanged?.(data || []);
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
        .select('id, name, price, discount, image_url')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }

  const handleUpdateOrderStatus = async (orderId, updates) => {
    const targetSale = sales.find(s => String(s.id) === String(orderId));
    if (!targetSale) return;

    const oldStatus = targetSale.status;
    const oldTotal = parseFloat(targetSale.total || 0);
    const oldAdId = targetSale.shipping_details?.attributed_ad_id;

    if (updates.status === 'completed' && !updates.payment_status) {
      updates.payment_status = 'paid';
    }

    setSales(prev => prev.map(s => String(s.id) === String(orderId) ? { ...s, ...updates } : s));

    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      if (updates.status) {
        if (oldStatus === 'completed' && updates.status !== 'completed' && oldAdId) {
          await adjustAdRevenue(oldAdId, -oldTotal);
        } else if (oldStatus !== 'completed' && updates.status === 'completed' && oldAdId) {
          await adjustAdRevenue(oldAdId, oldTotal);
        }
      }
      onOrdersChanged?.();
    } catch (err) {
      setSales(prev => prev.map(s => String(s.id) === String(orderId) ? targetSale : s));
      throw err;
    }
  };

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
    const updated = salesFilterTemplates.map(t => ({
      ...t,
      isDefault: t.id === id ? !t.isDefault : false
    }));
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
    if (source === 'Всі') setSelectedSources([]);
    else setSelectedSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);
  };

  const togglePaymentFilter = (payment) => {
    if (payment === 'Всі') setSelectedPayments([]);
    else setSelectedPayments(prev => prev.includes(payment) ? prev.filter(p => p !== payment) : [...prev, payment]);
  };

  const toggleStatusFilter = (status) => {
    if (status === 'Всі') setSelectedStatuses([]);
    else setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleExpandSale = (id) => {
    setExpandedSalesIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const src = s.source || 'website';
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(src);
      const matchesPayment = selectedPayments.length === 0 || selectedPayments.includes(s.payment_status);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
      
      const details = s.shipping_details || {};
      const name = `${details.firstName || ''} ${details.lastName || ''} ${s.customers?.first_name || ''} ${s.customers?.last_name || ''}`.toLowerCase();
      const phone = `${details.phone || ''} ${s.customers?.phone || ''}`;
      const num = s.order_number || '';
      const notes = `${details.notes || ''} ${(details.items || []).map(i => `${i.name || ''} ${(i.colors || []).join(' ')} ${i.item_note || ''}`).join(' ')}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || name.includes(query) || phone.includes(query) || num.toLowerCase().includes(query) || notes.includes(query);

      return matchesSource && matchesPayment && matchesStatus && matchesSearch;
    });
  }, [sales, selectedSources, selectedPayments, selectedStatuses, searchQuery]);

  const cartTotal = useMemo(() => {
    return (formData.items || []).reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
  }, [formData.items]);

  const effectiveTotal = useMemo(() => {
    return parseFloat(formData.total) || cartTotal || 0;
  }, [formData.total, cartTotal]);

  // Smart Paste execution
  const applySmartPaste = async (rawText) => {
    const textToParse = rawText || smartPasteText;
    if (!textToParse.trim()) {
      showToast('Вставте текст з даними клієнта', 'error');
      return;
    }
    const parsed = parseSmartShippingText(textToParse);
    const updates = {};
    if (parsed.firstName) updates.firstName = parsed.firstName;
    if (parsed.lastName) updates.lastName = parsed.lastName;
    if (parsed.phone) updates.phone = parsed.phone;

    if (parsed.cityQuery) {
      updates.city = parsed.cityQuery;
      setNpCityQuery(parsed.cityQuery);
      if (parsed.rawWarehouseHint) {
        updates.warehouse = parsed.rawWarehouseHint;
        setNpWarehouseQuery(parsed.rawWarehouseHint);
      }
      if (parsed.warehouseNumber) {
        setPendingWarehouseNumber(parsed.warehouseNumber);
      }

      // Immediately look up city in Nova Poshta
      try {
        setNpLoadingCities(true);
        const cities = await novaPoshta.getCities(parsed.cityQuery);
        setNpLoadingCities(false);
        if (Array.isArray(cities) && cities.length > 0) {
          const bestCity = cities[0];
          updates.city = bestCity.Description;
          updates.cityRef = bestCity.Ref;
          setNpCityQuery(bestCity.Description);
          setNpShowCities(false);
        }
      } catch (_) {
        setNpLoadingCities(false);
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
    setShowSmartPaste(false);
    setSmartPasteText('');
    showToast('Реквізити розпізнано та заповнено! ⚡', 'success');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip && clip.trim()) {
        await applySmartPaste(clip);
      } else {
        setShowSmartPaste(true);
      }
    } catch (_) {
      setShowSmartPaste(!showSmartPaste);
    }
  };

  const handleAddCatalogProduct = (prod) => {
    if (!prod) return;
    const finalPrice = prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price;
    const newIdx = (formData.items || []).length;
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          product_id: prod.id,
          name: prod.name,
          price: finalPrice,
          quantity: 1,
          colors: [],
          item_note: '',
          is_manufactured: false
        }
      ]
    }));
    setOpenColorEditorIdx(newIdx);
    showToast(`Додано: ${prod.name} (вкажіть кольори нижче)`);
  };

  const handleAddManualItem = () => {
    if (!newItem.name || !newItem.price) {
      showToast('Введіть назву та ціну товару', 'error');
      return;
    }
    const newIdx = (formData.items || []).length;
    setFormData({
      ...formData,
      items: [...formData.items, {
        name: newItem.name.trim(),
        quantity: parseInt(newItem.quantity) || 1,
        price: parseFloat(newItem.price) || 0,
        colors: newItem.colors || [],
        item_note: (newItem.item_note || '').trim(),
        is_manufactured: false
      }]
    });
    setNewItem({ name: '', quantity: 1, price: '', colors: [], item_note: '' });
    setOpenColorEditorIdx(newIdx);
  };

  const handleDuplicateCartItem = (idx) => {
    const itemToClone = formData.items[idx];
    if (!itemToClone) return;
    const cloned = {
      ...itemToClone,
      quantity: 1,
      colors: [...(itemToClone.colors || [])],
      item_note: itemToClone.item_note || '',
      is_manufactured: false
    };
    const updated = [...formData.items];
    updated.splice(idx + 1, 0, cloned);
    setFormData({ ...formData, items: updated });
    setOpenColorEditorIdx(idx + 1);
    showToast('Позицію продубльовано — оберіть інший колір 🎨');
  };

  const toggleItemColor = (itemIdx, colorLabel) => {
    const updated = [...formData.items];
    const currentColors = Array.isArray(updated[itemIdx].colors) ? [...updated[itemIdx].colors] : [];
    if (currentColors.includes(colorLabel)) {
      updated[itemIdx] = { ...updated[itemIdx], colors: currentColors.filter(c => c !== colorLabel) };
    } else {
      updated[itemIdx] = { ...updated[itemIdx], colors: [...currentColors, colorLabel] };
    }
    setFormData({ ...formData, items: updated });
  };

  const updateItemNote = (itemIdx, noteVal) => {
    const updated = [...formData.items];
    updated[itemIdx] = { ...updated[itemIdx], item_note: noteVal };
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
    if (openColorEditorIdx === index) setOpenColorEditorIdx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0 && !formData.total) {
      showToast('Додайте хоча б один товар або введіть загальну суму', 'error');
      return;
    }

    setSaving(true);
    try {
      const itemsTotal = formData.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
      const finalTotal = parseFloat(formData.total) || itemsTotal;

      const orderNumber = editingSale?.order_number || `MAN-${formData.source.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const finalCity = formData.shipping_method === 'pickup' 
        ? 'Самовивіз' 
        : (formData.city || npCityQuery || '').trim();
      const finalWarehouse = formData.shipping_method === 'pickup' 
        ? '' 
        : (formData.warehouse || npWarehouseQuery || '').trim();

      const saleData = {
        total: finalTotal,
        status: formData.status,
        payment_status: formData.payment_status,
        shipping_method: formData.shipping_method || (finalCity && finalCity !== 'Самовивіз' ? 'nova_poshta' : 'pickup'),
        source: formData.source,
        order_number: orderNumber,
        shipping_details: {
          ...(editingSale?.shipping_details || {}),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          city: finalCity,
          cityRef: formData.shipping_method === 'nova_poshta' ? (formData.cityRef || '') : '',
          warehouse: finalWarehouse,
          items: formData.items,
          is_cod: formData.is_cod,
          prepayment_amount: formData.prepayment_amount ? (parseFloat(formData.prepayment_amount) || 0) : 0,
          cod_amount: formData.is_cod ? (parseFloat(formData.cod_amount) || 0) : 0,
          notes: formData.notes.trim(),
          is_priority: formData.is_priority,
          sold_via_ad: formData.sold_via_ad,
          attributed_ad_id: (formData.sold_via_ad && formData.attributed_ad_id && !formData.attributed_ad_id.startsWith('header-')) ? formData.attributed_ad_id : null
        }
      };

      if (editingSale) {
        const oldStatus = editingSale.status;
        const newStatus = formData.status;
        const oldAdId = editingSale.shipping_details?.attributed_ad_id;
        const newAdId = formData.sold_via_ad ? formData.attributed_ad_id : null;
        const oldTotal = parseFloat(editingSale.total || 0);
        const newTotal = finalTotal;

        const { error } = await supabase
          .from('orders')
          .update(saleData)
          .eq('id', editingSale.id);
        if (error) throw error;

        if (oldStatus === 'completed' && oldAdId) {
          await adjustAdRevenue(oldAdId, -oldTotal);
        }
        if (newStatus === 'completed' && newAdId) {
          await adjustAdRevenue(newAdId, newTotal);
        }

        showToast('Продаж оновлено успішно! ✅');
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([saleData]);
        if (error) throw error;

        const newAdId = formData.sold_via_ad ? formData.attributed_ad_id : null;
        if (formData.status === 'completed' && newAdId) {
          await adjustAdRevenue(newAdId, finalTotal);
        }

        showToast('Продаж додано успішно! 🎉');
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

  const handleEdit = async (sale) => {
    if (!sale) return;

    let details = sale.shipping_details;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch (_) { details = {}; }
    }
    details = details || {};

    let rawItems = details.items || sale.items || [];
    if (typeof rawItems === 'string') {
      try { rawItems = JSON.parse(rawItems); } catch (_) { rawItems = []; }
    }
    if (!Array.isArray(rawItems)) rawItems = [];

    const normalizedItems = rawItems.map(it => ({
      ...it,
      colors: Array.isArray(it.colors) ? it.colors : (it.color ? [it.color] : []),
      item_note: it.item_note || it.color_details || it.note || ''
    }));

    const firstName = details.firstName || details.first_name || sale.customers?.first_name || '';
    const lastName = details.lastName || details.last_name || sale.customers?.last_name || '';
    const cityVal = details.city || '';
    let cityRefVal = details.cityRef || '';

    setEditingSale(sale);
    setFormData({
      source: sale.source || 'instagram',
      shipping_method: sale.shipping_method || (cityVal === 'Самовивіз' ? 'pickup' : 'nova_poshta'),
      firstName,
      lastName,
      phone: details.phone || sale.customers?.phone || '',
      city: cityVal,
      cityRef: cityRefVal,
      warehouse: details.warehouse || '',
      total: sale.total ? String(sale.total) : '',
      payment_status: sale.payment_status || 'pending',
      status: sale.status || 'new',
      items: normalizedItems,
      is_cod: !!details.is_cod,
      prepayment_amount: details.prepayment_amount ? String(details.prepayment_amount) : '',
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || '',
      is_priority: !!details.is_priority,
      sold_via_ad: !!details.sold_via_ad,
      attributed_ad_id: details.attributed_ad_id || ''
    });

    setNpCityQuery(cityVal);
    setNpWarehouseQuery(details.warehouse || '');
    setOpenColorEditorIdx(null);
    setShowAddForm(true);

    // If city exists but cityRef was missing from older orders, resolve it automatically!
    if (cityVal && cityVal !== 'Самовивіз' && !cityRefVal) {
      try {
        const foundCities = await novaPoshta.getCities(cityVal);
        if (Array.isArray(foundCities) && foundCities.length > 0) {
          setFormData(prev => ({ ...prev, cityRef: foundCities[0].Ref }));
        }
      } catch (_) {}
    }
  };

  const handleDuplicate = (sale) => {
    if (!sale) return;

    let details = sale.shipping_details;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch (_) { details = {}; }
    }
    details = details || {};

    let rawItems = details.items || sale.items || [];
    if (typeof rawItems === 'string') {
      try { rawItems = JSON.parse(rawItems); } catch (_) { rawItems = []; }
    }
    if (!Array.isArray(rawItems)) rawItems = [];

    const duplicatedItems = JSON.parse(JSON.stringify(rawItems)).map(it => ({
      ...it,
      colors: Array.isArray(it.colors) ? it.colors : (it.color ? [it.color] : []),
      item_note: it.item_note || it.color_details || it.note || '',
      is_manufactured: false
    }));

    const firstName = details.firstName || details.first_name || sale.customers?.first_name || '';
    const lastName = details.lastName || details.last_name || sale.customers?.last_name || '';

    setEditingSale(null);
    setFormData({
      source: sale.source || 'instagram',
      shipping_method: sale.shipping_method || 'nova_poshta',
      firstName,
      lastName,
      phone: details.phone || sale.customers?.phone || '',
      city: details.city || '',
      cityRef: details.cityRef || '',
      warehouse: details.warehouse || '',
      total: sale.total ? String(sale.total) : '',
      payment_status: 'pending',
      status: 'new',
      items: duplicatedItems,
      is_cod: !!details.is_cod,
      prepayment_amount: details.prepayment_amount ? String(details.prepayment_amount) : '',
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || '',
      is_priority: false,
      sold_via_ad: !!details.sold_via_ad,
      attributed_ad_id: details.attributed_ad_id || ''
    });

    setNpCityQuery(details.city || '');
    setNpWarehouseQuery(details.warehouse || '');
    setOpenColorEditorIdx(null);
    setShowAddForm(true);
    showToast('Дані замовлення скопійовано! Перевірте та збережіть.', 'info');
  };

  const handleDelete = async (id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей запис про продаж?')) return;
    try {
      const sale = sales.find(s => s.id === id);
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;

      if (sale && sale.status === 'completed' && sale.shipping_details?.attributed_ad_id) {
        await adjustAdRevenue(sale.shipping_details.attributed_ad_id, -parseFloat(sale.total || 0));
      }

      showToast('Запис видалено');
      fetchSales();
    } catch (err) {
      console.error(err);
      showToast(`Помилка видалення: ${err.message}`, 'error');
    }
  };

  const resetForm = (initialStatus = 'new') => {
    setFormData({
      source: 'instagram',
      shipping_method: 'nova_poshta',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      cityRef: '',
      warehouse: '',
      total: '',
      payment_status: 'pending',
      status: initialStatus || 'new',
      items: [],
      is_cod: false,
      prepayment_amount: '',
      cod_amount: '',
      notes: '',
      is_priority: false,
      sold_via_ad: false,
      attributed_ad_id: ''
    });
    setNewItem({ name: '', quantity: 1, price: '', colors: [], item_note: '' });
    setEditingSale(null);
    setItemTab('catalog');
    setCatalogSearchQuery('');
    setOpenColorEditorIdx(null);
    setShowSmartPaste(false);
    setSmartPasteText('');
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
      shipping_method: 'pickup',
      firstName: 'Гість',
      lastName: getPlatformBadgeName(formData.source),
      phone: '+380000000000',
      city: 'Самовивіз',
      warehouse: ''
    });
    setNpCityQuery('Самовивіз');
    setNpWarehouseQuery('');
  };

  const getPlatformBadgeColor = (plat) => {
    const found = CHANNELS.find(c => c.value === plat?.toLowerCase());
    return found ? found.color : '#a855f7';
  };

  const getPlatformBadgeName = (plat) => {
    const found = CHANNELS.find(c => c.value === plat?.toLowerCase());
    return found ? found.label : 'Інше';
  };

  const filteredCatalogProducts = useMemo(() => {
    const prodList = Array.isArray(products) ? products : [];
    if (!catalogSearchQuery.trim()) return prodList;
    const q = catalogSearchQuery.toLowerCase();
    return prodList.filter(p => p?.name && p.name.toLowerCase().includes(q));
  }, [products, catalogSearchQuery]);

  const matchingAds = useMemo(() => {
    const itemsList = Array.isArray(formData?.items) ? formData.items : [];
    const productIdsInCart = new Set(itemsList.map(item => item?.product_id).filter(Boolean));
    const productNamesInCart = new Set(itemsList.map(item => item?.name?.toLowerCase()).filter(Boolean));

    const adsList = Array.isArray(ads) ? ads.filter(Boolean) : [];

    const directAds = adsList.filter(ad => 
      (ad.product_id && productIdsInCart.has(ad.product_id)) || 
      (ad.product_name && Array.from(productNamesInCart).some(name => String(ad.product_name).toLowerCase().includes(name)))
    );

    const generalAds = adsList.filter(ad => !ad.product_id && !directAds.some(da => da.id === ad.id));
    const otherAds = adsList.filter(ad => !directAds.some(da => da.id === ad.id) && !generalAds.some(ga => ga.id === ad.id));

    return {
      direct: directAds,
      general: generalAds,
      other: otherAds,
      all: [...directAds, ...generalAds, ...otherAds]
    };
  }, [ads, formData?.items]);

  const applyPrepaymentPreset = (prepayVal) => {
    const total = effectiveTotal;
    const prepay = Math.min(total, Math.max(0, prepayVal));
    const cod = Math.max(0, Math.round(total - prepay));
    setFormData(prev => ({
      ...prev,
      is_cod: cod > 0,
      prepayment_amount: prepay > 0 ? String(prepay) : '',
      cod_amount: String(cod),
      payment_status: prepay <= 0 ? 'pending' : (cod <= 0 ? 'paid' : 'partially_paid')
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: isMobile ? 'auto' : 'calc(100vh - 32px)', overflow: isMobile ? 'visible' : 'hidden', paddingBottom: isMobile ? 75 : 0 }}>
      
      {/* Sleek Combined Top Toolbar Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 12 : '10px 16px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 10 }}>
          
          {/* Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf' }}>
                <Coins size={18} />
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Кабінет Продажів
                <span style={{ fontSize: 11, fontWeight: 900, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 8 }}>
                  {filteredSales.length}
                </span>
              </h1>
            </div>

            {isMobile && (
              <button 
                type="button"
                onClick={() => { resetForm(); setShowAddForm(true); }}
                style={{ 
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)', color: '#fff',
                  fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 4px 14px rgba(45,212,191,0.25)'
                }}
              >
                <Plus size={15} /> ПРОДАЖ
              </button>
            )}
          </div>

          {/* Search, Controls & Action Button Row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            
            {/* Search Input */}
            <div style={{ flex: isMobile ? '1 1 100%' : '0 1 260px', minWidth: 160, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Пошук клієнта, телефону, виробу, кольору..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 12, outline: 'none', width: '100%' }} 
              />
              {searchQuery && (
                <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }} onClick={() => setSearchQuery('')} />
              )}
            </div>

            {/* View Switcher Buttons */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 3, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => switchViewMode('table')}
                style={{
                  padding: '5px 10px', borderRadius: 7, border: 'none',
                  background: viewMode === 'table' ? '#7c3aed' : 'transparent',
                  color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <List size={14} />
                <span>Список</span>
              </button>
              <button
                type="button"
                onClick={() => switchViewMode('kanban')}
                style={{
                  padding: '5px 10px', borderRadius: 7, border: 'none',
                  background: viewMode === 'kanban' ? '#7c3aed' : 'transparent',
                  color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <LayoutGrid size={14} />
                <span>Канбан</span>
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              style={{
                padding: '6px 12px', borderRadius: 10,
                border: (selectedSources.length > 0 || selectedPayments.length > 0 || selectedStatuses.length > 0 || isFiltersExpanded) ? '1px solid #7c3aed' : '1px solid var(--border)',
                background: (selectedSources.length > 0 || selectedPayments.length > 0 || selectedStatuses.length > 0) ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: (selectedSources.length > 0 || selectedPayments.length > 0 || selectedStatuses.length > 0) ? '#a78bfa' : 'var(--text-main)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <Filter size={14} />
              <span>Фільтри</span>
              {(selectedSources.length + selectedPayments.length + selectedStatuses.length) > 0 && (
                <span style={{ background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 6 }}>
                  {selectedSources.length + selectedPayments.length + selectedStatuses.length}
                </span>
              )}
              {isFiltersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {(selectedSources.length > 0 || selectedPayments.length > 0 || selectedStatuses.length > 0 || searchQuery) && (
              <button
                type="button"
                onClick={() => { setSelectedSources([]); setSelectedPayments([]); setSelectedStatuses([]); setSearchQuery(''); }}
                style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Скинути
              </button>
            )}

            {!isMobile && (
              <button 
                type="button"
                onClick={() => { resetForm(); setShowAddForm(true); }}
                style={{ 
                  padding: '7px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)', color: '#fff',
                  fontWeight: 850, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(45,212,191,0.25)', flexShrink: 0
                }}
              >
                <Plus size={15} /> ДОДАТИ ПРОДАЖ
              </button>
            )}

          </div>
        </div>

        {/* Collapsible Filters Content */}
        <AnimatePresence initial={false}>
          {isFiltersExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}
            >
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Блок шаблонів фільтрів */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Шаблони фільтрів</span>
                  </div>
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
                      style={{ padding: '6px 12px', borderRadius: 10, background: newSalesTemplateName.trim() ? '#7c3aed' : 'rgba(255,255,255,0.02)', color: newSalesTemplateName.trim() ? '#fff' : '#6b6b8a', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Зберегти
                    </button>
                  </div>
                </div>

                {salesFilterTemplates.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {salesFilterTemplates.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => applySalesTemplate(t)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', 
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                          borderRadius: 10, cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{t.name}</span>
                        <button 
                          type="button"
                          onClick={(e) => toggleSalesTemplateDefault(t.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        >
                          <span style={{ fontSize: 11, color: t.isDefault ? '#fbbf24' : '#4a4a6a' }}>
                            {t.isDefault ? '★' : '☆'}
                          </span>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => deleteSalesFilterTemplate(t.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, fontSize: 10 }}
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
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Джерело замовлення:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { val: 'Всі', label: 'ВСІ', color: '#6b6b8a' },
                    ...CHANNELS.map(c => ({ val: c.value, label: c.label.toUpperCase(), color: c.color }))
                  ].map(item => {
                    const active = item.val === 'Всі' ? selectedSources.length === 0 : selectedSources.includes(item.val);
                    return (
                      <button 
                        key={item.val} 
                        onClick={() => toggleSourceFilter(item.val)} 
                        style={{ 
                          padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                          background: active ? item.color : 'rgba(255,255,255,0.03)', 
                          color: active ? (item.val === 'threads' ? '#000' : '#fff') : 'var(--text-muted)', 
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Статус оплати:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { val: 'Всі', label: 'ВСІ' },
                    { val: 'pending', label: 'ОЧІКУЄ' },
                    { val: 'verifying', label: 'ПЕРЕВІРКА' },
                    { val: 'partially_paid', label: 'ЧАСТКОВО' },
                    { val: 'paid', label: 'ОПЛАЧЕНО' }
                  ].map(item => {
                    const active = item.val === 'Всі' ? selectedPayments.length === 0 : selectedPayments.includes(item.val);
                    return (
                      <button 
                        key={item.val} 
                        onClick={() => togglePaymentFilter(item.val)} 
                        style={{ 
                          padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                          background: active ? '#f97316' : 'rgba(255,255,255,0.03)', 
                          color: active ? '#fff' : 'var(--text-muted)', 
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Статус замовлення:</label>
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
                    const active = item.val === 'Всі' ? selectedStatuses.length === 0 : selectedStatuses.includes(item.val);
                    return (
                      <button 
                        key={item.val} 
                        onClick={() => toggleStatusFilter(item.val)} 
                        style={{ 
                          padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, 
                          background: active ? item.color : 'rgba(255,255,255,0.03)', 
                          color: active ? '#fff' : 'var(--text-muted)', 
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        {Icon && <Icon size={12} />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sales Content Container (Table / Mobile Cards or Kanban) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', overflow: isMobile ? 'visible' : 'hidden' }}>
        {viewMode === 'kanban' ? (
          <OrderKanbanBoard 
            orders={filteredSales}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onEditOrder={handleEdit}
            onDuplicateOrder={handleDuplicate}
            onAddOrder={(colStatus) => {
              resetForm(colStatus);
              setShowAddForm(true);
            }}
            showToast={showToast}
          />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredSales.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Знайдено: <strong style={{ color: '#fff' }}>{filteredSales.length}</strong>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setExpandedSalesIds(filteredSales.map(s => s.id))}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}
                  >
                    Розгорнути всі
                  </button>
                  <button
                    onClick={() => setExpandedSalesIds([])}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 10, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}
                  >
                    Згорнути всі
                  </button>
                </div>
              </div>
            )}

            {filteredSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)' }}>
                Продажів не знайдено.
              </div>
            ) : (
              filteredSales.map(sale => {
                const details = sale.shipping_details || {};
                const clientName = `${details.firstName || ''} ${details.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
                const clientPhone = details.phone || sale.customers?.phone || 'Не вказано';
                const items = Array.isArray(details.items) ? details.items : [];
                const isExpanded = expandedSalesIds.includes(sale.id);
                const isPriority = !!details.is_priority;
                
                return (
                  <div 
                    key={sale.id} 
                    style={{ 
                      background: 'var(--bg-card)', 
                      borderRadius: 18, 
                      border: isPriority ? '1.5px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border)', 
                      padding: 14, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: isExpanded ? 12 : 6,
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Clickable Card Header */}
                    <div 
                      onClick={() => toggleExpandSale(sale.id)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {isPriority && <Star size={13} fill="#fbbf24" stroke="#fbbf24" />}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                            {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                          </span>
                          <span style={{ 
                            fontSize: 9.5, fontWeight: 900, 
                            color: getPlatformBadgeColor(sale.source),
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 7px', borderRadius: 6
                          }}>
                            {getPlatformBadgeName(sale.source)}
                          </span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                            background: sale.payment_status === 'paid' ? 'rgba(34,197,94,0.12)' : sale.payment_status === 'partially_paid' ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)',
                            color: sale.payment_status === 'paid' ? '#22c55e' : sale.payment_status === 'partially_paid' ? '#38bdf8' : '#fbbf24'
                          }}>
                            {sale.payment_status === 'paid' ? 'ОПЛ.' : sale.payment_status === 'partially_paid' ? 'ЧАСТ.' : 'ОЧІК.'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {(() => {
                            const meta = STATUS_META[sale.status] || STATUS_META.new;
                            const Icon = meta.icon;
                            return (
                              <span style={{ 
                                fontSize: 9.5, fontWeight: 900, padding: '3px 8px', borderRadius: 7,
                                background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 4
                              }}>
                                <Icon size={10} />
                                <span>{meta.label}</span>
                              </span>
                            );
                          })()}
                          {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fff' }}>
                          {clientName}
                        </div>
                        <div style={{ fontSize: 14.5, fontWeight: 950, color: '#2dd4bf' }}>
                          {sale.total} ₴
                        </div>
                      </div>

                      {/* Collapsed Preview of Items + Colors + Notes */}
                      {!isExpanded && (items.length > 0 || details.notes) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                          {items.map((item, idx) => {
                            const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                            const itemNote = item.item_note || item.color_details || item.note || '';
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', fontSize: 11, color: '#cbd5e1' }}>
                                <span style={{ fontWeight: 700 }}>• {item.name}</span>
                                <span style={{ color: '#a78bfa', fontWeight: 900, fontSize: 10 }}>x{item.quantity || 1}</span>
                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 5, color: '#fff', fontWeight: 800 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                      {cMeta.label}
                                    </span>
                                  );
                                })}
                                {itemNote && <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700 }}>({itemNote})</span>}
                              </div>
                            );
                          })}
                          {details.notes && (
                            <div style={{ fontSize: 10.5, color: '#fbbf24', fontWeight: 750 }}>
                              ⚠️ {details.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                          {/* Client Info */}
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{clientName}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Тел: {clientPhone}</div>
                            {details.city && (
                              <div style={{ fontSize: 11.5, color: '#ec4899', fontWeight: 700 }}>
                                Доставка: {details.city} {details.warehouse ? `— ${details.warehouse}` : ''}
                              </div>
                            )}
                            {details.is_cod && details.cod_amount > 0 && (
                              <div style={{ fontSize: 11.5, color: '#f97316', fontWeight: 850 }}>
                                💰 Наложка: {details.cod_amount} ₴
                              </div>
                            )}
                            {details.notes && (
                              <div style={{ 
                                marginTop: 4, padding: '6px 10px', borderRadius: 8, 
                                background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.3)',
                                color: '#fbbf24', fontSize: 11, fontWeight: 750
                              }}>
                                ⚠️ {details.notes}
                              </div>
                            )}
                          </div>

                          {/* Items list with Colors & Notes */}
                          {items.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase' }}>Склад замовлення ({items.length})</div>
                              {items.map((item, idx) => {
                                const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                                const itemNote = item.item_note || item.color_details || item.note || '';
                                return (
                                  <div key={idx} style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 750 }}>• {item.name}</span>
                                        <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 6 }}>x{item.quantity}</span>
                                      </div>
                                      <span style={{ fontWeight: 850, fontSize: 12, color: '#2dd4bf' }}>{item.price * item.quantity} ₴</span>
                                    </div>
                                    {itemColors.length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {itemColors.map((cName, cIdx) => {
                                          const cMeta = getColorMeta(cName);
                                          return (
                                            <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.07)', color: '#fff', padding: '2px 7px', borderRadius: 6 }}>
                                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                              {cMeta.label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {itemNote && (
                                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 750 }}>
                                        🎨 {itemNote}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick 1-Tap Status & Payment Switcher on Mobile */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Швидка зміна статусу:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {Object.keys(STATUS_META).map(stKey => {
                                const meta = STATUS_META[stKey];
                                const active = sale.status === stKey;
                                return (
                                  <button
                                    key={stKey}
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(sale.id, { status: stKey })}
                                    style={{
                                      padding: '5px 9px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                      border: active ? `1px solid ${meta.color}` : '1px solid rgba(255,255,255,0.06)',
                                      background: active ? meta.bg : 'rgba(255,255,255,0.02)',
                                      color: active ? meta.color : 'var(--text-muted)'
                                    }}
                                  >
                                    {meta.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Оплата:</div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {[
                                { val: 'pending', label: 'Очікує', color: '#fbbf24' },
                                { val: 'partially_paid', label: 'Частково', color: '#38bdf8' },
                                { val: 'paid', label: 'Оплачено ✅', color: '#22c55e' }
                              ].map(p => {
                                const active = sale.payment_status === p.val;
                                return (
                                  <button
                                    key={p.val}
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(sale.id, { payment_status: p.val })}
                                    style={{
                                      flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 850, cursor: 'pointer',
                                      border: active ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.06)',
                                      background: active ? `${p.color}20` : 'rgba(255,255,255,0.02)',
                                      color: active ? p.color : 'var(--text-muted)'
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                            <button 
                              onClick={() => handleEdit(sale)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              <Edit3 size={14} /> Редагувати
                            </button>
                            <button 
                              onClick={() => handleDuplicate(sale)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              <Copy size={14} /> Дублювати
                            </button>
                            <button 
                              onClick={() => handleDelete(sale.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop Table */
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДАТА / ДЖЕРЕЛО</th>
                    <th style={{ textAlign: 'left', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>КЛІЄНТ ТА ДОСТАВКА</th>
                    <th style={{ textAlign: 'left', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ВИРОБИ, КОЛЬОРИ ТА УТОЧНЕННЯ</th>
                    <th style={{ textAlign: 'center', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>СУМА</th>
                    <th style={{ textAlign: 'center', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ОПЛАТА</th>
                    <th style={{ textAlign: 'center', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>СТАТУС</th>
                    <th style={{ textAlign: 'right', padding: '14px 18px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 900 }}>ДІЇ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                        Продажів не знайдено.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => {
                      const details = sale.shipping_details || {};
                      const clientName = `${details.firstName || ''} ${details.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
                      const clientPhone = details.phone || sale.customers?.phone || '—';
                      const items = Array.isArray(details.items) ? details.items : [];

                      return (
                        <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              {details.is_priority && <Star size={13} fill="#fbbf24" stroke="#fbbf24" />}
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                                {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ 
                                fontSize: 10, fontWeight: 900, 
                                color: getPlatformBadgeColor(sale.source),
                                background: 'rgba(255,255,255,0.05)',
                                padding: '3px 8px', borderRadius: 6
                              }}>
                                {getPlatformBadgeName(sale.source)}
                              </span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                                {sale.order_number ? sale.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${sale.id.slice(0, 6)}`}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'top', maxWidth: 230 }}>
                            <div style={{ fontSize: 13, fontWeight: 850, color: '#fff' }}>{clientName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{clientPhone}</div>
                            {details.city && (
                              <div style={{ fontSize: 11, color: '#ec4899', fontWeight: 750, marginTop: 3 }}>
                                📍 {details.city} {details.warehouse ? `(${details.warehouse})` : ''}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'top', minWidth: 260, maxWidth: 360 }}>
                            {items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {items.map((item, idx) => {
                                  const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                                  const itemNote = item.item_note || item.color_details || item.note || '';
                                  return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 750 }}>• {item.name}</span>
                                        <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 5 }}>
                                          x{item.quantity}
                                        </span>
                                      </div>
                                      {itemColors.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 10 }}>
                                          {itemColors.map((cName, cIdx) => {
                                            const cMeta = getColorMeta(cName);
                                            return (
                                              <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', padding: '1px 6px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                                {cMeta.label}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {itemNote && (
                                        <div style={{ paddingLeft: 10, fontSize: 11, color: '#38bdf8', fontWeight: 750 }}>
                                          🎨 {itemNote}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                            )}

                            {details.notes && (
                              <div style={{ 
                                marginTop: 6, padding: '4px 8px', borderRadius: 8, 
                                background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)',
                                color: '#fbbf24', fontSize: 11, fontWeight: 750, display: 'inline-flex', gap: 4, alignItems: 'center'
                              }}>
                                <span>⚠️ {details.notes}</span>
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>{sale.total} ₴</div>
                            {details.is_cod && details.cod_amount > 0 && (
                              <div style={{ fontSize: 10, color: '#f97316', fontWeight: 800, marginTop: 2 }}>
                                Наложка: {details.cod_amount} ₴
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center', verticalAlign: 'top' }}>
                            <select
                              value={sale.payment_status || 'pending'}
                              onChange={(e) => handleUpdateOrderStatus(sale.id, { payment_status: e.target.value })}
                              style={{
                                fontSize: 10, fontWeight: 900, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', outline: 'none',
                                background: sale.payment_status === 'paid' ? 'rgba(34,197,94,0.15)' : sale.payment_status === 'partially_paid' ? 'rgba(14,165,233,0.15)' : 'rgba(245,158,11,0.15)',
                                color: sale.payment_status === 'paid' ? '#22c55e' : sale.payment_status === 'partially_paid' ? '#38bdf8' : '#fbbf24',
                                border: '1px solid rgba(255,255,255,0.08)'
                              }}
                            >
                              <option value="pending" style={{ background: '#0f172a', color: '#fbbf24' }}>ОЧІКУЄ</option>
                              <option value="partially_paid" style={{ background: '#0f172a', color: '#38bdf8' }}>ЧАСТКОВО</option>
                              <option value="verifying" style={{ background: '#0f172a', color: '#f97316' }}>ПЕРЕВІРКА</option>
                              <option value="paid" style={{ background: '#0f172a', color: '#22c55e' }}>ОПЛАЧЕНО</option>
                            </select>
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center', verticalAlign: 'top' }}>
                            {(() => {
                              const meta = STATUS_META[sale.status] || STATUS_META.new;
                              return (
                                <select
                                  value={sale.status || 'new'}
                                  onChange={(e) => handleUpdateOrderStatus(sale.id, { status: e.target.value })}
                                  style={{
                                    fontSize: 10, fontWeight: 900, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', outline: 'none',
                                    background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`, textTransform: 'uppercase'
                                  }}
                                >
                                  {Object.keys(STATUS_META).map(k => (
                                    <option key={k} value={k} style={{ background: '#0f172a', color: STATUS_META[k].color }}>
                                      {STATUS_META[k].label}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleEdit(sale)}
                                title="Редагувати"
                                style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: 8, padding: 7, cursor: 'pointer' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDuplicate(sale)}
                                title="Дублювати замовлення"
                                style={{ border: 'none', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', borderRadius: 8, padding: 7, cursor: 'pointer' }}
                              >
                                <Copy size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(sale.id)}
                                title="Видалити"
                                style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, padding: 7, cursor: 'pointer' }}
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
      </div>

      {/* Add / Edit Sale Modal (Mobile Bottom Sheet / Desktop Modal) */}
      <AnimatePresence>
        {showAddForm && (
          <div 
            onClick={() => setShowAddForm(false)}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.85)', 
              backdropFilter: 'blur(6px)',
              zIndex: 1100, 
              display: 'flex', 
              alignItems: isMobile ? 'flex-end' : 'center', 
              justifyContent: 'center', 
              padding: isMobile ? 0 : 20
            }}
          >
            <motion.div 
              initial={{ opacity: 0, y: isMobile ? 50 : 0, scale: isMobile ? 1 : 0.96 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: isMobile ? 50 : 0, scale: isMobile ? 1 : 0.96 }}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: '#0f172a', 
                borderRadius: isMobile ? '24px 24px 0 0' : 24, 
                width: '100%', 
                maxWidth: 740, 
                border: '1px solid rgba(124, 58, 237, 0.4)', 
                color: '#fff', 
                maxHeight: isMobile ? '94vh' : '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)'
              }}
            >
              {/* Sticky Modal Header */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: isMobile ? '14px 16px' : '18px 24px', 
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(15, 23, 42, 0.95)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(45,212,191,0.3))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2dd4bf'
                  }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 16 : 19, fontWeight: 950, margin: 0, color: '#fff' }}>
                      {editingSale ? 'Редагувати продаж' : 'Новий продаж'}
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                      Вироби, кольори пластику, реквізити та оплата
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Priority Star Toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_priority: !formData.is_priority })}
                    style={{
                      padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
                      border: formData.is_priority ? '1px solid #fbbf24' : '1px solid var(--border)',
                      background: formData.is_priority ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                      color: formData.is_priority ? '#fbbf24' : '#94a3b8',
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800
                    }}
                    title="Термінове / Пріоритетне замовлення"
                  >
                    <Star size={14} fill={formData.is_priority ? '#fbbf24' : 'transparent'} />
                    {!isMobile && 'Пріоритет'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)} 
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <form 
                id="sale-form"
                onSubmit={handleSubmit} 
                className="hide-scrollbar"
                style={{ 
                  padding: isMobile ? 14 : 24, 
                   overflowY: 'auto', 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 16 
                }}
              >
                {/* 1. КАНАЛ ПРОДАЖУ (Швидкі кнопки-чіпси) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      1. Канал продажу
                    </label>
                    <button 
                      type="button"
                      onClick={handleQuickFill}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)',
                        color: '#2dd4bf', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={12} /> Заповнити як Гість (Самовивіз)
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CHANNELS.map(ch => {
                      const active = formData.source === ch.value;
                      return (
                        <button
                          key={ch.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, source: ch.value })}
                          style={{
                            padding: '8px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                            border: active ? `1.5px solid ${ch.color}` : '1px solid var(--border)',
                            background: active ? `${ch.color}22` : 'rgba(255,255,255,0.03)',
                            color: active ? '#fff' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. СКЛАД ЗАМОВЛЕННЯ + КОЛЬОРИ ТА УТОЧНЕННЯ ПО КОЖНІЙ ІГРАШЦІ */}
                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 18, padding: isMobile ? 12 : 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: '#2dd4bf', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={16} /> 2. Склад замовлення та Кольори
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
                      Позицій: <strong style={{ color: '#fff' }}>{(formData.items || []).length}</strong>
                    </span>
                  </div>

                  {/* Added Items List */}
                  {(formData.items || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      {formData.items.map((item, idx) => {
                        const itemColors = Array.isArray(item.colors) ? item.colors : [];
                        const isColorOpen = openColorEditorIdx === idx;

                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              background: 'rgba(15, 23, 42, 0.85)', 
                              border: isColorOpen ? '1px solid rgba(167, 139, 250, 0.5)' : '1px solid rgba(255,255,255,0.07)', 
                              borderRadius: 14, 
                              padding: isMobile ? 10 : 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8
                            }}
                          >
                            {/* Item Main Row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: 140, fontWeight: 800, fontSize: 13, color: '#fff' }}>
                                {idx + 1}. {item.name}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Quantity controls */}
                                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
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
                                    style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 900 }}
                                  >
                                    -
                                  </button>
                                  <span style={{ minWidth: 20, textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 900 }}>
                                    {item.quantity}
                                  </span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...formData.items];
                                      updated[idx].quantity += 1;
                                      setFormData({ ...formData, items: updated });
                                    }}
                                    style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: '#2dd4bf', cursor: 'pointer', fontWeight: 900 }}
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Editable Unit Price */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => {
                                      const updated = [...formData.items];
                                      updated[idx].price = parseFloat(e.target.value) || 0;
                                      setFormData({ ...formData, items: updated });
                                    }}
                                    style={{ width: 62, padding: '4px 6px', borderRadius: 7, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#2dd4bf', fontSize: 12, fontWeight: 900, textAlign: 'right' }}
                                    title="Ціна за 1 шт (₴)"
                                  />
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>₴</span>
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveItem(idx)} 
                                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: 7, padding: 6, cursor: 'pointer', display: 'flex' }}
                                  title="Видалити позицію"
                                >
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>

                            {/* Selected Colors & Note Summary Bar + Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                                <button
                                  type="button"
                                  onClick={() => setOpenColorEditorIdx(isColorOpen ? null : idx)}
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 850, cursor: 'pointer',
                                    border: isColorOpen || itemColors.length > 0 || item.item_note ? '1px solid #a78bfa' : '1px dashed rgba(255,255,255,0.2)',
                                    background: isColorOpen ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.08)',
                                    color: '#ddd6fe', display: 'flex', alignItems: 'center', gap: 5
                                  }}
                                >
                                  <Palette size={12} />
                                  <span>{itemColors.length > 0 || item.item_note ? 'Змінити кольори / деталі' : '+ Вказати кольори / уточнення'}</span>
                                </button>

                                {/* Selected color pills preview */}
                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span 
                                      key={cIdx} 
                                      onClick={() => toggleItemColor(idx, cName)}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                                        padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                                        background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)'
                                      }}
                                      title="Клікніть, щоб прибрати колір"
                                    >
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: `1px solid ${cMeta.border || '#fff'}` }} />
                                      {cMeta.label} ✕
                                    </span>
                                  );
                                })}

                                {item.item_note && !isColorOpen && (
                                  <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 750, background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                                    💬 {item.item_note}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDuplicateCartItem(idx)}
                                style={{
                                  padding: '4px 8px', borderRadius: 7, fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: '#94a3b8',
                                  display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                                }}
                                title="Додати ще одну таку ж іграшку, але з іншими кольорами"
                              >
                                <Copy size={10} /> + Інший колір
                              </button>
                            </div>

                            {/* Expandable Multi-Color & Item Clarification Drawer */}
                            <AnimatePresence>
                              {isColorOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6 }}>
                                      🎨 Оберіть кольори пластику (можна декілька):
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                      {FILAMENT_COLORS.map(fc => {
                                        const selected = itemColors.includes(fc.label);
                                        return (
                                          <button
                                            key={fc.id}
                                            type="button"
                                            onClick={() => toggleItemColor(idx, fc.label)}
                                            style={{
                                              padding: '5px 9px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                              display: 'inline-flex', alignItems: 'center', gap: 5,
                                              border: selected ? '1.5px solid #2dd4bf' : '1px solid rgba(255,255,255,0.1)',
                                              background: selected ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.03)',
                                              color: selected ? '#fff' : '#cbd5e1',
                                              transition: 'all 0.15s'
                                            }}
                                          >
                                            <span style={{
                                              width: 10, height: 10, borderRadius: '50%',
                                              background: fc.gradient || fc.hex,
                                              border: `1px solid ${fc.border || '#fff'}`,
                                              flexShrink: 0
                                            }} />
                                            {fc.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 5 }}>
                                      💬 Деталі по кольорах частин / уточнення для цієї іграшки:
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Напр.: Тіло чорне, очі жовті, крила червоні, матовий пластик..."
                                      value={item.item_note || ''}
                                      onChange={(e) => updateItemNote(idx, e.target.value)}
                                      style={{
                                        width: '100%', padding: '9px 12px', borderRadius: 10,
                                        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(56,189,248,0.35)',
                                        color: '#fff', fontSize: 12.5, outline: 'none'
                                      }}
                                    />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                                      {QUICK_ITEM_TAGS.map(tag => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => {
                                            const cur = item.item_note ? `${item.item_note}, ${tag}` : tag;
                                            updateItemNote(idx, cur);
                                          }}
                                          style={{
                                            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 750,
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#94a3b8', cursor: 'pointer'
                                          }}
                                        >
                                          + {tag}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', padding: '12px', borderRadius: 12, 
                      background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border)',
                      color: 'var(--text-muted)', fontSize: 12, marginBottom: 12
                    }}>
                      Кошик порожній — оберіть виріб з каталогу або впишіть свій нижче 👇
                    </div>
                  )}

                  {/* Add Item Tabs: Catalog vs Manual */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', padding: 3, borderRadius: 10, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => setItemTab('catalog')}
                      style={{
                        flex: 1, padding: '7px 10px', border: 'none', borderRadius: 8,
                        background: itemTab === 'catalog' ? 'rgba(124,58,237,0.3)' : 'transparent',
                        color: itemTab === 'catalog' ? '#fff' : '#94a3b8',
                        fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                      }}
                    >
                      📚 З каталогу ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemTab('manual')}
                      style={{
                        flex: 1, padding: '7px 10px', border: 'none', borderRadius: 8,
                        background: itemTab === 'manual' ? 'rgba(124,58,237,0.3)' : 'transparent',
                        color: itemTab === 'manual' ? '#fff' : '#94a3b8',
                        fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                      }}
                    >
                      ✍️ Свій виріб / Індивідуальне
                    </button>
                  </div>

                  {itemTab === 'catalog' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
                        <Search size={14} style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Швидкий пошук товару з каталогу..."
                          value={catalogSearchQuery}
                          onChange={(e) => setCatalogSearchQuery(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 12.5, outline: 'none', width: '100%' }}
                        />
                        {catalogSearchQuery && (
                          <X size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setCatalogSearchQuery('')} />
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6, maxHeight: 185, overflowY: 'auto', paddingRight: 2 }}>
                        {filteredCatalogProducts.map(prod => {
                          const finalPrice = prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price;
                          const inCartCount = (formData.items || []).filter(i => i.product_id === prod.id || i.name === prod.name).reduce((s, i) => s + (i.quantity || 1), 0);
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleAddCatalogProduct(prod)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                padding: '7px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                background: inCartCount > 0 ? 'rgba(45,212,191,0.08)' : 'rgba(255,255,255,0.03)',
                                border: inCartCount > 0 ? '1px solid rgba(45,212,191,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                color: '#fff', transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ShoppingBag size={13} style={{ color: '#94a3b8' }} />
                                  </div>
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {prod.name}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#2dd4bf', fontWeight: 850 }}>
                                    {finalPrice} ₴ {inCartCount > 0 && <span style={{ color: '#a78bfa' }}>(в кошику: {inCartCount})</span>}
                                  </div>
                                </div>
                              </div>
                              <span style={{ padding: '4px 8px', borderRadius: 7, background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                                + Додати
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 70px 95px' : '1fr 90px 120px', gap: 8 }}>
                        <input 
                          type="text" placeholder="Назва іграшки / виробу..." value={newItem.name}
                          onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                        />
                        <input 
                          type="text" inputMode="numeric" placeholder="К-сть" value={newItem.quantity}
                          onChange={e => setNewItem({ ...newItem, quantity: e.target.value.replace(/\D/g, '') })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }}
                        />
                        <input 
                          type="text" inputMode="decimal" placeholder="Ціна (₴)" value={newItem.price}
                          onChange={e => setNewItem({ ...newItem, price: e.target.value.replace(/[^0-9.]/g, '') })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Кольори або уточнення (необов'язково, можна обрати після додавання)..."
                        value={newItem.item_note}
                        onChange={e => setNewItem({ ...newItem, item_note: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, color: '#fff', fontSize: 12, outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddManualItem}
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(45,212,191,0.25))', 
                          color: '#fff', border: '1px solid rgba(45,212,191,0.35)', padding: 10, borderRadius: 10, 
                          fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <Plus size={14} style={{ color: '#2dd4bf' }} /> ДОДАТИ СВІЙ ВИРІБ ДО КОШИКА
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. КЛІЄНТ ТА ДОСТАВКА + РОЗУМНА ВСТАВКА */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 18, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 950, color: '#a78bfa', textTransform: 'uppercase' }}>
                      3. Отримувач та Доставка
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        style={{
                          padding: '6px 10px', borderRadius: 9, cursor: 'pointer',
                          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.25))',
                          border: '1px solid rgba(167,139,250,0.4)', color: '#fff',
                          fontSize: 11, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <ClipboardPaste size={13} /> ⚡ Вставити реквізити з буфера
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSmartPaste(!showSmartPaste)}
                        style={{
                          padding: '6px 9px', borderRadius: 9, cursor: 'pointer',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                          color: '#cbd5e1', fontSize: 11, fontWeight: 800
                        }}
                      >
                        {showSmartPaste ? 'Сховати поле' : 'Текст вручну'}
                      </button>
                    </div>
                  </div>

                  {/* Smart Paste Box */}
                  <AnimatePresence>
                    {showSmartPaste && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(124,58,237,0.08)', padding: 12, borderRadius: 12, border: '1px dashed rgba(124,58,237,0.4)' }}
                      >
                        <div style={{ fontSize: 11, color: '#ddd6fe', fontWeight: 700 }}>
                          Вставте повідомлення клієнта одним шматком (ПІБ, телефон, місто, номер відділення):
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Напр.: Коваленко Дмитро, 0971234567, м. Київ, відділення 25"
                          value={smartPasteText}
                          onChange={(e) => setSmartPasteText(e.target.value)}
                          style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', fontSize: 12.5, outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => applySmartPaste(smartPasteText)}
                          style={{ alignSelf: 'flex-end', padding: '7px 14px', borderRadius: 8, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}
                        >
                          ⚡ Розпізнати і заповнити поля
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Delivery Method Switcher */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'nova_poshta', label: '🚚 Нова Пошта' },
                      { id: 'ukrposhta', label: '📮 Укрпошта' },
                      { id: 'pickup', label: '🏪 Самовивіз' }
                    ].map(dm => {
                      const active = formData.shipping_method === dm.id;
                      return (
                        <button
                          key={dm.id}
                          type="button"
                          onClick={() => {
                            const isPick = dm.id === 'pickup';
                            setFormData({
                              ...formData,
                              shipping_method: dm.id,
                              city: isPick ? 'Самовивіз' : (formData.city === 'Самовивіз' ? '' : formData.city)
                            });
                            if (isPick) setNpCityQuery('Самовивіз');
                            else if (npCityQuery === 'Самовивіз') setNpCityQuery('');
                          }}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                            border: active ? '1px solid #ec4899' : '1px solid var(--border)',
                            background: active ? 'rgba(236,72,153,0.16)' : 'rgba(255,255,255,0.03)',
                            color: active ? '#fff' : 'var(--text-muted)'
                          }}
                        >
                          {dm.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Name & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1.2fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ІМ'Я</label>
                      <input 
                        type="text" placeholder="Дмитро" value={formData.firstName} 
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ПРІЗВИЩЕ</label>
                      <input 
                        type="text" placeholder="Коваленко" value={formData.lastName} 
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ТЕЛЕФОН</label>
                      <input 
                        type="tel" placeholder="+380..." value={formData.phone} 
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Existing Customer Suggestions */}
                  {matchingCustomers.length > 0 && !editingSale && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(45,212,191,0.06)', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(45,212,191,0.2)' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={12} /> Знайдено постійного клієнта (клікніть для автозаповнення):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {matchingCustomers.map((mc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                firstName: mc.firstName,
                                lastName: mc.lastName,
                                phone: mc.phone,
                                city: mc.city || formData.city,
                                cityRef: mc.cityRef || formData.cityRef,
                                warehouse: mc.warehouse || formData.warehouse
                              });
                              if (mc.city) setNpCityQuery(mc.city);
                              if (mc.warehouse) setNpWarehouseQuery(mc.warehouse);
                              showToast(`Підтягнуто дані клієнта: ${mc.firstName} ${mc.lastName}`);
                            }}
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.35)',
                              border: '1px solid rgba(45,212,191,0.3)', color: '#fff', fontSize: 11, fontWeight: 750, cursor: 'pointer'
                            }}
                          >
                            {mc.firstName} {mc.lastName} ({mc.phone}) {mc.city ? `• ${mc.city}` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* City & Warehouse (if not pickup) */}
                  {formData.shipping_method !== 'pickup' && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>МІСТО ДОСТАВКИ</label>
                        <input 
                          type="text" placeholder="Введіть місто..." value={npCityQuery} 
                          onChange={e => { 
                            setNpCityQuery(e.target.value); 
                            setFormData({ ...formData, city: e.target.value });
                            setNpShowCities(true); 
                          }}
                          onFocus={() => { if (npCities.length > 0) setNpShowCities(true); }}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: npShowCities && npCities.length > 0 ? '1px solid #7c3aed' : '1px solid var(--border)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                        />
                        {npLoadingCities && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 10, bottom: 12, color: '#7c3aed' }} />}
                        
                        <AnimatePresence>
                          {npShowCities && npCities.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#1e293b', borderRadius: 12, border: '1px solid rgba(124,58,237,0.4)', marginTop: 4, maxHeight: 190, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', padding: 5 }}
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
                                  style={{ width: '100%', padding: '9px 12px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', fontSize: 12.5, borderRadius: 8, cursor: 'pointer' }}
                                >
                                  {city.Description} <span style={{ color: '#94a3b8', fontSize: 11 }}>({city.AreaDescription})</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                          ВІДДІЛЕННЯ / ПОШТОМАТ / АДРЕСА
                          {formData.cityRef && !npLoadingWarehouses && npWarehouses.length > 0 && (
                            <span style={{ color: '#a78bfa', marginLeft: 6 }}>({npWarehouses.length})</span>
                          )}
                        </label>
                        <input 
                          type="text" 
                          placeholder={formData.shipping_method === 'ukrposhta' ? "Індекс та адреса Укрпошти..." : "Номер відділення або поштомату..."} 
                          value={npWarehouseQuery} 
                          onChange={e => { 
                            setNpWarehouseQuery(e.target.value); 
                            setFormData({ ...formData, warehouse: e.target.value });
                            setNpShowWarehouses(true); 
                          }}
                          onFocus={() => { if (formData.cityRef) setNpShowWarehouses(true); }}
                          style={{ 
                            width: '100%', background: 'rgba(0,0,0,0.35)', 
                            border: npShowWarehouses && npFilteredWarehouses.length > 0 ? '1px solid #7c3aed' : '1px solid var(--border)', 
                            borderRadius: 10, padding: 10, color: '#fff', fontSize: 13, outline: 'none'
                          }}
                        />
                        {npLoadingWarehouses && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 10, bottom: 12, color: '#7c3aed' }} />}
                        
                        <AnimatePresence>
                          {npShowWarehouses && formData.cityRef && npFilteredWarehouses.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90, background: '#1e293b', borderRadius: 12, border: '1px solid rgba(124,58,237,0.4)', marginTop: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', padding: 5 }}
                            >
                              {npFilteredWarehouses.slice(0, 80).map(wh => (
                                <button
                                  key={wh.Ref} type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, warehouse: wh.Description });
                                    setNpWarehouseQuery(wh.Description);
                                    setNpShowWarehouses(false);
                                  }}
                                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', fontSize: 12, borderRadius: 8, cursor: 'pointer', lineHeight: 1.35 }}
                                >
                                  {wh.Description}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. СТАТУС, ОПЛАТА ТА НАЛОЖКА (COD) */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 18, padding: isMobile ? 12 : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 950, color: '#f97316', textTransform: 'uppercase' }}>
                    4. Статус, Оплата та Наложка
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <ThemeSelect 
                      label="Етап замовлення"
                      value={formData.status}
                      onChange={(val) => {
                        const updated = { status: val };
                        if (val === 'completed') updated.payment_status = 'paid';
                        setFormData({ ...formData, ...updated });
                      }}
                      displayValue={STATUS_META[formData.status]?.label || STATUS_META.new.label}
                      options={Object.keys(STATUS_META).map(key => ({ value: key, label: STATUS_META[key].label }))}
                    />

                    <ThemeSelect 
                      label="Статус оплати"
                      value={formData.payment_status}
                      onChange={(val) => {
                        const updated = { payment_status: val };
                        if (val === 'paid') {
                          updated.is_cod = false;
                          updated.cod_amount = '';
                        } else if (val === 'partially_paid' && !formData.is_cod) {
                          updated.is_cod = true;
                        }
                        setFormData({ ...formData, ...updated });
                      }}
                      displayValue={formData.payment_status === 'paid' ? 'Оплачено повністю (100%)' : formData.payment_status === 'partially_paid' ? 'Часткова передоплата + Наложка' : formData.payment_status === 'pending' ? 'Очікує оплати / 100% Наложка' : 'Перевірка'}
                      options={[
                        { value: 'paid', label: 'Оплачено повністю (100%)' },
                        { value: 'partially_paid', label: 'Часткова передоплата + Наложка' },
                        { value: 'pending', label: 'Очікує оплати / 100% Наложка' },
                        { value: 'verifying', label: 'Перевірка оплати' }
                      ]}
                    />
                  </div>

                  {/* COD & Prepayment Calculator (Available anytime unless 100% paid!) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div 
                        onClick={() => {
                          const newIsCod = !formData.is_cod;
                          let newCodAmount = formData.cod_amount;
                          if (newIsCod && !newCodAmount) {
                            const prepay = parseFloat(formData.prepayment_amount) || 0;
                            newCodAmount = String(Math.max(0, effectiveTotal - prepay));
                          }
                          setFormData({ ...formData, is_cod: newIsCod, cod_amount: newCodAmount });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ width: 18, height: 18, border: '2px solid #f97316', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.is_cod ? '#f97316' : 'transparent' }}>
                          {formData.is_cod && <Check size={12} style={{ color: '#fff' }} />}
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 850, color: '#fff' }}>
                          Накладений платіж (Наложка на пошті)
                        </span>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {[
                          { label: '100% Наложка', fn: () => applyPrepaymentPreset(0) },
                          { label: 'Аванс 100 ₴', fn: () => applyPrepaymentPreset(100) },
                          { label: 'Аванс 150 ₴', fn: () => applyPrepaymentPreset(150) },
                          { label: 'Аванс 200 ₴', fn: () => applyPrepaymentPreset(200) },
                          { label: 'Аванс 30%', fn: () => applyPrepaymentPreset(Math.round(effectiveTotal * 0.3)) },
                          { label: 'Аванс 50%', fn: () => applyPrepaymentPreset(Math.round(effectiveTotal * 0.5)) }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={preset.fn}
                            style={{
                              padding: '4px 8px', borderRadius: 7, fontSize: 10, fontWeight: 800, cursor: 'pointer',
                              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fdba74'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.is_cod && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 900, color: '#22c55e', display: 'block', marginBottom: 4 }}>ПЕРЕДОПЛАТА КЛІЄНТА (₴)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0 (якщо без передоплати)"
                            value={formData.prepayment_amount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              const prepay = parseFloat(val) || 0;
                              const cod = Math.max(0, Math.round(effectiveTotal - prepay));
                              setFormData({
                                ...formData,
                                prepayment_amount: val,
                                cod_amount: String(cod),
                                payment_status: prepay > 0 ? 'partially_paid' : 'pending'
                              });
                            }}
                            style={{ width: '100%', padding: 9, borderRadius: 9, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(34,197,94,0.3)', color: '#fff', fontSize: 13, fontWeight: 800, outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 9.5, fontWeight: 900, color: '#f97316', display: 'block', marginBottom: 4 }}>СУМА НАЛОЖКИ НА ПОШТІ (₴)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Сума наложки..."
                            value={formData.cod_amount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setFormData({ ...formData, cod_amount: val });
                            }}
                            style={{ width: '100%', padding: 9, borderRadius: 9, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(249,115,22,0.45)', color: '#fff', fontSize: 13, fontWeight: 900, outline: 'none' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Total Override */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      РУЧНА ЗАГАЛЬНА СУМА ЗАМОВЛЕННЯ (₴) — ЗАЛИШТЕ ПОРОЖНІМ ДЛЯ АВТО-СУМИ ({cartTotal} ₴)
                    </label>
                    <input 
                      type="text" inputMode="decimal" placeholder={`Автоматично з кошика: ${cartTotal} ₴`} value={formData.total} 
                      onChange={e => setFormData({ ...formData, total: e.target.value.replace(/[^0-9.]/g, '') })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, color: '#fff', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* 5. ЗАГАЛЬНІ УТОЧНЕННЯ ДО ЗАМОВЛЕННЯ + РЕКЛАМА */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                      ⚠️ 5. Загальні уточнення / побажання до замовлення
                    </label>
                    <textarea 
                      placeholder="Наприклад: відправити у п'ятницю, подарункове пакування, покласти візитку..." 
                      value={formData.notes || ''} 
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 10, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {QUICK_ORDER_NOTES.map(noteTag => (
                        <button
                          key={noteTag}
                          type="button"
                          onClick={() => {
                            const cur = formData.notes ? `${formData.notes} | ${noteTag}` : noteTag;
                            setFormData({ ...formData, notes: cur });
                          }}
                          style={{
                            padding: '4px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: 750, cursor: 'pointer',
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fde68a'
                          }}
                        >
                          + {noteTag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Рекламна інтеграція */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setFormData({ ...formData, sold_via_ad: !formData.sold_via_ad })}
                    >
                      <div style={{ width: 16, height: 16, border: '2px solid #ec4899', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.sold_via_ad ? '#ec4899' : 'transparent' }}>
                        {formData.sold_via_ad && <Check size={11} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 750, color: '#fff' }}>Прив'язати до рекламної кампанії (маркетинг)</span>
                    </div>

                    {formData.sold_via_ad && (
                      <ThemeSelect
                        value={formData.attributed_ad_id}
                        onChange={(adId) => setFormData({ ...formData, attributed_ad_id: adId })}
                        displayValue={
                          (() => {
                            if (!formData.attributed_ad_id) return '';
                            const foundAd = (ads || []).find(a => a && a.id === formData.attributed_ad_id);
                            if (!foundAd) return '';
                            const dateStr = foundAd.ad_date ? new Date(foundAd.ad_date).toLocaleDateString('uk-UA') : '';
                            return `${foundAd.platform || ''} - ${foundAd.product_name || 'Загальна'}${dateStr ? ` (${dateStr})` : ''}`;
                          })()
                        }
                        placeholder="-- Оберіть кампанію --"
                        options={[
                          ...((matchingAds.direct || []).length > 0 ? [{ value: 'header-direct', label: '⭐ Відповідна реклама для товарів:', disabled: true }] : []),
                          ...(matchingAds.direct || []).map(ad => ({
                            value: ad.id,
                            label: `[${ad.platform || 'Ad'}] ${ad.product_name || 'Товар'} (${ad.ad_date ? new Date(ad.ad_date).toLocaleDateString('uk-UA') : ''})`
                          })),
                          ...((matchingAds.general || []).length > 0 ? [{ value: 'header-general', label: '📢 Загальна реклама:', disabled: true }] : []),
                          ...(matchingAds.general || []).map(ad => ({
                            value: ad.id,
                            label: `[${ad.platform || 'Ad'}] ${ad.product_name || 'Загальна'} (${ad.ad_date ? new Date(ad.ad_date).toLocaleDateString('uk-UA') : ''})`
                          })),
                          ...((matchingAds.other || []).length > 0 ? [{ value: 'header-other', label: '🔍 Інші рекламні кампанії:', disabled: true }] : []),
                          ...(matchingAds.other || []).map(ad => ({
                            value: ad.id,
                            label: `[${ad.platform || 'Ad'}] ${ad.product_name || 'Кампанія'} (${ad.ad_date ? new Date(ad.ad_date).toLocaleDateString('uk-UA') : ''})`
                          }))
                        ]}
                      />
                    )}
                  </div>
                </div>
              </form>

              {/* Sticky Modal Footer */}
              <div style={{ 
                padding: isMobile ? '12px 16px' : '14px 24px', 
                borderTop: '1px solid rgba(255,255,255,0.08)', 
                background: 'rgba(15, 23, 42, 0.98)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Підсумок:
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 950, color: '#2dd4bf' }}>
                    {effectiveTotal} ₴
                    {formData.is_cod && formData.cod_amount && (
                      <span style={{ fontSize: 11, color: '#f97316', marginLeft: 6, fontWeight: 800 }}>
                        (Наложка: {formData.cod_amount} ₴)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid var(--border)', fontWeight: 850, cursor: 'pointer', fontSize: 12.5 }}
                  >
                    Скасувати
                  </button>
                  <button 
                    type="submit" 
                    form="sale-form"
                    disabled={saving}
                    style={{ 
                      flex: 1, padding: '12px 20px', borderRadius: 12, 
                      background: 'linear-gradient(135deg, #2dd4bf, #3b82f6)', color: '#fff', border: 'none', 
                      fontWeight: 950, cursor: 'pointer', opacity: saving ? 0.7 : 1, fontSize: 13,
                      boxShadow: '0 6px 20px rgba(45,212,191,0.3)'
                    }}
                  >
                    {saving ? 'ЗБЕРЕЖЕННЯ...' : (editingSale ? 'ЗБЕРЕГТИ ЗМІНИ' : 'СТВОРИТИ ПРОДАЖ')}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
