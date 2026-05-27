// config.js — config global del frontend.

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

export const API_URL = isLocal
  ? 'http://localhost/Ornaplant/api'
  : 'https://ornaplant.com.mx/api';

export const WHATSAPP_NUMBER = '527351024413';
