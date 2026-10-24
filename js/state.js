/**
 * HABITABOGOTÁ — /js/state.js
 * Estado global, almacenamiento seguro en localStorage y sincronización entre pestañas.
 */

const STORAGE_KEYS = {
  SAVED: 'habitabogota_guardados_v2',
  COMPARE: 'habitabogota_comparador_v2'
};

const AppState = {
  filtros: {
    operacion: 'arriendo', // 'arriendo' | 'venta' | 'todos'
    tipo: 'todos',        // 'todos' | 'apartamento' | 'casa' | 'local'
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
  },
  orden: 'price-asc',
  guardados: [],
  comparador: [],
  capasMapa: {
    transporte: true,
    supermercados: true,
    riesgo: true
  },
  listeners: []
};

// Formateador COP oficial con estándar colombiano
function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Carga segura desde localStorage
function loadSavedState() {
  try {
    const rawSaved = localStorage.getItem(STORAGE_KEYS.SAVED);
    if (rawSaved) AppState.guardados = JSON.parse(rawSaved);

    const rawCompare = localStorage.getItem(STORAGE_KEYS.COMPARE);
    if (rawCompare) AppState.comparador = JSON.parse(rawCompare);
  } catch (err) {
    console.warn('Almacenamiento local restringido en este navegador:', err);
  }
}

// Guardado seguro en localStorage
function persistState() {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(AppState.guardados));
    localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(AppState.comparador));
  } catch (err) {
    console.warn('Error al persistir en localStorage:', err);
  }
}

// Suscripción a cambios de estado
function subscribeState(callback) {
  AppState.listeners.push(callback);
}

function notifyStateChange() {
  updateCountersUI();
  AppState.listeners.forEach(fn => fn(AppState));
}

// Alternar inmueble en Guardados (Favoritos)
function toggleSaveProperty(id) {
  const index = AppState.guardados.indexOf(id);
  const item = INMUEBLES_BOGOTA.find(x => x.id === id);
  const titulo = item ? item.titulo : 'Inmueble';

  if (index > -1) {
    AppState.guardados.splice(index, 1);
    showToast(`Removido de Guardados: ${titulo}`);
  } else {
    AppState.guardados.push(id);
    showToast(`Guardado en tus favoritos: ${titulo}`);
  }

  persistState();
  notifyStateChange();
}

// Alternar inmueble en Comparador (Máximo 3)
function toggleCompareProperty(id, forceAdd = null) {
  const isCurrentlyIn = AppState.comparador.includes(id);
  const shouldAdd = forceAdd !== null ? forceAdd : !isCurrentlyIn;
  const item = INMUEBLES_BOGOTA.find(x => x.id === id);
  const titulo = item ? item.titulo : 'Inmueble';

  if (shouldAdd) {
    if (AppState.comparador.length >= 3) {
      showToast('Solo puedes comparar hasta 3 inmuebles simultáneos para conservar una tabla legible.', 'icon-alert');
      notifyStateChange();
      return false;
    }
    if (!isCurrentlyIn) {
      AppState.comparador.push(id);
      showToast(`Agregado al comparador (${AppState.comparador.length}/3)`);
    }
  } else {
    const idx = AppState.comparador.indexOf(id);
    if (idx > -1) {
      AppState.comparador.splice(idx, 1);
      showToast(`Removido del comparador`);
    }
  }

  persistState();
  notifyStateChange();
  return true;
}

// Actualizar contadores en la barra de navegación y móvil
function updateCountersUI() {
  const countSaved = AppState.guardados.length;
  const countCompare = AppState.comparador.length;

  document.querySelectorAll('[data-counter="saved"]').forEach(el => {
    el.textContent = countSaved;
  });

  document.querySelectorAll('[data-counter="compare"]').forEach(el => {
    el.textContent = countCompare;
    // Microinteracción: pequeño salto visual al actualizar
    el.classList.remove('badge-bump');
    void el.offsetWidth; // Trigger reflow
    el.classList.add('badge-bump');
  });
}

// Sincronización entre pestañas en tiempo real
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.SAVED || e.key === STORAGE_KEYS.COMPARE) {
    loadSavedState();
    notifyStateChange();
  }
});

// Inicialización de estado
loadSavedState();
