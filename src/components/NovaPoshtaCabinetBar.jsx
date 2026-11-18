'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Settings, FileSpreadsheet, Printer, PlusCircle,
  Loader2, CheckCircle2, LogOut, RefreshCw, ChevronDown, KeyRound
} from 'lucide-react';

export default function NovaPoshtaCabinetBar({
  filteredOrders = [],
  orders = [],
  setOrders,
  showToast,
  isMobile,
  onStatusLoaded
}) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [config, setConfig] = useState({
    senderName: '',
    contactSenderRef: '',
    senderPhone: '',
    contacts: [],
    citySenderRef: '',
    citySenderName: '',
    senderWarehouseRef: '',
    senderWarehouseName: '',
    defaultWeight: 1,
    defaultLength: 20,
    defaultWidth: 20,
    defaultHeight: 15,
    defaultDescription: 'Сувенірна продукція',
    defaultPayerType: 'Recipient'
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showRegistries, setShowRegistries] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sender city/warehouse autocomplete
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouseResults, setWarehouseResults] = useState([]);
  const [showWhDropdown, setShowWhDropdown] = useState(false);
  const [loadingWh, setLoadingWh] = useState(false);

  // Batch operations & registries
  const [batchCreating, setBatchCreating] = useState(false);
  const [creatingRegistry, setCreatingRegistry] = useState(false);
  const [registries, setRegistries] = useState([]);
  const [loadingRegistries, setLoadingRegistries] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/novaposhta/config', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setConnected(Boolean(data.connected));
        setReady(Boolean(data.ready));
        setMaskedKey(data.maskedKey || '');
        if (data.config) {
          setConfig((prev) => ({ ...prev, ...data.config }));
          setCityQuery(data.config.citySenderName || '');
          setWarehouseQuery(data.config.senderWarehouseName || '');
        }
        onStatusLoaded?.({ connected: Boolean(data.connected), ready: Boolean(data.ready) });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [onStatusLoaded]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // City search for sender
  useEffect(() => {
    if (!showSettings || !connected) return;
    if (cityQuery.trim().length < 2 || cityQuery === config.citySenderName) {
      setCityResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/novaposhta/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'searchCities', query: cityQuery })
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.data)) {
          setCityResults(data.data);
          setShowCityDropdown(true);
        }
      } catch (_) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, config.citySenderName, showSettings, connected]);

  // Warehouse search for sender
  useEffect(() => {
    if (!showSettings || !connected || !config.citySenderRef) return;
    if (warehouseQuery === config.senderWarehouseName && warehouseResults.length > 0) return;
    const timer = setTimeout(async () => {
      setLoadingWh(true);
      try {
        const res = await fetch('/api/novaposhta/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getWarehouses',
            cityRef: config.citySenderRef,
            search: warehouseQuery === config.senderWarehouseName ? '' : warehouseQuery
          })
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.data)) {
          setWarehouseResults(data.data);
        }
      } catch (_) {}
      finally {
        setLoadingWh(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [warehouseQuery, config.citySenderRef, config.senderWarehouseName, showSettings, connected]);

  const handleConnectKey = async () => {
    if (!apiKeyInput.trim()) {
      showToast?.('Вставте API-ключ із кабінету Нової Пошти', 'error');
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/novaposhta/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', apiKey: apiKeyInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || 'Невірний API-ключ Нової Пошти', 'error');
        return;
      }
      setConnected(true);
      setReady(Boolean(data.ready));
      setMaskedKey(data.maskedKey || '');
      if (data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
        setCityQuery(data.config.citySenderName || '');
        setWarehouseQuery(data.config.senderWarehouseName || '');
      }
      setApiKeyInput('');
      onStatusLoaded?.({ connected: true, ready: Boolean(data.ready) });
      showToast?.(`Кабінет НП підключено (${data.config?.senderName || 'відправник знайдений'}). Оберіть місто та відділення відправки.`, 'success');
    } catch (e) {
      showToast?.('Помилка з’єднання з сервером', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/novaposhta/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          contactSenderRef: config.contactSenderRef,
          senderPhone: config.senderPhone,
          citySenderRef: config.citySenderRef,
          citySenderName: config.citySenderName || cityQuery,
          senderWarehouseRef: config.senderWarehouseRef,
          senderWarehouseName: config.senderWarehouseName || warehouseQuery,
          defaultWeight: Number(config.defaultWeight) || 1,
          defaultLength: Number(config.defaultLength) || 20,
          defaultWidth: Number(config.defaultWidth) || 20,
          defaultHeight: Number(config.defaultHeight) || 15,
          defaultDescription: config.defaultDescription || 'Сувенірна продукція',
          defaultPayerType: config.defaultPayerType || 'Recipient'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || 'Помилка збереження налаштувань НП', 'error');
        return;
      }
      setReady(Boolean(data.ready));
      if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
      onStatusLoaded?.({ connected: true, ready: Boolean(data.ready) });
      showToast?.('Налаштування кабінету НП збережено!', 'success');
      if (data.ready) setShowSettings(false);
    } catch (err) {
      showToast?.('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/novaposhta/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      setConnected(false);
      setReady(false);
      setMaskedKey('');
      onStatusLoaded?.({ connected: false, ready: false });
      showToast?.('Кабінет Нової Пошти відключено');
    } catch (_) {}
  };

  // Orders eligible for batch actions in the current filtered view
  const npOrdersWithoutTtn = filteredOrders.filter(
    (o) =>
      (o.shipping_method || 'nova_poshta') === 'nova_poshta' &&
      !o.shipping_details?.ttn &&
      o.status !== 'completed' &&
      o.status !== 'cancelled'
  );

  const npOrdersReadyForRegistry = filteredOrders.filter(
    (o) =>
      (o.shipping_method || 'nova_poshta') === 'nova_poshta' &&
      o.shipping_details?.np_doc_ref &&
      !o.shipping_details?.np_scansheet_ref &&
      o.status !== 'cancelled'
  );

  const npOrdersWithTtn = filteredOrders.filter(
    (o) =>
      (o.shipping_method || 'nova_poshta') === 'nova_poshta' &&
      o.shipping_details?.ttn &&
      o.status !== 'cancelled'
  );

  const handleBatchCreateTtn = async () => {
    if (!ready) {
      setShowSettings(true);
      showToast?.('Спочатку налаштуйте місто та відділення відправки НП', 'error');
      return;
    }
    if (!npOrdersWithoutTtn.length) {
      showToast?.('Усі видимі замовлення НП вже мають ТТН');
      return;
    }
    setBatchCreating(true);
    try {
      const res = await fetch('/api/novaposhta/ttn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: npOrdersWithoutTtn.map((o) => o.id)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || 'Помилка масового створення ТТН', 'error');
        return;
      }

      const updatedMap = new Map();
      (data.results || []).forEach((r) => {
        if (r.ok) updatedMap.set(String(r.orderId), r);
      });

      if (updatedMap.size > 0 && setOrders) {
        setOrders(
          orders.map((o) => {
            const upd = updatedMap.get(String(o.id));
            return upd ? { ...o, shipping_details: upd.shipping_details } : o;
          })
        );
      }

      const firstErr = (data.results || []).find((r) => !r.ok)?.error;
      if (data.failedCount > 0) {
        showToast?.(
          `Створено ТТН: ${data.successCount}, помилок: ${data.failedCount}${firstErr ? ` (${firstErr})` : ''}`,
          data.successCount > 0 ? 'success' : 'error'
        );
      } else {
        showToast?.(`Успішно створено ${data.successCount} ТТН у кабінеті НП!`, 'success');
      }
    } catch (e) {
      showToast?.('Помилка з’єднання при створенні ТТН', 'error');
    } finally {
      setBatchCreating(false);
    }
  };

  const loadRegistries = async () => {
    setLoadingRegistries(true);
    try {
      const res = await fetch('/api/novaposhta/registry', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && Array.isArray(data.registries)) {
        setRegistries(data.registries);
      }
    } catch (_) {}
    finally {
      setLoadingRegistries(false);
    }
  };

  const handleCreateRegistry = async () => {
    if (!npOrdersReadyForRegistry.length) {
      showToast?.('Немає нових ТТН (створених через API НП) для додавання в реєстр', 'error');
      return;
    }
    setCreatingRegistry(true);
    try {
      const res = await fetch('/api/novaposhta/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: npOrdersReadyForRegistry.map((o) => o.id)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || 'Помилка створення реєстру', 'error');
        return;
      }

      if (Array.isArray(data.updatedOrders) && data.updatedOrders.length > 0 && setOrders) {
        const updMap = new Map(data.updatedOrders.map((u) => [String(u.id), u.shipping_details]));
        setOrders(
          orders.map((o) =>
            updMap.has(String(o.id)) ? { ...o, shipping_details: updMap.get(String(o.id)) } : o
          )
        );
      }

      showToast?.(`Реєстр №${data.registry?.number || ''} створено (${data.count} посилок)!`, 'success');
      setShowRegistries(true);
      loadRegistries();
    } catch (_) {
      showToast?.('Помилка створення реєстру НП', 'error');
    } finally {
      setCreatingRegistry(false);
    }
  };

  const handlePrintAllMarkings = () => {
    const refs = npOrdersWithTtn
      .map((o) => o.shipping_details?.np_doc_ref || o.shipping_details?.ttn)
      .filter(Boolean);
    if (!refs.length) return;
    window.open(`/api/novaposhta/print?type=marking100&refs=${encodeURIComponent(refs.join(','))}`, '_blank');
  };

  return (
    <div className="dusk-panel" style={{ padding: isMobile ? 12 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* Left status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: ready ? 'rgba(147, 162, 250, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              border: ready ? '1px solid rgba(147, 162, 250, 0.35)' : '1px solid var(--color-rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ready ? 'var(--color-accent)' : 'var(--color-muted)',
              flexShrink: 0
            }}
          >
            <Truck size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)' }}>
                Кабінет Нової Пошти
              </span>
              {loading ? (
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Перевірка…</span>
              ) : ready ? (
                <span className="dusk-badge dusk-badge--periwinkle">
                  <span className="dusk-dot dusk-dot--periwinkle" style={{ width: 5, height: 5 }} />
                  Синхронізовано
                </span>
              ) : connected ? (
                <span className="dusk-badge dusk-badge--apricot">Потрібно обрати відділення</span>
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Не підключено</span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>
              {ready
                ? `${config.senderName || 'Відправник'} • ${config.citySenderName || ''} • ${config.defaultWeight} кг • «${config.defaultDescription}»`
                : 'Підключіть API-ключ зі звичайного кабінету НП для швидкого створення ТТН, стікерів та реєстрів'}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {ready && (
            <>
              <button
                type="button"
                onClick={handleBatchCreateTtn}
                disabled={batchCreating || npOrdersWithoutTtn.length === 0}
                className="dusk-btn dusk-btn--primary dusk-btn--sm"
              >
                {batchCreating ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                Створити ТТН ({npOrdersWithoutTtn.length})
              </button>

              <button
                type="button"
                onClick={handleCreateRegistry}
                disabled={creatingRegistry || npOrdersReadyForRegistry.length === 0}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                title="Об’єднати створені ТТН в один реєстр НП"
              >
                {creatingRegistry ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                Створити реєстр ({npOrdersReadyForRegistry.length})
              </button>

              {npOrdersWithTtn.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrintAllMarkings}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                  title="Друк маркувань 100×100 для всіх видимих ТТН"
                >
                  <Printer size={13} /> Стікери ({npOrdersWithTtn.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const next = !showRegistries;
                  setShowRegistries(next);
                  if (next) loadRegistries();
                }}
                className="dusk-btn dusk-btn--ghost dusk-btn--sm"
              >
                Реєстри <ChevronDown size={12} style={{ transform: showRegistries ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={`dusk-btn ${!ready ? 'dusk-btn--primary' : 'dusk-btn--ghost'} dusk-btn--sm`}
          >
            <Settings size={13} /> {ready ? 'Налаштування' : connected ? 'Завершити налаштування' : 'Підключити НП'}
          </button>
        </div>
      </div>

      {/* Registries dropdown panel */}
      <AnimatePresence initial={false}>
        {showRegistries && ready && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                  Останні реєстри у вашому кабінеті НП
                </span>
                <button
                  type="button"
                  onClick={loadRegistries}
                  disabled={loadingRegistries}
                  className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                >
                  <RefreshCw size={12} className={loadingRegistries ? 'animate-spin' : ''} /> Оновити
                </button>
              </div>

              {loadingRegistries ? (
                <div style={{ fontSize: 12, color: 'var(--color-muted)', padding: '8px 0' }}>Завантаження реєстрів…</div>
              ) : registries.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--color-muted)', padding: '8px 0' }}>Реєстрів поки немає</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {registries.slice(0, 12).map((reg) => (
                    <div
                      key={reg.ref}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--color-paper)',
                        border: '1px solid var(--color-rule)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
                        <span className="dusk-mono" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                          Реєстр №{reg.number}
                        </span>
                        <span style={{ color: 'var(--color-muted)' }}>{reg.dateTime}</span>
                        {reg.count > 0 && (
                          <span className="dusk-badge dusk-badge--periwinkle">{reg.count} шт.</span>
                        )}
                      </div>
                      <a
                        href={`/api/novaposhta/print?type=scansheet&refs=${encodeURIComponent(reg.ref)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <Printer size={12} /> Друк реєстру PDF
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Form */}
      <AnimatePresence initial={false}>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-rule)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Step 1: API Key */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={13} style={{ color: 'var(--color-accent)' }} />
                    1. API-ключ особистого кабінету Нової Пошти
                  </label>
                  {connected && (
                    <span className="dusk-mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      Поточний ключ: {maskedKey}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  Де взяти: <b>new.novaposhta.ua</b> → Налаштування → Безпека → Створити ключ. Зберігається безпечно на сервері.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={connected ? 'Вставте новий ключ, якщо потрібно замінити...' : 'Вставте ваш API-ключ НП...'}
                    className="dusk-input dusk-mono"
                    style={{ flex: 1, minWidth: 220, height: 36, fontSize: 12.5 }}
                  />
                  <button
                    type="button"
                    onClick={handleConnectKey}
                    disabled={connecting}
                    className="dusk-btn dusk-btn--primary"
                    style={{ height: 36 }}
                  >
                    {connecting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {connected ? 'Оновити ключ' : 'Підключити ключ'}
                  </button>
                  {connected && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="dusk-btn dusk-btn--danger"
                      style={{ height: 36 }}
                    >
                      <LogOut size={13} /> Відключити
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: Sender & Default parcel params */}
              {connected && (
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10, borderTop: '1px solid var(--color-rule)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                    2. Відправник та стандартні параметри посилки
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    {/* Contact person */}
                    {config.contacts?.length > 0 && (
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                          Контактна особа відправника
                        </label>
                        <select
                          value={config.contactSenderRef}
                          onChange={(e) => {
                            const sel = config.contacts.find((c) => c.ref === e.target.value);
                            setConfig((prev) => ({
                              ...prev,
                              contactSenderRef: e.target.value,
                              senderPhone: sel?.phone || prev.senderPhone
                            }));
                          }}
                          className="dusk-select"
                          style={{ width: '100%', height: 36, fontSize: 12.5 }}
                        >
                          {config.contacts.map((c) => (
                            <option key={c.ref} value={c.ref}>
                              {c.description} ({c.phone})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sender phone */}
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Телефон відправника
                      </label>
                      <input
                        type="text"
                        value={config.senderPhone}
                        onChange={(e) => setConfig((prev) => ({ ...prev, senderPhone: e.target.value }))}
                        placeholder="380..."
                        className="dusk-input dusk-mono"
                        style={{ height: 36, fontSize: 12.5 }}
                      />
                    </div>

                    {/* Sender City */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Місто відправки
                      </label>
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setShowCityDropdown(true);
                        }}
                        onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                        placeholder="Почніть вводити місто (напр. Хмельницький)..."
                        className="dusk-input"
                        style={{ height: 36, fontSize: 12.5 }}
                      />
                      {showCityDropdown && cityResults.length > 0 && (
                        <div className="dusk-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, maxHeight: 170, overflowY: 'auto', padding: 4 }}>
                          {cityResults.map((c) => (
                            <button
                              key={c.Ref}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setConfig((prev) => ({
                                  ...prev,
                                  citySenderRef: c.Ref,
                                  citySenderName: c.Description,
                                  senderWarehouseRef: '',
                                  senderWarehouseName: ''
                                }));
                                setCityQuery(c.Description);
                                setWarehouseQuery('');
                                setShowCityDropdown(false);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '7px 10px', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}
                            >
                              {c.Description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sender Warehouse */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Відділення відправки
                      </label>
                      <input
                        type="text"
                        value={warehouseQuery}
                        onChange={(e) => {
                          setWarehouseQuery(e.target.value);
                          setShowWhDropdown(true);
                        }}
                        onFocus={() => setShowWhDropdown(true)}
                        onBlur={() => setTimeout(() => setShowWhDropdown(false), 200)}
                        placeholder="Введіть номер або адресу відділення..."
                        className="dusk-input"
                        style={{ height: 36, fontSize: 12.5 }}
                      />
                      {loadingWh && <Loader2 size={13} className="animate-spin" style={{ position: 'absolute', right: 10, bottom: 11, color: 'var(--color-accent)' }} />}
                      {showWhDropdown && warehouseResults.length > 0 && (
                        <div className="dusk-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                          {warehouseResults.slice(0, 40).map((w) => (
                            <button
                              key={w.Ref}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setConfig((prev) => ({
                                  ...prev,
                                  senderWarehouseRef: w.Ref,
                                  senderWarehouseName: w.Description
                                }));
                                setWarehouseQuery(w.Description);
                                setShowWhDropdown(false);
                              }}
                              style={{ width: '100%', textAlign: 'left', padding: '7px 10px', background: 'transparent', border: 'none', color: 'var(--color-ink)', fontSize: 12, cursor: 'pointer', borderRadius: 6 }}
                            >
                              {w.Description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Defaults row */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 2fr 1.2fr 1.6fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Вага за замовч. (кг)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={config.defaultWeight}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultWeight: e.target.value }))}
                        className="dusk-input dusk-num"
                        style={{ height: 36, fontSize: 12.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Опис вантажу
                      </label>
                      <input
                        type="text"
                        value={config.defaultDescription}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultDescription: e.target.value }))}
                        className="dusk-input"
                        style={{ height: 36, fontSize: 12.5 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Платник доставки
                      </label>
                      <select
                        value={config.defaultPayerType}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultPayerType: e.target.value }))}
                        className="dusk-select"
                        style={{ width: '100%', height: 36, fontSize: 12.5 }}
                      >
                        <option value="Recipient">Отримувач</option>
                        <option value="Sender">Відправник</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                        Габарити для поштомату (Д×Ш×В см)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                        <input
                          type="number"
                          min="1"
                          value={config.defaultLength}
                          onChange={(e) => setConfig((prev) => ({ ...prev, defaultLength: e.target.value }))}
                          className="dusk-input dusk-num"
                          style={{ height: 36, fontSize: 12, padding: '0 6px', textAlign: 'center' }}
                          title="Довжина (см)"
                        />
                        <input
                          type="number"
                          min="1"
                          value={config.defaultWidth}
                          onChange={(e) => setConfig((prev) => ({ ...prev, defaultWidth: e.target.value }))}
                          className="dusk-input dusk-num"
                          style={{ height: 36, fontSize: 12, padding: '0 6px', textAlign: 'center' }}
                          title="Ширина (см)"
                        />
                        <input
                          type="number"
                          min="1"
                          value={config.defaultHeight}
                          onChange={(e) => setConfig((prev) => ({ ...prev, defaultHeight: e.target.value }))}
                          className="dusk-input dusk-num"
                          style={{ height: 36, fontSize: 12, padding: '0 6px', textAlign: 'center' }}
                          title="Висота (см)"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="dusk-btn dusk-btn--ghost dusk-btn--sm"
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="dusk-btn dusk-btn--primary dusk-btn--sm"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Зберегти налаштування НП
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
