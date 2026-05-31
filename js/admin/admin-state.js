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
