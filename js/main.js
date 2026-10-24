/**
 * HABITABOGOTÁ — /js/main.js
 * Orquestador principal, inicialización por página, manejo de eventos y toasts.
 */

// Notificaciones Toast accesibles
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
  toast.innerHTML = `
    <svg class="icon icon--sm" style="color: var(--color-mustard);" aria-hidden="true">
      <use href="/assets/icons.svg#${iconName}"></use>
    </svg>
    <span>${message}</span>
  `;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, 3600);
}

// Inicialización de la Página de Inicio / Búsqueda (index.html)
function initIndexPage() {
  const gridContainer = document.getElementById('results-grid');
  const countDisplay = document.getElementById('results-count-number');
  const chipsContainer = document.getElementById('active-chips-container');
  const emptyBox = document.getElementById('search-empty-state');
  const mapContainer = document.getElementById('map-canvas-container');

  if (!gridContainer) return;

  // Renderizar mapa ilustrado base
  if (mapContainer) {
    mapContainer.innerHTML = generateBogotaMapSVG();
  }

  // Renderizar franja de barrios
  const neighborhoodScroll = document.getElementById('neighborhood-scroll');
  if (neighborhoodScroll) {
    neighborhoodScroll.innerHTML = BARRIOS_BOGOTA.map(b => `
      <button type="button" class="neighborhood-chip" onclick="filterByNeighborhood('${b.nombre}')" aria-label="Filtrar por ${b.nombre}">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-building"></use></svg>
        <span>${b.nombre}</span>
      </button>
    `).join('');
  }

  function updateResultsView() {
    const filtered = filterProperties(INMUEBLES_BOGOTA, AppState.filtros, AppState.orden);

    if (countDisplay) {
      countDisplay.textContent = `${filtered.length} inmueble${filtered.length === 1 ? '' : 's'} en Bogotá`;
    }

    if (chipsContainer) {
      chipsContainer.innerHTML = renderActiveChipsHTML(AppState.filtros);
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = '';
      if (emptyBox) emptyBox.style.display = 'block';
    } else {
      if (emptyBox) emptyBox.style.display = 'none';
      gridContainer.innerHTML = filtered.map(renderPropertyCardHTML).join('');
    }

    // Actualizar pines del mapa
    renderMapPinsLayer(filtered);
  }

  // Suscribirse a cambios de estado
  subscribeState(updateResultsView);

  // Inicializar listeners de controles de filtro
  initFilterControls();

  // Primer render
  updateResultsView();
}

window.filterByNeighborhood = function(barrioName) {
  AppState.filtros.keyword = barrioName;
  const inputSearch = document.getElementById('filter-keyword');
  if (inputSearch) inputSearch.value = barrioName;
  const heroSearch = document.getElementById('hero-search-input');
  if (heroSearch) heroSearch.value = barrioName;
  notifyStateChange();
};

function initFilterControls() {
  // Segmented control (Arriendo / Venta / Todos)
  document.querySelectorAll('[data-op-btn]').forEach(btn => {
    btn.onclick = () => {
      const op = btn.getAttribute('data-op-btn');
      AppState.filtros.operacion = op;
      document.querySelectorAll('[data-op-btn]').forEach(b => {
        b.classList.toggle('segmented-pill--active', b.getAttribute('data-op-btn') === op);
      });
      notifyStateChange();
    };
  });

  // Búsqueda por texto con debounce
  let searchTimer;
  const handleSearchInput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      AppState.filtros.keyword = e.target.value;
      notifyStateChange();
    }, 200);
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

  // Rango de precio
  const minPriceInput = document.getElementById('filter-price-min');
  if (minPriceInput) {
    minPriceInput.addEventListener('input', (e) => {
      AppState.filtros.precioMin = e.target.value ? Number(e.target.value) : null;
      notifyStateChange();
    });
  }
  const maxPriceInput = document.getElementById('filter-price-max');
  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', (e) => {
      AppState.filtros.precioMax = e.target.value ? Number(e.target.value) : null;
      notifyStateChange();
    });
  }

  // Stepper de habitaciones
  const roomsDisplay = document.getElementById('rooms-display-val');
  const btnRoomsMinus = document.getElementById('btn-rooms-minus');
  const btnRoomsPlus = document.getElementById('btn-rooms-plus');

  if (btnRoomsMinus && btnRoomsPlus && roomsDisplay) {
    btnRoomsMinus.onclick = () => {
      if (AppState.filtros.habitacionesMin > 0) {
        AppState.filtros.habitacionesMin--;
        roomsDisplay.textContent = AppState.filtros.habitacionesMin === 0 ? 'Cualquiera' : `${AppState.filtros.habitacionesMin}+`;
        notifyStateChange();
      }
    };
    btnRoomsPlus.onclick = () => {
      if (AppState.filtros.habitacionesMin < 5) {
        AppState.filtros.habitacionesMin++;
        roomsDisplay.textContent = `${AppState.filtros.habitacionesMin}+`;
        notifyStateChange();
      }
    };
  }

  // Toggles de comodidades
  document.querySelectorAll('[data-toggle-filter]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.getAttribute('data-toggle-filter');
      AppState.filtros[key] = !AppState.filtros[key];
      btn.classList.toggle('toggle-chip--active', AppState.filtros[key]);
      btn.setAttribute('aria-pressed', AppState.filtros[key]);
      notifyStateChange();
    };
  });

  // Botón "Ver más filtros" con alto contraste (Von Restorff)
  const btnMoreFilters = document.getElementById('btn-more-filters');
  const advancedBox = document.getElementById('advanced-filters-box');
  if (btnMoreFilters && advancedBox) {
    btnMoreFilters.onclick = () => {
      const isVisible = advancedBox.style.display !== 'none';
      advancedBox.style.display = isVisible ? 'none' : 'block';
      btnMoreFilters.setAttribute('aria-expanded', !isVisible);
      btnMoreFilters.querySelector('span').textContent = !isVisible ? 'Ocultar zonas comunes' : 'Ver más filtros (Zonas comunes)';
    };
  }

  // Alternador de Cuadrícula / Mapa
  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewMap = document.getElementById('btn-view-map');
  const mapWrapper = document.getElementById('map-stage-wrapper');

  if (btnViewGrid && btnViewMap && mapWrapper) {
    btnViewGrid.onclick = () => {
      btnViewGrid.classList.add('btn--primary');
      btnViewGrid.classList.remove('btn--secondary');
      btnViewMap.classList.add('btn--secondary');
      btnViewMap.classList.remove('btn--primary');
      mapWrapper.style.display = 'none';
      document.getElementById('results-grid').style.display = 'grid';
    };

    btnViewMap.onclick = () => {
      btnViewMap.classList.add('btn--primary');
      btnViewMap.classList.remove('btn--secondary');
      btnViewGrid.classList.add('btn--secondary');
      btnViewGrid.classList.remove('btn--primary');
      mapWrapper.style.display = 'block';
      mapWrapper.scrollIntoView({ behavior: 'smooth' });
    };
  }

  // Ordenamiento
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.orden = e.target.value;
      notifyStateChange();
    });
  }

  // Drawer / Bottom sheet móvil
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
function initPropertyDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id') || 'inm-1';
  const item = INMUEBLES_BOGOTA.find(x => x.id === propertyId);

  if (!item) {
    window.location.href = '/index.html';
    return;
  }

  document.title = `${item.titulo} — HabitaBogotá`;

  // Encabezados
  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = item.titulo;

  const addressEl = document.getElementById('detail-address');
  if (addressEl) addressEl.textContent = `${item.barrio} · ${item.direccion}`;

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = item.descripcion;

  const stampEl = document.getElementById('detail-stamp');
  if (stampEl) {
    stampEl.textContent = item.operacion.toUpperCase();
    stampEl.className = `stamp-seal ${item.operacion === 'arriendo' ? 'stamp-seal--rent' : 'stamp-seal--sale'}`;
  }

  // Galería
  const mainPhoto = document.getElementById('detail-photo-main');
  if (mainPhoto) mainPhoto.src = item.imagenes[0];

  const thumb1 = document.getElementById('detail-photo-thumb-1');
  if (thumb1) {
    thumb1.src = item.imagenes[1] || item.imagenes[0];
    thumb1.onclick = () => { mainPhoto.src = thumb1.src; };
  }
  const thumb2 = document.getElementById('detail-photo-thumb-2');
  if (thumb2) {
    thumb2.src = item.imagenes[2] || item.imagenes[0];
    thumb2.onclick = () => { mainPhoto.src = thumb2.src; };
  }

  // Especificaciones
  const specsRow = document.getElementById('detail-specs-row');
  if (specsRow) {
    specsRow.innerHTML = `
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bed"></use></svg> <strong>${item.habitaciones}</strong> Habitaciones</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bath"></use></svg> <strong>${item.banos}</strong> Baños</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-area"></use></svg> <strong>${item.m2}</strong> m² Área Privada</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-building"></use></svg> <strong>${item.tipo.toUpperCase()}</strong></div>
    `;
  }

  // Desglose transparente
  const isRent = item.operacion === 'arriendo';
  const total = calculateTotalCost(item);

  const canonEl = document.getElementById('detail-val-canon');
  if (canonEl) canonEl.textContent = formatCOP(item.precioBase);

  const adminEl = document.getElementById('detail-val-admin');
  if (adminEl) adminEl.textContent = item.administracion > 0 ? formatCOP(item.administracion) : '$0 (Sin costo)';

  const totalEl = document.getElementById('detail-val-total');
  if (totalEl) totalEl.textContent = formatCOP(total);

  // Botón de WhatsApp con mensaje prellenado
  const btnWhatsapp = document.getElementById('detail-btn-whatsapp');
  if (btnWhatsapp) {
    const message = encodeURIComponent(`Hola, estoy interesado(a) en el inmueble "${item.titulo}" (${item.barrio}) visto en HabitaBogotá con costo total de ${formatCOP(total)}. ¿Podemos coordinar una visita?`);
    btnWhatsapp.href = `https://wa.me/573001234567?text=${message}`;
  }

  // Comodidades
  const amenitiesContainer = document.getElementById('detail-amenities-container');
  if (amenitiesContainer) {
    const list = [
      item.caracteristicas.mascotas ? '<span class="amenity-tag amenity-tag--pet" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-paw"></use></svg> Mascotas permitidas</span>' : '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;">🚫 Mascotas no permitidas</span>',
      item.caracteristicas.parqueadero ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-car"></use></svg> Parqueadero propio</span>' : null,
      item.caracteristicas.balcon ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-balcony"></use></svg> Balcón / Terraza</span>' : null,
      item.caracteristicas.gimnasio ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-dumbbell"></use></svg> Gimnasio equipado</span>' : null,
      item.caracteristicas.piscina ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-pool"></use></svg> Piscina</span>' : null,
      item.caracteristicas.porteria ? '<span class="amenity-tag" style="padding: 6px 12px; font-size: 0.85rem;"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-door"></use></svg> Portería 24/7</span>' : null
    ].filter(Boolean);
    amenitiesContainer.innerHTML = list.join('');
  }

  // Entorno y regla de cuadras (Mateo)
  const stationNameEl = document.getElementById('detail-station-name');
  if (stationNameEl) stationNameEl.textContent = item.transporte.estacion;

  const rulerEl = document.getElementById('detail-ruler-text');
  if (rulerEl) rulerEl.textContent = `A exactamente ${item.transporte.distanciaCuadras} cuadras caminables (aprox. ${item.transporte.distanciaCuadras * 2} minutos a pie).`;

  const superEl = document.getElementById('detail-super-text');
  if (superEl) superEl.textContent = `${item.supermercado.nombre} a ${item.supermercado.distanciaCuadras} cuadras`;

  // Alerta de riesgo si aplica
  const riskBox = document.getElementById('detail-risk-box');
  if (riskBox) {
    if (item.zonaRiesgo.existe) {
      riskBox.style.display = 'block';
      const riskText = document.getElementById('detail-risk-text');
      if (riskText) riskText.textContent = item.zonaRiesgo.detalle;
    } else {
      riskBox.style.display = 'none';
    }
  }

  // Mapa específico de detalle
  const detailMap = document.getElementById('detail-map-canvas');
  if (detailMap) {
    detailMap.innerHTML = generateBogotaMapSVG();
    renderMapPinsLayer([item]);
  }

  // Botones Guardar y Comparar en Ficha
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

  if (btnFav) {
    btnFav.onclick = () => {
      toggleSaveProperty(item.id);
      updateDetailActionButtons();
    };
  }
  if (btnComp) {
    btnComp.onclick = () => {
      toggleCompareProperty(item.id);
      updateDetailActionButtons();
    };
  }

  const btnTourTrigger = document.getElementById('btn-detail-tour-trigger');
  if (btnTourTrigger) {
    btnTourTrigger.onclick = () => openVirtualTour(item.id);
  }

  updateDetailActionButtons();
}

// Inicialización de la Página de Guardados (guardados.html)
function initSavedPage() {
  const container = document.getElementById('saved-properties-grid');
  const emptyState = document.getElementById('saved-empty-state');
  const countText = document.getElementById('saved-count-lead');

  function updateSavedView() {
    const savedItems = INMUEBLES_BOGOTA.filter(x => AppState.guardados.includes(x.id));

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

  subscribeState(updateSavedView);
  updateSavedView();
}

// Inicialización de la Página de Comparador (comparador.html)
function initComparePage() {
  const container = document.getElementById('compare-table-content');
  if (!container) return;

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
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.onclick = () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.toggle('accordion-item--open');
      trigger.setAttribute('aria-expanded', isOpen);
    };
  });

  const supportForm = document.getElementById('form-support-advisor');
  if (supportForm) {
    supportForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('support-input-name').value;
      showToast(`¡Gracias ${name}! Tu consulta ha sido radicada. Te contactaremos en breve.`);
      supportForm.reset();
    };
  }
}

// Auto-arranque al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  updateCountersUI();

  // Detectar la página activa por la ruta
  const path = window.location.pathname;

  if (path.endsWith('inmueble.html')) {
    initPropertyDetailPage();
  } else if (path.endsWith('guardados.html')) {
    initSavedPage();
  } else if (path.endsWith('comparador.html')) {
    initComparePage();
  } else if (path.endsWith('ayuda.html')) {
    initHelpPage();
  } else {
    // Por defecto index.html
    initIndexPage();
  }
});
