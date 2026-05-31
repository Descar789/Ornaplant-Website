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
export function updatePlantDisponibilidad(id, val) {
  const p = plantList.find(x => x.id === id);
  if (p) p.disponibilidad = val;
}
