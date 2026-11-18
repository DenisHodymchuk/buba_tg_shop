import { supabase } from '@/lib/supabase';

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';
export const NP_CONFIG_KEY = 'nova_poshta_cabinet_config';

export const DEFAULT_NP_SETTINGS = {
  defaultBoxRef: '',
  defaultBoxName: 'Коробка (1 кг) стандартна',
  defaultWeight: 1,
  defaultLength: 24,
  defaultWidth: 17,
  defaultHeight: 10,
  defaultDescription: 'Сувенірна продукція',
  defaultPayerType: 'Recipient',
  defaultPaymentMethod: 'Cash'
};

export async function loadNpConfig() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', NP_CONFIG_KEY)
    .single();
  if (error || !data?.value) return null;
  return {
    ...DEFAULT_NP_SETTINGS,
    ...data.value
  };
}

export async function saveNpConfig(config) {
  if (!supabase) throw new Error('Supabase не ініціалізовано');
  const { error } = await supabase.from('settings').upsert({
    key: NP_CONFIG_KEY,
    value: config
  });
  if (error) throw new Error(error.message || 'Помилка збереження налаштувань НП');
  return config;
}

export async function clearNpConfig() {
  if (!supabase) return;
  await supabase.from('settings').upsert({
    key: NP_CONFIG_KEY,
    value: null
  });
}

export async function npApiCall(apiKey, modelName, calledMethod, methodProperties = {}) {
  const key = String(apiKey || '').trim();
  if (!key) {
    throw new Error('Не вказано API-ключ Нової Пошти');
  }

  const res = await fetch(NP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: key,
      modelName,
      calledMethod,
      methodProperties
    }),
    cache: 'no-store'
  });

  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error(`Нова Пошта повернула некоректну відповідь (${res.status})`);
  }

  if (!json.success) {
    const errText =
      (Array.isArray(json.errors) && json.errors.filter(Boolean).join('; ')) ||
      (Array.isArray(json.warnings) && json.warnings.filter(Boolean).join('; ')) ||
      'Помилка API Нової Пошти';
    throw new Error(errText);
  }

  return Array.isArray(json.data) ? json.data : [];
}

export function formatNpPhone(phoneStr) {
  if (!phoneStr) return '';
  const digits = String(phoneStr).replace(/\D/g, '');
  if (digits.startsWith('380') && digits.length === 12) return digits;
  if (digits.startsWith('80') && digits.length === 11) return '3' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '38' + digits;
  if (digits.length === 9) return '380' + digits;
  return digits;
}

export function getKyivDateDDMMYYYY() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(now);
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  return `${day}.${month}.${year}`;
}

export async function fetchSenderInfo(apiKey) {
  const senders = await npApiCall(apiKey, 'Counterparty', 'getCounterparties', {
    CounterpartyProperty: 'Sender',
    Page: '1'
  });

  if (!senders.length) {
    throw new Error('У цьому кабінеті Нової Пошти не знайдено відправника');
  }

  const sender = senders[0];
  const contacts = await npApiCall(apiKey, 'Counterparty', 'getCounterpartyContactPersons', {
    Ref: sender.Ref,
    Page: '1'
  });

  const contact = contacts[0] || null;
  return {
    senderRef: sender.Ref,
    senderName: sender.Description || '',
    citySenderRef: sender.City || '',
    contacts: contacts.map((c) => ({
      ref: c.Ref,
      description: c.Description || `${c.LastName || ''} ${c.FirstName || ''}`.trim(),
      phone: c.Phones || ''
    })),
    contactSenderRef: contact?.Ref || '',
    senderPhone: formatNpPhone(contact?.Phones || '')
  };
}

export async function searchNpCities(apiKey, query) {
  const q = String(query || '').trim();
  if (!q) return [];
  return npApiCall(apiKey, 'Address', 'getCities', {
    FindByString: q,
    Limit: '25'
  });
}

export async function searchNpWarehouses(apiKey, cityRef, search = '', limit = '100') {
  if (!cityRef) return [];
  const props = {
    CityRef: cityRef,
    Limit: String(limit || '100')
  };
  const raw = String(search || '').trim();
  if (raw) {
    const numMatch = raw.match(/(?:№|#)?\s*([0-9]+(?:\/[0-9]+)?)/);
    const stripped = raw
      .replace(/поштомат|почтомат|відділення|отделение|пункт|нова\s*пошта|нп/gi, '')
      .trim();
    const candidate = stripped || (numMatch ? numMatch[1] : raw);
    if (candidate) {
      props.FindByString = candidate;
    }
  }
  return npApiCall(apiKey, 'Address', 'getWarehouses', props);
}

async function resolveRecipientCityRef(apiKey, cityName, existingCityRef) {
  if (existingCityRef && /^[0-9a-f-]{32,36}$/i.test(String(existingCityRef).trim())) {
    return String(existingCityRef).trim();
  }
  const cleanCity = String(cityName || '')
    .replace(/^(м\.|с\.|смт\.?)\s*/i, '')
    .split(',')[0]
    .trim();
  if (!cleanCity) {
    throw new Error('У замовленні не вказано місто отримувача');
  }
  const cities = await searchNpCities(apiKey, cleanCity);
  if (!cities.length) {
    throw new Error(`Не знайдено місто «${cleanCity}» у базі Нової Пошти`);
  }
  const exact = cities.find(
    (c) => String(c.Description || '').toLowerCase() === cleanCity.toLowerCase()
  );
  return (exact || cities[0]).Ref;
}

async function resolveRecipientWarehouse(apiKey, cityRef, warehouseText) {
  const raw = String(warehouseText || '').trim();
  if (!raw) {
    throw new Error('У замовленні не вказано відділення або поштомат');
  }

  // Extract number if present (e.g. "Поштомат №33307: ..." -> "33307")
  const numMatch = raw.match(/(?:№|#)\s*([0-9]+(?:\/[0-9]+)?)/) || raw.match(/\b([0-9]{1,6})\b/);
  const numStr = numMatch ? numMatch[1] : '';

  let list = [];
  if (numStr) {
    list = await searchNpWarehouses(apiKey, cityRef, numStr, '100');
  }
  if (!list.length) {
    list = await searchNpWarehouses(apiKey, cityRef, raw, '100');
  }
  if (!list.length) {
    throw new Error(`Не знайдено відділення/поштомат «${raw}» у вибраному місті`);
  }

  // Prefer exact Description match, then exact Number match + matching type (postomat vs branch)
  const lowerRaw = raw.toLowerCase();
  const wantsPostomat = lowerRaw.includes('поштомат') || lowerRaw.includes('почтомат');

  const exactDesc = list.find((w) => String(w.Description || '').toLowerCase() === lowerRaw);
  if (exactDesc) return exactDesc;

  if (numStr) {
    const sameNumber = list.filter((w) => String(w.Number || '') === numStr);
    if (sameNumber.length === 1) return sameNumber[0];
    if (sameNumber.length > 1) {
      const byType = sameNumber.find((w) => {
        const isP =
          w.CategoryOfWarehouse === 'Postomat' ||
          String(w.Description || '').toLowerCase().includes('поштомат');
        return wantsPostomat ? isP : !isP;
      });
      if (byType) return byType;
      return sameNumber[0];
    }
  }

  return list[0];
}

function splitRecipientName(details = {}, customer = {}) {
  let firstName = String(details.firstName || details.first_name || customer?.first_name || '').trim();
  let lastName = String(details.lastName || details.last_name || customer?.last_name || '').trim();

  if (!lastName && firstName.includes(' ')) {
    const parts = firstName.split(/\s+/).filter(Boolean);
    lastName = parts[0];
    firstName = parts.slice(1).join(' ');
  }
  if (!firstName && lastName.includes(' ')) {
    const parts = lastName.split(/\s+/).filter(Boolean);
    lastName = parts[0];
    firstName = parts.slice(1).join(' ');
  }

  // Clean non-letter characters that Nova Poshta rejects in names
  const cleanName = (str) =>
    str
      .replace(/[^а-яА-ЯіїєґІЇЄҐa-zA-Z'\-ʼ\s]/g, '')
      .trim();

  return {
    firstName: cleanName(firstName),
    lastName: cleanName(lastName)
  };
}

export async function createNpTtnForOrder(config, order, overrides = {}) {
  if (!config?.apiKey) throw new Error('Кабінет Нової Пошти не підключено');
  if (!config.senderRef || !config.contactSenderRef || !config.citySenderRef || !config.senderWarehouseRef) {
    throw new Error('Заповніть дані відправника (місто та відділення) у налаштуваннях НП');
  }

  const details = order?.shipping_details || {};
  const customer = order?.customers || {};

  const { firstName, lastName } = splitRecipientName(details, customer);
  if (!firstName || !lastName) {
    throw new Error('Вкажіть Ім’я та Прізвище отримувача (НП вимагає обидва поля)');
  }

  const recipientPhone = formatNpPhone(details.phone || customer?.phone || '');
  if (!/^380\d{9}$/.test(recipientPhone)) {
    throw new Error(`Некоректний телефон отримувача: ${details.phone || 'не вказано'}`);
  }

  const cityRecipientRef = await resolveRecipientCityRef(
    config.apiKey,
    details.city,
    details.cityRef
  );

  const warehouse = await resolveRecipientWarehouse(
    config.apiKey,
    cityRecipientRef,
    details.warehouse
  );

  const isPostomat =
    warehouse.CategoryOfWarehouse === 'Postomat' ||
    String(warehouse.Description || '').toLowerCase().includes('поштомат');

  // Create/update recipient counterparty in NP
  const cpRes = await npApiCall(config.apiKey, 'Counterparty', 'save', {
    FirstName: firstName,
    LastName: lastName,
    MiddleName: '',
    Phone: recipientPhone,
    Email: '',
    CounterpartyType: 'PrivatePerson',
    CounterpartyProperty: 'Recipient'
  });

  const recipient = cpRes[0];
  const contactRecipient = recipient?.ContactPerson?.data?.[0];
  if (!recipient?.Ref || !contactRecipient?.Ref) {
    throw new Error('Не вдалося створити контрагента-отримувача в НП');
  }

  const weight = Number(overrides.weight ?? config.defaultWeight ?? 1) || 1;
  const length = Number(overrides.length ?? config.defaultLength ?? 20) || 20;
  const width = Number(overrides.width ?? config.defaultWidth ?? 20) || 20;
  const height = Number(overrides.height ?? config.defaultHeight ?? 15) || 15;
  const description = String(
    overrides.description || config.defaultDescription || 'Сувенірна продукція'
  ).trim();
  const payerType = overrides.payerType || config.defaultPayerType || 'Recipient';
  const paymentMethod = overrides.paymentMethod || config.defaultPaymentMethod || 'Cash';

  const isCod = !!details.is_cod;
  const codAmount = Math.round(parseFloat(details.cod_amount || 0) || 0);
  const orderTotal = Math.round(parseFloat(order.total || 0) || 0);
  const declaredCost = Math.max(
    1,
    Math.round(Number(overrides.cost) || orderTotal || codAmount || 200)
  );

  const docProps = {
    PayerType: payerType,
    PaymentMethod: paymentMethod,
    DateTime: getKyivDateDDMMYYYY(),
    CargoType: 'Parcel',
    Weight: String(weight),
    ServiceType: 'WarehouseWarehouse',
    SeatsAmount: '1',
    Description: description,
    Cost: String(declaredCost),
    CitySender: config.citySenderRef,
    Sender: config.senderRef,
    SenderAddress: config.senderWarehouseRef,
    ContactSender: config.contactSenderRef,
    SendersPhone: formatNpPhone(config.senderPhone),
    CityRecipient: cityRecipientRef,
    Recipient: recipient.Ref,
    RecipientAddress: warehouse.Ref,
    ContactRecipient: contactRecipient.Ref,
    RecipientsPhone: recipientPhone
  };

  if (isPostomat) {
    const vol = Number(((width * length * height) / 4000).toFixed(2)) || 0.5;
    docProps.OptionsSeat = [
      {
        volumetricVolume: String(vol),
        volumetricWidth: String(width),
        volumetricLength: String(length),
        volumetricHeight: String(height),
        weight: String(weight)
      }
    ];
  }

  if (isCod && codAmount > 0) {
    docProps.BackwardDeliveryData = [
      {
        PayerType: 'Recipient',
        CargoType: 'Money',
        RedeliveryString: String(codAmount)
      }
    ];
  }

  const docRes = await npApiCall(config.apiKey, 'InternetDocument', 'save', docProps);
  const created = docRes[0];
  if (!created?.IntDocNumber || !created?.Ref) {
    throw new Error('Нова Пошта не повернула номер ТТН');
  }

  return {
    ref: created.Ref,
    ttn: String(created.IntDocNumber),
    costOnSite: created.CostOnSite || null,
    estimatedDeliveryDate: created.EstimatedDeliveryDate || null,
    resolvedWarehouse: warehouse.Description || details.warehouse || ''
  };
}

export async function createNpScanSheet(apiKey, documentRefs = []) {
  const refs = documentRefs.filter(Boolean);
  if (!refs.length) {
    throw new Error('Немає накладних (ТТН) для додавання в реєстр');
  }
  const data = await npApiCall(apiKey, 'ScanSheet', 'insertDocuments', {
    DocumentRefs: refs
  });
  const sheet = data[0];
  if (!sheet?.Ref) {
    throw new Error('Не вдалося створити реєстр у Новій Пошті');
  }
  return {
    ref: sheet.Ref,
    number: sheet.Number || '',
    date: sheet.Date || ''
  };
}

export async function listNpScanSheets(apiKey) {
  const data = await npApiCall(apiKey, 'ScanSheet', 'getScanSheetList', {});
  return data.map((s) => ({
    ref: s.Ref,
    number: s.Number || '',
    dateTime: s.DateTime || '',
    printed: s.Printed === '1' || s.Printed === 1,
    count: Number(s.Count || 0)
  }));
}

export async function fetchNpBoxes(apiKey) {
  const data = await npApiCall(apiKey, 'Common', 'getPackList', {});
  const seen = new Set();
  const boxes = [];

  for (const p of data) {
    const desc = String(p?.Description || '').trim();
    if (!desc || !/коробк/i.test(desc)) continue;
    // Skip duplicate "з наповнювачем" variants so the list is clean and readable
    if (/з наповнювач/i.test(desc)) continue;
    const lengthCm = Math.max(1, Math.round(Number(p.Length || 0) / 10));
    const widthCm = Math.max(1, Math.round(Number(p.Width || 0) / 10));
    const heightCm = Math.max(1, Math.round(Number(p.Height || 0) / 10));
    const weight = Number(p.VolumetricWeight || 0) || 0.5;
    if (!lengthCm || !widthCm || !heightCm) continue;

    const dedupeKey = `${desc.toLowerCase()}_${lengthCm}_${widthCm}_${heightCm}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    boxes.push({
      ref: p.Ref,
      name: desc,
      length: lengthCm,
      width: widthCm,
      height: heightCm,
      weight: Number(weight.toFixed(2))
    });
  }

  return boxes.sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name, 'uk'));
}

export function mapNpStatusCodeToOrderStatus(statusCode, statusText = '') {
  const code = Number(statusCode);
  const text = String(statusText || '').toLowerCase();

  // 1: Нова пошта очікує надходження від відправника -> ще не відправлено
  if (code === 1) return null;

  // 2: Видалено, 3: Номер не знайдено
  if (code === 2 || code === 3) return null;

  // 9, 10, 11: Відправлення отримано (+ грошовий переказ) -> Виконано
  if (code === 9 || code === 10 || code === 11) {
    return 'completed';
  }

  // 102, 103, 104, 105, 106: Відмова одержувача / повернення / припинено зберігання -> Повернення
  if (
    code === 102 ||
    code === 103 ||
    code === 104 ||
    code === 105 ||
    code === 106 ||
    text.includes('відмов') ||
    text.includes('повернен') ||
    text.includes('отказ')
  ) {
    return 'returned';
  }

  // 4, 41, 5, 6, 7, 8, 101: Прямує / прибуло у відділення або поштомат / на шляху -> В дорозі
  if ([4, 41, 5, 6, 7, 8, 101].includes(code)) {
    return 'shipped';
  }

  return null;
}

export async function trackNpDocuments(apiKey, documents = []) {
  const cleanDocs = (Array.isArray(documents) ? documents : [])
    .map((d) => ({
      DocumentNumber: String(d.DocumentNumber || d.ttn || '').replace(/\D/g, '').trim(),
      Phone: formatNpPhone(d.Phone || d.phone || '')
    }))
    .filter((d) => d.DocumentNumber.length >= 10);

  if (!cleanDocs.length) return [];

  const results = [];
  // Nova Poshta allows up to 100 documents per TrackingDocument.getStatusDocuments request
  for (let i = 0; i < cleanDocs.length; i += 100) {
    const chunk = cleanDocs.slice(i, i + 100);
    const data = await npApiCall(apiKey, 'TrackingDocument', 'getStatusDocuments', {
      Documents: chunk
    });
    results.push(...data);
  }

  return results;
}
