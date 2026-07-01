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

function dismiss(overlay) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { overlay.remove(); return; }
  overlay.style.opacity = '0';
  setTimeout(() => overlay.remove(), 200);
}

function injectBanner() {
  if (document.getElementById('cookie-overlay')) return; // guard double-render

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';

  // ── Overlay ──────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'cookie-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10000',
    'background:rgba(0,0,0,0.5)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:1rem',
    reduced ? '' : 'opacity:0;transition:opacity 200ms ease',
  ].join(';');

  // ── Modal card ────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cookie-title');
  modal.setAttribute('aria-describedby', 'cookie-desc');
  modal.style.cssText = [
    'background:#ffffff',
    'border-radius:20px',
    'padding:2rem 1.75rem 1.5rem',
    'max-width:400px', 'width:100%',
    'display:flex', 'flex-direction:column', 'align-items:center', 'gap:1rem',
    `font-family:${FONT}`,
    'box-shadow:0 24px 64px rgba(26,48,40,0.18),0 4px 16px rgba(26,48,40,0.07)',
    'text-align:center',
    reduced ? '' : 'transform:scale(0.94) translateY(8px);transition:transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
  ].join(';');

  // ── Leaf SVG icon ─────────────────────────────────────────
  const iconWrap = document.createElement('div');
  iconWrap.style.cssText = [
    'width:60px', 'height:60px',
    'background:#eef4ec',
    'border-radius:50%',
    'display:flex', 'align-items:center', 'justify-content:center',
    'flex-shrink:0',
  ].join(';');
  // SVG is fully hardcoded — no user data, no XSS risk
  iconWrap.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6.5 20C4.5 18 3 15.5 3 12C3 7.03 7.03 3 12 3C12 3 12 10 7 14C9.5 14 13 12.5 15 9C16.5 11 17 13.5 15.5 16C17.5 15 19 13 19 10.5C20.3 12 21 14 21 16C21 19.87 17.87 23 14 23C11.5 23 9.5 22 8 20.5" stroke="#396452" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22V14" stroke="#396452" stroke-width="1.75" stroke-linecap="round"/></svg>';

  // ── Title ─────────────────────────────────────────────────
  const title = document.createElement('h2');
  title.id = 'cookie-title';
  title.style.cssText = [
    'margin:0',
    'font-size:1.1875rem', 'font-weight:800', 'line-height:1.3',
    'color:#1a3028',
    `font-family:${FONT}`,
    'letter-spacing:-0.015em',
  ].join(';');
  title.textContent = 'Cookies de análisis';

  // ── Description ───────────────────────────────────────────
  const desc = document.createElement('p');
  desc.id = 'cookie-desc';
  desc.style.cssText = [
    'margin:0',
    'font-size:0.9rem', 'line-height:1.65',
    'color:#4e6a5f',
    `font-family:${FONT}`,
    'max-width:320px',
  ].join(';');
  desc.textContent = 'Usamos cookies para entender cómo se usa el sitio y mejorar tu experiencia. No compartimos tus datos con terceros.';

  // ── Divider ───────────────────────────────────────────────
  const divider = document.createElement('div');
  divider.setAttribute('aria-hidden', 'true');
  divider.style.cssText = 'width:100%;height:1px;background:#e2efe7;';

  // ── Accept button — primary, prominent ────────────────────
  const acceptBtn = document.createElement('button');
  acceptBtn.type = 'button';
  acceptBtn.textContent = 'Aceptar cookies';
  acceptBtn.style.cssText = [
    'width:100%',
    'background:#396452', 'color:#ffffff',
    'border:none', 'border-radius:12px',
    'padding:0.9375rem 1.5rem',
    `font-family:${FONT}`,
    'font-size:1rem', 'font-weight:700',
    'cursor:pointer',
    'transition:background 150ms ease,transform 120ms ease,box-shadow 150ms ease',
    'box-shadow:0 2px 8px rgba(57,100,82,0.28)',
    'outline-offset:3px',
  ].join(';');
  acceptBtn.addEventListener('mouseenter', () => {
    acceptBtn.style.background = '#203b31';
    acceptBtn.style.transform = 'translateY(-1px)';
    acceptBtn.style.boxShadow = '0 6px 16px rgba(57,100,82,0.38)';
  });
  acceptBtn.addEventListener('mouseleave', () => {
    acceptBtn.style.background = '#396452';
    acceptBtn.style.transform = '';
    acceptBtn.style.boxShadow = '0 2px 8px rgba(57,100,82,0.28)';
  });
  acceptBtn.addEventListener('click', () => { accept(); dismiss(overlay); });

  // ── Decline button — de-emphasized ───────────────────────
  const declineBtn = document.createElement('button');
  declineBtn.type = 'button';
  declineBtn.textContent = 'Continuar sin aceptar';
  declineBtn.style.cssText = [
    'background:none', 'border:none',
    'color:#7da592',
    `font-family:${FONT}`,
    'font-size:0.8125rem', 'font-weight:600',
    'cursor:pointer',
    'padding:0.25rem 0.5rem',
    'text-decoration:underline',
    'text-underline-offset:3px',
    'transition:color 150ms ease',
    'margin-top:-0.25rem',
  ].join(';');
  declineBtn.addEventListener('mouseenter', () => { declineBtn.style.color = '#396452'; });
  declineBtn.addEventListener('mouseleave', () => { declineBtn.style.color = '#7da592'; });
  declineBtn.addEventListener('click', () => { decline(); dismiss(overlay); });

  // ── Escape key ────────────────────────────────────────────
  function onKeydown(e) {
    if (e.key === 'Escape') {
      decline();
      dismiss(overlay);
      document.removeEventListener('keydown', onKeydown);
    }
  }
  document.addEventListener('keydown', onKeydown);

  modal.append(iconWrap, title, desc, divider, acceptBtn, declineBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // ── Entrance animation ────────────────────────────────────
  if (!reduced) {
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1) translateY(0)';
    });
  }

  acceptBtn.focus();
}

const stored = getStored();
if (!stored) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
}
