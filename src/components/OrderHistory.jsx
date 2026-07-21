"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Clock, Truck, CheckCircle2, XCircle, Search, Box } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OrderHistory({ isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  useEffect(() => {
    async function fetchMyOrders() {
      if (!supabase) return;
      const phone = localStorage.getItem('buba_customer_phone');
      if (!phone) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .contains('shipping_details', { phone: phone })
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data);
      } catch (e) {
        console.error('Error fetching my orders:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMyOrders();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'new': return { label: 'Нове', color: '#3b82f6', icon: <Clock size={14}/> };
      case 'printing': return { label: 'Друкується', color: '#7c3aed', icon: <Box size={14}/> };
      case 'shipping': return { label: 'Готово до відправки', color: '#ec4899', icon: <Truck size={14}/> };
      case 'shipped': return { label: 'Відправлено поштою', color: '#10b981', icon: <Truck size={14}/> };
      case 'completed': return { label: 'Виконано', color: '#22c55e', icon: <CheckCircle2 size={14}/> };
      case 'cancelled': return { label: 'Скасовано', color: '#ef4444', icon: <XCircle size={14}/> };
      default: return { label: status, color: '#6b6b8a', icon: <Clock size={14}/> };
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: '#05050f', display: 'flex', flexDirection: 'column'
      }}
    >
      <header style={{
        padding: '20px 16px', background: 'rgba(5,5,15,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Мої Замовлення</h2>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b6b8a', marginTop: 40 }}>Завантаження...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#3a3a5a' }}>
              <Package size={32} />
            </div>
            <p style={{ color: '#6b6b8a', fontWeight: 700, fontSize: 14 }}>У вас поки немає замовлень</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => {
              const status = getStatusInfo(order.status);
              return (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 24, padding: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{order.order_number || `#${order.id.slice(0,8)}`}</div>
                      <div style={{ fontSize: 10, color: '#4a4a6a', marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString('uk-UA')}</div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      borderRadius: 10, background: `${status.color}15`, color: status.color,
                      fontSize: 11, fontWeight: 900, textTransform: 'uppercase'
                    }}>
                      {status.icon}
                      {status.label}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 12, color: '#6b6b8a' }}>{order.shipping_details?.items?.length || 0} товари</div>
                    <div style={{ fontSize: 18, fontWeight: 950, color: '#2dd4bf' }}>{order.total} ₴</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
