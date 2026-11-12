'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Copy, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatPhoneForLabel(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  let local = digits;
  if (local.startsWith('380') && local.length === 12) {
    local = '0' + local.slice(3);
  }
  if (local.length === 10 && local.startsWith('0')) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }
  return String(raw).trim();
}

function formatShortWarehouse(raw) {
  const str = String(raw || '').trim();
  if (!str) return '';

  const isPostomat = /поштомат/i.test(str);
  const isBranch = /відділен|пункт/i.test(str);
  const numMatch = str.match(/(?:№|#)\s*([0-9]+(?:\/[0-9]+)?)/) || str.match(/\b([0-9]+(?:\/[0-9]+)?)\b/);

  if (isPostomat && numMatch) {
    return `Поштомат №${numMatch[1]}`;
  }
  if (isBranch && numMatch) {
    return `Відділення №${numMatch[1]}`;
  }
  if (/^\d+$/.test(str)) {
    return `Відділення №${str}`;
  }

  return str.split(':')[0].replace(/\([^)]*кг[^)]*\)/gi, '').trim();
}

export function buildLabelText(order) {
  if (!order) return '';
  const details = order.shipping_details || {};

  const fullName =
    `${details.firstName || ''} ${details.lastName || ''}`.trim() ||
    `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() ||
    order.client_name ||
    'Клієнт';

  const phone = formatPhoneForLabel(details.phone || order.customers?.phone || order.phone || '');

  const city = String(details.city || order.city || '').split(',')[0].trim();
  const branch = formatShortWarehouse(details.warehouse || details.address || order.warehouse || '');
  const address = [city, branch].filter(Boolean).join(', ');

  const totalAmount = Number(order.total) || Number(order.total_amount) || 0;
  const prepay = Number(details.prepayment_amount) || 0;
  let paymentLine = 'Сплачено';
  if (details.is_cod) {
    const cod = Number(details.cod_amount) || Math.max(0, totalAmount - prepay) || totalAmount;
    paymentLine = `Наложка: ${Math.round(cod)} грн`;
  } else if (order.payment_status === 'paid') {
    paymentLine = 'Сплачено';
  } else if (totalAmount > 0) {
    const rest = Math.max(0, totalAmount - prepay);
    paymentLine = rest > 0 ? `Наложка: ${Math.round(rest)} грн` : 'Сплачено';
  }

  return [
    fullName,
    phone || 'Телефон не вказано',
    address || 'Адреса не вказана',
    paymentLine
  ].join('\n');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function LabelPrintModal({ order, onClose, showToast }) {
  const [labelText, setLabelText] = useState('');
  const [copied, setCopied] = useState(false);
  const [fontScale, setFontScale] = useState('normal'); // 'normal' | 'compact'

  useEffect(() => {
    if (order) {
      setLabelText(buildLabelText(order));
      setCopied(false);
    }
  }, [order]);

  const handlePrint = () => {
    const rawLines = labelText.split('\n');
    const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0);
    const htmlLines = (lines.length > 0 ? lines : [' '])
      .map((line, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === lines.length - 1;
        const isSecond = idx === 1 && !isLast;
        const cls = isFirst
          ? 'line line--name'
          : isLast
          ? 'line line--pay'
          : isSecond
          ? 'line line--phone'
          : 'line line--address';
        return `<div class="${cls}">${escapeHtml(line || ' ')}</div>`;
      })
      .join('');

    const isCompact = fontScale === 'compact';
    const nameSize = isCompact ? '11pt' : '12.5pt';
    const phoneSize = isCompact ? '10pt' : '11pt';
    const addrSize = isCompact ? '8.5pt' : '9.5pt';
    const paySize = isCompact ? '12pt' : '13.5pt';

    const printHtml = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>Наклейка 58x40</title>
  <style>
    @page {
      size: 58mm 40mm;
      margin: 0;
    }
    @media print {
      @page {
        size: 58mm 40mm;
        margin: 0;
      }
      html, body {
        width: 58mm !important;
        height: 40mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 58mm;
      height: 40mm;
      max-width: 58mm;
      max-height: 40mm;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      width: 58mm;
      height: 40mm;
      max-width: 58mm;
      max-height: 40mm;
      padding: 1.5mm 2.2mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.8mm;
      overflow: hidden;
    }
    .line {
      font-size: ${addrSize};
      line-height: 1.15;
      color: #000;
      word-break: break-word;
    }
    .line--name {
      font-size: ${nameSize};
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: -0.1px;
    }
    .line--phone {
      font-size: ${phoneSize};
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: 0.2px;
    }
    .line--address {
      font-size: ${addrSize};
      font-weight: 500;
      line-height: 1.16;
    }
    .line--pay {
      font-size: ${paySize};
      font-weight: 800;
      line-height: 1.1;
      border-top: 0.4mm solid #000;
      padding-top: 0.8mm;
      margin-top: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }
  </style>
</head>
<body>
  <div class="label">${htmlLines}</div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
        }, 1200);
      }, 150);
    } else {
      iframe.remove();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(labelText);
    setCopied(true);
    showToast?.('Текст наклейки скопійовано!');
    setTimeout(() => setCopied(false), 1800);
  };

  if (typeof document === 'undefined') return null;

  const rawPreviewLines = labelText.split('\n');
  const previewLines = rawPreviewLines.length > 0 ? rawPreviewLines : [' '];

  return createPortal(
    <AnimatePresence>
      {order && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10050,
            background: 'oklch(10% 0.015 268 / 0.80)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="dusk-panel"
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--color-rule)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '13px 16px',
              background: 'var(--color-paper-2)',
              borderBottom: '1px solid var(--color-rule)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'var(--color-accent-soft)',
                  border: '1px solid var(--color-accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)'
                }}>
                  <Printer size={15} />
                </div>
                <div>
                  <h3 className="dusk-heading" style={{ fontSize: 15, margin: 0 }}>
                    Наклейка 58 × 40 мм
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                    {order.order_code ? `#${order.order_code}` : 'Термоетикетка'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Realistic 58x40mm Label Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 290 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    58 × 40 мм
                  </span>
                  <div style={{ display: 'inline-flex', background: 'var(--color-paper-2)', padding: 2, borderRadius: 7, border: '1px solid var(--color-rule)' }}>
                    <button
                      type="button"
                      onClick={() => setFontScale('normal')}
                      style={{
                        border: 'none',
                        background: fontScale === 'normal' ? 'var(--color-accent-soft)' : 'transparent',
                        color: fontScale === 'normal' ? 'var(--color-accent)' : 'var(--color-muted)',
                        fontSize: 10.5,
                        fontWeight: 650,
                        padding: '2px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Звичайний
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontScale('compact')}
                      style={{
                        border: 'none',
                        background: fontScale === 'compact' ? 'var(--color-accent-soft)' : 'transparent',
                        color: fontScale === 'compact' ? 'var(--color-accent)' : 'var(--color-muted)',
                        fontSize: 10.5,
                        fontWeight: 650,
                        padding: '2px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Компактний
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    maxWidth: 290,
                    aspectRatio: '58 / 40',
                    background: '#ffffff',
                    color: '#111111',
                    borderRadius: 8,
                    padding: '8px 11px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: 3,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    overflow: 'hidden'
                  }}
                >
                  {previewLines.map((line, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === previewLines.length - 1;
                    const isSecond = idx === 1 && !isLast;
                    const isCompact = fontScale === 'compact';
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: isFirst
                            ? (isCompact ? 13.5 : 15.5)
                            : isLast
                            ? (isCompact ? 14 : 16)
                            : isSecond
                            ? (isCompact ? 12 : 13.5)
                            : (isCompact ? 10.5 : 11.5),
                          fontWeight: isFirst || isLast || isSecond ? 700 : 500,
                          lineHeight: 1.14,
                          color: '#111111',
                          wordBreak: 'break-word',
                          whiteSpace: isLast ? 'nowrap' : 'normal',
                          overflow: isLast ? 'hidden' : 'visible',
                          textOverflow: isLast ? 'ellipsis' : 'clip',
                          letterSpacing: isSecond ? '0.2px' : '-0.1px',
                          ...(isLast
                            ? { borderTop: '1.5px solid #222', paddingTop: 4, marginTop: 'auto' }
                            : {})
                        }}
                      >
                        {line || '\u00A0'}
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'center', marginTop: 2 }}>
                  💡 У діалозі друку виберіть «Поля: Немає» (Margins: None)
                </span>
              </div>

              {/* Editable Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)' }}>
                    Текст наклейки (можна редагувати)
                  </label>
                  <button
                    type="button"
                    onClick={() => setLabelText(buildLabelText(order))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <RotateCcw size={11} /> Скинути
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  className="dusk-input"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: 96,
                    padding: '10px 12px',
                    fontSize: 13,
                    lineHeight: 1.45,
                    resize: 'vertical',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="dusk-btn dusk-btn--ghost"
                  style={{ height: 38, padding: '0 14px', justifyContent: 'center' }}
                >
                  {copied ? <Check size={15} style={{ color: 'var(--color-accent)' }} /> : <Copy size={15} />}
                  <span>{copied ? 'Скопійовано' : 'Копіювати'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="dusk-btn dusk-btn--primary"
                  style={{ flex: 1, height: 38, justifyContent: 'center', fontSize: 13 }}
                >
                  <Printer size={15} />
                  <span>Надрукувати 58×40</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
