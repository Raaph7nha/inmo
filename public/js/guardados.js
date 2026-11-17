/**
 * HABITABOGOTÁ — /public/js/guardados.js
 * Lógica de la página Mis Guardados tanto para anónimos como autenticados.
 */

async function initSavedPage() {
  const container = document.getElementById('saved-properties-grid');
  const emptyState = document.getElementById('saved-empty-state');
  const countText = document.getElementById('saved-count-lead');
  if (!container) return;

  container.innerHTML = renderSkeletonCardsHTML(3);

  let items = [];
  if (!window.usuarioActual) {
    try {
      const ids = JSON.parse(localStorage.getItem('habi_guardados') || '[]');
      if (ids.length > 0) {
        const res = await apiFetch(`/api/viviendas/multiples?ids=${ids.join(',')}`);
        items = res.data?.items || res.items || [];
      }
    } catch {
      items = [];
    }
  } else {
    try {
      const res = await apiFetch('/api/guardados');
      const data = res.data || res;
      items = data.items || data.inmuebles || [];
    } catch {
      items = [];
    }
  }

  AppState.guardadosInmuebles = items;
  AppState.guardados = items.map(x => Number(x.id));

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
  updateCountersUI();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('guardados.html') || window.location.pathname.endsWith('/guardados')) {
    initSavedPage();
  }
});
