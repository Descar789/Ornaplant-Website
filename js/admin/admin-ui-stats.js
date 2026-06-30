import { getPlants, getGlobalVisits } from './admin-state.js';

const FALLBACK_PLANT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"%3E%3Crect width="36" height="36" rx="8" fill="%23eef4ec"/%3E%3Ctext x="18" y="24" text-anchor="middle" font-size="18" fill="%23a0b9ad"%3E🌿%3C/text%3E%3C/svg%3E';

function plantViews(plant) {
  return Number(plant?.vistas ?? 0) || 0;
}

function createVisitRow(plant, index) {
  const row = document.createElement('div');
  row.className = 'visits-row';

  const rank = document.createElement('span');
  rank.className = 'visits-rank';
  rank.textContent = String(index + 1);

  const img = document.createElement('img');
  img.className = 'visits-thumb';
  img.src = plant?.imagenes?.[0] || FALLBACK_PLANT_IMAGE;
  img.alt = plant?.nombre ? `Imagen de ${plant.nombre}` : '';
  img.onerror = () => {
    img.onerror = null;
    img.src = FALLBACK_PLANT_IMAGE;
  };

  const info = document.createElement('div');
  info.className = 'visits-info';

  const name = document.createElement('div');
  name.className = 'visits-name';
  name.textContent = plant?.nombre || 'Sin nombre';

  info.appendChild(name);

  const views = document.createElement('span');
  views.className = 'visits-count';
  views.textContent = String(plantViews(plant));

  row.append(rank, img, info, views);
  return row;
}

export function openVisitasModal() {
  const modal = document.getElementById('visitasModal');
  const list = document.getElementById('visitasModalList');
  if (!modal || !list) return;

  list.textContent = '';

  const plants = getPlants()
    .filter(plant => plantViews(plant) > 0)
    .sort((a, b) => plantViews(b) - plantViews(a));

  if (plants.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'visits-empty';
    empty.textContent = 'Sin visitas registradas.';
    list.appendChild(empty);
  } else {
    plants.forEach((plant, index) => {
      list.appendChild(createVisitRow(plant, index));
    });
  }

  modal.style.display = 'flex';
}

export function closeVisitasModal() {
  const modal = document.getElementById('visitasModal');
  if (modal) modal.style.display = 'none';
}

export function renderStats() {
  const plants = getPlants();
  let disponibles = 0, agotadas = 0, porRevisar = 0, revisadas = 0;
  const cats = new Set();
  plants.forEach(p => {
    if (p.disponibilidad === 'disponible') disponibles++;
    if (p.disponibilidad === 'agotado') agotadas++;
    if ((p.revision_estado || 'no revisada') === 'no revisada') porRevisar++;
    else revisadas++;
    if (p.categoria) cats.add(p.categoria);
  });

  const stats = [
    { icon: 'local_florist', num: plants.length, label: 'Total Plantas' },
    { icon: 'check_circle',  num: disponibles,   label: 'Disponibles' },
    { icon: 'cancel',        num: agotadas,      label: 'Agotados' },
    { icon: 'fact_check',    num: porRevisar,    label: 'Por revisar' },
    { icon: 'task_alt',      num: revisadas,     label: 'Revisadas' },
    { icon: 'visibility',    num: getGlobalVisits(), label: 'Visitas Generales', detail: true },
    { icon: 'category',      num: cats.size,     label: 'Categorías' },
  ];

  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  // stats array is fully hardcoded — no user data reaches innerHTML here
  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">
        <span class="material-symbols-outlined">${s.icon}</span>
      </div>
      <div>
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">
          ${s.label}
          ${s.detail ? '<button type="button" class="visits-detail-btn" data-action="open-visitas-modal">detalles</button>' : ''}
        </div>
      </div>
    </div>`).join('');
}
