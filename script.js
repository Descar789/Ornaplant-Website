/* ORNAPLANT — Shared UI Script */

(function () {
  'use strict';

  const header = document.getElementById('header');
  const navMenu = document.getElementById('navMenu');
  const navToggle = document.getElementById('navToggle');
  const navIcon = document.getElementById('navIcon');
  const backToTop = document.getElementById('backToTop');

  // ── Sticky header + back-to-top visibility ──────────────
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile hamburger menu ───────────────────────────────
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      if (navIcon) navIcon.textContent = isOpen ? 'close' : 'menu';
    });
    navMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navIcon) navIcon.textContent = 'menu';
      });
    });
    document.addEventListener('click', e => {
      if (header && !header.contains(e.target)) {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navIcon) navIcon.textContent = 'menu';
      }
    });
  }

  // ── Back-to-top ─────────────────────────────────────────
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ── Active nav link (by current filename or path) ────────
  let path = window.location.pathname;
  if (path.endsWith('/')) path += 'index.html';
  let page = path.split('/').pop();
  if (path.includes('/catalogo/') || path.includes('/planta/')) {
    page = 'catalogo.html';
  }
  document.querySelectorAll('.nav-menu a').forEach(a => {
    let href = a.getAttribute('href') || '';
    if (href.startsWith('/')) href = href.substring(1);
    if (href === '' || href === '/') href = 'index.html';
    const cleanHref = href.split('/').pop();
    if (cleanHref === page) a.classList.add('active');
  });

  // ── Scroll-reveal ────────────────────────────────────────
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  function getApiBase() {
    const scriptEl = document.querySelector('script[src*="script.js"]');
    if (!scriptEl) return '';
    const src = scriptEl.getAttribute('src');
    const absUrl = new URL(src, window.location.href);
    return absUrl.origin + absUrl.pathname.substring(0, absUrl.pathname.lastIndexOf('/')) + '/api';
  }

  // Registro de Visita Global (Pageviews)
  (function trackGlobalVisit() {
    try {
      const apiBase = getApiBase();
      if (!apiBase) return;
      fetch(apiBase + '/visitas.php', { method: 'POST' })
        .catch(() => {});
    } catch (e) {}
  })();

  // Registro de Visita por Planta (detalle)
  (function trackPlantVisit() {
    try {
      const plantId = window.__ORNAPLANT_PLANT_ID__;
      if (!plantId) return;
      const apiBase = getApiBase();
      if (!apiBase) return;
      const url = apiBase + '/plantas.php?id=' + encodeURIComponent(plantId) + '&action=incrementar_vistas';
      fetch(url, { method: 'PATCH' })
        .catch(() => {});
    } catch (e) {}
  })();
})();
