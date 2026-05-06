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
    if (!comment.trim() || submitting || !tgUser) return;

    setSubmitting(true);
    try {
      // Get internal customer ID
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('tg_id', tgUser.id.toString())
        .single();

      if (!customer) throw new Error('Customer not found');

      const { error } = await supabase
        .from('reviews')
        .insert({
          customer_id: customer.id,
          product_id: productId,
          rating,
          comment: comment.trim()
        });

      if (error) throw error;

      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
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
                      borderRadius: 16, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none'
                    }}
                  />
                  <button 
                    onClick={handleSubmit} disabled={!comment.trim() || submitting}
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
                      <p style={{ margin: 0, fontSize: 14, color: '#6b6b8a', lineHeight: 1.5 }}>{rev.comment}</p>
                      <div style={{ marginTop: 8, fontSize: 9, color: '#3a3a5a', fontWeight: 900, textTransform: 'uppercase' }}>
                        {new Date(rev.created_at).toLocaleDateString('uk-UA')}
                      </div>
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
