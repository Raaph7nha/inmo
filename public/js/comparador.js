/**
 * HABITABOGOTÁ — /public/js/comparador.js
 * Lógica de la página Comparador tanto para anónimos como autenticados.
 */

async function initComparePage() {
  const container = document.getElementById('compare-table-content');
  if (!container) return;

  container.innerHTML = '<div class="skeleton-shimmer" style="height: 280px; margin: 16px;"></div>';

  let items = [];
  if (!window.usuarioActual) {
    try {
      const ids = JSON.parse(localStorage.getItem('habi_comparador') || '[]');
      if (ids.length > 0) {
        const res = await apiFetch(`/api/viviendas/multiples?ids=${ids.join(',')}`);
        items = res.data?.items || res.items || [];
      }
    } catch {
      items = [];
    }
  } else {
    try {
      const res = await apiFetch('/api/comparador');
      const data = res.data || res;
      items = data.items || data.inmuebles || [];
    } catch {
      items = [];
    }
  }

  AppState.comparadorInmuebles = items;
  AppState.comparador = items.map(x => Number(x.id));
  renderComparisonTable(container);
  updateCountersUI();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('comparador.html') || window.location.pathname.endsWith('/comparador')) {
    initComparePage();
  }
});
