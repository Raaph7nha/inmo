/**
 * HABITABOGOTÁ — /public/js/compare.js
 * Comparador editorial lado a lado (2 a 3 inmuebles) alimentado desde /api/comparador.
 */

function renderComparisonTable(containerElement) {
  if (!containerElement) return;

  const items = Array.isArray(AppState.comparadorInmuebles) ? AppState.comparadorInmuebles : [];
  const emptyBox = document.getElementById('compare-empty-state');
  const tableWrap = document.getElementById('compare-table-wrap');
  const countNote = document.getElementById('compare-subtitle');

  if (items.length < 2) {
    if (emptyBox) emptyBox.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (countNote) {
      countNote.textContent =
        items.length === 1
          ? 'Tienes 1 inmueble seleccionado. Agrega al menos otro para comparar.'
          : 'Selecciona 2 o 3 inmuebles desde la búsqueda para contrastar sus costos.';
    }
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  if (countNote) {
    countNote.textContent = `Comparando ${items.length} inmuebles de Bogotá (costo total transparente, comodidades y transporte).`;
  }

  const totalCosts = items.map(calculateTotalCost);
  const lowestCost = Math.min(...totalCosts);

  const html = `
    <table class="compare-table" aria-label="Comparativa de inmuebles seleccionados">
      <thead>
        <tr>
          <th>Inmueble</th>
          ${items
            .map((it) => {
              const img = escapeHTML((it.imagenes && it.imagenes[0]) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80');
              return `
            <td style="vertical-align: top; width: calc(100% / ${items.length + 1}); min-width: 240px;">
              <div style="border: 1.5px solid var(--color-ink); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 8px;">
                <img src="${img}" style="width: 100%; height: 130px; object-fit: cover;" alt="${escapeHTML(it.titulo)}">
              </div>
              <h4 style="font-family: var(--font-serif); font-size: 1rem; line-height: 1.25; margin-bottom: 4px;">${escapeHTML(it.titulo)}</h4>
              <p style="font-size: var(--text-xs); color: var(--color-ink-muted); margin-bottom: 8px;">${escapeHTML(it.barrio)} · ${escapeHTML(it.tipo)}</p>
              <button type="button" class="btn btn--ghost" style="padding: 4px 8px; font-size: var(--text-xs); color: var(--color-alert);" onclick="toggleCompareProperty(${it.id}, false)">
                Quitar de la lista
              </button>
            </td>
          `;
            })
            .join('')}
        </tr>
      </thead>
      <tbody>
        <tr style="background: var(--color-moss-light);">
          <th>Costo Total Mensual</th>
          ${items
            .map((it) => {
              const total = calculateTotalCost(it);
              const isBest = total === lowestCost;
              return `
              <td>
                <div style="font-family: var(--font-serif); font-size: 1.35rem; font-weight: 800; color: var(--color-moss-dark);" class="tabular-nums">
                  ${formatCOP(total)}
                </div>
                ${isBest ? '<span class="best-price-stamp">★ Mejor Costo Total</span>' : ''}
              </td>
            `;
            })
            .join('')}
        </tr>

        <tr>
          <th>Canon / Precio base</th>
          ${items.map((it) => `<td class="tabular-nums font-bold">${formatCOP(it.precio ?? it.precioBase)}</td>`).join('')}
        </tr>

        <tr>
          <th>Cuota de administración</th>
          ${items.map((it) => `<td class="tabular-nums">${Number(it.administracion) > 0 ? formatCOP(it.administracion) : '$0 (Sin administración)'}</td>`).join('')}
        </tr>

        <tr>
          <th>Habitaciones y Baños</th>
          ${items.map((it) => `<td>${it.habitaciones} habitaciones · ${it.banos} baños</td>`).join('')}
        </tr>

        <tr>
          <th>Área privada</th>
          ${items.map((it) => `<td><strong>${it.area_m2 ?? it.m2} m²</strong></td>`).join('')}
        </tr>

        <tr>
          <th>Mascotas permitidas</th>
          ${items
            .map(
              (it) => `
            <td>
              ${
                it.caracteristicas?.mascotas
                  ? '<strong style="color: var(--color-moss-dark);">✓ Permitidas (Pet friendly)</strong>'
                  : '<span style="color: var(--color-ink-light);">✗ No permitidas</span>'
              }
            </td>
          `
            )
            .join('')}
        </tr>

        <tr>
          <th>Parqueadero</th>
          ${items.map((it) => `<td>${it.caracteristicas?.parqueadero ? '✓ Incluido' : '✗ Sin parqueadero'}</td>`).join('')}
        </tr>

        <tr>
          <th>Balcón o Terraza</th>
          ${items.map((it) => `<td>${it.caracteristicas?.balcon ? '✓ Sí' : '✗ No'}</td>`).join('')}
        </tr>

        <tr>
          <th>Zonas comunes del edificio</th>
          ${items
            .map((it) => {
              const c = it.caracteristicas || {};
              const zones = [
                c.gimnasio ? 'Gimnasio' : null,
                c.piscina ? 'Piscina' : null,
                c.porteria ? 'Portería 24/7' : null
              ].filter(Boolean);
              return `<td style="font-size: var(--text-xs);">${zones.length ? zones.join(' · ') : 'Ninguna'}</td>`;
            })
            .join('')}
        </tr>

        <tr>
          <th>Transporte cercano</th>
          ${items
            .map(
              (it) => `
            <td style="font-size: var(--text-xs);">
              <strong>${escapeHTML(it.transporte?.estacion || 'Transporte cercano')}</strong><br>
              A ${it.transporte?.distanciaCuadras ?? '-'} cuadras caminables
            </td>
          `
            )
            .join('')}
        </tr>

        <tr>
          <th>Acción</th>
          ${items
            .map(
              (it) => `
            <td>
              <a href="/inmueble.html?id=${it.id}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="font-size: var(--text-xs); padding: 6px 12px;">
                Ver ficha completa
              </a>
            </td>
          `
            )
            .join('')}
        </tr>
      </tbody>
    </table>
  `;

  containerElement.innerHTML = html;
}
