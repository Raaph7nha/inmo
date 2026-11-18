/**
 * HABITABOGOTÁ — /public/js/comparador.js
 * Lógica de la página Comparador tanto para anónimos como autenticados.
 */

let ultimoIdsComparadorKey = null;

async function cargarTablaComparador() {
  const container = document.getElementById('compare-table-content');
  const emptyBox = document.getElementById('compare-empty-state');
  const tableWrap = document.getElementById('compare-table-wrap');
  if (!container) return;

  const ids = Array.isArray(window.HabiState?.comparador) ? window.HabiState.comparador : [];
  const idsKey = ids.join(',');

  if (ids.length === 0) {
    ultimoIdsComparadorKey = '';
    AppState.comparadorInmuebles = [];
    if (emptyBox) emptyBox.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    renderComparisonTable(container);
    window.HabiState?.actualizarContadores();
    return;
  }

  if (idsKey === ultimoIdsComparadorKey && AppState.comparadorInmuebles.length === ids.length) {
    renderComparisonTable(container);
    window.HabiState?.actualizarContadores();
    return;
  }

  ultimoIdsComparadorKey = idsKey;
  if (emptyBox) emptyBox.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';
  container.innerHTML = '<div class="skeleton-shimmer" style="height: 280px; margin: 16px;"></div>';

  try {
    const res = await fetch(`/api/viviendas/multiples?ids=${ids.join(',')}`, {
      credentials: 'include',
      headers: { 'X-Sesion-Id': AppState.sesionId }
    });
    const data = await res.json();
    const items = data?.data?.items || data?.data?.inmuebles || data?.items || [];
    cacheInmuebles(items);
    AppState.comparadorInmuebles = items;
    renderComparisonTable(container);
  } catch (err) {
    console.warn('Error cargando viviendas del comparador:', err);
    container.innerHTML = renderErrorBoxHTML(
      'No pudimos cargar los inmuebles del comparador, intenta de nuevo',
      'window.location.reload()'
    );
  }

  window.HabiState?.actualizarContadores();
}

async function initComparePage() {
  const container = document.getElementById('compare-table-content');
  if (!container) return;

  const clearBtn = document.getElementById('btn-clear-compare-page');
  if (clearBtn) {
    clearBtn.onclick = () => window.clearAllComparison();
  }

  subscribeState(() => {
    cargarTablaComparador();
  });

  await cargarTablaComparador();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('comparador.html') || window.location.pathname.endsWith('/comparador')) {
    initComparePage();
  }
});
