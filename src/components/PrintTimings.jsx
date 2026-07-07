"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Copy, Plus, Trash2, CheckCircle2, RefreshCw, AlertCircle, ChevronUp, ChevronDown, Check } from 'lucide-react';

// Pluralize helper for Ukrainian nouns
const getUkrainianPlural = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.endsWith('альманах')) {
    return trimmed.slice(0, -8) + (trimmed.endsWith('Альманах') ? 'Альманахів' : 'альманахів');
  }
  if (lower.endsWith('підставка')) {
    return trimmed.slice(0, -9) + (trimmed.endsWith('Підставка') ? 'Підставок' : 'підставок');
  }
  if (lower.endsWith('банка')) {
    return trimmed.slice(0, -5) + (trimmed.endsWith('Банка') ? 'Банок' : 'банок');
  }
  if (lower.endsWith('ка')) {
    return trimmed.slice(0, -2) + 'ок';
  }
  if (lower.endsWith('х')) {
    return trimmed + 'ів';
  }
  if (lower.endsWith('а')) {
    return trimmed.slice(0, -1) + 'ок';
  }
  if (lower.endsWith('я')) {
    return trimmed.slice(0, -1) + 'й';
  }
  if (lower.endsWith('о')) {
    return trimmed.slice(0, -1) + 'а';
  }
  return trimmed;
};

// Formatter for Ukrainian item description based on quantity
const formatItemDescription = (name, quantity) => {
  if (!name) return 'невідомий виріб';
  
  // Lowercase the first letter for natural sentence structure
  let normalized = name.trim();
  if (normalized) {
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  }
  
  if (quantity > 1) {
    const pluralName = getUkrainianPlural(normalized);
    
    // Choose appropriate Ukrainian word for "piece/quantity" (штука, штуки, штук)
    let qtyWord = 'штук';
    const lastDigit = quantity % 10;
    const lastTwoDigits = quantity % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      qtyWord = 'штука';
    } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
      qtyWord = 'штуки';
    }
    
    return `партія ${pluralName} (${quantity} ${qtyWord})`;
  }
  
  return normalized;
};

// Smart time formatter according to Ukrainian phrasing
const formatFinishTime = (date) => {
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`;
  
  if (dateDay.getTime() === today.getTime()) {
    // Today: "18.30"
    return formattedTime;
  } else if (dateDay.getTime() === tomorrow.getTime()) {
    // Tomorrow: check if morning (5:00 - 11:59)
    if (hours >= 5 && hours < 12) {
      if (minutes === 0) {
        return `${hours} ранку`;
      }
      return `${hours}.${minutes.toString().padStart(2, '0')} ранку`;
    } else {
      return `завтра о ${formattedTime}`;
    }
  } else {
    // Other days
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month} о ${formattedTime}`;
  }
};

export default function PrintTimings({ orders, printers = [], isMobile, showToast }) {
  const [lines, setLines] = useState([]);
  const [hasEdits, setHasEdits] = useState(false);
  const [copied, setCopied] = useState(false);
  const [includePrinterName, setIncludePrinterName] = useState(true);

  // Generate the active prints timeline list
  const activePrints = useMemo(() => {
    const list = [];
    const loads = {};
    
    // Track printer details
    printers.forEach(p => {
      loads[p.name] = { printer: p, order: null, remainingMinutes: 0, percentElapsed: 0, status: p.is_repair ? 'repair' : 'free' };
    });

    // Match printing orders with assigned printers
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

    // Create readable entries for printers that are printing
    Object.values(loads).forEach(load => {
      if (load.status === 'printing' && load.order) {
        const items = load.order.shipping_details?.items || [];
        
        // Format printed items
        let itemsDescription = 'виріб';
        if (items.length > 0) {
          itemsDescription = items.map(item => formatItemDescription(item.name, item.quantity)).join(' та ');
        }

        const finishDate = new Date(Date.now() + load.remainingMinutes * 60 * 1000);
        const timeStr = formatFinishTime(finishDate);
        const descriptionStr = `завершується друкуватись ${itemsDescription}`;

        list.push({
          id: `auto-${load.printer.id}-${load.order.id}`,
          time: timeStr,
          description: descriptionStr,
          printerName: load.printer.name,
          isCustom: false,
          finishDate: finishDate.getTime()
        });
      }
    });

    // Sort chronologically by finish date
    return list.sort((a, b) => a.finishDate - b.finishDate);
  }, [orders, printers]);

  // Synchronize local lines with active prints from the database on mount or when count changes
  useEffect(() => {
    if (!hasEdits) {
      setLines(activePrints.map(p => ({
        id: p.id,
        time: p.time,
        description: p.description,
        printerName: p.printerName,
        isCustom: false
      })));
    }
  }, [activePrints, hasEdits]);

  // Manual reset to pull fresh database entries and discard edits
  const handleReset = () => {
    setLines(activePrints.map(p => ({
      id: p.id,
      time: p.time,
      description: p.description,
      printerName: p.printerName,
      isCustom: false
    })));
    setHasEdits(false);
    if (showToast) showToast('Таймінги синхронізовано з базою', 'info');
  };

  // Change single row value
  const handleLineChange = (id, field, value) => {
    setLines(prev => prev.map(line => line.id === id ? { ...line, [field]: value } : line));
    setHasEdits(true);
  };

  // Delete single row from timeline
  const handleDeleteLine = (id) => {
    setLines(prev => prev.filter(line => line.id !== id));
    setHasEdits(true);
  };

  // Add empty custom row
  const handleAddCustomLine = () => {
    const newLine = {
      id: `custom-${Date.now()}`,
      time: '',
      description: '',
      printerName: '',
      isCustom: true
    };
    setLines(prev => [...prev, newLine]);
    setHasEdits(true);
  };

  // Generate plain text payload
  const formattedText = useMemo(() => {
    if (lines.length === 0) return 'Немає активних друків';
    
    const linesStr = lines.map(line => {
      const printerSuffix = includePrinterName && line.printerName ? ` (${line.printerName.replace('Bambu Lab ', '')})` : '';
      return `${line.time || '⏳'} - ${line.description || '...'}${printerSuffix}`;
    }).join('\n');

    return `Таймінги друку\n\n${linesStr}`;
  }, [lines, includePrinterName]);

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    if (showToast) showToast('Таймінги скопійовано в буфер! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Reorder lines
  const moveLine = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lines.length) return;
    
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setLines(updated);
    setHasEdits(true);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: isMobile ? 18 : 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'rgba(167,139,250,0.1)',
            color: '#a78bfa',
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Таймінги друку</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Автоматичний розрахунок і швидкий експорт у Telegram</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasEdits && (
            <button
              onClick={handleReset}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              title="Скинути редагування та завантажити свіжі дані з бази"
            >
              <RefreshCw size={12} />
              Скинути зміни
            </button>
          )}
          
          <button
            onClick={handleCopyToClipboard}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: copied ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Скопійовано! ✅' : 'Скопіювати для Telegram 📋'}
          </button>
        </div>
      </div>

      {/* Editor Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            color: 'var(--text-muted)',
            fontSize: 12,
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={20} style={{ color: 'var(--text-muted)' }} />
            <span>Немає активних друків в черзі. Натисніть "+ Додати рядок" або призначте замовлення на принтер.</span>
          </div>
        ) : (
          lines.map((line, index) => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.15)',
                padding: '6px 12px',
                borderRadius: 12,
                border: '1px solid var(--border)'
              }}
            >
              {/* Drag/Reorder buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => moveLine(index, -1)}
                  disabled={index === 0}
                  style={{
                    background: 'transparent', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.05)' : 'var(--text-muted)',
                    cursor: index === 0 ? 'not-allowed' : 'pointer', padding: 2, display: 'flex'
                  }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveLine(index, 1)}
                  disabled={index === lines.length - 1}
                  style={{
                    background: 'transparent', border: 'none', color: index === lines.length - 1 ? 'rgba(255,255,255,0.05)' : 'var(--text-muted)',
                    cursor: index === lines.length - 1 ? 'not-allowed' : 'pointer', padding: 2, display: 'flex'
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Time Input */}
              <input
                type="text"
                placeholder="18.30"
                value={line.time}
                onChange={(e) => handleLineChange(line.id, 'time', e.target.value)}
                style={{
                  width: isMobile ? 80 : 100,
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 900,
                  outline: 'none',
                  textAlign: 'center'
                }}
              />

              {/* Separator symbol */}
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>

              {/* Description Input */}
              <input
                type="text"
                placeholder="завершується друкуватись партія Альманахів (3 штуки)"
                value={line.description}
                onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: 12,
                  outline: 'none'
                }}
              />

              {/* Printer Tag or Custom Label */}
              {line.printerName && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#a78bfa',
                  background: 'rgba(167,139,250,0.08)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  display: isMobile ? 'none' : 'inline'
                }}>
                  {line.printerName.replace('Bambu Lab ', '')}
                </span>
              )}

              {line.isCustom && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#2dd4bf',
                  background: 'rgba(45,212,191,0.08)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  display: isMobile ? 'none' : 'inline'
                }}>
                  вручну
                </span>
              )}

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteLine(line.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239,68,68,0.7)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'}
                title="Видалити рядок з виводу"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Controls & Formatting Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
        <button
          onClick={handleAddCustomLine}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            background: 'rgba(124,58,237,0.1)',
            color: '#a78bfa',
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s'
          }}
        >
          <Plus size={14} />
          Додати рядок
        </button>

        {lines.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={includePrinterName}
              onChange={(e) => setIncludePrinterName(e.target.checked)}
              style={{
                width: 14,
                height: 14,
                accentColor: '#7c3aed',
                cursor: 'pointer'
              }}
            />
            Додавати назву принтера в дужках (напр. X1C)
          </label>
        )}
      </div>

      {/* Text Preview */}
      {lines.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Попередній перегляд повідомлення Telegram:
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            padding: 14,
            fontSize: 12,
            color: '#c7d2fe',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5
          }}>
            {formattedText}
          </div>
        </div>
      )}
    </div>
  );
}
