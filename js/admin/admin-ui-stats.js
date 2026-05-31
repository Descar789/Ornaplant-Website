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
    { icon: 'local_florist', num: plants.length, label: 'Total plantas' },
    { icon: 'check_circle',  num: disponibles,   label: 'Disponibles' },
    { icon: 'cancel',        num: agotadas,      label: 'Agotadas' },
    { icon: 'visibility',    num: getGlobalVisits(), label: 'Visitas generales' },
    { icon: 'category',      num: cats.size,     label: 'Categorías' },
  ];

  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = stats.map(s => `
    <div class="stat-card" style="display:flex;align-items:center;gap:1rem;">
      <span class="material-symbols-outlined" style="color:#56816d;font-size:1.75rem;">${s.icon}</span>
      <div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.75rem;font-weight:800;color:#223029;line-height:1;">${s.num}</div>
        <div style="font-size:0.8125rem;color:#69776d;">${s.label}</div>
      </div>
    </div>`).join('');
}
