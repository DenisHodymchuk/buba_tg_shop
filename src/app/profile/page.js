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
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', padding: '20px 16px', paddingBottom: 40, fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronLeft size={20} color="#fff" />
          </div>
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Особистий кабінет</h1>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b6b8a', fontWeight: 800, fontSize: 13 }}>Завантаження...</p>
        </div>
      ) : !user ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 40, textAlign: 'center' }}>
          <User size={48} color="#4a4a6a" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Ви не авторизовані</h2>
          <p style={{ color: '#6b6b8a', fontSize: 13, marginBottom: 24 }}>Увійдіть через Telegram для доступу</p>
          <Link href="/" style={{ display: 'block', padding: 16, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: 16, color: '#fff', fontWeight: 900, textDecoration: 'none', fontSize: 13 }}>ПОВЕРНУТИСЬ</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User Info */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, boxShadow: '0 8px 16px rgba(124,58,237,0.2)' }}>
              {user.first_name?.[0]}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{user.first_name} {user.last_name}</h2>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ID: {user.tg_id}
              </p>
            </div>
          </div>

          {/* Stats Flex Grid */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20 }}>
              <Award size={20} color="#fbbf24" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 4 }}>{user.bonuses}</div>
              <div style={{ fontSize: 9, color: '#6b6b8a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>БОНУСИ</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20 }}>
              <Clock size={20} color="#7c3aed" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 4 }}>{orders.length}</div>
              <div style={{ fontSize: 9, color: '#6b6b8a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ЗАМОВЛЕНЬ</div>
            </div>
          </div>

          {/* Subscription */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: user.allow_notifications ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.allow_notifications ? <Bell size={20} color="#7c3aed" /> : <BellOff size={20} color="#4a4a6a" />}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Сповіщення</h3>
                <p style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 700, margin: '2px 0 0 0' }}>Новинки та акції в Telegram</p>
              </div>
            </div>
            <button 
              onClick={toggleNotifications}
              style={{ width: 48, height: 24, borderRadius: 100, background: user.allow_notifications ? '#7c3aed' : 'rgba(255,255,255,0.1)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: user.allow_notifications ? 27 : 3, transition: 'all 0.3s shadow 0.2s', boxShadow: user.allow_notifications ? '0 0 10px rgba(0,0,0,0.2)' : 'none' }} />
            </button>
          </div>

          {/* History */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Історія замовлень</h3>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#4a4a6a', textTransform: 'uppercase' }}>Всього: {orders.length}</span>
            </div>

            {orders.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 24, padding: 32, textAlign: 'center' }}>
                <p style={{ color: '#6b6b8a', fontSize: 13, fontWeight: 700, margin: 0 }}>Ще немає замовлень ✨</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>#{order.order_number?.split('-')[1] || order.id.slice(0, 6)}</div>
                      <div style={{ fontSize: 10, color: '#6b6b8a', fontWeight: 700 }}>
                        {new Date(order.created_at).toLocaleDateString()} • {order.shipping_method === 'nova_poshta' ? 'НП' : 'Самовивіз'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#7c3aed', marginBottom: 4 }}>{order.total} ₴</div>
                      {(() => {
                        const statusMap = {
                          'new': { label: 'Отримано', color: '#3b82f6' },
                          'preparing': { label: 'Підготовка', color: '#f59e0b' },
                          'printing': { label: 'Друкується', color: '#7c3aed' },
                          'shipping': { label: 'Відправлено', color: '#ec4899' },
                          'completed': { label: 'Виконано', color: '#22c55e' },
                          'cancelled': { label: 'Скасовано', color: '#ef4444' }
                        };
                        const s = statusMap[order.status] || { label: order.status, color: '#6b6b8a' };
                        return (
                          <div style={{ 
                            fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 8, 
                            background: `${s.color}15`,
                            color: s.color
                          }}>
                            {s.label}
                          </div>
                        );
                      })()}
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
