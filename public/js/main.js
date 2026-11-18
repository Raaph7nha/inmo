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

// Inicialización de la Página de Inicio / Búsqueda (index.html)
async function cargarLocalidades() {
  try {
    const res = await fetch('/api/localidades');
    const data = await res.json();
    const localidades = data?.data || data?.localidades || [];
    const contenedor = document.getElementById('chips-localidades');
    if (!contenedor || localidades.length === 0) return;
    contenedor.innerHTML = localidades.map((loc) => `
      <button
        type="button"
        class="neighborhood-chip chip-localidad"
        onclick="filtrarPorLocalidad('${escapeHTML(loc.nombre || loc.localidad)}')"
        data-localidad="${escapeHTML(loc.nombre || loc.localidad)}">
        <span class="chip-icono">🏘</span>
        <span>${escapeHTML(loc.nombre || loc.localidad)}</span>
        <span class="chip-count">${loc.total}</span>
      </button>
    `).join('');
    syncFilterControlsUI();
  } catch (err) {
    console.warn('No se pudieron cargar las localidades:', err);
  }
}

window.filtrarPorLocalidad = function (localidad) {
  const yaActiva = AppState.filtros.localidad === localidad;
  const nuevaLocalidad = yaActiva ? '' : localidad;
  aplicarFiltros({ localidad: nuevaLocalidad });
};

async function initIndexPage() {
  const gridContainer = document.getElementById('results-grid');
  const countDisplay = document.getElementById('results-count-number');
  const chipsContainer = document.getElementById('active-chips-container');
  const emptyBox = document.getElementById('search-empty-state');
  if (!gridContainer) return;

  try {
    sessionStorage.removeItem('habi_filtros');
    localStorage.removeItem('habi_filtros');
  } catch {}

  AppState.filtros = { ...filtrosIniciales };
  AppState.orden = null;

  let activeRequestId = 0;

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
  }

  async function fetchAndRenderResults() {
    const reqId = ++activeRequestId;
    if (emptyBox) emptyBox.style.display = 'none';
    if (countDisplay) countDisplay.textContent = 'Buscando inmuebles en Bogotá...';
    if (chipsContainer) chipsContainer.innerHTML = renderActiveChipsHTML(AppState.filtros);
    gridContainer.innerHTML = renderSkeletonCardsHTML(6);

    try {
      const qs = buildInmueblesQueryParams(AppState.filtros, AppState.orden).toString();
      const data = await apiFetch(`/api/viviendas${qs ? `?${qs}` : ''}`);
      if (reqId !== activeRequestId) return;

      const viviendas = Array.isArray(data.data) ? data.data : (Array.isArray(data.viviendas) ? data.viviendas : []);
      if (!viviendas || viviendas.length === 0) {
        console.error('[DEBUG] Respuesta completa de /api/viviendas:', data);
      }
      AppState.resultados = viviendas;
      AppState.totalResultados = Number(data.total ?? AppState.resultados.length);
      cacheInmuebles(AppState.resultados);

      if (Array.isArray(data.barrios) && data.barrios.length > 0 && AppState.barrios.length === 0) {
        AppState.barrios = data.barrios;
      }

      paintCurrentResults();
    } catch {
      if (reqId !== activeRequestId) return;
      if (countDisplay) countDisplay.textContent = 'Error de conexión';
      gridContainer.innerHTML = renderErrorBoxHTML(
        'No pudimos cargar los inmuebles, intenta de nuevo',
        'window.retryCurrentLoad()'
      );
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
  cargarLocalidades();
  await fetchAndRenderResults();
}

window.filterByNeighborhood = function (localidadName) {
  window.filtrarPorLocalidad(localidadName);
};

function initFilterControls() {
  document.querySelectorAll('[data-op-btn]').forEach((btn) => {
    btn.onclick = () => {
      const op = btn.getAttribute('data-op-btn');
      AppState.filtros.operacion = op === 'todos' ? '' : op;
      syncFilterControlsUI();
      notifyFiltersChange();
    };
  });

  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      AppState.filtros.tipo = e.target.value === 'todos' ? '' : e.target.value;
      notifyFiltersChange();
    });
  }

  let searchTimer;
  const handleSearchInput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      AppState.filtros.keyword = e.target.value;
      AppState.filtros.q = e.target.value;
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
      const val = e.target.value || '';
      const num = parseInt(val.replace(/\./g, '').replace(/[^0-9]/g, ''), 10) || 0;
      AppState.filtros.precioMin = num > 0 ? num : 0;
      triggerPriceChange();
    });
  }
  const maxPriceInput = document.getElementById('filter-price-max');
  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', (e) => {
      const val = e.target.value || '';
      const num = parseInt(val.replace(/\./g, '').replace(/[^0-9]/g, ''), 10) || 0;
      AppState.filtros.precioMax = num > 0 ? num : 0;
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

  try {
    const data = await apiFetch(`/api/inmuebles/${propertyId}`);
    console.log('[Detalle] Respuesta completa:', JSON.stringify(data));

    const v = data?.data || data?.vivienda || data;
    var vivienda = v?.data || v;

    const precio = parseFloat(vivienda?.precio || vivienda?.canon || 0);
    const admon = parseFloat(vivienda?.administracion || vivienda?.admon || 0);
    const habitaciones = vivienda?.habitaciones || vivienda?.num_habitaciones || vivienda?.rooms || '—';
    const banos = vivienda?.banos || vivienda?.num_banos || vivienda?.bathrooms || '—';
    const area = vivienda?.area_m2 || vivienda?.area || vivienda?.metros || '—';
    const imagenes = vivienda?.imagenes || vivienda?.fotos || vivienda?.images || [];

    vivienda.precio = precio;
    vivienda.administracion = admon;
    vivienda.habitaciones = habitaciones;
    vivienda.banos = banos;
    vivienda.area_m2 = area;
    vivienda.imagenes = imagenes;

    window.viviendaActual = vivienda;
    cacheInmuebles([vivienda]);
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

  document.title = `${vivienda.titulo} — HabitaBogotá`;

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = vivienda.titulo;

  const addressEl = document.getElementById('detail-address');
  if (addressEl) {
    addressEl.innerHTML = `
      <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-map"></use></svg>
      <span>${escapeHTML(vivienda.barrio)} (${escapeHTML(vivienda.localidad)}) · ${escapeHTML(vivienda.direccion_aprox || vivienda.direccion || '')}</span>
    `;
  }

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = vivienda.descripcion;

  const stampEl = document.getElementById('detail-stamp');
  if (stampEl) {
    stampEl.textContent = (vivienda.operacion || '').toUpperCase();
    stampEl.className = `stamp-seal ${vivienda.operacion === 'arriendo' ? 'stamp-seal--rent' : 'stamp-seal--sale'}`;
  }

  const mainPhoto = document.getElementById('detail-photo-main');
  const mainPhotoContainer = document.querySelector('.detail-gallery__main');
  const imagenes = Array.isArray(vivienda.imagenes) ? vivienda.imagenes : [];

  if (imagenes.length === 0) {
    if (mainPhoto) mainPhoto.style.display = 'none';
    if (mainPhotoContainer) mainPhotoContainer.style.background = '#E7DCCB';
  } else {
    if (mainPhoto) {
      mainPhoto.style.display = 'block';
      const firstImg = imagenes[0];
      mainPhoto.src = typeof firstImg === 'string' ? firstImg : (firstImg.url || '');
    }
  }

  const thumb1 = document.getElementById('detail-photo-thumb-1');
  const thumb2 = document.getElementById('detail-photo-thumb-2');
  const getImgUrl = (img) => (typeof img === 'string' ? img : (img?.url || ''));

  if (thumb1) {
    const u1 = getImgUrl(imagenes[1] || imagenes[0]);
    thumb1.src = u1;
    thumb1.onclick = () => { if (mainPhoto && u1) mainPhoto.src = u1; };
  }
  if (thumb2) {
    const u2 = getImgUrl(imagenes[2] || imagenes[0]);
    thumb2.src = u2;
    thumb2.onclick = () => { if (mainPhoto && u2) mainPhoto.src = u2; };
  }

  const specsRow = document.getElementById('detail-specs-row');
  if (specsRow) {
    specsRow.innerHTML = `
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bed"></use></svg> <strong>${vivienda.habitaciones}</strong> Habitaciones</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-bath"></use></svg> <strong>${vivienda.banos}</strong> Baños</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-area"></use></svg> <strong>${vivienda.area_m2}</strong> m² Área Privada</div>
      <div class="spec-entry"><svg class="icon icon--sm"><use href="/assets/icons.svg#icon-building"></use></svg> <strong>${escapeHTML(String(vivienda.tipo || '').toUpperCase())}</strong></div>
    `;
  }

  const formatCOP = n => new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}).format(n);
  const canon = document.getElementById('detail-val-canon');
  const admon = document.getElementById('detail-val-admin');
  const total = document.getElementById('detail-val-total');

  if (canon) canon.textContent = formatCOP(vivienda.precio);
  if (admon) admon.textContent = formatCOP(vivienda.administracion);
  if (total) total.textContent = formatCOP(vivienda.precio + vivienda.administracion);

  const btnWhatsapp = document.getElementById('detail-btn-whatsapp');
  if (btnWhatsapp && btnWhatsapp.tagName === 'A') {
    const message = encodeURIComponent(
      `Hola, estoy interesado en la vivienda:\n\n🏡 *${vivienda.titulo}*\n📍 ${vivienda.barrio}, Bogotá\n💰 Arriendo: $${Number(vivienda.precio).toLocaleString('es-CO')} + \n   Adm: $${Number(vivienda.administracion).toLocaleString('es-CO')}\n   Total: $${Number(vivienda.precio + vivienda.administracion).toLocaleString('es-CO')}/mes\n\n¿Podría darme más información?`
    );
    btnWhatsapp.href = `https://wa.me/573186866186?text=${message}`;
  }

  // Requisitos específicos desde base de datos si existen
  const reqListEl = document.getElementById('detail-legal-list');
  if (reqListEl && Array.isArray(vivienda.requisitos) && vivienda.requisitos.length > 0) {
    const itemsHTML = vivienda.requisitos
      .map(
        (reqText) => `
      <li class="legal-box__item">
        <span class="legal-box__check">✓</span>
        <span>${escapeHTML(reqText)}</span>
      </li>
    `
      )
      .join('');
    const depositoHTML = vivienda.deposito
      ? `<li class="legal-box__item"><span class="legal-box__check">✓</span><span>Depósito en garantía: <strong>${formatCOP(vivienda.deposito)}</strong></span></li>`
      : '';
    reqListEl.innerHTML = itemsHTML + depositoHTML;
  }

  const c = vivienda.caracteristicas || {};
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
  if (stationNameEl && vivienda.transporte) stationNameEl.textContent = vivienda.transporte.estacion;

  const rulerEl = document.getElementById('detail-ruler-text');
  if (rulerEl && vivienda.transporte) {
    rulerEl.textContent = `A exactamente ${vivienda.transporte.distanciaCuadras} cuadras caminables (aprox. ${vivienda.transporte.distanciaCuadras * 2} minutos a pie).`;
  }

  const superEl = document.getElementById('detail-super-text');
  if (superEl && vivienda.supermercado) {
    superEl.textContent = `${vivienda.supermercado.nombre} a ${vivienda.supermercado.distanciaCuadras} cuadras`;
  }

  const riskBox = document.getElementById('detail-risk-box');
  if (riskBox) {
    if (vivienda.zonaRiesgo?.existe) {
      riskBox.style.display = 'block';
      const riskText = document.getElementById('detail-risk-text');
      if (riskText) riskText.textContent = vivienda.zonaRiesgo.detalle;
    } else {
      riskBox.style.display = 'none';
    }
  }

  const btnFav = document.getElementById('btn-detail-fav');
  const btnComp = document.getElementById('btn-detail-compare');

  function updateDetailActionButtons() {
    const isSaved = AppState.guardados.includes(vivienda.id);
    const isCompared = AppState.comparador.includes(vivienda.id);

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

  if (btnFav) btnFav.onclick = () => toggleSaveProperty(vivienda.id);
  if (btnComp) btnComp.onclick = () => toggleCompareProperty(vivienda.id);

  subscribeState(updateDetailActionButtons);

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
        showToast(res.mensaje || '¡Tu consulta ha sido radicada! Redirigiendo a WhatsApp...');
        supportForm.reset();
        const whatsappUrl = res?.data?.whatsapp_url || res?.whatsapp_url;
        if (whatsappUrl) {
          setTimeout(() => {
            window.open(whatsappUrl, '_blank');
          }, 1500);
        }
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
