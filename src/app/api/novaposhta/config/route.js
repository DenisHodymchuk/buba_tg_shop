import { NextResponse } from 'next/server';
import {
  DEFAULT_NP_SETTINGS,
  loadNpConfig,
  saveNpConfig,
  clearNpConfig,
  fetchSenderInfo,
  searchNpCities,
  searchNpWarehouses,
  formatNpPhone
} from '@/lib/novaposhtaServer';

export const dynamic = 'force-dynamic';

function sanitizeConfigForClient(cfg) {
  if (!cfg || !cfg.apiKey) {
    return {
      connected: false,
      ready: false,
      config: { ...DEFAULT_NP_SETTINGS }
    };
  }
  const keyStr = String(cfg.apiKey);
  const maskedKey = keyStr.length > 6 ? `${'•'.repeat(Math.min(12, keyStr.length - 4))}${keyStr.slice(-4)}` : '••••';
  const ready = Boolean(
    cfg.apiKey && cfg.senderRef && cfg.contactSenderRef && cfg.citySenderRef && cfg.senderWarehouseRef
  );

  return {
    connected: true,
    ready,
    maskedKey,
    config: {
      senderRef: cfg.senderRef || '',
      senderName: cfg.senderName || '',
      contactSenderRef: cfg.contactSenderRef || '',
      senderPhone: cfg.senderPhone || '',
      contacts: Array.isArray(cfg.contacts) ? cfg.contacts : [],
      citySenderRef: cfg.citySenderRef || '',
      citySenderName: cfg.citySenderName || '',
      senderWarehouseRef: cfg.senderWarehouseRef || '',
      senderWarehouseName: cfg.senderWarehouseName || '',
      defaultWeight: cfg.defaultWeight ?? 1,
      defaultLength: cfg.defaultLength ?? 20,
      defaultWidth: cfg.defaultWidth ?? 20,
      defaultHeight: cfg.defaultHeight ?? 15,
      defaultDescription: cfg.defaultDescription || 'Сувенірна продукція',
      defaultPayerType: cfg.defaultPayerType || 'Recipient',
      defaultPaymentMethod: cfg.defaultPaymentMethod || 'Cash'
    }
  };
}

export async function GET() {
  try {
    const cfg = await loadNpConfig();
    return NextResponse.json(sanitizeConfigForClient(cfg));
  } catch (err) {
    console.error('NP config GET error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка завантаження налаштувань НП' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body || {};

    if (action === 'disconnect') {
      await clearNpConfig();
      return NextResponse.json({ ok: true, connected: false, ready: false });
    }

    const existing = await loadNpConfig();
    const activeKey = String(body?.apiKey || existing?.apiKey || '').trim();

    if (action === 'searchCities') {
      if (!activeKey) return NextResponse.json({ error: 'Спочатку введіть API-ключ НП' }, { status: 400 });
      const cities = await searchNpCities(activeKey, body.query);
      return NextResponse.json({ ok: true, data: cities });
    }

    if (action === 'getWarehouses') {
      if (!activeKey) return NextResponse.json({ error: 'Спочатку введіть API-ключ НП' }, { status: 400 });
      const warehouses = await searchNpWarehouses(activeKey, body.cityRef, body.search || '', '100');
      return NextResponse.json({ ok: true, data: warehouses });
    }

    if (action === 'connect') {
      if (!activeKey) {
        return NextResponse.json({ error: 'Вставте API-ключ із вашого кабінету Нової Пошти' }, { status: 400 });
      }
      const senderInfo = await fetchSenderInfo(activeKey);
      const merged = {
        ...DEFAULT_NP_SETTINGS,
        ...(existing || {}),
        apiKey: activeKey,
        senderRef: senderInfo.senderRef,
        senderName: senderInfo.senderName,
        contactSenderRef: existing?.contactSenderRef || senderInfo.contactSenderRef,
        senderPhone: existing?.senderPhone || senderInfo.senderPhone,
        contacts: senderInfo.contacts,
        citySenderRef: existing?.citySenderRef || senderInfo.citySenderRef || '',
        updatedAt: new Date().toISOString()
      };
      await saveNpConfig(merged);
      return NextResponse.json({ ok: true, ...sanitizeConfigForClient(merged) });
    }

    if (action === 'save') {
      if (!activeKey) {
        return NextResponse.json({ error: 'Спочатку підключіть API-ключ Нової Пошти' }, { status: 400 });
      }
      const nextConfig = {
        ...DEFAULT_NP_SETTINGS,
        ...(existing || {}),
        apiKey: activeKey,
        contactSenderRef: body.contactSenderRef || existing?.contactSenderRef || '',
        senderPhone: formatNpPhone(body.senderPhone || existing?.senderPhone || ''),
        citySenderRef: body.citySenderRef ?? existing?.citySenderRef ?? '',
        citySenderName: body.citySenderName ?? existing?.citySenderName ?? '',
        senderWarehouseRef: body.senderWarehouseRef ?? existing?.senderWarehouseRef ?? '',
        senderWarehouseName: body.senderWarehouseName ?? existing?.senderWarehouseName ?? '',
        defaultWeight: Math.max(0.1, Number(body.defaultWeight) || 1),
        defaultLength: Math.max(1, Number(body.defaultLength) || 20),
        defaultWidth: Math.max(1, Number(body.defaultWidth) || 20),
        defaultHeight: Math.max(1, Number(body.defaultHeight) || 15),
        defaultDescription: String(body.defaultDescription || 'Сувенірна продукція').trim(),
        defaultPayerType: body.defaultPayerType === 'Sender' ? 'Sender' : 'Recipient',
        defaultPaymentMethod: 'Cash',
        updatedAt: new Date().toISOString()
      };
      await saveNpConfig(nextConfig);
      return NextResponse.json({ ok: true, ...sanitizeConfigForClient(nextConfig) });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('NP config POST error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка запиту до Нової Пошти' }, { status: 400 });
  }
}
