/**
 * HABITABOGOTÁ — /js/render.js
 * Generador de interfaz de tarjetas editoriales, recibo de costos y chips.
 */

const cardPhotoIndexMap = {};

function cycleCardImage(propertyId, step) {
  const item = INMUEBLES_BOGOTA.find(x => x.id === propertyId);
  if (!item || !item.imagenes.length) return;

  const currentIdx = cardPhotoIndexMap[propertyId] || 0;
  const nextIdx = (currentIdx + step + item.imagenes.length) % item.imagenes.length;
  cardPhotoIndexMap[propertyId] = nextIdx;

  const card = document.getElementById(`property-card-${propertyId}`);
  if (card) {
    const img = card.querySelector('.card-property__img');
    if (img) img.src = item.imagenes[nextIdx];

    // Actualizar puntos del carrusel
    const dots = card.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('carousel-dot--active', idx === nextIdx);
    });
  }
}

function renderPropertyCardHTML(item) {
  const isSaved = AppState.guardados.includes(item.id);
  const isCompared = AppState.comparador.includes(item.id);
  const isRent = item.operacion === 'arriendo';
  const totalCost = calculateTotalCost(item);
  const photoIndex = cardPhotoIndexMap[item.id] || 0;

  // Bloque tipo recibo con línea punteada (Transparencia 39%)
  const receiptHTML = isRent ? `
    <div class="cost-receipt" aria-label="Desglose mensual de costos transparente">
      <div class="cost-receipt__formula">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-check"></use></svg>
        <span>Arriendo ${formatCOP(item.precioBase)} + Adm. ${formatCOP(item.administracion)}</span>
      </div>
      <div class="cost-receipt__total">
        <span class="cost-receipt__total-label">Costo Total:</span>
        <div class="cost-receipt__total-sum tabular-nums">
          ${formatCOP(totalCost)} <span>/ mes</span>
        </div>
      </div>
    </div>
  ` : `
    <div class="cost-receipt" aria-label="Precio de venta y cuota administrativa">
      <div class="cost-receipt__formula">
        <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-check"></use></svg>
        <span>Cuota administración: ${formatCOP(item.administracion)}/mes</span>
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
    <article class="card-property ${featuredClass}" id="property-card-${item.id}" data-id="${item.id}">
      
      <!-- Contenedor de Fotografía 4:3 con tratamiento cálido -->
      <div class="card-property__media">
        <img class="card-property__img" src="${item.imagenes[photoIndex]}" alt="${item.titulo} en ${item.barrio}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';">

        <!-- Sellos de Operación y Selección -->
        <div class="card-property__stamp-wrap">
          <span class="stamp-seal ${isRent ? 'stamp-seal--rent' : 'stamp-seal--sale'}">
            ${item.operacion}
          </span>
          ${item.destacado ? `
            <span class="stamp-seal stamp-seal--featured">
              ★ Selección de la semana
            </span>
          ` : ''}
        </div>

        <!-- Insignia de Tour 3D circular si aplica -->
        ${item.tour3D ? `
          <button type="button" class="badge-tour3d-circle" style="position: absolute; bottom: 10px; left: 10px;" onclick="openVirtualTour('${item.id}')" aria-label="Abrir Tour Virtual 360° de ${item.titulo}">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-3d"></use></svg>
          </button>
        ` : ''}

        <!-- Botón Guardar (Corazón) con microinteracción de rebote -->
        <button type="button" class="btn-fav ${isSaved ? 'btn-fav--active' : ''}" onclick="toggleSaveProperty('${item.id}')" aria-label="${isSaved ? 'Quitar de guardados' : 'Guardar en mis inmuebles'}" aria-pressed="${isSaved}">
          <svg class="icon" aria-hidden="true">
            <use href="/assets/icons.svg#${isSaved ? 'icon-heart-filled' : 'icon-heart'}"></use>
          </svg>
        </button>

        <!-- Carrusel rápido de imágenes -->
        <button type="button" class="carousel-btn carousel-btn--prev" onclick="cycleCardImage('${item.id}', -1)" aria-label="Foto anterior">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-arrow-left"></use></svg>
        </button>
        <button type="button" class="carousel-btn carousel-btn--next" onclick="cycleCardImage('${item.id}', 1)" aria-label="Siguiente foto">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-arrow-right"></use></svg>
        </button>

        <!-- Puntos del carrusel -->
        <div class="carousel-dots">
          ${item.imagenes.map((_, i) => `<span class="carousel-dot ${i === photoIndex ? 'carousel-dot--active' : ''}"></span>`).join('')}
        </div>
      </div>

      <!-- Cuerpo de la Tarjeta Editorial -->
      <div class="card-property__body">
        
        <!-- Recibo de costos transparente -->
        ${receiptHTML}

        <!-- Título del Inmueble -->
        <h3 class="card-property__title">${item.titulo}</h3>
        <div class="card-property__location">
          <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-map"></use></svg>
          <span>${item.barrio} · ${item.direccion}</span>
        </div>

        <!-- Especificaciones de Habitaciones, Baños y Área -->
        <div class="card-property__specs">
          <div class="spec-entry" title="${item.habitaciones} habitaciones">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-bed"></use></svg>
            <span>${item.habitaciones} hab</span>
          </div>
          <div class="spec-entry" title="${item.banos} baños">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-bath"></use></svg>
            <span>${item.banos} bñ</span>
          </div>
          <div class="spec-entry" title="${item.m2} metros cuadrados">
            <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-area"></use></svg>
            <span>${item.m2} m²</span>
          </div>
        </div>

        <!-- Comodidades rápidas (Mascotas en primer nivel para Tatiana y Andrés) -->
        <div class="amenities-row">
          ${item.caracteristicas.mascotas ? `
            <span class="amenity-tag amenity-tag--pet" title="Tu mascota también cuenta">
              <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-paw"></use></svg>
              <span>Pet friendly</span>
            </span>
          ` : ''}
          ${item.caracteristicas.parqueadero ? `
            <span class="amenity-tag" title="Parqueadero propio">
              <svg class="icon icon--sm" aria-hidden="true"><use href="/assets/icons.svg#icon-car"></use></svg>
              <span>Parqueadero</span>
            </span>
          ` : ''}
          ${item.caracteristicas.balcon ? `
            <span class="amenity-tag" title="Balcón o terraza">Balcón</span>
          ` : ''}
        </div>

        <!-- Pie de Tarjeta: Checkbox Comparador + Botón Ver Detalles (en Pestaña Nueva) -->
        <div class="card-property__footer">
          <label class="checkbox-compare">
            <input type="checkbox" onchange="toggleCompareProperty('${item.id}', this.checked)" ${isCompared ? 'checked' : ''} aria-label="Comparar ${item.titulo}">
            <span>Comparar</span>
          </label>

          <a href="/inmueble.html?id=${item.id}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="padding: 6px 14px; font-size: 0.8rem;" aria-label="Ver detalles completos de ${item.titulo} en pestaña nueva">
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
    chips.push({ label: `Operación: ${filters.operacion}`, clear: () => { filters.operacion = 'todos'; notifyStateChange(); } });
  }
  if (filters.tipo !== 'todos') {
    chips.push({ label: `Tipo: ${filters.tipo}`, clear: () => { filters.tipo = 'todos'; notifyStateChange(); } });
  }
  if (filters.keyword && filters.keyword.trim() !== '') {
    chips.push({ label: `"${filters.keyword}"`, clear: () => { filters.keyword = ''; notifyStateChange(); } });
  }
  if (filters.precioMin) {
    chips.push({ label: `Mín: ${formatCOP(filters.precioMin)}`, clear: () => { filters.precioMin = null; notifyStateChange(); } });
  }
  if (filters.precioMax) {
    chips.push({ label: `Máx: ${formatCOP(filters.precioMax)}`, clear: () => { filters.precioMax = null; notifyStateChange(); } });
  }
  if (filters.habitacionesMin > 0) {
    chips.push({ label: `${filters.habitacionesMin}+ hab`, clear: () => { filters.habitacionesMin = 0; notifyStateChange(); } });
  }
  if (filters.mascotas) {
    chips.push({ label: 'Mascotas permitidas 🐾', clear: () => { filters.mascotas = false; notifyStateChange(); } });
  }
  if (filters.parqueadero) {
    chips.push({ label: 'Parqueadero propio', clear: () => { filters.parqueadero = false; notifyStateChange(); } });
  }
  if (filters.balcon) {
    chips.push({ label: 'Balcón / Terraza', clear: () => { filters.balcon = false; notifyStateChange(); } });
  }
  if (filters.gimnasio) {
    chips.push({ label: 'Gimnasio', clear: () => { filters.gimnasio = false; notifyStateChange(); } });
  }
  if (filters.piscina) {
    chips.push({ label: 'Piscina', clear: () => { filters.piscina = false; notifyStateChange(); } });
  }
  if (filters.porteria) {
    chips.push({ label: 'Portería 24/7', clear: () => { filters.porteria = false; notifyStateChange(); } });
  }
  if (filters.tour3D) {
    chips.push({ label: 'Tour 3D', clear: () => { filters.tour3D = false; notifyStateChange(); } });
  }

  window._activeFilterRemovers = chips.map(c => c.clear);

  if (!chips.length) return '';

  return `
    <div class="active-chips-strip">
      <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-ink-muted);">Filtros activos:</span>
      ${chips.map((c, i) => `
        <span class="chip-item">
          <span>${c.label}</span>
          <button type="button" class="chip-item__remove" onclick="window._activeFilterRemovers[${i}]()" aria-label="Quitar filtro ${c.label}">
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
