"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Award, Clock, ChevronLeft } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background text-text p-4">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 bg-white/5 rounded-full border border-white/10">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Особистий кабінет</h1>
      </header>

      {loading ? (
        <div className="text-center py-10">Завантаження...</div>
      ) : !user ? (
        <div className="glass-card p-8 text-center">
          <User size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">Будь ласка, увійдіть через Telegram, щоб побачити свій профіль.</p>
          <button className="glass-button w-full">Авторизуватися</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold">
              {user.first_name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.first_name} {user.last_name}</h2>
              <p className="text-text-muted text-sm">@{user.username || 'user'}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 flex flex-col items-center text-center">
              <Award className="text-yellow-500 mb-2" size={24} />
              <div className="text-2xl font-bold">{user.bonuses}</div>
              <div className="text-xs text-text-muted uppercase">Бонусні бали</div>
            </div>
            <div className="glass-card p-4 flex flex-col items-center text-center">
              <Clock className="text-primary mb-2" size={24} />
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-xs text-text-muted uppercase">Замовлень</div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg px-2">Історія замовлень</h3>
            {orders.length === 0 ? (
              <p className="text-center py-10 text-text-muted">У вас ще немає замовлень</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold">Замовлення #{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{order.total} грн</div>
                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      order.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
