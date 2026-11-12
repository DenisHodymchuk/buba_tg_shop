const API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY;

async function npRequest(modelName, calledMethod, methodProperties = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName,
        calledMethod,
        methodProperties
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    if (result.success) {
      return result.data;
    } else {
      console.error('Nova Poshta API Error:', result.errors);
      return [];
    }
  } catch (error) {
    console.error('Nova Poshta Fetch Error:', error);
    return [];
  }
}

export const novaPoshta = {
  // Пошук міст за назвою
  getCities: async (query) => {
    if (!query || query.length < 2) return [];
    return npRequest('Address', 'getCities', {
      FindByString: query,
      Limit: "20"
    });
  },

  // Отримання відділень у місті (за назвою міста або Ref), з підтримкою пошуку за номером або назвою
  getWarehouses: async (cityRef, search = '', limit = '500') => {
    if (!cityRef) return [];
    const methodProperties = {
      CityRef: cityRef,
      Limit: String(limit || '500')
    };

    const raw = String(search || '').trim();
    if (raw) {
      const numMatch = raw.match(/(?:№|#)?\s*([0-9]+(?:\/[0-9]+)?)/);
      const stripped = raw.replace(/поштомат|почтомат|відділення|отделение|пункт|нова\s*пошта|нп/gi, '').trim();
      const candidate = stripped || (numMatch ? numMatch[1] : raw);
      if (candidate) {
        methodProperties.FindByString = candidate;
        methodProperties.Limit = '100';
      }
    }

    return npRequest('Address', 'getWarehouses', methodProperties);
  }
};
