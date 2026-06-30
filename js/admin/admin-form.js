import { createPlant, updatePlant, deletePlant, uploadImage } from '../../api.js?v=3';
import { getPlants, addPlantToList, updatePlantInList, removePlantFromList } from './admin-state.js';
import { renderList } from './admin-ui-list.js';
import { renderStats } from './admin-ui-stats.js';
import { showToast } from './admin-toast.js';

let editingId = null;
let pendingImageUrl = '';
let deleteConfirmId = null;
let deleteConfirmTimer = null;

export function openModal(id = null) {
  editingId = id;
  pendingImageUrl = '';
  document.getElementById('uploadStatus0').textContent = '';
  document.getElementById('imgPreview0').style.display = 'none';
  document.getElementById('modalTitle').textContent = id ? 'Editar planta' : 'Agregar planta';

  if (id) {
    const p = getPlants().find(x => x.id === id);
    if (!p) return;
    setVal('f-nombre', p.nombre);
    setVal('f-sci', p.nombreCientifico);
    setVal('f-cat', p.categoria);
    setVal('f-disp', p.disponibilidad);
    setVal('f-desc', p.descripcion);
    setVal('f-luz', p.luz);
    setVal('f-riego', p.riego);
    setVal('f-cuidado', p.cuidado);
    setVal('f-suc', p.sucursal || 'ambas');
    setVal('f-mascotas', p.mascotas);
    setVal('f-etiquetas', (p.etiquetas || []).join(', '));
    setVal('f-variaciones', (p.variaciones || []).join(', '));
    setVal('f-sku', p.sku || '');
    const url = (p.imagenes || [])[0] || '';
    if (url) {
      pendingImageUrl = url;
      document.getElementById('imgPreviewEl0').src = url;
      document.getElementById('imgPreview0').style.display = 'block';
    }
  } else {
    ['f-nombre','f-sci','f-desc','f-etiquetas','f-variaciones','f-sku'].forEach(id => setVal(id, ''));
    setVal('f-cat', 'ornamental');
    setVal('f-disp', 'disponible');
    setVal('f-luz', 'luz indirecta');
    setVal('f-riego', 'medio');
    setVal('f-cuidado', 'fácil');
    setVal('f-suc', 'ambas');
    setVal('f-mascotas', 'no tóxica');
  }

  const skuInput = document.getElementById('f-sku');
  skuInput.oninput = () => { skuInput.value = skuInput.value.toUpperCase(); };

  document.getElementById('plantModal').style.display = 'flex';
  document.getElementById('f-nombre').focus();
}

export function closeModal() {
  document.getElementById('plantModal').style.display = 'none';
  editingId = null;
  pendingImageUrl = '';
  resetDeleteConfirm();
}

export async function savePlantUI() {
  const nombre = document.getElementById('f-nombre').value.trim();
  if (!nombre) { showFieldError('f-nombre', 'El nombre es requerido.'); return; }

  const desc = document.getElementById('f-desc').value.trim();
  if (!desc) { showFieldError('f-desc', 'La descripción es requerida.'); return; }

  const sku = document.getElementById('f-sku').value.trim().toUpperCase();
  if (sku) {
    if (sku.length > 10) { showFieldError('f-sku', 'Máximo 10 caracteres.'); return; }
    const conflict = getPlants().find(p => p.id !== editingId && p.sku === sku);
    if (conflict) { showFieldError('f-sku', `SKU en uso: "${conflict.nombre}".`); return; }
  }

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const data = {
    nombre,
    nombreCientifico: document.getElementById('f-sci').value.trim(),
    categoria:        document.getElementById('f-cat').value,
    disponibilidad:   document.getElementById('f-disp').value,
    descripcion:      desc,
    luz:              document.getElementById('f-luz').value,
    riego:            document.getElementById('f-riego').value,
    cuidado:          document.getElementById('f-cuidado').value,
    sucursal:         document.getElementById('f-suc').value,
    mascotas:         document.getElementById('f-mascotas').value,
    etiquetas:  document.getElementById('f-etiquetas').value.split(',').map(s => s.trim()).filter(Boolean),
    variaciones: document.getElementById('f-variaciones').value.split(',').map(s => s.trim()).filter(Boolean),
    imagenes: pendingImageUrl
      ? [pendingImageUrl]
      : ['https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop'],
    sku: sku || null,
  };

  try {
    if (editingId) {
      await updatePlant(editingId, data);
      updatePlantInList(editingId, data);
      showToast('Planta actualizada.', 'success');
    } else {
      const res = await createPlant(data);
      addPlantToList({ id: res.id, ...data });
      showToast('Planta guardada.', 'success');
    }
    closeModal();
    renderStats();
    renderList();
  } catch (e) {
    if (e.status === 409 && e.field === 'sku') {
      showFieldError('f-sku', 'SKU ya registrado en el servidor.');
    } else {
      showToast('Error al guardar: ' + e.message, 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">save</span> Guardar';
  }
}

export function handleDeleteClick(id, btn) {
  if (deleteConfirmId === id) {
    clearTimeout(deleteConfirmTimer);
    resetDeleteConfirm();
    doDelete(id);
    return;
  }
  if (deleteConfirmId) resetDeleteConfirm();
  deleteConfirmId = id;
  btn.innerHTML = '¿Confirmar?';
  btn.style.cssText += ';background:#fecaca;color:#991b1b;';
  deleteConfirmTimer = setTimeout(resetDeleteConfirm, 3000);
}

async function doDelete(id) {
  try {
    await deletePlant(id);
    removePlantFromList(id);
    renderStats();
    renderList();
    showToast('Planta eliminada.', 'success');
  } catch (e) {
    showToast('Error al eliminar: ' + e.message, 'error');
  }
}

function resetDeleteConfirm() {
  if (deleteConfirmId) {
    const row = document.querySelector(`[data-id="${deleteConfirmId}"]`);
    if (row) {
      const btn = row.querySelector('.delete-btn');
      if (btn) {
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">delete</span>';
        btn.style.background = '';
        btn.style.color = '';
      }
    }
  }
  deleteConfirmId = null;
  if (deleteConfirmTimer) { clearTimeout(deleteConfirmTimer); deleteConfirmTimer = null; }
}

export async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById('uploadStatus0');
  const sku = document.getElementById('f-sku').value.trim().toUpperCase();
  if (!sku) {
    statusEl.textContent = 'Define primero el SKU.';
    statusEl.style.color = '#991b1b';
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    statusEl.textContent = 'Imagen mayor a 5MB.';
    statusEl.style.color = '#991b1b';
    input.value = '';
    return;
  }
  statusEl.textContent = 'Subiendo...';
  statusEl.style.color = '#69776d';
  try {
    const url = await uploadImage(file, sku);
    pendingImageUrl = url;
    document.getElementById('imgPreviewEl0').src = `${url}?t=${Date.now()}`;
    document.getElementById('imgPreview0').style.display = 'block';
    statusEl.textContent = 'Subida ✓';
    statusEl.style.color = '#166534';
  } catch (e) {
    statusEl.textContent = 'Error: ' + (e?.message || 'falló subida');
    statusEl.style.color = '#991b1b';
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.style.borderColor = '#f87171';
  let errEl = document.getElementById(`${fieldId}-err`);
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.id = `${fieldId}-err`;
    errEl.style.cssText = 'display:block;font-size:0.75rem;color:#991b1b;margin-top:0.25rem;font-family:"Plus Jakarta Sans",sans-serif;';
    field.parentNode.appendChild(errEl);
  }
  errEl.textContent = msg;
  field.addEventListener('input', () => {
    field.style.borderColor = '';
    errEl.remove();
  }, { once: true });
}
