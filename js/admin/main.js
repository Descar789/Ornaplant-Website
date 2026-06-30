import { isLoggedAndValid, showScreen, setupAuthEvents } from './admin-auth.js';
import { renderAccountUI } from './admin-nav.js';
import { setupEvents } from './admin-events.js';
import { setPlants, setGlobalVisits } from './admin-state.js';
import { renderList } from './admin-ui-list.js';
import { renderStats } from './admin-ui-stats.js';
import { getPlants as fetchPlants, getGlobalVisits as fetchVisits } from '../../api.js?v=3';

let panelBooted = false;

async function bootPanel() {
  if (panelBooted) return;
  panelBooted = true;

  renderAccountUI();

  showScreen('adminPanel');
  setupEvents();

  const listContainer = document.getElementById('plantList');
  if (listContainer) listContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#69776d;">Cargando plantas...</div>';

  try {
    const [plants, visits] = await Promise.all([
      fetchPlants(),
      fetchVisits().catch(() => ({ total: 0 })),
    ]);
    setPlants(plants);
    setGlobalVisits((visits && visits.total) || 0);
    renderStats();
    renderList();
  } catch {
    if (listContainer) listContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#991b1b;">Error al cargar datos.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupAuthEvents();
  document.addEventListener('admin:login-success', bootPanel);

  if (isLoggedAndValid()) {
    bootPanel();
  } else {
    showScreen('loginScreen');
  }
});
