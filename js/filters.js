/**
 * HABITABOGOTÁ — /js/filters.js
 * Motor de filtrado facetado (Ley de Miller) y ordenamiento de inmuebles.
 */

function calculateTotalCost(property) {
  if (property.operacion === 'arriendo') {
    return property.precioBase + property.administracion;
  }
  return property.precioBase;
}

function filterProperties(catalog, filters, sortOrder) {
  return catalog.filter(item => {
    // 1. Filtro de Operación
    if (filters.operacion !== 'todos' && item.operacion !== filters.operacion) {
      return false;
    }

    // 2. Filtro de Tipo de Inmueble
    if (filters.tipo !== 'todos' && item.tipo !== filters.tipo) {
      return false;
    }

    // 3. Palabra Clave (Barrio, Título, Dirección o Descripción)
    if (filters.keyword && filters.keyword.trim() !== '') {
      const q = filters.keyword.toLowerCase().trim();
      const match = item.barrio.toLowerCase().includes(q) ||
                    item.titulo.toLowerCase().includes(q) ||
                    item.direccion.toLowerCase().includes(q) ||
                    item.descripcion.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 4. Rango de Precio (Sobre el costo total transparente)
    const costoTotal = calculateTotalCost(item);
    if (filters.precioMin !== null && costoTotal < filters.precioMin) {
      return false;
    }
    if (filters.precioMax !== null && costoTotal > filters.precioMax) {
      return false;
    }

    // 5. Habitaciones mínimas
    if (filters.habitacionesMin > 0 && item.habitaciones < filters.habitacionesMin) {
      return false;
    }

    // 6. Comodidades clave (AND booleano)
    if (filters.mascotas && !item.caracteristicas.mascotas) return false;
    if (filters.parqueadero && !item.caracteristicas.parqueadero) return false;
    if (filters.balcon && !item.caracteristicas.balcon) return false;
    if (filters.gimnasio && !item.caracteristicas.gimnasio) return false;
    if (filters.piscina && !item.caracteristicas.piscina) return false;
    if (filters.porteria && !item.caracteristicas.porteria) return false;
    if (filters.tour3D && !item.tour3D) return false;

    return true;
  }).sort((a, b) => {
    const costA = calculateTotalCost(a);
    const costB = calculateTotalCost(b);

    if (sortOrder === 'price-asc') return costA - costB;
    if (sortOrder === 'price-desc') return costB - costA;
    if (sortOrder === 'area-desc') return b.m2 - a.m2;
    if (sortOrder === 'recent') return new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion);
    return 0;
  });
}

function resetAllFilters() {
  AppState.filtros = {
    operacion: 'todos',
    tipo: 'todos',
    keyword: '',
    precioMin: null,
    precioMax: null,
    habitacionesMin: 0,
    mascotas: false,
    parqueadero: false,
    balcon: false,
    gimnasio: false,
    piscina: false,
    porteria: false,
    tour3D: false
  };
  notifyStateChange();
}
