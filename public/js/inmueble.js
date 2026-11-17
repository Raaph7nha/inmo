window.programarVisita = function() {
  if (!window.HabiAuth || !HabiAuth.usuario) {
    // Mostrar mensaje
    const aviso = document.getElementById('aviso-visita')
    if (aviso) {
      aviso.textContent = 'Necesitas iniciar sesión para programar una visita.'
      aviso.style.display = 'block'
      setTimeout(() => { aviso.style.display = 'none' }, 4000)
    }
    // Guardar acción pendiente y abrir login
    window.HabiAuth = window.HabiAuth || {};
    HabiAuth._accionPendiente = function() {
      abrirModalVisita()
    }
    setTimeout(() => abrirModalLogin(), 800)
    return
  }
  abrirModalVisita()
}

window.abrirModalVisita = function() {
  const modal = document.getElementById('modal-visita')
  if (!modal) return
  modal.style.display = 'flex'
  // Prellenar nombre con el del usuario
  const inputNombre = document.getElementById('visita-nombre')
  if (inputNombre && window.HabiAuth && HabiAuth.usuario) {
    inputNombre.value = HabiAuth.usuario.nombre || ''
  }
  const fechaInput = document.getElementById('visita-fecha')
  if (fechaInput) {
    const today = new Date().toISOString().split('T')[0]
    fechaInput.min = today
    if (!fechaInput.value) fechaInput.value = today
  }
  setTimeout(() => document.getElementById('visita-telefono')?.focus(), 50)
}

window.cerrarModalVisita = function() {
  const modal = document.getElementById('modal-visita')
  if (modal) modal.style.display = 'none'
}

window.submitVisita = async function() {
  const viviendaId = new URLSearchParams(window.location.search).get('id')
  const fecha = document.getElementById('visita-fecha').value
  const horario = document.getElementById('visita-horario').value
  const telefono = document.getElementById('visita-telefono').value
  const mensaje = document.getElementById('visita-mensaje').value

  const errEl = document.getElementById('visita-error')
  if (errEl) errEl.textContent = ''

  if (!fecha || !horario || !telefono) {
    if (errEl) {
      errEl.textContent = 'Por favor completa fecha, horario y teléfono.'
    }
    return
  }

  const btn = document.getElementById('btn-submit-visita')
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Agendando...'
  }

  try {
    const res = await fetch('/api/visitas', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vivienda_id: viviendaId, fecha_preferida: fecha, 
        horario, telefono, mensaje })
    })
    const data = await res.json()
    if (res.ok) {
      cerrarModalVisita()
      alert('¡Visita agendada! Te contactaremos pronto para confirmar.')
    } else {
      if (errEl) {
        errEl.textContent = data.mensaje || 'Error al agendar la visita.'
      }
    }
  } catch(e) {
    if (errEl) {
      errEl.textContent = 'No pudimos conectar. Intenta de nuevo.'
    }
  } finally {
    if (btn) {
      btn.disabled = false
      btn.textContent = 'Confirmar Visita'
    }
  }
}
