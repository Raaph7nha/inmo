/**
 * HABITABOGOTÁ — /public/js/map.js
 * Mapa vectorial SVG ilustrado de la retícula de Bogotá con pines de gota,
 * capas de transporte/riesgo y pines dinámicos desde la API.
 */

function generateBogotaMapSVG() {
  return `
    <svg viewBox="0 0 800 520" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0;" aria-hidden="true">
      <defs>
        <pattern id="risk-stripe-pattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#C93B2B" stroke-width="2.5" opacity="0.35" />
        </pattern>
      </defs>

      <rect width="800" height="520" fill="#E8E0D1" />

      <path d="M 670 0 Q 720 180 690 320 T 710 520 L 800 520 L 800 0 Z" fill="#3F5E4A" opacity="0.22" />
      <path d="M 700 0 Q 750 200 720 380 L 800 520 L 800 0 Z" fill="#3F5E4A" opacity="0.18" />
      <text x="730" y="240" font-family="'Fraunces', serif" font-size="13" font-style="italic" fill="#2D4435" font-weight="700" transform="rotate(90, 730, 240)" letter-spacing="0.2em">CERROS ORIENTALES</text>

      <rect x="330" y="220" width="90" height="60" rx="12" fill="#3F5E4A" opacity="0.3" stroke="#3F5E4A" stroke-width="1" />
      <text x="340" y="255" font-family="'DM Sans', sans-serif" font-size="9" font-weight="700" fill="#2D4435">Parque Simón Bolívar</text>

      <line x1="560" y1="280" x2="540" y2="360" stroke="#3F5E4A" stroke-width="12" stroke-linecap="round" opacity="0.35" />
      <text x="500" y="325" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#2D4435">Park Way</text>

      <line x1="600" y1="120" x2="680" y2="120" stroke="#3F5E4A" stroke-width="8" stroke-linecap="round" opacity="0.3" />
      <text x="610" y="115" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#2D4435">El Virrey</text>

      <line x1="630" y1="0" x2="590" y2="520" stroke="#D3C7B5" stroke-width="6" />
      <text x="635" y="40" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Cra. 7ma</text>

      <line x1="490" y1="0" x2="430" y2="520" stroke="#D3C7B5" stroke-width="6" />
      <text x="495" y="60" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Av. NQS (Cra. 30)</text>

      <line x1="260" y1="0" x2="190" y2="520" stroke="#D3C7B5" stroke-width="5" />
      <text x="235" y="480" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Av. Boyacá</text>

      <line x1="380" y1="0" x2="310" y2="520" stroke="#D3C7B5" stroke-width="4" stroke-dasharray="4 2" />
      <text x="365" y="80" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Av. 68</text>

      <line x1="120" y1="80" x2="680" y2="80" stroke="#D3C7B5" stroke-width="3" />
      <text x="130" y="74" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Calle 140 (Cedritos)</text>

      <line x1="150" y1="150" x2="680" y2="150" stroke="#D3C7B5" stroke-width="3.5" />
      <text x="160" y="144" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Calle 100</text>

      <line x1="180" y1="210" x2="670" y2="210" stroke="#D3C7B5" stroke-width="3" />
      <text x="190" y="204" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Calle 72</text>

      <line x1="200" y1="250" x2="660" y2="250" stroke="#D3C7B5" stroke-width="3" />
      <text x="210" y="244" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Calle 63 (Chapinero)</text>

      <line x1="210" y1="290" x2="650" y2="290" stroke="#D3C7B5" stroke-width="3" />
      <text x="220" y="284" font-family="'DM Sans', sans-serif" font-size="8" font-weight="700" fill="#7E8C9A">Calle 53</text>

      <line x1="40" y1="360" x2="630" y2="360" stroke="#B4472B" stroke-width="5" opacity="0.8" />
      <text x="60" y="352" font-family="'DM Sans', sans-serif" font-size="9" font-weight="800" fill="#8F331C">Av. El Dorado (Calle 26) ✈</text>

      <g id="layer-transmilenio-group">
        <line x1="630" y1="0" x2="590" y2="520" stroke="#C93B2B" stroke-width="2.5" stroke-dasharray="6 3" />
        <line x1="490" y1="0" x2="430" y2="520" stroke="#C93B2B" stroke-width="2.5" stroke-dasharray="6 3" />
        <line x1="40" y1="360" x2="630" y2="360" stroke="#C93B2B" stroke-width="2" stroke-dasharray="6 3" />

        <circle cx="610" cy="250" r="5" fill="#C93B2B" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="620" y="253" font-family="'DM Sans', sans-serif" font-size="8" font-weight="800" fill="#16202B">Estación Cl. 63</text>

        <circle cx="605" cy="290" r="5" fill="#C93B2B" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="615" y="293" font-family="'DM Sans', sans-serif" font-size="8" font-weight="800" fill="#16202B">Estación Flores</text>

        <circle cx="585" cy="420" r="5" fill="#C93B2B" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="595" y="423" font-family="'DM Sans', sans-serif" font-size="8" font-weight="800" fill="#16202B">Estación Las Aguas</text>

        <circle cx="310" cy="360" r="5" fill="#C93B2B" stroke="#FFFFFF" stroke-width="1.5" />
        <text x="290" y="380" font-family="'DM Sans', sans-serif" font-size="8" font-weight="800" fill="#16202B">Salitre El Greco</text>
      </g>

      <g id="layer-risk-group">
        <circle cx="180" cy="410" r="38" fill="url(#risk-stripe-pattern)" stroke="#C93B2B" stroke-width="1.5" stroke-dasharray="3 2" />
        <rect x="135" y="395" width="90" height="26" rx="4" fill="#FBECE9" stroke="#C93B2B" stroke-width="1" />
        <text x="142" y="407" font-family="'DM Sans', sans-serif" font-size="7.5" font-weight="800" fill="#78190F">Precaución Peatonal</text>
        <text x="142" y="416" font-family="'DM Sans', sans-serif" font-size="6.5" fill="#78190F">Paso Boyacá Nocturno</text>

        <circle cx="640" cy="430" r="32" fill="url(#risk-stripe-pattern)" stroke="#C93B2B" stroke-width="1.5" stroke-dasharray="3 2" />
        <rect x="595" y="415" width="90" height="26" rx="4" fill="#FBECE9" stroke="#C93B2B" stroke-width="1" />
        <text x="602" y="427" font-family="'DM Sans', sans-serif" font-size="7.5" font-weight="800" fill="#78190F">Poco flujo nocturno</text>
        <text x="602" y="436" font-family="'DM Sans', sans-serif" font-size="6.5" fill="#78190F">Hacia cerros (>9pm)</text>
      </g>
    </svg>

    <div id="interactive-pins-layer" style="position: absolute; inset: 0; pointer-events: auto;"></div>
  `;
}

function renderMapPinsLayer(properties) {
  const container = document.getElementById('interactive-pins-layer');
  if (!container) return;

  container.innerHTML = properties
    .map((p) => {
      const total = calculateTotalCost(p);
      const shortPrice = total >= 100000000 ? `${(total / 1000000).toFixed(0)}M` : `${(total / 1000000).toFixed(1)}M`;
      const x = p.coords?.x ?? p.pos_x ?? 50;
      const y = p.coords?.y ?? p.pos_y ?? 50;
      const img = escapeHTML((p.imagenes && p.imagenes[0]) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80');
      const titulo = escapeHTML(p.titulo);
      const barrio = escapeHTML(p.barrio);
      const cuadras = p.transporte?.distanciaCuadras ?? 3;

      return `
      <div class="map-drop-pin" style="left: ${x}%; top: ${y}%;" onclick="focusPropertyCardInList(${p.id})" onmouseenter="previewPropertyHighlight(${p.id}, true)" onmouseleave="previewPropertyHighlight(${p.id}, false)" role="button" tabindex="0" aria-label="${titulo}, total ${formatCOP(total)}">
        <span>$${shortPrice}</span>
        
        <div class="map-drop-pin__popup">
          <img src="${img}" alt="${titulo}">
          <div style="font-family: var(--font-serif); font-size: 0.8rem; font-weight: 700; color: var(--color-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titulo}</div>
          <div style="font-size: 0.7rem; color: var(--color-ink-muted);">${barrio} · A ${cuadras} c. estación</div>
          <div style="font-family: var(--font-serif); font-size: 0.85rem; font-weight: 800; color: var(--color-moss-dark);">${formatCOP(total)}</div>
        </div>
      </div>
    `;
    })
    .join('');
}

function focusPropertyCardInList(id) {
  const card = document.getElementById(`property-card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('card-property--highlight');
    setTimeout(() => card.classList.remove('card-property--highlight'), 2200);
  }
}

function previewPropertyHighlight(id, enable) {
  const card = document.getElementById(`property-card-${id}`);
  if (card) {
    card.classList.toggle('card-property--highlight', enable);
  }
}

function toggleMapLayer(layerKey) {
  AppState.capasMapa[layerKey] = !AppState.capasMapa[layerKey];
  const layerIdMap = {
    transporte: '#layer-transmilenio-group',
    riesgo: '#layer-risk-group'
  };

  const svgTarget = document.querySelector(layerIdMap[layerKey]);
  if (svgTarget) {
    svgTarget.style.display = AppState.capasMapa[layerKey] ? 'inline' : 'none';
  }

  const btn = document.getElementById(`layer-btn-${layerKey}`);
  if (btn) {
    btn.classList.toggle('btn--primary', AppState.capasMapa[layerKey]);
    btn.classList.toggle('btn--secondary', !AppState.capasMapa[layerKey]);
    btn.setAttribute('aria-pressed', String(AppState.capasMapa[layerKey]));
  }

  showToast(`Capa ${layerKey}: ${AppState.capasMapa[layerKey] ? 'Visible' : 'Oculta'}`);
}
