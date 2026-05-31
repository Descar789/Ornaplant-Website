import {
  getPlants, getSearchTerm, getCurrentPage, dispStyle,
  getFilterCat, getFilterDisp, getFilterSuc, getSortField, getSortDir,
} from './admin-state.js';

const ADMIN_PAGE_SIZE = 10;

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getProcessedData() {
  const plants  = getPlants();
  const term    = getSearchTerm().toLowerCase();
  const cat     = getFilterCat();
  const disp    = getFilterDisp();
  const suc     = getFilterSuc();
  const field   = getSortField();
  const dir     = getSortDir();
  const page    = getCurrentPage();

  const filtered = plants.filter(p => {
    if (cat  && p.categoria     !== cat)  return false;
    if (disp && p.disponibilidad !== disp) return false;
    if (suc  && p.sucursal       !== suc)  return false;
    if (!term) return true;
    if ((p.nombre         || '').toLowerCase().includes(term)) return true;
    if ((p.nombreCientifico || '').toLowerCase().includes(term)) return true;
    if ((p.sku            || '').toLowerCase().includes(term)) return true;
    if (Array.isArray(p.etiquetas) && p.etiquetas.some(t => (t || '').toLowerCase().includes(term))) return true;
    return false;
  });

  filtered.sort((a, b) => {
    if (field === 'vistas') {
      const diff = (a.vistas ?? 0) - (b.vistas ?? 0);
      return dir === 'asc' ? diff : -diff;
    }
    const va = (field === 'sku' ? a.sku : a.nombre) || '';
    const vb = (field === 'sku' ? b.sku : b.nombre) || '';
    const cmp = va.localeCompare(vb, 'es');
    return dir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  const start = (page - 1) * ADMIN_PAGE_SIZE;
  return { slice: filtered.slice(start, start + ADMIN_PAGE_SIZE), totalFiltered: filtered.length, totalPages };
}

export function renderList() {
  const listContainer = document.getElementById('plantList');
  const template      = document.getElementById('plant-row-template');
  const pagEl         = document.getElementById('adminPagination');
  const countEl       = document.getElementById('adminCount');

  if (!listContainer || !template) return;

  const plants = getPlants();
  if (plants.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#69776d;">
        <span class="material-symbols-outlined" style="font-size:3rem;display:block;margin:0 auto 0.75rem;color:#ddd2bf;">inbox</span>
        <p>No hay plantas. Agrega la primera.</p>
      </div>`;
    if (pagEl) { pagEl.hidden = true; pagEl.innerHTML = ''; }
    if (countEl) countEl.textContent = '';
    return;
  }

  const { slice, totalFiltered, totalPages } = getProcessedData();
  if (countEl) countEl.textContent = `${totalFiltered} de ${plants.length}`;

  if (totalFiltered === 0) {
    const hasFilters = getFilterCat() || getFilterDisp() || getFilterSuc();
    listContainer.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#69776d;">
        <span class="material-symbols-outlined" style="font-size:3rem;display:block;margin:0 auto 0.75rem;color:#ddd2bf;">search_off</span>
        <p>${hasFilters ? 'Sin resultados con los filtros activos.' : `Sin resultados para "${esc(getSearchTerm())}"`}</p>
      </div>`;
    if (pagEl) { pagEl.hidden = true; pagEl.innerHTML = ''; }
    return;
  }

  listContainer.innerHTML = '';
  slice.forEach(p => {
    const clone = template.content.cloneNode(true);
    const row   = clone.querySelector('.plant-row');
    row.dataset.id = p.id;

    const img = clone.querySelector('.plant-thumb');
    img.src = (p.imagenes && p.imagenes[0]) || '';
    img.alt = p.nombre || '';

    clone.querySelector('.plant-nombre').textContent    = p.nombre || '';
    clone.querySelector('.plant-cientifico').textContent = p.nombreCientifico || '';

    const catEl = clone.querySelector('.plant-cat-badge');
    catEl.textContent = p.categoria || '';

    const metaEl = clone.querySelector('.plant-meta');
    if (p.sku) { metaEl.textContent = p.sku; metaEl.style.display = 'block'; }
    else { metaEl.style.display = 'none'; }

    const select = clone.querySelector('.disp-select');
    select.className = `disp-select ${dispStyle(p.disponibilidad)}`;
    select.value = p.disponibilidad || 'disponible';
    select.setAttribute('aria-label', `Disponibilidad de ${p.nombre}`);

    clone.querySelector('.edit-btn').setAttribute('aria-label',   `Editar ${p.nombre}`);
    clone.querySelector('.delete-btn').setAttribute('aria-label', `Eliminar ${p.nombre}`);

    listContainer.appendChild(clone);
  });

  renderAdminPagination(totalPages);
}

function renderAdminPagination(totalPages) {
  const pagEl      = document.getElementById('adminPagination');
  const currentPage = getCurrentPage();
  if (!pagEl) return;
  if (totalPages <= 1) { pagEl.hidden = true; pagEl.innerHTML = ''; return; }

  pagEl.hidden = false;
  const WINDOW = 3;
  const pages = new Set([1, totalPages]);
  for (let i = currentPage - WINDOW; i <= currentPage + WINDOW; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const parts = [`<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior"><span class="material-symbols-outlined">chevron_left</span></button>`];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) parts.push(`<span class="ellipsis" aria-hidden="true">…</span>`);
    parts.push(`<button type="button" data-page="${p}" class="${p === currentPage ? 'is-active' : ''}" ${p === currentPage ? 'aria-current="page"' : ''}>${p}</button>`);
    prev = p;
  }
  parts.push(`<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente"><span class="material-symbols-outlined">chevron_right</span></button>`);
  pagEl.innerHTML = parts.join('');
}
