/**
 * HABITABOGOTÁ — /public/js/guardados.js
 * Lógica de la página Mis Guardados tanto para anónimos como autenticados.
 */

let ultimoIdsGuardadosKey = null;

async function cargarGridGuardados() {
  const container = document.getElementById('saved-properties-grid');
  const emptyState = document.getElementById('saved-empty-state');
  const countText = document.getElementById('saved-count-lead');
  if (!container) return;

  const ids = Array.isArray(window.HabiState?.guardados) ? window.HabiState.guardados : [];
  const idsKey = ids.join(',');

  if (countText) {
    countText.textContent = `${ids.length} propiedad${ids.length === 1 ? '' : 'es'} guardada${ids.length === 1 ? '' : 's'}`;
  }

  if (ids.length === 0) {
    ultimoIdsGuardadosKey = '';
    AppState.guardadosInmuebles = [];
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    window.HabiState?.actualizarContadores();
    return;
  }

  if (idsKey === ultimoIdsGuardadosKey && AppState.guardadosInmuebles.length === ids.length) {
    if (emptyState) emptyState.style.display = 'none';
    container.innerHTML = AppState.guardadosInmuebles.map(renderPropertyCardHTML).join('');
    window.HabiState?.actualizarContadores();
    return;
  }

  ultimoIdsGuardadosKey = idsKey;
  if (emptyState) emptyState.style.display = 'none';
  container.innerHTML = renderSkeletonCardsHTML(Math.min(ids.length, 6));

  try {
    const res = await fetch(`/api/viviendas/multiples?ids=${ids.join(',')}`, {
      credentials: 'include',
      headers: { 'X-Sesion-Id': AppState.sesionId }
    });
    const data = await res.json();
    const items = data?.data?.items || data?.data?.inmuebles || data?.items || [];
    cacheInmuebles(items);
    AppState.guardadosInmuebles = items;

    if (countText) {
      countText.textContent = `${items.length} propiedad${items.length === 1 ? '' : 'es'} guardada${items.length === 1 ? '' : 's'}`;
    }

    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      container.innerHTML = items.map(renderPropertyCardHTML).join('');
    }
  } catch (err) {
    console.warn('Error cargando viviendas guardadas:', err);
    container.innerHTML = renderErrorBoxHTML(
      'No pudimos cargar tus inmuebles guardados, intenta de nuevo',
      'window.location.reload()'
    );
  }

  window.HabiState?.actualizarContadores();
}

async function initSavedPage() {
  const container = document.getElementById('saved-properties-grid');
  if (!container) return;

  subscribeState(() => {
    cargarGridGuardados();
  });

  await cargarGridGuardados();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('guardados.html') || window.location.pathname.endsWith('/guardados')) {
    initSavedPage();
  }
});
