/**
 * HABITABOGOTÁ — /public/js/main.js
 * Orquestador principal conectado a la API REST (/api/*), skeletons, estados de error y soporte.
 */

// Notificaciones Toast accesibles (seguro contra XSS usando textContent)
function showToast(message, iconName = 'icon-check') {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }

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
}

// Leer filtros iniciales desde query params (ej. cuando se navega desde Habi en otra página)
function hydrateFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (!Array.from(params.keys()).length) return;

  const f = AppState.filtros;
  if (params.has('operacion')) f.operacion = params.get('operacion') || 'todos';
  if (params.has('tipo')) f.tipo = params.get('tipo') || 'todos';
  if (params.has('q')) f.keyword = params.get('q') || '';
  if (params.has('precio_min')) f.precioMin = Number(params.get('precio_min')) || null;
  if (params.has('precio_max')) f.precioMax = Number(params.get('precio_max')) || null;
  if (params.has('habitaciones')) f.habitacionesMin = Number(params.get('habitaciones')) || 0;
  if (params.get('mascotas') === 'true') f.mascotas = true;
  if (params.get('parqueadero') === 'true') f.parqueadero = true;
  if (params.get('balcon') === 'true') f.balcon = true;
  if (params.get('gimnasio') === 'true') f.gimnasio = true;
  if (params.get('piscina') === 'true') f.piscina = true;
  if (params.get('porteria') === 'true') f.porteria = true;
  if (params.get('tour_3d') === 'true') f.tour3D = true;
  if (params.has('orden')) AppState.orden = params.get('orden') || 'costo_asc';
}

// Inicialización de la Página de Inicio / Búsqueda (index.html)
async function initIndexPage() {
  const gridContainer = document.getElementById('results-grid');
  const countDisplay = document.getElementById('results-count-number');
  const chipsContainer = document.getElementById('active-chips-container');
  const emptyBox = document.getElementById('search-empty-state');
  const mapContainer = document.getElementById('map-canvas-container');

  if (!gridContainer) return;

  hydrateFiltersFromURL();

  if (mapContainer) {
    mapContainer.innerHTML = generateBogotaMapSVG();
  }

  let activeRequestId = 0;

  function renderNeighborhoodChips(barrios) {
    const neighborhoodScroll = document.getElementById('neighborhood-scroll');
    if (!neighborhoodScroll || !Array.isArray(barrios)) return;

    const seen = new Set();
    const unique = barrios.filter((b) => {
      if (seen.has(b.barrio)) return false;
      seen.add(b.barrio);
      return true;
    });

    neighborhoodScroll.innerHTML = unique
      .map(
        (b) => `
      <button type="button" class="neighborhood-chip" onclick="filterByNeighborhood('${escapeHTML(b.barrio)}')" aria-label="Filtrar por ${escapeHTML(b.barrio)}">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-building"></use></svg>
        <span>${escapeHTML(b.barrio)}</span>
      </button>
    `
      )
      .join('');
  }

  function paintCurrentResults() {
    const items = AppState.resultados || [];
    if (countDisplay) {
      countDisplay.textContent = `${AppState.totalResultados} inmueble${AppState.totalResultados === 1 ? '' : 's'} en Bogotá`;
    }
    if (chipsContainer) {
      chipsContainer.innerHTML = renderActiveChipsHTML(AppState.filtros);
    }

    if (items.length === 0) {
      gridContainer.innerHTML = '';
      if (emptyBox) emptyBox.style.display = 'block';
    } else {
      if (emptyBox) emptyBox.style.display = 'none';
      gridContainer.innerHTML = items.map(renderPropertyCardHTML).join('');
    }

    renderMapPinsLayer(items);
  }

  async function fetchAndRenderResults() {
    const reqId = ++activeRequestId;
    if (emptyBox) emptyBox.style.display = 'none';
    if (countDisplay) countDisplay.textContent = 'Buscando inmuebles en Bogotá...';
    if (chipsContainer) chipsContainer.innerHTML = renderActiveChipsHTML(AppState.filtros);
    gridContainer.innerHTML = renderSkeletonCardsHTML(6);

    try {
      const qs = buildInmueblesQueryParams(AppState.filtros, AppState.orden).toString();
      const data = await apiFetch(`/api/inmuebles${qs ? `?${qs}` : ''}`);
      if (reqId !== activeRequestId) return;

      AppState.resultados = Array.isArray(data.inmuebles) ? data.inmuebles : [];
      AppState.totalResultados = Number(data.total ?? AppState.resultados.length);
      cacheInmuebles(AppState.resultados);

      if (Array.isArray(data.barrios) && data.barrios.length > 0 && AppState.barrios.length === 0) {
        AppState.barrios = data.barrios;
        renderNeighborhoodChips(data.barrios);
      }

      paintCurrentResults();
    } catch {
      if (reqId !== activeRequestId) return;
      if (countDisplay) countDisplay.textContent = 'Error de conexión';
      gridContainer.innerHTML = renderErrorBoxHTML(
        'No pudimos cargar los inmuebles, intenta de nuevo',
        'window.retryCurrentLoad()'
      );
      renderMapPinsLayer([]);
    }
  }

  window.retryCurrentLoad = fetchAndRenderResults;

  // Re-pintar tarjetas si cambian guardados o comparador sin reconsultar todo
  subscribeState(() => {
    if (AppState.resultados.length > 0) {
      paintCurrentResults();
    }
  });

  // Recargar desde Postgres cuando cambian filtros u ordenamiento
  subscribeFilters(fetchAndRenderResults);

  initFilterControls();
  syncFilterControlsUI();

  await syncSessionLists();
  await fetchAndRenderResults();
}

window.filterByNeighborhood = function (barrioName) {
  AppState.filtros.keyword = barrioName;
  syncFilterControlsUI();
  notifyFiltersChange();
};

function initFilterControls() {
  document.querySelectorAll('[data-op-btn]').forEach((btn) => {
    btn.onclick = () => {
      const op = btn.getAttribute('data-op-btn');
      AppState.filtros.operacion = op;
      syncFilterControlsUI();
      notifyFiltersChange();
    };
  });

  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      AppState.filtros.tipo = e.target.value;
      notifyFiltersChange();
    });
  }

  let searchTimer;
  const handleSearchInput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      AppState.filtros.keyword = e.target.value;
      notifyFiltersChange();
    }, 280);
  };

  const mainSearchInput = document.getElementById('filter-keyword');
  if (mainSearchInput) mainSearchInput.addEventListener('input', handleSearchInput);

  const heroSearchInput = document.getElementById('hero-search-input');
  if (heroSearchInput) {
    heroSearchInput.addEventListener('input', (e) => {
      if (mainSearchInput) mainSearchInput.value = e.target.value;
      handleSearchInput(e);
    });
  }

  let priceTimer;
  const triggerPriceChange = () => {
    clearTimeout(priceTimer);
    priceTimer = setTimeout(() => notifyFiltersChange(), 300);
  };

  const minPriceInput = document.getElementById('filter-price-min');
  if (minPriceInput) {
    minPriceInput.addEventListener('input', (e) => {
      AppState.filtros.precioMin = e.target.value ? Number(e.target.value) : null;
      triggerPriceChange();
    });
  }
  const maxPriceInput = document.getElementById('filter-price-max');
  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', (e) => {
      AppState.filtros.precioMax = e.target.value ? Number(e.target.value) : null;
      triggerPriceChange();
    });
  }

  const roomsDisplay = document.getElementById('rooms-display-val');
  const btnRoomsMinus = document.getElementById('btn-rooms-minus');
  const btnRoomsPlus = document.getElementById('btn-rooms-plus');

  if (btnRoomsMinus && btnRoomsPlus && roomsDisplay) {
    btnRoomsMinus.onclick = () => {
      if (AppState.filtros.habitacionesMin > 0) {
        AppState.filtros.habitacionesMin--;
        syncFilterControlsUI();
        notifyFiltersChange();
      }
    };
    btnRoomsPlus.onclick = () => {
      if (AppState.filtros.habitacionesMin < 5) {
        AppState.filtros.habitacionesMin++;
        syncFilterControlsUI();
        notifyFiltersChange();
      }
    };
  }

  document.querySelectorAll('[data-toggle-filter]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.getAttribute('data-toggle-filter');
      AppState.filtros[key] = !AppState.filtros[key];
      syncFilterControlsUI();
      notifyFiltersChange();
    };
  });

  const btnMoreFilters = document.getElementById('btn-more-filters');
  const advancedBox = document.getElementById('advanced-filters-box');
  if (btnMoreFilters && advancedBox) {
    btnMoreFilters.onclick = () => {
      const isVisible = advancedBox.style.display !== 'none';
      advancedBox.style.display = isVisible ? 'none' : 'block';
      btnMoreFilters.setAttribute('aria-expanded', String(!isVisible));
      btnMoreFilters.querySelector('span').textContent = !isVisible
        ? 'Ocultar zonas comunes'
        : 'Ver más filtros (Zonas comunes)';
    };
  }

  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewMap = document.getElementById('btn-view-map');
  const mapWrapper = document.getElementById('map-stage-wrapper');

  if (btnViewGrid && btnViewMap && mapWrapper) {
    btnViewGrid.onclick = () => {
      btnViewGrid.classList.add('btn--primary');
      btnViewGrid.classList.remove('btn--secondary');
      btnViewMap.classList.add('btn--secondary');
      btnViewMap.classList.remove('btn--primary');
      btnViewGrid.setAttribute('aria-pressed', 'true');
      btnViewMap.setAttribute('aria-pressed', 'false');
      mapWrapper.style.display = 'none';
      document.getElementById('results-grid').style.display = 'grid';
    };

    btnViewMap.onclick = () => {
      btnViewMap.classList.add('btn--primary');
      btnViewMap.classList.remove('btn--secondary');
      btnViewGrid.classList.add('btn--secondary');
      btnViewGrid.classList.remove('btn--primary');
      btnViewMap.setAttribute('aria-pressed', 'true');
      btnViewGrid.setAttribute('aria-pressed', 'false');
      mapWrapper.style.display = 'block';
      mapWrapper.scrollIntoView({ behavior: 'smooth' });
    };
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.orden = e.target.value;
      notifyFiltersChange();
    });
  }

  // Conectar formulario modal de alertas a la API real
  const alertForm = document.getElementById('form-email-alert');
  if (alertForm) {
    alertForm.onsubmit = handleAlertFormSubmit;
  }

  const filtersPanel = document.getElementById('filters-panel');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const btnOpenDrawer = document.getElementById('btn-open-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');

  if (filtersPanel && drawerOverlay) {
    const openDrawer = () => {
      filtersPanel.classList.add('filters-panel--open');
      drawerOverlay.classList.add('drawer-overlay--active');
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      filtersPanel.classList.remove('filters-panel--open');
      drawerOverlay.classList.remove('drawer-overlay--active');
      document.body.style.overflow = '';
    };

    if (btnOpenDrawer) btnOpenDrawer.onclick = openDrawer;
    if (btnCloseDrawer) btnCloseDrawer.onclick = closeDrawer;
    drawerOverlay.onclick = closeDrawer;
  }
}

// Inicialización de la Ficha de Inmueble (inmueble.html?id=...)
async function initPropertyDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id') || '1';
  const propertyId = Number(String(rawId).replace(/^inm-/, '')) || 1;

  await syncSessionLists();

  let item;
  try {
    const data = await apiFetch(`/api/inmuebles/${propertyId}`);
    item = data.inmueble;
    cacheInmuebles([item]);
  } catch (err) {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.innerHTML = renderErrorBoxHTML(
        err.status === 404
          ? 'El inmueble solicitado no existe o ya no está disponible'
          : 'No pudimos cargar el inmueble, intenta de nuevo',
        'window.location.reload()'
      );
    }
    return;
  }

  document.title = `${item.titulo} — HabitaBogotá`;

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = item.titulo;

  const addressEl = document.getElementById('detail-address');
  if (addressEl) {
    addressEl.innerHTML = `
      <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-map"></use></svg>
      <span>${escapeHTML(item.barrio)} (${escapeHTML(item.localidad)}) · ${escapeHTML(item.direccion_aprox)}</span>
    `;
  }

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = item.descripcion;

  const stampEl = document.getElementById('detail-stamp');
  if (stampEl) {
    stampEl.textContent = item.operacion.toUpperCase();
    stampEl.className = `stamp-seal ${item.operacion === 'arriendo' ? 'stamp-seal--rent' : 'stamp-seal--sale'}`;
  }

  const mainPhoto = document.getElementById('detail-photo-main');
  const imgs = item.imagenes || [];
  if (mainPhoto) mainPhoto.src = imgs[0] || '';

  const thumb1 = document.getElementById('detail-photo-thumb-1');
  if (thumb1) {
    thumb1.src = imgs[1] || imgs[0] || '';
    thumb1.onclick = () => {
      if (mainPhoto) mainPhoto.src = thumb1.src;
    };
  }
  const thumb2 = document.getElementById('detail-photo-thumb-2');
  if (thumb2) {
    thumb2.src = imgs[2] || imgs[0] || '';
    thumb2.onclick = () => {
      if (mainPhoto) mainPhoto.src = thumb2.src;
    };
  }

  const specsRow = document.getElementById('detail-specs-row');
  if (specsRow) {
    specsRow.innerHTML = `
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bed"></use></svg> <strong>${item.habitaciones}</strong> Habitaciones</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bath"></use></svg> <strong>${item.banos}</strong> Baños</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-area"></use></svg> <strong>${item.area_m2}</strong> m² Área Privada</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-building"></use></svg> <strong>${escapeHTML(item.tipo.toUpperCase())}</strong></div>
    `;
  }

  const total = calculateTotalCost(item);
  const canonEl = document.getElementById('detail-val-canon');
  if (canonEl) canonEl.textContent = formatCOP(item.precio);

  const adminEl = document.getElementById('detail-val-admin');
  if (adminEl) {
    adminEl.textContent = item.administracion > 0 ? formatCOP(item.administracion) : '$0 (Sin costo)';
  }

  const totalEl = document.getElementById('detail-val-total');
  if (totalEl) totalEl.textContent = formatCOP(total);

  const btnWhatsapp = document.getElementById('detail-btn-whatsapp');
  if (btnWhatsapp) {
    const message = encodeURIComponent(
      `Hola, estoy interesado(a) en el inmueble "${item.titulo}" (${item.barrio}) visto en HabitaBogotá con costo total de ${formatCOP(total)}. ¿Podemos coordinar una visita?`
    );
    btnWhatsapp.href = `https://wa.me/573001234567?text=${message}`;
  }

  // Requisitos específicos desde base de datos si existen
  const reqListEl = document.getElementById('detail-legal-list');
  if (reqListEl && Array.isArray(item.requisitos) && item.requisitos.length > 0) {
    const itemsHTML = item.requisitos
      .map(
        (reqText) => `
      <li class="legal-box__item">
        <span class="legal-box__check">✓</span>
        <span>${escapeHTML(reqText)}</span>
      </li>
    `
      )
      .join('');
    const depositoHTML = item.deposito
      ? `<li class="legal-box__item"><span class="legal-box__check">✓</span><span>Depósito en garantía: <strong>${formatCOP(item.deposito)}</strong></span></li>`
      : '';
    reqListEl.innerHTML = itemsHTML + depositoHTML;
  }

  const c = item.caracteristicas || {};
  const amenitiesContainer = document.getElementById('detail-amenities-container');
  if (amenitiesContainer) {
    const list = [
      c.mascotas
        ? '<span class="amenity-tag amenity-tag--pet" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-paw"></use></svg> Mascotas permitidas</span>'
        : '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;">🚫 Mascotas no permitidas</span>',
      c.parqueadero
        ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-car"></use></svg> Parqueadero propio</span>'
        : null,
      c.balcon
        ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-balcony"></use></svg> Balcón / Terraza</span>'
        : null,
      c.gimnasio
        ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-dumbbell"></use></svg> Gimnasio equipado</span>'
        : null,
      c.piscina
        ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-pool"></use></svg> Piscina</span>'
        : null,
      c.porteria
        ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-door"></use></svg> Portería 24/7</span>'
        : null
    ].filter(Boolean);
    amenitiesContainer.innerHTML = list.join('');
  }

  const stationNameEl = document.getElementById('detail-station-name');
  if (stationNameEl) stationNameEl.textContent = item.transporte.estacion;

  const rulerEl = document.getElementById('detail-ruler-text');
  if (rulerEl) {
    rulerEl.textContent = `A exactamente ${item.transporte.distanciaCuadras} cuadras caminables (aprox. ${item.transporte.distanciaCuadras * 2} minutos a pie).`;
  }

  const superEl = document.getElementById('detail-super-text');
  if (superEl) {
    superEl.textContent = `${item.supermercado.nombre} a ${item.supermercado.distanciaCuadras} cuadras`;
  }

  const riskBox = document.getElementById('detail-risk-box');
  if (riskBox) {
    if (item.zonaRiesgo?.existe) {
      riskBox.style.display = 'block';
      const riskText = document.getElementById('detail-risk-text');
      if (riskText) riskText.textContent = item.zonaRiesgo.detalle;
    } else {
      riskBox.style.display = 'none';
    }
  }

  const detailMap = document.getElementById('detail-map-canvas');
  if (detailMap) {
    detailMap.innerHTML = generateBogotaMapSVG();
    renderMapPinsLayer([item]);
  }

  const btnFav = document.getElementById('btn-detail-fav');
  const btnComp = document.getElementById('btn-detail-compare');

  function updateDetailActionButtons() {
    const isSaved = AppState.guardados.includes(item.id);
    const isCompared = AppState.comparador.includes(item.id);

    if (btnFav) {
      btnFav.innerHTML = `
        <svg class="icon icon--sm"><use href="/assets/icons.svg#${isSaved ? 'icon-heart-filled' : 'icon-heart'}"></use></svg>
        <span>${isSaved ? 'En Guardados' : 'Guardar'}</span>
      `;
      btnFav.classList.toggle('btn--primary', isSaved);
      btnFav.classList.toggle('btn--secondary', !isSaved);
    }

    if (btnComp) {
      btnComp.innerHTML = `
        <svg class="icon icon--sm"><use href="/assets/icons.svg#icon-compare"></use></svg>
        <span>${isCompared ? 'En el comparador' : 'Comparar'}</span>
      `;
      btnComp.classList.toggle('btn--primary', isCompared);
      btnComp.classList.toggle('btn--secondary', !isCompared);
    }
  }

  if (btnFav) btnFav.onclick = () => toggleSaveProperty(item.id);
  if (btnComp) btnComp.onclick = () => toggleCompareProperty(item.id);

  subscribeState(updateDetailActionButtons);

  const btnTourTrigger = document.getElementById('btn-detail-tour-trigger');
  if (btnTourTrigger) {
    if (!item.tour_3d) {
      btnTourTrigger.style.display = 'none';
    } else {
      btnTourTrigger.onclick = () => openVirtualTour(item.id);
    }
  }

  updateDetailActionButtons();
}

// Inicialización de la Página de Guardados (guardados.html)
async function initSavedPage() {
  const container = document.getElementById('saved-properties-grid');
  const emptyState = document.getElementById('saved-empty-state');
  const countText = document.getElementById('saved-count-lead');

  function updateSavedView() {
    const savedItems = AppState.guardadosInmuebles || [];

    if (countText) {
      countText.textContent = `${savedItems.length} propiedad${savedItems.length === 1 ? '' : 'es'} guardada${savedItems.length === 1 ? '' : 's'}`;
    }

    if (savedItems.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (container) container.innerHTML = savedItems.map(renderPropertyCardHTML).join('');
    }
  }

  if (container) container.innerHTML = renderSkeletonCardsHTML(3);

  try {
    await syncSessionLists();
    subscribeState(updateSavedView);
    updateSavedView();
  } catch {
    if (container) {
      container.innerHTML = renderErrorBoxHTML(
        'No pudimos cargar tus inmuebles guardados, intenta de nuevo',
        'window.location.reload()'
      );
    }
  }
}

// Inicialización de la Página de Comparador (comparador.html)
async function initComparePage() {
  const container = document.getElementById('compare-table-content');
  if (!container) return;

  container.innerHTML = '<div class="skeleton-shimmer" style="height: 280px; margin: 16px;"></div>';

  await syncSessionLists();

  function updateCompareView() {
    renderComparisonTable(container);
  }

  subscribeState(updateCompareView);
  updateCompareView();

  const clearBtn = document.getElementById('btn-clear-compare-page');
  if (clearBtn) clearBtn.onclick = clearAllComparison;
}

// Inicialización de la Página de Ayuda y Requisitos (ayuda.html)
function initHelpPage() {
  syncSessionLists();

  document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    trigger.onclick = () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.toggle('accordion-item--open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    };
  });

  const supportForm = document.getElementById('form-support-advisor');
  if (supportForm) {
    supportForm.onsubmit = async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('support-input-name');
      const emailInput = document.getElementById('support-input-email');
      const msgInput = document.getElementById('support-input-msg');
      const submitBtn = supportForm.querySelector('button[type="submit"]');

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await apiFetch('/api/soporte', {
          method: 'POST',
          body: JSON.stringify({
            nombre: nameInput.value.trim(),
            correo: emailInput.value.trim(),
            mensaje: msgInput.value.trim()
          })
        });
        showToast(res.mensaje || '¡Tu consulta ha sido radicada!');
        supportForm.reset();
      } catch (err) {
        showToast(err.message || 'No se pudo enviar la consulta.', 'icon-alert');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCountersUI();

  const path = window.location.pathname;

  if (path.endsWith('inmueble.html') || path.endsWith('/inmueble')) {
    initPropertyDetailPage();
  } else if (path.endsWith('guardados.html') || path.endsWith('/guardados')) {
    initSavedPage();
  } else if (path.endsWith('comparador.html') || path.endsWith('/comparador')) {
    initComparePage();
  } else if (path.endsWith('ayuda.html') || path.endsWith('/ayuda')) {
    initHelpPage();
  } else {
    initIndexPage();
  }
});
