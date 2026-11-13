// Hallmark Dusk Theme — AdminPanel
"use client";
import './dusk.css';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Package, LayoutDashboard, ShoppingBag, 
  Search, Bell, LogOut, Box, BarChart3, Settings,
  Upload, Image as ImageIcon, X, Edit3, Filter, CheckCircle, Globe, Tag, Percent, User, Coins, Award, Send, MessageSquare, Star, Calculator, ShieldCheck, Sparkles, Loader2, Sun, Moon, CheckCircle2, AlertCircle, Megaphone, Menu,
  Clock, ClipboardList, Printer, Truck, XCircle, ChevronDown, ChevronUp, Hammer, Lightbulb, Palette, Check, Calendar, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalculatorComp from '@/components/Calculator';
import InventoryDashboard from '@/components/InventoryDashboard';
import AdvertisingDashboard from '@/components/AdvertisingDashboard';
import SalesDashboard from '@/components/SalesDashboard';
import SalesStatsDashboard from '@/components/SalesStatsDashboard';
import ShippingCabinet from '@/components/ShippingCabinet';
import ProductionCabinet from '@/components/ProductionCabinet';
import OrderCalendar from '@/components/OrderCalendar';
import { getTodayKey, DONE_OR_SHIPPED_STATUSES } from '@/lib/calendarHelpers';
import LampStudio from '@/components/LampStudio';
import BioLinksEditor from '@/components/BioLinksEditor';
import DropshippingAdmin from '@/components/DropshippingAdmin';
import BannersAdmin from '@/components/BannersAdmin';
import BulkMakerWorldImportModal from '@/components/BulkMakerWorldImportModal';
import StudioStyleModal from '@/components/StudioStyleModal';
import BulkPriceModal from '@/components/BulkPriceModal';
import { parseProductSizes, embedProductSizes, normalizeSizes } from '@/lib/productSizes';


const scrollbarHide = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  :root {
    --bg-main: var(--color-paper, oklch(17.5% 0.014 268));
    --bg-card: var(--color-paper-2, oklch(21.5% 0.016 268));
    --bg-header: var(--color-paper, oklch(17.5% 0.014 268));
    --text-main: var(--color-ink, oklch(96% 0.006 75));
    --text-muted: var(--color-muted, oklch(62% 0.012 268));
    --text-accent: var(--color-accent, oklch(77% 0.10 274));
    --border: var(--color-rule, rgba(235, 232, 245, 0.08));
    --sidebar-active: var(--color-accent-soft, rgba(164, 174, 248, 0.14));
    --bg-input: var(--color-paper, oklch(17.5% 0.014 268));
  }

  .light-theme {
    --bg-main: var(--color-paper, oklch(96.5% 0.007 75));
    --bg-card: var(--color-paper-2, oklch(93.5% 0.009 75));
    --bg-header: var(--color-paper, oklch(96.5% 0.007 75));
    --bg-input: var(--color-paper-3, oklch(90% 0.011 75));
    --text-main: var(--color-ink, oklch(19% 0.015 268));
    --text-muted: var(--color-muted, oklch(48% 0.014 268));
    --text-accent: var(--color-accent, oklch(52% 0.15 272));
    --border: var(--color-rule, rgba(24, 24, 38, 0.09));
    --sidebar-active: rgba(90, 98, 216, 0.10);
  }

  @media (max-width: 1024px) {
    .admin-layout { flex-direction: column !important; }
    .admin-aside { 
      position: fixed !important; 
      left: 0 !important;
      top: 0 !important; 
      bottom: 0 !important; 
      width: 256px !important;
      z-index: 1001 !important;
      transform: translate3d(-100%, 0, 0);
      will-change: transform;
      transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
    .admin-aside.open { transform: translate3d(0, 0, 0); }
    .admin-main-header { display: none !important; }
    .admin-mobile-header { display: flex !important; }
    .admin-content { padding: 16px !important; }
  }
`;

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales_cabinet');
  const [triggerAddDueDate, setTriggerAddDueDate] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('all'); // 'all' | 'in_stock' | 'discount' | 'trending' | '3d'
  const [productSort, setProductSort] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'name'
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [isGeneratingStudio, setIsGeneratingStudio] = useState(false);
  const [studioStage, setStudioStage] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [reassignDropdownOpen, setReassignDropdownOpen] = useState(false);
  const [reassignModal, setReassignModal] = useState({
    open: false,
    catIdToDelete: null,
    catNameToDelete: '',
    products: [],
    selectedNewCatName: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin_active_tab');
      if (savedTab) {
        setActiveTab(savedTab === 'sales' ? 'sales_cabinet' : savedTab);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', activeTab);
    }
  }, [activeTab]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [orderFilterTemplates, setOrderFilterTemplates] = useState([]);
  const [showOrderTemplatesDropdown, setShowOrderTemplatesDropdown] = useState(false);
  const [newOrderTemplateName, setNewOrderTemplateName] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [openGroups, setOpenGroups] = useState({
    analytics: true,
    catalog: true,
    production_group: true,
    marketing_clients: true,
    system: true
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buba_orders_filter_templates');
      if (saved) {
        const templates = JSON.parse(saved);
        setOrderFilterTemplates(templates);
        const defaultTemplate = templates.find(t => t.isDefault);
        if (defaultTemplate) {
          setSelectedStatuses(defaultTemplate.selectedStatuses || []);
          setSelectedPayments(defaultTemplate.selectedPayments || []);
        }
      }
    }
  }, []);

  const saveOrderFilterTemplate = (name) => {
    if (!name.trim()) return;
    const newTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      selectedStatuses,
      selectedPayments,
      isDefault: false
    };
    const updated = [...orderFilterTemplates, newTemplate];
    setOrderFilterTemplates(updated);
    localStorage.setItem('buba_orders_filter_templates', JSON.stringify(updated));
    setNewOrderTemplateName('');
    showToast('Шаблон збережено', 'success');
  };

  const deleteOrderFilterTemplate = (id, e) => {
    e.stopPropagation();
    const updated = orderFilterTemplates.filter(t => t.id !== id);
    setOrderFilterTemplates(updated);
    localStorage.setItem('buba_orders_filter_templates', JSON.stringify(updated));
    showToast('Шаблон видалено', 'info');
  };

  const toggleOrderTemplateDefault = (id, e) => {
    e.stopPropagation();
    const updated = orderFilterTemplates.map(t => {
      if (t.id === id) {
        return { ...t, isDefault: !t.isDefault };
      }
      return { ...t, isDefault: false };
    });
    setOrderFilterTemplates(updated);
    localStorage.setItem('buba_orders_filter_templates', JSON.stringify(updated));
    showToast('Налаштування оновлено', 'success');
  };

  const applyOrderTemplate = (template) => {
    setSelectedStatuses(template.selectedStatuses || []);
    setSelectedPayments(template.selectedPayments || []);
    showToast(`Застосовано шаблон "${template.name}"`, 'success');
    setShowOrderTemplatesDropdown(false);
  };

  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [showFarmMonitor, setShowFarmMonitor] = useState(true);
  const [showAddPrinterForm, setShowAddPrinterForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const fetchPrinters = async () => {
    const defaultPrinters = [
      { id: '1', name: 'Bambu Lab X1C', wattage: 350, wear: 10, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
      { id: '2', name: 'Bambu Lab P1S/P1P', wattage: 350, wear: 8, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
      { id: '3', name: 'Bambu Lab A1', wattage: 200, wear: 6, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
      { id: '4', name: 'Bambu Lab A1 Mini', wattage: 150, wear: 5, is_repair: false, ip_address: '', access_code: '', serial_number: '' }
    ];

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buba_printers');
      if (saved) {
        try {
          setPrinters(JSON.parse(saved));
        } catch (_) {}
      } else {
        setPrinters(defaultPrinters);
      }
    } else {
      setPrinters(defaultPrinters);
    }

    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'buba_printers')
        .maybeSingle();

      if (data && data.value) {
        setPrinters(data.value);
        if (typeof window !== 'undefined') {
          localStorage.setItem('buba_printers', JSON.stringify(data.value));
        }
      }
    } catch (e) {
      // Silently fallback to local storage
    }
  };

  useEffect(() => {
    if (activeTab === 'farm') {
      fetchPrinters();
    }
  }, [activeTab]);

  const savePrinters = async (newPrinters) => {
    setPrinters(newPrinters);
    if (typeof window !== 'undefined') {
      localStorage.setItem('buba_printers', JSON.stringify(newPrinters));
    }
    if (supabase) {
      try {
        await supabase.from('settings').upsert({ key: 'buba_printers', value: newPrinters });
      } catch (e) {
        console.error('Error saving printers to Supabase:', e);
      }
    }
  };

  const togglePrinterRepair = (printerId) => {
    const updated = printers.map(p => 
      p.id === printerId ? { ...p, is_repair: !p.is_repair } : p
    );
    savePrinters(updated);
    showToast('Статус принтера оновлено');
  };

  const handleAddPrinter = (name, wattage, wear, ipAddress = '', accessCode = '', serialNumber = '') => {
    const newPrinter = {
      id: Date.now().toString(),
      name,
      wattage: parseFloat(wattage) || 300,
      wear: parseFloat(wear) || 5,
      is_repair: false,
      ip_address: ipAddress,
      access_code: accessCode,
      serial_number: serialNumber
    };
    const updated = [...printers, newPrinter];
    savePrinters(updated);
  };

  const handleDeletePrinter = (printerId) => {
    const updated = printers.filter(p => p.id !== printerId);
    savePrinters(updated);
  };

  const toggleStatusFilter = (status) => {
    if (status === 'Всі') {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(prev => {
        if (prev.includes(status)) {
          return prev.filter(s => s !== status);
        } else {
          return [...prev, status];
        }
      });
    }
  };

  const togglePaymentFilter = (payment) => {
    if (payment === 'Всі') {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(prev => {
        if (prev.includes(payment)) {
          return prev.filter(p => p !== payment);
        } else {
          return [...prev, payment];
        }
      });
    }
  };

  const toggleOrderExpand = (id) => {
    if (typeof window !== 'undefined' && window.getSelection()?.toString().length > 0) return;
    setExpandedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Всі');
  const [bonusModal, setBonusModal] = useState({ open: false, user: null, amount: '100', mode: 'add' });
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'info' });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ sent: 0, total: 0, nextBatchIn: 0, batches: [] });
  const [individualMessageModal, setIndividualMessageModal] = useState({ open: false, user: null, message: '', imageUrl: '', isSending: false });
  const [reviews, setReviews] = useState([]);
  const [replyData, setReplyData] = useState({ reviewId: null, text: '' });
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [triggerAddSale, setTriggerAddSale] = useState(false);
  const [externalEditOrder, setExternalEditOrder] = useState(null);
  const [productViewMode, setProductViewMode] = useState('grid'); // 'grid' | 'list'

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };


  const [formData, setFormData] = useState({
    name: '', description: '', price: '', discount: 0, status: 'in_stock', 
    model_3d: '', image_url: '', image_urls: [], category: '',
    plastic_type: '', safety_info: '', weight: '', color: '',
    is_trending: false, sizes: []
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchReviews();
    fetchPrinters();

    // 1. Налаштовуємо Realtime для миттєвих оновлень
    const channel = supabase
      .channel('admin-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchReviews())
      .subscribe();

    // 2. Фонове оновлення кожні 5 секунд як запасний варіант
    const intervalId = setInterval(() => {
      fetchOrders();
      fetchUsers();
      fetchReviews();
    }, 5000);

    // 3. Telegram Mini App Initialization & Auto-Auth
    const initTMA = () => {
      if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();
        
        const tgUser = webApp.initDataUnsafe?.user;
        if (tgUser) {
          const adminIds = (process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim());
          if (adminIds.includes(tgUser.id.toString())) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session_type', 'telegram');
            showToast(`Привіт, ${tgUser.first_name}! Авторизація через Telegram успішна`, 'success');
          }
        }
      }
    };

    const savedAuth = localStorage.getItem('admin_session');
    const savedAuthType = localStorage.getItem('admin_session_type');

    // Mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const loggedOutManually = localStorage.getItem('admin_manual_logout') === 'true';

    if (savedAuth && (savedAuth === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || savedAuth === 'local_dusk')) {
      setIsAuthenticated(true);
    } else if (isLocalhost && !loggedOutManually) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_session', 'local_dusk');
    } else if (savedAuthType === 'telegram') {
      initTMA();
    } else {
      initTMA();
    }
    
    setMounted(true);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const envPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if ((envPass && adminPass === envPass) || (isLocalhost && adminPass.trim().length >= 0)) {
      localStorage.setItem('admin_session', adminPass || 'local_dusk');
      localStorage.removeItem('admin_manual_logout');
      setIsAuthenticated(true);
      setAuthError(false);
      showToast('Вхід успішний', 'success');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session_type');
    localStorage.setItem('admin_manual_logout', 'true');
    setIsAuthenticated(false);
    showToast('Ви вийшли з сесії', 'info');
  };

  async function syncUser(tgUser) {
    if (!supabase) return;
    try {
      console.log('Syncing user with ID:', tgUser.id);
      
      const { data: existing, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tg_id', tgUser.id.toString())
        .single();

      if (existing) {
        console.log('Found existing customer:', existing);
      } else {
        console.log('Creating new customer profile');
        const { data: created, error: insertError } = await supabase
          .from('customers')
          .upsert({ 
            tg_id: tgUser.id.toString(), 
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            bonuses: 0 
          }, { onConflict: 'tg_id' })
          .select()
          .single();
        
        if (insertError) console.error('Insert error:', insertError);
      }
    } catch (e) {
      console.error('Full sync error:', e);
    }
  }

  async function fetchUsers() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .not('tg_id', 'is', null);
      if (!error && data) {
        setUsers(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  }

  async function confirmBonusUpdate() {
    if (!supabase || !bonusModal.user) return;
    const amount = parseInt(bonusModal.amount);
    if (isNaN(amount)) return;
    
    const finalAmount = bonusModal.mode === 'add' ? amount : -amount;
    const user = bonusModal.user;

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${user.phone}${user.tg_id ? `,tg_id.eq.${user.tg_id}` : ''}`)
        .single();
      
      if (customer) {
        const newBalance = (customer.bonuses || 0) + finalAmount;
        const { error } = await supabase
          .from('customers')
          .update({ bonuses: Math.max(0, newBalance) })
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ 
            phone: user.phone, 
            tg_id: user.tg_id,
            first_name: user.first_name || user.name, 
            bonuses: Math.max(0, finalAmount) 
          }]);
        if (error) throw error;
      }
      
      setBonusModal({ ...bonusModal, open: false });
      fetchUsers();
    } catch (e) {
      alert('Помилка: ' + e.message);
    }
  }

  function openBonusModal(user) {
    setBonusModal({ open: true, user, amount: '100', mode: 'add' });
  }

  async function deleteUser(phone) {
    if (!supabase) return;
    setModal({
      open: true,
      title: 'Видалення клієнта',
      message: 'Ви впевнені, що хочете видалити цього клієнта? Цю дію неможливо скасувати.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('customers').delete().eq('phone', phone);
          if (error) throw error;
          fetchUsers();
          setModal({ ...modal, open: false });
        } catch (e) {
          setModal({ open: true, title: 'Помилка', message: e.message, type: 'danger' });
        }
      }
    });
  }

  async function adjustAdRevenue(adId, amountChange) {
    if (!adId || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('revenue')
        .eq('id', adId)
        .single();
      if (error) throw error;
      
      const currentRevenue = parseFloat(data.revenue || 0);
      const newRevenue = currentRevenue + amountChange;
      
      const { error: updateError } = await supabase
        .from('advertisements')
        .update({ revenue: newRevenue })
        .eq('id', adId);
      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error adjusting ad revenue:', err);
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!supabase) return;
    setModal({
      open: true,
      title: 'Видалити замовлення?',
      message: 'Ця дія назавжди видалить замовлення з бази даних.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const order = orders.find(o => o.id === orderId);
          const { error } = await supabase.from('orders').delete().eq('id', orderId);
          if (error) throw error;

          if (order && order.status === 'completed' && order.shipping_details?.attributed_ad_id) {
            await adjustAdRevenue(order.shipping_details.attributed_ad_id, -parseFloat(order.total || 0));
          }

          setOrders(orders.filter(o => o.id !== orderId));
          setModal({ ...modal, open: false });
        } catch (e) {
          alert('Помилка видалення: ' + e.message);
        }
      }
    });
  }

  async function updateOrderStatus(orderId, newStatus) {
    if (!supabase) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.payment_status = 'paid';
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;

      // Adjust ad revenue if status changes to/from completed
      const oldStatus = order.status;
      const adId = order.shipping_details?.attributed_ad_id;
      const totalAmount = parseFloat(order.total || 0);

      if (adId) {
        if (oldStatus === 'completed' && newStatus !== 'completed') {
          await adjustAdRevenue(adId, -totalAmount);
        } else if (oldStatus !== 'completed' && newStatus === 'completed') {
          await adjustAdRevenue(adId, totalAmount);
        }
      }

      // Надсилаємо сповіщення клієнту
      const customer = order?.customers;
      if (customer?.tg_id) {
        try {
          await fetch('/api/order-status-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg_id: customer.tg_id,
              order_number: order.order_id || order.id,
              status: newStatus,
              total_amount: order.total_amount
            })
          });
        } catch (notifyErr) {
          console.error('Failed to send status notification:', notifyErr);
        }
      }

      // Нарахування кешбеку 5% при завершенні замовлення
      if (newStatus === 'completed' && order.status !== 'completed' && order.customer_id) {
        const cashback = Math.floor(order.total * 0.05);
        if (cashback > 0) {
          const { data: customer } = await supabase
            .from('customers')
            .select('bonuses')
            .eq('id', order.customer_id)
            .single();
          
          if (customer) {
            const newBalance = (customer.bonuses || 0) + cashback;
            await supabase
              .from('customers')
              .update({ bonuses: newBalance })
              .eq('id', order.customer_id);
            
            // Оновлюємо список користувачів, щоб бачити зміни
            fetchUsers();
          }
        }
      }
      
      setOrders(orders.map(o => o.id === orderId ? (newStatus === 'completed' ? { ...o, status: newStatus, payment_status: 'paid' } : { ...o, status: newStatus }) : o));
      showToast('Статус змінено, клієнт отримав сповіщення');
    } catch (e) {
      alert('Помилка оновлення статусу: ' + e.message);
    }
  }

  async function handleMessageImageUpload(e, target) {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `broadcast-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      
      if (target === 'broadcast') {
        setBroadcastImageUrl(publicUrl);
      } else if (target === 'individual') {
        setIndividualMessageModal(prev => ({ ...prev, imageUrl: publicUrl }));
      }
    } catch (error) {
      alert('Помилка завантаження: ' + error.message);
    } finally {
      setIsUploadingMedia(false);
    }
  }

  async function handleSendBroadcast() {
    if (!broadcastMessage.trim()) return;
    
    const subscribers = users.filter(u => u.allow_notifications && u.tg_id);
    if (subscribers.length === 0) {
      alert('Немає підписаних клієнтів з Telegram ID');
      return;
    }

    setModal({
      open: true,
      title: 'Підтвердження черги розсилки 📣',
      message: `Ви збираєтесь надіслати повідомлення ${subscribers.length} клієнтам. Розсилка буде йти пакетами по 10 осіб з інтервалом 2 хвилини. Не закривайте цю вкладку до завершення!`,
      type: 'confirm',
      onConfirm: async () => {
        setModal({ ...modal, open: false });
        setIsProcessingQueue(true);
        setQueueStatus({ sent: 0, total: subscribers.length, nextBatchIn: 0, batches: [] });
        
        // Start processing
        startQueueProcessing(subscribers, broadcastMessage, broadcastImageUrl);
      }
    });
  }

  async function startQueueProcessing(allSubscribers, msg, img) {
    const BATCH_SIZE = 10;
    const DELAY_MS = 2 * 60 * 1000; // 2 minutes
    
    let currentSent = 0;
    const total = allSubscribers.length;
    const queue = [...allSubscribers];

    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      const batchIds = batch.map(u => ({ tg_id: u.tg_id }));
      
      const batchStartTime = new Date();
      
      try {
        const response = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: msg,
            imageUrl: img,
            subscribers: batchIds
          })
        });
        
        const result = await response.json();
        currentSent += (result.sent_count || 0);
        
        const batchInfo = {
          time: batchStartTime.toLocaleTimeString(),
          count: batch.length,
          sent: result.sent_count || 0,
          status: 'success'
        };

        setQueueStatus(prev => ({
          ...prev,
          sent: currentSent,
          batches: [batchInfo, ...prev.batches]
        }));

        if (queue.length > 0) {
          // countdown for next batch
          let timeLeft = 120; // 2 minutes
          while (timeLeft > 0) {
            setQueueStatus(prev => ({ ...prev, nextBatchIn: timeLeft }));
            await new Promise(r => setTimeout(r, 1000));
            timeLeft--;
          }
        }
      } catch (e) {
        console.error('Batch error:', e);
        setQueueStatus(prev => ({
          ...prev,
          batches: [{ time: batchStartTime.toLocaleTimeString(), count: batch.length, status: 'error', error: e.message }, ...prev.batches]
        }));
        // Optional: break or continue? Let's continue for now.
        await new Promise(r => setTimeout(r, 5000)); // wait a bit before next attempt if error
      }
    }

    setIsProcessingQueue(false);
    setBroadcastMessage('');
    setBroadcastImageUrl('');
    setModal({ open: true, title: 'Готово! ✨', message: `Розсилку завершено. Успішно надіслано ${currentSent} з ${total} повідомлень.`, type: 'success' });
  }

  async function handleSendIndividualMessage() {
    const { user, message, imageUrl } = individualMessageModal;
    if (!user || !message.trim()) return;

    setIndividualMessageModal(prev => ({ ...prev, isSending: true }));
    try {
      const response = await fetch('/api/individual-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: user.tg_id,
          message,
          imageUrl
        })
      });

      const result = await response.json();
      if (response.ok) {
        setModal({ open: true, title: 'Успіх! ✨', message: 'Повідомлення надіслано!', type: 'success' });
        setIndividualMessageModal({ open: false, user: null, message: '', imageUrl: '', isSending: false });
      } else {
        throw new Error(result.error || 'Помилка відправки');
      }
    } catch (e) {
      setModal({ open: true, title: 'Помилка', message: e.message, type: 'danger' });
    } finally {
      setIndividualMessageModal(prev => ({ ...prev, isSending: false }));
    }
  }

  async function enableAllNotifications() {
    if (!supabase) return;
    
    setModal({
      open: true,
      title: 'Увімкнути всім сповіщення? 🔔',
      message: 'Ви збираєтесь увімкнути сповіщення для ВСІХ клієнтів у базі даних. Це дозволить робити розсилки тим, хто їх раніше вимкнув або не мав увімкненими за замовчуванням. Продовжити?',
      type: 'confirm',
      onConfirm: async () => {
        setModal({ ...modal, open: false });
        setRefreshing(true);
        try {
          const { error } = await supabase
            .from('customers')
            .update({ allow_notifications: true })
            .neq('tg_id', '0'); // Фільтр для того, щоб оновити всіх (Supabase потребує WHERE)

          if (error) throw error;
          
          setModal({ open: true, title: 'Успіх! ✨', message: 'Сповіщення увімкнено для всіх клієнтів!', type: 'success' });
          fetchUsers();
        } catch (e) {
          setModal({ open: true, title: 'Помилка', message: e.message, type: 'danger' });
        } finally {
          setRefreshing(false);
        }
      }
    });
  }

  async function fetchOrders() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            tg_id
          )
        `)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }

  async function fetchReviews() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customers(first_name, last_name, tg_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (e) {
      console.error('Error fetching reviews:', e);
    }
  }

  async function handleManualRefresh() {
    if (!supabase || refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchOrders(),
        fetchReviews(),
        fetchPrinters()
      ]);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }

  async function handleDeleteReview(id) {
    if (!supabase) return;
    setModal({
      open: true,
      title: 'Видалити відгук?',
      message: 'Ця дія назавжди видалить відгук із бази даних.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('reviews').delete().eq('id', id);
          if (error) throw error;
          setReviews(reviews.filter(r => r.id !== id));
          setModal({ ...modal, open: false });
        } catch (e) {
          alert('Помилка: ' + e.message);
        }
      }
    });
  }

  async function handleSendReply(reviewId) {
    if (!supabase || !replyData.text.trim()) return;
    try {
      const review = reviews.find(r => r.id === reviewId);
      
      const { error } = await supabase
        .from('reviews')
        .update({ 
          admin_reply: replyData.text,
          replied_at: new Date().toISOString()
        })
        .eq('id', reviewId);
      
      if (error) throw error;

      // Надсилаємо сповіщення в Telegram клієнту
      const customer = Array.isArray(review?.customers) ? review.customers[0] : review?.customers;
      console.log('Attempting to send notification to:', customer?.tg_id, 'for review:', reviewId);

      if (customer?.tg_id) {
        try {
          const notifyRes = await fetch('/api/review-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg_id: customer.tg_id,
              reply_text: replyData.text,
              original_comment: review.comment
            })
          });
          const notifyData = await notifyRes.json();
          console.log('Notification API response:', notifyData);
          
          if (!notifyData.success) {
            const errorMsg = notifyData.details?.description || 'Невідома помилка Telegram';
            setModal({ 
              open: true, 
              title: 'Відповідь збережена, але...', 
              message: `Відгук збережено, але сповіщення НЕ надіслано: ${errorMsg}. Переконайтеся, що клієнт не заблокував бота.`, 
              type: 'warning' 
            });
            return;
          }
        } catch (notificationError) {
          console.error('Failed to send telegram notification:', notificationError);
          setModal({ open: true, title: 'Помилка мережі', message: 'Не вдалося з\'єднатися з сервісом сповіщень.', type: 'danger' });
          return;
        }
      } else {
        console.warn('Cannot send notification: tg_id is missing for this customer.');
        setModal({ 
          open: true, 
          title: 'Увага', 
          message: 'Відповідь збережена, але ми не змогли надіслати сповіщення, бо у цього клієнта в базі відсутній Telegram ID (можливо, це старий відгук).', 
          type: 'warning' 
        });
        return;
      }
      
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, admin_reply: replyData.text, replied_at: new Date().toISOString() } : r));
      setReplyData({ reviewId: null, text: '' });
      setModal({ 
        open: true, 
        title: 'Успіх!', 
        message: `Відповідь збережена. Бот відправив сповіщення на ID: ${customer.tg_id} ✨`, 
        type: 'success' 
      });
    } catch (e) {
      alert('Помилка: ' + e.message);
    }
  }

  async function updatePaymentStatus(orderId, newStatus) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
      showToast('Статус оплати оновлено');
    } catch (e) {
      alert('Помилка при оновленні статусу оплати: ' + e.message);
    }
  }

  async function assignPrinter(orderId, printerName, printHours = null) {
    if (!supabase) return;
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedDetails = {
        ...(order.shipping_details || {}),
        assigned_printer: printerName,
        print_hours: printHours !== null ? parseFloat(printHours) : (order.shipping_details?.print_hours || 4),
        print_started_at: printerName ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('orders')
        .update({ shipping_details: updatedDetails })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_details: updatedDetails } : o));
      showToast(printerName ? `Замовлення призначено на ${printerName}` : 'Принтер звільнено');
    } catch (e) {
      alert('Помилка призначення принтера: ' + e.message);
    }
  }
  
  async function deleteOrder(id) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      setOrders(orders.filter(o => o.id !== id));
      setModal({ open: false });
    } catch (e) {
      alert('Помилка при видаленні: ' + e.message);
    }
  }

  async function fetchDbCategories(currentProducts = products) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDbCategories(data);
      } else {
        // Categories table is empty, let's sync from existing products if any
        const uniqueCats = [...new Set(currentProducts.map(p => p.category).filter(Boolean))];
        if (uniqueCats.length > 0) {
          const inserts = uniqueCats.map(name => ({
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-')
          }));
          const { data: insertedData, error: insertError } = await supabase.from('categories').insert(inserts).select();
          if (!insertError && insertedData) {
            setDbCategories(insertedData);
          }
        } else {
          setDbCategories([]);
        }
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (!supabase) return;
    try {
      const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim(), slug }])
        .select();
      if (error) throw error;
      setDbCategories([...dbCategories, data[0]]);
      setNewCategoryName('');
      showToast('Категорію додано успішно!', 'success');
    } catch (err) {
      alert('Помилка додавання категорії: ' + err.message);
    }
  }

  async function handleDeleteCategory(catId, catName) {
    if (!supabase) return;
    const relatedProducts = products.filter(p => p.category === catName);
    if (relatedProducts.length > 0) {
      setReassignModal({
        open: true,
        catIdToDelete: catId,
        catNameToDelete: catName,
        products: relatedProducts,
        selectedNewCatName: ''
      });
    } else {
      if (confirm(`Ви впевнені, що хочете видалити категорію "${catName}"?`)) {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', catId);
          if (error) throw error;
          setDbCategories(dbCategories.filter(c => c.id !== catId));
          showToast('Категорію видалено', 'success');
        } catch (err) {
          alert('Помилка видалення: ' + err.message);
        }
      }
    }
  }

  async function handleConfirmReassignment() {
    if (!supabase) return;
    if (!reassignModal.selectedNewCatName) {
      alert('Будь ласка, оберіть нову категорію');
      return;
    }
    setLoading(true);
    try {
      const productIds = reassignModal.products.map(p => p.id);
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: reassignModal.selectedNewCatName })
        .in('id', productIds);
      if (updateError) throw updateError;
      
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', reassignModal.catIdToDelete);
      if (deleteError) throw deleteError;
      
      setProducts(products.map(p => 
        productIds.includes(p.id) ? { ...p, category: reassignModal.selectedNewCatName } : p
      ));
      setDbCategories(dbCategories.filter(c => c.id !== reassignModal.catIdToDelete));
      
      setReassignModal({ open: false, catIdToDelete: null, catNameToDelete: '', products: [], selectedNewCatName: '' });
      showToast('Категорію видалено, а товари перенесено успішно!', 'success');
    } catch (err) {
      alert('Помилка перенесення: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setProducts(data);
        await fetchDbCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSingleStudioPhoto() {
    if (!formData.image_url || isGeneratingStudio) return;
    setIsGeneratingStudio(true);
    setStudioStage('Обробка на сервері...');
    try {
      const res = await fetch('/api/studio-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'single',
          imageUrl: formData.image_url,
          aspectRatio: '1:1'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Помилка генерації');
      }
      const studioUrl = data.url;

      const oldMain = formData.image_url;
      const existingExtras = Array.isArray(formData.image_urls) ? formData.image_urls : [];
      const nextExtras = oldMain && !oldMain.includes('/studio-') && !existingExtras.includes(oldMain)
        ? [oldMain, ...existingExtras]
        : existingExtras;

      setFormData(prev => ({
        ...prev,
        image_url: studioUrl,
        image_urls: nextExtras
      }));
    } catch (e) {
      alert('Помилка ШІ-студії: ' + e.message);
    } finally {
      setIsGeneratingStudio(false);
      setStudioStage('');
    }
  }

  async function handleImportFromMakerWorld() {
    if (!importUrl.trim() || !importUrl.includes('makerworld.com')) {
      alert('Будь ласка, вставте коректне посилання на MakerWorld');
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch('/api/parse-makerworld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFormData({
        ...formData,
        name: data.name || formData.name,
        description: data.description || formData.description,
        image_url: data.image_url || formData.image_url,
        image_urls: data.image_urls || formData.image_urls,
        category: data.category || formData.category,
        weight: data.weight || formData.weight,
        plastic_type: data.plastic_type || formData.plastic_type,
        color: data.color || formData.color,
        safety_info: data.safety_info || formData.safety_info
      });
      
      setModal({
        open: true,
        title: 'Успішно! ✨',
        message: 'Дані з MakerWorld імпортовані. Ви можете відредагувати їх та встановити ціну.',
        type: 'success'
      });
      setImportUrl('');
    } catch (e) {
      alert('Помилка імпорту: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  }

  const categories = useMemo(() => {
    const cats = dbCategories.map(c => c.name);
    return ['Всі', ...cats];
  }, [dbCategories]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'Всі' || p.category === activeCategory;
      const matchesStock =
        productStockFilter === 'all' ? true :
        productStockFilter === 'in_stock' ? p.status !== 'out_of_stock' :
        productStockFilter === 'discount' ? (parseFloat(p.discount || 0) > 0) :
        productStockFilter === 'trending' ? !!p.is_trending :
        productStockFilter === '3d' ? !!p.model_3d : true;
      return matchesSearch && matchesCategory && matchesStock;
    });

    return [...filtered].sort((a, b) => {
      const priceA = (parseFloat(a.price || 0) * (1 - (parseFloat(a.discount || 0)) / 100));
      const priceB = (parseFloat(b.price || 0) * (1 - (parseFloat(b.discount || 0)) / 100));
      if (productSort === 'price_asc') return priceA - priceB;
      if (productSort === 'price_desc') return priceB - priceA;
      if (productSort === 'name') return (a.name || '').localeCompare(b.name || '', 'uk');
      return 0;
    });
  }, [products, searchQuery, activeCategory, productStockFilter, productSort]);

  const finalPricePreview = useMemo(() => {
    const p = parseFloat(formData.price) || 0;
    const d = parseFloat(formData.discount) || 0;
    return (p * (1 - d / 100)).toFixed(0);
  }, [formData.price, formData.discount]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(o.status);
      const matchesPayment = selectedPayments.length === 0 || selectedPayments.includes(o.payment_status);
      const matchesSearch = !searchQuery || (
        (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (o.shipping_details?.phone || '').includes(searchQuery) ||
        (o.shipping_details?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.shipping_details?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, selectedStatuses, selectedPayments, searchQuery]);

  const printerLoads = useMemo(() => {
    const loads = {};
    printers.forEach(p => {
      loads[p.name] = { printer: p, order: null, remainingMinutes: 0, percentElapsed: 0, status: p.is_repair ? 'repair' : 'free' };
    });

    orders.forEach(order => {
      if (order.status === 'printing' && order.shipping_details?.assigned_printer) {
        const pName = order.shipping_details.assigned_printer;
        if (loads[pName]) {
          const startedAt = order.shipping_details.print_started_at;
          const hours = parseFloat(order.shipping_details.print_hours) || 4;
          let remainingMinutes = 0;
          let percentElapsed = 0;

          if (order.shipping_details?.print_progress !== undefined && order.shipping_details?.print_progress !== null) {
            percentElapsed = Math.min(100, parseInt(order.shipping_details.print_progress) || 0);
            remainingMinutes = Math.max(0, parseInt(order.shipping_details.print_remaining) || 0);
          } else if (startedAt) {
            const elapsedMs = new Date() - new Date(startedAt);
            const totalMs = hours * 60 * 60 * 1000;
            percentElapsed = Math.min(100, Math.floor((elapsedMs / totalMs) * 100));
            remainingMinutes = Math.max(0, Math.floor((totalMs - elapsedMs) / (60 * 1000)));
          }

          loads[pName].order = order;
          loads[pName].remainingMinutes = remainingMinutes;
          loads[pName].percentElapsed = percentElapsed;
          if (loads[pName].status !== 'repair') {
            loads[pName].status = 'printing';
          }
        }
      }
    });

    return Object.values(loads);
  }, [printers, orders]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    if (!supabase) {
      alert('Помилка: З\'єднання з базою даних не встановлено (перевірте .env.local)');
      setUploading(false);
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      alert('Помилка: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!supabase) {
      alert('Помилка: З\'єднання з базою даних не встановлено');
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      
      const currentExtra = Array.isArray(formData.image_urls) ? formData.image_urls : [];
      if (!formData.image_url) {
        setFormData({...formData, image_url: publicUrl});
      } else {
        setFormData({...formData, image_urls: [...currentExtra, publicUrl]});
      }
    } catch (error) {
      alert('Помилка: ' + error.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (!supabase) {
      alert('Помилка: З\'єднання з базою даних не встановлено');
      setLoading(false);
      return;
    }
    try {
      const cleanSizes = normalizeSizes(formData.sizes);
      const fallbackPrice = cleanSizes.length > 0 ? Math.min(...cleanSizes.map(s => s.price)) : 0;
      const { sizes: _omitSizes, ...restForm } = formData;
      const dataToSave = {
        ...restForm,
        description: embedProductSizes(formData.description, cleanSizes),
        price: parseFloat(formData.price) || fallbackPrice,
        discount: parseFloat(formData.discount) || 0
      };

      if (editingId) {
        const { data, error } = await supabase.from('products').update(dataToSave).eq('id', editingId).select();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingId ? data[0] : p));
      } else {
        const { data, error } = await supabase.from('products').insert([dataToSave]).select();
        if (error) throw error;
        setProducts([data[0], ...products]);
      }
      closeModal();
    } catch (error) {
      alert('Помилка: ' + error.message + '\nПереконайтеся, що ви додали колонку discount в базу даних (ALTER TABLE products ADD COLUMN discount NUMERIC DEFAULT 0)');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(product) {
    setEditingId(product.id);
    const parsedSizes = parseProductSizes(product);
    const cleanDescForInput = (product.description || '').replace(/\|\|\|SIZES\|\|\|[\s\S]*?(\|\|\|END_SIZES\|\|\||$)/, '').trim();
    setFormData({
      name: product.name || '',
      description: cleanDescForInput,
      price: product.price || '',
      discount: product.discount || 0,
      status: product.status || 'in_stock',
      model_3d: product.model_3d || '',
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      category: product.category || '',
      plastic_type: product.plastic_type || '',
      color: product.color || '',
      weight: product.weight || '',
      safety_info: product.safety_info || '',
      is_trending: product.is_trending || false,
      sizes: parsedSizes
    });
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ 
      name: '', description: '', price: '', discount: 0, status: 'in_stock', 
      model_3d: '', image_url: '', image_urls: [], category: '',
      plastic_type: '', color: '', weight: '', safety_info: '',
      is_trending: false, sizes: []
    });
  }

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  async function handleDelete(id) {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
      setDeleteConfirm({ open: false, id: null });
    } else {
      alert('Помилка при видаленні: ' + error.message);
    }
  }

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="dusk-admin-scope dusk-theme dusk-atmosphere" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{scrollbarHide}</style>
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="dusk-glass"
          style={{ 
            padding: 36, width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative', zIndex: 2
          }}
        >
          <div style={{ width: 48, height: 48, background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', color: 'var(--color-accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={24} />
          </div>
          <h1 className="dusk-heading" style={{ fontSize: 22, marginBottom: 6 }}>ANDE_3D</h1>
          <p className="dusk-subheading" style={{ marginBottom: 24 }}>Бізнес дошка • Введіть пароль доступу або увійдіть у локальному режимі</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.div animate={authError ? { x: [-8, 8, -8, 8, 0] } : {}}>
              <input 
                type="password" 
                placeholder="Пароль адміністратора..."
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                autoFocus
                className="dusk-input"
                style={{ 
                  height: 44, textAlign: 'center', fontSize: 15,
                  borderColor: authError ? 'var(--color-danger)' : undefined
                }}
              />
            </motion.div>
            <button 
              type="submit"
              className="dusk-btn dusk-btn--primary"
              style={{ height: 44, justifyContent: 'center', fontSize: 13.5, width: '100%' }}
            >
              Увійти в кабінет
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--color-rule)', fontSize: 11, color: 'var(--color-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <span className="dusk-dot dusk-dot--periwinkle" />
            <span>ANDE_3D • Бізнес дошка</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Live sidebar counters
  const activeOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const readyToShipCount = orders.filter(o => o.status === 'shipping').length;
  const inProductionCount = orders.filter(o => ['new', 'printing', 'painting'].includes(o.status)).length;
  const todayKeyStr = getTodayKey();
  const urgentCalendarCount = orders.filter(o => {
    if (!o || o.status === 'cancelled' || DONE_OR_SHIPPED_STATUSES.includes(o.status)) return false;
    const due = o.shipping_details?.due_date;
    return !!due && due <= todayKeyStr;
  }).length;

  const TAB_TITLES = {
    sales_cabinet: { title: 'Продажі та замовлення', group: 'Продажі й аналітика' },
    calendar: { title: 'Календар замовлень', group: 'Виробництво й логістика' },
    sales_stats: { title: 'Фінансова статистика', group: 'Продажі й аналітика' },
    marketing: { title: 'Кабінет реклами', group: 'Продажі й аналітика' },
    products: { title: 'Каталог товарів', group: 'Каталог і склад' },
    dropshipping: { title: 'Дропшипінг', group: 'Каталог і склад' },
    inventory: { title: 'Склад та витратники', group: 'Каталог і склад' },
    calculator: { title: 'Калькулятор собівартості', group: 'Каталог і склад' },
    production: { title: 'Черга виготовлення', group: 'Виробництво й логістика' },
    lamp_studio: { title: 'Студія виробництва', group: 'Виробництво й логістика' },
    shipping_list: { title: 'Кабінет відправок', group: 'Виробництво й логістика' },
    farm: { title: '3D-ферма принтерів', group: 'Виробництво й логістика' },
    links_editor: { title: 'Мультипосилання', group: 'Маркетинг і клієнти' },
    users: { title: 'Клієнти та бонуси', group: 'Маркетинг і клієнти' },
    reviews: { title: 'Відгуки клієнтів', group: 'Маркетинг і клієнти' },
    broadcast: { title: 'Telegram-розсилка', group: 'Маркетинг і клієнти' },
    settings: { title: 'Налаштування магазину', group: 'Система' },
    sales: { title: 'Архів замовлень', group: 'Продажі й аналітика' }
  };

  const currentTabMeta = TAB_TITLES[activeTab] || { title: 'Панель керування', group: 'Адмін-панель' };

  return (
    <div
      className={`admin-layout dusk-admin-scope ${isDarkMode ? 'dusk-theme' : 'dusk-light-theme light-theme'}`}
      style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: 'var(--color-paper)', color: 'var(--color-ink)', overflow: 'hidden' }}
    >
      <style>{scrollbarHide}</style>
      
      {/* Mobile Header */}
      <header className="admin-mobile-header" style={{ height: 56, flexShrink: 0, background: 'var(--color-paper-2)', borderBottom: '1px solid var(--color-rule)', display: isMobile ? 'flex' : 'none', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', zIndex: 100 }}>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dusk-dot dusk-dot--periwinkle" />
          <span className="dusk-heading" style={{ fontSize: 15 }}>{currentTabMeta.title}</span>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsSidebarOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8, 10, 18, 0.72)', zIndex: 1000 }}
        />
      )}

      {/* Dusk Sidebar */}
      <aside className={`admin-aside ${isSidebarOpen ? 'open' : ''}`} style={{ 
        width: 256, minWidth: 256, flexShrink: 0, background: 'var(--color-paper-2)', 
        borderRight: '1px solid var(--color-rule)', 
        display: 'flex', flexDirection: 'column', zIndex: 1001,
        position: isMobile ? 'fixed' : 'relative',
        top: 0, bottom: 0, left: 0,
        transform: isMobile ? (isSidebarOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)') : 'none'
      }}>
        {/* Brand Header */}
        <div style={{ padding: '20px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={16} />
            </div>
            <div>
              <div className="dusk-heading" style={{ fontSize: 15, lineHeight: 1.15 }}>ANDE_3D</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>Бізнес дошка</div>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Menu Filter Input */}
        <div style={{ padding: '12px 14px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input 
              type="text" 
              placeholder="Швидкий перехід..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="dusk-input"
              style={{ height: 32, paddingLeft: 30, fontSize: 12, borderRadius: 8, background: 'var(--color-paper)' }}
            />
            {menuSearch && (
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="hide-scrollbar" style={{ flex: 1, padding: '6px 12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {[
            {
              id: 'analytics',
              title: 'Продажі й аналітика',
              items: [
                { id: 'sales_cabinet', label: 'Продажі', icon: <Coins size={15} />, count: activeOrdersCount || null, signal: 'periwinkle' },
                { id: 'sales_stats', label: 'Фінансова аналітика', icon: <BarChart3 size={15} /> },
                { id: 'marketing', label: 'Кабінет реклами', icon: <Megaphone size={15} /> },
              ]
            },
            {
              id: 'production_group',
              title: 'Виробництво й логістика',
              items: [
                { id: 'calendar', label: 'Календар замовлень', icon: <Calendar size={15} />, count: urgentCalendarCount || null, signal: 'apricot' },
                { id: 'production', label: 'Черга виготовлення', icon: <Hammer size={15} />, count: inProductionCount || null, signal: 'apricot' },
                { id: 'shipping_list', label: 'Відправки та ТТН', icon: <Truck size={15} />, count: readyToShipCount || null, signal: 'apricot' },
                { id: 'lamp_studio', label: 'Студія виробництва', icon: <Lightbulb size={15} /> },
                { id: 'farm', label: '3D-ферма принтерів', icon: <Printer size={15} />, count: printers.length || null },
              ]
            },
            {
              id: 'catalog',
              title: 'Каталог і склад',
              items: [
                { id: 'products', label: 'Товари каталогу', icon: <Package size={15} />, count: products.length || null },
                { id: 'banners', label: 'Банери і колекції', icon: <ImageIcon size={15} /> },
                { id: 'inventory', label: 'Склад (Облік)', icon: <Box size={15} /> },
                { id: 'calculator', label: 'Калькулятор друку', icon: <Calculator size={15} /> },
                { id: 'dropshipping', label: 'Дропшипінг', icon: <ShoppingBag size={15} /> },
              ]
            },
            {
              id: 'marketing_clients',
              title: 'Маркетинг і клієнти',
              items: [
                { id: 'users', label: 'Клієнти та бонуси', icon: <User size={15} />, count: users.length || null },
                { id: 'reviews', label: 'Відгуки', icon: <MessageSquare size={15} />, count: reviews.length || null },
                { id: 'broadcast', label: 'Telegram-розсилка', icon: <Send size={15} /> },
                { id: 'links_editor', label: 'Мультипосилання', icon: <Globe size={15} /> },
              ]
            },
            {
              id: 'system',
              title: 'Система',
              items: [
                { id: 'settings', label: 'Налаштування', icon: <Settings size={15} /> },
              ]
            }
          ].map(group => {
            const filteredItems = group.items.filter(item => 
              item.label.toLowerCase().includes(menuSearch.toLowerCase())
            );

            if (menuSearch && filteredItems.length === 0) return null;
            const isOpen = menuSearch ? true : openGroups[group.id] !== false;

            return (
              <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenGroups(prev => ({
                      ...prev,
                      [group.id]: prev[group.id] === false ? true : false
                    }));
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', background: 'transparent', border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: 11, fontWeight: 600,
                    padding: '6px 8px 4px', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <span>{group.title}</span>
                  {!menuSearch && (
                    <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.18 }}>
                      <ChevronDown size={13} />
                    </motion.span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}
                    >
                      {filteredItems.map(item => {
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '7px 10px', borderRadius: 8,
                              background: active ? 'var(--color-accent-soft)' : 'transparent',
                              border: active ? '1px solid var(--color-accent-border)' : '1px solid transparent',
                              color: active ? 'var(--color-ink)' : 'var(--color-ink-2)',
                              fontSize: 12.5, fontWeight: active ? 600 : 500,
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>

                            {item.count !== undefined && item.count !== null && (
                              <span className="dusk-num" style={{
                                fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
                                background: active
                                  ? 'var(--color-accent)'
                                  : item.signal === 'apricot'
                                    ? 'var(--color-accent-2-soft)'
                                    : 'var(--color-paper-3)',
                                color: active
                                  ? 'var(--color-accent-ink)'
                                  : item.signal === 'apricot'
                                    ? 'var(--color-accent-2)'
                                    : 'var(--color-muted)'
                              }}>
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme & Logout */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-rule)', display: 'flex', gap: 8 }}>
          <button 
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
            style={{ flex: 1, justifyContent: 'center', height: 34 }}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDarkMode ? 'Світла (Bone)' : 'Сутінки (Dusk)'}</span>
          </button>
          <button 
            type="button"
            onClick={handleLogout}
            className="dusk-btn dusk-btn--danger dusk-btn--sm"
            style={{ height: 34, padding: '0 10px' }}
            title="Вийти з облікового запису"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 990,
          background: 'var(--color-paper-2)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--color-rule)',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          padding: '6px 6px calc(6px + env(safe-area-inset-bottom, 0px))'
        }}>
          <button
            onClick={() => { setActiveTab('sales_cabinet'); setIsSidebarOpen(false); }}
            style={{
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
              color: activeTab === 'sales_cabinet' ? 'var(--color-accent)' : 'var(--color-muted)'
            }}
          >
            <Coins size={18} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>Продажі</span>
          </button>

          <button
            onClick={() => { setActiveTab('production'); setIsSidebarOpen(false); }}
            style={{
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
              color: activeTab === 'production' ? 'var(--color-accent)' : 'var(--color-muted)', position: 'relative'
            }}
          >
            <Hammer size={18} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>Друк</span>
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveTab('sales_cabinet');
                setIsSidebarOpen(false);
                setTriggerAddSale(true);
              }}
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: 'var(--color-accent)',
                border: '1px solid var(--color-accent-border)', color: 'var(--color-accent-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transform: 'translateY(-4px)'
              }}
              title="Додати продаж"
            >
              <Plus size={20} />
            </button>
          </div>

          <button
            onClick={() => { setActiveTab('shipping_list'); setIsSidebarOpen(false); }}
            style={{
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
              color: activeTab === 'shipping_list' ? 'var(--color-accent)' : 'var(--color-muted)', position: 'relative'
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Truck size={18} />
              {readyToShipCount > 0 && (
                <span className="dusk-num" style={{
                  position: 'absolute', top: -5, right: -10, background: 'var(--color-accent-2)', color: 'var(--color-accent-2-ink)',
                  fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 5px', minWidth: 15, textAlign: 'center'
                }}>
                  {readyToShipCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600 }}>Відправки</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            style={{
              background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
              color: isSidebarOpen ? 'var(--color-ink)' : 'var(--color-muted)'
            }}
          >
            <Menu size={18} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>Меню</span>
          </button>
        </nav>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--color-paper)' }}>
        
        {/* Unified Dusk Top Utility Bar (Desktop) */}
        <header className="admin-main-header" style={{ height: 52, flexShrink: 0, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--color-paper)', borderBottom: '1px solid var(--color-rule)', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ color: 'var(--color-muted)' }}>{currentTabMeta.group}</span>
            <span style={{ color: 'var(--color-muted)', opacity: 0.5 }}>/</span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{currentTabMeta.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quick Workflow Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setActiveTab('sales_cabinet')}
                className={`dusk-facet-pill ${activeTab === 'sales_cabinet' ? 'active' : ''}`}
              >
                <span className="dusk-dot dusk-dot--periwinkle" style={{ width: 6, height: 6 }} />
                <span>Продажі</span>
                <span className="dusk-num" style={{ opacity: 0.75 }}>{activeOrdersCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('production')}
                className={`dusk-facet-pill ${activeTab === 'production' ? 'active-apricot' : ''}`}
              >
                <span className="dusk-dot dusk-dot--apricot" style={{ width: 6, height: 6 }} />
                <span>У друці</span>
                <span className="dusk-num" style={{ opacity: 0.75 }}>{inProductionCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('shipping_list')}
                className={`dusk-facet-pill ${activeTab === 'shipping_list' ? 'active-apricot' : ''}`}
              >
                <span className="dusk-dot dusk-dot--apricot" style={{ width: 6, height: 6 }} />
                <span>До відправки</span>
                <span className="dusk-num" style={{ opacity: 0.75 }}>{readyToShipCount}</span>
              </button>
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--color-rule)' }} />

            <button
              type="button"
              onClick={() => {
                setActiveTab('sales_cabinet');
                setTriggerAddSale(true);
              }}
              className="dusk-btn dusk-btn--primary dusk-btn--sm"
            >
              <Plus size={14} /> Новий продаж
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 12px 92px 12px' : '20px 24px' }}>
          {!supabase && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248, 113, 113, 0.10)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: 10, color: 'var(--color-danger)', fontSize: 12.5, fontWeight: 500 }}>
              З'єднання з Supabase не встановлено. Перевірте налаштування в .env.local
            </div>
          )}

          {activeTab === 'products' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Dusk Catalog Filter & Command Bar */}
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
                  <div>
                    <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>Каталог товарів</h1>
                    <p className="dusk-subheading" style={{ marginTop: 2 }}>Управління цінами, знижками, категоріями та 3D-моделями магазину</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 240 }}>
                      <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                      <input
                        type="text"
                        placeholder="Пошук за назвою або категорією..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dusk-input"
                        style={{ paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, height: 34, fontSize: 12.5, borderRadius: 999 }}
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

                    <select
                      value={productSort}
                      onChange={(e) => setProductSort(e.target.value)}
                      className="dusk-select"
                      style={{ width: 'auto', height: 34, fontSize: 12, borderRadius: 999, padding: '0 14px' }}
                    >
                      <option value="newest">Спочатку нові</option>
                      <option value="price_asc">Дешевші спочатку</option>
                      <option value="price_desc">Дорожчі спочатку</option>
                      <option value="name">За алфавітом (А–Я)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowBulkPriceModal(true)}
                      className="dusk-btn dusk-btn--ghost"
                      style={{ height: 34 }}
                    >
                      <Tag size={14} style={{ color: 'var(--color-accent)' }} /> Масові ціни
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStudioModal(true)}
                      className="dusk-btn dusk-btn--ghost"
                      style={{ height: 34 }}
                    >
                      <Wand2 size={14} style={{ color: 'var(--color-accent-2)' }} /> ШІ-студія
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkImport(true)}
                      className="dusk-btn dusk-btn--ghost"
                      style={{ height: 34 }}
                    >
                      <Sparkles size={14} style={{ color: 'var(--color-accent)' }} /> Масовий імпорт
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="dusk-btn dusk-btn--primary"
                      style={{ height: 34 }}
                    >
                      <Plus size={15} /> Додати товар
                    </button>
                  </div>
                </div>

                {/* Dusk Ruled Tally — Catalog Summary */}
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
                  <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
                    <span className="dusk-tally__label">Усього в каталозі</span>
                    <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22 }}>
                      {products.length} <span className="dusk-currency">мод.</span>
                    </div>
                    <span className="dusk-tally__sub">Показано: {filteredProducts.length}</span>
                  </div>

                  <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
                    <span className="dusk-tally__label">Категорій</span>
                    <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22 }}>
                      {dbCategories.length}
                    </div>
                    <span className="dusk-tally__sub">Активна: {activeCategory}</span>
                  </div>

                  <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
                    <span className="dusk-tally__label">Зі знижкою</span>
                    <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-accent-2)' }}>
                      {products.filter(p => parseFloat(p.discount || 0) > 0).length}
                    </div>
                    <span className="dusk-tally__sub">Акційні пропозиції</span>
                  </div>

                  <div className="dusk-tally__cell" style={{ padding: '12px 16px' }}>
                    <span className="dusk-tally__label">Трендові / Хіти</span>
                    <div className="dusk-tally__value" style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-accent)' }}>
                      {products.filter(p => p.is_trending).length}
                    </div>
                    <span className="dusk-tally__sub">Відображаються з позначкою хіта</span>
                  </div>
                </div>

                {/* Category Pipeline Strip */}
                <div className="dusk-pipeline hide-scrollbar">
                  {categories.map(cat => {
                    const count = cat === 'Всі' ? products.length : products.filter(p => p.category === cat).length;
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`dusk-pipeline__step ${active ? 'active' : ''}`}
                      >
                        {active && <span className="dusk-dot dusk-dot--periwinkle" />}
                        <span>{cat}</span>
                        <span className="dusk-pipeline__count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Stock / Attribute Facet Pills + View Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, marginRight: 2 }}>Фільтр:</span>
                    {[
                      { id: 'all', label: 'Усі позиції' },
                      { id: 'in_stock', label: 'В наявності' },
                      { id: 'discount', label: 'Зі знижкою', apricot: true },
                      { id: 'trending', label: 'Трендові хіти', apricot: true },
                      { id: '3d', label: 'З 3D-моделлю (.glb)' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setProductStockFilter(f.id)}
                        className={`dusk-facet-pill ${productStockFilter === f.id ? (f.apricot ? 'active-apricot' : 'active') : ''}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="dusk-segmented">
                    <button
                      type="button"
                      onClick={() => setProductViewMode('grid')}
                      className={`dusk-segmented__item ${productViewMode === 'grid' ? 'active' : ''}`}
                    >
                      Картки
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductViewMode('list')}
                      className={`dusk-segmented__item ${productViewMode === 'list' ? 'active' : ''}`}
                    >
                      Список
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Cards Grid or Compact List */}
              {filteredProducts.length === 0 ? (
                <div className="dusk-panel" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                  Товарів за вибраними фільтрами не знайдено.
                </div>
              ) : productViewMode === 'grid' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 14
                }}>
                  {filteredProducts.map((p) => {
                    const final = (p.price * (1 - (p.discount || 0) / 100)).toFixed(0);
                    const galleryCount = [p.image_url, ...(Array.isArray(p.image_urls) ? p.image_urls : [])].filter(Boolean).length;
                    return (
                      <div
                        key={p.id}
                        className="dusk-panel"
                        style={{
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid var(--color-rule)',
                          transition: 'border-color 0.16s ease, transform 0.16s ease'
                        }}
                      >
                        {/* Card Media Header */}
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: 176,
                          background: 'var(--color-paper)',
                          borderBottom: '1px solid var(--color-rule)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : p.model_3d ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--color-accent)' }}>
                              <Box size={32} />
                              <span style={{ fontSize: 11, fontWeight: 500 }}>3D Модель (.GLB)</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--color-muted)', opacity: 0.6 }}>
                              <ImageIcon size={28} />
                              <span style={{ fontSize: 11 }}>Без фото</span>
                            </div>
                          )}

                          {/* Top-left Badges */}
                          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {p.is_trending && (
                              <span className="dusk-badge dusk-badge--apricot" style={{ background: 'oklch(18% 0.02 268 / 0.88)', backdropFilter: 'blur(6px)' }}>
                                <Star size={10} fill="currentColor" /> Хіт
                              </span>
                            )}
                            {p.discount > 0 && (
                              <span className="dusk-badge dusk-badge--apricot dusk-num" style={{ background: 'oklch(18% 0.02 268 / 0.88)', backdropFilter: 'blur(6px)' }}>
                                -{p.discount}%
                              </span>
                            )}
                          </div>

                          {/* Top-right Photo Count */}
                          {galleryCount > 1 && (
                            <span className="dusk-badge dusk-badge--neutral dusk-num" style={{ position: 'absolute', top: 10, right: 10, background: 'oklch(16% 0.015 268 / 0.82)', backdropFilter: 'blur(6px)', fontSize: 11, padding: '3px 8px' }}>
                              {galleryCount} фото
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                              <span className="dusk-badge dusk-badge--neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                                {p.category || 'Без категорії'}
                              </span>
                              {p.plastic_type && (
                                <span className="dusk-badge dusk-badge--periwinkle" style={{ fontSize: 11, padding: '2px 8px' }}>
                                  {p.plastic_type}
                                </span>
                              )}
                              {p.weight && (
                                <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{p.weight}</span>
                              )}
                            </div>
                          </div>

                          {/* Price + Actions Footer */}
                          <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div className="dusk-num">
                              {p.discount > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--color-muted)', textDecoration: 'line-through', lineHeight: 1 }}>
                                  {p.price} ₴
                                </div>
                              )}
                              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)' }}>
                                {final} <span className="dusk-currency" style={{ fontSize: 13 }}>₴</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                              >
                                <Edit3 size={13} />
                                <span>Редагувати</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, id: p.id })}
                                className="dusk-btn dusk-btn--danger dusk-btn--sm"
                                style={{ padding: '0 9px' }}
                                title="Видалити товар"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dusk-panel" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredProducts.map((p, idx) => {
                      const final = (p.price * (1 - (p.discount || 0) / 100)).toFixed(0);
                      return (
                        <div
                          key={p.id}
                          style={{
                            padding: '12px 18px',
                            borderBottom: idx < filteredProducts.length - 1 ? '1px solid var(--color-rule)' : 'none',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            justifyContent: 'space-between',
                            gap: 14,
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 52, height: 52, background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.model_3d ? <Box size={22} style={{ color: 'var(--color-accent)' }} /> : <ImageIcon size={22} style={{ color: 'var(--color-muted)' }} />}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{p.name}</span>
                                {p.is_trending && (
                                  <span className="dusk-badge dusk-badge--apricot" style={{ fontSize: 11, padding: '2px 8px' }}>Хіт</span>
                                )}
                                {p.discount > 0 && (
                                  <span className="dusk-badge dusk-badge--apricot dusk-num" style={{ fontSize: 11, padding: '2px 8px' }}>-{p.discount}%</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>
                                <span>{p.category || 'Без категорії'}</span>
                                {p.plastic_type && <span>• {p.plastic_type}</span>}
                                {p.weight && <span>• {p.weight}</span>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                            <div className="dusk-num" style={{ textAlign: 'right' }}>
                              {p.discount > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--color-muted)', textDecoration: 'line-through' }}>{p.price} ₴</div>
                              )}
                              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
                                {final} <span className="dusk-currency">₴</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                              >
                                <Edit3 size={13} />
                                <span>Редагувати</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, id: p.id })}
                                className="dusk-btn dusk-btn--danger dusk-btn--sm"
                                style={{ padding: '0 9px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'sales' ? (
            <SalesDashboard showToast={showToast} externalOpenAdd={triggerAddSale} onClearExternalOpenAdd={() => setTriggerAddSale(false)} externalEditOrder={externalEditOrder} onClearExternalEditOrder={() => setExternalEditOrder(null)} onOrdersChanged={() => fetchOrders()} />
          ) : activeTab === 'users' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
                <div>
                  <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>Клієнти та бонусний баланс ({users.length})</h1>
                  <p className="dusk-subheading" style={{ marginTop: 2 }}>Пошук покупців, історія Telegram-профілів, нарахування бонусів та особисті повідомлення</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', minWidth: isMobile ? '100%' : 240 }}>
                    <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input
                      type="text"
                      placeholder="Ім'я, телефон, @username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dusk-input"
                      style={{ paddingLeft: 32, height: 34, fontSize: 12.5, borderRadius: 999 }}
                    />
                  </div>
                  <button 
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    style={{ height: 34 }}
                  >
                    {refreshing ? 'Оновлено' : 'Оновити'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {users
                  .filter(user => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (user.first_name || '').toLowerCase().includes(q) ||
                      (user.last_name || '').toLowerCase().includes(q) ||
                      (user.phone || '').includes(q) ||
                      (user.tg_id || '').includes(q) ||
                      (user.username || '').toLowerCase().includes(q)
                    );
                  })
                  .map((user, i) => (
                  <div key={i} className="dusk-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{user.first_name} {user.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{user.username ? `@${user.username}` : 'Без юзернейму'}</div>
                      </div>
                      <span className="dusk-badge dusk-badge--periwinkle dusk-num" style={{ fontSize: 12 }}>
                        {user.bonuses || 0} ₴
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, background: 'var(--color-paper)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-rule)' }}>
                      <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Telegram ID</div>
                        <div className="dusk-mono" style={{ color: 'var(--color-ink)', fontWeight: 500, marginTop: 1 }}>{user.tg_id || '—'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Телефон</div>
                        <div className="dusk-mono" style={{ color: 'var(--color-ink)', fontWeight: 500, marginTop: 1 }}>{user.phone || '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openBonusModal(user)} className="dusk-btn dusk-btn--ghost dusk-btn--sm" style={{ flex: 1, justifyContent: 'center' }}>Бонуси</button>
                      <button onClick={() => setIndividualMessageModal({ open: true, user, message: '', imageUrl: '', isSending: false })} className="dusk-btn dusk-btn--primary dusk-btn--sm" style={{ flex: 1, justifyContent: 'center' }}>Повідомлення</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'farm' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>
                    3D-друкарська ферма ({printers.length})
                  </h1>
                  <p className="dusk-subheading" style={{ marginTop: 2 }}>Моніторинг принтерів Bambu Lab, енергоспоживання, амортизації та активних завдань</p>
                </div>
                <button 
                  onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
                  className="dusk-btn dusk-btn--primary"
                >
                  <Plus size={15} /> Додати принтер
                </button>
              </div>

              {showAddPrinterForm && (
                <div className="dusk-panel" style={{ padding: 20 }}>
                  <h3 className="dusk-heading" style={{ fontSize: 15, marginBottom: 12 }}>Нове обладнання</h3>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>Шаблони Bambu Lab (клікніть для автозаповнення):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[
                        { name: 'Bambu Lab X1C', wattage: 350, wear: 10 },
                        { name: 'Bambu Lab X1E', wattage: 350, wear: 12 },
                        { name: 'Bambu Lab P1S', wattage: 350, wear: 8 },
                        { name: 'Bambu Lab P1P', wattage: 350, wear: 7 },
                        { name: 'Bambu Lab A1', wattage: 200, wear: 6 },
                        { name: 'Bambu Lab A1 Mini', wattage: 150, wear: 5 }
                      ].map(tpl => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => {
                            const nameEl = document.getElementById('new-printer-name');
                            const wattageEl = document.getElementById('new-printer-wattage');
                            const wearEl = document.getElementById('new-printer-wear');
                            const ipEl = document.getElementById('new-printer-ip');
                            const codeEl = document.getElementById('new-printer-code');
                            const snEl = document.getElementById('new-printer-sn');
                            if (nameEl) nameEl.value = tpl.name;
                            if (wattageEl) wattageEl.value = tpl.wattage;
                            if (wearEl) wearEl.value = tpl.wear;
                            if (ipEl) ipEl.value = '';
                            if (codeEl) codeEl.value = '';
                            if (snEl) snEl.value = '';
                          }}
                          className="dusk-facet-pill"
                        >
                          {tpl.name.replace('Bambu Lab ', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2, minWidth: 160 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Назва принтера</label>
                        <input type="text" id="new-printer-name" placeholder="Напр. Bambu Lab X1C" className="dusk-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Потужність (Вт)</label>
                        <input type="number" id="new-printer-wattage" placeholder="350" className="dusk-input dusk-num" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Знос (₴/год)</label>
                        <input type="number" id="new-printer-wear" placeholder="10" className="dusk-input dusk-num" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>IP-адреса принтера</label>
                        <input type="text" id="new-printer-ip" placeholder="192.168.1.100" className="dusk-input dusk-mono" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Access Code</label>
                        <input type="text" id="new-printer-code" placeholder="8-значний код" className="dusk-input dusk-mono" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Серійний номер (SN)</label>
                        <input type="text" id="new-printer-sn" placeholder="01P00A12345678" className="dusk-input dusk-mono" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button 
                        onClick={() => {
                          const name = document.getElementById('new-printer-name').value;
                          const wattage = document.getElementById('new-printer-wattage').value;
                          const wear = document.getElementById('new-printer-wear').value;
                          const ip = document.getElementById('new-printer-ip').value;
                          const code = document.getElementById('new-printer-code').value;
                          const sn = document.getElementById('new-printer-sn').value;
                          if (!name) {
                            showToast('Введіть назву принтера', 'error');
                            return;
                          }
                          handleAddPrinter(name, wattage, wear, ip, code, sn);
                          setShowAddPrinterForm(false);
                        }}
                        className="dusk-btn dusk-btn--primary"
                      >
                        Зберегти
                      </button>
                      <button onClick={() => setShowAddPrinterForm(false)} className="dusk-btn dusk-btn--ghost">
                        Скасувати
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {printerLoads.map(load => {
                  const status = load.status;
                  return (
                    <div 
                      key={load.printer.id} 
                      className="dusk-panel"
                      style={{ 
                        padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
                        opacity: status === 'repair' ? 0.65 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Printer size={16} style={{ color: status === 'printing' ? 'var(--color-accent-2)' : status === 'repair' ? 'var(--color-danger)' : 'var(--color-accent)' }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{load.printer.name}</span>
                          </div>
                          <div className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
                            {load.printer.wattage} Вт • {load.printer.wear} ₴/год
                          </div>
                        </div>

                        <span className={`dusk-badge ${status === 'printing' ? 'dusk-badge--apricot' : status === 'repair' ? 'dusk-badge--danger' : 'dusk-badge--periwinkle'}`}>
                          <span className={`dusk-dot ${status === 'printing' ? 'dusk-dot--apricot' : status === 'repair' ? 'dusk-dot--muted' : 'dusk-dot--periwinkle'}`} style={{ width: 5, height: 5 }} />
                          {status === 'printing' ? 'У друці' : status === 'repair' ? 'Ремонт' : 'Вільний'}
                        </span>
                      </div>

                      {status === 'printing' && load.order ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--color-paper)', padding: 12, borderRadius: 10, border: '1px solid var(--color-rule)' }}>
                          <div>
                            <div className="dusk-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                              Замовлення {load.order.order_number || `#${load.order.id.slice(0, 8)}`}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                              Клієнт: {load.order.shipping_details?.firstName} {load.order.shipping_details?.lastName}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ position: 'relative', width: '100%', height: 5, background: 'var(--color-paper-3)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${load.percentElapsed}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 3 }} />
                            </div>
                            <div className="dusk-num" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--color-muted)' }}>
                              <span>{load.percentElapsed}% виконано</span>
                              <span>
                                {load.remainingMinutes > 60 
                                  ? `Залишилось: ${(load.remainingMinutes / 60).toFixed(1)} год` 
                                  : `Залишилось: ${load.remainingMinutes} хв`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              updateOrderStatus(load.order.id, 'shipping');
                              assignPrinter(load.order.id, null);
                            }}
                            className="dusk-btn dusk-btn--primary dusk-btn--sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Завершити друк
                          </button>
                        </div>
                      ) : status === 'repair' ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 64, background: 'var(--color-paper)', border: '1px dashed var(--color-rule)', borderRadius: 10, fontSize: 11.5, color: 'var(--color-danger)' }}>
                          Обладнання на обслуговуванні
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minHeight: 64 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', textAlign: 'center' }}>Немає активних завдань</div>
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-rule)', display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => togglePrinterRepair(load.printer.id)}
                          className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          {status === 'repair' ? 'Повернути в роботу' : 'На ремонт'}
                        </button>
                        <button 
                          onClick={() => {
                            setModal({
                              open: true,
                              title: 'Видалити принтер?',
                              message: `Ви впевнені, що хочете видалити принтер ${load.printer.name}?`,
                              type: 'danger',
                              onConfirm: () => {
                                handleDeletePrinter(load.printer.id);
                                setModal({ open: false });
                              }
                            });
                          }}
                          className="dusk-btn dusk-btn--danger dusk-btn--sm"
                          style={{ padding: '0 10px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'shipping_list' ? (
            <ShippingCabinet orders={orders} setOrders={setOrders} supabase={supabase} showToast={showToast} isMobile={isMobile} />
          ) : activeTab === 'calendar' ? (
            <OrderCalendar
              orders={orders}
              setOrders={setOrders}
              supabase={supabase}
              showToast={showToast}
              isMobile={isMobile}
              onEditOrder={(ord) => {
                setExternalEditOrder(ord);
                setActiveTab('sales_cabinet');
              }}
              onCreateOrderWithDate={(dateKey) => {
                setTriggerAddDueDate(dateKey);
                setTriggerAddSale(true);
                setActiveTab('sales_cabinet');
              }}
            />
          ) : activeTab === 'production' ? (
            <ProductionCabinet
              orders={orders}
              setOrders={setOrders}
              supabase={supabase}
              showToast={showToast}
              isMobile={isMobile}
              onOpenOrderInSales={(ord) => {
                setExternalEditOrder(ord);
                setActiveTab('sales_cabinet');
              }}
            />
          ) : activeTab === 'sales_cabinet' ? (
            <SalesDashboard
              supabase={supabase}
              showToast={showToast}
              isMobile={isMobile}
              externalOpenAdd={triggerAddSale}
              onClearExternalOpenAdd={() => setTriggerAddSale(false)}
              externalAddDueDate={triggerAddDueDate}
              onClearExternalAddDueDate={() => setTriggerAddDueDate('')}
              externalEditOrder={externalEditOrder}
              onClearExternalEditOrder={() => setExternalEditOrder(null)}
              onOrdersChanged={() => fetchOrders()}
            />
          ) : activeTab === 'sales_stats' ? (
            <SalesStatsDashboard supabase={supabase} showToast={showToast} isMobile={isMobile} />
          ) : activeTab === 'inventory' ? (
            <InventoryDashboard showToast={showToast} isMobile={isMobile} />
          ) : activeTab === 'dropshipping' ? (
            <DropshippingAdmin showToast={showToast} storeProducts={products} />
          ) : activeTab === 'reviews' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>Відгуки клієнтів ({reviews.length})</h1>
                  <p className="dusk-subheading" style={{ marginTop: 2 }}>Модерація відгуків та офіційні відповіді від імені магазину</p>
                </div>
                <button 
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  {refreshing ? 'Оновлено' : 'Оновити'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map(review => (
                  <div key={review.id} className="dusk-panel" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{review.customers?.first_name} {review.customers?.last_name}</div>
                          <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= review.rating ? "var(--color-accent-2)" : "transparent"} color={s <= review.rating ? "var(--color-accent-2)" : "var(--color-muted)"} />)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{new Date(review.created_at).toLocaleDateString('uk-UA')}</span>
                        <button onClick={() => handleDeleteReview(review.id)} className="dusk-btn dusk-btn--danger dusk-btn--sm" style={{ padding: 6 }}><Trash2 size={14}/></button>
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-paper)', padding: 14, borderRadius: 10, border: '1px solid var(--color-rule)', color: 'var(--color-ink)', fontSize: 13.5, lineHeight: 1.55, marginBottom: 12 }}>
                      {review.comment}
                    </div>

                    {review.admin_reply ? (
                      <div className="dusk-apricot-strip" style={{ borderLeftColor: 'var(--color-accent)', background: 'var(--color-accent-soft)', color: 'var(--color-ink)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>Ваша відповідь:</div>
                        <div style={{ fontSize: 13 }}>{review.admin_reply}</div>
                        <button 
                          onClick={() => setReplyData({ reviewId: review.id, text: review.admin_reply })}
                          style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                        >
                          Редагувати відповідь
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10 }}>
                        {replyData.reviewId === review.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <textarea 
                              value={replyData.text} onChange={e => setReplyData({...replyData, text: e.target.value})}
                              placeholder="Напишіть вашу відповідь..."
                              className="dusk-textarea"
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleSendReply(review.id)} className="dusk-btn dusk-btn--primary dusk-btn--sm">Відправити</button>
                              <button onClick={() => setReplyData({ reviewId: null, text: '' })} className="dusk-btn dusk-btn--ghost dusk-btn--sm">Скасувати</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReplyData({ reviewId: review.id, text: '' })}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                          >
                            <MessageSquare size={14} /> Відповісти
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'broadcast' ? (
            <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>Telegram-розсилка</h1>
                  <p className="dusk-subheading" style={{ marginTop: 2 }}>Миттєве оповіщення підписників бота про новинки та акції</p>
                </div>
                <button onClick={handleManualRefresh} disabled={refreshing} className="dusk-btn dusk-btn--ghost dusk-btn--sm">
                  {refreshing ? 'Оновлено' : 'Оновити'}
                </button>
              </div>
               
              <div className="dusk-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 4 }}>Підписані клієнти</div>
                  <div className="dusk-num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-accent)' }}>
                    {users.filter(u => u.allow_notifications).length} <span className="dusk-currency" style={{ fontSize: 14 }}>осіб</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 8 }}>Зображення розсилки</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {broadcastImageUrl ? (
                      <div style={{ position: 'relative', width: 96, height: 96, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-rule)' }}>
                        <img src={broadcastImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => setBroadcastImageUrl('')}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <label style={{ 
                        width: 96, height: 96, borderRadius: 12, border: '1px dashed var(--color-rule-strong)', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', gap: 6, color: 'var(--color-muted)'
                      }}>
                        <Upload size={20} />
                        <span style={{ fontSize: 10.5, fontWeight: 500 }}>Додати фото</span>
                        <input type="file" hidden accept="image/*" onChange={(e) => handleMessageImageUpload(e, 'broadcast')} disabled={isUploadingMedia} />
                      </label>
                    )}
                    {isUploadingMedia && <div style={{ fontSize: 12, color: 'var(--color-accent)' }}>Завантаження...</div>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 8 }}>Текст повідомлення</label>
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Напишіть повідомлення для ваших клієнтів..."
                    className="dusk-textarea"
                    style={{ minHeight: 160 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast || !broadcastMessage.trim()}
                    className="dusk-btn dusk-btn--primary"
                    style={{ flex: 1, height: 42, justifyContent: 'center' }}
                  >
                    {isSendingBroadcast ? 'Відправка...' : <><Send size={15}/> Відправити всім</>}
                  </button>
                  <button 
                    onClick={enableAllNotifications}
                    className="dusk-btn dusk-btn--ghost"
                    style={{ height: 42 }}
                  >
                    Увімкнути всім сповіщення
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'lamp_studio' ? (
            <div style={{ width: '100%' }}>
              <LampStudio />
            </div>
          ) : activeTab === 'calculator' ? (
            <div style={{ width: '100%' }}>
              <CalculatorComp isMobile={isMobile} />
            </div>
          ) : activeTab === 'marketing' ? (
            <div style={{ width: '100%' }}>
              <AdvertisingDashboard showToast={showToast} />
            </div>
          ) : activeTab === 'settings' ? (
            <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dusk-glass" style={{ padding: isMobile ? 14 : 20 }}>
                <h1 className="dusk-heading" style={{ fontSize: isMobile ? 20 : 22 }}>Налаштування магазину</h1>
                <p className="dusk-subheading" style={{ marginTop: 2 }}>Керування категоріями каталогу та системними параметрами</p>
              </div>

              <div className="dusk-panel" style={{ padding: 24 }}>
                <h2 className="dusk-heading" style={{ fontSize: 16, marginBottom: 16 }}>Категорії товарів</h2>
                
                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <input 
                    type="text" 
                    placeholder="Назва нової категорії (напр. Світильники)..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="dusk-input"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="submit" 
                    disabled={!newCategoryName.trim()}
                    className="dusk-btn dusk-btn--primary"
                  >
                    Додати категорію
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dbCategories.length === 0 ? (
                    <div style={{ color: 'var(--color-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                      Немає створених категорій.
                    </div>
                  ) : (
                    dbCategories.map(cat => {
                      const productCount = products.filter(p => p.category === cat.name).length;
                      return (
                        <div 
                          key={cat.id} 
                          style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '12px 16px', background: 'var(--color-paper)', 
                            border: '1px solid var(--color-rule)', borderRadius: 10
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{cat.name}</div>
                            <div className="dusk-num" style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
                              Товарів у категорії: <strong style={{ color: 'var(--color-accent)' }}>{productCount}</strong>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="dusk-btn dusk-btn--danger dusk-btn--sm"
                            style={{ padding: 8 }}
                            title="Видалити категорію"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'banners' ? (
            <BannersAdmin products={products} categories={categories} isMobile={isMobile} />
          ) : activeTab === 'links_editor' ? (
            <BioLinksEditor />
          ) : null}
        </div>
      </main>

      {/* Product Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
            <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'oklch(10% 0.014 268 / 0.80)', backdropFilter: 'blur(10px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16 }}
              className="dusk-panel"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 780,
                borderRadius: 18,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-rule)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.58)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 22px',
                borderBottom: '1px solid var(--color-rule)',
                background: 'var(--color-paper-2)',
                flexShrink: 0
              }}>
                <div>
                  <h2 className="dusk-heading" style={{ fontSize: 18, margin: 0 }}>
                    {editingId ? 'Редагувати товар каталогу' : 'Новий товар у каталог'}
                  </h2>
                  <p className="dusk-subheading" style={{ fontSize: 12, marginTop: 2 }}>
                    Заповніть параметри моделі, фотографії та ціноутворення
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="dusk-btn dusk-btn--ghost dusk-btn--sm" style={{ width: 32, height: 32, padding: 0 }}>
                  <X size={16} />
                </button>
              </div>
              
              {/* Modal Scrollable Form Body */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: isMobile ? 16 : 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  
                  {/* MakerWorld Quick Import Banner */}
                  {!editingId && (
                    <div style={{
                      background: 'var(--color-paper-2)',
                      padding: 14,
                      borderRadius: 12,
                      border: '1px solid var(--color-rule)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                        <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
                        <span>Швидкий автоімпорт з MakerWorld</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                        <input 
                          type="text" 
                          placeholder="Вставте посилання на модель MakerWorld (напр. https://makerworld.com/en/models/...)" 
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          className="dusk-input"
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button"
                          onClick={handleImportFromMakerWorld}
                          disabled={isImporting || !importUrl.trim()}
                          className="dusk-btn dusk-btn--ghost"
                        >
                          {isImporting ? <><Loader2 size={14} className="animate-spin" /> <span>Парсинг...</span></> : <span>Імпортувати</span>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2-Column Grid on Desktop */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr',
                    gap: 18,
                    alignItems: 'start'
                  }}>
                    {/* LEFT COLUMN: Name, Category, Pricing, Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-2)', display: 'block', marginBottom: 6 }}>
                          Назва товару *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Напр. Настільна лампа Хвиля..."
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="dusk-input"
                        />
                      </div>

                      {/* Pricing Card */}
                      <div style={{
                        padding: 14,
                        borderRadius: 12,
                        background: 'var(--color-paper-2)',
                        border: '1px solid var(--color-rule)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                              Базова ціна (₴) *
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="450"
                              value={formData.price}
                              onChange={e => setFormData({...formData, price: e.target.value})}
                              className="dusk-input dusk-num"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                              Знижка (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="95"
                              placeholder="0"
                              value={formData.discount}
                              onChange={e => setFormData({...formData, discount: e.target.value})}
                              className="dusk-input dusk-num"
                            />
                          </div>
                        </div>

                        {/* Quick Discount Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {[0, 10, 15, 20, 30].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setFormData({ ...formData, discount: pct })}
                                className={`dusk-facet-pill ${Number(formData.discount || 0) === pct ? 'active' : ''}`}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                {pct === 0 ? 'Без знижки' : `-${pct}%`}
                              </button>
                            ))}
                          </div>
                          <div className="dusk-num" style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
                            На сайті: <strong style={{ fontSize: 16, color: 'var(--color-accent)' }}>{finalPricePreview} ₴</strong>
                          </div>
                        </div>
                      </div>

                      {/* Size Variants */}
                      <div style={{ padding: 12, borderRadius: 12, background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (formData.sizes?.length > 0) ? 10 : 0 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                              Варіанти розмірів (опціонально)
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                              Наприклад: 15 см — 500 грн, 20 см — 700 грн
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, sizes: [...(prev.sizes || []), { label: '', price: prev.price || '' }] }))}
                            className="dusk-btn dusk-btn--ghost"
                            style={{ height: 30, fontSize: 11.5, padding: '0 10px' }}
                          >
                            <Plus size={13} /> Додати розмір
                          </button>
                        </div>

                        {formData.sizes?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {formData.sizes.map((sz, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={sz.label}
                                  onChange={e => {
                                    const next = [...formData.sizes];
                                    next[idx] = { ...next[idx], label: e.target.value };
                                    setFormData({ ...formData, sizes: next });
                                  }}
                                  placeholder="Напр. 15 см"
                                  className="dusk-input"
                                  style={{ flex: 1, height: 34, fontSize: 12.5 }}
                                />
                                <input
                                  type="number"
                                  value={sz.price}
                                  onChange={e => {
                                    const next = [...formData.sizes];
                                    next[idx] = { ...next[idx], price: e.target.value };
                                    setFormData({ ...formData, sizes: next });
                                  }}
                                  placeholder="Ціна (грн)"
                                  className="dusk-input dusk-num"
                                  style={{ width: 120, height: 34, fontSize: 12.5 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }))}
                                  className="dusk-btn dusk-btn--danger"
                                  style={{ width: 34, height: 34, padding: 0, justifyContent: 'center' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-2)', display: 'block', marginBottom: 6 }}>
                          Категорія *
                        </label>
                        {dbCategories.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                            {dbCategories.map(c => (
                              <button 
                                key={c.id} 
                                type="button" 
                                onClick={() => setFormData({...formData, category: c.name})}
                                className={`dusk-facet-pill ${formData.category === c.name ? 'active' : ''}`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                        <input
                          type="text"
                          required
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          placeholder="Оберіть вище або введіть нову категорію..."
                          className="dusk-input"
                        />
                      </div>

                      {/* Material & Weight */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                            Матеріал пластику
                          </label>
                          <input
                            type="text"
                            value={formData.plastic_type}
                            onChange={e => setFormData({...formData, plastic_type: e.target.value})}
                            placeholder="PLA / PETG"
                            className="dusk-input"
                          />
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                            {['PLA', 'PETG', 'PLA Silk', 'PLA Matte'].map(mat => (
                              <button
                                key={mat}
                                type="button"
                                onClick={() => setFormData({ ...formData, plastic_type: mat })}
                                className={`dusk-facet-pill ${formData.plastic_type === mat ? 'active' : ''}`}
                                style={{ padding: '2px 7px', fontSize: 10.5 }}
                              >
                                {mat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11.5, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>
                            Вага виробу
                          </label>
                          <input
                            type="text"
                            value={formData.weight}
                            onChange={e => setFormData({...formData, weight: e.target.value})}
                            placeholder="Напр. 150 г"
                            className="dusk-input"
                          />
                        </div>
                      </div>

                      {/* Trending Toggle */}
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '10px 14px',
                        background: formData.is_trending ? 'var(--color-accent-2-soft)' : 'var(--color-paper-2)',
                        borderRadius: 10,
                        border: formData.is_trending ? '1px solid var(--color-accent-2-border)' : '1px solid var(--color-rule)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Star size={15} fill={formData.is_trending ? 'var(--color-accent-2)' : 'transparent'} color={formData.is_trending ? 'var(--color-accent-2)' : 'var(--color-muted)'} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                            Трендовий товар (позначка «Хіт»)
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.is_trending}
                          onChange={(e) => setFormData({...formData, is_trending: e.target.checked})}
                          style={{ accentColor: 'var(--color-accent-2)', width: 16, height: 16 }}
                        />
                      </label>
                    </div>

                    {/* RIGHT COLUMN: Photo Gallery & Descriptions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Gallery Management */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        background: 'var(--color-paper-2)',
                        padding: 14,
                        borderRadius: 12,
                        border: '1px solid var(--color-rule)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', display: 'block' }}>
                              Галерея фотографій
                            </label>
                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                              Перше фото — головне на вітрині
                            </span>
                          </div>
                          <input type="file" id="gallery-file-upload" accept="image/*" hidden onChange={handleGalleryUpload} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {formData.image_url && (
                              <button
                                type="button"
                                onClick={handleSingleStudioPhoto}
                                disabled={isGeneratingStudio}
                                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                                title="Обробити перше фото в єдиному темному студійному стилі"
                              >
                                {isGeneratingStudio ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} style={{ color: 'var(--color-accent)' }} />}
                                <span>{isGeneratingStudio ? (studioStage || 'ШІ...') : 'ШІ-студія'}</span>
                              </button>
                            )}
                            <button 
                              type="button"
                              onClick={() => document.getElementById('gallery-file-upload').click()}
                              className="dusk-btn dusk-btn--primary dusk-btn--sm"
                            >
                              <Upload size={13} />
                              <span>{uploading ? 'Завантаження...' : 'Додати фото'}</span>
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const allPhotos = [formData.image_url, ...(Array.isArray(formData.image_urls) ? formData.image_urls : [])].filter(Boolean);
                          return allPhotos.length === 0 ? (
                            <div
                              onClick={() => document.getElementById('gallery-file-upload').click()}
                              style={{
                                border: '1px dashed oklch(38% 0.018 268)',
                                borderRadius: 10,
                                padding: '22px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                background: 'var(--color-paper)',
                                color: 'var(--color-muted)'
                              }}
                            >
                              <ImageIcon size={24} style={{ opacity: 0.7 }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-2)' }}>
                                Клікніть, щоб вибрати фото з пристрою
                              </span>
                              <span style={{ fontSize: 11 }}>PNG, JPG, WEBP</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {allPhotos.map((url, index) => {
                                const isMain = url === formData.image_url;
                                return (
                                  <div
                                    key={index}
                                    style={{
                                      position: 'relative',
                                      width: 82,
                                      height: 82,
                                      borderRadius: 10,
                                      border: isMain ? '2px solid var(--color-accent)' : '1px solid var(--color-rule)',
                                      overflow: 'hidden',
                                      background: 'var(--color-paper)'
                                    }}
                                  >
                                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const newMain = url;
                                        const newExtra = allPhotos.filter(u => u !== newMain);
                                        setFormData({...formData, image_url: newMain, image_urls: newExtra});
                                      }}
                                      style={{
                                        position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: '50%',
                                        background: isMain ? 'var(--color-accent)' : 'rgba(0,0,0,0.65)',
                                        border: 'none', color: isMain ? 'var(--color-accent-ink)' : '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                      }}
                                      title="Зробити головним фото"
                                    >
                                      <Award size={12} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (isMain) {
                                          const extra = formData.image_urls || [];
                                          setFormData({...formData, image_url: extra[0] || '', image_urls: extra.slice(1)});
                                        } else {
                                          setFormData({...formData, image_urls: (formData.image_urls || []).filter(u => u !== url)});
                                        }
                                      }}
                                      style={{
                                        position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.72)', border: 'none', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                      }}
                                      title="Видалити фото"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Direct Image URL Adder */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            placeholder="Або вставте пряме посилання на фото (URL)..."
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            className="dusk-input"
                            style={{ height: 32, fontSize: 12 }}
                          />
                          <button
                            type="button"
                            disabled={!newPhotoUrl.trim()}
                            onClick={() => {
                              const url = newPhotoUrl.trim();
                              if (!url) return;
                              if (!formData.image_url) {
                                setFormData({ ...formData, image_url: url });
                              } else {
                                setFormData({ ...formData, image_urls: [...(formData.image_urls || []), url] });
                              }
                              setNewPhotoUrl('');
                            }}
                            className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                            style={{ height: 32 }}
                          >
                            Додати URL
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const parts = (formData.description || '').split('|||ADMIN_NOTES|||');
                        const publicDesc = parts[0]?.trim() || '';
                        const adminNotes = parts[1]?.trim() || '';
                        return (
                          <>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-2)', display: 'block', marginBottom: 6 }}>
                                Опис товару (бачать клієнти на сайті)
                              </label>
                              <textarea 
                                value={publicDesc} 
                                onChange={e => {
                                  const newNotes = (formData.description || '').split('|||ADMIN_NOTES|||')[1] || '';
                                  setFormData({...formData, description: `${e.target.value}\n\n|||ADMIN_NOTES|||\n${newNotes}`});
                                }} 
                                className="dusk-textarea"
                                style={{ minHeight: 88 }}
                                placeholder="Опишіть переваги, розміри та особливості виробу..."
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-accent-2)', display: 'block', marginBottom: 6 }}>
                                Собівартість та нотатки (приховано, тільки для адміна)
                              </label>
                              <textarea 
                                value={adminNotes} 
                                onChange={e => {
                                  const newPublic = (formData.description || '').split('|||ADMIN_NOTES|||')[0] || '';
                                  setFormData({...formData, description: `${newPublic}\n\n|||ADMIN_NOTES|||\n${e.target.value}`});
                                }} 
                                className="dusk-textarea dusk-mono"
                                style={{ minHeight: 84, fontSize: 12 }}
                                placeholder="Час друку, собівартість, посилання на профіль друку..."
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div style={{
                  padding: '14px 22px',
                  borderTop: '1px solid var(--color-rule)',
                  background: 'var(--color-paper-2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexShrink: 0
                }}>
                  <button type="button" onClick={closeModal} className="dusk-btn dusk-btn--ghost">
                    Скасувати
                  </button>
                  <button type="submit" disabled={loading || uploading} className="dusk-btn dusk-btn--primary" style={{ minWidth: 180 }}>
                    <Check size={15} />
                    <span>{editingId ? 'Зберегти зміни' : 'Створити товар'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Message Modal */}
      <AnimatePresence>
        {individualMessageModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setIndividualMessageModal({ ...individualMessageModal, open: false })} style={{ position: 'absolute', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="dusk-glass"
              style={{ position: 'relative', width: '100%', maxWidth: 460, padding: 24, borderRadius: 18 }}
            >
              <h3 className="dusk-heading" style={{ fontSize: 18, marginBottom: 4 }}>Повідомлення клієнту</h3>
              <p className="dusk-subheading" style={{ marginBottom: 20 }}>
                Отримувач: <strong style={{ color: 'var(--color-ink)' }}>{individualMessageModal.user?.first_name} {individualMessageModal.user?.last_name || ''}</strong>
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 6 }}>Текст повідомлення</label>
                <textarea 
                  value={individualMessageModal.message}
                  onChange={(e) => setIndividualMessageModal({ ...individualMessageModal, message: e.target.value })}
                  placeholder="Ваше повідомлення..."
                  className="dusk-textarea"
                  style={{ minHeight: 130 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setIndividualMessageModal({ ...individualMessageModal, open: false })}
                  className="dusk-btn dusk-btn--ghost"
                  style={{ flex: 1, height: 40, justifyContent: 'center' }}
                >
                  Скасувати
                </button>
                <button 
                  onClick={handleSendIndividualMessage}
                  disabled={individualMessageModal.isSending || !individualMessageModal.message.trim()}
                  className="dusk-btn dusk-btn--primary"
                  style={{ flex: 1, height: 40, justifyContent: 'center' }}
                >
                  {individualMessageModal.isSending ? 'Відправка...' : 'Відправити'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Reassignment Modal */}
      <AnimatePresence>
        {reassignModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setReassignModal({ ...reassignModal, open: false })} style={{ position: 'absolute', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="dusk-glass"
              style={{ position: 'relative', width: '100%', maxWidth: 460, padding: 24, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <h3 className="dusk-heading" style={{ fontSize: 18 }}>Перепризначення товарів</h3>
              <p className="dusk-subheading">
                Категорія <strong>"{reassignModal.catNameToDelete}"</strong> містить {reassignModal.products.length} товарів. Оберіть нову категорію перед видаленням:
              </p>

              <select
                value={reassignModal.selectedNewCatName}
                onChange={(e) => setReassignModal({ ...reassignModal, selectedNewCatName: e.target.value })}
                className="dusk-select"
              >
                <option value="">Оберіть категорію...</option>
                {dbCategories.filter(c => c.name !== reassignModal.catNameToDelete).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setReassignModal({ ...reassignModal, open: false })} className="dusk-btn dusk-btn--ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Скасувати
                </button>
                <button onClick={handleConfirmReassignment} disabled={loading || !reassignModal.selectedNewCatName} className="dusk-btn dusk-btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? 'Збереження...' : 'Перенести та видалити'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bonus Modal */}
      {bonusModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setBonusModal({ ...bonusModal, open: false })} style={{ position: 'absolute', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)' }} />
          <div className="dusk-glass" style={{ position: 'relative', width: '100%', maxWidth: 380, padding: 24, borderRadius: 18 }}>
            <h3 className="dusk-heading" style={{ fontSize: 18, marginBottom: 6 }}>Керування бонусами</h3>
            <p className="dusk-subheading" style={{ marginBottom: 16 }}>
              Клієнт: <strong style={{ color: 'var(--color-ink)' }}>{bonusModal.user?.first_name} {bonusModal.user?.last_name || ''}</strong> • Баланс: <span className="dusk-num" style={{ color: 'var(--color-accent-2)' }}>{bonusModal.user?.bonuses || 0} ₴</span>
            </p>

            <div className="dusk-segmented" style={{ width: '100%', marginBottom: 16 }}>
              <button onClick={() => setBonusModal({ ...bonusModal, mode: 'add' })} className={`dusk-segmented__item ${bonusModal.mode === 'add' ? 'active' : ''}`} style={{ flex: 1 }}>
                Нарахувати (+)
              </button>
              <button onClick={() => setBonusModal({ ...bonusModal, mode: 'sub' })} className={`dusk-segmented__item ${bonusModal.mode === 'sub' ? 'active' : ''}`} style={{ flex: 1 }}>
                Списати (–)
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 6 }}>Кількість бонусів (₴)</label>
              <input 
                type="number"
                value={bonusModal.amount}
                onChange={(e) => setBonusModal({ ...bonusModal, amount: e.target.value })}
                className="dusk-input dusk-num"
                style={{ fontSize: 18, height: 42 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setBonusModal({ ...bonusModal, open: false })} className="dusk-btn dusk-btn--ghost" style={{ flex: 1, justifyContent: 'center' }}>
                Скасувати
              </button>
              <button onClick={confirmBonusUpdate} className="dusk-btn dusk-btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setDeleteConfirm({ open: false, id: null })} style={{ position: 'absolute', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="dusk-glass" style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 18, padding: 24, textAlign: 'center' }}>
              <h3 className="dusk-heading" style={{ fontSize: 18, marginBottom: 8 }}>Видалити товар?</h3>
              <p className="dusk-subheading" style={{ marginBottom: 20 }}>Цю дію неможливо буде скасувати.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm({ open: false, id: null })} className="dusk-btn dusk-btn--ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Скасувати
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="dusk-btn dusk-btn--danger" style={{ flex: 1, justifyContent: 'center' }}>
                  Видалити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirmation Modal */}
      <AnimatePresence>
        {modal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setModal({ ...modal, open: false })} style={{ position: 'absolute', inset: 0, background: 'rgba(8, 10, 18, 0.78)', backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="dusk-glass" style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 18, padding: 24, textAlign: 'center' }}>
              <h3 className="dusk-heading" style={{ fontSize: 18, marginBottom: 8 }}>{modal.title}</h3>
              <p className="dusk-subheading" style={{ marginBottom: 20 }}>{modal.message}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal({ ...modal, open: false })} className="dusk-btn dusk-btn--ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Скасувати
                </button>
                {modal.onConfirm && (
                  <button onClick={modal.onConfirm} className={`dusk-btn ${modal.type === 'danger' ? 'dusk-btn--danger' : 'dusk-btn--primary'}`} style={{ flex: 1, justifyContent: 'center' }}>
                    Підтвердити
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dusk Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 15, x: '-50%' }}
            className="dusk-glass"
            style={{
              position: 'fixed', bottom: isMobile ? 76 : 28, left: '50%',
              padding: '10px 18px', borderRadius: 999,
              color: 'var(--color-ink)', fontWeight: 500, fontSize: 13,
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10
            }}
          >
            <span className={`dusk-dot ${notification.type === 'error' ? '' : 'dusk-dot--periwinkle'}`} style={notification.type === 'error' ? { background: 'var(--color-danger)' } : undefined} />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
      <BulkMakerWorldImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        dbCategories={dbCategories}
        isMobile={isMobile}
        onCreated={(createdProducts, newCategoryObj) => {
          if (createdProducts?.length) {
            setProducts(prev => [...createdProducts, ...prev]);
          }
          if (newCategoryObj) {
            setDbCategories(prev => [...prev, newCategoryObj].sort((a, b) => a.name.localeCompare(b.name)));
          }
        }}
      />
      <StudioStyleModal
        open={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        products={products}
        dbCategories={dbCategories}
        isMobile={isMobile}
        onProductUpdated={(updatedProduct) => {
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        }}
      />
      <BulkPriceModal
        open={showBulkPriceModal}
        onClose={() => setShowBulkPriceModal(false)}
        products={products}
        dbCategories={dbCategories}
        isMobile={isMobile}
        onProductsUpdated={(updatedList) => {
          const map = new Map(updatedList.map(u => [u.id, u]));
          setProducts(prev => prev.map(p => map.get(p.id) || p));
          showToast(`Оновлено ціни для ${updatedList.length} товарів`);
        }}
      />
    </div>
  );
}
