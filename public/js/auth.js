// ─── Estado global de sesión ───────────────────────────────
window.HabiAuth = {
  usuario: null,
  token: null,

  async init() {
    await this.restaurarSesion();
    this.renderHeader();
  },

  async restaurarSesion() {
    try {
      const res = await fetch('/api/auth/yo', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        this.usuario = data.usuario;
      } else {
        this.usuario = null;
      }
    } catch {
      this.usuario = null;
    }
  },

  renderHeader() {
    const btnEntrar = document.getElementById('btn-entrar');
    const userDropdown = document.getElementById('usuario-dropdown');
    const userNombre = document.getElementById('usuario-nombre');
    const userAvatar = document.getElementById('usuario-avatar');
    const userInicialesEl = document.getElementById('usuario-iniciales');

    if (this.usuario) {
      // Sesión activa
      if (btnEntrar) btnEntrar.style.display = 'none';
      if (userDropdown) userDropdown.style.display = 'flex';
      if (userNombre) userNombre.textContent =
        this.usuario.nombre.split(' ').slice(0, 2).join(' ');
      if (userInicialesEl) {
        const partes = this.usuario.nombre.trim().split(' ');
        userInicialesEl.textContent =
          ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
      }
    } else {
      // Sin sesión
      if (btnEntrar) btnEntrar.style.display = 'flex';
      if (userDropdown) userDropdown.style.display = 'none';
    }
  },

  async login(correo, contrasena) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || data.error || 'Error al iniciar sesión');
    this.usuario = data.usuario;
    this.renderHeader();
    return data;
  },

  async registro(nombre, correo, contrasena) {
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contrasena })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || data.error || 'Error al registrarse');
    this.usuario = data.usuario;
    this.renderHeader();
    return data;
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    this.usuario = null;
    this.renderHeader();
    const paginasProtegidas = ['/publicar.html', '/guardados.html', '/comparador.html'];
    if (paginasProtegidas.some(p => window.location.pathname.includes(p))) {
      window.location.href = '/index.html';
    }
  },

  estaAutenticado() {
    return this.usuario !== null;
  },

  requiereAuth(accion) {
    if (!this.estaAutenticado()) {
      abrirModalLogin(accion);
      return false;
    }
    return true;
  }
};

// Funciones globales de modal y dropdown
function abrirModalLogin(accion = '') {
  let overlay = document.getElementById('modal-auth-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-auth-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <div class="modal-window" style="max-width: 420px; background: var(--color-sand); border: 2px solid var(--color-ink); border-radius: var(--radius-card); padding: 0;">
        <div class="modal-window__header" style="padding: 16px; border-bottom: 1px solid var(--color-ink); display: flex; justify-content: space-between; align-items: center;">
          <h2 class="modal-window__title" style="font-family: var(--font-serif); font-size: 1.25rem;">Acceso HabitaBogotá</h2>
          <button type="button" class="btn btn--ghost" style="padding: 4px;" onclick="cerrarModalAuth()">✕</button>
        </div>
        <div style="display: flex; background: var(--color-cream); border-bottom: 1px solid var(--color-ink);">
          <button type="button" id="tab-login-btn" class="btn" style="flex: 1; border-radius: 0; background: var(--color-sand); font-weight: 700;" onclick="switchAuthTab('login')">Iniciar Sesión</button>
          <button type="button" id="tab-registro-btn" class="btn" style="flex: 1; border-radius: 0; background: transparent;" onclick="switchAuthTab('registro')">Registrarse</button>
        </div>
        <div style="padding: 20px;">
          <form id="auth-login-form" onsubmit="handleLoginSubmit(event)" style="display: flex; flex-direction: column; gap: 12px;">
            <div id="login-error-msg" style="color: var(--color-terracotta); font-size: 0.8rem; display: none;"></div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Correo electrónico</label>
              <input type="email" id="login-email-input" class="hero-search-input" style="width: 100%; height: 40px;" required>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Contraseña</label>
              <input type="password" id="login-pass-input" class="hero-search-input" style="width: 100%; height: 40px;" required>
            </div>
            <button type="submit" id="login-submit-btn" class="btn btn--primary" style="margin-top: 8px; width: 100%;">Iniciar Sesión</button>
          </form>

          <form id="auth-registro-form" onsubmit="handleRegistroSubmit(event)" style="display: none; flex-direction: column; gap: 12px;">
            <div id="registro-error-msg" style="color: var(--color-terracotta); font-size: 0.8rem; display: none;"></div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Nombre completo</label>
              <input type="text" id="reg-name-input" class="hero-search-input" style="width: 100%; height: 40px;" required>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Correo electrónico</label>
              <input type="email" id="reg-email-input" class="hero-search-input" style="width: 100%; height: 40px;" required>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Contraseña (mín 8 caracteres)</label>
              <input type="password" id="reg-pass-input" class="hero-search-input" style="width: 100%; height: 40px;" minlength="8" required>
            </div>
            <button type="submit" id="reg-submit-btn" class="btn btn--primary" style="margin-top: 8px; width: 100%;">Registrarse</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('modal-overlay--active');
  switchAuthTab('login');
}

function cerrarModalAuth() {
  const overlay = document.getElementById('modal-auth-overlay');
  if (overlay) overlay.classList.remove('modal-overlay--active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const regForm = document.getElementById('auth-registro-form');
  const loginBtn = document.getElementById('tab-login-btn');
  const regBtn = document.getElementById('tab-registro-btn');
  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'flex';
    if (regForm) regForm.style.display = 'none';
    if (loginBtn) {
      loginBtn.style.background = 'var(--color-sand)';
      loginBtn.style.fontWeight = '700';
    }
    if (regBtn) {
      regBtn.style.background = 'transparent';
      regBtn.style.fontWeight = '400';
    }
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'flex';
    if (regBtn) {
      regBtn.style.background = 'var(--color-sand)';
      regBtn.style.fontWeight = '700';
    }
    if (loginBtn) {
      loginBtn.style.background = 'transparent';
      loginBtn.style.fontWeight = '400';
    }
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email-input').value.trim();
  const pass = document.getElementById('login-pass-input').value;
  const errDiv = document.getElementById('login-error-msg');
  const btn = document.getElementById('login-submit-btn');

  if (errDiv) errDiv.style.display = 'none';
  if (btn) btn.disabled = true;

  try {
    await HabiAuth.login(email, pass);
    cerrarModalAuth();
  } catch (err) {
    if (errDiv) {
      errDiv.textContent = err.message;
      errDiv.style.display = 'block';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleRegistroSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-name-input').value.trim();
  const email = document.getElementById('reg-email-input').value.trim();
  const pass = document.getElementById('reg-pass-input').value;
  const errDiv = document.getElementById('registro-error-msg');
  const btn = document.getElementById('reg-submit-btn');

  if (errDiv) errDiv.style.display = 'none';
  if (btn) btn.disabled = true;

  try {
    await HabiAuth.registro(nombre, email, pass);
    cerrarModalAuth();
  } catch (err) {
    if (errDiv) {
      errDiv.textContent = err.message;
      errDiv.style.display = 'block';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function toggleDropdownUsuario() {
  const menu = document.getElementById('dropdown-menu-usuario');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('dropdown-menu-usuario');
  const trigger = document.querySelector('.usuario-trigger');
  if (menu && menu.style.display === 'block' && !menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
    menu.style.display = 'none';
  }
});

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => HabiAuth.init());

// Exponer funciones globales en window
window.abrirModalLogin = abrirModalLogin;
window.cerrarModalAuth = cerrarModalAuth;
window.switchAuthTab = switchAuthTab;
window.cambiarTabAuth = switchAuthTab;
window.toggleDropdownUsuario = toggleDropdownUsuario;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegistroSubmit = handleRegistroSubmit;

