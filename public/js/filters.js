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
  if (filters.localidad && filters.localidad !== 'todos') {
    params.set('localidad', filters.localidad);
  }
  const qVal = filters.keyword || filters.q || '';
  if (qVal && qVal.trim() !== '') {
    params.set('q', qVal.trim());
  }
  const pMin = Number(filters.precioMin || filters.precio_min || 0);
  if (pMin > 0) {
    params.set('precio_min', String(pMin));
  }
  const pMax = Number(filters.precioMax || filters.precio_max || 0);
  if (pMax > 0) {
    params.set('precio_max', String(pMax));
  }
  const hab = Number(filters.habitacionesMin || filters.habitaciones || 0);
  if (hab > 0) {
    params.set('habitaciones', String(hab));
  }

  if (filters.mascotas) params.set('mascotas', 'true');
  if (filters.parqueadero) params.set('parqueadero', 'true');
  if (filters.balcon) params.set('balcon', 'true');
  if (filters.gimnasio) params.set('gimnasio', 'true');
  if (filters.piscina) params.set('piscina', 'true');
  if (filters.porteria) params.set('porteria', 'true');

  if (sortOrder) {
    params.set('orden', sortOrder);
  }

  return params;
}

// Sincroniza los controles del DOM con el estado actual de AppState.filtros
function syncFilterControlsUI() {
  const f = AppState.filtros;
  const opActive = f.operacion || 'todos';

  document.querySelectorAll('[data-op-btn]').forEach((btn) => {
    btn.classList.toggle('segmented-pill--active', btn.getAttribute('data-op-btn') === opActive);
  });

  document.querySelectorAll('.neighborhood-chip, .chip-localidad').forEach((btn) => {
    const locAttr = btn.getAttribute('data-localidad') || btn.querySelector('span')?.textContent?.trim();
    const isAct = Boolean(f.localidad && locAttr === f.localidad);
    btn.classList.toggle('neighborhood-chip--active', isAct);
    btn.classList.toggle('activo', isAct);
  });

  const tipoSelect = document.getElementById('filter-type');
  if (tipoSelect) tipoSelect.value = f.tipo || 'todos';

  const kwInput = document.getElementById('filter-keyword');
  if (kwInput) kwInput.value = f.keyword || f.q || '';

  const heroInput = document.getElementById('hero-search-input');
  if (heroInput) heroInput.value = f.keyword || f.q || '';

  const minInput = document.getElementById('filter-price-min');
  if (minInput) minInput.value = f.precioMin > 0 ? String(f.precioMin) : '';

  const maxInput = document.getElementById('filter-price-max');
  if (maxInput) maxInput.value = f.precioMax > 0 ? String(f.precioMax) : '';

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
  if (sortSelect && AppState.orden) sortSelect.value = AppState.orden;
}

function resetAllFilters() {
  AppState.filtros = { ...filtrosIniciales };
  AppState.orden = null;
  syncFilterControlsUI();
  notifyFiltersChange();
}

function aplicarFiltros(nuevosFiltros = {}) {
  Object.assign(AppState.filtros, nuevosFiltros);
  syncFilterControlsUI();
  notifyFiltersChange();
}

// Aplica filtros sugeridos por Habi o URL
function applySuggestedFilters(suggested = {}) {
  const f = AppState.filtros;
  f.operacion = suggested.operacion && suggested.operacion !== 'todos' ? suggested.operacion : '';
  f.tipo = suggested.tipo && suggested.tipo !== 'todos' ? suggested.tipo : '';
  f.localidad = suggested.localidad || '';
  f.keyword = suggested.keyword || '';
  f.q = suggested.keyword || '';
  f.precioMin = suggested.precioMin ?? 0;
  f.precioMax = suggested.precioMax ?? 0;
  f.habitacionesMin = suggested.habitacionesMin ?? 0;
  f.mascotas = Boolean(suggested.mascotas);
  f.parqueadero = Boolean(suggested.parqueadero);
  f.balcon = Boolean(suggested.balcon);
  f.gimnasio = Boolean(suggested.gimnasio);
  f.piscina = Boolean(suggested.piscina);
  f.porteria = Boolean(suggested.porteria);

  syncFilterControlsUI();
  notifyFiltersChange();
}
