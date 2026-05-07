import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, X, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Reviews = ({ isOpen, onClose, productId = null, tgUser = null }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    }
  }, [isOpen, productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select('*, customers(first_name)')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting to submit review...', { comment, rating, tgUser });
    
    if (!comment.trim()) return alert('Будь ласка, введіть текст відгуку');
    if (submitting) return;
    if (!tgUser) return alert('Помилка: користувач Telegram не знайдений. Спробуйте перезапустити додаток.');

    setSubmitting(true);
    try {
      const tid = tgUser.id.toString();
      
      // First, ensure customer exists and get their ID
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('tg_id', tid)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let customerId;
      if (!customer) {
        console.log('Customer not found in DB, creating...');
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .upsert({ 
            tg_id: tid, 
            first_name: tgUser.first_name || 'Клієнт', 
            last_name: tgUser.last_name || '' 
          }, { onConflict: 'tg_id' })
          .select('id')
          .single();
        
        if (createError) throw createError;
        customerId = newCustomer.id;
      } else {
        customerId = customer.id;
      }

      console.log('Submitting review for customer ID:', customerId);

      const { error: submitError } = await supabase
        .from('reviews')
        .insert({
          customer_id: customerId,
          product_id: productId,
          rating,
          comment: comment.trim()
        });

      if (submitError) throw submitError;

      console.log('Review submitted successfully!');
      setComment('');
      setRating(5);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Помилка при відправці: ' + (err.message || 'невідома помилка'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: 450, background: '#0a0a1a', 
              borderRadius: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh', boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 950, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MessageSquare size={20} style={{ color: '#7c3aed' }} /> 
                  {productId ? 'Відгуки про товар' : 'Відгуки про магазин'}
                </h2>
                <p style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4 }}>Думка наших клієнтів дуже важлива</p>
              </div>
              <button 
                onClick={onClose}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {/* Form */}
              <div style={{ background: 'rgba(124,58,237,0.05)', borderRadius: 24, padding: 20, border: '1px solid rgba(124,58,237,0.1)', marginBottom: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} onClick={() => setRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Star 
                        size={28} 
                        fill={s <= rating ? '#facc15' : 'none'} 
                        color={s <= rating ? '#facc15' : '#4a4a6a'} 
                        style={{ filter: s <= rating ? 'drop-shadow(0 0 8px rgba(250,204,21,0.4))' : 'none', transition: 'all 0.2s' }}
                      />
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Ваш відгук..."
                    style={{ 
                      width: '100%', minHeight: 80, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none',
                      transition: 'all 0.3s'
                    }}
                  />
                  <AnimatePresence>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.9)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, zIndex: 10 }}
                      >
                        ДЯКУЄМО ЗА ВІДГУК! ✨
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={handleSubmit} disabled={!comment.trim() || submitting || success}
                    style={{ 
                      position: 'absolute', bottom: 10, right: 10, width: 40, height: 40, borderRadius: 12,
                      background: comment.trim() ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
                      border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.3s', opacity: submitting ? 0.5 : 1
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#4a4a6a', fontSize: 14 }}>Завантаження...</div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#4a4a6a' }}>
                    <Star size={40} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                    <div style={{ fontSize: 14 }}>Будьте першим, хто залишить відгук!</div>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="#fff" />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{rev.customers?.first_name || 'Клієнт'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} fill={s <= rev.rating ? '#facc15' : 'none'} color={s <= rev.rating ? '#facc15' : '#4a4a6a'} />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{rev.comment}</p>
                      <div style={{ marginTop: 8, fontSize: 9, color: '#4a4a6a', fontWeight: 900, textTransform: 'uppercase' }}>
                        {new Date(rev.created_at).toLocaleDateString('uk-UA')}
                      </div>

                      {rev.admin_reply && (
                        <div style={{ marginTop: 16, background: 'rgba(124,58,237,0.05)', borderLeft: '2px solid #7c3aed', padding: '12px 16px', borderRadius: '0 16px 16px 0', position: 'relative' }}>
                          <div style={{ fontSize: 9, fontWeight: 950, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MessageSquare size={8} color="#fff" fill="#fff" />
                            </div>
                            ВІДПОВІДЬ МАГАЗИНУ
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#a78bfa', lineHeight: 1.4 }}>{rev.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Reviews;
