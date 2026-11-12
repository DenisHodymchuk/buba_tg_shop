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
  LayoutGrid, List, Palette, Star, ClipboardPaste, UserCheck, Check, Calendar, SlidersHorizontal, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FILAMENT_COLORS, 
  QUICK_ITEM_TAGS, 
  QUICK_ORDER_NOTES, 
  getColorMeta, 
  parseSmartShippingText 
} from '@/lib/orderHelpers';
import { loadWarehouseData, applyOrderConsumablesDiff } from '@/lib/warehouseStore';
import DeadlineMiniPicker from '@/components/DeadlineMiniPicker';
import { formatShortDateUa, getTodayKey, DONE_OR_SHIPPED_STATUSES } from '@/lib/calendarHelpers';

// Custom Hallmark Dusk Pill Dropdown for Table Rows (replaces ugly native <select>)
function DuskPillSelect({ value, options, onChange, bg, color, border, dotTone = 'periwinkle' }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const currentOpt = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 27,
          padding: '0 10px',
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          lineHeight: 1,
          cursor: 'pointer',
          background: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
          transition: 'all 0.14s ease'
        }}
      >
        <span
          className={`dusk-dot ${dotTone === 'periwinkle' ? 'dusk-dot--periwinkle' : dotTone === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`}
          style={{ width: 5, height: 5, flexShrink: 0 }}
        />
        <span>{currentOpt?.label}</span>
        <ChevronDown size={11} style={{ opacity: 0.75, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              right: 0,
              minWidth: 168,
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-rule-strong, rgba(255,255,255,0.12))',
              borderRadius: 11,
              padding: 4,
              zIndex: 400,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              textAlign: 'left'
            }}
          >
            {options.map(opt => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    padding: '6px 9px',
                    borderRadius: 7,
                    border: 'none',
                    background: active ? 'var(--color-accent-soft)' : 'transparent',
                    color: active ? 'var(--color-ink)' : 'var(--color-ink-2)',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className={`dusk-dot ${opt.tone === 'periwinkle' ? 'dusk-dot--periwinkle' : opt.tone === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`}
                      style={{ width: 5, height: 5 }}
                    />
                    <span>{opt.label}</span>
                  </span>
                  {active && <Check size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Dusk-themed dropdown component
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
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%',
          background: 'var(--bg-input)',
          border: isOpen ? '1px solid var(--color-accent)' : '1px solid var(--color-rule)',
          borderRadius: 10,
          padding: '9px 12px', 
          color: 'var(--color-ink)',
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'border-color 0.15s ease-out'
        }}
      >
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayValue || value || placeholder}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--color-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
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
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-rule)',
              borderRadius: 12, 
              zIndex: inline ? 1 : 1000,
              padding: 6,
              maxHeight: 220,
              overflowY: 'auto', 
              boxShadow: 'var(--glass-hi), var(--shadow-card)'
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
                      padding: '7px 12px', fontSize: 11.5, fontWeight: 500, color: 'var(--color-muted)', 
                      background: 'oklch(100% 0 0 / 0.03)', borderRadius: 6, marginTop: 4, marginBottom: 2,
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
                    padding: '9px 12px', fontSize: 13, color: 'var(--color-ink)', borderRadius: 8, cursor: 'pointer', 
                    fontWeight: value === opt.value ? 600 : 400, 
                    background: value === opt.value ? 'var(--color-accent-soft)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <span className="dusk-dot dusk-dot--periwinkle" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dusk Two-Signal Status System (Periwinkle for matched/done/transit, Apricot for open/active work, Muted Rose for cancelled)
const STATUS_META = {
  new: { 
    label: 'Нові', 
    fullLabel: 'Нові замовлення',
    tone: 'apricot',
    color: 'var(--color-accent-2)', 
    bg: 'var(--color-accent-2-soft)', 
    border: 'var(--color-accent-2-border)',
    icon: Clock 
  },
  printing: { 
    label: 'Друк', 
    fullLabel: 'Друк на принтері',
    tone: 'apricot',
    color: 'var(--color-accent-2)', 
    bg: 'var(--color-accent-2-soft)', 
    border: 'var(--color-accent-2-border)',
    icon: Printer 
  },
  painting: { 
    label: 'Склейка', 
    fullLabel: 'Склейка / фарбування',
    tone: 'apricot',
    color: 'var(--color-accent-2)', 
    bg: 'var(--color-accent-2-soft)', 
    border: 'var(--color-accent-2-border)',
    icon: Palette 
  },
  preparing: { 
    label: 'Пакування', 
    fullLabel: 'Пакування',
    tone: 'slate',
    color: 'var(--color-ink-2)', 
    bg: 'oklch(100% 0 0 / 0.05)', 
    border: 'var(--color-rule)',
    icon: ClipboardList 
  },
  shipping: { 
    label: 'До відправки', 
    fullLabel: 'Готово до відправлення',
    tone: 'apricot',
    color: 'var(--color-accent-2)', 
    bg: 'var(--color-accent-2-soft)', 
    border: 'var(--color-accent-2-border)',
    icon: Truck 
  },
  shipped: { 
    label: 'В дорозі', 
    fullLabel: 'В дорозі',
    tone: 'periwinkle',
    color: 'var(--color-accent)', 
    bg: 'var(--color-accent-soft)', 
    border: 'var(--color-accent-border)',
    icon: Send 
  },
  completed: { 
    label: 'Виконано', 
    fullLabel: 'Виконано',
    tone: 'periwinkle',
    color: 'var(--color-accent)', 
    bg: 'var(--color-accent-soft)', 
    border: 'var(--color-accent-border)',
    icon: CheckCircle2 
  },
  cancelled: { 
    label: 'Скасовано', 
    fullLabel: 'Скасовано',
    tone: 'danger',
    color: 'var(--color-danger)', 
    bg: 'var(--color-danger-soft)', 
    border: 'var(--color-danger-border)',
    icon: XCircle 
  }
};

const CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'olx', label: 'OLX' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'website', label: 'Сайт' },
  { value: 'threads', label: 'Threads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'offline', label: 'Офлайн' },
  { value: 'other', label: 'Інше' }
];

export default function SalesDashboard({ showToast, externalOpenAdd, onClearExternalOpenAdd, externalAddDueDate, onClearExternalAddDueDate, externalEditOrder, onClearExternalEditOrder, onOrdersChanged }) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | '7d' | '30d'
  const [onlyPriority, setOnlyPriority] = useState(false);
  const [onlyCod, setOnlyCod] = useState(false);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [multiStatusMode, setMultiStatusMode] = useState(false);
  const [showPresetInput, setShowPresetInput] = useState(false);

  const [salesFilterTemplates, setSalesFilterTemplates] = useState([]);
  const [newSalesTemplateName, setNewSalesTemplateName] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  const [showAddForm, setShowAddForm] = useState(false);
  const [ads, setAds] = useState([]);
  const [expandedSalesIds, setExpandedSalesIds] = useState([]);

  // Smart paste state
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [pendingWarehouseNumber, setPendingWarehouseNumber] = useState('');

  // Active item index for editing colors/notes inside the cart
  const [openColorEditorIdx, setOpenColorEditorIdx] = useState(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('Всі');
  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(false);
  const catalogPickerRef = React.useRef(null);

  useEffect(() => {
    if (!catalogDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (catalogPickerRef.current && !catalogPickerRef.current.contains(e.target)) {
        setCatalogDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [catalogDropdownOpen]);

  // Warehouse materials for 1-click write-off in sales
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('all');
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const warehousePickerRef = React.useRef(null);

  useEffect(() => {
    if (!warehouseDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (warehousePickerRef.current && !warehousePickerRef.current.contains(e.target)) {
        setWarehouseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [warehouseDropdownOpen]);

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
    items: [],
    consumables: [],
    is_cod: false,
    prepayment_amount: '',
    cod_amount: '',
    notes: '',
    is_priority: false,
    due_date: '',
    due_days: 1,
    sold_via_ad: false,
    attributed_ad_id: ''
  });

  const [itemTab, setItemTab] = useState('catalog');
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

  useEffect(() => {
    if (externalOpenAdd) {
      resetForm();
      if (externalAddDueDate) {
        setFormData(prev => ({ ...prev, due_date: externalAddDueDate }));
        onClearExternalAddDueDate?.();
      }
      setShowAddForm(true);
      onClearExternalOpenAdd?.();
    }
  }, [externalOpenAdd, externalAddDueDate]);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchAds();
    loadWarehouseData(supabase).then(res => setWarehouseItems(res.items || []));

    const onWhUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail.items)) {
        setWarehouseItems(e.detail.items);
      }
    };
    window.addEventListener('buba_warehouse_updated', onWhUpdated);
    return () => window.removeEventListener('buba_warehouse_updated', onWhUpdated);
  }, []);

  // City search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = npCityQuery.trim();
      if (q.length >= 2 && (!formData.cityRef || q !== formData.city)) {
        setNpLoadingCities(true);
        const data = await novaPoshta.getCities(q);
        const citiesList = Array.isArray(data) ? data : [];
        setNpCities(citiesList);
        setNpLoadingCities(false);

        if (q !== formData.city) {
          setNpShowCities(true);
        }

        if (!formData.cityRef && citiesList.length > 0) {
          const exactCity = citiesList.find(
            c => c.Description?.toLowerCase() === q.toLowerCase()
          );
          if (exactCity) {
            setFormData(prev => ({
              ...prev,
              city: exactCity.Description,
              cityRef: exactCity.Ref
            }));
          }
        }
      } else if (q.length < 2) {
        setNpCities([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [npCityQuery, formData.city, formData.cityRef]);

  // Warehouse fetch effect
  useEffect(() => {
    async function fetchWarehouses() {
      if (formData.cityRef) {
        setNpLoadingWarehouses(true);
        const data = await novaPoshta.getWarehouses(formData.cityRef);
        setNpWarehouses(data || []);
        setNpLoadingWarehouses(false);

        if (pendingWarehouseNumber && Array.isArray(data) && data.length > 0) {
          const numStr = String(pendingWarehouseNumber);
          const exactMatch = data.find(w => 
            String(w.Number) === numStr || 
            new RegExp(`(?:№|відділення|поштомат)\\s*${numStr}\\b`, 'i').test(w.Description)
          );
          if (exactMatch) {
            setFormData(prev => ({ ...prev, warehouse: exactMatch.Description }));
            setNpWarehouseQuery(exactMatch.Description);
            setNpShowWarehouses(false);
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
    const q = String(npWarehouseQuery || '').trim().toLowerCase();
    if (!q || (formData.warehouse && q === String(formData.warehouse).trim().toLowerCase())) {
      return npWarehouses;
    }
    const filtered = npWarehouses.filter(w => 
      w && (
        (w.Description && String(w.Description).toLowerCase().includes(q)) ||
        (w.Number && String(w.Number).toLowerCase().includes(q))
      )
    );
    return filtered.sort((a, b) => {
      const aExact = String(a.Number) === q ? 0 : 1;
      const bExact = String(b.Number) === q ? 0 : 1;
      return aExact - bExact;
    });
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

  const handleKanbanTogglePriority = async (sale) => {
    const details = sale.shipping_details || {};
    const updatedDetails = { ...details, is_priority: !details.is_priority };
    await handleUpdateOrderStatus(sale.id, { shipping_details: updatedDetails });
  };

  const handleKanbanToggleItemManufactured = async (sale, idx) => {
    const details = sale.shipping_details || {};
    const items = Array.isArray(details.items) ? [...details.items] : [];
    if (!items[idx]) return;
    items[idx] = { ...items[idx], is_manufactured: !items[idx].is_manufactured };
    const updatedDetails = { ...details, items };
    await handleUpdateOrderStatus(sale.id, { shipping_details: updatedDetails });
  };

  const handleKanbanSaveTtn = async (sale, cleanTtn, andShip) => {
    const details = sale.shipping_details || {};
    const updatedDetails = { ...details, ttn: cleanTtn };
    const updates = { shipping_details: updatedDetails };
    if (andShip) updates.status = 'shipped';
    await handleUpdateOrderStatus(sale.id, updates);
    showToast(andShip ? 'ТТН збережено, замовлення переведено «В дорозі»' : 'ТТН збережено', 'success');
  };

  const saveSalesFilterTemplate = (name) => {
    if (!name.trim()) return;
    const newTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      selectedSources,
      selectedPayments,
      selectedStatuses,
      dateFilter,
      onlyPriority,
      onlyCod,
      onlyWithNotes,
      isDefault: false
    };
    const updated = [...salesFilterTemplates, newTemplate];
    setSalesFilterTemplates(updated);
    localStorage.setItem('buba_sales_filter_templates', JSON.stringify(updated));
    setNewSalesTemplateName('');
    setShowPresetInput(false);
    showToast('Шаблон фільтрів збережено', 'success');
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
    if (template.dateFilter) setDateFilter(template.dateFilter);
    setOnlyPriority(!!template.onlyPriority);
    setOnlyCod(!!template.onlyCod);
    setOnlyWithNotes(!!template.onlyWithNotes);
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

  const handlePipelineClick = (status, e) => {
    if (status === 'Всі') {
      setSelectedStatuses([]);
      return;
    }
    if (multiStatusMode || e?.shiftKey || e?.metaKey || e?.ctrlKey) {
      setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    } else {
      setSelectedStatuses(prev => (prev.length === 1 && prev[0] === status) ? [] : [status]);
    }
  };

  const toggleExpandSale = (id) => {
    if (typeof window !== 'undefined' && window.getSelection()?.toString().length > 0) return;
    setExpandedSalesIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Base filtered sales (excluding status filter so pipeline counts reflect active search/date/payment/source filters)
  const preStatusSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const src = s.source || 'website';
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(src);
      const matchesPayment = selectedPayments.length === 0 || selectedPayments.includes(s.payment_status);
      
      const details = s.shipping_details || {};
      if (onlyPriority && !details.is_priority) return false;
      if (onlyCod && !details.is_cod) return false;
      const hasNotes = Boolean(details.notes || (details.items || []).some(i => i.item_note || (i.colors && i.colors.length > 0)));
      if (onlyWithNotes && !hasNotes) return false;

      if (dateFilter !== 'all' && s.created_at) {
        const createdDate = new Date(s.created_at);
        if (dateFilter === 'today') {
          if (createdDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === '7d') {
          if ((now - createdDate) / (1000 * 3600 * 24) > 7) return false;
        } else if (dateFilter === '30d') {
          if ((now - createdDate) / (1000 * 3600 * 24) > 30) return false;
        }
      }

      const name = `${details.firstName || ''} ${details.lastName || ''} ${s.customers?.first_name || ''} ${s.customers?.last_name || ''}`.toLowerCase();
      const phone = `${details.phone || ''} ${s.customers?.phone || ''}`;
      const num = s.order_number || '';
      const notes = `${details.notes || ''} ${details.city || ''} ${details.ttn || ''} ${(details.items || []).map(i => `${i.name || ''} ${(i.colors || []).join(' ')} ${i.item_note || ''}`).join(' ')}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || name.includes(query) || phone.includes(query) || num.toLowerCase().includes(query) || notes.includes(query);

      return matchesSource && matchesPayment && matchesSearch;
    });
  }, [sales, selectedSources, selectedPayments, onlyPriority, onlyCod, onlyWithNotes, dateFilter, searchQuery]);

  // Status counts for the pipeline bar
  const statusCounts = useMemo(() => {
    const counts = { all: preStatusSales.length };
    Object.keys(STATUS_META).forEach(k => { counts[k] = 0; });
    preStatusSales.forEach(s => {
      const st = s.status || 'new';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [preStatusSales]);

  const filteredSales = useMemo(() => {
    if (selectedStatuses.length === 0) return preStatusSales;
    return preStatusSales.filter(s => selectedStatuses.includes(s.status));
  }, [preStatusSales, selectedStatuses]);

  // Dusk Ruled Tally metrics for the current filtered selection
  const tallyMetrics = useMemo(() => {
    let totalSum = 0;
    let unpaidCount = 0;
    let unpaidSum = 0;
    let activeWorkCount = 0;

    filteredSales.forEach(s => {
      if (s.status === 'cancelled') return;
      const amt = parseFloat(s.total) || 0;
      totalSum += amt;

      const details = s.shipping_details || {};
      if (s.payment_status !== 'paid') {
        unpaidCount += 1;
        const codAmt = details.is_cod && details.cod_amount ? parseFloat(details.cod_amount) : amt;
        unpaidSum += (isNaN(codAmt) ? amt : codAmt);
      }

      if (['new', 'printing', 'painting', 'preparing', 'shipping'].includes(s.status)) {
        activeWorkCount += 1;
      }
    });

    return {
      count: filteredSales.length,
      totalSum: Math.round(totalSum),
      unpaidCount,
      unpaidSum: Math.round(unpaidSum),
      activeWorkCount
    };
  }, [filteredSales]);

  const activeFilterCount = useMemo(() => {
    return (
      selectedStatuses.length +
      selectedPayments.length +
      selectedSources.length +
      (dateFilter !== 'all' ? 1 : 0) +
      (onlyPriority ? 1 : 0) +
      (onlyCod ? 1 : 0) +
      (onlyWithNotes ? 1 : 0) +
      (searchQuery ? 1 : 0)
    );
  }, [selectedStatuses, selectedPayments, selectedSources, dateFilter, onlyPriority, onlyCod, onlyWithNotes, searchQuery]);

  const clearAllFilters = () => {
    setSelectedSources([]);
    setSelectedPayments([]);
    setSelectedStatuses([]);
    setDateFilter('all');
    setOnlyPriority(false);
    setOnlyCod(false);
    setOnlyWithNotes(false);
    setSearchQuery('');
  };

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
    showToast('Реквізити розпізнано та заповнено', 'success');
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
    setOpenColorEditorIdx(null);
    showToast(`Додано: ${prod.name}`);
  };

  const handleAddManualItem = () => {
    if (!newItem.name || !newItem.price) {
      showToast('Введіть назву та ціну товару', 'error');
      return;
    }
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
    setOpenColorEditorIdx(null);
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
    setOpenColorEditorIdx(null);
    showToast('Позицію продубльовано');
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

  const handleAddConsumableToSale = (whItem) => {
    if (!whItem) return;
    setFormData(prev => {
      const current = Array.isArray(prev.consumables) ? [...prev.consumables] : [];
      const existingIdx = current.findIndex(c => c.item_id === whItem.id);
      if (existingIdx !== -1) {
        current[existingIdx] = {
          ...current[existingIdx],
          quantity: (Number(current[existingIdx].quantity) || 1) + 1
        };
      } else {
        current.push({
          item_id: whItem.id,
          name: whItem.name,
          unit: whItem.unit || 'шт.',
          quantity: 1,
          cost_unit: Number(whItem.cost_unit) || 0
        });
      }
      return { ...prev, consumables: current };
    });
  };

  const handleUpdateConsumableQty = (itemId, delta) => {
    setFormData(prev => {
      const current = Array.isArray(prev.consumables) ? [...prev.consumables] : [];
      const idx = current.findIndex(c => c.item_id === itemId);
      if (idx === -1) return prev;
      const nextQty = (Number(current[idx].quantity) || 1) + delta;
      if (nextQty <= 0) {
        current.splice(idx, 1);
      } else {
        current[idx] = { ...current[idx], quantity: nextQty };
      }
      return { ...prev, consumables: current };
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
      const itemsTotal = formData.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
      const finalTotal = parseFloat(formData.total) || itemsTotal;

      const orderNumber = editingSale?.order_number || `MAN-${formData.source.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const finalCity = formData.shipping_method === 'pickup' 
        ? 'Самовивіз' 
        : (formData.city || npCityQuery || '').trim();
      const finalWarehouse = formData.shipping_method === 'pickup' 
        ? '' 
        : (formData.warehouse || npWarehouseQuery || '').trim();

      const nextConsumables = Array.isArray(formData.consumables) ? formData.consumables : [];
      const prevConsumables = editingSale?.shipping_details?.consumables || [];

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
          consumables: nextConsumables,
          is_cod: formData.is_cod,
          prepayment_amount: formData.prepayment_amount ? (parseFloat(formData.prepayment_amount) || 0) : 0,
          cod_amount: formData.is_cod ? (parseFloat(formData.cod_amount) || 0) : 0,
          notes: formData.notes.trim(),
          is_priority: formData.is_priority,
          due_date: formData.due_date || '',
          due_days: formData.due_date ? (Number(formData.due_days) || 1) : 1,
          sold_via_ad: formData.sold_via_ad,
          attributed_ad_id: (formData.sold_via_ad && formData.attributed_ad_id && !formData.attributed_ad_id.startsWith('header-')) ? formData.attributed_ad_id : null
        }
      };

      const shortOrderLabel = orderNumber.replace(/^MAN-[A-Z]+-/, '#');
      const fullClientLabel = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

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

        await applyOrderConsumablesDiff(supabase, shortOrderLabel, fullClientLabel, prevConsumables, nextConsumables);
        showToast('Продаж оновлено успішно');
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([saleData]);
        if (error) throw error;

        const newAdId = formData.sold_via_ad ? formData.attributed_ad_id : null;
        if (formData.status === 'completed' && newAdId) {
          await adjustAdRevenue(newAdId, finalTotal);
        }

        await applyOrderConsumablesDiff(supabase, shortOrderLabel, fullClientLabel, [], nextConsumables);
        showToast('Продаж додано успішно');
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
      consumables: Array.isArray(details.consumables) ? details.consumables : [],
      is_cod: !!details.is_cod,
      prepayment_amount: details.prepayment_amount ? String(details.prepayment_amount) : '',
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || '',
      is_priority: !!details.is_priority,
      due_date: details.due_date || '',
      due_days: Number(details.due_days) || 1,
      sold_via_ad: !!details.sold_via_ad,
      attributed_ad_id: details.attributed_ad_id || ''
    });

    setNpCityQuery(cityVal);
    setNpWarehouseQuery(details.warehouse || '');
    setOpenColorEditorIdx(null);
    setShowAddForm(true);

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
      consumables: Array.isArray(details.consumables) ? JSON.parse(JSON.stringify(details.consumables)) : [],
      is_cod: !!details.is_cod,
      prepayment_amount: details.prepayment_amount ? String(details.prepayment_amount) : '',
      cod_amount: details.cod_amount ? String(details.cod_amount) : '',
      notes: details.notes || '',
      is_priority: false,
      due_date: '',
      due_days: 1,
      sold_via_ad: !!details.sold_via_ad,
      attributed_ad_id: details.attributed_ad_id || ''
    });

    setNpCityQuery(details.city || '');
    setNpWarehouseQuery(details.warehouse || '');
    setOpenColorEditorIdx(null);
    setShowAddForm(true);
    showToast('Дані замовлення скопійовано — перевірте та збережіть', 'info');
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
      if (sale && Array.isArray(sale.shipping_details?.consumables) && sale.shipping_details.consumables.length > 0) {
        const shortLabel = sale.order_number ? sale.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${String(sale.id).slice(0, 6)}`;
        await applyOrderConsumablesDiff(supabase, shortLabel, sale.client_name || '', sale.shipping_details.consumables, []);
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
      consumables: [],
      is_cod: false,
      prepayment_amount: '',
      cod_amount: '',
      notes: '',
      is_priority: false,
      due_date: '',
      due_days: 1,
      sold_via_ad: false,
      attributed_ad_id: ''
    });
    setNewItem({ name: '', quantity: 1, price: '', colors: [], item_note: '' });
    setEditingSale(null);
    setItemTab('catalog');
    setCatalogSearchQuery('');
    setCatalogDropdownOpen(false);
    setWarehouseSearchQuery('');
    setWarehouseDropdownOpen(false);
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

  const getPlatformBadgeName = (plat) => {
    const found = CHANNELS.find(c => c.value === plat?.toLowerCase());
    return found ? found.label : 'Інше';
  };

  const catalogCategories = useMemo(() => {
    const prodList = Array.isArray(products) ? products : [];
    const set = new Set();
    prodList.forEach(p => {
      if (p?.category) set.add(p.category.trim());
    });
    return ['Всі', ...Array.from(set)];
  }, [products]);

  const filteredCatalogProducts = useMemo(() => {
    let prodList = Array.isArray(products) ? products : [];
    if (catalogCategoryFilter && catalogCategoryFilter !== 'Всі') {
      prodList = prodList.filter(p => (p?.category || '').trim() === catalogCategoryFilter);
    }
    if (!catalogSearchQuery.trim()) return prodList;
    const q = catalogSearchQuery.toLowerCase();
    return prodList.filter(p => p?.name && p.name.toLowerCase().includes(q));
  }, [products, catalogSearchQuery, catalogCategoryFilter]);

  const filteredWarehouseItems = useMemo(() => {
    let list = Array.isArray(warehouseItems) ? warehouseItems.filter(w => w.quick_sale !== false) : [];
    if (warehouseCategoryFilter && warehouseCategoryFilter !== 'all') {
      list = list.filter(w => w.category === warehouseCategoryFilter);
    }
    if (!warehouseSearchQuery.trim()) return list;
    const q = warehouseSearchQuery.toLowerCase();
    return list.filter(w => w?.name && w.name.toLowerCase().includes(q));
  }, [warehouseItems, warehouseSearchQuery, warehouseCategoryFilter]);

  useEffect(() => {
    if (externalEditOrder) {
      handleEdit(externalEditOrder);
      onClearExternalEditOrder?.();
    }
  }, [externalEditOrder]);

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

  const prevEffectiveTotalRef = React.useRef(effectiveTotal);
  useEffect(() => {
    if (prevEffectiveTotalRef.current !== effectiveTotal) {
      prevEffectiveTotalRef.current = effectiveTotal;
      if (showAddForm && formData.is_cod) {
        const prepay = parseFloat(formData.prepayment_amount) || 0;
        const nextCod = Math.max(0, Math.round(effectiveTotal - prepay));
        setFormData(prev => ({ ...prev, cod_amount: String(nextCod) }));
      }
    }
  }, [effectiveTotal, showAddForm, formData.is_cod, formData.prepayment_amount]);

  const applyPrepaymentPreset = (prepayVal) => {
    const total = effectiveTotal;
    const prepay = Math.min(total, Math.max(0, prepayVal));
    const cod = Math.max(0, Math.round(total - prepay));
    setFormData(prev => ({
      ...prev,
      is_cod: prepayVal === 0 ? true : cod > 0,
      prepayment_amount: prepay > 0 ? String(prepay) : '',
      cod_amount: String(cod),
      payment_status: prepay <= 0 ? 'pending' : (cod <= 0 ? 'paid' : 'partially_paid')
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', height: isMobile ? 'auto' : 'calc(100vh - 28px)', overflow: isMobile ? 'visible' : 'hidden', paddingBottom: isMobile ? 78 : 0 }}>
      
      {/* Dusk Command & Filter Panel */}
      <div className="dusk-glass" style={{ padding: isMobile ? 14 : '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
        
        {/* Top Row: Title + Search + Period + View Switcher + Primary Action */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 500, color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.022em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Реєстр замовлень</span>
                <span className="dusk-num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-muted)', background: 'oklch(100% 0 0 / 0.05)', padding: '2px 10px', borderRadius: 999, border: '1px solid var(--color-rule)' }}>
                  {tallyMetrics.count}
                </span>
              </h1>
            </div>

            {isMobile && (
              <button 
                type="button"
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="dusk-btn-primary"
                style={{ minHeight: 36, padding: '0 14px', fontSize: 12.5 }}
              >
                <Plus size={15} /> Новий продаж
              </button>
            )}
          </div>

          {/* Search, Period, View Mode & Primary CTA */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            {/* Search Pill */}
            <div style={{ flex: isMobile ? '1 1 100%' : '0 1 280px', minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--color-rule)', borderRadius: 999, padding: '6px 14px' }}>
              <Search size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Пошук клієнта, телефону, ТТН, виробу…" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12.5, outline: 'none', width: '100%' }} 
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}
                  aria-label="Очистити пошук"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Date Segment */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--color-rule)', borderRadius: 999, padding: 2, gap: 2 }}>
              {[
                { id: 'all', label: 'Весь час' },
                { id: 'today', label: 'Сьогодні' },
                { id: '7d', label: '7 днів' },
                { id: '30d', label: '30 днів' }
              ].map(df => {
                const active = dateFilter === df.id;
                return (
                  <button
                    key={df.id}
                    type="button"
                    onClick={() => setDateFilter(df.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: 'none',
                      background: active ? 'var(--color-paper-3)' : 'transparent',
                      color: active ? 'var(--color-ink)' : 'var(--color-muted)',
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                  >
                    {df.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--color-rule)', borderRadius: 999, padding: 2, gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => switchViewMode('table')}
                style={{
                  padding: '5px 11px', borderRadius: 999, border: 'none',
                  background: viewMode === 'table' ? 'var(--color-paper-3)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--color-ink)' : 'var(--color-muted)',
                  fontSize: 12, fontWeight: viewMode === 'table' ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <List size={13} />
                <span>Список</span>
              </button>
              <button
                type="button"
                onClick={() => switchViewMode('kanban')}
                style={{
                  padding: '5px 11px', borderRadius: 999, border: 'none',
                  background: viewMode === 'kanban' ? 'var(--color-paper-3)' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--color-ink)' : 'var(--color-muted)',
                  fontSize: 12, fontWeight: viewMode === 'kanban' ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <LayoutGrid size={13} />
                <span>Канбан</span>
              </button>
            </div>

            {!isMobile && (
              <button 
                type="button"
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="dusk-btn-primary"
                style={{ minHeight: 36, padding: '0 16px', flexShrink: 0 }}
              >
                <Plus size={15} /> Новий продаж
              </button>
            )}
          </div>
        </div>

        {/* Dusk Ruled Tally of Four Figures (Compact, calm, tabular numerals) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', 
          borderTop: '1px solid var(--color-rule)', 
          borderBottom: '1px solid var(--color-rule)', 
          padding: '10px 0',
          gap: isMobile ? 10 : 0
        }}>
          <div style={{ paddingRight: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>Сума вибірки</span>
            <span className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--color-ink)' }}>
              {tallyMetrics.totalSum.toLocaleString('uk-UA')}<span className="c" style={{ fontSize: 13 }}> ₴</span>
            </span>
          </div>

          <div style={{ padding: isMobile ? '0' : '0 16px', borderLeft: isMobile ? 'none' : '1px solid var(--color-rule)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="dusk-dot dusk-dot--apricot" />
              Очікує / наложка
            </span>
            <span className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--color-accent-2)' }}>
              {tallyMetrics.unpaidSum.toLocaleString('uk-UA')}<span className="c" style={{ fontSize: 13 }}> ₴ ({tallyMetrics.unpaidCount})</span>
            </span>
          </div>

          <div style={{ padding: isMobile ? '0 16px 0 0' : '0 16px', borderLeft: isMobile ? 'none' : '1px solid var(--color-rule)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="dusk-dot dusk-dot--periwinkle" />
              Активні в роботі
            </span>
            <span className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--color-ink)' }}>
              {tallyMetrics.activeWorkCount}<span className="c" style={{ fontSize: 13 }}> зам.</span>
            </span>
          </div>

          <div style={{ paddingLeft: isMobile ? 0 : 16, borderLeft: isMobile ? 'none' : '1px solid var(--color-rule)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>Готові до відправки</span>
            <span className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: statusCounts.shipping > 0 ? 'var(--color-accent-2)' : 'var(--color-ink)' }}>
              {statusCounts.shipping || 0}<span className="c" style={{ fontSize: 13 }}> посилок</span>
            </span>
          </div>
        </div>

        {/* Row 2: Live Status Pipeline Strip (1-Click Stage Filter with Real-Time Counts) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="dusk-pipeline hide-scrollbar" style={{ flex: 1 }}>
            <button
              type="button"
              onClick={(e) => handlePipelineClick('Всі', e)}
              className={`dusk-pipeline__step ${selectedStatuses.length === 0 ? 'is-active' : ''}`}
            >
              <span>Усі етапи</span>
              <span className="dusk-pipeline__count">{statusCounts.all}</span>
            </button>

            {Object.keys(STATUS_META).map(key => {
              const meta = STATUS_META[key];
              const active = selectedStatuses.includes(key);
              const count = statusCounts[key] || 0;
              const dotClass = meta.tone === 'periwinkle' 
                ? 'dusk-dot--periwinkle' 
                : meta.tone === 'apricot' 
                  ? 'dusk-dot--apricot' 
                  : meta.tone === 'danger' 
                    ? 'dusk-dot--danger' 
                    : 'dusk-dot--muted';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => handlePipelineClick(key, e)}
                  className={`dusk-pipeline__step ${active ? 'is-active' : ''}`}
                  title={`${meta.fullLabel} (Shift+клік для декількох)`}
                >
                  <span className={`dusk-dot ${dotClass}`} style={{ width: 6, height: 6 }} />
                  <span>{meta.label}</span>
                  <span className="dusk-pipeline__count">{count}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMultiStatusMode(!multiStatusMode)}
            className={`dusk-facet-pill ${multiStatusMode ? 'is-active' : ''}`}
            title="Дозволити вибір кількох етапів одночасно одним кліком"
            style={{ padding: '6px 10px', fontSize: 11.5 }}
          >
            <SlidersHorizontal size={12} />
            <span>{multiStatusMode ? 'Мульти-вибір: Увімк.' : 'Мульти-вибір'}</span>
          </button>
        </div>

        {/* Row 3: Facet Filters (Payment, Quick Flags, Channels, Saved Presets) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Payment Filter Pills */}
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Оплата:</span>
            {[
              { val: 'Всі', label: 'Усі', dot: null },
              { val: 'pending', label: 'Очікує', dot: 'apricot' },
              { val: 'partially_paid', label: 'Частково', dot: 'apricot' },
              { val: 'paid', label: 'Оплачено', dot: 'periwinkle' }
            ].map(item => {
              const active = item.val === 'Всі' ? selectedPayments.length === 0 : selectedPayments.includes(item.val);
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => togglePaymentFilter(item.val)}
                  className={`dusk-facet-pill ${active ? (item.dot === 'apricot' ? 'is-active-apricot' : 'is-active') : ''}`}
                >
                  {item.dot && (
                    <span className={`dusk-dot ${item.dot === 'apricot' ? 'dusk-dot--apricot' : 'dusk-dot--periwinkle'}`} style={{ width: 6, height: 6 }} />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <span style={{ width: 1, height: 16, background: 'var(--color-rule)', margin: '0 4px' }} />

            {/* Quick Facet Flags */}
            <button
              type="button"
              onClick={() => setOnlyPriority(!onlyPriority)}
              className={`dusk-facet-pill ${onlyPriority ? 'is-active-apricot' : ''}`}
            >
              <Star size={11} fill={onlyPriority ? 'var(--color-accent-2)' : 'transparent'} style={{ color: 'var(--color-accent-2)' }} />
              <span>Пріоритет</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyCod(!onlyCod)}
              className={`dusk-facet-pill ${onlyCod ? 'is-active-apricot' : ''}`}
            >
              <span>Наложка</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyWithNotes(!onlyWithNotes)}
              className={`dusk-facet-pill ${onlyWithNotes ? 'is-active' : ''}`}
            >
              <span>З деталями</span>
            </button>

            <span style={{ width: 1, height: 16, background: 'var(--color-rule)', margin: '0 4px' }} />

            {/* Channel Filter Pills */}
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Канал:</span>
            {[
              { val: 'Всі', label: 'Усі' },
              ...CHANNELS.slice(0, 5).map(c => ({ val: c.value, label: c.label }))
            ].map(ch => {
              const active = ch.val === 'Всі' ? selectedSources.length === 0 : selectedSources.includes(ch.val);
              return (
                <button
                  key={ch.val}
                  type="button"
                  onClick={() => toggleSourceFilter(ch.val)}
                  className={`dusk-facet-pill ${active ? 'is-active' : ''}`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>

          {/* Saved Filter Presets & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {salesFilterTemplates.map(t => (
              <div
                key={t.id}
                onClick={() => applySalesTemplate(t)}
                className="dusk-facet-pill"
                style={{ paddingRight: 6 }}
              >
                <span>{t.name}</span>
                <button
                  type="button"
                  onClick={(e) => toggleSalesTemplateDefault(t.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: t.isDefault ? 'var(--color-accent-2)' : 'var(--color-muted)', fontSize: 11 }}
                  title="За замовчуванням"
                >
                  {t.isDefault ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteSalesFilterTemplate(t.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--color-muted)', fontSize: 10 }}
                  title="Видалити шаблон"
                >
                  ✕
                </button>
              </div>
            ))}

            {showPresetInput ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  placeholder="Назва фільтру…"
                  value={newSalesTemplateName}
                  onChange={(e) => setNewSalesTemplateName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveSalesFilterTemplate(newSalesTemplateName); }}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--color-rule)', borderRadius: 999, padding: '4px 10px', color: 'var(--color-ink)', fontSize: 11.5, outline: 'none', width: 120 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveSalesFilterTemplate(newSalesTemplateName)}
                  className="dusk-facet-pill is-active"
                >
                  Зберегти
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresetInput(false)}
                  className="dusk-facet-pill"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPresetInput(true)}
                className="dusk-facet-pill"
                style={{ borderStyle: 'dashed' }}
              >
                + Шаблон
              </button>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="dusk-facet-pill"
                style={{ color: 'var(--color-accent-2)', borderColor: 'var(--color-accent-2-border)' }}
              >
                Скинути ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container (Table / Mobile Cards or Kanban) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', overflow: isMobile ? 'visible' : 'hidden' }}>
        {viewMode === 'kanban' ? (
          <OrderKanbanBoard 
            sales={filteredSales}
            isMobile={isMobile}
            onStatusChange={(sale, targetColId) => handleUpdateOrderStatus(sale.id, { status: targetColId })}
            onTogglePriority={handleKanbanTogglePriority}
            onToggleItemManufactured={handleKanbanToggleItemManufactured}
            onSaveTtn={handleKanbanSaveTtn}
            onEditSale={handleEdit}
            onDeleteSale={handleDelete}
            onDuplicateSale={handleDuplicate}
            showToast={showToast}
          />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredSales.length === 0 ? (
              <div className="dusk-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)', fontSize: 14 }}>
                Замовлень за вибраними фільтрами не знайдено.
              </div>
            ) : (
              filteredSales.map(sale => {
                const details = sale.shipping_details || {};
                const clientName = `${details.firstName || ''} ${details.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
                const clientPhone = details.phone || sale.customers?.phone || 'Не вказано';
                const items = Array.isArray(details.items) ? details.items : [];
                const isExpanded = expandedSalesIds.includes(sale.id);
                const isPriority = !!details.is_priority;
                const meta = STATUS_META[sale.status] || STATUS_META.new;
                
                return (
                  <div 
                    key={sale.id} 
                    className="dusk-panel"
                    style={{ 
                      border: isPriority ? '1px solid var(--color-accent-2-border)' : '1px solid var(--color-rule)', 
                      padding: 14, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: isExpanded ? 12 : 8
                    }}
                  >
                    <div 
                      onClick={() => toggleExpandSale(sale.id)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {isPriority && <Star size={13} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" />}
                          <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500 }}>
                            {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-ink-2)', background: 'oklch(100% 0 0 / 0.05)', padding: '2px 8px', borderRadius: 999 }}>
                            {getPlatformBadgeName(sale.source)}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
                            background: sale.payment_status === 'paid' ? 'var(--color-accent-soft)' : 'var(--color-accent-2-soft)',
                            color: sale.payment_status === 'paid' ? 'var(--color-accent)' : 'var(--color-accent-2)'
                          }}>
                            {sale.payment_status === 'paid' ? 'Оплачено' : sale.payment_status === 'partially_paid' ? 'Частково' : 'Очікує'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 999,
                            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: 5
                          }}>
                            <span className="dusk-dot" style={{ width: 5, height: 5, background: meta.color }} />
                            <span>{meta.label}</span>
                          </span>
                          {isExpanded ? <ChevronUp size={15} style={{ color: 'var(--color-muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--color-muted)' }} />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
                          {clientName}
                        </div>
                        <div className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>
                          {sale.total}<span className="c"> ₴</span>
                        </div>
                      </div>

                      {!isExpanded && (items.length > 0 || details.notes) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                          {items.map((item, idx) => {
                            const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                            const itemNote = item.item_note || item.color_details || item.note || '';
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-ink-2)' }}>
                                <span>{item.name}</span>
                                <span className="dusk-num" style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: 11 }}>×{item.quantity || 1}</span>
                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, background: 'oklch(100% 0 0 / 0.05)', padding: '1px 6px', borderRadius: 999, color: 'var(--color-ink-2)' }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                      {cMeta.label}
                                    </span>
                                  );
                                })}
                                {itemNote && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>({itemNote})</span>}
                              </div>
                            );
                          })}
                          {details.notes && (
                            <div className="dusk-apricot-strip" style={{ marginTop: 4, padding: '6px 10px' }}>
                              <span>{details.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                          <div style={{ borderTop: '1px solid var(--color-rule)' }} />

                          <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{clientName}</div>
                            <div className="dusk-num" style={{ fontSize: 12, color: 'var(--color-muted)' }}>Тел: {clientPhone}</div>
                            {details.city && (
                              <div style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
                                Доставка: {details.city} {details.warehouse ? `— ${details.warehouse}` : ''}
                              </div>
                            )}
                            {details.is_cod && details.cod_amount > 0 && (
                              <div className="dusk-num" style={{ fontSize: 12, color: 'var(--color-accent-2)', fontWeight: 500 }}>
                                Наложка: {details.cod_amount} ₴
                              </div>
                            )}
                            {details.notes && (
                              <div className="dusk-apricot-strip" style={{ marginTop: 4 }}>
                                <span>{details.notes}</span>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-muted)' }}>Етап замовлення:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {Object.keys(STATUS_META).map(stKey => {
                                const stMeta = STATUS_META[stKey];
                                const active = sale.status === stKey;
                                return (
                                  <button
                                    key={stKey}
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(sale.id, { status: stKey })}
                                    className={`dusk-facet-pill ${active ? (stMeta.tone === 'apricot' ? 'is-active-apricot' : 'is-active') : ''}`}
                                  >
                                    {stMeta.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--color-rule)', paddingTop: 10 }}>
                            <button 
                              onClick={() => handleEdit(sale)}
                              className="dusk-btn-ghost"
                              style={{ flex: 1 }}
                            >
                              <Edit3 size={14} /> Редагувати
                            </button>
                            <button 
                              onClick={() => handleDuplicate(sale)}
                              className="dusk-btn-ghost"
                              style={{ flex: 1 }}
                            >
                              <Copy size={14} /> Дублювати
                            </button>
                            <button 
                              onClick={() => handleDelete(sale.id)}
                              className="dusk-btn-ghost"
                              style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)' }}
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
          /* Desktop Dusk Table */
          <div className="dusk-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-rule)' }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table className="dusk-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th>Дата та замовлення</th>
                    <th>Клієнт та доставка</th>
                    <th>Вироби та специфікація</th>
                    <th style={{ textAlign: 'right' }}>Сума</th>
                    <th style={{ textAlign: 'center' }}>Оплата</th>
                    <th style={{ textAlign: 'center' }}>Етап</th>
                    <th style={{ textAlign: 'right' }}>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--color-muted)', fontSize: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <span>Замовлень за вибраними фільтрами не знайдено.</span>
                          {activeFilterCount > 0 && (
                            <button type="button" onClick={clearAllFilters} className="dusk-btn-ghost">
                              Скинути фільтри
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => {
                      const details = sale.shipping_details || {};
                      const clientName = `${details.firstName || ''} ${details.lastName || ''} ${sale.customers?.first_name || ''} ${sale.customers?.last_name || ''}`.trim() || 'Гість';
                      const clientInitial = clientName.charAt(0).toUpperCase() || 'Г';
                      const clientPhone = details.phone || sale.customers?.phone || '—';
                      const items = Array.isArray(details.items) ? details.items : [];
                      const meta = STATUS_META[sale.status] || STATUS_META.new;

                      return (
                        <tr key={sale.id}>
                          {/* Date & Source */}
                          <td style={{ verticalAlign: 'top', width: 165 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                              {details.is_priority && (
                                <Star size={13} fill="var(--color-accent-2)" stroke="var(--color-accent-2)" title="Пріоритетне замовлення" />
                              )}
                              <span className="dusk-num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                                {new Date(sale.created_at).toLocaleDateString('uk-UA')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ 
                                fontSize: 11.5, fontWeight: 500, 
                                color: 'var(--color-ink-2)',
                                background: 'oklch(100% 0 0 / 0.05)',
                                border: '1px solid var(--color-rule)',
                                padding: '2px 8px', borderRadius: 999
                              }}>
                                {getPlatformBadgeName(sale.source)}
                              </span>
                              <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                                {sale.order_number ? sale.order_number.replace(/^MAN-[A-Z]+-/, '#') : `#${sale.id.slice(0, 6)}`}
                              </span>
                            </div>
                            {details.due_date && (
                              <div style={{ marginTop: 5 }}>
                                {(() => {
                                  const isDone = DONE_OR_SHIPPED_STATUSES.includes(sale.status) || sale.status === 'cancelled';
                                  const isUrgent = !isDone && details.due_date <= getTodayKey();
                                  return (
                                    <span
                                      className="dusk-num"
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 10.5, fontWeight: 600,
                                        padding: '2px 7px', borderRadius: 999,
                                        background: isUrgent ? 'var(--color-accent-2-soft)' : 'var(--color-accent-soft)',
                                        color: isUrgent ? 'var(--color-accent-2)' : 'var(--color-accent)',
                                        border: `1px solid ${isUrgent ? 'var(--color-accent-2-border)' : 'var(--color-accent-border)'}`
                                      }}
                                    >
                                      <Calendar size={10} />
                                      <span>До {formatShortDateUa(details.due_date)}{Number(details.due_days) > 1 ? ` (${details.due_days}д)` : ''}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </td>

                          {/* Customer & Delivery (No avatar circle per user request) */}
                          <td style={{ verticalAlign: 'top', maxWidth: 250 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)' }}>{clientName}</div>
                              <div className="dusk-num" style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{clientPhone}</div>
                              {details.city && (
                                <div style={{ fontSize: 12, color: 'var(--color-ink-2)', marginTop: 4, lineHeight: 1.35 }}>
                                  {details.city}{details.warehouse ? ` · ${details.warehouse}` : ''}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Items, Colors, Consumables & Clarifications */}
                          <td style={{ verticalAlign: 'top', minWidth: 260, maxWidth: 380 }}>
                            {items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {items.map((item, idx) => {
                                  const itemColors = Array.isArray(item.colors) ? item.colors : (item.color ? [item.color] : []);
                                  const itemNote = item.item_note || item.color_details || item.note || '';
                                  return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ color: 'var(--color-ink)', fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                                        <span className="dusk-num" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999 }}>
                                          ×{item.quantity}
                                        </span>
                                      </div>
                                      {itemColors.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                          {itemColors.map((cName, cIdx) => {
                                            const cMeta = getColorMeta(cName);
                                            return (
                                              <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, background: 'oklch(100% 0 0 / 0.04)', color: 'var(--color-ink-2)', padding: '2px 7px', borderRadius: 999, border: '1px solid var(--color-rule)' }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cMeta.gradient || cMeta.hex }} />
                                                {cMeta.label}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {itemNote && (
                                        <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                                          Уточнення: <span style={{ color: 'var(--color-ink-2)' }}>{itemNote}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>—</span>
                            )}

                            {/* Consumables written off for this sale */}
                            {Array.isArray(details.consumables) && details.consumables.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--color-rule)' }}>
                                {details.consumables.map((c, cIdx) => (
                                  <span
                                    key={c.item_id || c.itemId || cIdx}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 5,
                                      fontSize: 11, fontWeight: 500,
                                      background: 'oklch(100% 0 0 / 0.03)',
                                      color: 'var(--color-muted)',
                                      border: '1px solid var(--color-rule)',
                                      padding: '2px 7px', borderRadius: 999
                                    }}
                                    title="Списано зі складу"
                                  >
                                    <Package size={10} style={{ color: 'var(--color-accent)' }} />
                                    <span>{c.name}</span>
                                    <strong className="dusk-num" style={{ color: 'var(--color-ink-2)' }}>×{c.quantity ?? c.qty ?? 1}</strong>
                                  </span>
                                ))}
                              </div>
                            )}

                            {details.notes && (
                              <div className="dusk-apricot-strip" style={{ marginTop: 8, padding: '6px 10px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span className="dusk-dot dusk-dot--apricot" style={{ width: 6, height: 6 }} />
                                  <span>{details.notes}</span>
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Amount (Right-aligned tabular numerals with muted currency) */}
                          <td style={{ textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <div className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>
                              {Number(sale.total || 0).toLocaleString('uk-UA')}<span className="c" style={{ fontSize: 12.5 }}>.00 ₴</span>
                            </div>
                            {details.is_cod && details.cod_amount > 0 && (
                              <div className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-accent-2)', fontWeight: 500, marginTop: 3 }}>
                                Наложка: {details.cod_amount} ₴
                              </div>
                            )}
                          </td>

                          {/* Payment Selector (Custom Dusk Pill Dropdown) */}
                          <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                            <DuskPillSelect
                              value={sale.payment_status || 'pending'}
                              onChange={(val) => handleUpdateOrderStatus(sale.id, { payment_status: val })}
                              bg={sale.payment_status === 'paid' ? 'var(--color-accent-soft)' : 'var(--color-accent-2-soft)'}
                              color={sale.payment_status === 'paid' ? 'var(--color-accent)' : 'var(--color-accent-2)'}
                              border={sale.payment_status === 'paid' ? 'var(--color-accent-border)' : 'var(--color-accent-2-border)'}
                              dotTone={sale.payment_status === 'paid' ? 'periwinkle' : 'apricot'}
                              options={[
                                { value: 'pending', label: 'Очікує', tone: 'apricot' },
                                { value: 'partially_paid', label: 'Частково', tone: 'apricot' },
                                { value: 'verifying', label: 'Перевірка', tone: 'apricot' },
                                { value: 'paid', label: 'Оплачено', tone: 'periwinkle' }
                              ]}
                            />
                          </td>

                          {/* Stage Selector (Custom Dusk Pill Dropdown) */}
                          <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                            <DuskPillSelect
                              value={sale.status || 'new'}
                              onChange={(val) => handleUpdateOrderStatus(sale.id, { status: val })}
                              bg={meta.bg}
                              color={meta.color}
                              border={meta.border}
                              dotTone={meta.tone}
                              options={Object.keys(STATUS_META).map(k => ({
                                value: k,
                                label: STATUS_META[k].fullLabel,
                                tone: STATUS_META[k].tone
                              }))}
                            />
                          </td>

                          {/* Row Actions */}
                          <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button 
                                type="button"
                                onClick={() => handleEdit(sale)}
                                title="Редагувати"
                                className="dusk-btn-ghost"
                                style={{ minHeight: 30, padding: '0 8px', borderRadius: 8 }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDuplicate(sale)}
                                title="Дублювати замовлення"
                                className="dusk-btn-ghost"
                                style={{ minHeight: 30, padding: '0 8px', borderRadius: 8 }}
                              >
                                <Copy size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDelete(sale.id)}
                                title="Видалити"
                                className="dusk-btn-ghost"
                                style={{ minHeight: 30, padding: '0 8px', borderRadius: 8, color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)' }}
                              >
                                <Trash2 size={13} />
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

      {/* Dusk Fast POS / CRM Add & Edit Sale Modal (2-Column Desktop Layout) */}
      <AnimatePresence>
        {showAddForm && (
          <div 
            onClick={() => setShowAddForm(false)}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'oklch(10% 0.015 268 / 0.82)', 
              backdropFilter: 'blur(10px)',
              zIndex: 1100, 
              display: 'flex', 
              alignItems: isMobile ? 'flex-end' : 'center', 
              justifyContent: 'center', 
              padding: isMobile ? 0 : 20
            }}
          >
            <motion.div 
              initial={{ opacity: 0, y: isMobile ? 40 : 8, scale: isMobile ? 1 : 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: isMobile ? 40 : 8, scale: isMobile ? 1 : 0.98 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
              className="dusk-panel"
              style={{ 
                background: 'var(--color-paper)', 
                borderRadius: isMobile ? '22px 22px 0 0' : 18, 
                width: '100%', 
                maxWidth: 1080, 
                border: '1px solid var(--color-rule)', 
                color: 'var(--color-ink)', 
                maxHeight: isMobile ? '95vh' : '93vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 28px 72px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* 1. TOP COMMAND HEADER: Title + 1-Click Channel Strip + Quick Actions */}
              <div style={{ 
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center', 
                gap: 12,
                padding: isMobile ? '12px 14px' : '14px 20px', 
                borderBottom: '1px solid var(--color-rule)',
                background: 'var(--color-paper-2)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'var(--color-accent-soft)',
                      border: '1px solid var(--color-accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-accent)', flexShrink: 0
                    }}>
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h2 className="dusk-heading" style={{ fontSize: isMobile ? 16 : 18, margin: 0 }}>
                          {editingSale ? `Редагувати замовлення ${editingSale.order_number ? editingSale.order_number.replace(/^MAN-[A-Z]+-/, '#') : ''}` : 'Новий продаж'}
                        </h2>
                        {formData.is_priority && (
                          <span className="dusk-badge dusk-badge--apricot" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                            Термінове
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-muted)' }}>
                        Швидке оформлення: оберіть товари зліва, вставте реквізити клієнта справа
                      </p>
                    </div>
                  </div>

                  {isMobile && (
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)} 
                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                      style={{ width: 32, height: 32, padding: 0 }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Channel Quick Strip + Priority + Guest Pickup + Close */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', background: 'var(--color-paper)', padding: 3, borderRadius: 999, border: '1px solid var(--color-rule)' }}>
                    {CHANNELS.map(ch => {
                      const active = formData.source === ch.value;
                      return (
                        <button
                          key={ch.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, source: ch.value })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: 'none',
                            background: active ? 'var(--color-accent)' : 'transparent',
                            color: active ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                            fontSize: 11.5,
                            fontWeight: active ? 600 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.14s ease'
                          }}
                        >
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_priority: !formData.is_priority })}
                    className={`dusk-facet-pill ${formData.is_priority ? 'active-apricot' : ''}`}
                    style={{ height: 30, padding: '0 10px' }}
                    title="Позначити як термінове / пріоритетне"
                  >
                    <Star size={12} fill={formData.is_priority ? 'var(--color-accent-2)' : 'transparent'} style={{ color: 'var(--color-accent-2)' }} />
                    <span>Пріоритет</span>
                  </button>

                  {!isMobile && (
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)} 
                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                      style={{ width: 32, height: 32, padding: 0 }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. TWO-COLUMN MAIN WORKSPACE */}
              <form 
                id="sale-form"
                onSubmit={handleSubmit} 
                style={{ 
                  flex: 1, 
                  minHeight: 0,
                  overflowY: isMobile ? 'auto' : 'hidden',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1.08fr 0.92fr',
                  divideX: '1px solid var(--color-rule)'
                }}
              >
                {/* ================= LEFT COLUMN: CATALOG PICKER & ACTIVE CART ================= */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflowY: isMobile ? 'visible' : 'auto',
                  padding: isMobile ? 14 : '16px 20px',
                  borderRight: isMobile ? 'none' : '1px solid var(--color-rule)',
                  borderBottom: isMobile ? '1px solid var(--color-rule)' : 'none',
                  gap: 14
                }}>
                  {/* Catalog Header + Mode Switcher */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBag size={14} style={{ color: 'var(--color-accent)' }} />
                        <span>1. Додати вироби в замовлення</span>
                      </span>

                      <div className="dusk-segmented">
                        <button
                          type="button"
                          onClick={() => setItemTab('catalog')}
                          className={`dusk-segmented__item ${itemTab === 'catalog' ? 'active' : ''}`}
                          style={{ height: 26, fontSize: 11.5 }}
                        >
                          З каталогу ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemTab('manual')}
                          className={`dusk-segmented__item ${itemTab === 'manual' ? 'active' : ''}`}
                          style={{ height: 26, fontSize: 11.5 }}
                        >
                          + Свій виріб
                        </button>
                      </div>
                    </div>

                    {itemTab === 'catalog' ? (
                      <div
                        ref={catalogPickerRef}
                        style={{
                          background: 'var(--color-paper-2)',
                          border: catalogDropdownOpen ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                          borderRadius: 12,
                          padding: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        {/* Search Input (clicking opens catalog list) */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: catalogDropdownOpen ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                            <input
                              type="text"
                              placeholder="Натисніть для пошуку та вибору фігурки…"
                              value={catalogSearchQuery}
                              onFocus={() => setCatalogDropdownOpen(true)}
                              onClick={() => setCatalogDropdownOpen(true)}
                              onChange={(e) => {
                                setCatalogSearchQuery(e.target.value);
                                if (!catalogDropdownOpen) setCatalogDropdownOpen(true);
                              }}
                              className="dusk-input"
                              style={{ height: 32, paddingLeft: 30, paddingRight: catalogSearchQuery ? 26 : 10, fontSize: 12.5, borderRadius: 8 }}
                            />
                            {catalogSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCatalogSearchQuery('')}
                                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                          {catalogDropdownOpen && (
                            <button
                              type="button"
                              onClick={() => setCatalogDropdownOpen(false)}
                              className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                              style={{ height: 32, minHeight: 32, padding: '0 10px', fontSize: 11.5 }}
                              title="Згорнути список товарів"
                            >
                              <ChevronUp size={13} />
                              <span>Згорнути</span>
                            </button>
                          )}
                        </div>

                        <AnimatePresence initial={false}>
                          {catalogDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                              {catalogCategories.length > 2 && (
                                <div className="hide-scrollbar" style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
                                  {catalogCategories.map(cat => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setCatalogCategoryFilter(cat)}
                                      className={`dusk-facet-pill ${catalogCategoryFilter === cat ? 'active' : ''}`}
                                      style={{ padding: '3px 9px', fontSize: 11 }}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Compact 2-Column Catalog Grid */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                gap: 6,
                                maxHeight: 200,
                                overflowY: 'auto',
                                paddingRight: 2
                              }}>
                                {filteredCatalogProducts.length === 0 ? (
                                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px 8px', fontSize: 12, color: 'var(--color-muted)' }}>
                                    Нічого не знайдено. Перемкніть на «+ Свій виріб», щоб вписати вручну.
                                  </div>
                                ) : (
                                  filteredCatalogProducts.map(prod => {
                                    const finalPrice = prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price;
                                    const inCartCount = (formData.items || []).filter(i => i.product_id === prod.id || i.name === prod.name).reduce((s, i) => s + (i.quantity || 1), 0);
                                    return (
                                      <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => handleAddCatalogProduct(prod)}
                                        style={{
                                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                          padding: '6px 9px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                                          background: inCartCount > 0 ? 'var(--color-accent-soft)' : 'var(--color-paper)',
                                          border: inCartCount > 0 ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                                          color: 'var(--color-ink)', transition: 'all 0.14s ease'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                          {prod.image_url ? (
                                            <img src={prod.image_url} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                          ) : (
                                            <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--color-paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <ShoppingBag size={13} style={{ color: 'var(--color-muted)' }} />
                                            </div>
                                          )}
                                          <div style={{ overflow: 'hidden', flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {prod.name}
                                            </div>
                                            <div className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                                              <strong style={{ color: 'var(--color-ink-2)' }}>{finalPrice} ₴</strong>
                                              {inCartCount > 0 && <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}> · у кошику: {inCartCount}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <span style={{
                                          width: 24, height: 24, borderRadius: 7,
                                          background: inCartCount > 0 ? 'var(--color-accent)' : 'oklch(100% 0 0 / 0.06)',
                                          color: inCartCount > 0 ? 'var(--color-accent-ink)' : 'var(--color-ink)',
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: 14, fontWeight: 600, flexShrink: 0
                                        }}>
                                          +
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      /* Custom / Manual Item Quick Row */
                      <div style={{
                        background: 'var(--color-paper-2)',
                        border: '1px solid var(--color-rule)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 92px', gap: 8 }}>
                          <input 
                            type="text"
                            placeholder="Назва індивідуального виробу…"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            className="dusk-input"
                            style={{ height: 34, fontSize: 12.5 }}
                          />
                          <input 
                            type="text"
                            inputMode="numeric"
                            placeholder="К-сть"
                            value={newItem.quantity}
                            onChange={e => setNewItem({ ...newItem, quantity: e.target.value.replace(/\D/g, '') })}
                            className="dusk-input dusk-num"
                            style={{ height: 34, fontSize: 12.5, textAlign: 'center', padding: '0 6px' }}
                          />
                          <input 
                            type="text"
                            inputMode="decimal"
                            placeholder="Ціна (₴)"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: e.target.value.replace(/[^0-9.]/g, '') })}
                            className="dusk-input dusk-num"
                            style={{ height: 34, fontSize: 12.5, textAlign: 'center', padding: '0 8px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Колір або уточнення (необов'язково)…"
                            value={newItem.item_note}
                            onChange={e => setNewItem({ ...newItem, item_note: e.target.value })}
                            className="dusk-input"
                            style={{ height: 34, fontSize: 12.5, flex: 1 }}
                          />
                          <button 
                            type="button" 
                            onClick={handleAddManualItem}
                            className="dusk-btn dusk-btn--primary dusk-btn--sm"
                            style={{ height: 34, padding: '0 14px' }}
                          >
                            <Plus size={14} />
                            <span>Додати</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Cart Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)' }}>
                        Кошик замовлення ({(formData.items || []).reduce((acc, i) => acc + (parseInt(i.quantity) || 1), 0)} шт.)
                      </span>
                      {(formData.items || []).length > 0 && (
                        <span className="dusk-num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-accent)' }}>
                          Разом по кошику: {cartTotal.toLocaleString('uk-UA')} ₴
                        </span>
                      )}
                    </div>

                    {(formData.items || []).length === 0 ? (
                      <div style={{
                        padding: '28px 16px',
                        borderRadius: 12,
                        background: 'var(--color-paper-2)',
                        border: '1px dashed var(--color-rule)',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                        fontSize: 12.5
                      }}>
                        Клікніть на будь-який товар вище, щоб додати його у кошик та обрати колір пластику
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {formData.items.map((item, idx) => {
                          const itemColors = Array.isArray(item.colors) ? item.colors : [];
                          const isColorOpen = openColorEditorIdx === idx;

                          return (
                            <div
                              key={idx}
                              style={{
                                background: 'var(--color-paper-2)',
                                border: isColorOpen ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                                borderRadius: 12,
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                              }}
                            >
                              {/* Row 1: Item Name + Stepper + Price + Duplicate + Delete */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)', flex: 1, minWidth: 130 }}>
                                  {idx + 1}. {item.name}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                  {/* Quantity Stepper */}
                                  <div style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                                    borderRadius: 8, height: 30, overflow: 'hidden'
                                  }}>
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
                                      style={{ width: 26, height: '100%', border: 'none', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                    >
                                      −
                                    </button>
                                    <span className="dusk-num" style={{ minWidth: 24, textAlign: 'center', color: 'var(--color-ink)', fontSize: 12.5, fontWeight: 600 }}>
                                      {item.quantity}
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const updated = [...formData.items];
                                        updated[idx].quantity += 1;
                                        setFormData({ ...formData, items: updated });
                                      }}
                                      style={{ width: 26, height: '100%', border: 'none', background: 'transparent', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Sleek Integrated Price Pill Input (no browser spinner arrows) */}
                                  <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                                    borderRadius: 8, height: 30, padding: '0 8px'
                                  }}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={item.price}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        const updated = [...formData.items];
                                        updated[idx].price = val === '' ? 0 : (parseFloat(val) || 0);
                                        setFormData({ ...formData, items: updated });
                                      }}
                                      className="dusk-num"
                                      style={{
                                        width: 44, height: '100%', border: 'none', background: 'transparent',
                                        color: 'var(--color-ink)', fontSize: 12.5, fontWeight: 600,
                                        textAlign: 'right', padding: 0, outline: 'none'
                                      }}
                                      title="Ціна за 1 шт (₴)"
                                    />
                                    <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, userSelect: 'none' }}>₴</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateCartItem(idx)}
                                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                    style={{ height: 30, padding: '0 9px', fontSize: 11, borderRadius: 8 }}
                                    title="Додати ще одну таку ж модель іншого кольору"
                                  >
                                    <Copy size={11} />
                                    <span>+Колір</span>
                                  </button>

                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(idx)} 
                                    className="dusk-btn dusk-btn--danger dusk-btn--sm"
                                    style={{ height: 30, width: 30, padding: 0, borderRadius: 8 }}
                                    title="Видалити з кошика"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: Selected Colors + Toggle Palette Button + Inline Note */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setOpenColorEditorIdx(isColorOpen ? null : idx)}
                                  className={`dusk-facet-pill ${isColorOpen ? 'active' : ''}`}
                                  style={{ padding: '3px 9px', fontSize: 11 }}
                                >
                                  <Palette size={11} />
                                  <span>{isColorOpen ? 'Згорнути палітру' : 'Обрати колір'}</span>
                                </button>

                                {itemColors.map((cName, cIdx) => {
                                  const cMeta = getColorMeta(cName);
                                  return (
                                    <span 
                                      key={cIdx} 
                                      onClick={() => toggleItemColor(idx, cName)}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer',
                                        padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500, lineHeight: 1,
                                        background: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-rule)'
                                      }}
                                      title="Клікніть, щоб прибрати колір"
                                    >
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cMeta.gradient || cMeta.hex, border: cMeta.border ? `1px solid ${cMeta.border}` : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                      <span>{cMeta.label}</span>
                                      <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                                    </span>
                                  );
                                })}

                                {/* Always-accessible inline clarification input */}
                                <input
                                  type="text"
                                  placeholder="Уточнення (напр. тіло чорне, очі жовті)…"
                                  value={item.item_note || ''}
                                  onChange={(e) => updateItemNote(idx, e.target.value)}
                                  className="dusk-input"
                                  style={{ flex: 1, minWidth: 160, height: 26, fontSize: 11.5, padding: '0 8px', borderRadius: 7 }}
                                />
                              </div>

                              {/* Expandable Full Filament Swatch Palette */}
                              <AnimatePresence initial={false}>
                                {isColorOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.14 }}
                                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--color-rule)' }}
                                  >
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                      {FILAMENT_COLORS.map(fc => {
                                        const selected = itemColors.includes(fc.label);
                                        return (
                                          <button
                                            key={fc.id}
                                            type="button"
                                            onClick={() => toggleItemColor(idx, fc.label)}
                                            className={`dusk-facet-pill ${selected ? 'active' : ''}`}
                                            style={{ padding: '4px 9px', fontSize: 11, lineHeight: 1 }}
                                          >
                                            <span style={{
                                              width: 8, height: 8, borderRadius: '50%',
                                              background: fc.gradient || fc.hex,
                                              border: `1px solid ${fc.border || 'rgba(255,255,255,0.25)'}`,
                                              flexShrink: 0
                                            }} />
                                            <span>{fc.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {QUICK_ITEM_TAGS.map(tag => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => {
                                            const cur = item.item_note ? `${item.item_note}, ${tag}` : tag;
                                            updateItemNote(idx, cur);
                                          }}
                                          className="dusk-facet-pill"
                                          style={{ fontSize: 10.5, padding: '2px 7px' }}
                                        >
                                          + {tag}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 1.5 WAREHOUSE CONSUMABLES WRITE-OFF (Searchable Picker + Stepper) */}
                  <div
                    ref={warehousePickerRef}
                    style={{
                      background: 'var(--color-paper-2)',
                      border: warehouseDropdownOpen ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      flexShrink: 0,
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                        <Package size={13} style={{ color: 'var(--color-accent)' }} />
                        <span>Списання зі складу (Пакування, цукерки, бонуси)</span>
                      </span>
                      {Array.isArray(formData.consumables) && formData.consumables.length > 0 && (
                        <span className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          Собівартість: <strong style={{ color: 'var(--color-ink-2)' }}>
                            {formData.consumables.reduce((acc, c) => acc + (Number(c.quantity ?? c.qty) || 0) * (Number(c.cost_unit ?? c.unitCost) || 0), 0).toFixed(1)} ₴
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Search Input (opens warehouse picker smoothly) */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: warehouseDropdownOpen ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                        <input
                          type="text"
                          placeholder="Пошук матеріалів зі складу (коробка, цукерка, пакет)…"
                          value={warehouseSearchQuery}
                          onFocus={() => setWarehouseDropdownOpen(true)}
                          onClick={() => setWarehouseDropdownOpen(true)}
                          onChange={(e) => {
                            setWarehouseSearchQuery(e.target.value);
                            if (!warehouseDropdownOpen) setWarehouseDropdownOpen(true);
                          }}
                          className="dusk-input"
                          style={{ height: 32, paddingLeft: 30, paddingRight: warehouseSearchQuery ? 26 : 10, fontSize: 12, borderRadius: 8 }}
                        />
                        {warehouseSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setWarehouseSearchQuery('')}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {warehouseDropdownOpen && (
                        <button
                          type="button"
                          onClick={() => setWarehouseDropdownOpen(false)}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ height: 32, minHeight: 32, padding: '0 10px', fontSize: 11.5 }}
                          title="Згорнути список матеріалів"
                        >
                          <ChevronUp size={13} />
                          <span>Згорнути</span>
                        </button>
                      )}
                    </div>

                    {/* Smooth Expandable Warehouse Materials Grid */}
                    <AnimatePresence initial={false}>
                      {warehouseDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                          <div className="hide-scrollbar" style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
                            {[
                              { id: 'all', label: 'Усі' },
                              { id: 'packaging', label: 'Пакування' },
                              { id: 'gifts', label: 'Вкладення' },
                              { id: 'hardware', label: 'Фурнітура' },
                              { id: 'other', label: 'Інше' }
                            ].map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setWarehouseCategoryFilter(cat.id)}
                                className={`dusk-facet-pill ${warehouseCategoryFilter === cat.id ? 'active' : ''}`}
                                style={{ padding: '3px 9px', fontSize: 11 }}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                            gap: 6,
                            maxHeight: 175,
                            overflowY: 'auto',
                            paddingRight: 2
                          }}>
                            {filteredWarehouseItems.length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '14px 8px', fontSize: 12, color: 'var(--color-muted)' }}>
                                Матеріалів за запитом не знайдено.
                              </div>
                            ) : (
                              filteredWarehouseItems.map(wItem => {
                                const existing = (formData.consumables || []).find(c => (c.item_id || c.itemId) === wItem.id);
                                const qtyInStock = Number(wItem.quantity ?? wItem.stock ?? 0);
                                const minQty = Number(wItem.min_quantity ?? wItem.minStock ?? 0);
                                const unitCost = Number(wItem.cost_unit ?? wItem.unitCost ?? 0);
                                const isLow = qtyInStock <= minQty;
                                const addedQty = existing ? Number(existing.quantity ?? existing.qty ?? 1) : 0;

                                return (
                                  <button
                                    key={wItem.id}
                                    type="button"
                                    onClick={() => handleAddConsumableToSale(wItem)}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                      padding: '6px 9px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                                      background: existing ? 'var(--color-accent-soft)' : 'var(--color-paper)',
                                      border: existing ? '1px solid var(--color-accent-border)' : '1px solid var(--color-rule)',
                                      color: 'var(--color-ink)', transition: 'all 0.14s ease'
                                    }}
                                  >
                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                      <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {wItem.name}
                                      </div>
                                      <div className="dusk-num" style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ color: isLow ? 'var(--color-accent-2)' : 'var(--color-ink-2)', fontWeight: 500 }}>
                                          {qtyInStock} {wItem.unit || 'шт.'}
                                        </span>
                                        {unitCost > 0 && <span>· {unitCost} ₴</span>}
                                        {addedQty > 0 && <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>· спис: {addedQty}</span>}
                                      </div>
                                    </div>
                                    <span style={{
                                      width: 24, height: 24, borderRadius: 7,
                                      background: existing ? 'var(--color-accent)' : 'oklch(100% 0 0 / 0.06)',
                                      color: existing ? 'var(--color-accent-ink)' : 'var(--color-ink)',
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 14, fontWeight: 600, flexShrink: 0
                                    }}>
                                      +
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Selected consumables with quantity stepper */}
                    {Array.isArray(formData.consumables) && formData.consumables.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 6, borderTop: '1px solid var(--color-rule)' }}>
                        {formData.consumables.map(c => {
                          const cId = c.item_id || c.itemId;
                          const cQty = Number(c.quantity ?? c.qty ?? 1);
                          return (
                            <div
                              key={cId}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'var(--color-paper)',
                                border: '1px solid var(--color-accent-border)',
                                borderRadius: 8,
                                padding: '3px 6px 3px 9px',
                                fontSize: 11.5
                              }}
                            >
                              <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{c.name}</span>
                              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', borderRadius: 6, height: 22 }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateConsumableQty(cId, -1)}
                                  style={{ width: 20, height: '100%', background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 12 }}
                                >
                                  −
                                </button>
                                <span className="dusk-num" style={{ minWidth: 20, textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--color-accent)' }}>
                                  {cQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateConsumableQty(cId, 1)}
                                  style={{ width: 20, height: '100%', background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 12 }}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateConsumableQty(cId, -cQty)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '0 2px', display: 'inline-flex' }}
                                title="Прибрати зі списання"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= RIGHT COLUMN: RECIPIENT, NOVA POSHTA, PAYMENT & NOTES ================= */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflowY: isMobile ? 'visible' : 'auto',
                  padding: isMobile ? 14 : '16px 20px',
                  gap: 14
                }}>
                  {/* 2. RECIPIENT & SMART PASTE */}
                  <div style={{
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                        2. Отримувач та доставка
                      </span>

                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="dusk-facet-pill active"
                          style={{ padding: '4px 10px', fontSize: 11.5 }}
                          title="Автоматично розпізнати ПІБ, телефон, місто та відділення з буфера обміну"
                        >
                          <ClipboardPaste size={12} />
                          <span>Вставити з буфера</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickFill}
                          className="dusk-facet-pill"
                          style={{ padding: '4px 9px', fontSize: 11.5 }}
                          title="Заповнити як швидкий продаж гостю (Самовивіз)"
                        >
                          <Sparkles size={11} style={{ color: 'var(--color-accent)' }} />
                          <span>Гість</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct 1-Line Smart Paste Input */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        placeholder="Або вставте сюди повідомлення клієнта (ПІБ, тел, місто, відділення НП)…"
                        value={smartPasteText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSmartPasteText(val);
                          if (val.length > 18 && (val.includes('0') || val.includes('+38'))) {
                            applySmartPaste(val);
                          }
                        }}
                        className="dusk-input"
                        style={{ height: 32, fontSize: 12, flex: 1, borderStyle: 'dashed' }}
                      />
                      {smartPasteText && (
                        <button
                          type="button"
                          onClick={() => applySmartPaste(smartPasteText)}
                          className="dusk-btn dusk-btn--primary dusk-btn--sm"
                          style={{ height: 32 }}
                        >
                          Розпізнати
                        </button>
                      )}
                    </div>

                    {/* Delivery Method Segmented Bar */}
                    <div className="dusk-segmented" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {[
                        { id: 'nova_poshta', label: 'Нова Пошта' },
                        { id: 'ukrposhta', label: 'Укрпошта' },
                        { id: 'pickup', label: 'Самовивіз' }
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
                            className={`dusk-segmented__item ${active ? 'active' : ''}`}
                          >
                            {dm.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Phone, First Name, Last Name */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1.15fr 1fr 1fr', gap: 8 }}>
                      <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Телефон</label>
                        <input 
                          type="tel"
                          placeholder="+380…"
                          value={formData.phone} 
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="dusk-input dusk-mono"
                          style={{ height: 34, fontSize: 12.5 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Ім’я</label>
                        <input 
                          type="text"
                          placeholder="Дмитро"
                          value={formData.firstName} 
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          className="dusk-input"
                          style={{ height: 34, fontSize: 12.5 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Прізвище</label>
                        <input 
                          type="text"
                          placeholder="Коваленко"
                          value={formData.lastName} 
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          className="dusk-input"
                          style={{ height: 34, fontSize: 12.5 }}
                        />
                      </div>
                    </div>

                    {/* Repeat Customer Auto-Suggest Banner */}
                    {matchingCustomers.length > 0 && !editingSale && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'var(--color-accent-soft)', padding: '7px 10px', borderRadius: 9, border: '1px solid var(--color-accent-border)' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <UserCheck size={12} /> Знайдено постійного клієнта (1 клік для автозаповнення):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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
                                showToast(`Підтягнуто: ${mc.firstName} ${mc.lastName}`);
                              }}
                              className="dusk-facet-pill"
                              style={{ background: 'var(--color-paper)', fontSize: 11, padding: '3px 8px' }}
                            >
                              {mc.firstName} {mc.lastName} · {mc.phone} {mc.city ? `(${mc.city})` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* City & Warehouse Autocomplete */}
                    {formData.shipping_method !== 'pickup' && (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.9fr 1.1fr', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                          <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>Місто</label>
                          <input 
                            type="text"
                            placeholder="Київ, Львів, Дніпро…"
                            value={npCityQuery} 
                            onChange={e => { 
                              const val = e.target.value;
                              setNpCityQuery(val); 
                              setFormData(prev => ({ ...prev, city: '', cityRef: '' }));
                              setNpShowCities(true); 
                            }}
                            onFocus={() => { if (npCities.length > 0) setNpShowCities(true); }}
                            onBlur={() => setTimeout(() => setNpShowCities(false), 200)}
                            className="dusk-input"
                            style={{ height: 34, fontSize: 12.5 }}
                          />
                          {npLoadingCities && <Loader2 size={13} className="animate-spin" style={{ position: 'absolute', right: 10, bottom: 10, color: 'var(--color-accent)' }} />}
                          
                          <AnimatePresence>
                            {npShowCities && npCities.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--color-paper-2)', borderRadius: 10, border: '1px solid var(--color-rule)', marginTop: 4, maxHeight: 180, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', padding: 4 }}
                              >
                                {npCities.map(city => (
                                  <button
                                    key={city.Ref} type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, city: city.Description, cityRef: city.Ref, warehouse: '' }));
                                      setNpCityQuery(city.Description);
                                      setNpShowCities(false);
                                      setNpWarehouseQuery('');
                                      setNpShowWarehouses(true);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12, borderRadius: 7, cursor: 'pointer' }}
                                  >
                                    {city.Description} <span style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>({city.AreaDescription})</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div style={{ position: 'relative' }}>
                          <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 3 }}>
                            Відділення / поштомат
                            {formData.cityRef && !npLoadingWarehouses && npWarehouses.length > 0 && (
                              <span className="dusk-num" style={{ color: 'var(--color-accent)', marginLeft: 5 }}>({npWarehouses.length})</span>
                            )}
                          </label>
                          <input 
                            type="text" 
                            placeholder={formData.shipping_method === 'ukrposhta' ? "Індекс та адреса…" : "№ відділення або поштомату…"} 
                            value={npWarehouseQuery} 
                            onChange={e => { 
                              setNpWarehouseQuery(e.target.value); 
                              setFormData(prev => ({ ...prev, warehouse: '' }));
                              setNpShowWarehouses(true); 
                            }}
                            onFocus={() => {
                              setNpShowCities(false);
                              if (formData.cityRef || npWarehouses.length > 0) {
                                setNpShowWarehouses(true);
                              } else if (npCities.length > 0) {
                                const firstCity = npCities[0];
                                setFormData(prev => ({ ...prev, city: firstCity.Description, cityRef: firstCity.Ref }));
                                setNpCityQuery(firstCity.Description);
                                setNpShowWarehouses(true);
                              }
                            }}
                            onBlur={() => setTimeout(() => setNpShowWarehouses(false), 200)}
                            className="dusk-input"
                            style={{ height: 34, fontSize: 12.5 }}
                          />
                          {npLoadingWarehouses && <Loader2 size={13} className="animate-spin" style={{ position: 'absolute', right: 10, bottom: 10, color: 'var(--color-accent)' }} />}
                          
                          <AnimatePresence>
                            {npShowWarehouses && formData.cityRef && npFilteredWarehouses.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90, background: 'var(--color-paper-2)', borderRadius: 10, border: '1px solid var(--color-rule)', marginTop: 4, maxHeight: 190, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', padding: 4 }}
                              >
                                {npFilteredWarehouses.slice(0, 80).map(wh => (
                                  <button
                                    key={wh.Ref} type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, warehouse: wh.Description }));
                                      setNpWarehouseQuery(wh.Description);
                                      setNpShowWarehouses(false);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 11.5, borderRadius: 7, cursor: 'pointer', lineHeight: 1.3 }}
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

                  {/* 3. ONE-CLICK PAYMENT & COD CALCULATOR */}
                  <div style={{
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                        3. Оплата та накладений платіж
                      </span>
                      <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                        Кошик: <strong style={{ color: 'var(--color-ink-2)' }}>{cartTotal.toLocaleString('uk-UA')} ₴</strong>
                      </span>
                    </div>

                    {/* Clean 3-Way Segmented Payment Mode Selector */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 4,
                      padding: 3,
                      borderRadius: 10,
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-rule)'
                    }}>
                      {(() => {
                        const isPaid = formData.payment_status === 'paid' && !formData.is_cod;
                        const isPartialCod = formData.is_cod && (formData.payment_status === 'partially_paid' || Number(formData.prepayment_amount || 0) > 0);
                        const isFullCod = formData.is_cod && !isPartialCod;
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                payment_status: 'paid',
                                is_cod: false,
                                prepayment_amount: '',
                                cod_amount: ''
                              })}
                              style={{
                                height: 30, borderRadius: 7, padding: '0 6px', fontSize: 11.5, fontWeight: isPaid ? 600 : 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer',
                                transition: 'all 0.14s ease', whiteSpace: 'nowrap',
                                background: isPaid ? 'var(--color-accent-soft)' : 'transparent',
                                color: isPaid ? 'var(--color-accent)' : 'var(--color-muted)',
                                border: isPaid ? '1px solid var(--color-accent-border)' : '1px solid transparent'
                              }}
                            >
                              <span className={`dusk-dot ${isPaid ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5, flexShrink: 0 }} />
                              <span>Оплачено 100%</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const currentPrepay = Number(formData.prepayment_amount || 0);
                                const prepayVal = currentPrepay > 0 ? String(currentPrepay) : '';
                                const cod = Math.max(0, Math.round(effectiveTotal - (currentPrepay > 0 ? currentPrepay : 0)));
                                setFormData({
                                  ...formData,
                                  is_cod: true,
                                  payment_status: 'partially_paid',
                                  prepayment_amount: prepayVal,
                                  cod_amount: String(cod)
                                });
                              }}
                              style={{
                                height: 30, borderRadius: 7, padding: '0 6px', fontSize: 11.5, fontWeight: isPartialCod ? 600 : 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer',
                                transition: 'all 0.14s ease', whiteSpace: 'nowrap',
                                background: isPartialCod ? 'var(--color-accent-2-soft)' : 'transparent',
                                color: isPartialCod ? 'var(--color-accent-2)' : 'var(--color-muted)',
                                border: isPartialCod ? '1px solid var(--color-accent-2-border)' : '1px solid transparent'
                              }}
                            >
                              <span className={`dusk-dot ${isPartialCod ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5, flexShrink: 0 }} />
                              <span>Наложка + оплачено</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => applyPrepaymentPreset(0)}
                              style={{
                                height: 30, borderRadius: 7, padding: '0 6px', fontSize: 11.5, fontWeight: isFullCod ? 600 : 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer',
                                transition: 'all 0.14s ease', whiteSpace: 'nowrap',
                                background: isFullCod ? 'var(--color-accent-2-soft)' : 'transparent',
                                color: isFullCod ? 'var(--color-accent-2)' : 'var(--color-muted)',
                                border: isFullCod ? '1px solid var(--color-accent-2-border)' : '1px solid transparent'
                              }}
                            >
                              <span className={`dusk-dot ${isFullCod ? 'dusk-dot--apricot' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5, flexShrink: 0 }} />
                              <span>100% Наложка</span>
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    {/* Context-aware Amount Fields */}
                    {(() => {
                      const isPartialCod = formData.is_cod && (formData.payment_status === 'partially_paid' || Number(formData.prepayment_amount || 0) > 0);
                      if (!formData.is_cod) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                              Фінальна сума {!formData.total && cartTotal > 0 ? <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>(авто)</span> : ''}
                            </span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 140 }}>
                              <input 
                                type="text"
                                inputMode="decimal"
                                placeholder={cartTotal > 0 ? `${cartTotal}` : '0'}
                                value={formData.total} 
                                onChange={e => setFormData({ ...formData, total: e.target.value.replace(/[^0-9.]/g, '') })}
                                className="dusk-input dusk-num"
                                style={{ height: 32, fontSize: 13, fontWeight: 600, paddingRight: 24, textAlign: 'right' }}
                              />
                              <span style={{ position: 'absolute', right: 9, fontSize: 11.5, color: 'var(--color-muted)', pointerEvents: 'none' }}>₴</span>
                            </div>
                          </div>
                        );
                      }

                      if (!isPartialCod) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ fontSize: 11.5, color: 'var(--color-accent-2)', fontWeight: 500 }}>
                              До сплати на пошті {!formData.total && cartTotal > 0 ? <span style={{ opacity: 0.8 }}>(авто)</span> : ''}
                            </span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 140 }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder={cartTotal > 0 ? `${cartTotal}` : '0'}
                                value={formData.total || formData.cod_amount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  setFormData({ ...formData, total: val, cod_amount: val });
                                }}
                                className="dusk-input dusk-num"
                                style={{
                                  height: 32, fontSize: 13, fontWeight: 600, paddingRight: 24, textAlign: 'right',
                                  borderColor: 'var(--color-accent-2-border)',
                                  background: 'var(--color-accent-2-soft)',
                                  color: 'var(--color-accent-2)'
                                }}
                              />
                              <span style={{ position: 'absolute', right: 9, fontSize: 11.5, color: 'var(--color-accent-2)', fontWeight: 600, pointerEvents: 'none' }}>₴</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 8,
                          alignItems: 'end'
                        }}>
                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--color-muted)', display: 'block', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Аванс (оплачено)
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={formData.prepayment_amount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  const prepay = parseFloat(val) || 0;
                                  const cod = Math.max(0, Math.round(effectiveTotal - prepay));
                                  setFormData({
                                    ...formData,
                                    prepayment_amount: val,
                                    cod_amount: String(cod),
                                    payment_status: 'partially_paid'
                                  });
                                }}
                                className="dusk-input dusk-num"
                                style={{ height: 32, fontSize: 13, fontWeight: 500, paddingRight: 24 }}
                              />
                              <span style={{ position: 'absolute', right: 9, fontSize: 11.5, color: 'var(--color-muted)', pointerEvents: 'none' }}>₴</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--color-accent-2)', fontWeight: 600, display: 'block', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Наложка на пошті
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={formData.cod_amount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  setFormData({ ...formData, cod_amount: val });
                                }}
                                className="dusk-input dusk-num"
                                style={{
                                  height: 32, fontSize: 13, fontWeight: 600, paddingRight: 24,
                                  borderColor: 'var(--color-accent-2-border)',
                                  background: 'var(--color-accent-2-soft)',
                                  color: 'var(--color-accent-2)'
                                }}
                              />
                              <span style={{ position: 'absolute', right: 9, fontSize: 11.5, color: 'var(--color-accent-2)', fontWeight: 600, pointerEvents: 'none' }}>₴</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--color-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, whiteSpace: 'nowrap' }}>
                              <span>Фінальна сума</span>
                              {!formData.total && cartTotal > 0 && (
                                <span style={{ fontSize: 9.5, color: 'var(--color-accent)', fontWeight: 600 }}>авто</span>
                              )}
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="text"
                                inputMode="decimal"
                                placeholder={cartTotal > 0 ? `${cartTotal}` : '0'}
                                value={formData.total} 
                                onChange={e => setFormData({ ...formData, total: e.target.value.replace(/[^0-9.]/g, '') })}
                                className="dusk-input dusk-num"
                                style={{ height: 32, fontSize: 13, fontWeight: 600, paddingRight: 24 }}
                              />
                              <span style={{ position: 'absolute', right: 9, fontSize: 11.5, color: 'var(--color-muted)', pointerEvents: 'none' }}>₴</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 4. STAGE & DEADLINE CALENDAR */}
                  <div style={{
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                      4. Етап виконання та дата готовності
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {Object.keys(STATUS_META).map(stKey => {
                        const active = formData.status === stKey;
                        const stMeta = STATUS_META[stKey];
                        return (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => {
                              const updated = { status: stKey };
                              if (stKey === 'completed') updated.payment_status = 'paid';
                              setFormData({ ...formData, ...updated });
                            }}
                            className={`dusk-facet-pill ${active ? 'active' : ''}`}
                            style={{ padding: '4px 9px', fontSize: 11 }}
                          >
                            <span className={`dusk-dot ${active ? 'dusk-dot--periwinkle' : 'dusk-dot--muted'}`} style={{ width: 5, height: 5 }} />
                            <span>{stMeta.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ paddingTop: 8, borderTop: '1px solid var(--color-rule)' }}>
                      <DeadlineMiniPicker
                        value={formData.due_date}
                        days={formData.due_days}
                        onChange={(dateKey) => setFormData({ ...formData, due_date: dateKey })}
                        onDaysChange={(d) => setFormData({ ...formData, due_days: d })}
                        orders={sales}
                        excludeOrderId={editingSale?.id}
                      />
                    </div>
                  </div>

                  {/* 5. ORDER NOTES & AD ATTRIBUTION */}
                  <div style={{
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>
                        5. Коментар та додатково
                      </span>
                      <input 
                        type="text"
                        placeholder="Коментар до замовлення (напр. відправити до п'ятниці, на подарунок)…" 
                        value={formData.notes || ''} 
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="dusk-input"
                        style={{ height: 34, fontSize: 12.5 }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {['На подарунок', 'Терміново', 'Фото перед відправкою', 'Не телефонувати', 'Надійне пакування'].map(noteTag => {
                          const notesStr = formData.notes || '';
                          const isAdded = notesStr.toLowerCase().includes(noteTag.toLowerCase());
                          return (
                            <button
                              key={noteTag}
                              type="button"
                              onClick={() => {
                                const parts = notesStr.split(/\s*[|·]\s*/).map(s => s.trim()).filter(Boolean);
                                const nextParts = isAdded
                                  ? parts.filter(p => p.toLowerCase() !== noteTag.toLowerCase())
                                  : [...parts, noteTag];
                                setFormData({ ...formData, notes: nextParts.join(' · ') });
                              }}
                              className={`dusk-facet-pill ${isAdded ? 'active' : ''}`}
                              style={{ fontSize: 11, padding: '3px 9px', lineHeight: 1.2 }}
                            >
                              {isAdded ? <Check size={10} style={{ color: 'var(--color-accent)' }} /> : <span style={{ opacity: 0.55 }}>+</span>}
                              <span>{noteTag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ad Attribution Toggle & Dusk Campaign Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-rule)' }}>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setFormData({ ...formData, sold_via_ad: !formData.sold_via_ad, attributed_ad_id: !formData.sold_via_ad ? formData.attributed_ad_id : '' })}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 17, borderRadius: 999,
                            background: formData.sold_via_ad ? 'var(--color-accent)' : 'var(--color-paper)',
                            border: formData.sold_via_ad ? '1px solid var(--color-accent)' : '1px solid var(--color-rule)',
                            position: 'relative', transition: 'all 0.16s ease', flexShrink: 0
                          }}>
                            <span style={{
                              position: 'absolute', top: 2, left: formData.sold_via_ad ? 14 : 2,
                              width: 11, height: 11, borderRadius: '50%',
                              background: formData.sold_via_ad ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                              transition: 'left 0.16s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500, color: formData.sold_via_ad ? 'var(--color-ink)' : 'var(--color-ink-2)' }}>
                            Прив’язати продаж до рекламної кампанії (ROAS)
                          </span>
                        </div>

                        {formData.sold_via_ad && formData.attributed_ad_id && (
                          <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 10, padding: '2px 7px' }}>
                            Обрано
                          </span>
                        )}
                      </div>

                      {formData.sold_via_ad && (
                        <div style={{
                          background: 'var(--color-paper)',
                          border: '1px solid var(--color-rule)',
                          borderRadius: 10,
                          padding: 6,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          maxHeight: 165,
                          overflowY: 'auto'
                        }}>
                          {[
                            ...(matchingAds.direct || []).map(ad => ({ ...ad, _group: 'Підходить під товар' })),
                            ...(matchingAds.general || []).map(ad => ({ ...ad, _group: 'Загальна' })),
                            ...(matchingAds.other || []).map(ad => ({ ...ad, _group: null }))
                          ].length === 0 ? (
                            <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11.5, color: 'var(--color-muted)' }}>
                              Немає активних рекламних кампаній
                            </div>
                          ) : (
                            [
                              ...(matchingAds.direct || []).map(ad => ({ ...ad, _group: 'Підходить' })),
                              ...(matchingAds.general || []).map(ad => ({ ...ad, _group: 'Загальна' })),
                              ...(matchingAds.other || []).map(ad => ({ ...ad, _group: null }))
                            ].map(ad => {
                              const isSelected = formData.attributed_ad_id === ad.id;
                              const dateStr = ad.ad_date ? new Date(ad.ad_date).toLocaleDateString('uk-UA') : '';
                              return (
                                <button
                                  key={ad.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, attributed_ad_id: isSelected ? '' : ad.id })}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                    padding: '6px 9px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                                    background: isSelected ? 'var(--color-accent-soft)' : 'transparent',
                                    border: isSelected ? '1px solid var(--color-accent-border)' : '1px solid transparent',
                                    color: 'var(--color-ink)', transition: 'all 0.12s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                                    <span className={`dusk-badge ${isSelected ? 'dusk-badge--periwinkle' : 'dusk-badge--neutral'}`} style={{ fontSize: 10, padding: '2px 6px', flexShrink: 0 }}>
                                      {ad.platform || 'Ad'}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {ad.product_name || 'Загальна реклама магазину'}
                                    </span>
                                    {ad._group === 'Підходить' && (
                                      <span className="dusk-badge dusk-badge--apricot" style={{ fontSize: 9.5, padding: '1px 5px', flexShrink: 0 }}>
                                        Товар у кошику
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    {dateStr && (
                                      <span className="dusk-mono" style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                                        {dateStr}
                                      </span>
                                    )}
                                    <div style={{
                                      width: 14, height: 14, borderRadius: '50%',
                                      border: isSelected ? 'none' : '1.5px solid var(--color-rule)',
                                      background: isSelected ? 'var(--color-accent)' : 'transparent',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                      {isSelected && <Check size={9} style={{ color: 'var(--color-accent-ink)', strokeWidth: 3 }} />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* 3. STICKY FOOTER */}
              <div style={{ 
                padding: isMobile ? '12px 14px' : '12px 20px', 
                borderTop: '1px solid var(--color-rule)', 
                background: 'var(--color-paper-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>До сплати:</span>
                    <span className="dusk-num" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1, color: 'var(--color-ink)' }}>
                      {effectiveTotal.toLocaleString('uk-UA')} <span className="dusk-currency" style={{ fontSize: 14 }}>₴</span>
                    </span>
                  </div>
                  {formData.is_cod && formData.cod_amount ? (
                    <span className="dusk-badge dusk-badge--apricot dusk-num" style={{ fontSize: 11.5, lineHeight: 1, height: 24 }}>
                      Наложка: {formData.cod_amount} ₴ {Number(formData.prepayment_amount) > 0 ? `(аванс ${formData.prepayment_amount} ₴)` : ''}
                    </span>
                  ) : formData.payment_status === 'paid' ? (
                    <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 11.5, lineHeight: 1, height: 24 }}>
                      Оплачено повністю
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="dusk-btn dusk-btn--ghost"
                  >
                    Скасувати
                  </button>
                  <button 
                    type="submit" 
                    form="sale-form"
                    disabled={saving}
                    className="dusk-btn dusk-btn--primary"
                    style={{ minWidth: isMobile ? 160 : 210 }}
                  >
                    <Check size={15} />
                    <span>{saving ? 'Збереження…' : (editingSale ? 'Зберегти зміни' : 'Створити замовлення')}</span>
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
