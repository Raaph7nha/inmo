/**
 * HABITABOGOTÁ — /public/js/render.js
 * Generador de tarjetas editoriales, skeletons de carga, errores, recibo de costos y chips.
 */

const cardPhotoIndexMap = {};

function cycleCardImage(propertyId, step) {
  const item = getCachedInmueble(propertyId);
  if (!item || !item.imagenes || !item.imagenes.length) return;

  const currentIdx = cardPhotoIndexMap[propertyId] || 0;
  const nextIdx = (currentIdx + step + item.imagenes.length) % item.imagenes.length;
  cardPhotoIndexMap[propertyId] = nextIdx;

  const card = document.getElementById(`property-card-${propertyId}`);
  if (card) {
    const img = card.querySelector('.card-property__img');
    if (img) img.src = item.imagenes[nextIdx];

    const dots = card.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('carousel-dot--active', idx === nextIdx);
    });
  }
}

function renderSkeletonCardsHTML(count = 6) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="card-property" aria-hidden="true">
        <div class="card-property__media skeleton-shimmer"></div>
        <div class="card-property__body">
          <div class="skeleton-shimmer" style="height: 54px; width: 100%;"></div>
          <div class="skeleton-shimmer" style="height: 22px; width: 85%;"></div>
          <div class="skeleton-shimmer" style="height: 16px; width: 65%;"></div>
          <div class="skeleton-shimmer" style="height: 36px; width: 100%; margin-top: auto;"></div>
        </div>
      </div>
    `
    )
    .join('');
}

function renderErrorBoxHTML(message = 'No pudimos cargar los inmuebles, intenta de nuevo', retryFnName = 'window.retryCurrentLoad()') {
  return `
    <div class="empty-box" role="alert" style="grid-column: 1 / -1;">
      <div class="empty-box__illustration" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" style="width: 100%; height: 100%;">
          <circle cx="50" cy="50" r="42" stroke="#C93B2B" stroke-width="2.5" fill="#FBECE9" />
          <line x1="50" y1="28" x2="50" y2="56" stroke="#C93B2B" stroke-width="4" stroke-linecap="round" />
          <circle cx="50" cy="69" r="3.5" fill="#C93B2B" />
        </svg>
      </div>
      <h2 class="empty-box__title">${escapeHTML(message)}</h2>
      <p class="empty-box__desc">Verifica tu conexión o vuelve a intentarlo en unos segundos.</p>
      <button type="button" class="btn btn--primary" onclick="${retryFnName}">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-refresh"></use></svg>
        <span>Reintentar carga</span>
      </button>
    </div>
  `;
}

function renderPropertyCardHTML(item) {
  const id = Number(item.id);
  const isSaved = AppState.guardados.includes(id);
  const isCompared = AppState.comparador.includes(id);
  const isRent = item.operacion === 'arriendo';
  const totalCost = calculateTotalCost(item);
  const precioBase = Number(item.precio ?? item.precioBase ?? 0);
  const administracion = Number(item.administracion ?? 0);
  const imagenes = Array.isArray(item.imagenes) && item.imagenes.length
    ? item.imagenes
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'];
  const photoIndex = cardPhotoIndexMap[id] || 0;
  const area = Number(item.area_m2 ?? item.m2 ?? 0);
  const tour3D = Boolean(item.tour_3d ?? item.tour3D);
  const car = item.caracteristicas || {};

  const safeTitulo = escapeHTML(item.titulo);
  const safeBarrio = escapeHTML(item.barrio);
  const safeDireccion = escapeHTML(item.direccion_aprox || item.direccion || '');
  const safeOp = escapeHTML(item.operacion);
  const safeImg = escapeHTML(imagenes[photoIndex] || imagenes[0]);

  const receiptHTML = isRent
    ? `
    <div class="cost-receipt" aria-label="Desglose mensual de costos transparente">
      <div class="cost-receipt__formula">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-check"></use></svg>
        <span>Arriendo ${formatCOP(precioBase)} + Adm. ${formatCOP(administracion)}</span>
      </div>
      <div class="cost-receipt__total">
        <span class="cost-receipt__total-label">Costo Total:</span>
        <div class="cost-receipt__total-sum tabular-nums">
          ${formatCOP(totalCost)} <span>/ mes</span>
        </div>
      </div>
    </div>
  `
    : `
    <div class="cost-receipt" aria-label="Precio de venta y cuota administrativa">
      <div class="cost-receipt__formula">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-check"></use></svg>
        <span>Cuota administración: ${formatCOP(administracion)}/mes</span>
      </div>
      <div class="cost-receipt__total">
        <span class="cost-receipt__total-label">Precio Venta:</span>
        <div class="cost-receipt__total-sum tabular-nums">
          ${formatCOP(totalCost)}
        </div>
      </div>
    </div>
  `;

  const featuredClass = item.destacado ? 'card-property--featured' : '';

  return `
    <article class="card-property ${featuredClass}" id="property-card-${id}" data-id="${id}">
      <div class="card-property__media">
        <img class="card-property__img" src="${safeImg}" alt="${safeTitulo} en ${safeBarrio}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';">

        <div class="card-property__stamp-wrap">
          <span class="stamp-seal ${isRent ? 'stamp-seal--rent' : 'stamp-seal--sale'}">
            ${safeOp}
          </span>
          ${item.destacado ? `
            <span class="stamp-seal stamp-seal--featured">
              ★ Selección de la semana
            </span>
          ` : ''}
        </div>

        ${tour3D ? `
          <button type="button" class="badge-tour3d-circle" style="position: absolute; bottom: 10px; left: 10px;" onclick="openVirtualTour(${id})" aria-label="Abrir Tour Virtual 360° de ${safeTitulo}">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-3d"></use></svg>
          </button>
        ` : ''}

        <button type="button" class="btn-fav ${isSaved ? 'btn-fav--active' : ''}" onclick="toggleSaveProperty(${id})" aria-label="${isSaved ? 'Quitar de guardados' : 'Guardar en mis inmuebles'}" aria-pressed="${isSaved}">
          <svg class="icon" aria-hidden="true">
            <use href="/assets/icons.svg#${isSaved ? 'icon-heart-filled' : 'icon-heart'}"></use>
          </svg>
        </button>

        <button type="button" class="carousel-btn carousel-btn--prev" onclick="cycleCardImage(${id}, -1)" aria-label="Foto anterior">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-arrow-left"></use></svg>
        </button>
        <button type="button" class="carousel-btn carousel-btn--next" onclick="cycleCardImage(${id}, 1)" aria-label="Siguiente foto">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-arrow-right"></use></svg>
        </button>

        <div class="carousel-dots">
          ${imagenes.map((_, i) => `<span class="carousel-dot ${i === photoIndex ? 'carousel-dot--active' : ''}"></span>`).join('')}
        </div>
      </div>

      <div class="card-property__body">
        ${receiptHTML}

        <h3 class="card-property__title">${safeTitulo}</h3>
        <div class="card-property__location">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-map"></use></svg>
          <span>${safeBarrio} · ${safeDireccion}</span>
        </div>

        <div class="card-property__specs">
          <div class="spec-entry" title="${item.habitaciones} habitaciones">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-bed"></use></svg>
            <span>${item.habitaciones} hab</span>
          </div>
          <div class="spec-entry" title="${item.banos} baños">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-bath"></use></svg>
            <span>${item.banos} bñ</span>
          </div>
          <div class="spec-entry" title="${area} metros cuadrados">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-area"></use></svg>
            <span>${area} m²</span>
          </div>
        </div>

        <div class="amenities-row">
          ${car.mascotas ? `
            <span class="amenity-tag amenity-tag--pet" title="Tu mascota también cuenta">
              <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-paw"></use></svg>
              <span>Pet friendly</span>
            </span>
          ` : ''}
          ${car.parqueadero ? `
            <span class="amenity-tag" title="Parqueadero propio">
              <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-car"></use></svg>
              <span>Parqueadero</span>
            </span>
          ` : ''}
          ${car.balcon ? `
            <span class="amenity-tag" title="Balcón o terraza">Balcón</span>
          ` : ''}
        </div>

        <div class="card-property__footer">
          <label class="checkbox-compare">
            <input type="checkbox" onchange="toggleCompareProperty(${id}, this.checked)" ${isCompared ? 'checked' : ''} aria-label="Comparar ${safeTitulo}">
            <span>Comparar</span>
          </label>

          <a href="/inmueble.html?id=${id}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="padding: 6px 14px; font-size: 0.8rem;" aria-label="Ver detalles completos de ${safeTitulo} en pestaña nueva">
            <span>Ver detalles</span>
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-arrow-right"></use></svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderActiveChipsHTML(filters) {
  const chips = [];

  if (filters.operacion !== 'todos') {
    chips.push({ label: `Operación: ${filters.operacion}`, clear: () => { filters.operacion = 'todos'; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.tipo !== 'todos') {
    chips.push({ label: `Tipo: ${filters.tipo}`, clear: () => { filters.tipo = 'todos'; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.keyword && filters.keyword.trim() !== '') {
    chips.push({ label: `"${filters.keyword.trim()}"`, clear: () => { filters.keyword = ''; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.precioMin) {
    chips.push({ label: `Mín: ${formatCOP(filters.precioMin)}`, clear: () => { filters.precioMin = null; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.precioMax) {
    chips.push({ label: `Máx: ${formatCOP(filters.precioMax)}`, clear: () => { filters.precioMax = null; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.habitacionesMin > 0) {
    chips.push({ label: `${filters.habitacionesMin}+ hab`, clear: () => { filters.habitacionesMin = 0; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.mascotas) {
    chips.push({ label: 'Mascotas permitidas 🐾', clear: () => { filters.mascotas = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.parqueadero) {
    chips.push({ label: 'Parqueadero propio', clear: () => { filters.parqueadero = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.balcon) {
    chips.push({ label: 'Balcón / Terraza', clear: () => { filters.balcon = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.gimnasio) {
    chips.push({ label: 'Gimnasio', clear: () => { filters.gimnasio = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.piscina) {
    chips.push({ label: 'Piscina', clear: () => { filters.piscina = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.porteria) {
    chips.push({ label: 'Portería 24/7', clear: () => { filters.porteria = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }
  if (filters.tour3D) {
    chips.push({ label: 'Tour 3D', clear: () => { filters.tour3D = false; syncFilterControlsUI(); notifyFiltersChange(); } });
  }

  window._activeFilterRemovers = chips.map((c) => c.clear);

  if (!chips.length) return '';

  return `
    <div class="active-chips-strip">
      <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-ink-muted);">Filtros activos:</span>
      ${chips.map((c, i) => `
        <span class="chip-item">
          <span>${escapeHTML(c.label)}</span>
          <button type="button" class="chip-item__remove" onclick="window._activeFilterRemovers[${i}]()" aria-label="Quitar filtro ${escapeHTML(c.label)}">
            <svg class="icon icon--sm" style="width: 14px; height: 14px;"><use href="/assets/icons.svg#icon-close"></use></svg>
          </button>
        </span>
      `).join('')}
      <button type="button" class="btn btn--ghost" style="padding: 2px 8px; font-size: var(--text-xs); text-decoration: underline;" onclick="resetAllFilters()">
        Limpiar filtros
      </button>
    </div>
  `;
}
