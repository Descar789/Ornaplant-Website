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
  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'cookie-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10000',
    'background:rgba(0,0,0,0.55)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:1rem',
  ].join(';');

  // Modal card
  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cookie-title');
  modal.setAttribute('aria-describedby', 'cookie-desc');
  modal.style.cssText = [
    'background:#fff',
    'border-radius:16px',
    'padding:2rem',
    'max-width:420px', 'width:100%',
    'display:flex', 'flex-direction:column', 'gap:1.25rem',
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif',
    'box-shadow:0 8px 32px rgba(0,0,0,0.18)',
  ].join(';');

  // Icon
  const icon = document.createElement('div');
  icon.style.cssText = 'font-size:2.5rem;text-align:center;line-height:1;';
  icon.textContent = '🌿';

  // Title
  const title = document.createElement('h2');
  title.id = 'cookie-title';
  title.style.cssText = [
    'margin:0', 'text-align:center',
    'font-size:1.25rem', 'font-weight:800',
    'color:#1a3028',
  ].join(';');
  title.textContent = 'Cookies de análisis';

  // Description
  const desc = document.createElement('p');
  desc.id = 'cookie-desc';
  desc.style.cssText = [
    'margin:0', 'text-align:center',
    'font-size:0.9375rem', 'line-height:1.6',
    'color:#4a5e55',
  ].join(';');
  desc.textContent = 'Usamos cookies para entender cómo se usa el sitio y mejorar tu experiencia. No compartimos tus datos con terceros.';

  // Accept button — prominent
  const acceptBtn = document.createElement('button');
  acceptBtn.type = 'button';
  acceptBtn.textContent = 'Aceptar cookies';
  acceptBtn.style.cssText = [
    'width:100%',
    'background:#396452', 'color:#fff',
    'border:none', 'border-radius:10px',
    'padding:0.875rem 1.5rem',
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif',
    'font-size:1rem', 'font-weight:800',
    'cursor:pointer',
    'transition:background 150ms ease',
  ].join(';');
  acceptBtn.addEventListener('mouseenter', () => { acceptBtn.style.background = '#203b31'; });
  acceptBtn.addEventListener('mouseleave', () => { acceptBtn.style.background = '#396452'; });
  acceptBtn.addEventListener('click', () => { accept(); overlay.remove(); });

  // Decline button — smaller, de-emphasized
  const declineBtn = document.createElement('button');
  declineBtn.type = 'button';
  declineBtn.textContent = 'Continuar sin aceptar';
  declineBtn.style.cssText = [
    'width:100%',
    'background:none', 'color:#6b8c7a',
    'border:none',
    'padding:0.25rem',
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif',
    'font-size:0.8125rem', 'font-weight:600',
    'cursor:pointer', 'text-decoration:underline',
  ].join(';');
  declineBtn.addEventListener('click', () => { decline(); overlay.remove(); });

  modal.append(icon, title, desc, acceptBtn, declineBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus accept button for keyboard users
  requestAnimationFrame(() => acceptBtn.focus());
}

const stored = getStored();
if (!stored) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
}
