const BASE = import.meta.env.VITE_API_URL || '';

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    _onUnauthorized?.();
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function loginOperario(plataforma, pin) {
  return request('/api/auth/login-operario', {
    method: 'POST',
    body: JSON.stringify({ plataforma, pin }),
  });
}

export async function getBultosHoy(token) {
  return request('/api/bultos/hoy', {}, token);
}

export async function postBulto(data, token) {
  return request('/api/bultos', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function putBulto(id, data, token) {
  return request(`/api/bultos/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function postBatch(records, token) {
  return request('/api/bultos/batch', { method: 'POST', body: JSON.stringify({ records }) }, token);
}
