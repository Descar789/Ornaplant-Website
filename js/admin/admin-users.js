// admin-users.js — gestión de perfiles (solo dueño).
import { listUsers, createUser, deleteUser } from '../../api.js?v=2';
import { getEmail } from './admin-auth.js';
import { setRoleBadge } from './admin-nav.js';
import { showToast } from './admin-toast.js';

let delConfirmId = null;
let delConfirmTimer = null;

function initials(text) {
  const s = (text || '').trim();
  if (!s) return '··';
  const parts = s.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]);
}

export function openUsersModal() {
  const modal = document.getElementById('usersModal');
  if (!modal) return;
  modal.style.display = 'flex';
  resetForm();
  loadUsers();
  document.getElementById('u-nombre')?.focus();
}

export function closeUsersModal() {
  const modal = document.getElementById('usersModal');
  if (modal) modal.style.display = 'none';
  resetDelConfirm();
}

function resetForm() {
  ['u-nombre', 'u-email', 'u-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.style.borderColor = ''; }
  });
  const role = document.getElementById('u-role');
  if (role) role.value = 'editor';
}

async function loadUsers() {
  const list = document.getElementById('usersList');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#7da592;">Cargando perfiles...</div>';
  try {
    const users = await listUsers();
    renderUsers(users);
  } catch (e) {
    list.innerHTML = `<div style="text-align:center;padding:1.5rem;color:#991b1b;">Error al cargar perfiles: ${e.message}</div>`;
  }
}

function renderUsers(users) {
  const list = document.getElementById('usersList');
  const tpl = document.getElementById('user-row-template');
  if (!list || !tpl) return;
  list.innerHTML = '';

  const myEmail = getEmail();
  users.forEach(u => {
    const clone = tpl.content.cloneNode(true);
    const row = clone.querySelector('.user-row');
    row.dataset.id = u.id;

    clone.querySelector('.user-avatar').textContent = initials(u.nombre || u.email);
    clone.querySelector('.user-name').textContent = u.nombre || '(sin nombre)';
    clone.querySelector('.user-email').textContent = u.email;
    setRoleBadge(clone.querySelector('.role-badge'), u.role);

    const delBtn = clone.querySelector('.user-del-btn');
    if (u.email === myEmail) {
      // No puedes borrarte a ti mismo.
      delBtn.disabled = true;
      delBtn.style.opacity = '0.35';
      delBtn.style.cursor = 'not-allowed';
      delBtn.setAttribute('aria-label', 'Tu cuenta actual');
      delBtn.title = 'Tu cuenta actual';
    } else {
      delBtn.setAttribute('aria-label', `Eliminar perfil ${u.email}`);
    }

    list.appendChild(clone);
  });

  if (users.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#7da592;">No hay perfiles.</div>';
  }
}

export async function createUserUI() {
  const nombre = document.getElementById('u-nombre')?.value.trim() ?? '';
  const email = document.getElementById('u-email')?.value.trim() ?? '';
  const password = document.getElementById('u-password')?.value ?? '';
  const role = document.getElementById('u-role')?.value ?? 'editor';

  if (!nombre)               { fieldErr('u-nombre'); showToast('El nombre es requerido.', 'error'); return; }
  if (!email)                { fieldErr('u-email'); showToast('El correo es requerido.', 'error'); return; }
  if (password.length < 8)   { fieldErr('u-password'); showToast('La contraseña debe tener al menos 8 caracteres.', 'error'); return; }

  const btn = document.getElementById('createUserBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

  try {
    await createUser({ nombre, email, password, role });
    showToast('Perfil creado.', 'success');
    resetForm();
    loadUsers();
  } catch (e) {
    if (e.field) fieldErr(`u-${e.field}`);
    showToast('Error: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

export function handleUserDeleteClick(id, btn) {
  if (btn.disabled) return;
  if (delConfirmId === id) {
    clearTimeout(delConfirmTimer);
    resetDelConfirm();
    doDeleteUser(id);
    return;
  }
  if (delConfirmId) resetDelConfirm();
  delConfirmId = id;
  btn.innerHTML = '¿Confirmar?';
  btn.style.cssText += ';background:#fecaca;color:#991b1b;width:auto;padding:0 0.5rem;font-size:0.7rem;font-weight:700;font-family:"Plus Jakarta Sans",sans-serif;';
  delConfirmTimer = setTimeout(resetDelConfirm, 3000);
}

async function doDeleteUser(id) {
  try {
    await deleteUser(id);
    showToast('Perfil eliminado.', 'success');
    loadUsers();
  } catch (e) {
    showToast('Error al eliminar: ' + e.message, 'error');
    loadUsers();
  }
}

function resetDelConfirm() {
  if (delConfirmId != null) {
    const row = document.querySelector(`#usersList .user-row[data-id="${delConfirmId}"]`);
    const btn = row?.querySelector('.user-del-btn');
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
      btn.style.cssText = '';
    }
  }
  delConfirmId = null;
  if (delConfirmTimer) { clearTimeout(delConfirmTimer); delConfirmTimer = null; }
}

export function togglePassword(btn) {
  const input = document.getElementById('u-password');
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = show ? 'visibility_off' : 'visibility';
}

function fieldErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#f87171';
  el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
}
