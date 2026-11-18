window.abrirModalLogin = function() {
  var modal = document.getElementById('modal-auth');
  if (modal) modal.style.display = 'flex';
};

window.cerrarModalAuth = function() {
  var modal = document.getElementById('modal-auth');
  if (modal) modal.style.display = 'none';
};

window.cambiarTabAuth = function(tab) {
  var formLogin = document.getElementById('form-login');
  var formRegistro = document.getElementById('form-registro');
  var tabLogin = document.getElementById('tab-login-btn');
  var tabRegistro = document.getElementById('tab-registro-btn');

  if (tab === 'registro') {
    if (formLogin) formLogin.style.display = 'none';
    if (formRegistro) formRegistro.style.display = 'flex';
    if (tabRegistro) {
      tabRegistro.style.background = 'var(--color-sand, #F6F1E9)';
      tabRegistro.style.fontWeight = '700';
    }
    if (tabLogin) {
      tabLogin.style.background = 'transparent';
      tabLogin.style.fontWeight = '500';
    }
  } else {
    if (formLogin) formLogin.style.display = 'flex';
    if (formRegistro) formRegistro.style.display = 'none';
    if (tabLogin) {
      tabLogin.style.background = 'var(--color-sand, #F6F1E9)';
      tabLogin.style.fontWeight = '700';
    }
    if (tabRegistro) {
      tabRegistro.style.background = 'transparent';
      tabRegistro.style.fontWeight = '500';
    }
  }
};

window.toggleDropdownUsuario = function() {
  var menu = document.getElementById('dropdown-menu-usuario');
  if (menu) {
    menu.classList.toggle('abierto');
  }
};

window.submitLogin = function() {
  var correoEl = document.getElementById('login-correo');
  var passEl = document.getElementById('login-contrasena');
  var errEl = document.getElementById('login-error');

  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  var correo = correoEl ? correoEl.value.trim() : '';
  var contrasena = passEl ? passEl.value : '';

  if (!correo || !contrasena) {
    if (errEl) {
      errEl.textContent = 'Por favor ingresa tu correo y contraseña.';
      errEl.style.display = 'block';
    }
    return;
  }

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ correo: correo, contrasena: contrasena })
  })
    .then(function(r) {
      return r.json().then(function(data) {
        if (!r.ok) {
          throw new Error(data.mensaje || data.error || 'Correo o contraseña incorrectos.');
        }
        return data;
      });
    })
    .then(function(data) {
      if (data && data.usuario) {
        window.usuarioActual = data.usuario;
        actualizarHeaderAutenticado(data.usuario);
        window.cerrarModalAuth();
        if (window.HabiState && typeof window.HabiState.sincronizarConAPI === 'function') {
          window.HabiState.sincronizarConAPI();
        } else if (typeof syncSessionLists === 'function') {
          syncSessionLists();
        }
        if (window.HabiAuth && HabiAuth._accionPendiente) {
          var accion = HabiAuth._accionPendiente;
          HabiAuth._accionPendiente = null;
          setTimeout(accion, 300);
        }
      }
    })
    .catch(function(err) {
      if (errEl) {
        errEl.textContent = err.message || 'Error al iniciar sesión.';
        errEl.style.display = 'block';
      }
    });
};

window.submitRegistro = function() {
  var nombreEl = document.getElementById('registro-nombre');
  var correoEl = document.getElementById('registro-correo');
  var passEl = document.getElementById('registro-contrasena');
  var confirmEl = document.getElementById('registro-confirmar');
  var errEl = document.getElementById('registro-error');

  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  var nombre = nombreEl ? nombreEl.value.trim() : '';
  var correo = correoEl ? correoEl.value.trim() : '';
  var contrasena = passEl ? passEl.value : '';
  var confirmar = confirmEl ? confirmEl.value : '';

  if (!nombre || !correo || !contrasena || !confirmar) {
    if (errEl) {
      errEl.textContent = 'Por favor completa todos los campos.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (contrasena.length < 8) {
    if (errEl) {
      errEl.textContent = 'La contraseña debe tener al menos 8 caracteres.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (contrasena !== confirmar) {
    if (errEl) {
      errEl.textContent = 'Las contraseñas no coinciden.';
      errEl.style.display = 'block';
    }
    return;
  }

  fetch('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nombre: nombre, correo: correo, contrasena: contrasena })
  })
    .then(function(r) {
      return r.json().then(function(data) {
        if (!r.ok) {
          throw new Error(data.mensaje || data.error || 'No se pudo completar el registro.');
        }
        return data;
      });
    })
    .then(function(data) {
      if (data && data.usuario) {
        window.usuarioActual = data.usuario;
        actualizarHeaderAutenticado(data.usuario);
        window.cerrarModalAuth();
        if (window.HabiState && typeof window.HabiState.sincronizarConAPI === 'function') {
          window.HabiState.sincronizarConAPI();
        } else if (typeof syncSessionLists === 'function') {
          syncSessionLists();
        }
        if (window.HabiAuth && HabiAuth._accionPendiente) {
          var accion = HabiAuth._accionPendiente;
          HabiAuth._accionPendiente = null;
          setTimeout(accion, 300);
        }
      }
    })
    .catch(function(err) {
      if (errEl) {
        errEl.textContent = err.message || 'Error al crear la cuenta.';
        errEl.style.display = 'block';
      }
    });
};

window.cerrarSesion = function() {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    .catch(function() {});

  window.usuarioActual = null;
  if (window.HabiAuth) {
    window.HabiAuth.usuario = null;
    window.HabiAuth._accionPendiente = null;
    window.HabiAuth._sesionPromise = null;
  }

  var btnEntrar = document.getElementById('btn-entrar');
  var dropdown = document.getElementById('usuario-dropdown');
  var menu = document.getElementById('dropdown-menu-usuario');
  var nombreEl = document.getElementById('usuario-nombre');
  var inicialesEl = document.getElementById('usuario-iniciales');

  if (btnEntrar) btnEntrar.style.display = 'inline-flex';
  if (dropdown) dropdown.style.display = 'none';
  if (menu) menu.classList.remove('abierto');
  if (nombreEl) nombreEl.textContent = '';
  if (inicialesEl) inicialesEl.textContent = '';

  if (window.HabiState) {
    window.HabiState.init();
  }
};

function actualizarHeaderAutenticado(usuario) {
  window.usuarioActual = usuario;
  window.HabiAuth = window.HabiAuth || {};
  window.HabiAuth.usuario = usuario;

  var btnEntrar = document.getElementById('btn-entrar');
  var dropdown = document.getElementById('usuario-dropdown');
  var nombreEl = document.getElementById('usuario-nombre');
  var inicialesEl = document.getElementById('usuario-iniciales');

  if (btnEntrar) btnEntrar.style.display = 'none';
  if (dropdown) dropdown.style.display = 'flex';

  var nombreCompleto = (usuario && usuario.nombre) ? usuario.nombre.trim() : '';
  var partes = nombreCompleto ? nombreCompleto.split(/\s+/) : [];
  var primerNombre = partes[0] || '';
  var iniciales = ((partes[0] ? partes[0][0] : '') + (partes[1] ? partes[1][0] : '')).toUpperCase() || (primerNombre.slice(0, 2).toUpperCase() || 'U');

  if (nombreEl) nombreEl.textContent = primerNombre;
  if (inicialesEl) inicialesEl.textContent = iniciales;
}

window.HabiAuth = {
  usuario: null,
  _sesionPromise: null,
  restaurarSesion: async function(forzar) {
    if (this._sesionPromise && !forzar) {
      return this._sesionPromise;
    }
    var self = this;
    this._sesionPromise = (async function() {
      try {
        var res = await fetch('/api/auth/yo', { credentials: 'include' });
        var data = res.ok ? await res.json() : null;
        if (data && data.usuario) {
          self.usuario = data.usuario;
          window.usuarioActual = data.usuario;
          actualizarHeaderAutenticado(data.usuario);
        } else {
          self.usuario = null;
          window.usuarioActual = null;
        }
      } catch (err) {
        self.usuario = null;
        window.usuarioActual = null;
      }
      return self.usuario;
    })();
    return this._sesionPromise;
  },
  renderHeader: function() {
    if (this.usuario) {
      actualizarHeaderAutenticado(this.usuario);
    }
  },
  estaAutenticado: function() {
    return Boolean(this.usuario);
  }
};

window.verificarSesion = async function() {
  await HabiAuth.restaurarSesion();
  HabiAuth.renderHeader();
  return HabiAuth.usuario;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.HabiAuth.restaurarSesion();
  });
} else {
  window.HabiAuth.restaurarSesion();
}


