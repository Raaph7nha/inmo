/**
 * HABITABOGOTÁ — /public/js/filters.js
 * Construcción de parámetros de consulta API y utilidades de costo total transparente.
 */

function calculateTotalCost(property) {
  if (!property) return 0;
  if (property.costo_total !== undefined && property.costo_total !== null) {
    return Number(property.costo_total);
  }
  const base = Number(property.precio ?? property.precioBase ?? 0);
  const admin = Number(property.administracion ?? 0);
  return property.operacion === 'arriendo' ? base + admin : base;
}

function buildInmueblesQueryParams(filters, sortOrder) {
  const params = new URLSearchParams();

  if (filters.operacion && filters.operacion !== 'todos') {
    params.set('operacion', filters.operacion);
  }
  if (filters.tipo && filters.tipo !== 'todos') {
    params.set('tipo', filters.tipo);
  }
  if (filters.keyword && filters.keyword.trim() !== '') {
    params.set('q', filters.keyword.trim());
  }
  if (filters.precioMin !== null && filters.precioMin !== undefined && filters.precioMin !== '') {
    params.set('precio_min', String(filters.precioMin));
  }
  if (filters.precioMax !== null && filters.precioMax !== undefined && filters.precioMax !== '') {
    params.set('precio_max', String(filters.precioMax));
  }
  if (filters.habitacionesMin > 0) {
    params.set('habitaciones', String(filters.habitacionesMin));
  }

  if (filters.mascotas) params.set('mascotas', 'true');
  if (filters.parqueadero) params.set('parqueadero', 'true');
  if (filters.balcon) params.set('balcon', 'true');
  if (filters.gimnasio) params.set('gimnasio', 'true');
  if (filters.piscina) params.set('piscina', 'true');
  if (filters.porteria) params.set('porteria', 'true');
  if (filters.tour3D) params.set('tour_3d', 'true');

  if (sortOrder) {
    params.set('orden', sortOrder);
  }

  return params;
}

// Sincroniza los controles del DOM con el estado actual de AppState.filtros
function syncFilterControlsUI() {
  const f = AppState.filtros;

  document.querySelectorAll('[data-op-btn]').forEach((btn) => {
    btn.classList.toggle('segmented-pill--active', btn.getAttribute('data-op-btn') === f.operacion);
  });

  const tipoSelect = document.getElementById('filter-type');
  if (tipoSelect) tipoSelect.value = f.tipo || 'todos';

  const kwInput = document.getElementById('filter-keyword');
  if (kwInput) kwInput.value = f.keyword || '';

  const heroInput = document.getElementById('hero-search-input');
  if (heroInput) heroInput.value = f.keyword || '';

  const minInput = document.getElementById('filter-price-min');
  if (minInput) minInput.value = f.precioMin ? String(f.precioMin) : '';

  const maxInput = document.getElementById('filter-price-max');
  if (maxInput) maxInput.value = f.precioMax ? String(f.precioMax) : '';

  const roomsDisplay = document.getElementById('rooms-display-val');
  if (roomsDisplay) {
    roomsDisplay.textContent = f.habitacionesMin === 0 ? 'Cualquiera' : `${f.habitacionesMin}+`;
  }

  document.querySelectorAll('[data-toggle-filter]').forEach((btn) => {
    const key = btn.getAttribute('data-toggle-filter');
    const active = Boolean(f[key]);
    btn.classList.toggle('toggle-chip--active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = AppState.orden;
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
  syncFilterControlsUI();
  notifyFiltersChange();
}

// Aplica filtros sugeridos por Habi o URL
function applySuggestedFilters(suggested = {}) {
  const f = AppState.filtros;
  f.operacion = suggested.operacion || 'todos';
  f.tipo = suggested.tipo || 'todos';
  f.keyword = suggested.keyword || '';
  f.precioMin = suggested.precioMin ?? null;
  f.precioMax = suggested.precioMax ?? null;
  f.habitacionesMin = suggested.habitacionesMin ?? 0;
  f.mascotas = Boolean(suggested.mascotas);
  f.parqueadero = Boolean(suggested.parqueadero);
  f.balcon = Boolean(suggested.balcon);
  f.gimnasio = Boolean(suggested.gimnasio);
  f.piscina = Boolean(suggested.piscina);
  f.porteria = Boolean(suggested.porteria);
  f.tour3D = Boolean(suggested.tour3D);

  syncFilterControlsUI();
  notifyFiltersChange();
}
