/**
 * HABITABOGOTÁ — /js/modal.js
 * Modales accesibles: Tour Virtual 360° interactivo arrastrable y Alertas de búsqueda.
 */

let activeModal = null;
let lastFocusedElement = null;

// Habitaciones panorámicas 360 en alta resolución
const PANORAMA_ROOMS = {
  sala: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  hab: "https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1600&q=80",
  cocina: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80"
};

let tourOffset = -600;
let isPanningTour = false;
let panStartX = 0;

function openModal(modalElement) {
  if (!modalElement) return;
  lastFocusedElement = document.activeElement;
  modalElement.classList.add('modal-overlay--open');
  activeModal = modalElement;

  // Foco accesible al primer botón o elemento interactivo
  const firstFocusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) firstFocusable.focus();

  document.body.style.overflow = 'hidden';
}

function closeModal(modalElement = activeModal) {
  if (!modalElement) return;
  modalElement.classList.remove('modal-overlay--open');
  activeModal = null;
  document.body.style.overflow = '';

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

// Abrir el Tour Virtual 360° de un inmueble
function openVirtualTour(propertyId) {
  const item = INMUEBLES_BOGOTA.find(x => x.id === propertyId);
  const modal = document.getElementById('modal-tour-3d');
  if (!modal) return;

  const titleEl = document.getElementById('tour-modal-title');
  if (titleEl && item) {
    titleEl.textContent = `Tour Virtual 360° — ${item.titulo}`;
  }

  const addToCompareBtn = document.getElementById('tour-add-compare-btn');
  if (addToCompareBtn && item) {
    addToCompareBtn.onclick = () => {
      toggleCompareProperty(item.id, true);
    };
  }

  setTourPanoramaRoom('sala');
  openModal(modal);

  // Inicializar eventos de arrastre del canvas 360
  initTourDragEvents();
}

function setTourPanoramaRoom(roomKey) {
  const bg = document.getElementById('tour-panorama-bg');
  if (!bg) return;

  bg.style.backgroundImage = `url('${PANORAMA_ROOMS[roomKey]}')`;
  document.querySelectorAll('[data-tour-room]').forEach(b => {
    b.classList.toggle('btn--primary', b.getAttribute('data-tour-room') === roomKey);
    b.classList.toggle('btn--secondary', b.getAttribute('data-tour-room') !== roomKey);
  });

  tourOffset = -600;
  bg.style.transform = `translateX(${tourOffset}px)`;
}

function initTourDragEvents() {
  const stage = document.getElementById('tour-canvas-stage');
  const bg = document.getElementById('tour-panorama-bg');
  if (!stage || !bg) return;

  stage.onmousedown = (e) => {
    isPanningTour = true;
    panStartX = e.clientX - tourOffset;
  };

  window.onmousemove = (e) => {
    if (!isPanningTour) return;
    tourOffset = e.clientX - panStartX;
    if (tourOffset > 0) tourOffset = -1400;
    if (tourOffset < -1600) tourOffset = -100;
    bg.style.transform = `translateX(${tourOffset}px)`;
  };

  window.onmouseup = () => {
    isPanningTour = false;
  };

  // Teclado accesible (flechas izquierda y derecha para girar 360)
  stage.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') {
      tourOffset += 45;
      bg.style.transform = `translateX(${tourOffset}px)`;
    } else if (e.key === 'ArrowRight') {
      tourOffset -= 45;
      bg.style.transform = `translateX(${tourOffset}px)`;
    }
  };
}

// Modal de Alertas de Correo
function openAlertsModal() {
  const modal = document.getElementById('modal-email-alert');
  if (modal) openModal(modal);
}

// Cierre global con Escape y Focus Trap
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal);
  }

  // Focus trap básico dentro del modal abierto
  if (e.key === 'Tab' && activeModal) {
    const focusables = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
});
