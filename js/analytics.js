import { GA_MEASUREMENT_ID } from '../config.js';

const measurementId = String(GA_MEASUREMENT_ID || '').trim();
const hasValidMeasurementId = /^G-[A-Z0-9]+$/.test(measurementId);
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

if (hasValidMeasurementId && !isLocalhost) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}
