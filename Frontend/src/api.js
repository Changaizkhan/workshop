const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiUrl = (endpoint) => `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

const getHeaders = () => {
  const token = localStorage.getItem('ga_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request(endpoint, init) {
  return fetch(apiUrl(endpoint), {
    ...init,
    headers: { ...getHeaders(), ...init.headers },
  });
}

async function parseApiError(res) {
  const err = await res.json().catch(() => null);
  if (err?.error) return err.error;
  if (res.status === 404) {
    return 'API not found. Backend restart karein (npm run dev in Backend folder).';
  }
  if (res.status === 401) return 'Session expired. Please log in again.';
  if (res.status === 403) return 'You do not have permission for this action.';
  return `Server error (${res.status})`;
}

async function handleResponse(res) {
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json();
}

const api = {
  async get(endpoint) {
    const res = await request(endpoint, { method: 'GET' });
    return handleResponse(res);
  },
  async post(endpoint, body) {
    const res = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async put(endpoint, body) {
    const res = await request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  async delete(endpoint) {
    const res = await request(endpoint, { method: 'DELETE' });
    return handleResponse(res);
  },
};

export { api, API_BASE };
