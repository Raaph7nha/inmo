/**
 * HABITABOGOTÁ — /public/js/chat.js
 * Asistente Habi (Groq + Tool Calling) en estilo "Bogotá cálida y editorial".
 * Renderiza todo texto del usuario y la IA con textContent (sin XSS).
 */

(function () {
  const MAX_CHARS = 500;
  const SUGGESTION_CHIPS = [
    'Pet friendly cerca de la universidad',
    'Hasta $2.000.000 con parqueadero',
    'Cerca de TransMilenio y seguro',
    'Compara mis guardados'
  ];

  const ChatState = {
    isOpen: false,
    isLoading: false,
    historial: [], // { rol: 'user'|'assistant', contenido: string, inmuebles?: [], filtros_sugeridos?: {} }
    lastFailedMessage: null
  };

  let fabBtn = null;
  let drawerEl = null;
  let messagesEl = null;
  let inputEl = null;
  let charCounterEl = null;
  let sendBtn = null;
  let suggestionsBox = null;
  let previousFocus = null;

  function createSvgIcon(symbolId, extraClass = 'icon--sm') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `icon ${extraClass}`);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/assets/icons.svg#${symbolId}`);
    svg.appendChild(use);
    return svg;
  }

  function buildChatUI() {
    if (document.getElementById('habi-chat-drawer')) return;

    // 1. Botón flotante "Pregúntale a Habi"
    fabBtn = document.createElement('button');
    fabBtn.type = 'button';
    fabBtn.id = 'habi-chat-fab';
    fabBtn.className = 'habi-fab';
    fabBtn.setAttribute('aria-haspopup', 'dialog');
    fabBtn.setAttribute('aria-expanded', 'false');
    fabBtn.setAttribute('aria-controls', 'habi-chat-drawer');
    fabBtn.setAttribute('aria-label', 'Abrir chat con Habi, tu asistente inmobiliario');

    const fabBadge = document.createElement('span');
    fabBadge.className = 'habi-fab__badge';
    fabBadge.appendChild(createSvgIcon('icon-habi', 'icon--sm'));

    const fabText = document.createElement('span');
    fabText.textContent = 'Pregúntale a Habi';

    const fabTag = document.createElement('span');
    fabTag.className = 'habi-fab__tag';
    fabTag.textContent = 'IA';

    fabBtn.appendChild(fabBadge);
    fabBtn.appendChild(fabText);
    fabBtn.appendChild(fabTag);

    // 2. Drawer del Chat
    drawerEl = document.createElement('section');
    drawerEl.id = 'habi-chat-drawer';
    drawerEl.className = 'habi-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'false');
    drawerEl.setAttribute('aria-labelledby', 'habi-drawer-title');

    // Header
    const header = document.createElement('div');
    header.className = 'habi-drawer__header';

    const identity = document.createElement('div');
    identity.className = 'habi-drawer__identity';

    const avatar = document.createElement('div');
    avatar.className = 'habi-drawer__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.appendChild(createSvgIcon('icon-habi'));

    const titles = document.createElement('div');
    const titleEl = document.createElement('h2');
    titleEl.id = 'habi-drawer-title';
    titleEl.className = 'habi-drawer__title';
    titleEl.textContent = 'Habi · Asesor Bogotá';

    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'habi-drawer__subtitle';
    subtitleEl.textContent = 'Encuentra el mejor inmueble sin costos ocultos';

    titles.appendChild(titleEl);
    titles.appendChild(subtitleEl);
    identity.appendChild(avatar);
    identity.appendChild(titles);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'habi-drawer__close';
    closeBtn.setAttribute('aria-label', 'Cerrar chat de Habi');
    closeBtn.appendChild(createSvgIcon('icon-close', 'icon--sm'));
    closeBtn.onclick = () => toggleChat(false);

    header.appendChild(identity);
    header.appendChild(closeBtn);

    // Área de mensajes (aria-live polite)
    messagesEl = document.createElement('div');
    messagesEl.className = 'habi-drawer__messages';
    messagesEl.setAttribute('aria-live', 'polite');
    messagesEl.setAttribute('aria-relevant', 'additions');

    // Mensaje de bienvenida + chips de sugerencias rápidas
    appendWelcomeAndSuggestions();

    // Footer con formulario
    const footer = document.createElement('div');
    footer.className = 'habi-drawer__footer';

    const form = document.createElement('form');
    form.className = 'habi-form';
    form.onsubmit = (e) => {
      e.preventDefault();
      submitCurrentInput();
    };

    const inputWrap = document.createElement('div');
    inputWrap.className = 'habi-input-wrap';

    inputEl = document.createElement('textarea');
    inputEl.id = 'habi-chat-input';
    inputEl.className = 'habi-input';
    inputEl.rows = 1;
    inputEl.maxLength = MAX_CHARS;
    inputEl.placeholder = 'Ej: Busco apto pet friendly en Chapinero hasta $2.8M...';
    inputEl.setAttribute('aria-label', 'Escribe tu consulta inmobiliaria para Habi');

    charCounterEl = document.createElement('div');
    charCounterEl.className = 'habi-char-count';
    charCounterEl.textContent = `0/${MAX_CHARS}`;

    inputEl.addEventListener('input', () => {
      const len = inputEl.value.length;
      charCounterEl.textContent = `${len}/${MAX_CHARS}`;
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitCurrentInput();
      }
    });

    inputWrap.appendChild(inputEl);
    inputWrap.appendChild(charCounterEl);

    sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'btn btn--primary habi-send-btn';
    sendBtn.setAttribute('aria-label', 'Enviar mensaje');
    sendBtn.appendChild(createSvgIcon('icon-send', 'icon--sm'));

    form.appendChild(inputWrap);
    form.appendChild(sendBtn);
    footer.appendChild(form);

    drawerEl.appendChild(header);
    drawerEl.appendChild(messagesEl);
    drawerEl.appendChild(footer);

    document.body.appendChild(fabBtn);
    document.body.appendChild(drawerEl);

    fabBtn.onclick = () => toggleChat(!ChatState.isOpen);

    // Cerrar con tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && ChatState.isOpen) {
        toggleChat(false);
      }
    });

    // Sincronizar botones Guardar / Comparar dentro del chat cuando cambie AppState
    subscribeState(() => {
      refreshMiniCardButtons();
    });
  }

  function appendWelcomeAndSuggestions() {
    const welcomeWrap = document.createElement('div');
    welcomeWrap.className = 'habi-msg habi-msg--assistant';

    const bubble = document.createElement('div');
    bubble.className = 'habi-bubble';
    bubble.textContent =
      '¡Hola! Soy Habi, tu asesor en Bogotá. Cuéntame en qué zona buscas, tu presupuesto total (arriendo + administración) y si necesitas mascota o parqueadero.';
    welcomeWrap.appendChild(bubble);

    suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'habi-suggestions';

    SUGGESTION_CHIPS.forEach((chipText) => {
      const chipBtn = document.createElement('button');
      chipBtn.type = 'button';
      chipBtn.className = 'habi-suggestion-chip';
      chipBtn.textContent = chipText;
      chipBtn.onclick = () => {
        sendMessage(chipText);
      };
      suggestionsBox.appendChild(chipBtn);
    });

    welcomeWrap.appendChild(suggestionsBox);
    messagesEl.appendChild(welcomeWrap);
  }

  function toggleChat(open) {
    ChatState.isOpen = open;
    drawerEl.classList.toggle('habi-drawer--open', open);
    fabBtn.setAttribute('aria-expanded', String(open));

    if (open) {
      previousFocus = document.activeElement;
      setTimeout(() => {
        if (inputEl) inputEl.focus();
      }, 60);
      scrollToBottom();
    } else if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  function scrollToBottom() {
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function buildMiniPropertyCard(item) {
    const id = Number(item.id);
    const card = document.createElement('div');
    card.className = 'habi-mini-card';
    card.dataset.habiCardId = String(id);

    const img = document.createElement('img');
    img.className = 'habi-mini-card__img';
    img.src =
      (item.imagenes && item.imagenes[0]) ||
      item.imagen_principal ||
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80';
    img.alt = item.titulo || 'Inmueble en Bogotá';
    img.onerror = () => {
      img.onerror = null;
      img.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80';
    };

    const body = document.createElement('div');
    body.className = 'habi-mini-card__body';

    const title = document.createElement('div');
    title.className = 'habi-mini-card__title';
    title.textContent = item.titulo || 'Inmueble en Bogotá';

    const meta = document.createElement('div');
    meta.className = 'habi-mini-card__meta';
    const cuadras = item.transporte?.distanciaCuadras ?? item.cuadras_transporte;
    meta.textContent = cuadras !== undefined && cuadras !== null
      ? `${item.barrio} · A ${cuadras} c. transporte`
      : `${item.barrio}`;

    const price = document.createElement('div');
    price.className = 'habi-mini-card__price tabular-nums';
    const total = calculateTotalCost(item);
    price.textContent = `${formatCOP(total)}${item.operacion === 'arriendo' ? ' /mes total' : ''}`;

    const actions = document.createElement('div');
    actions.className = 'habi-mini-card__actions';

    const detailLink = document.createElement('a');
    detailLink.href = `/inmueble.html?id=${id}`;
    detailLink.target = '_blank';
    detailLink.rel = 'noopener noreferrer';
    detailLink.className = 'habi-mini-btn habi-mini-btn--primary';
    detailLink.textContent = 'Ver detalle';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'habi-mini-btn';
    saveBtn.dataset.habiSaveId = String(id);
    saveBtn.textContent = AppState.guardados.includes(id) ? 'Guardado ✓' : 'Guardar';
    if (AppState.guardados.includes(id)) saveBtn.classList.add('habi-mini-btn--active');
    saveBtn.onclick = () => toggleSaveProperty(id);

    const compareBtn = document.createElement('button');
    compareBtn.type = 'button';
    compareBtn.className = 'habi-mini-btn';
    compareBtn.dataset.habiCompareId = String(id);
    compareBtn.textContent = AppState.comparador.includes(id) ? 'Comparando ✓' : 'Comparar';
    if (AppState.comparador.includes(id)) compareBtn.classList.add('habi-mini-btn--active');
    compareBtn.onclick = () => toggleCompareProperty(id);

    actions.appendChild(detailLink);
    actions.appendChild(saveBtn);
    actions.appendChild(compareBtn);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);
    return card;
  }

  function refreshMiniCardButtons() {
    if (!messagesEl) return;
    messagesEl.querySelectorAll('[data-habi-save-id]').forEach((btn) => {
      const id = Number(btn.dataset.habiSaveId);
      const saved = AppState.guardados.includes(id);
      btn.textContent = saved ? 'Guardado ✓' : 'Guardar';
      btn.classList.toggle('habi-mini-btn--active', saved);
    });
    messagesEl.querySelectorAll('[data-habi-compare-id]').forEach((btn) => {
      const id = Number(btn.dataset.habiCompareId);
      const comp = AppState.comparador.includes(id);
      btn.textContent = comp ? 'Comparando ✓' : 'Comparar';
      btn.classList.toggle('habi-mini-btn--active', comp);
    });
  }

  function appendUserBubble(text) {
    const wrap = document.createElement('div');
    wrap.className = 'habi-msg habi-msg--user';
    const bubble = document.createElement('div');
    bubble.className = 'habi-bubble';
    bubble.textContent = text; // Seguro contra XSS
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'habi-msg habi-msg--assistant';
    wrap.id = 'habi-typing-indicator';

    const indicator = document.createElement('div');
    indicator.className = 'habi-typing';

    const label = document.createElement('span');
    label.textContent = 'Habi está buscando';

    const d1 = document.createElement('span');
    d1.className = 'habi-typing__dot';
    const d2 = document.createElement('span');
    d2.className = 'habi-typing__dot';
    const d3 = document.createElement('span');
    d3.className = 'habi-typing__dot';

    indicator.appendChild(label);
    indicator.appendChild(d1);
    indicator.appendChild(d2);
    indicator.appendChild(d3);
    wrap.appendChild(indicator);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('habi-typing-indicator');
    if (el) el.remove();
  }

  function applyFiltersFromChat(filtros) {
    const isIndex = Boolean(document.getElementById('results-grid'));
    if (isIndex && typeof applySuggestedFilters === 'function') {
      applySuggestedFilters(filtros);
      const grid = document.getElementById('results-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Filtros sugeridos por Habi aplicados a tu búsqueda');
      return;
    }

    // Si estamos en otra página, navegar al catálogo con los filtros en URL
    const params = buildInmueblesQueryParams(
      {
        operacion: filtros.operacion || 'todos',
        tipo: filtros.tipo || 'todos',
        keyword: filtros.keyword || '',
        precioMin: filtros.precioMin ?? null,
        precioMax: filtros.precioMax ?? null,
        habitacionesMin: filtros.habitacionesMin ?? 0,
        mascotas: Boolean(filtros.mascotas),
        parqueadero: Boolean(filtros.parqueadero),
        balcon: Boolean(filtros.balcon),
        gimnasio: Boolean(filtros.gimnasio),
        piscina: Boolean(filtros.piscina),
        porteria: Boolean(filtros.porteria),
        tour3D: Boolean(filtros.tour3D)
      },
      'costo_asc'
    );
    window.location.href = `/index.html?${params.toString()}`;
  }

  function appendAssistantResponse({ respuesta, inmuebles = [], filtros_sugeridos = {} }) {
    const wrap = document.createElement('div');
    wrap.className = 'habi-msg habi-msg--assistant';

    const bubble = document.createElement('div');
    bubble.className = 'habi-bubble';
    bubble.textContent = respuesta; // Seguro contra XSS
    wrap.appendChild(bubble);

    if (Array.isArray(inmuebles) && inmuebles.length > 0) {
      cacheInmuebles(inmuebles);
      const list = document.createElement('div');
      list.className = 'habi-cards-list';
      inmuebles.forEach((item) => {
        list.appendChild(buildMiniPropertyCard(item));
      });
      wrap.appendChild(list);
    }

    if (filtros_sugeridos && Object.keys(filtros_sugeridos).length > 0) {
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'btn btn--accent habi-apply-filters-btn';
      applyBtn.appendChild(createSvgIcon('icon-filter', 'icon--sm'));
      const btnText = document.createElement('span');
      btnText.textContent = 'Aplicar estos filtros';
      applyBtn.appendChild(btnText);
      applyBtn.onclick = () => applyFiltersFromChat(filtros_sugeridos);
      wrap.appendChild(applyBtn);
    }

    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendErrorMessage(errMsg, messageToRetry) {
    const wrap = document.createElement('div');
    wrap.className = 'habi-msg habi-msg--assistant';

    const box = document.createElement('div');
    box.className = 'habi-error-box';

    const text = document.createElement('span');
    text.textContent = errMsg || 'No pude conectarme en este momento. Verifica tu conexión e inténtalo de nuevo.';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn--secondary';
    retryBtn.style.padding = '5px 10px';
    retryBtn.style.minHeight = '34px';
    retryBtn.style.fontSize = '0.75rem';
    retryBtn.style.alignSelf = 'flex-start';
    retryBtn.appendChild(createSvgIcon('icon-refresh', 'icon--sm'));
    const retrySpan = document.createElement('span');
    retrySpan.textContent = 'Reintentar';
    retryBtn.appendChild(retrySpan);

    retryBtn.onclick = () => {
      wrap.remove();
      sendMessage(messageToRetry, true);
    };

    box.appendChild(text);
    box.appendChild(retryBtn);
    wrap.appendChild(box);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function submitCurrentInput() {
    if (!inputEl || ChatState.isLoading) return;
    const text = inputEl.value.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) {
      showToast(`Tu mensaje no puede superar los ${MAX_CHARS} caracteres.`, 'icon-alert');
      return;
    }
    inputEl.value = '';
    charCounterEl.textContent = `0/${MAX_CHARS}`;
    sendMessage(text);
  }

  async function sendMessage(text, isRetry = false) {
    if (ChatState.isLoading) return;

    const clean = text.trim().slice(0, MAX_CHARS);
    if (!clean) return;

    if (!isRetry) {
      appendUserBubble(clean);
    }

    ChatState.isLoading = true;
    if (sendBtn) sendBtn.disabled = true;
    appendTypingIndicator();

    try {
      const payloadHistorial = ChatState.historial.slice(-10).map((m) => ({
        rol: m.rol,
        contenido: m.contenido
      }));

      const data = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          mensaje: clean,
          historial: payloadHistorial
        })
      });

      removeTypingIndicator();

      ChatState.historial.push({ rol: 'user', contenido: clean });
      ChatState.historial.push({ rol: 'assistant', contenido: data.respuesta });
      if (ChatState.historial.length > 20) {
        ChatState.historial = ChatState.historial.slice(-20);
      }

      appendAssistantResponse(data);
    } catch (err) {
      removeTypingIndicator();
      const friendly = navigator.onLine === false
        ? 'Parece que estás sin conexión a internet.'
        : err.message || 'Ocurrió un problema al consultar a Habi.';
      appendErrorMessage(friendly, clean);
    } finally {
      ChatState.isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl && ChatState.isOpen) inputEl.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildChatUI();
  });
})();
