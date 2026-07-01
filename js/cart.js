import {
  getCart,
  removeFromCart,
  clearCart,
  getCartCount,
  getBuyerType,
  setBuyerType,
} from './cart-state.js?v=1';
import { WHATSAPP_NUMBER } from '../config.js?v=2';

const FONT = '"Plus Jakarta Sans",system-ui,sans-serif';
const PANEL_ID = 'ornaplant-cart-panel';
const OVERLAY_ID = 'ornaplant-cart-overlay';
const FAB_ID = 'ornaplant-cart-fab';
const STYLES_ID = 'ornaplant-cart-styles';
const CHANGE_EVENT = 'ornaplant:cart-changed';

function buildMessage(items, buyerType) {
  const names = items.map((item, index) => `${index + 1}. ${item.nombre}`).join('\n');
  const skus = items.map((item, index) => `${index + 1}. ${item.sku || '(sin SKU)'}`).join('\n');
  let message = `Hola, me interesan estas plantas:\n\nPlantas:\n${names}\n\nSKUs:\n${skus}`;

  if (buyerType === 'mayoreo') {
    message += '\n\nPedido de mayoreo.';
  } else if (buyerType === 'menudeo') {
    message += '\n\nPedido de menudeo — recojo en sucursal.';
  }

  return message;
}

function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    #${FAB_ID} {
      position: fixed;
      right: 1.75rem;
      bottom: 6rem;
      z-index: 950;
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 50%;
      background: #396452;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(32, 59, 49, 0.3);
      transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      touch-action: manipulation;
      outline-offset: 3px;
    }

    #${FAB_ID}[hidden] {
      display: none !important;
    }

    #${FAB_ID}:hover {
      background: #203b31;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(32, 59, 49, 0.34);
    }

    #${FAB_ID}:focus-visible,
    #${PANEL_ID} button:focus-visible {
      outline: 3px solid rgba(180, 60, 109, 0.48);
      outline-offset: 3px;
    }

    #ornaplant-cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border: 2px solid #ffffff;
      border-radius: 999px;
      background: #b43c6d;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${FONT};
      font-size: 0.6875rem;
      font-weight: 800;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: none;
      background: rgba(0, 0, 0, 0.48);
      opacity: 0;
      transition: opacity 180ms ease;
    }

    #${OVERLAY_ID}.is-open {
      opacity: 1;
    }

    #${PANEL_ID} {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 1001;
      width: min(400px, 92vw);
      height: 100dvh;
      background: #ffffff;
      color: #223029;
      box-shadow: -8px 0 32px rgba(26, 48, 40, 0.18);
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 240ms ease;
      font-family: ${FONT};
    }

    #${PANEL_ID}.is-open {
      transform: translateX(0);
    }

    .ornaplant-cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e8efeb;
    }

    .ornaplant-cart-title {
      margin: 0;
      color: #1a3028;
      font-family: ${FONT};
      font-size: 1.0625rem;
      font-weight: 800;
      line-height: 1.25;
    }

    .ornaplant-cart-icon-btn {
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #5a7568;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 150ms ease, color 150ms ease;
      touch-action: manipulation;
    }

    .ornaplant-cart-icon-btn:hover {
      background: #eef4ec;
      color: #203b31;
    }

    #ornaplant-cart-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 1.5rem;
    }

    .ornaplant-cart-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-height: 52px;
      padding: 0.625rem 0;
      border-bottom: 1px solid #f1f5f3;
    }

    .ornaplant-cart-name {
      color: #1a3028;
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .ornaplant-cart-remove {
      color: #b43c6d;
    }

    .ornaplant-cart-empty {
      margin: 2rem auto 0;
      max-width: 24ch;
      color: #69776d;
      font-size: 0.9rem;
      line-height: 1.55;
      text-align: center;
    }

    .ornaplant-cart-footer {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding: 1.25rem 1.5rem calc(1.25rem + env(safe-area-inset-bottom));
      border-top: 1px solid #e8efeb;
      background: #ffffff;
    }

    .ornaplant-cart-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .ornaplant-cart-choice {
      min-height: 44px;
      padding: 0.5rem;
      border: 1.5px solid #d7e4dd;
      border-radius: 8px;
      background: #ffffff;
      color: #586a61;
      cursor: pointer;
      font-family: ${FONT};
      font-size: 0.75rem;
      font-weight: 800;
      line-height: 1.25;
      transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
      touch-action: manipulation;
    }

    .ornaplant-cart-choice.is-active {
      border-color: #166534;
      background: #dcfce7;
      color: #166534;
    }

    .ornaplant-cart-send {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 8px;
      background: #25d366;
      color: #ffffff;
      cursor: pointer;
      font-family: ${FONT};
      font-size: 0.9375rem;
      font-weight: 800;
      transition: background 150ms ease, transform 120ms ease;
      touch-action: manipulation;
    }

    .ornaplant-cart-send:hover {
      background: #128c7e;
    }

    .ornaplant-cart-send:active {
      transform: scale(0.98);
    }

    .ornaplant-cart-send:disabled {
      background: #a9c2b5;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 480px) {
      #${FAB_ID} {
        right: 1rem;
        bottom: 5rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #${FAB_ID},
      #${OVERLAY_ID},
      #${PANEL_ID},
      #${PANEL_ID} button {
        transition: none !important;
      }

      #${FAB_ID}:hover,
      .ornaplant-cart-send:active {
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function createIcon(name) {
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = name;
  return icon;
}

function injectCartUI() {
  if (document.getElementById(FAB_ID)) return;

  injectStyles();

  const fab = document.createElement('button');
  fab.id = FAB_ID;
  fab.type = 'button';
  fab.hidden = true;
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', PANEL_ID);
  fab.appendChild(createIcon('shopping_cart'));

  const badge = document.createElement('span');
  badge.id = 'ornaplant-cart-badge';
  fab.appendChild(badge);

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('aria-labelledby', 'ornaplant-cart-title');

  const header = document.createElement('div');
  header.className = 'ornaplant-cart-header';

  const title = document.createElement('h2');
  title.id = 'ornaplant-cart-title';
  title.className = 'ornaplant-cart-title';
  title.textContent = 'Tu selección';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'ornaplant-cart-icon-btn';
  closeButton.setAttribute('aria-label', 'Cerrar carrito');
  closeButton.appendChild(createIcon('close'));
  header.append(title, closeButton);

  const list = document.createElement('div');
  list.id = 'ornaplant-cart-list';
  list.setAttribute('aria-live', 'polite');

  const footer = document.createElement('div');
  footer.className = 'ornaplant-cart-footer';

  const toggle = document.createElement('div');
  toggle.className = 'ornaplant-cart-toggle';

  const wholesaleButton = document.createElement('button');
  wholesaleButton.type = 'button';
  wholesaleButton.className = 'ornaplant-cart-choice';
  wholesaleButton.textContent = 'Para mi negocio/vivero';
  wholesaleButton.setAttribute('aria-pressed', 'false');

  const retailButton = document.createElement('button');
  retailButton.type = 'button';
  retailButton.className = 'ornaplant-cart-choice';
  retailButton.textContent = 'Para mi casa';
  retailButton.setAttribute('aria-pressed', 'false');

  toggle.append(wholesaleButton, retailButton);

  const sendButton = document.createElement('button');
  sendButton.type = 'button';
  sendButton.className = 'ornaplant-cart-send';
  sendButton.textContent = 'Enviar por WhatsApp';

  footer.append(toggle, sendButton);
  panel.append(header, list, footer);
  document.body.append(fab, overlay, panel);

  let lastFocusedElement = null;
  let closeTimer = 0;

  function renderFab() {
    const count = getCartCount();
    fab.hidden = count === 0;
    badge.textContent = String(count);
    badge.setAttribute('aria-label', `${count} plantas seleccionadas`);
    fab.setAttribute('aria-label', `Ver carrito: ${count} planta${count === 1 ? '' : 's'} seleccionada${count === 1 ? '' : 's'}`);
  }

  function setChoiceState(button, active) {
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }

  function renderToggle() {
    const buyerType = getBuyerType();
    setChoiceState(wholesaleButton, buyerType === 'mayoreo');
    setChoiceState(retailButton, buyerType === 'menudeo');
  }

  function renderList() {
    list.replaceChildren();
    const items = getCart();
    sendButton.disabled = items.length === 0;

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'ornaplant-cart-empty';
      empty.textContent = 'No has agregado plantas todavía.';
      list.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'ornaplant-cart-row';

      const name = document.createElement('span');
      name.className = 'ornaplant-cart-name';
      name.textContent = item.nombre;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'ornaplant-cart-icon-btn ornaplant-cart-remove';
      removeButton.setAttribute('aria-label', `Quitar ${item.nombre} del carrito`);
      removeButton.appendChild(createIcon('close'));
      removeButton.addEventListener('click', () => removeFromCart(item.id));

      row.append(name, removeButton);
      list.appendChild(row);
    });
  }

  function renderAll() {
    renderFab();
    renderToggle();
    renderList();
  }

  function openPanel() {
    clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    overlay.style.display = 'block';
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      panel.classList.add('is-open');
      closeButton.focus();
    });
  }

  function closePanel() {
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    closeTimer = window.setTimeout(() => {
      overlay.style.display = 'none';
    }, 190);

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === 'function' &&
      document.contains(lastFocusedElement) &&
      !lastFocusedElement.hidden
    ) {
      lastFocusedElement.focus();
    }
  }

  fab.addEventListener('click', openPanel);
  closeButton.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) {
      closePanel();
    }
  });

  wholesaleButton.addEventListener('click', () => setBuyerType('mayoreo'));
  retailButton.addEventListener('click', () => setBuyerType('menudeo'));

  sendButton.addEventListener('click', () => {
    const items = getCart();
    if (items.length === 0) return;

    const message = buildMessage(items, getBuyerType());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    clearCart();
    closePanel();
  });

  window.addEventListener(CHANGE_EVENT, renderAll);
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCartUI);
} else {
  injectCartUI();
}
