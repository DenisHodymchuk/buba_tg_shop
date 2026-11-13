'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, RefreshCw, LogOut, Link2, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

const MODEL_DEFAULTS = [
  { match: 'x1e', wattage: 350, wear: 12 },
  { match: 'x1', wattage: 350, wear: 10 },
  { match: 'p1', wattage: 350, wear: 8 },
  { match: 'a1 mini', wattage: 150, wear: 5 },
  { match: 'a1', wattage: 200, wear: 6 },
  { match: 'h2d', wattage: 450, wear: 14 }
];

function guessDefaults(modelName = '') {
  const lower = String(modelName).toLowerCase();
  const found = MODEL_DEFAULTS.find((m) => lower.includes(m.match));
  return found ? { wattage: found.wattage, wear: found.wear } : { wattage: 250, wear: 8 };
}

export default function BambuCloudPanel({ printers, savePrinters, showToast, isMobile, onDevicesUpdate }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [email, setEmail] = useState('');
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttError, setMqttError] = useState(null);
  const [devices, setDevices] = useState([]);

  const [showAuthForm, setShowAuthForm] = useState(false);
  const [step, setStep] = useState('login'); // 'login' | 'verify_code'
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCode, setFormCode] = useState('');
  const [region, setRegion] = useState('global');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/bambu/status', { cache: 'no-store' });
      const data = await res.json();
      setConnected(Boolean(data?.connected));
      setExpired(Boolean(data?.expired));
      if (data?.email) {
        setEmail(data.email);
        setFormEmail((prev) => prev || data.email);
      }
      setMqttConnected(Boolean(data?.mqttConnected));
      setMqttError(data?.mqttError || null);
      const list = Array.isArray(data?.devices) ? data.devices : [];
      setDevices(list);
      onDevicesUpdate?.(list);
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [onDevicesUpdate]);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      fetchStatus(false);
    }, 8000);
    return () => clearInterval(id);
  }, [connected, fetchStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/bambu/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: step === 'verify_code' ? 'verify_code' : 'login',
          email: formEmail,
          password: formPassword,
          code: formCode,
          region
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data?.error || 'Помилка авторизації Bambu Lab', 'error');
        return;
      }
      if (data?.step === 'verify_code') {
        setStep('verify_code');
        showToast?.('Код підтвердження надіслано на вашу пошту');
        return;
      }

      showToast?.('Bambu Cloud підключено!');
      setShowAuthForm(false);
      setStep('login');
      setFormPassword('');
      setFormCode('');
      await fetchStatus(true);
    } catch {
      showToast?.('Помилка з’єднання з сервером', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/bambu/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      setConnected(false);
      setDevices([]);
      onDevicesUpdate?.([]);
      showToast?.('Bambu Cloud відключено');
    } catch {
      showToast?.('Не вдалося відключити Bambu Cloud', 'error');
    }
  };

  const handleSyncPrinters = async () => {
    if (!devices.length) {
      showToast?.('У вашому акаунті Bambu не знайдено прив’язаних принтерів', 'error');
      return;
    }

    const updated = [...printers];
    let added = 0;
    let linked = 0;

    for (const dev of devices) {
      const existingBySn = updated.find((p) => p.serial_number && p.serial_number === dev.serial);
      if (existingBySn) continue;

      const existingUnlinkedByName = updated.find(
        (p) => !p.serial_number && dev.name && p.name && p.name.toLowerCase().includes(dev.name.toLowerCase())
      );

      if (existingUnlinkedByName) {
        existingUnlinkedByName.serial_number = dev.serial;
        linked++;
      } else {
        const defs = guessDefaults(dev.model || dev.name);
        updated.push({
          id: `bambu_${dev.serial}`,
          name: dev.name || dev.model || 'Bambu Lab',
          wattage: defs.wattage,
          wear: defs.wear,
          is_repair: false,
          ip_address: '',
          access_code: '',
          serial_number: dev.serial
        });
        added++;
      }
    }

    if (added === 0 && linked === 0) {
      showToast?.('Усі принтери Bambu вже синхронізовані');
      return;
    }

    await savePrinters(updated);
    showToast?.(`Синхронізовано: додано ${added}, прив’язано ${linked}`);
  };

  return (
    <div className="dusk-panel" style={{ padding: isMobile ? 14 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: connected ? 'rgba(147, 162, 250, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              border: connected ? '1px solid rgba(147, 162, 250, 0.35)' : '1px solid var(--color-rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: connected ? 'var(--color-accent)' : 'var(--color-muted)',
              flexShrink: 0
            }}
          >
            <Cloud size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)' }}>
                Bambu Cloud Live
              </span>
              {loading ? (
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Перевірка…</span>
              ) : connected ? (
                <span className={`dusk-badge ${mqttConnected ? 'dusk-badge--periwinkle' : 'dusk-badge--apricot'}`}>
                  <span className={`dusk-dot ${mqttConnected ? 'dusk-dot--periwinkle' : 'dusk-dot--apricot'}`} style={{ width: 5, height: 5 }} />
                  {mqttConnected ? 'MQTT підключено' : 'Хмара активна'}
                </span>
              ) : expired ? (
                <span className="dusk-badge dusk-badge--danger">Сесія закінчилась</span>
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Не підключено</span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
              {connected
                ? `${email || 'Bambu акаунт'} • знайдено пристроїв: ${devices.length}${mqttError ? ` • ${mqttError}` : ''}`
                : 'Підключіть акаунт Bambu Handy / Studio, щоб бачити живий статус друку'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {connected ? (
            <>
              <button
                type="button"
                onClick={handleSyncPrinters}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              >
                <Download size={13} /> Синхронізувати принтери
              </button>
              <button
                type="button"
                onClick={() => fetchStatus(true)}
                disabled={refreshing}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Оновити
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="dusk-btn dusk-btn--danger dusk-btn--sm"
              >
                <LogOut size={13} /> Відключити
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthForm((v) => !v)}
              className="dusk-btn dusk-btn--primary dusk-btn--sm"
            >
              <Link2 size={13} /> {showAuthForm ? 'Сховати' : 'Підключити Bambu Cloud'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!connected && showAuthForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <form
              onSubmit={handleLogin}
              style={{
                paddingTop: 14,
                marginTop: 14,
                borderTop: '1px solid var(--color-rule)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {step === 'login' ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.2fr 0.8fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Email акаунту Bambu Lab</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="dusk-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Пароль</label>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="dusk-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--color-muted)' }}>Регіон</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="dusk-input"
                    >
                      <option value="global">Global (EU/US)</option>
                      <option value="cn">China</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} />
                    <span>Bambu Lab надіслав 6-значний код підтвердження на <b>{formEmail}</b></span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="Введіть код з пошти (напр. 123456)"
                      className="dusk-input dusk-mono"
                      style={{ maxWidth: 260 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setStep('login'); setFormCode(''); }}
                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    >
                      Назад
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  Токен зберігається в Supabase settings; пароль ніде не зберігається.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="dusk-btn dusk-btn--primary dusk-btn--sm"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>{step === 'verify_code' ? 'Підтвердити код' : 'Увійти в Bambu Cloud'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
