const CONSENT_KEY = 'ornaplant_cookie_consent';

function getStored() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
function setStored(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* silent */ }
}

export function hasConsent() {
  return getStored() === 'accepted';
}

function accept() {
  setStored('accepted');
  window.dispatchEvent(new CustomEvent('ornaplant:consent-ready'));
}

function decline() {
  setStored('declined');
}

function injectBanner() {
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.setAttribute('aria-live', 'polite');
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:10000',
    'background:#1a3028', 'color:#eef4ec',
    'padding:1rem 1.5rem',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'gap:1rem', 'flex-wrap:wrap',
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif', 'font-size:0.875rem',
  ].join(';');

  const text = document.createElement('p');
  text.id = 'cookie-banner-text';
  text.style.cssText = 'margin:0;flex:1;min-width:0;line-height:1.5;';
  text.textContent = 'Usamos cookies de análisis para mejorar el sitio.';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:0.75rem;flex-shrink:0;';

  const btnBase = 'border-radius:6px;padding:0.5rem 1.25rem;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:0.875rem;font-weight:700;cursor:pointer;';

  const acceptBtn = document.createElement('button');
  acceptBtn.type = 'button';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.style.cssText = btnBase + 'background:#396452;color:#eef4ec;border:none;';
  acceptBtn.setAttribute('aria-describedby', 'cookie-banner-text');
  acceptBtn.addEventListener('click', () => { accept(); banner.remove(); });

  const declineBtn = document.createElement('button');
  declineBtn.type = 'button';
  declineBtn.textContent = 'Rechazar';
  declineBtn.style.cssText = btnBase + 'background:none;color:#eef4ec;border:1px solid #56816d;';
  declineBtn.setAttribute('aria-describedby', 'cookie-banner-text');
  declineBtn.addEventListener('click', () => { decline(); banner.remove(); });

  actions.append(acceptBtn, declineBtn);
  banner.append(text, actions);
  document.body.appendChild(banner);
}

const stored = getStored();
if (!stored) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
}
