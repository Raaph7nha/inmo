/**
 * HABITABOGOTÁ — /public/js/state.js
 * Estado global unificado (HabiState + AppState), persistencia híbrida localStorage + PostgreSQL y cliente /api/*.
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

window.mostrarToast = function (message, iconName = 'icon-check') {
  let stack = document.getElementById('toast-stack');
  if (!stack && document.body) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon icon--sm');
  svg.style.color = 'var(--color-mustard)';
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `/assets/icons.svg#${iconName}`);
  svg.appendChild(use);

  const span = document.createElement('span');
  span.textContent = message;

  toast.appendChild(svg);
  toast.appendChild(span);
  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, 3600);
};

window.showToast = window.mostrarToast;

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
  porteria: false
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
    const err = new Error(data?.error || data?.mensaje || 'Error al comunicarse con el servidor.');
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
  if (window.HabiState) {
    window.HabiState.actualizarContadores();
  }
  AppState.listeners.forEach((fn) => fn(AppState));
}

function notifyFiltersChange() {
  AppState.filterListeners.forEach((fn) => fn(AppState));
}

function normalizeIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const val of arr) {
    const num = Number(val);
    if (Number.isInteger(num) && num > 0 && !seen.has(num)) {
      seen.add(num);
      out.push(num);
    }
  }
  return out;
}

async function fetchInmueblesForIds(ids) {
  const cleanIds = normalizeIdArray(ids);
  if (cleanIds.length === 0) return [];
  const missing = cleanIds.filter((id) => !getCachedInmueble(id));

  if (missing.length > 0) {
    try {
      const data = await apiFetch(`/api/viviendas/multiples?ids=${missing.join(',')}`);
      const fetched = Array.isArray(data?.data?.items)
        ? data.data.items
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.viviendas) ? data.viviendas : []));
      cacheInmuebles(fetched);
    } catch {
      // Si falla, devolver lo que ya exista en caché
    }
  }

  return cleanIds.map((id) => getCachedInmueble(id)).filter(Boolean);
}

// ── ESTADO GLOBAL UNIFICADO ──────────────────────────────────────
window.HabiState = {
  guardados: [],
  comparador: [],

  KEY_GUARDADOS: 'habi_guardados_ids',
  KEY_COMPARADOR: 'habi_comparador_ids',

  cargarLocal() {
    try {
      const rawG = localStorage.getItem(this.KEY_GUARDADOS) ?? localStorage.getItem('habi_guardados') ?? '[]';
      const rawC = localStorage.getItem(this.KEY_COMPARADOR) ?? localStorage.getItem('habi_comparador') ?? '[]';
      this.guardados = normalizeIdArray(JSON.parse(rawG));
      this.comparador = normalizeIdArray(JSON.parse(rawC)).slice(0, 3);
    } catch {
      this.guardados = [];
      this.comparador = [];
    }
    AppState.guardados = [...this.guardados];
    AppState.comparador = [...this.comparador];
  },

  init() {
    this.cargarLocal();
    this.persistirLocal();
    this.actualizarContadores();
    this.sincronizarConAPI();
  },

  async sincronizarConAPI() {
    if (window.HabiAuth && typeof window.HabiAuth.restaurarSesion === 'function') {
      try {
        await window.HabiAuth.restaurarSesion();
      } catch {}
    }

    if (!window.HabiAuth?.usuario && !window.usuarioActual) {
      this.cargarLocal();
      const [gItems, cItems] = await Promise.all([
        fetchInmueblesForIds(this.guardados),
        fetchInmueblesForIds(this.comparador)
      ]);
      AppState.guardadosInmuebles = gItems;
      AppState.comparadorInmuebles = cItems;
      notifyStateChange();
      return;
    }

    try {
      const [resG, resC] = await Promise.all([
        fetch('/api/guardados', {
          credentials: 'include',
          headers: { 'X-Sesion-Id': AppState.sesionId }
        }),
        fetch('/api/comparador', {
          credentials: 'include',
          headers: { 'X-Sesion-Id': AppState.sesionId }
        })
      ]);

      if (resG.ok) {
        const dG = await resG.json();
        const itemsG = dG?.data?.items || dG?.data?.inmuebles || dG?.items || dG?.inmuebles || [];
        const idsG = dG?.data?.ids || dG?.ids || itemsG.map((v) => v.id);
        this.guardados = normalizeIdArray(idsG);
        AppState.guardados = [...this.guardados];
        if (Array.isArray(itemsG) && itemsG.length > 0) {
          cacheInmuebles(itemsG);
          AppState.guardadosInmuebles = itemsG;
        } else {
          AppState.guardadosInmuebles = await fetchInmueblesForIds(this.guardados);
        }
      }

      if (resC.ok) {
        const dC = await resC.json();
        const itemsC = dC?.data?.items || dC?.data?.inmuebles || dC?.items || dC?.inmuebles || [];
        const idsC = dC?.data?.ids || dC?.ids || itemsC.map((v) => v.id);
        this.comparador = normalizeIdArray(idsC).slice(0, 3);
        AppState.comparador = [...this.comparador];
        if (Array.isArray(itemsC) && itemsC.length > 0) {
          cacheInmuebles(itemsC);
          AppState.comparadorInmuebles = itemsC;
        } else {
          AppState.comparadorInmuebles = await fetchInmueblesForIds(this.comparador);
        }
      }

      this.persistirLocal();
      notifyStateChange();
    } catch (err) {
      console.warn('Error sincronizando estado con API:', err.message);
    }
  },

  persistirLocal() {
    AppState.guardados = [...this.guardados];
    AppState.comparador = [...this.comparador];
    try {
      localStorage.setItem(this.KEY_GUARDADOS, JSON.stringify(this.guardados));
      localStorage.setItem(this.KEY_COMPARADOR, JSON.stringify(this.comparador));
    } catch {}
  },

  actualizarContadores() {
    const cG = this.guardados.length;
    const cC = this.comparador.length;

    const badgeG = document.getElementById('contador-guardados');
    if (badgeG) {
      badgeG.textContent = cG;
      badgeG.style.display = cG > 0 ? 'inline-flex' : 'none';
    }
    const badgeC = document.getElementById('contador-comparador');
    if (badgeC) {
      badgeC.textContent = cC;
      badgeC.style.display = cC > 0 ? 'inline-flex' : 'none';
    }

    document.querySelectorAll('[data-counter="saved"]').forEach((el) => {
      el.textContent = cG;
    });

    document.querySelectorAll('[data-counter="compare"]').forEach((el) => {
      el.textContent = cC;
      el.classList.remove('badge-bump');
      void el.offsetWidth;
      el.classList.add('badge-bump');
    });

    document.querySelectorAll('.btn-guardar[data-id]').forEach((btn) => {
      const id = Number(btn.dataset.id);
      const activo = this.guardados.includes(id);
      btn.classList.toggle('activo', activo);
      btn.classList.toggle('btn-fav--active', activo);
      btn.setAttribute('aria-pressed', String(activo));
      const useEl = btn.querySelector('use');
      if (useEl) {
        useEl.setAttribute('href', `/assets/icons.svg#${activo ? 'icon-heart-filled' : 'icon-heart'}`);
      }
    });

    document.querySelectorAll('.btn-comparar[data-id]').forEach((el) => {
      const id = Number(el.dataset.id);
      const activo = this.comparador.includes(id);
      if (el.tagName === 'INPUT' && el.type === 'checkbox') {
        el.checked = activo;
      } else {
        el.classList.toggle('activo', activo);
        el.setAttribute('aria-pressed', String(activo));
      }
    });
  },

  async toggleGuardar(viviendaId) {
    const id = Number(viviendaId);
    if (!Number.isInteger(id) || id <= 0) return false;

    const yaGuardado = this.guardados.includes(id);
    const item = getCachedInmueble(id);
    const titulo = item ? item.titulo : 'Inmueble';

    if (yaGuardado) {
      this.guardados = this.guardados.filter((x) => x !== id);
      AppState.guardadosInmuebles = AppState.guardadosInmuebles.filter((i) => Number(i.id) !== id);
    } else {
      this.guardados.push(id);
    }

    this.persistirLocal();
    AppState.guardadosInmuebles = await fetchInmueblesForIds(this.guardados);
    notifyStateChange();
    broadcastCrossTabSync();

    if (window.mostrarToast) {
      window.mostrarToast(
        yaGuardado
          ? `Removido de Guardados: ${titulo}`
          : `Guardado en tus favoritos: ${titulo}`
      );
    }

    if (window.HabiAuth?.usuario || window.usuarioActual) {
      try {
        const res = await fetch('/api/guardados', {
          method: yaGuardado ? 'DELETE' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Sesion-Id': AppState.sesionId
          },
          body: JSON.stringify({ vivienda_id: id })
        });
        if (res.ok) {
          const payload = await res.json();
          const data = payload?.data || payload;
          if (Array.isArray(data?.ids)) {
            this.guardados = normalizeIdArray(data.ids);
            this.persistirLocal();
          }
          const items = data?.items || data?.inmuebles;
          if (Array.isArray(items)) {
            cacheInmuebles(items);
            AppState.guardadosInmuebles = items;
          }
          notifyStateChange();
        }
      } catch (e) {
        console.warn('Error sincronizando guardado:', e);
      }
    }

    return !yaGuardado;
  },

  async toggleComparador(viviendaId, forceAdd = null) {
    const id = Number(viviendaId);
    if (!Number.isInteger(id) || id <= 0) return false;

    const yaEnComparador = this.comparador.includes(id);
    const shouldAdd = forceAdd !== null ? Boolean(forceAdd) : !yaEnComparador;

    if (shouldAdd && yaEnComparador) return true;
    if (!shouldAdd && !yaEnComparador) return true;

    if (shouldAdd) {
      if (this.comparador.length >= 3) {
        if (window.mostrarToast) {
          window.mostrarToast('Máximo 3 viviendas en el comparador', 'icon-alert');
        }
        this.actualizarContadores();
        return false;
      }
      this.comparador.push(id);
    } else {
      this.comparador = this.comparador.filter((x) => x !== id);
      AppState.comparadorInmuebles = AppState.comparadorInmuebles.filter((i) => Number(i.id) !== id);
    }

    this.persistirLocal();
    AppState.comparadorInmuebles = await fetchInmueblesForIds(this.comparador);
    notifyStateChange();
    broadcastCrossTabSync();

    if (window.mostrarToast) {
      window.mostrarToast(
        shouldAdd
          ? `Agregado al comparador (${this.comparador.length}/3)`
          : 'Removido del comparador'
      );
    }

    if (window.HabiAuth?.usuario || window.usuarioActual) {
      try {
        const res = await fetch('/api/comparador', {
          method: shouldAdd ? 'POST' : 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Sesion-Id': AppState.sesionId
          },
          body: JSON.stringify({ vivienda_id: id })
        });
        if (res.ok) {
          const payload = await res.json();
          const data = payload?.data || payload;
          if (Array.isArray(data?.ids)) {
            this.comparador = normalizeIdArray(data.ids).slice(0, 3);
            this.persistirLocal();
          }
          const items = data?.items || data?.inmuebles;
          if (Array.isArray(items)) {
            cacheInmuebles(items);
            AppState.comparadorInmuebles = items;
          }
          notifyStateChange();
        }
      } catch (e) {
        console.warn('Error sincronizando comparador:', e);
      }
    }

    return true;
  },

  async vaciarComparador() {
    this.comparador = [];
    AppState.comparadorInmuebles = [];
    this.persistirLocal();
    notifyStateChange();
    broadcastCrossTabSync();

    if (window.HabiAuth?.usuario || window.usuarioActual) {
      try {
        await fetch('/api/comparador', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'X-Sesion-Id': AppState.sesionId }
        });
      } catch (e) {
        console.warn('Error vaciando comparador en API:', e);
      }
    }

    if (window.mostrarToast) {
      window.mostrarToast('Comparador vaciado');
    }
  }
};

// Cargar inmediatamente desde localStorage antes de que corra DOMContentLoaded
window.HabiState.cargarLocal();

// Exponer funciones globales consistentes en todas las vistas
window.toggleGuardar = (id) => window.HabiState.toggleGuardar(id);
window.toggleComparador = (id, forceAdd = null) => window.HabiState.toggleComparador(id, forceAdd);
window.toggleSaveProperty = (id) => window.HabiState.toggleGuardar(id);
window.toggleCompareProperty = (id, forceAdd = null) => window.HabiState.toggleComparador(id, forceAdd);
window.clearAllComparison = () => window.HabiState.vaciarComparador();
window.updateCountersUI = () => window.HabiState.actualizarContadores();
window.syncSessionLists = () => window.HabiState.sincronizarConAPI();

document.addEventListener('DOMContentLoaded', () => {
  window.HabiState.init();
});

if (syncChannel) {
  syncChannel.onmessage = () => {
    window.HabiState.init();
  };
}

window.addEventListener('storage', (e) => {
  if (
    e.key === SYNC_EVENT_KEY ||
    e.key === window.HabiState.KEY_GUARDADOS ||
    e.key === window.HabiState.KEY_COMPARADOR
  ) {
    window.HabiState.init();
  }
});
