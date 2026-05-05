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

  // Отримання відділень у місті (за назвою міста або Ref)
  getWarehouses: async (cityRef) => {
    if (!cityRef) return [];
    return npRequest('Address', 'getWarehouses', {
      CityRef: cityRef,
      Limit: "500"
    });
  }
};
