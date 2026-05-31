let toastTimer = null;

export function showToast(message, type = 'success') {
  let el = document.getElementById('admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-toast';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    Object.assign(el.style, {
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      padding: '0.75rem 1.25rem', borderRadius: '10px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: '600', fontSize: '0.875rem', zIndex: '99999',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      transition: 'opacity 250ms', maxWidth: '320px', lineHeight: '1.4',
    });
    document.body.appendChild(el);
  }

  const s = {
    success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    error:   { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    info:    { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  }[type] ?? { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };

  Object.assign(el.style, s, { opacity: '1', display: 'block' });
  el.textContent = message;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
