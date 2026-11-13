/**
 * HABITABOGOTÁ — /public/js/state.js
 * Estado global, sesión UUID anónima, cliente fetch (/api/*) y sincronización entre pestañas.
 */

const SESSION_KEY = 'habitabogota_sesion_uuid_v1';
const SYNC_EVENT_KEY = 'habitabogota_sync_ping_v1';
let memoryFallbackSessionId = null;

// Escapado estricto contra XSS al renderizar cadenas en plantillas
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateUUIDv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Genera o recupera el UUID anónimo una vez (try/catch seguro)
function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      id = generateUUIDv4();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    if (!memoryFallbackSessionId) {
      memoryFallbackSessionId = generateUUIDv4();
    }
    return memoryFallbackSessionId;
  }
}

const AppState = {
  sesionId: getSessionId(),
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
  orden: 'costo_asc',
  resultados: [],
  totalResultados: 0,
  barrios: [],
  guardados: [],
  guardadosInmuebles: [],
  comparador: [],
  comparadorInmuebles: [],
  inmueblesCache: {}, // Mapa id -> inmueble completo
  capasMapa: {
    transporte: true,
    supermercados: true,
    riesgo: true
  },
  listeners: [],
  filterListeners: []
};

function cacheInmuebles(list) {
  if (!Array.isArray(list)) return;
  list.forEach((item) => {
    if (item && item.id !== undefined) {
      AppState.inmueblesCache[String(item.id)] = item;
    }
  });
}

function getCachedInmueble(id) {
  return AppState.inmueblesCache[String(id)] || null;
}

// Formateador COP oficial con estándar colombiano
function formatCOP(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num);
}

// Cliente HTTP unificado hacia rutas relativas /api/...
async function apiFetch(url, options = {}) {
  const headers = {
    'X-Sesion-Id': AppState.sesionId,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = new Error(data?.error || 'Error al comunicarse con el servidor.');
    err.status = response.status;
    err.code = data?.code || 'API_ERROR';
    throw err;
  }

  return data;
}

// Canal de sincronización entre pestañas (mismo origen)
const syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('habitabogota_sync_v1')
  : null;

function broadcastCrossTabSync() {
  if (syncChannel) {
    syncChannel.postMessage({ type: 'SESSION_LISTS_UPDATED', ts: Date.now() });
  }
  try {
    localStorage.setItem(SYNC_EVENT_KEY, String(Date.now()));
  } catch {
    // Ignorar si almacenamiento restringido
  }
}

// Suscripción a cambios de guardados / comparador / UI
function subscribeState(callback) {
  AppState.listeners.push(callback);
}

// Suscripción a cambios exclusivos de filtros (para recargar /api/inmuebles)
function subscribeFilters(callback) {
  AppState.filterListeners.push(callback);
}

function notifyStateChange() {
  updateCountersUI();
  AppState.listeners.forEach((fn) => fn(AppState));
}

function notifyFiltersChange() {
  AppState.filterListeners.forEach((fn) => fn(AppState));
}

// Sincroniza Guardados y Comparador desde Neon Postgres
async function syncSessionLists() {
  try {
    const [savedData, compareData] = await Promise.all([
      apiFetch('/api/guardados'),
      apiFetch('/api/comparador')
    ]);

    AppState.guardados = Array.isArray(savedData.ids) ? savedData.ids.map(Number) : [];
    AppState.guardadosInmuebles = Array.isArray(savedData.inmuebles) ? savedData.inmuebles : [];
    AppState.comparador = Array.isArray(compareData.ids) ? compareData.ids.map(Number) : [];
    AppState.comparadorInmuebles = Array.isArray(compareData.inmuebles) ? compareData.inmuebles : [];

    cacheInmuebles(AppState.guardadosInmuebles);
    cacheInmuebles(AppState.comparadorInmuebles);
    notifyStateChange();
  } catch (err) {
    console.warn('No se pudieron sincronizar guardados/comparador:', err.message);
  }
}

// Alternar inmueble en Guardados (API real POST/DELETE /api/guardados)
async function toggleSaveProperty(rawId) {
  const id = Number(rawId);
  const isCurrentlySaved = AppState.guardados.includes(id);
  const item = getCachedInmueble(id);
  const titulo = item ? item.titulo : 'Inmueble';

  try {
    const data = isCurrentlySaved
      ? await apiFetch(`/api/guardados/${id}`, { method: 'DELETE' })
      : await apiFetch('/api/guardados', {
          method: 'POST',
          body: JSON.stringify({ inmueble_id: id })
        });

    AppState.guardados = data.ids.map(Number);
    AppState.guardadosInmuebles = data.inmuebles || [];
    cacheInmuebles(AppState.guardadosInmuebles);

    showToast(
      isCurrentlySaved
        ? `Removido de Guardados: ${titulo}`
        : `Guardado en tus favoritos: ${titulo}`
    );

    broadcastCrossTabSync();
    notifyStateChange();
  } catch (err) {
    showToast(err.message || 'No se pudo actualizar tus guardados.', 'icon-alert');
  }
}

// Alternar inmueble en Comparador (API real POST/DELETE /api/comparador, máx. 3)
async function toggleCompareProperty(rawId, forceAdd = null) {
  const id = Number(rawId);
  const isCurrentlyIn = AppState.comparador.includes(id);
  const shouldAdd = forceAdd !== null ? forceAdd : !isCurrentlyIn;

  try {
    const data = shouldAdd
      ? await apiFetch('/api/comparador', {
          method: 'POST',
          body: JSON.stringify({ inmueble_id: id })
        })
      : await apiFetch(`/api/comparador/${id}`, { method: 'DELETE' });

    AppState.comparador = data.ids.map(Number);
    AppState.comparadorInmuebles = data.inmuebles || [];
    cacheInmuebles(AppState.comparadorInmuebles);

    showToast(
      shouldAdd
        ? `Agregado al comparador (${AppState.comparador.length}/3)`
        : 'Removido del comparador'
    );

    broadcastCrossTabSync();
    notifyStateChange();
    return true;
  } catch (err) {
    showToast(
      err.message || 'Solo puedes comparar hasta 3 inmuebles simultáneos.',
      'icon-alert'
    );
    notifyStateChange();
    return false;
  }
}

async function clearAllComparison() {
  try {
    await apiFetch('/api/comparador', { method: 'DELETE' });
    AppState.comparador = [];
    AppState.comparadorInmuebles = [];
    broadcastCrossTabSync();
    notifyStateChange();
    showToast('Comparador vaciado');
  } catch (err) {
    showToast(err.message || 'No se pudo vaciar el comparador.', 'icon-alert');
  }
}

// Actualizar contadores en la barra de navegación y móvil
function updateCountersUI() {
  const countSaved = AppState.guardados.length;
  const countCompare = AppState.comparador.length;

  document.querySelectorAll('[data-counter="saved"]').forEach((el) => {
    el.textContent = countSaved;
  });

  document.querySelectorAll('[data-counter="compare"]').forEach((el) => {
    el.textContent = countCompare;
    el.classList.remove('badge-bump');
    void el.offsetWidth;
    el.classList.add('badge-bump');
  });
}

if (syncChannel) {
  syncChannel.onmessage = () => {
    syncSessionLists();
  };
}

window.addEventListener('storage', (e) => {
  if (e.key === SYNC_EVENT_KEY) {
    syncSessionLists();
  }
});
