import { getPlants, getGlobalVisits } from './admin-state.js';

export function renderStats() {
  const plants = getPlants();
  let disponibles = 0, agotadas = 0;
  const cats = new Set();
  plants.forEach(p => {
    if (p.disponibilidad === 'disponible') disponibles++;
    if (p.disponibilidad === 'agotado') agotadas++;
    if (p.categoria) cats.add(p.categoria);
  });

  const stats = [
    { icon: 'local_florist', num: plants.length, label: 'Total Plantas' },
    { icon: 'check_circle',  num: disponibles,   label: 'Disponibles' },
    { icon: 'cancel',        num: agotadas,      label: 'Agotados' },
    { icon: 'visibility',    num: getGlobalVisits(), label: 'Visitas Generales' },
    { icon: 'category',      num: cats.size,     label: 'Categorías' },
  ];

  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">
        <span class="material-symbols-outlined">${s.icon}</span>
      </div>
      <div>
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>`).join('');
}
