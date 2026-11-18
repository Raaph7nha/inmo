/**
 * HABITABOGOTÁ — /public/js/state.js
 * Estado global, sesión UUID anónima, cliente fetch (/api/*) con localStorage y sincronización entre pestañas.
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

const filtrosIniciales = {
  operacion: '',
  tipo: '',
  q: '',
  keyword: '',
  localidad: '',
  precio_min: 0,
  precio_max: 0,
  precioMin: 0,
  precioMax: 0,
  habitaciones: 0,
  habitacionesMin: 0,
  mascotas: false,
  parqueadero: false,
  balcon: false,
  gimnasio: false,
  piscina: false,
  porteria: false,
  tour3D: false
};

const AppState = {
  sesionId: getSessionId(),
  filtros: { ...filtrosIniciales },
  orden: null,
  resultados: [],
  totalResultados: 0,
  barrios: [],
  guardados: [],
  guardadosInmuebles: [],
  comparador: [],
  comparadorInmuebles: [],
  inmueblesCache: {},
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

function formatCOP(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(num);
}

// Cliente HTTP unificado hacia rutas relativas /api/... con credentials: 'include'
async function apiFetch(url, options = {}) {
  const headers = {
    'X-Sesion-Id': AppState.sesionId,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
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

const syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('habitabogota_sync_v1')
  : null;

function broadcastCrossTabSync() {
  if (syncChannel) {
    syncChannel.postMessage({ type: 'SESSION_LISTS_UPDATED', ts: Date.now() });
  }
  try {
    localStorage.setItem(SYNC_EVENT_KEY, String(Date.now()));
  } catch {}
}

function subscribeState(callback) {
  AppState.listeners.push(callback);
}

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

// Obtiene los objetos completos de inmuebles a partir de un array de IDs,
// usando caché local o consultando GET /api/viviendas?ids=1,2,3
async function fetchInmueblesForIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const missing = ids.filter((id) => !getCachedInmueble(id));

  if (missing.length > 0) {
    try {
      const data = await apiFetch(`/api/viviendas/multiples?ids=${missing.join(',')}`);
      const fetched = Array.isArray(data.data?.items)
        ? data.data.items
        : (Array.isArray(data.data) ? data.data : (Array.isArray(data.viviendas) ? data.viviendas : []));
      cacheInmuebles(fetched);
    } catch {
      // Si falla la consulta masiva, intentamos buscar en resultados actuales si los hay
    }
  }

  return ids.map((id) => getCachedInmueble(id)).filter(Boolean);
}

// Sincroniza Guardados y Comparador (API si autenticado, localStorage si anónimo)
async function syncSessionLists() {
  if (!window.usuarioActual) {
    try {
      const savedIds = JSON.parse(localStorage.getItem('habi_guardados') || '[]');
      const compareIds = JSON.parse(localStorage.getItem('habi_comparador') || '[]');
      AppState.guardados = savedIds.map(Number);
      AppState.comparador = compareIds.map(Number);

      [AppState.guardadosInmuebles, AppState.comparadorInmuebles] = await Promise.all([
        fetchInmueblesForIds(AppState.guardados),
        fetchInmueblesForIds(AppState.comparador)
      ]);

      notifyStateChange();
    } catch {
      AppState.guardados = [];
      AppState.comparador = [];
      AppState.guardadosInmuebles = [];
      AppState.comparadorInmuebles = [];
      notifyStateChange();
    }
    return;
  }

  try {
    const [savedRes, compareRes] = await Promise.all([
      apiFetch('/api/guardados'),
      apiFetch('/api/comparador')
    ]);

    const savedData = savedRes.data || savedRes;
    const compareData = compareRes.data || compareRes;

    const savedIds = savedData.ids || savedData.data?.ids || [];
    const savedItems = savedData.items || savedData.inmuebles || savedData.data?.items || savedData.data?.inmuebles || [];
    const compareIds = compareData.ids || compareData.data?.ids || [];
    const compareItems = compareData.items || compareData.inmuebles || compareData.data?.items || compareData.data?.inmuebles || [];

    AppState.guardados = Array.isArray(savedIds) ? savedIds.map(Number) : [];
    AppState.guardadosInmuebles = Array.isArray(savedItems) ? savedItems : [];
    AppState.comparador = Array.isArray(compareIds) ? compareIds.map(Number) : [];
    AppState.comparadorInmuebles = Array.isArray(compareItems) ? compareItems : [];

    cacheInmuebles(AppState.guardadosInmuebles);
    cacheInmuebles(AppState.comparadorInmuebles);
    notifyStateChange();
  } catch (err) {
    console.warn('No se pudieron sincronizar guardados/comparador:', err.message);
  }
}

// Alternar inmueble en Guardados
async function toggleSaveProperty(rawId) {
  const id = Number(rawId);
  const isCurrentlySaved = AppState.guardados.includes(id);
  const item = getCachedInmueble(id);
  const titulo = item ? item.titulo : 'Inmueble';

  if (!window.usuarioActual) {
    let savedIds = [];
    try {
      savedIds = JSON.parse(localStorage.getItem('habi_guardados') || '[]').map(Number);
    } catch {
      savedIds = [];
    }

    if (isCurrentlySaved) {
      savedIds = savedIds.filter((i) => i !== id);
      AppState.guardadosInmuebles = AppState.guardadosInmuebles.filter((i) => i.id !== id);
    } else {
      if (!savedIds.includes(id)) savedIds.push(id);
      if (item && !AppState.guardadosInmuebles.some((i) => i.id === id)) {
        AppState.guardadosInmuebles.push(item);
      }
    }
    localStorage.setItem('habi_guardados', JSON.stringify(savedIds));
    AppState.guardados = savedIds;

    // Asegurar que guardadosInmuebles esté actualizado si el ítem estaba en caché
    AppState.guardadosInmuebles = await fetchInmueblesForIds(AppState.guardados);

    showToast(
      isCurrentlySaved
        ? `Removido de Guardados: ${titulo}`
        : `Guardado en tus favoritos: ${titulo}`
    );
    broadcastCrossTabSync();
    notifyStateChange();
    return;
  }

  try {
    const res = isCurrentlySaved
      ? await apiFetch(`/api/guardados/${id}`, { method: 'DELETE' })
      : await apiFetch('/api/guardados', {
          method: 'POST',
          body: JSON.stringify({ inmueble_id: id })
        });

    const payload = res.data || res;
    AppState.guardados = (payload.ids || []).map(Number);
    AppState.guardadosInmuebles = payload.items || payload.inmuebles || [];
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

// Alternar inmueble en Comparador
async function toggleCompareProperty(rawId, forceAdd = null) {
  const id = Number(rawId);
  const isCurrentlyIn = AppState.comparador.includes(id);
  const shouldAdd = forceAdd !== null ? forceAdd : !isCurrentlyIn;
  const item = getCachedInmueble(id);

  if (!window.usuarioActual) {
    let compareIds = [];
    try {
      compareIds = JSON.parse(localStorage.getItem('habi_comparador') || '[]').map(Number);
    } catch {
      compareIds = [];
    }

    if (shouldAdd) {
      if (compareIds.length >= 3 && !compareIds.includes(id)) {
        showToast('Solo puedes comparar hasta 3 inmuebles simultáneos para conservar una tabla legible.', 'icon-alert');
        return false;
      }
      if (!compareIds.includes(id)) compareIds.push(id);
      if (item && !AppState.comparadorInmuebles.some((i) => i.id === id)) {
        AppState.comparadorInmuebles.push(item);
      }
    } else {
      compareIds = compareIds.filter((i) => i !== id);
      AppState.comparadorInmuebles = AppState.comparadorInmuebles.filter((i) => i.id !== id);
    }

    localStorage.setItem('habi_comparador', JSON.stringify(compareIds));
    AppState.comparador = compareIds;
    AppState.comparadorInmuebles = await fetchInmueblesForIds(AppState.comparador);

    showToast(
      shouldAdd
        ? `Agregado al comparador (${AppState.comparador.length}/3)`
        : 'Removido del comparador'
    );
    broadcastCrossTabSync();
    notifyStateChange();
    return true;
  }

  try {
    const res = shouldAdd
      ? await apiFetch('/api/comparador', {
          method: 'POST',
          body: JSON.stringify({ inmueble_id: id })
        })
      : await apiFetch(`/api/comparador/${id}`, { method: 'DELETE' });

    const payload = res.data || res;
    AppState.comparador = (payload.ids || []).map(Number);
    AppState.comparadorInmuebles = payload.items || payload.inmuebles || [];
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
  if (!window.usuarioActual) {
    localStorage.removeItem('habi_comparador');
    AppState.comparador = [];
    AppState.comparadorInmuebles = [];
    broadcastCrossTabSync();
    notifyStateChange();
    showToast('Comparador vaciado');
    return;
  }

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
