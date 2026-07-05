"use client";
// Last UI Update: 2026-05-14 23:08 (Trigger Deploy)
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Package, LayoutDashboard, ShoppingBag, 
  Search, Bell, LogOut, Box, BarChart3, Settings,
  Upload, Image as ImageIcon, X, Edit3, Filter, CheckCircle, Globe, Tag, Percent, User, Coins, Award, Send, MessageSquare, Star, Calculator, ShieldCheck, Sparkles, Loader2, Sun, Moon, CheckCircle2, AlertCircle, Megaphone, Menu,
  Clock, ClipboardList, Printer, Truck, XCircle, ChevronDown, ChevronUp, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalculatorComp from '@/components/Calculator';
import InventoryDashboard from '@/components/InventoryDashboard';
import AdvertisingDashboard from '@/components/AdvertisingDashboard';
import SalesDashboard from '@/components/SalesDashboard';
import ShippingCabinet from '@/components/ShippingCabinet';
import ProductionCabinet from '@/components/ProductionCabinet';


const scrollbarHide = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  :root {
    --bg-main: #020b18;
    --bg-card: rgba(255,255,255,0.03);
    --bg-header: rgba(2,11,24,0.6);
    --text-main: #ffffff;
    --text-muted: #6b6b8a;
    --text-accent: #3b82f6;
    --border: rgba(255,255,255,0.05);
    --sidebar-active: rgba(59,130,246,0.1);
    --bg-input: rgba(0,0,0,0.2);
  }

  .light-theme {
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --bg-header: rgba(255,255,255,0.8);
    --bg-input: rgba(0,0,0,0.05);
    --text-main: #0f172a;
    --text-muted: #64748b;
    --text-accent: #2563eb;
    --border: #e2e8f0;
    --sidebar-active: rgba(37,99,235,0.05);
  }

  @media (max-width: 1024px) {
    .admin-layout { flex-direction: column !important; }
    .admin-aside { 
      position: fixed !important; 
      left: -260px !important; 
      top: 0 !important; 
      bottom: 0 !important; 
      z-index: 1001 !important;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .admin-aside.open { left: 0 !important; }
    .admin-main-header { display: none !important; }
    .admin-mobile-header { display: flex !important; }
    .admin-content { padding: 20px !important; }
  }
`;

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin_active_tab');
      if (savedTab) {
        setActiveTab(savedTab);
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
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [showFarmMonitor, setShowFarmMonitor] = useState(true);
  const [showAddPrinterForm, setShowAddPrinterForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const fetchPrinters = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'buba_printers')
        .single();
      
      const defaultPrinters = [
        { id: '1', name: 'Bambu Lab X1C', wattage: 350, wear: 10, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
        { id: '2', name: 'Bambu Lab P1S/P1P', wattage: 350, wear: 8, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
        { id: '3', name: 'Bambu Lab A1', wattage: 200, wear: 6, is_repair: false, ip_address: '', access_code: '', serial_number: '' },
        { id: '4', name: 'Bambu Lab A1 Mini', wattage: 150, wear: 5, is_repair: false, ip_address: '', access_code: '', serial_number: '' }
      ];

      if (data && data.value) {
        setPrinters(data.value);
      } else {
        setPrinters(defaultPrinters);
        await supabase.from('settings').upsert({ key: 'buba_printers', value: defaultPrinters });
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('buba_printers');
        if (saved) setPrinters(JSON.parse(saved));
      }
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

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };


  const [formData, setFormData] = useState({
    name: '', description: '', price: '', discount: 0, status: 'in_stock', 
    model_3d: '', image_url: '', image_urls: [], category: '',
    plastic_type: '', safety_info: '', weight: '', color: '',
    is_trending: false
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
      fetchPrinters();
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

    if (savedAuth && savedAuth === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else if (savedAuthType === 'telegram') {
      // Re-verify TMA if possible, or just trust session if we're still in TMA
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
    if (adminPass === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('admin_session', adminPass);
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
    setIsAuthenticated(false);
    showToast('Ви вийшли', 'info');
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

  async function handleDeleteOrder(orderId) {
    if (!supabase) return;
    setModal({
      open: true,
      title: 'Видалити замовлення?',
      message: 'Ця дія назавжди видалить замовлення з бази даних.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('orders').delete().eq('id', orderId);
          if (error) throw error;
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
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

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
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
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
      if (data) setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    const cats = products.map(p => p.category).filter(Boolean);
    return ['Всі', ...new Set(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Всі' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

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
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
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
    setFormData({
      name: product.name || '',
      description: product.description || '',
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
      is_trending: product.is_trending || false
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
      is_trending: false
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
      <div style={{ minHeight: '100vh', background: '#020b18', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{scrollbarHide}</style>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 32, padding: 40, width: '100%', maxWidth: 400, textAlign: 'center',
            backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ width: 64, height: 64, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 950, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>ADMIN PANEL</h1>
          <p style={{ color: '#6b6b8a', fontSize: 14, marginBottom: 32, fontWeight: 500 }}>Введіть пароль доступу</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div animate={authError ? { x: [-10, 10, -10, 10, 0] } : {}}>
              <input 
                type="password" 
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                autoFocus
                style={{ 
                  width: '100%', padding: '18px 20px', borderRadius: 16, 
                  background: 'rgba(0,0,0,0.3)', border: authError ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', outline: 'none', textAlign: 'center', fontSize: 18, letterSpacing: '0.3em',
                  fontWeight: 900, transition: 'all 0.3s'
                }}
              />
            </motion.div>
            <button 
              type="submit"
              style={{ 
                padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 25px rgba(124,58,237,0.3)', transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              УВІЙТИ <Sparkles size={18} />
            </button>
          </form>

          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900 }}>
            BUBA STORE SYSTEM
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`admin-layout ${isDarkMode ? '' : 'light-theme'}`} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden', transition: 'all 0.3s' }}>
      <style>{scrollbarHide}</style>
      
      {/* Mobile Header */}
      <header className="admin-mobile-header" style={{ height: 60, flexShrink: 0, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: isMobile ? 'flex' : 'none', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', zIndex: 100 }}>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 900, fontSize: 16 }}>BUBA ADMIN</span>
        <div style={{ width: 24 }} />
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
        />
      )}

      <aside className={`admin-aside ${isSidebarOpen ? 'open' : ''}`} style={{ 
        width: 260, flexShrink: 0, background: 'var(--bg-card)', backdropFilter: 'blur(20px)', 
        borderRight: isMobile ? 'none' : '1px solid var(--border)', 
        display: 'flex', flexDirection: 'column', zIndex: 1001,
        position: isMobile ? 'fixed' : 'relative',
        top: 0, bottom: 0, left: isMobile ? (isSidebarOpen ? 0 : -260) : 0,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ padding: '32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box className="text-white" size={20} />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>BUBA ADMIN</span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
        </div>
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarBtn active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} icon={<Package size={18} />} label="Товари" />
          <SidebarBtn active={activeTab === 'sales_cabinet'} onClick={() => { setActiveTab('sales_cabinet'); setIsSidebarOpen(false); }} icon={<Coins size={18} />} label="Продажі" />
          <SidebarBtn active={activeTab === 'sales'} onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false); }} icon={<ShoppingBag size={18} />} label="Замовлення" />
          <SidebarBtn active={activeTab === 'shipping_list'} onClick={() => { setActiveTab('shipping_list'); setIsSidebarOpen(false); }} icon={<Truck size={18} />} label="Відправки" />
          <SidebarBtn active={activeTab === 'production'} onClick={() => { setActiveTab('production'); setIsSidebarOpen(false); }} icon={<Hammer size={18} />} label="Виготовлення" />
          <SidebarBtn active={activeTab === 'calculator'} onClick={() => { setActiveTab('calculator'); setIsSidebarOpen(false); }} icon={<Calculator size={18} />} label="Калькулятор" />
          <SidebarBtn active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }} icon={<Box size={18} />} label="Склад (Облік)" />
          <SidebarBtn active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} icon={<User size={18} />} label="Клієнти" />
          <SidebarBtn active={activeTab === 'reviews'} onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }} icon={<MessageSquare size={18} />} label="Відгуки" />
          <SidebarBtn active={activeTab === 'broadcast'} onClick={() => { setActiveTab('broadcast'); setIsSidebarOpen(false); }} icon={<Send size={18} />} label="Розсилка" />
        </nav>

        <div style={{ padding: 24, borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', 
              borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border)',
              color: 'var(--text-main)', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              transition: 'all 0.2s'
            }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Світла тема' : 'Темна тема'}
          </button>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 13 }}
          >
            <LogOut size={18} /> Вийти
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {['products', 'sales', 'users'].includes(activeTab) && (
          <header className="admin-main-header" style={{ height: 80, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'var(--bg-header)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', zIndex: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', width: 350 }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Пошук..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 13, outline: 'none', width: '100%' }} />
            </div>
            {activeTab === 'products' && (
              <button onClick={() => setShowForm(true)} style={{ background: '#fff', color: '#020b18', padding: '10px 24px', borderRadius: 12, fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                <Plus size={18} /> ДОДАТИ ТОВАР
              </button>
            )}
          </header>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '40px' }}>
          {!supabase && (
            <div style={{ marginBottom: 24, padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 12, color: '#ef4444', fontSize: 13, fontWeight: 700 }}>
              ⚠️ З'єднання з Supabase не встановлено. Перевірте наявність та правильність файлу .env.local
            </div>
          )}
          {activeTab === 'products' ? (
            <>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 16, marginBottom: 32 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 900, color: '#fff', margin: 0 }}>Товари ({filteredProducts.length})</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {categories.slice(0, isMobile ? 3 : 6).map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: activeCategory === cat ? 'rgba(59,130,246,0.1)' : 'transparent', border: '1px solid', borderColor: activeCategory === cat ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: activeCategory === cat ? '#3b82f6' : '#6b6b8a', cursor: 'pointer' }}>{cat}</button>
                  ))}
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setShowForm(true)} style={{ width: '100%', marginBottom: 20, background: 'linear-gradient(135deg, #3b82f6, #2dd4bf)', color: '#fff', padding: '12px', borderRadius: 16, fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus size={18} /> ДОДАТИ ТОВАР
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredProducts.map(p => {
                  const final = (p.price * (1 - (p.discount || 0) / 100)).toFixed(0);
                  return (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 20 }}>
                      <div style={{ width: 60, height: 60, background: '#f0eef5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                         {p.model_3d ? <Box size={28} color="#3b82f6" /> : p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} color="#94a3b8" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</h3>
                        <p style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 700 }}>{p.category || 'Без категорії'}</p>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 20 }}>
                        {p.discount > 0 && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 900 }}>-{p.discount}%</div>}
                        {p.discount > 0 && <div style={{ fontSize: 10, color: '#4a4a6a', textDecoration: 'line-through' }}>{p.price} ₴</div>}
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{final} ₴</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 10, border: 'none', cursor: 'pointer' }}><Edit3 size={18} /></button>
                        <button onClick={() => setDeleteConfirm({ open: true, id: p.id })} style={{ padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'sales' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>
                  Замовлення ({selectedStatuses.length > 0 || selectedPayments.length > 0 || searchQuery ? filteredOrders.length : orders.length})
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => {
                      const allIds = filteredOrders.map(o => o.id);
                      const areAllExpanded = allIds.every(id => expandedOrderIds.includes(id));
                      if (areAllExpanded) {
                        setExpandedOrderIds(prev => prev.filter(id => !allIds.includes(id)));
                      } else {
                        setExpandedOrderIds(prev => [...new Set([...prev, ...allIds])]);
                      }
                    }}
                    style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    {filteredOrders.length > 0 && filteredOrders.map(o => o.id).every(id => expandedOrderIds.includes(id)) ? 'Згорнути всі' : 'Розгорнути всі'}
                  </button>
                  <button 
                    onClick={handleManualRefresh} 
                    disabled={refreshing}
                    style={{ padding: '8px 16px', borderRadius: 10, background: refreshing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: refreshing ? '#22c55e' : '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', transition: 'all 0.3s' }}
                  >
                    {refreshing ? 'Оновлено ✅' : 'Оновити'}
                  </button>
                </div>
              </div>              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', textTransform: 'uppercase' }}>Статус замовлення (можна обрати декілька):</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { val: 'Всі', label: 'ВСІ', color: '#6b6b8a', bg: 'rgba(255,255,255,0.03)', icon: null },
                      { val: 'new', label: 'НОВІ', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
                      { val: 'preparing', label: 'ПІДГОТОВКА', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
                      { val: 'printing', label: 'ДРУК', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
                      { val: 'shipping', label: 'ОЧІКУЄ НА ВІДПРАВКУ', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
                      { val: 'shipped', label: 'ВІДПРАВЛЕНО ПОШТОЮ', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send },
                      { val: 'completed', label: 'ВИКОНАНО', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
                      { val: 'cancelled', label: 'СКАСОВАНО', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle }
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
                            color: active ? '#fff' : '#6b6b8a', 
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
                <div style={{ width: isMobile ? '100%' : 1, height: isMobile ? 1 : 'auto', background: 'rgba(255,255,255,0.05)', margin: isMobile ? '10px 0' : '0 10px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', textTransform: 'uppercase' }}>Статус оплати (можна обрати декілька):</label>
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
                            color: active ? '#fff' : '#6b6b8a', 
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
              </div>

              {/* Orders List Accordion */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOrders.map(order => {
                    const isExpanded = expandedOrderIds.includes(order.id);
                    
                    return (
                      <div key={order.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Header Bar */}
                        <div 
                          onClick={() => toggleOrderExpand(order.id)}
                          style={{ 
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'stretch' : 'center',
                            padding: '14px 20px',
                            background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: isExpanded ? '20px 20px 0 0' : '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            gap: 12
                          }}
                        >
                          {/* Order ID & Date */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 150 }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>
                              {order.order_number || `#${order.id.slice(0, 8)}`}
                            </span>
                            <span style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 700 }}>
                              {new Date(order.created_at).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                              {order.shipping_details?.firstName} {order.shipping_details?.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b6b8a' }}>
                              {order.shipping_details?.phone}
                            </div>
                            {order.shipping_details?.notes && (
                              <div style={{ 
                                marginTop: 4, padding: '2px 6px', borderRadius: 6, display: 'inline-block',
                                background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.2)',
                                color: '#fbbf24', fontSize: 10, fontWeight: 800
                              }}>
                                ⚠️ {order.shipping_details.notes}
                              </div>
                            )}
                          </div>

                          {/* Delivery */}
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>
                              {order.shipping_method === 'nova_poshta' ? 'Нова Пошта' : 'Самовивіз'}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b6b8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.shipping_details?.city}>
                              {order.shipping_details?.city}
                            </div>
                          </div>

                          {/* Sum & Payment Status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', minWidth: 160 }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 14, fontWeight: 950, color: '#2dd4bf' }}>{order.total} ₴</span>
                              <div style={{ fontSize: 9, color: order.payment_status === 'paid' ? '#22c55e' : order.payment_status === 'partially_paid' ? '#38bdf8' : order.payment_status === 'verifying' ? '#f97316' : '#f59e0b', fontWeight: 900 }}>
                                {order.payment_status === 'paid' ? 'ОПЛАЧЕНО' : order.payment_status === 'partially_paid' ? 'ЧАСТКОВО' : order.payment_status === 'verifying' ? 'ПЕРЕВІРКА' : 'ОЧІКУЄ'}
                              </div>
                            </div>
                            
                            {order.payment_status === 'verifying' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePaymentStatus(order.id, 'paid');
                                }}
                                style={{ 
                                  padding: '4px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', 
                                  border: '1px solid rgba(34,197,94,0.2)', fontSize: 9, fontWeight: 900, cursor: 'pointer'
                                }}
                              >
                                OK
                              </button>
                            )}
                          </div>

                          {/* Status Badge & Chevron */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', minWidth: 160 }}>
                            {(() => {
                              const statusMeta = {
                                new: { label: 'Нове', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
                                preparing: { label: 'Підготовка', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ClipboardList },
                                printing: { label: 'Друк', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Printer },
                                shipping: { label: 'Очікує на відправку', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: Truck },
                                shipped: { label: 'Пошта', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Send },
                                completed: { label: 'Виконано', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
                                cancelled: { label: 'Скасовано', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle }
                              };
                              const meta = statusMeta[order.status] || statusMeta.new;
                                return (
                                  <span style={{ 
                                    padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 900, 
                                    background: meta.bg, color: meta.color,
                                    display: 'inline-flex', alignItems: 'center', gap: 4
                                  }}>
                                    {meta.label}
                                    {order.status === 'printing' && order.shipping_details?.assigned_printer && (
                                      <span style={{ opacity: 0.8, fontWeight: 800, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 6, marginLeft: 2 }}>
                                        {order.shipping_details.assigned_printer}
                                      </span>
                                    )}
                                  </span>
                              );
                            })()}
                            
                            <div>
                              {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                          </div>
                        </div>

                        {/* Details Panel */}
                        {isExpanded && (
                          <div 
                            style={{ 
                              background: 'rgba(255,255,255,0.02)', 
                              borderLeft: '1px solid rgba(255,255,255,0.05)',
                              borderRight: '1px solid rgba(255,255,255,0.05)',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              padding: 20, 
                              borderRadius: '0 0 20px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 16
                            }}
                          >
                            {order.shipping_details?.notes && (
                              <div style={{ 
                                padding: '10px 14px', borderRadius: 12, 
                                background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)',
                                color: '#fbbf24', fontSize: 12, fontWeight: 750, display: 'flex', gap: 6, alignItems: 'center'
                              }}>
                                <span>⚠️ <strong>Уточнення:</strong> {order.shipping_details.notes}</span>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                              {order.shipping_method === 'nova_poshta' && order.shipping_details?.warehouse && (
                                <div>
                                  <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Відділення пошти</div>
                                  <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                                    {order.shipping_details.warehouse}
                                  </div>
                                </div>
                              )}

                              {order.shipping_details?.bonus_used > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Використані бонуси</div>
                                  <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 800 }}>
                                    🪙 {order.shipping_details.bonus_used} бонусів
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, marginBottom: 12 }}>
                              <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase' }}>Статус оплати</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[
                                  { val: 'pending', label: 'Очікує оплати', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                                  { val: 'verifying', label: 'Перевірка', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
                                  { val: 'partially_paid', label: 'Частково оплачено', color: '#38bdf8', bg: 'rgba(14,165,233,0.1)' },
                                  { val: 'paid', label: 'Оплачено', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
                                ].map(p => {
                                  const isSelected = order.payment_status === p.val;
                                  return (
                                    <button
                                      key={p.val}
                                      onClick={() => updatePaymentStatus(order.id, p.val)}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: 10,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        border: isSelected ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.05)',
                                        background: isSelected ? p.bg : 'rgba(255,255,255,0.02)',
                                        color: isSelected ? p.color : '#6b6b8a',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      {p.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {order.status === 'printing' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, marginBottom: 12, padding: 12, background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 16 }}>
                                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 900, textTransform: 'uppercase' }}>Призначення 3D-принтера</div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180 }}>
                                    <label style={{ fontSize: 9, color: '#6b6b8a', fontWeight: 700 }}>Принтер</label>
                                    <ThemeSelect
                                      value={order.shipping_details?.assigned_printer || ''}
                                      placeholder="Не призначено"
                                      options={printers.map(p => ({
                                        value: p.name,
                                        label: p.name
                                      }))}
                                      onChange={(val) => assignPrinter(order.id, val || null)}
                                    />
                                  </div>

                                  {order.shipping_details?.assigned_printer && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <label style={{ fontSize: 9, color: '#6b6b8a', fontWeight: 700 }}>Тривалість друку (год)</label>
                                      <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={order.shipping_details?.print_hours || 4}
                                        onChange={(e) => assignPrinter(order.id, order.shipping_details.assigned_printer, e.target.value)}
                                        style={{
                                          padding: '5px 10px',
                                          borderRadius: 8,
                                          background: 'rgba(0,0,0,0.2)',
                                          border: '1px solid rgba(255,255,255,0.05)',
                                          color: '#fff',
                                          fontSize: 11,
                                          fontWeight: 800,
                                          width: 60,
                                          outline: 'none'
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {order.shipping_details?.items && (
                              <div>
                                <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Склад замовлення</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {order.shipping_details.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: 10, fontSize: 12, color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.03)' }}>
                                      <span>{item.name}</span>
                                      <span style={{ fontWeight: 800, color: '#a78bfa' }}>x{item.quantity || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions and Status Transitions */}
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <StatusBtn label="Підготовка" active={order.status === 'preparing'} color="#f59e0b" icon={<ClipboardList size={12} />} onClick={() => updateOrderStatus(order.id, 'preparing')} />
                              <StatusBtn label="Друкується" active={order.status === 'printing'} color="#7c3aed" icon={<Printer size={12} />} onClick={() => updateOrderStatus(order.id, 'printing')} />
                              <StatusBtn label="Очікує на відправку" active={order.status === 'shipping'} color="#ec4899" icon={<Truck size={12} />} onClick={() => updateOrderStatus(order.id, 'shipping')} />
                              <StatusBtn label="Відправлено поштою" active={order.status === 'shipped'} color="#10b981" icon={<Send size={12} />} onClick={() => updateOrderStatus(order.id, 'shipped')} />
                              <StatusBtn label="Виконано" active={order.status === 'completed'} color="#22c55e" icon={<CheckCircle2 size={12} />} onClick={() => updateOrderStatus(order.id, 'completed')} />
                              
                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <StatusBtn label="Скасувати" active={order.status === 'cancelled'} color="#ef4444" icon={<XCircle size={12} />} onClick={() => updateOrderStatus(order.id, 'cancelled')} />
                                <button 
                                  onClick={() => setModal({ 
                                    open: true, 
                                    title: 'Видалити замовлення?', 
                                    message: `Ви впевнені, що хочете видалити замовлення ${order.order_number}? Цю дію неможливо скасувати.`, 
                                    type: 'danger',
                                    onConfirm: () => deleteOrder(order.id)
                                  })}
                                  style={{ 
                                    padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', 
                                    background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 10, fontWeight: 900, cursor: 'pointer'
                                  }}
                                >
                                  ВИДАЛИТИ
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          ) : activeTab === 'users' ? (
            <>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Клієнти та Бонуси ({users.length})</h1>
                <button 
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  style={{ padding: '8px 16px', borderRadius: 10, background: refreshing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: refreshing ? '#22c55e' : '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  {refreshing ? 'Оновлено ✅' : 'Оновити'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{user.first_name} {user.last_name}</div>
                        <div style={{ fontSize: 12, color: '#6b6b8a' }}>{user.username ? `@${user.username}` : 'Без юзернейму'}</div>
                      </div>
                      <div style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                        {user.bonuses || 0} ₴
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: '#4a4a6a', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Telegram ID</div>
                        <div style={{ color: '#fff', fontWeight: 700 }}>{user.tg_id || '---'}</div>
                      </div>
                      <div>
                        <div style={{ color: '#4a4a6a', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Телефон</div>
                        <div style={{ color: '#fff', fontWeight: 700 }}>{user.phone || '---'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                       <button onClick={() => openBonusModal(user)} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>БОНУСИ</button>
                       <button onClick={() => setIndividualMessageModal({ open: true, user, message: '', imageUrl: '', isSending: false })} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>ПОВІДОМЛЕННЯ</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'farm' ? (
            <>
              {/* Farm Page Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Printer size={28} style={{ color: '#a78bfa' }} /> 3D Друкарська Ферма ({printers.length})
                </h1>
                <button 
                  onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
                  style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> Додати принтер
                </button>
              </div>

              {/* Add Printer Form */}
              {showAddPrinterForm && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Нове обладнання</h3>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Шаблони Bambu Lab (клікніть для автозаповнення):</div>
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
                          style={{
                            padding: '6px 12px',
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 800,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#6b6b8a',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tpl.name.replace('Bambu Lab ', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 2, minWidth: 150 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 800 }}>Назва принтера</label>
                        <input 
                          type="text" 
                          id="new-printer-name" 
                          placeholder="Напр. Bambu Lab X1C" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 80 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 800 }}>Потужність (Вт)</label>
                        <input 
                          type="number" 
                          id="new-printer-wattage" 
                          placeholder="350" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 80 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 800 }}>Знос (₴/год)</label>
                        <input 
                          type="number" 
                          id="new-printer-wear" 
                          placeholder="10" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 850 }}>IP-адреса принтера (Wi-Fi)</label>
                        <input 
                          type="text" 
                          id="new-printer-ip" 
                          placeholder="Напр. 192.168.1.100" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 850 }}>Код доступу (Access Code)</label>
                        <input 
                          type="text" 
                          id="new-printer-code" 
                          placeholder="8-значний код" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 850 }}>Серійний номер (SN)</label>
                        <input 
                          type="text" 
                          id="new-printer-sn" 
                          placeholder="Напр. 01P00A12345678" 
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, outline: 'none' }} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
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
                        style={{ padding: '9px 16px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Зберегти
                      </button>
                      <button 
                        onClick={() => setShowAddPrinterForm(false)}
                        style={{ padding: '9px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Printers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {printerLoads.map(load => {
                  const status = load.status; // 'free' | 'printing' | 'repair'
                  return (
                    <div 
                      key={load.printer.id} 
                      style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)',
                        borderRadius: 24, 
                        padding: 20, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        opacity: status === 'repair' ? 0.7 : 1,
                        transition: 'all 0.3s'
                      }}
                    >
                      {/* Printer Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Printer size={18} style={{ color: status === 'printing' ? '#7c3aed' : status === 'repair' ? '#ef4444' : '#22c55e' }} />
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{load.printer.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div>{load.printer.wattage} Вт • {load.printer.wear} ₴/год</div>
                            {(load.printer.ip_address || load.printer.serial_number) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ 
                                  fontSize: 9, 
                                  fontWeight: 800, 
                                  padding: '2px 6px', 
                                  borderRadius: 6, 
                                  background: load.printer.is_online ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                                  color: load.printer.is_online ? '#22c55e' : '#ef4444' 
                                }}>
                                  {load.printer.is_online ? 'З\'єднано 🟢' : 'Офлайн 🔴'}
                                </span>
                                {load.printer.is_online && load.printer.nozzle_temp !== undefined && (
                                  <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 800 }}>
                                    🔥 {load.printer.nozzle_temp}°C / {load.printer.bed_temp || 0}°C
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <span style={{ 
                          fontSize: 9, 
                          fontWeight: 900, 
                          padding: '4px 8px', 
                          borderRadius: 8, 
                          background: status === 'printing' ? 'rgba(124,58,237,0.15)' : status === 'repair' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', 
                          color: status === 'printing' ? '#a78bfa' : status === 'repair' ? '#ef4444' : '#22c55e'
                        }}>
                          {status === 'printing' ? 'ДРУК' : status === 'repair' ? 'РЕМОНТ' : 'ВІЛЬНИЙ'}
                        </span>
                      </div>

                      {/* Printer Task / Assignments */}
                      {status === 'printing' && load.order ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 16 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                              Замовлення {load.order.order_number || `#${load.order.id.slice(0, 8)}`}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>
                              Клієнт: {load.order.shipping_details?.firstName} {load.order.shipping_details?.lastName}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${load.percentElapsed}%`, height: '100%', background: '#7c3aed', borderRadius: 3 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b6b8a', fontWeight: 800 }}>
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
                            style={{
                              padding: '8px',
                              borderRadius: 10,
                              border: 'none',
                              background: 'rgba(34,197,94,0.1)',
                              color: '#22c55e',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            Завершити друк ✅
                          </button>
                        </div>
                      ) : status === 'repair' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center', height: 70, background: 'rgba(239,68,68,0.02)', border: '1px dashed rgba(239,68,68,0.15)', borderRadius: 16 }}>
                          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            🔧 Обладнання обслуговується
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', height: 70 }}>
                          <div style={{ fontSize: 11, color: '#4a4a6a', textAlign: 'center' }}>Немає активних завдань</div>
                          
                          {orders.filter(o => o.status === 'preparing').length > 0 && (
                            <ThemeSelect
                              value=""
                              placeholder="Призначити друк..."
                              options={orders
                                .filter(o => o.status === 'preparing')
                                .map(o => ({
                                  value: o.id,
                                  label: `${o.order_number || `#${o.id.slice(0, 8)}`} (${o.shipping_details?.firstName || ''})`
                                }))
                              }
                              onChange={(orderId) => {
                                if (orderId) {
                                  assignPrinter(orderId, load.printer.name);
                                  updateOrderStatus(orderId, 'printing');
                                }
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Printer Actions / Controls */}
                      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => togglePrinterRepair(load.printer.id)}
                          style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: 10, 
                            background: status === 'repair' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                            color: status === 'repair' ? '#22c55e' : '#ef4444', 
                            border: 'none', 
                            fontSize: 11, 
                            fontWeight: 800, 
                            cursor: 'pointer' 
                          }}
                        >
                          {status === 'repair' ? 'В роботу' : 'На ремонт'}
                        </button>
                        <button 
                          onClick={() => {
                            setModal({
                              open: true,
                              title: 'Видалити принтер?',
                              message: `Ви впевнені, що хочете видалити принтер ${load.printer.name}? Його також буде видалено з пресетів калькулятора.`,
                              type: 'danger',
                              onConfirm: () => {
                                handleDeletePrinter(load.printer.id);
                                setModal({ open: false });
                              }
                            });
                          }}
                          style={{ 
                            padding: '8px 12px', 
                            borderRadius: 10, 
                            background: 'rgba(255,255,255,0.05)', 
                            color: '#6b6b8a', 
                            border: 'none', 
                            cursor: 'pointer' 
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions Panel */}
              <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 24, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0, cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowInstructions(!showInstructions)}>
                  🔧 ІНСТРУКЦІЯ: ЯК ПІДКЛЮЧИТИ ФІЗИЧНИЙ ПРИНТЕР {showInstructions ? '▲' : '▼'}
                </h3>
                {showInstructions && (
                  <div style={{ marginTop: 16, fontSize: 12, color: '#6b6b8a', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      Для того щоб автоматично синхронізувати статус друку, відсоток виконання та температури безпосередньо з вашого принтера Bambu Lab, виконайте наступні кроки:
                    </div>
                    <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <li>Додайте принтер у меню вище, вказавши його локальну <strong>IP-адресу</strong>, <strong>Код доступу (Access Code)</strong> та <strong>Серійний номер (Serial Number)</strong>.</li>
                      <li>Переконайтеся, що на вашому комп'ютері встановлено Python (версія 3.7+).</li>
                      <li>Завантажте та запустіть локальний міст-скрипт <code>bambu_bridge.py</code> у фоновому режимі на будь-якому комп'ютері у тій самій Wi-Fi мережі, що й принтер.</li>
                    </ol>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6 }}>Команда для першого запуску:</div>
                      <code style={{ fontSize: 11, color: '#fff', wordBreak: 'break-all' }}>
                        pip install paho-mqtt supabase python-dotenv<br/>
                        python bambu_bridge.py
                      </code>
                    </div>
                    <div>
                      Скрипт самостійно зчитає налаштування з файлу <code>.env.local</code> вашого проекту, підключиться до принтерів локально та почне стрімити телеметрію в базу даних Supabase кожні 5 секунд.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'shipping_list' ? (
            <ShippingCabinet orders={orders} setOrders={setOrders} showToast={showToast} isMobile={isMobile} />
          ) : activeTab === 'production' ? (
            <ProductionCabinet orders={orders} isMobile={isMobile} />
          ) : activeTab === 'sales_cabinet' ? (
            <SalesDashboard showToast={showToast} />
          ) : activeTab === 'inventory' ? (
            <InventoryDashboard showToast={showToast} />
          ) : activeTab === 'reviews' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Керування відгуками ({reviews.length})</h1>
                <button 
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  style={{ padding: '8px 16px', borderRadius: 10, background: refreshing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: refreshing ? '#22c55e' : '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  {refreshing ? 'Оновлено ✅' : 'Оновити'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                          <User size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{review.customers?.first_name} {review.customers?.last_name}</div>
                          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= review.rating ? "#fbbf24" : "transparent"} color={s <= review.rating ? "#fbbf24" : "#4a4a6a"} />)}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6b6b8a', fontWeight: 700 }}>{new Date(review.created_at).toLocaleDateString('uk-UA')}</div>
                        <button onClick={() => handleDeleteReview(review.id)} style={{ marginTop: 8, padding: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}><Trash2 size={16}/></button>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                      {review.comment}
                    </div>

                    {review.admin_reply ? (
                      <div style={{ background: 'rgba(124,58,237,0.05)', borderLeft: '3px solid #7c3aed', padding: 16, borderRadius: '0 16px 16px 0', marginLeft: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={12} /> ВАША ВІДПОВІДЬ
                        </div>
                        <div style={{ fontSize: 13, color: '#a78bfa' }}>{review.admin_reply}</div>
                        <button 
                          onClick={() => setReplyData({ reviewId: review.id, text: review.admin_reply })}
                          style={{ marginTop: 12, background: 'none', border: 'none', color: '#6b6b8a', fontSize: 11, cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          Редагувати відповідь
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        {replyData.reviewId === review.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <textarea 
                              value={replyData.text} onChange={e => setReplyData({...replyData, text: e.target.value})}
                              placeholder="Напишіть вашу відповідь..."
                              style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none', resize: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleSendReply(review.id)} style={{ padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>ВІДПРАВИТИ</button>
                              <button onClick={() => setReplyData({ reviewId: null, text: '' })} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', color: '#6b6b8a', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>СКАСУВАТИ</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReplyData({ reviewId: review.id, text: '' })}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                          >
                            <MessageSquare size={16} /> ВІДПОВІСТИ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'broadcast' ? (
            <div style={{ maxWidth: 600 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                 <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Нова розсилка 📣</h1>
                 <button 
                   onClick={handleManualRefresh}
                   disabled={refreshing}
                   style={{ padding: '8px 16px', borderRadius: 10, background: refreshing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: refreshing ? '#22c55e' : '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, cursor: 'pointer', transition: 'all 0.3s' }}
                 >
                   {refreshing ? 'Оновлено ✅' : 'Оновити'}
                 </button>
               </div>
               
               <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', padding: 32 }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#6b6b8a', textTransform: 'uppercase', marginBottom: 12 }}>Підписані клієнти</div>
                    <div style={{ fontSize: 32, fontWeight: 950, color: '#7c3aed' }}>
                      {users.filter(u => u.allow_notifications).length} <span style={{ fontSize: 14, color: '#4a4a6a' }}>осіб</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', marginBottom: 12 }}>Зображення розсилки</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {broadcastImageUrl ? (
                        <div style={{ position: 'relative', width: 100, height: 100, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={broadcastImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            onClick={() => setBroadcastImageUrl('')}
                            style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ 
                          width: 100, height: 100, borderRadius: 16, border: '2px dashed rgba(255,255,255,0.1)', 
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                          cursor: 'pointer', gap: 8, color: '#6b6b8a', transition: 'all 0.2s'
                        }}>
                          <Upload size={24} />
                          <span style={{ fontSize: 10, fontWeight: 800 }}>ДОДАТИ ФОТО</span>
                          <input type="file" hidden accept="image/*" onChange={(e) => handleMessageImageUpload(e, 'broadcast')} disabled={isUploadingMedia} />
                        </label>
                      )}
                      {isUploadingMedia && <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>Завантаження...</div>}
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', marginBottom: 12 }}>Текст повідомлення</label>
                    <textarea 
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Напишіть щось цікаве для ваших клієнтів..."
                      style={{ 
                        width: '100%', minHeight: 200, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16, padding: 20, color: '#fff', fontSize: 14, outline: 'none', resize: 'none'
                      }}
                    />
                  </div>

                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isSendingBroadcast || !broadcastMessage.trim()}
                    style={{ 
                      width: '100%', padding: '18px', borderRadius: 16, border: 'none', 
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', fontWeight: 950,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      opacity: (isSendingBroadcast || !broadcastMessage.trim()) ? 0.5 : 1,
                      boxShadow: '0 10px 20px rgba(124,58,237,0.3)'
                    }}
                  >
                    {isSendingBroadcast ? 'ВІДПРАВКА...' : <><Send size={18}/> ВІДПРАВИТИ ВСІМ</>}
                  </button>
               </div>
               
               <div style={{ marginTop: 24, padding: 16, background: 'rgba(59,130,246,0.05)', borderRadius: 16, border: '1px solid rgba(59,130,246,0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                   <p style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                     💡 Порада: Використовуйте розсилки для анонсу нових виробів або спеціальних знижок. Це найкращий спосіб повернути клієнтів у ваш магазин!
                   </p>
                   <button 
                     onClick={enableAllNotifications}
                     style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', fontSize: 10, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
                   >
                     УВІМКНУТИ ВСІМ СПОВІЩЕННЯ
                   </button>
                 </div>
               </div>

               {isProcessingQueue && (
                 <div style={{ marginTop: 24, background: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 32, border: '1px solid #7c3aed' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <div>
                       <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Черга розсилки... ⏳</h3>
                       <p style={{ fontSize: 12, color: '#6b6b8a', margin: '4px 0 0 0' }}>Прогрес: {queueStatus.sent} / {queueStatus.total}</p>
                     </div>
                     {queueStatus.nextBatchIn > 0 && (
                        <div style={{ background: 'rgba(124,58,237,0.1)', padding: '10px 20px', borderRadius: 12, border: '1px solid #7c3aed', textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 900 }}>НАСТУПНИЙ ПАКЕТ ЧЕРЕЗ</div>
                          <div style={{ fontSize: 24, color: '#fff', fontWeight: 950 }}>{Math.floor(queueStatus.nextBatchIn / 60)}:{(queueStatus.nextBatchIn % 60).toString().padStart(2, '0')}</div>
                        </div>
                     )}
                   </div>

                   <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 32 }}>
                      <motion.div 
                        animate={{ width: `${(queueStatus.sent / queueStatus.total) * 100}%` }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }}
                      />
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Журнал відправки</div>
                      {queueStatus.batches.map((batch, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: batch.status === 'success' ? '#22c55e' : '#ef4444' }} />
                            <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{batch.time}</span>
                            <span style={{ fontSize: 12, color: '#6b6b8a' }}>Пакет {batch.count} осіб</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: batch.status === 'success' ? '#22c55e' : '#ef4444' }}>
                            {batch.status === 'success' ? `✅ Надіслано: ${batch.sent}` : `❌ Помилка: ${batch.error}`}
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
            </div>
          ) : activeTab === 'calculator' ? (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 950, color: '#fff', margin: 0 }}>🖩 Калькулятор собівартості</h1>
                <p style={{ fontSize: 14, color: '#6b6b8a', marginTop: 4 }}>Розрахуйте витрати на 3D друк з урахуванням амортизації та електрики</p>
              </div>
              <CalculatorComp />
            </div>
          ) : activeTab === 'marketing' ? (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <AdvertisingDashboard showToast={showToast} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a' }}>
              Тут будуть налаштування магазину
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={closeModal} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
              className="hide-scrollbar"
              style={{ position: 'relative', width: '100%', maxWidth: 500, background: '#0a192f', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 24 }}>{editingId ? 'Редагувати товар' : 'Новий товар'}</h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Simplified Gallery Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 28, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Галерея фотографій</label>
                    
                    <input 
                      type="file" id="gallery-file-upload" accept="image/*" hidden 
                      onChange={handleGalleryUpload}
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('gallery-file-upload').click()}
                      style={{ padding: '12px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px rgba(124,58,237,0.2)' }}
                    >
                      <Upload size={18} /> ЗАВАНТАЖИТИ ФОТО
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                    {[formData.image_url, ...(Array.isArray(formData.image_urls) ? formData.image_urls : [])].filter(Boolean).map((url, index) => {
                      const isMain = url === formData.image_url;
                      return (
                        <div key={index} style={{ position: 'relative', width: 100, height: 100, borderRadius: 16, border: isMain ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                          <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          


                          <button 
                            type="button"
                            onClick={() => {
                              const all = [formData.image_url, ...(formData.image_urls || [])].filter(Boolean);
                              const newMain = url;
                              const newExtra = all.filter(u => u !== newMain);
                              setFormData({...formData, image_url: newMain, image_urls: newExtra});
                            }}
                            style={{ position: 'absolute', top: 5, left: 5, width: 24, height: 24, borderRadius: '50%', background: isMain ? '#7c3aed' : 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            title="Зробити головним"
                          >
                            <Award size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (isMain) {
                                const extra = formData.image_urls || [];
                                setFormData({...formData, image_url: extra[0] || '', image_urls: extra.slice(1)});
                              } else {
                                setFormData({...formData, image_urls: formData.image_urls.filter(u => u !== url)});
                              }
                            }}
                            style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MakerWorld Import Section */}
                {!editingId && (
                  <div style={{ background: 'rgba(59,130,246,0.05)', padding: 20, borderRadius: 24, border: '1px solid rgba(59,130,246,0.1)', marginBottom: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 950, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>💨 Швидкий імпорт з MakerWorld</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input 
                        type="text" 
                        placeholder="Вставте посилання на модель..." 
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                      <button 
                        type="button"
                        onClick={handleImportFromMakerWorld}
                        disabled={isImporting}
                        style={{ padding: '12px 20px', borderRadius: 12, background: '#1e40af', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap', opacity: isImporting ? 0.5 : 1 }}
                      >
                        {isImporting ? 'ПАРСИНГ...' : 'ІМПОРТ'}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Назва</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Базова Ціна (₴)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Знижка (%)</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 34px 14px 14px', color: '#fff', outline: 'none', width: '100%' }} />
                      <Percent size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a4a6a' }} />
                    </div>
                  </div>
                </div>

                {/* ПРЕВ'Ю ФІНАЛЬНОЇ ЦІНИ */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.2)', borderRadius: 16, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b6b8a' }}>Фінальна ціна для клієнта:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{finalPricePreview} ₴</span>
                </div>

                {/* Опис та Примітки (Розділені) */}
                {(() => {
                  const parts = (formData.description || '').split('|||ADMIN_NOTES|||');
                  const publicDesc = parts[0]?.trim() || '';
                  const adminNotes = parts[1]?.trim() || '';
                  
                  return (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Опис (бачать клієнти)</label>

                        </div>
                        <textarea 
                          value={publicDesc} 
                          onChange={e => {
                            const newNotes = (formData.description || '').split('|||ADMIN_NOTES|||')[1] || '';
                            setFormData({...formData, description: `${e.target.value}\n\n|||ADMIN_NOTES|||\n${newNotes}`});
                          }} 
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', minHeight: 100, resize: 'vertical', fontSize: 13, lineHeight: 1.5 }} 
                          placeholder="Опис товару для магазину..."
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(59,130,246,0.05)', padding: '16px 20px', borderRadius: 24, border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calculator size={14} style={{ color: '#60a5fa' }} />
                            <label style={{ fontSize: 9, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Собівартість та Примітки (ADMIN)</label>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={10} /> ПЕРЕВІРЕНО
                          </div>
                        </div>

                        <textarea 
                          value={adminNotes} 
                          onChange={e => {
                            const newPublic = (formData.description || '').split('|||ADMIN_NOTES|||')[0] || '';
                            setFormData({...formData, description: `${newPublic}\n\n|||ADMIN_NOTES|||\n${e.target.value}`});
                          }} 
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, color: '#93c5fd', outline: 'none', height: 180, resize: 'none', fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace', borderLeft: '3px solid #3b82f6' }} 
                          placeholder="Тут будуть ваші розрахунки..."
                        />
                        
                        <p style={{ fontSize: 10, color: '#4a4a6a', margin: 0, fontStyle: 'italic' }}>
                          * Ці дані бачите тільки ви.
                        </p>
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Категорія</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none' }} />
                </div>
                
                <div style={{ 
                  display: 'flex', flexWrap: 'wrap', gap: 20, 
                  background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, 
                  border: '1px solid rgba(255,255,255,0.05)' 
                }}>
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Матеріал</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {['PLA', 'PETG', 'ABS', 'TPU'].map(p => (
                          <button key={p} type="button" onClick={() => setFormData({...formData, plastic_type: p})} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: formData.plastic_type === p ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={formData.plastic_type} onChange={e => setFormData({...formData, plastic_type: e.target.value})} placeholder="напр. PLA Пластик" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
                  </div>

                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Кольори</label>
                      <button type="button" onClick={() => setFormData({...formData, color: ''})} style={{ fontSize: 9, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>ОЧИСТИТИ</button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {['Червоний', 'Синій', 'Зелений', 'Жовтий', 'Білий', 'Чорний', 'Веселковий'].map(c => (
                        <button 
                          key={c} type="button" 
                          onClick={() => {
                            const current = formData.color ? formData.color.split(',').map(x => x.trim()).filter(Boolean) : [];
                            if (!current.includes(c)) setFormData({...formData, color: [...current, c].join(', ')});
                          }} 
                          style={{ fontSize: 9, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="напр. Червоний, Синій" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
                  </div>

                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Вага</label>
                    <input type="text" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="напр. 150г" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
                  </div>

                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Безпека</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {['Харчовий', 'Безпечний', 'Еко', '3+ роки'].map(s => (
                          <button key={s} type="button" onClick={() => setFormData({...formData, safety_info: s === 'Харчовий' ? 'Харчовий пластик' : s === 'Еко' ? 'Еко-матеріал' : s})} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: formData.safety_info?.includes(s) ? '#22c55e' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={formData.safety_info} onChange={e => setFormData({...formData, safety_info: e.target.value})} placeholder="напр. Харчовий пластик" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>3D Модель URL (.glb)</label>
                  <input type="text" value={formData.model_3d} onChange={e => setFormData({...formData, model_3d: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', outline: 'none', fontSize: 11 }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setFormData({...formData, is_trending: !formData.is_trending})}>
                  <div style={{ 
                    width: 44, height: 24, borderRadius: 20, background: formData.is_trending ? 'linear-gradient(135deg, #f97316, #ef4444)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, 
                      left: formData.is_trending ? 23 : 3, transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: formData.is_trending ? '#fff' : '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ТРЕНДОВИЙ ТОВАР 🔥
                  </span>
                </div>

                <button type="submit" style={{ marginTop: 10, padding: 16, borderRadius: 14, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>ЗБЕРЕГТИ ЗМІНИ</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Message Modal */}
      <AnimatePresence>
        {individualMessageModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div 
              onClick={() => setIndividualMessageModal({ ...individualMessageModal, open: false })}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 500, background: '#0a0a1a', borderRadius: 32, 
                border: '1px solid rgba(255,255,255,0.1)', padding: 40, boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Повідомлення клієнту</h3>
              <p style={{ fontSize: 14, color: '#6b6b8a', marginBottom: 32 }}>
                Отримувач: <span style={{ color: '#fff', fontWeight: 800 }}>{individualMessageModal.user?.first_name} {individualMessageModal.user?.last_name || ''}</span>
              </p>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', marginBottom: 12 }}>Зображення повідомлення</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {individualMessageModal.imageUrl ? (
                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={individualMessageModal.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setIndividualMessageModal(prev => ({ ...prev, imageUrl: '' }))}
                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ 
                      width: 80, height: 80, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', gap: 4, color: '#6b6b8a'
                    }}>
                      <Upload size={20} />
                      <span style={{ fontSize: 8, fontWeight: 800 }}>ФОТО</span>
                      <input type="file" hidden accept="image/*" onChange={(e) => handleMessageImageUpload(e, 'individual')} disabled={isUploadingMedia} />
                    </label>
                  )}
                  {isUploadingMedia && <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>Завантаження...</div>}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', marginBottom: 12 }}>Текст повідомлення</label>
                <textarea 
                  value={individualMessageModal.message}
                  onChange={(e) => setIndividualMessageModal({ ...individualMessageModal, message: e.target.value })}
                  placeholder="Ваше повідомлення..."
                  style={{ 
                    width: '100%', minHeight: 150, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16, padding: 20, color: '#fff', fontSize: 14, outline: 'none', resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setIndividualMessageModal({ ...individualMessageModal, open: false })}
                  style={{ flex: 1, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#6b6b8a', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                >
                  Скасувати
                </button>
                <button 
                  onClick={handleSendIndividualMessage}
                  disabled={individualMessageModal.isSending || !individualMessageModal.message.trim()}
                  style={{ 
                    flex: 1, padding: '16px', borderRadius: 16, border: 'none', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff',
                    opacity: (individualMessageModal.isSending || !individualMessageModal.message.trim()) ? 0.5 : 1,
                    boxShadow: '0 10px 20px rgba(124,58,237,0.3)'
                  }}
                >
                  {individualMessageModal.isSending ? 'ВІДПРАВКА...' : 'ВІДПРАВИТИ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Bonus Modal */}
      {bonusModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div 
            onClick={() => setBonusModal({ ...bonusModal, open: false })}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
          />
          <div style={{ 
            position: 'relative', width: '100%', maxWidth: 400, background: '#0a0a1a', borderRadius: 32, 
            border: '1px solid rgba(255,255,255,0.1)', padding: 40, boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Керування бонусами</h3>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 14, color: '#6b6b8a', margin: 0 }}>
                Клієнт: <span style={{ color: '#fff', fontWeight: 800 }}>{bonusModal.user?.first_name} {bonusModal.user?.last_name || ''}</span>
              </p>
              <p style={{ fontSize: 14, color: '#6b6b8a', margin: '4px 0 0 0' }}>
                Поточний баланс: <span style={{ color: '#f59e0b', fontWeight: 900 }}>{bonusModal.user?.bonuses || 0} ₴</span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, marginBottom: 24 }}>
              <button 
                onClick={() => setBonusModal({ ...bonusModal, mode: 'add' })}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  background: bonusModal.mode === 'add' ? '#7c3aed' : 'transparent',
                  color: bonusModal.mode === 'add' ? '#fff' : '#6b6b8a',
                  transition: 'all 0.2s'
                }}
              >
                Нарахувати (+)
              </button>
              <button 
                onClick={() => setBonusModal({ ...bonusModal, mode: 'sub' })}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  background: bonusModal.mode === 'sub' ? '#ef4444' : 'transparent',
                  color: bonusModal.mode === 'sub' ? '#fff' : '#6b6b8a',
                  transition: 'all 0.2s'
                }}
              >
                Списати (-)
              </button>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase', marginBottom: 12 }}>Кількість бонусів</label>
              <input 
                type="number"
                value={bonusModal.amount}
                onChange={(e) => setBonusModal({ ...bonusModal, amount: e.target.value })}
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '16px 20px', fontSize: 24, fontWeight: 900, color: '#fff', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setBonusModal({ ...bonusModal, open: false })}
                style={{ flex: 1, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#6b6b8a', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              >
                Скасувати
              </button>
              <button 
                onClick={confirmBonusUpdate}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: 16, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  background: bonusModal.mode === 'add' ? '#7c3aed' : '#ef4444',
                  color: '#fff', boxShadow: `0 8px 24px ${bonusModal.mode === 'add' ? 'rgba(124,58,237,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setDeleteConfirm({ open: false, id: null })} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: '#0a192f', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Trash2 size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Видалити товар?</h3>
              <p style={{ fontSize: 14, color: '#6b6b8a', lineHeight: 1.6, marginBottom: 24 }}>Ви впевнені, що хочете видалити цей товар назавжди? Цю дію неможливо буде скасувати.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button 
                  onClick={() => setDeleteConfirm({ open: false, id: null })}
                  style={{ padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
                >
                  СКАСУВАТИ
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm.id)}
                  style={{ padding: '14px 0', borderRadius: 14, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13, boxShadow: '0 8px 16px rgba(239,68,68,0.2)' }}
                >
                  ВИДАЛИТИ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Global Modal */}
      <AnimatePresence>
        {modal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal({ ...modal, open: false })}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 400, background: '#0a192f', borderRadius: 32, 
                border: '1px solid rgba(255,255,255,0.1)', padding: 40, textAlign: 'center',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px',
                background: modal.type === 'danger' ? 'rgba(239,68,68,0.1)' : modal.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: modal.type === 'danger' ? '#ef4444' : modal.type === 'success' ? '#22c55e' : '#7c3aed'
              }}>
                {modal.type === 'danger' ? <Trash2 size={32}/> : modal.type === 'success' ? <CheckCircle size={32}/> : <Bell size={32}/>}
              </div>
              
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12 }}>{modal.title}</h3>
              <p style={{ fontSize: 14, color: '#6b6b8a', lineHeight: 1.6, marginBottom: 32 }}>{modal.message}</p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setModal({ ...modal, open: false })}
                  style={{ flex: 1, padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  СКАСУВАТИ
                </button>
                {modal.onConfirm && (
                  <button 
                    onClick={modal.onConfirm}
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: 16, border: 'none', fontWeight: 900, cursor: 'pointer',
                      background: modal.type === 'danger' ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      color: '#fff'
                    }}
                  >
                    ПІДТВЕРДИТИ
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

function SidebarBtn({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: active ? 'var(--sidebar-active)' : 'transparent', color: active ? 'var(--text-accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
      {icon} {label}
    </button>
  );
}

function StatusBtn({ label, active, color, onClick, icon }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 800, 
        background: active ? color : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: active ? 'none' : '1px solid var(--border)',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: active ? `0 4px 12px ${color}40` : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      {icon}
      {label}
    </button>
  );
}

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
          width: '100%', background: 'rgba(0,0,0,0.3)', border: isOpen ? '1px solid #7c3aed' : '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', 
          color: '#fff', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
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
              background: '#0a192f', border: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: 12, 
              zIndex: inline ? 1002 : 1000, padding: 6, maxHeight: 200, overflowY: 'auto', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.5)'
            }}
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                style={{ 
                  padding: '8px 12px', fontSize: 12, color: '#fff', borderRadius: 8, cursor: 'pointer', 
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
