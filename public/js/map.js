/**
 * HABITABOGOTÁ — /public/js/map.js
 * Módulo completo de mapas reales con Leaflet + OpenStreetMap + MarkerCluster + Nominatim.
 */

let globalLeafletMap = null;
let globalMarkersCluster = null;
let optionalLayersControl = null;
let activeLayersGroup = {
  transporte: null,
  supermercado: null,
  zona_riesgo: null
};

// SVG Pins personalizados con L.divIcon
function createCustomDivIcon(operacion) {
  const isRent = operacion === 'arriendo';
  const bgCol = isRent ? '#B4472B' : '#E0A526';
  const label = isRent ? 'A' : 'V';

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="background: ${bgCol}; width: 36px; height: 44px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #fff;">
        <span style="transform: rotate(45deg); font-family: 'Fraunces', serif; font-size: 15px; font-weight: 800; color: #fff;">${label}</span>
      </div>
    `,
    iconSize: [36, 44],
    iconPoint: [18, 44],
    popupAnchor: [0, -42]
  });
}

function renderPopupHTML(p) {
  const total = calculateTotalCost(p);
  const img = escapeHTML((p.imagenes && p.imagenes[0]) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80');
  const titulo = escapeHTML(p.titulo);
  const barrio = escapeHTML(p.barrio);
  const isSaved = AppState.guardados.includes(p.id);
  const c = p.caracteristicas || p;

  return `
    <div style="width: 240px; font-family: 'DM Sans', sans-serif; color: var(--color-ink);">
      <div style="border-radius: 6px; overflow: hidden; height: 130px; margin-bottom: 8px; border: 1px solid var(--color-border);">
        <img src="${img}" alt="${titulo}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 700; line-height: 1.2; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${titulo}</div>
      <div style="font-size: 0.75rem; color: var(--color-ink-muted); margin-bottom: 6px;">${barrio} · ${p.habitaciones} hab. · ${p.area_m2} m²</div>
      <div style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 800; color: var(--color-moss-dark); margin-bottom: 8px;">${formatCOP(total)}</div>
      
      <div style="display: flex; gap: 4px; margin-bottom: 8px; font-size: 0.7rem;">
        ${c.mascotas ? '<span style="background: #FBECE9; color: #B4472B; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🐾 Mascotas</span>' : ''}
        ${c.parqueadero ? '<span style="background: var(--color-sand); padding: 2px 6px; border-radius: 4px;">🚗 Parqueadero</span>' : ''}
        ${c.balcon ? '<span style="background: var(--color-sand); padding: 2px 6px; border-radius: 4px;">🌿 Balcón</span>' : ''}
      </div>

      <div style="display: flex; gap: 6px;">
        <a href="/inmueble.html?id=${p.id}" target="_blank" style="flex: 1; text-align: center; background: var(--color-ink); color: var(--color-cream); padding: 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-decoration: none;">Ver Detalle</a>
        <button type="button" onclick="toggleSaveProperty(${p.id})" style="background: ${isSaved ? 'var(--color-terracotta)' : 'var(--color-sand)'}; color: ${isSaved ? '#fff' : 'var(--color-ink)'}; border: 1px solid var(--color-ink); padding: 6px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">${isSaved ? 'Guardado' : 'Guardar'}</button>
      </div>
    </div>
  `;
}

// Inicializar el mapa principal en index.html
function initBogotaLeafletMap() {
  const container = document.getElementById('map-canvas-container');
  if (!container) return;

  if (globalLeafletMap) {
    globalLeafletMap.remove();
    globalLeafletMap = null;
  }

  const bogotaCenter = [4.711, -74.0721];
  const bogotaBounds = L.latLngBounds([4.45, -74.30], [4.95, -73.90]);

  globalLeafletMap = L.map('map-canvas-container', {
    center: bogotaCenter,
    zoom: 12,
    minZoom: 11,
    maxZoom: 18,
    maxBounds: bogotaBounds,
    maxBoundsViscosity: 0.8
  });

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(globalLeafletMap);

  globalMarkersCluster = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  globalLeafletMap.addLayer(globalMarkersCluster);

  // Capas opcionales con control L.control.layers
  activeLayersGroup.transporte = L.layerGroup();
  activeLayersGroup.supermercado = L.layerGroup();
  activeLayersGroup.zona_riesgo = L.layerGroup();

  const overlayMaps = {
    "🚇 TransMilenio & SITP": activeLayersGroup.transporte,
    "🛒 Supermercados": activeLayersGroup.supermercado,
    "⚠️ Zonas de Precaución": activeLayersGroup.zona_riesgo
  };

  optionalLayersControl = L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(globalLeafletMap);

  // Carga perezosa al activar capas
  globalLeafletMap.on('overlayadd', async (e) => {
    if (e.name.includes('TransMilenio') && activeLayersGroup.transporte.getLayers().length === 0) {
      await loadPoiLayer('transporte', activeLayersGroup.transporte, '#C93B2B');
    }
    if (e.name.includes('Supermercados') && activeLayersGroup.supermercado.getLayers().length === 0) {
      await loadPoiLayer('supermercado', activeLayersGroup.supermercado, '#2D4435');
    }
    if (e.name.includes('Zonas') && activeLayersGroup.zona_riesgo.getLayers().length === 0) {
      await loadPoiLayer('zona_riesgo', activeLayersGroup.zona_riesgo, '#E0A526', true);
    }
  });

  updateMapMarkers(AppState.resultados || []);
}

async function loadPoiLayer(categoria, layerGroup, color, isRisk = false) {
  try {
    const res = await apiFetch(`/api/puntos-interes?categoria=${categoria}`);
    const puntos = res.puntos || [];

    puntos.forEach((poi) => {
      if (!poi.lat || !poi.lng) return;

      if (isRisk) {
        const circle = L.circle([poi.lat, poi.lng], {
          radius: 350,
          color: '#C93B2B',
          fillColor: '#C93B2B',
          fillOpacity: 0.25,
          weight: 1.5,
          dashArray: '4 4'
        }).bindPopup(`<div style="font-family: 'DM Sans'; font-weight: 700;">⚠️ Zona de precaución: ${escapeHTML(poi.nombre)}</div>`);
        layerGroup.addLayer(circle);
      } else {
        const marker = L.circleMarker([poi.lat, poi.lng], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        }).bindPopup(`<div style="font-family: 'DM Sans'; font-weight: 700;">${escapeHTML(poi.nombre)}</div>`);
        layerGroup.addLayer(marker);
      }
    });
  } catch (err) {
    console.warn(`No se pudo cargar capa POI ${categoria}:`, err);
  }
}

function updateMapMarkers(properties) {
  if (!globalMarkersCluster) return;

  globalMarkersCluster.clearLayers();

  properties.forEach((p) => {
    if (!p.lat || !p.lng) return;

    const icon = createCustomDivIcon(p.operacion);
    const marker = L.marker([Number(p.lat), Number(p.lng)], { icon });

    marker.bindPopup(renderPopupHTML(p));

    marker.on('mouseover', () => {
      previewPropertyHighlight(p.id, true);
    });
    marker.on('mouseout', () => {
      previewPropertyHighlight(p.id, false);
    });

    globalMarkersCluster.addLayer(marker);
  });
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

// Mapa pequeño en la ficha de detalle (inmueble.html)
function initPropertyDetailLeafletMap(property) {
  const container = document.getElementById('detail-map-canvas');
  if (!container || !property || !property.lat || !property.lng) return;

  const map = L.map('detail-map-canvas', {
    center: [property.lat, property.lng],
    zoom: 15,
    dragging: !L.Browser.mobile,
    tap: !L.Browser.mobile
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const icon = createCustomDivIcon(property.operacion);
  const marker = L.marker([property.lat, property.lng], { icon }).addTo(map);
  marker.bindPopup(renderPopupHTML(property)).openPopup();

  if (Array.isArray(property.puntos_interes)) {
    property.puntos_interes.forEach((poi) => {
      if (poi.lat && poi.lng) {
        L.circleMarker([poi.lat, poi.lng], {
          radius: 5,
          fillColor: poi.categoria === 'transporte' ? '#C93B2B' : '#2D4435',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }).bindPopup(`<div style="font-family: 'DM Sans'; font-weight: 700;">${escapeHTML(poi.nombre)}</div>`).addTo(map);
      }
    });
  }
}

// Mapa interactivo para publicar inmueble con Nominatim
function initPublishLeafletMap() {
  const container = document.getElementById('leaflet-picker-map');
  if (!container) return;

  const bogotaCenter = [4.711, -74.0721];
  const map = L.map('leaflet-picker-map', {
    center: bogotaCenter,
    zoom: 13
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker = L.marker(bogotaCenter, { draggable: true }).addTo(map);

  function updateInputs(lat, lng) {
    const latInput = document.getElementById('pub-lat');
    const lngInput = document.getElementById('pub-lng');
    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);
  }

  marker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    updateInputs(pos.lat, pos.lng);
  });

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateInputs(e.latlng.lat, e.latlng.lng);
  });

  updateInputs(bogotaCenter[0], bogotaCenter[1]);

  // Agregar buscador Nominatim opcional encima del mapa
  const searchBox = document.createElement('div');
  searchBox.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 1000; background: #fff; padding: 6px; border: 2px solid var(--color-ink); border-radius: 4px; display: flex; gap: 4px;';
  searchBox.innerHTML = `
    <input type="search" id="nominatim-input" placeholder="Buscar dirección en Bogotá..." style="padding: 4px 8px; font-size: 0.8rem; border: 1px solid #ccc; border-radius: 2px; width: 220px;">
    <button type="button" id="nominatim-btn" style="background: var(--color-ink); color: #fff; border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer; font-size: 0.8rem;">Buscar</button>
  `;
  container.style.position = 'relative';
  container.appendChild(searchBox);

  const searchBtn = document.getElementById('nominatim-btn');
  const searchInput = document.getElementById('nominatim-input');

  const performNominatimSearch = async () => {
    const queryStr = searchInput.value.trim();
    if (!queryStr) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr + ', Bogotá, Colombia')}&city=Bogotá&countrycode=CO&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'HabitaBogota/1.0 (contacto@habitabogota.co)' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = Number(data[0].lat);
        const lon = Number(data[0].lon);
        map.setView([lat, lon], 16);
        marker.setLatLng([lat, lon]);
        updateInputs(lat, lon);
        showToast('Ubicación encontrada en el mapa');
      } else {
        showToast('No se encontró la dirección exacta.', 'icon-alert');
      }
    } catch {
      showToast('Error al consultar Nominatim.', 'icon-alert');
    }
  };

  if (searchBtn) searchBtn.onclick = performNominatimSearch;
  if (searchInput) {
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performNominatimSearch();
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPublishLeafletMap();
});

function toggleMapLayer(layerName) {
  const normalizedKey = layerName === 'riesgo' ? 'zona_riesgo' : layerName;
  const layerGroup = activeLayersGroup[normalizedKey];
  const btn = document.getElementById(`layer-btn-${layerName}`);

  if (!globalLeafletMap || !layerGroup) return;

  if (globalLeafletMap.hasLayer(layerGroup)) {
    globalLeafletMap.removeLayer(layerGroup);
    if (btn) {
      btn.style.background = 'var(--color-sand)';
      btn.style.color = 'var(--color-ink)';
      btn.setAttribute('aria-pressed', 'false');
    }
  } else {
    globalLeafletMap.addLayer(layerGroup);
    if (layerGroup.getLayers().length === 0) {
      if (normalizedKey === 'transporte') loadPoiLayer('transporte', layerGroup, '#C93B2B');
      if (normalizedKey === 'zona_riesgo') loadPoiLayer('zona_riesgo', layerGroup, '#E0A526', true);
    }
    if (btn) {
      btn.style.background = 'var(--color-terracotta)';
      btn.style.color = '#fff';
      btn.setAttribute('aria-pressed', 'true');
    }
  }
}

window.initBogotaLeafletMap = initBogotaLeafletMap;
window.updateMapMarkers = updateMapMarkers;
window.toggleMapLayer = toggleMapLayer;
window.initPropertyDetailLeafletMap = initPropertyDetailLeafletMap;
window.initPublishLeafletMap = initPublishLeafletMap;


