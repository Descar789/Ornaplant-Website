import { isAdminLogged } from '../api.js';
import { showScreen } from './admin-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isAdminLogged()) {
    showScreen('adminPanel');
    // boot panel logic will go here
  } else {
    showScreen('loginScreen');
  }
});
