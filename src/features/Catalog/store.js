import { atom, map } from 'nanostores';

// Almacena la lista completa de productos
export const catalogItemsStore = atom([]);

// Filtros activos
export const catalogFiltersStore = map({
    search: '',
    marca: 'Todos',
    categoria: 'Todos',
});

// Resultados filtrados (derivados en el cliente)
export function updateFilters(newFilters) {
    catalogFiltersStore.set({ ...catalogFiltersStore.get(), ...newFilters });
}
