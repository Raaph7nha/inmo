/**
 * HABITABOGOTÁ — /public/js/modal.js
 * Modales accesibles: Alertas de búsqueda conectadas a PostgreSQL.
 */

let activeModal = null;
let lastFocusedElement = null;

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
