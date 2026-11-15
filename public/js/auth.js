window.abrirModalLogin = function() {
  var modal = document.getElementById('modal-auth');
  if (modal) modal.style.display = 'flex';
};

window.cerrarModalAuth = function() {
  var modal = document.getElementById('modal-auth');
  if (modal) modal.style.display = 'none';
};

window.cambiarTabAuth = function(tab) {
  var loginForm = document.getElementById('form-login');
  var regForm = document.getElementById('form-registro');
  var tabLogin = document.getElementById('tab-login-btn');
  var tabReg = document.getElementById('tab-registro-btn');

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'flex';
    if (regForm) regForm.style.display = 'none';
    if (tabLogin) {
      tabLogin.style.background = 'var(--color-sand, #F6F1E9)';
      tabLogin.style.fontWeight = '700';
    }
    if (tabReg) {
      tabReg.style.background = 'transparent';
      tabReg.style.fontWeight = '500';
    }
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'flex';
    if (tabReg) {
      tabReg.style.background = 'var(--color-sand, #F6F1E9)';
      tabReg.style.fontWeight = '700';
    }
    if (tabLogin) {
      tabLogin.style.background = 'transparent';
      tabLogin.style.fontWeight = '500';
    }
  }
};

window.toggleDropdownUsuario = function() {
  var menu = document.getElementById('dropdown-menu-usuario');
  if (menu) {
    if (menu.classList.contains('abierto') || menu.style.display === 'block' || menu.style.display === 'flex') {
      menu.classList.remove('abierto');
      menu.style.display = 'none';
    } else {
      menu.classList.add('abierto');
      menu.style.display = 'block';
    }
  }
};

window.submitLogin = function() {
  var correoInput = document.getElementById('login-correo');
  var passInput = document.getElementById('login-contrasena');
  var errEl = document.getElementById('login-error');

  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  var correo = correoInput ? correoInput.value.trim() : '';
  var contrasena = passInput ? passInput.value : '';

  if (!correo || !contrasena) {
    if (errEl) {
      errEl.textContent = 'Por favor completa todos los campos.';
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
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) {
          throw new Error(data.mensaje || data.error || 'Correo o contraseña incorrectos.');
        }
        return data;
      });
    })
    .then(function(data) {
      if (data && data.usuario) {
        actualizarHeaderAutenticado(data.usuario);
        window.cerrarModalAuth();
        if (window.location.pathname.includes('/perfil')) {
          window.location.reload();
        }
      }
    })
    .catch(function(err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
};

window.submitRegistro = function() {
  var nombreInput = document.getElementById('registro-nombre');
  var correoInput = document.getElementById('registro-correo');
  var passInput = document.getElementById('registro-contrasena');
  var confirmInput = document.getElementById('registro-confirmar');
  var errEl = document.getElementById('registro-error');

  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  var nombre = nombreInput ? nombreInput.value.trim() : '';
  var correo = correoInput ? correoInput.value.trim() : '';
  var contrasena = passInput ? passInput.value : '';
  var confirmar = confirmInput ? confirmInput.value : '';

  if (!nombre || !correo || !contrasena || !confirmar) {
    if (errEl) {
      errEl.textContent = 'Por favor completa todos los campos.';
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

  if (contrasena.length < 8) {
    if (errEl) {
      errEl.textContent = 'La contraseña debe tener al menos 8 caracteres.';
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
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) {
          throw new Error(data.mensaje || data.error || 'Error al registrar la cuenta.');
        }
        return data;
      });
    })
    .then(function(data) {
      if (data && data.usuario) {
        actualizarHeaderAutenticado(data.usuario);
        window.cerrarModalAuth();
        if (window.location.pathname.includes('/perfil')) {
          window.location.reload();
        }
      }
    })
    .catch(function(err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
};

window.cerrarSesion = function() {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    .catch(function() {});

  var btnEntrar = document.getElementById('btn-entrar');
  var userDropdown = document.getElementById('usuario-dropdown');
  if (btnEntrar) btnEntrar.style.display = 'flex';
  if (userDropdown) userDropdown.style.display = 'none';

  if (window.location.pathname.includes('/perfil') || window.location.pathname.includes('/publicar')) {
    window.location.href = '/index.html';
  } else {
    window.location.reload();
  }
};

function actualizarHeaderAutenticado(usuario) {
  var btnEntrar = document.getElementById('btn-entrar');
  var userDropdown = document.getElementById('usuario-dropdown');
  var userNombre = document.getElementById('usuario-nombre');
  var userIniciales = document.getElementById('usuario-iniciales');

  if (btnEntrar) btnEntrar.style.display = 'none';
  if (userDropdown) userDropdown.style.display = 'flex';

  if (usuario && usuario.nombre) {
    var partes = usuario.nombre.trim().split(' ');
    if (userNombre) userNombre.textContent = partes[0] || '';
    if (userIniciales) {
      var iniciales = ((partes[0] ? partes[0][0] : '') + (partes[1] ? partes[1][0] : '')).toUpperCase();
      userIniciales.textContent = iniciales || 'U';
    }
  }
}

fetch('/api/auth/yo', { credentials: 'include' })
  .then(function(r) { return r.ok ? r.json() : null; })
  .then(function(data) {
    if (data && data.usuario) {
      actualizarHeaderAutenticado(data.usuario);
    }
  })
  .catch(function() {});
