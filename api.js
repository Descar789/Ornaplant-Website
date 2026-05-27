// api.js — cliente HTTP a la API REST PHP (MySQL backend).

import { API_URL } from './config.js';

const TOKEN_KEY = 'ornaplant_token';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, opts);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
  });
  const q = usp.toString();
  return q ? `?${q}` : '';
}

// ── PLANTAS (público) ────────────────────────────────────────────
export async function getPlants(filtros = {}) {
  return apiFetch(`/plantas.php${buildQuery(filtros)}`);
}

export async function getPlant(id) {
  if (!id) return null;
  try {
    return await apiFetch(`/plantas.php?id=${encodeURIComponent(id)}`);
  } catch (e) {
    if (String(e.message).includes('no encontrada') || String(e.message).includes('404')) return null;
    throw e;
  }
}

export async function incrementViews(id) {
  if (!id) return;
  return apiFetch(`/plantas.php?id=${encodeURIComponent(id)}&action=incrementar_vistas`, {
    method: 'PATCH',
  });
}

// ── PLANTAS (admin, requieren JWT) ───────────────────────────────
export async function savePlant(id, data) {
  const payload = { ...data, id };
  try {
    return await apiFetch('/admin/plantas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    if (String(e.message).toLowerCase().includes('duplicad')) {
      return apiFetch(`/admin/plantas.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      });
    }
    throw e;
  }
}

export async function updatePlant(id, data) {
  return apiFetch(`/admin/plantas.php?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export async function deletePlant(id) {
  return apiFetch(`/admin/plantas.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
}

// ── UPLOAD imagen al hosting (admin) ─────────────────────────────
export async function uploadImage(file, sku) {
  if (!file) throw new Error('Archivo requerido');
  if (!sku) throw new Error('SKU requerido para subir imagen');
  if (file.size > 5 * 1024 * 1024) throw new Error('Imagen mayor a 5MB');

  const fd = new FormData();
  fd.append('imagen', file);
  fd.append('sku', sku);

  const data = await apiFetch('/admin/upload.php', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  });
  return data.url;
}

// ── AUTH (admin) ─────────────────────────────────────────────────
export async function adminLogin(email, password) {
  const data = await apiFetch('/admin/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem('ornaplant_email', data.email);
  return data;
}

export function adminLogout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('ornaplant_email');
}

export function isAdminLogged() {
  return !!getToken();
}

export function getAdminEmail() {
  return sessionStorage.getItem('ornaplant_email') || '';
}
