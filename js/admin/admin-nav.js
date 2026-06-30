// admin-nav.js — drawer móvil, menú de cuenta, insignia de rol, gating de dueño.
import { getEmail, getRole, getNombre } from './admin-auth.js';

function initials(text) {
  const s = (text || '').trim();
  if (!s) return '··';
  const parts = s.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return s.slice(0, 2);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]);
}

// Construye la insignia de rol (icono + texto, no solo color).
export function setRoleBadge(el, role) {
  if (!el) return;
  const owner = role === 'owner';
  el.className = `role-badge ${owner ? 'owner' : 'editor'}`;
  if (el.id === 'accountRoleBadge') el.style.marginTop = '0.25rem';
  el.textContent = '';
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined';
  icon.textContent = owner ? 'shield_person' : 'edit';
  el.appendChild(icon);
  el.appendChild(document.createTextNode(owner ? 'Dueño' : 'Editor'));
}

// Rellena el menú de cuenta y revela los elementos solo-dueño.
export function renderAccountUI() {
  const role = getRole();
  const email = getEmail();
  const display = getNombre() || email;

  const nameEl = document.getElementById('accountName');
  if (nameEl) nameEl.textContent = display;
  const avatarEl = document.getElementById('accountAvatar');
  if (avatarEl) avatarEl.textContent = initials(display);
  const emailEl = document.getElementById('accountEmail');
  if (emailEl) emailEl.textContent = email;
  setRoleBadge(document.getElementById('accountRoleBadge'), role);

  const isOwner = role === 'owner';
  document.querySelectorAll('.owner-only').forEach(el => { el.hidden = !isOwner; });
}

// ── Drawer móvil ───────────────────────────────────────────────
function setHamburgerExpanded(v) {
  const btn = document.querySelector('[data-action="toggle-nav"]');
  if (!btn) return;
  btn.setAttribute('aria-expanded', String(v));
  btn.setAttribute('aria-label', v ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
}

export function openNav() { document.body.classList.add('nav-open'); setHamburgerExpanded(true); }
export function closeNav() { document.body.classList.remove('nav-open'); setHamburgerExpanded(false); }
export function toggleNav() {
  document.body.classList.contains('nav-open') ? closeNav() : openNav();
}

// ── Menú de cuenta (dropdown) ──────────────────────────────────
export function isAccountMenuOpen() {
  const d = document.getElementById('accountDropdown');
  return !!d && !d.hidden;
}
export function openAccountMenu() {
  const d = document.getElementById('accountDropdown');
  const t = document.getElementById('accountTrigger');
  if (d) d.hidden = false;
  if (t) t.setAttribute('aria-expanded', 'true');
}
export function closeAccountMenu() {
  const d = document.getElementById('accountDropdown');
  const t = document.getElementById('accountTrigger');
  if (d) d.hidden = true;
  if (t) t.setAttribute('aria-expanded', 'false');
}
export function toggleAccountMenu() {
  isAccountMenuOpen() ? closeAccountMenu() : openAccountMenu();
}
