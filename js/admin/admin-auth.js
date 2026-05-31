import { adminLogin, adminLogout, getAdminEmail } from '../api.js';

function isTokenExpired() {
  const token = sessionStorage.getItem('ornaplant_token');
  if (!token) return true;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    if (!exp || Date.now() / 1000 >= exp) {
      adminLogout();
      return true;
    }
    return false;
  } catch { return true; }
}

export function isLoggedAndValid() {
  return !isTokenExpired();
}

export function showScreen(id) {
  ['authLoading', 'loginScreen', 'adminPanel'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (!target) return;
  target.style.display = id === 'adminPanel' ? 'block' : 'flex';
}

export function doSignOut() {
  adminLogout();
  showScreen('loginScreen');
}

export function getEmail() {
  return getAdminEmail();
}

export function setupAuthEvents() {
  const loginBtn = document.getElementById('emailSignInBtn');
  if (loginBtn) loginBtn.addEventListener('click', signInWithEmail);

  ['loginEmail', 'loginPassword'].forEach(inputId => {
    const el = document.getElementById(inputId);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') signInWithEmail(); });
  });
}

async function signInWithEmail() {
  const btn = document.getElementById('emailSignInBtn');
  const errEl = document.getElementById('loginError');
  const email = document.getElementById('loginEmail')?.value.trim() ?? '';
  const password = document.getElementById('loginPassword')?.value ?? '';

  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  if (errEl) errEl.style.display = 'none';

  try {
    await adminLogin(email, password);
    document.dispatchEvent(new CustomEvent('admin:login-success'));
  } catch (e) {
    if (errEl) {
      errEl.textContent = (e?.message) || 'Correo o contraseña incorrectos.';
      errEl.style.display = 'block';
    }
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}
