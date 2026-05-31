let plantList = [];
let globalVisits = 0;
let adminSearchTerm = '';
let adminCurrentPage = 1;

export function getPlants() { return plantList; }
export function setPlants(plants) { plantList = plants; }

export function getGlobalVisits() { return globalVisits; }
export function setGlobalVisits(visits) { globalVisits = visits; }

export function getSearchTerm() { return adminSearchTerm; }
export function setSearchTerm(term) { adminSearchTerm = term; adminCurrentPage = 1; }

export function getCurrentPage() { return adminCurrentPage; }
export function setCurrentPage(page) { adminCurrentPage = page; }

export function updatePlantInList(id, data) {
  const idx = plantList.findIndex(p => p.id === id);
  if (idx > -1) plantList[idx] = { ...plantList[idx], ...data };
}

export function addPlantToList(plant) {
  plantList.unshift(plant);
}

export function removePlantFromList(id) {
  plantList = plantList.filter(p => p.id !== id);
}

export function dispStyle(d) {
  return d === 'disponible' ? 'disponible' : d === 'bajo pedido' ? 'bajo-pedido' : 'agotado';
}

// ── Filtros y orden ───────────────────────────────────────────────
let filterCat  = '';
let filterDisp = '';
let filterSuc  = '';
let sortField  = 'nombre';
let sortDir    = 'asc';

export function getFilterCat()  { return filterCat; }
export function setFilterCat(v)  { filterCat  = v; adminCurrentPage = 1; }
export function getFilterDisp() { return filterDisp; }
export function setFilterDisp(v) { filterDisp = v; adminCurrentPage = 1; }
export function getFilterSuc()  { return filterSuc; }
export function setFilterSuc(v)  { filterSuc  = v; adminCurrentPage = 1; }
export function getSortField()  { return sortField; }
export function getSortDir()    { return sortDir; }
export function setSort(field, dir) { sortField = field; sortDir = dir; adminCurrentPage = 1; }
export function resetFilters() {
  filterCat = ''; filterDisp = ''; filterSuc = '';
  sortField = 'nombre'; sortDir = 'asc'; adminCurrentPage = 1;
}
