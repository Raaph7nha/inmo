/**
 * HABITABOGOTÁ — /public/js/mapa.js
 * Inicialización de Leaflet Map con OpenStreetMap centrado en Bogotá
 * para el selector de coordenadas en publicar.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('leaflet-picker-map');
  if (!mapContainer) return;

  // Coordenadas iniciales: Bogotá D.C. (Parque de la 93 / Chapinero)
  const bogotaCenter = [4.6768, -74.0483];

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
});
