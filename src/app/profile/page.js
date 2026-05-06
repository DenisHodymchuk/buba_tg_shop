"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Award, Clock, ChevronLeft, Bell, BellOff } from 'lucide-react';
import Link from 'next/link';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real TMA, we'd use webApp.initDataUnsafe.user.id
    // to fetch the customer from Supabase.
    async function fetchUserData() {
      if (typeof window !== 'undefined' && window?.Telegram?.WebApp) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser) {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('tg_id', tgUser.id)
            .single();
          
          if (data) setUser(data);
          
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', data?.id)
            .order('created_at', { ascending: false });
          
          if (orderData) setOrders(orderData);
        }
      }
      setLoading(false);
    }
    fetchUserData();
  }, []);

  const toggleNotifications = async () => {
    if (!user) return;
    const newVal = !user.allow_notifications;
    const { error } = await supabase
      .from('customers')
      .update({ allow_notifications: newVal })
      .eq('id', user.id);
    
    if (!error) {
      setUser({ ...user, allow_notifications: newVal });
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-5 pb-10">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 active:scale-95 transition-all">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Особистий кабінет</h1>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[#6b6b8a] font-bold text-sm">Завантаження профілю...</p>
        </div>
      ) : !user ? (
        <div className="glass-card p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <User size={40} className="text-[#4a4a6a]" />
          </div>
          <h2 className="text-lg font-black mb-2">Ви не авторизовані</h2>
          <p className="text-[#6b6b8a] text-sm mb-8">Будь ласка, відкрийте додаток через Telegram, щоб отримати доступ до кабінету.</p>
          <Link href="/" className="btn-gradient w-full text-center">ПОВЕРНУТИСЬ В МАГАЗИН</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-10 -mt-10" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
              {user.first_name?.[0]}
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-black leading-tight">{user.first_name} {user.last_name}</h2>
              <p className="text-[#a78bfa] font-black text-xs uppercase tracking-widest mt-1">
                @{user.username || (user.first_name?.toLowerCase() || 'user')}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 flex flex-col items-start relative overflow-hidden">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 mb-4">
                <Award size={24} />
              </div>
              <div className="text-3xl font-black mb-1">{user.bonuses}</div>
              <div className="text-[10px] text-[#6b6b8a] uppercase font-black tracking-widest">Монет балансу</div>
            </div>
            
            <div className="glass-card p-5 flex flex-col items-start relative overflow-hidden">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <Clock size={24} />
              </div>
              <div className="text-3xl font-black mb-1">{orders.length}</div>
              <div className="text-[10px] text-[#6b6b8a] uppercase font-black tracking-widest">Замовлень</div>
            </div>
          </div>

          {/* Notifications Subscription */}
          <div className="glass-card p-5 flex items-center justify-between border-dashed border-primary/30">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${user.allow_notifications ? 'bg-primary/20 text-primary' : 'bg-white/5 text-[#4a4a6a]'}`}>
                {user.allow_notifications ? <Bell size={24} className="animate-pulse" /> : <BellOff size={24} />}
              </div>
              <div>
                <h3 className="font-black text-sm">Сповіщення</h3>
                <p className="text-[10px] text-[#6b6b8a] font-bold">Новинки та акції в Telegram</p>
              </div>
            </div>
            <button 
              onClick={toggleNotifications}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${user.allow_notifications ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${user.allow_notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Orders Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-black text-lg tracking-tight">Історія замовлень</h3>
              <div className="text-[10px] font-black text-[#4a4a6a] uppercase">Всього: {orders.length}</div>
            </div>
            
            {orders.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <p className="text-[#6b6b8a] font-bold text-sm">У вас ще немає замовлень. <br/>Час це виправити! ✨</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="glass-card p-4 flex justify-between items-center group active:scale-[0.98] transition-all">
                    <div className="flex flex-col gap-1">
                      <div className="font-black text-sm">Замовлення #{order.order_number?.split('-')[1] || order.id.slice(0, 6)}</div>
                      <div className="text-[10px] font-bold text-[#6b6b8a] flex items-center gap-2">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span>{order.shipping_method === 'nova_poshta' ? 'Нова Пошта' : 'Самовивіз'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-primary mb-1">{order.total} ₴</div>
                      <div className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg inline-block ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {
                          order.status === 'completed' ? 'Виконано' : 
                          order.status === 'new' ? 'Нове' :
                          order.status === 'preparing' ? 'Підготовка' :
                          order.status === 'shipping' ? 'В дорозі' : order.status
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
