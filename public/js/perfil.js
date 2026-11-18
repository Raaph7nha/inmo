async function cargarPerfil(usuario) {
  const nombreEl = document.getElementById('perfil-nombre') || document.getElementById('perfil-welcome-text');
  if (nombreEl) {
    nombreEl.textContent = `Hola, ${usuario.nombre || ''} (${usuario.correo || ''}) — Rol: ${usuario.rol || 'comprador'}`;
  }
}

async function cargarVisitas() {
  try {
    const res = await fetch('/api/visitas/mias', { credentials: 'include' })
    const data = await res.json()
    const visitas = data?.data?.visitas || data?.visitas || data?.data || []
    const contenedor = document.getElementById('visitas-list-container') || document.getElementById('lista-visitas')
    if (!contenedor) return
    if (visitas.length === 0) {
      contenedor.innerHTML = '<p style="color: var(--color-ink-muted); font-style: italic;">No tienes visitas agendadas aún.</p>'
      return
    }
    contenedor.innerHTML = visitas.map(v => {
      const fechaStr = String(v.fecha_preferida || '').split('T')[0];
      const safeTitulo = typeof escapeHTML === 'function' ? escapeHTML(v.vivienda_titulo || v.titulo || 'Vivienda') : (v.vivienda_titulo || v.titulo || 'Vivienda');
      const safeHorario = typeof escapeHTML === 'function' ? escapeHTML(v.horario || '') : (v.horario || '');
      const safeEstado = typeof escapeHTML === 'function' ? escapeHTML(v.estado || 'pendiente') : (v.estado || 'pendiente');
      return `
      <div style="background: var(--color-cream); border: 1.5px solid var(--color-ink); border-radius: 8px; padding: 16px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
        <div style="display: flex; gap: 14px; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; margin-bottom: 4px;">${safeTitulo}</h3>
            <p style="font-size: 0.8rem; color: var(--color-ink-muted); margin-bottom: 4px;">📅 ${fechaStr} · ⏰ ${safeHorario}</p>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${v.estado === 'confirmada' ? '#E8F5E9' : v.estado === 'cancelada' ? '#FFEBEE' : '#FFF9C4'}; color: ${v.estado === 'confirmada' ? '#2E7D32' : v.estado === 'cancelada' ? '#C62828' : '#F57F17'}; text-transform: uppercase;">
              Estado: ${safeEstado}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <a href="/inmueble.html?id=${v.vivienda_id}" class="btn" style="background: var(--color-ink); color: var(--color-cream); padding: 8px 14px; border-radius: 6px; font-size: 0.8rem; text-decoration: none; font-weight: 700;">Ver Inmueble</a>
          <button type="button" onclick="cancelarVisita(${v.id}, this)" class="btn" style="background: #FFEBEE; color: #C62828; border: 1px solid #C62828; padding: 8px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">Cancelar</button>
        </div>
      </div>
    `;
    }).join('')
  } catch(e) {
    const contenedor = document.getElementById('visitas-list-container') || document.getElementById('lista-visitas')
    if (contenedor) {
      contenedor.innerHTML = '<p style="color: var(--color-terracotta);">No pudimos cargar tus visitas.</p>'
    }
  }
}

async function cargarGuardadosPerfil() {
  try {
    const res = await fetch('/api/guardados', { credentials: 'include' })
    const data = await res.json()
    const items = data?.data?.items || data?.inmuebles || data?.data || []
    const contenedor = document.getElementById('perfil-guardados-preview') || document.getElementById('lista-guardados-perfil')
    if (!contenedor) return
    if (items.length === 0) {
      contenedor.innerHTML = '<p style="color: var(--color-ink-muted); font-style: italic;">No tienes inmuebles guardados.</p>'
      return
    }
    contenedor.innerHTML = items.map(v => {
      const safeTitulo = typeof escapeHTML === 'function' ? escapeHTML(v.titulo || 'Inmueble') : (v.titulo || 'Inmueble');
      return `
      <div style="background: var(--color-cream); border: 1.5px solid var(--color-ink); border-radius: 8px; overflow: hidden; padding: 12px;">
        <h4 style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">${safeTitulo}</h4>
        <p style="font-size: 0.8rem; font-weight: 700; color: var(--color-terracotta); margin-bottom: 8px;">$${Number(v.precio || 0).toLocaleString('es-CO')}</p>
        <a href="/inmueble.html?id=${v.id || v.vivienda_id}" style="font-size: 0.8rem; font-weight: 700; color: var(--color-ink); text-decoration: underline;">Ver detalle</a>
      </div>
    `;
    }).join('')
  } catch(e) {
    const contenedor = document.getElementById('perfil-guardados-preview') || document.getElementById('lista-guardados-perfil')
    if (contenedor) {
      contenedor.innerHTML = '<p style="color: var(--color-ink-muted);">No pudimos cargar tus guardados.</p>'
    }
  }
}

window.cancelarVisita = async function(visitaId, btnEl) {
  if (btnEl && btnEl.dataset.confirm !== '1') {
    btnEl.dataset.confirm = '1';
    btnEl.textContent = '¿Confirmar?';
    setTimeout(() => {
      if (btnEl && btnEl.isConnected) {
        btnEl.dataset.confirm = '';
        btnEl.textContent = 'Cancelar';
      }
    }, 4000);
    return;
  }
  await fetch('/api/visitas/' + visitaId, { 
    method: 'DELETE', 
    credentials: 'include' 
  });
  if (typeof showToast === 'function') showToast('Visita cancelada');
  cargarVisitas();
}
