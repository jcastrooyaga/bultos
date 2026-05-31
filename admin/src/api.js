const BASE_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('token')
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('admin')
  window.location.href = '/login'
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearSession()
    return
  }

  return res
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return res
}

export async function getUsers() {
  return request('/api/admin/users')
}

export async function createUser(data) {
  return request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(id, data) {
  return request(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function changePassword(data) {
  return request('/api/admin/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function exportData(desde, hasta) {
  const token = getToken()
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(
    `${BASE_URL}/api/admin/export?desde=${desde}&hasta=${hasta}`,
    { headers }
  )
  if (res.status === 401) {
    clearSession()
    return
  }
  return res
}
