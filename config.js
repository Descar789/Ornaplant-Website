// config.js — config global del frontend.

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Autodetección robusta de subcarpeta en local
let localApiUrl = 'http://localhost/api';
if (isLocal) {
  const subDir = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
  localApiUrl = `${location.origin}${subDir}/api`;
}

export const API_URL = isLocal
  ? localApiUrl
  : 'https://ornaplant.com.mx/api';

export const WHATSAPP_NUMBER = '527351024413';

export const GA_MEASUREMENT_ID = '';
