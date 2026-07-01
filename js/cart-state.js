const CART_KEY = 'ornaplant_cart';
const BUYER_KEY = 'ornaplant_buyer_type';
const CHANGE_EVENT = 'ornaplant:cart-changed';

function normalizeId(id) {
  return String(id);
}

function normalizeItem(item) {
  return {
    id: normalizeId(item.id),
    nombre: item.nombre ? String(item.nombre) : '',
    sku: item.sku ? String(item.sku) : '',
    slug: item.slug ? String(item.slug) : '',
  };
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && item.id != null && item.nombre)
      .map(normalizeItem);
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* silent */
  }
}

function readBuyerType() {
  try {
    const type = localStorage.getItem(BUYER_KEY);
    return type === 'mayoreo' || type === 'menudeo' ? type : null;
  } catch {
    return null;
  }
}

function writeBuyerType(type) {
  try {
    if (type) {
      localStorage.setItem(BUYER_KEY, type);
    } else {
      localStorage.removeItem(BUYER_KEY);
    }
  } catch {
    /* silent */
  }
}

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

let cartItems = readCart();
let buyerType = readBuyerType();

export function getCart() {
  return cartItems.map(item => ({ ...item }));
}

export function isInCart(id) {
  const normalizedId = normalizeId(id);
  return cartItems.some(item => item.id === normalizedId);
}

export function addToCart(item) {
  if (!item || item.id == null || !item.nombre) return;
  const normalizedItem = normalizeItem(item);
  if (isInCart(normalizedItem.id)) return;
  cartItems = [...cartItems, normalizedItem];
  writeCart(cartItems);
  notifyChange();
}

export function removeFromCart(id) {
  const normalizedId = normalizeId(id);
  cartItems = cartItems.filter(item => item.id !== normalizedId);
  writeCart(cartItems);
  notifyChange();
}

export function clearCart() {
  cartItems = [];
  writeCart(cartItems);
  buyerType = null;
  writeBuyerType(null);
  notifyChange();
}

export function getCartCount() {
  return cartItems.length;
}

export function getBuyerType() {
  return buyerType;
}

export function setBuyerType(type) {
  buyerType = type === 'mayoreo' || type === 'menudeo' ? type : null;
  writeBuyerType(buyerType);
  notifyChange();
}
