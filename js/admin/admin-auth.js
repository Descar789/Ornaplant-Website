import { adminLogin, adminLogout, isAdminLogged, getAdminEmail } from '../api.js';

export function showScreen(id) {
  const screens = ['authLoading', 'loginScreen', 'accessDenied', 'adminPanel'];
  screens.forEach(s => {
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
