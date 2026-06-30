import { getPlants, updatePlantInList, setSearchTerm, setCurrentPage, getCurrentPage, dispStyle, revisionStyle, setFilterCat, setFilterDisp, setFilterSuc, setSort, resetAllRevisionInList } from './admin-state.js';
import { renderList } from './admin-ui-list.js';
import { renderStats, openVisitasModal, closeVisitasModal } from './admin-ui-stats.js';
import { openModal, closeModal, savePlantUI, handleDeleteClick, handleImageUpload } from './admin-form.js';
import { doSignOut } from './admin-auth.js';
import { updatePlant, resetRevision } from '../../api.js?v=3';
import { showToast } from './admin-toast.js';
import { toggleNav, closeNav, toggleAccountMenu, closeAccountMenu, isAccountMenuOpen } from './admin-nav.js';
import { openUsersModal, closeUsersModal, createUserUI, handleUserDeleteClick, togglePassword } from './admin-users.js';

export function setupEvents() {
  // Availability change — optimistic with rollback
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('.disp-select');
    if (!sel) return;
    const row = sel.closest('.plant-row');
    if (!row) return;
    const id = row.dataset.id;
    const val = sel.value;
    const plant = getPlants().find(p => p.id === id);
    if (!plant) return;
    const prev = plant.disponibilidad;

    updatePlantInList(id, { disponibilidad: val });
    sel.className = `disp-select ${dispStyle(val)}`;
    renderStats();

    try {
      await updatePlant(id, { disponibilidad: val });
    } catch {
      updatePlantInList(id, { disponibilidad: prev });
      renderList();
      renderStats();
      showToast('Error al actualizar disponibilidad.', 'error');
    }
  });

  // Revision en linea - optimista con rollback
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('.revision-select');
    if (!sel) return;
    const row = sel.closest('.plant-row');
    if (!row) return;
    const id = row.dataset.id;
    const val = sel.value;
    const plant = getPlants().find(p => p.id === id);
    if (!plant) return;
    const prev = plant.revision_estado;

    updatePlantInList(id, { revision_estado: val });
    sel.className = `revision-select ${revisionStyle(val)}`;
    renderStats();

    try {
      await updatePlant(id, { revision_estado: val });
    } catch {
      updatePlantInList(id, { revision_estado: prev });
      sel.className = `revision-select ${revisionStyle(prev)}`;
      sel.value = prev || 'no revisada';
      renderStats();
      showToast('Error al actualizar revision.', 'error');
    }
  });

  // Sucursal en linea - optimista con rollback
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('.suc-select');
    if (!sel) return;
    const row = sel.closest('.plant-row');
    if (!row) return;
    const id = row.dataset.id;
    const val = sel.value;
    const plant = getPlants().find(p => p.id === id);
    if (!plant) return;
    const prev = plant.sucursal;

    updatePlantInList(id, { sucursal: val });
    try {
      await updatePlant(id, { sucursal: val });
    } catch {
      updatePlantInList(id, { sucursal: prev });
      sel.value = prev || 'ambas';
      showToast('Error al actualizar sucursal.', 'error');
    }
  });

  // Image upload
  document.addEventListener('change', (e) => {
    if (e.target.type === 'file' && e.target.accept?.includes('image')) {
      handleImageUpload(e.target);
    }
  });

  // Search
  document.addEventListener('input', (e) => {
    if (e.target.id === 'adminSearch') {
      setSearchTerm(e.target.value.trim());
      renderList();
    }
  });

  // Confirmacion escrita para reinicio masivo de revision
  document.addEventListener('input', (e) => {
    if (e.target.id === 'reset-revision-confirm') {
      const btn = document.getElementById('confirmResetRevisionBtn');
      if (!btn) return;
      const ok = e.target.value.trim() === 'REINICIAR';
      btn.disabled = !ok;
      btn.style.opacity = ok ? '1' : '0.5';
    }
  });

  // Filters + sort
  document.addEventListener('change', (e) => {
    if (e.target.id === 'filterCat')  { setFilterCat(e.target.value);  renderList(); return; }
    if (e.target.id === 'filterDisp') { setFilterDisp(e.target.value); renderList(); return; }
    if (e.target.id === 'filterSuc')  { setFilterSuc(e.target.value);  renderList(); return; }
    if (e.target.id === 'sortSelect') {
      const [field, dir] = e.target.value.split(':');
      setSort(field, dir);
      renderList();
    }
  });

  document.addEventListener('click', (e) => {
    // Account menu toggle + cerrar al hacer click fuera
    if (e.target.closest('#accountTrigger')) { toggleAccountMenu(); return; }
    if (isAccountMenuOpen() && !e.target.closest('#accountDropdown')) closeAccountMenu();

    // Drawer móvil
    if (e.target.closest('[data-action="toggle-nav"]')) { toggleNav(); return; }
    if (e.target.closest('[data-action="close-nav"]')) { closeNav(); return; }

    // Gestión de perfiles
    if (e.target.closest('[data-action="open-users-modal"]')) {
      closeAccountMenu(); closeNav(); openUsersModal(); return;
    }
    if (e.target.closest('[data-action="close-users-modal"]') || e.target.id === 'usersModal') { closeUsersModal(); return; }

    // Reinicio masivo de revision (solo dueno)
    if (e.target.closest('[data-action="open-reset-revision-modal"]')) {
      closeAccountMenu(); closeNav();
      const input = document.getElementById('reset-revision-confirm');
      const btn = document.getElementById('confirmResetRevisionBtn');
      if (input) input.value = '';
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
      const modal = document.getElementById('resetRevisionModal');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (e.target.closest('[data-action="close-reset-revision-modal"]') || e.target.id === 'resetRevisionModal') {
      const modal = document.getElementById('resetRevisionModal');
      if (modal) modal.style.display = 'none';
      return;
    }
    if (e.target.closest('#confirmResetRevisionBtn')) {
      const btn = e.target.closest('#confirmResetRevisionBtn');
      if (btn.disabled) return;
      btn.disabled = true;
      resetRevision()
        .then(() => {
          resetAllRevisionInList();
          renderList();
          renderStats();
          const modal = document.getElementById('resetRevisionModal');
          if (modal) modal.style.display = 'none';
          showToast('Revision reiniciada en todas las plantas.', 'success');
        })
        .catch((err) => {
          btn.disabled = false;
          showToast('Error al reiniciar: ' + err.message, 'error');
        });
      return;
    }

    if (e.target.closest('[data-action="toggle-password"]')) { togglePassword(e.target.closest('[data-action="toggle-password"]')); return; }
    if (e.target.closest('#createUserBtn')) { createUserUI(); return; }
    const userDel = e.target.closest('.user-del-btn');
    if (userDel) {
      const uid = userDel.closest('.user-row')?.dataset.id;
      if (uid) handleUserDeleteClick(uid, userDel);
      return;
    }

    // Cerrar drawer al elegir un item de la sidebar (sin bloquear otros handlers)
    if (e.target.closest('.admin-sidebar .nav-item:not([disabled])')) { closeNav(); }

    // Pagination
    const pgBtn = e.target.closest('#adminPagination button[data-page]');
    if (pgBtn && !pgBtn.disabled) {
      const page = parseInt(pgBtn.dataset.page, 10);
      if (page && page !== getCurrentPage()) {
        setCurrentPage(page);
        renderList();
        const heading = document.getElementById('plants-heading');
        if (heading) window.scrollTo({ top: heading.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
      }
      return;
    }

    // Add plant
    if (e.target.closest('#addPlantBtn')) { openModal(); return; }

    // Edit
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) { openModal(editBtn.closest('.plant-row')?.dataset.id ?? null); return; }

    // Delete (2-click confirm)
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      const id = delBtn.closest('.plant-row')?.dataset.id;
      if (id) handleDeleteClick(id, delBtn);
      return;
    }

    // Visits detail modal
    if (e.target.closest('[data-action="open-visitas-modal"]')) { openVisitasModal(); return; }
    if (e.target.closest('[data-action="close-visitas-modal"]') || e.target.id === 'visitasModal') { closeVisitasModal(); return; }

    // Close modal (button or overlay click)
    if (e.target.closest('[data-action="close-modal"]') || e.target.id === 'plantModal') { closeModal(); return; }

    // Save
    if (e.target.closest('#saveBtn')) { savePlantUI(); return; }

    // Sign out
    if (e.target.closest('[data-action="sign-out"]')) { doSignOut(); return; }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeVisitasModal();
      closeUsersModal();
      closeAccountMenu();
      closeNav();
      const resetModal = document.getElementById('resetRevisionModal');
      if (resetModal) resetModal.style.display = 'none';
    }
  });
}
