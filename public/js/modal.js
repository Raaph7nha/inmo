/**
 * HABITABOGOTÁ — /public/js/modal.js
 * Modales accesibles: Tour Virtual 360° arrastrable y Alertas de búsqueda conectadas a PostgreSQL.
 */

let activeModal = null;
let lastFocusedElement = null;

const PANORAMA_ROOMS = {
  sala: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  hab: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1600&q=80',
  cocina: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80'
};

let tourOffset = -600;
let isPanningTour = false;
let panStartX = 0;

function openModal(modalElement) {
  if (!modalElement) return;
  lastFocusedElement = document.activeElement;
  modalElement.classList.add('modal-overlay--open');
  activeModal = modalElement;

  const firstFocusable = modalElement.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
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

async function openVirtualTour(propertyId) {
  let item = getCachedInmueble(propertyId);
  if (!item) {
    try {
      const res = await apiFetch(`/api/inmuebles/${propertyId}`);
      item = res.inmueble;
      cacheInmuebles([item]);
    } catch {
      item = null;
    }
  }

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
  initTourDragEvents();
}

function setTourPanoramaRoom(roomKey) {
  const bg = document.getElementById('tour-panorama-bg');
  if (!bg) return;

  bg.style.backgroundImage = `url('${PANORAMA_ROOMS[roomKey] || PANORAMA_ROOMS.sala}')`;
  document.querySelectorAll('[data-tour-room]').forEach((b) => {
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

  stage.ontouchstart = (e) => {
    if (!e.touches.length) return;
    isPanningTour = true;
    panStartX = e.touches[0].clientX - tourOffset;
  };

  window.onmousemove = (e) => {
    if (!isPanningTour) return;
    tourOffset = e.clientX - panStartX;
    if (tourOffset > 0) tourOffset = -1400;
    if (tourOffset < -1600) tourOffset = -100;
    bg.style.transform = `translateX(${tourOffset}px)`;
  };

  window.ontouchmove = (e) => {
    if (!isPanningTour || !e.touches.length) return;
    tourOffset = e.touches[0].clientX - panStartX;
    if (tourOffset > 0) tourOffset = -1400;
    if (tourOffset < -1600) tourOffset = -100;
    bg.style.transform = `translateX(${tourOffset}px)`;
  };

  window.onmouseup = () => {
    isPanningTour = false;
  };
  window.ontouchend = () => {
    isPanningTour = false;
  };

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

function openAlertsModal() {
  const modal = document.getElementById('modal-email-alert');
  if (modal) openModal(modal);
}

// Envío de alerta real a POST /api/alertas
async function handleAlertFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const emailInput = document.getElementById('input-email-alert');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!emailInput) return;

  const correo = emailInput.value.trim();
  if (!correo) return;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando alerta...';
  }

  try {
    const res = await apiFetch('/api/alertas', {
      method: 'POST',
      body: JSON.stringify({
        correo,
        filtros: AppState.filtros
      })
    });
    closeModal();
    form.reset();
    showToast(res.mensaje || 'Alerta activada. Te enviaremos nuevos inmuebles.');
  } catch (err) {
    showToast(err.message || 'No pudimos guardar tu alerta. Verifica el correo.', 'icon-alert');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Activar Alerta';
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal);
  }

  if (e.key === 'Tab' && activeModal) {
    const focusables = activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
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
