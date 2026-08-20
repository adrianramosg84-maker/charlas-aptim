/**
 * firma.js
 * Manejo de pad de firma digital y huella (WebAuthn)
 * APTIM PERÚ S.A.C.
 * v2 — firma persistente, no se borra con scroll en móvil
 */

const Firma = (() => {
  const pads = {};

  // ─────────────────────────────────────────────
  //  Inicializar pad de firma
  // ─────────────────────────────────────────────
  function init(canvasId, opciones = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const estado = {
      canvas, ctx,
      dibujando:   false,
      tieneTrazo:  false,
      imagenGuardada: null,          // ← guarda la firma como imagen
      onFirma:   opciones.onFirma   || (() => {}),
      onLimpiar: opciones.onLimpiar || (() => {})
    };
    pads[canvasId] = estado;

    // Ajustar tamaño — NO borrar si ya hay firma guardada
    function ajustarTamaño() {
      const rect = canvas.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      const nuevaAncho  = rect.width  * dpr;
      const nuevaAlto   = (opciones.altura || 120) * dpr;

      // Solo redimensionar si cambió el tamaño
      if (canvas.width !== nuevaAncho || canvas.height !== nuevaAlto) {
        canvas.width  = nuevaAncho;
        canvas.height = nuevaAlto;
        canvas.style.height = (opciones.altura || 120) + 'px';
        ctx.scale(dpr, dpr);
        configurarCtx();

        // Restaurar firma guardada si existía
        if (estado.imagenGuardada) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, opciones.altura || 120);
          img.src = estado.imagenGuardada;
        }
      }
    }

    function configurarCtx() {
      ctx.strokeStyle = '#1a3a5c';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
    }

    ajustarTamaño();
    configurarCtx();

    // Resize observer — más confiable que window resize en móvil
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => ajustarTamaño());
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', ajustarTamaño);
    }

    function getPosicion(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function iniciar(e) {
      e.preventDefault();
      e.stopPropagation();
      estado.dibujando = true;
      configurarCtx();
      const pos = getPosicion(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function dibujar(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!estado.dibujando) return;
      const pos = getPosicion(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      estado.tieneTrazo = true;
    }

    function terminar(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (!estado.dibujando) return;
      estado.dibujando = false;
      if (estado.tieneTrazo) {
        // Guardar imagen inmediatamente para sobrevivir scroll/resize
        estado.imagenGuardada = canvas.toDataURL('image/png');
        estado.onFirma(estado.imagenGuardada);
      }
    }

    // Eventos mouse
    canvas.addEventListener('mousedown',  iniciar,  { passive: false });
    canvas.addEventListener('mousemove',  dibujar,  { passive: false });
    canvas.addEventListener('mouseup',    terminar, { passive: false });
    canvas.addEventListener('mouseleave', terminar, { passive: false });

    // Eventos táctiles — passive:false para prevenir scroll mientras firma
    canvas.addEventListener('touchstart', iniciar,  { passive: false });
    canvas.addEventListener('touchmove',  dibujar,  { passive: false });
    canvas.addEventListener('touchend',   terminar, { passive: false });
    canvas.addEventListener('touchcancel',terminar, { passive: false });
  }

  // ─────────────────────────────────────────────
  //  Limpiar pad
  // ─────────────────────────────────────────────
  function limpiar(canvasId) {
    const estado = pads[canvasId];
    if (!estado) return;
    const { canvas, ctx } = estado;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    estado.tieneTrazo      = false;
    estado.imagenGuardada  = null;
    estado.onLimpiar();
  }

  // ─────────────────────────────────────────────
  //  Obtener dataURL
  // ─────────────────────────────────────────────
  function obtenerDataURL(canvasId) {
    const estado = pads[canvasId];
    if (!estado) return null;
    // Preferir la imagen guardada (más confiable)
    if (estado.imagenGuardada) return estado.imagenGuardada;
    if (!estado.tieneTrazo) return null;
    return estado.canvas.toDataURL('image/png');
  }

  function tieneFirma(canvasId) {
    const estado = pads[canvasId];
    return estado ? (estado.tieneTrazo || !!estado.imagenGuardada) : false;
  }

  function initModal(canvasId, altura, callback) {
    init(canvasId, { altura, onFirma: callback, onLimpiar: () => {} });
  }

  // ─────────────────────────────────────────────
  //  Huella digital — WebAuthn
  // ─────────────────────────────────────────────
  async function registrarHuella(userId) {
    if (!window.PublicKeyCredential) throw new Error('Este dispositivo no soporta autenticación biométrica');
    const disponible = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!disponible) throw new Error('No se detectó sensor biométrico en este dispositivo');
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const opciones = {
      challenge,
      rp: { name: 'APTIM PERU Charlas', id: location.hostname || 'localhost' },
      user: { id: new TextEncoder().encode(String(userId)), name: String(userId), displayName: String(userId) },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none'
    };
    try {
      const credencial = await navigator.credentials.create({ publicKey: opciones });
      const credIds = JSON.parse(localStorage.getItem('credenciales_biom') || '{}');
      credIds[String(userId)] = btoa(String.fromCharCode(...new Uint8Array(credencial.rawId)));
      localStorage.setItem('credenciales_biom', JSON.stringify(credIds));
      return credencial;
    } catch (err) {
      if (err.name === 'NotAllowedError') throw new Error('Registro de huella cancelado');
      throw new Error('Error al registrar huella: ' + err.message);
    }
  }

  async function verificarHuella(userId) {
    if (!window.PublicKeyCredential) throw new Error('Biometría no soportada');
    const credIds = JSON.parse(localStorage.getItem('credenciales_biom') || '{}');
    const credIdB64 = credIds[String(userId)];
    if (!credIdB64) throw new Error('No hay huella registrada para este usuario');
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credIdBytes = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));
    const opciones = { challenge, allowCredentials: [{ id: credIdBytes, type: 'public-key' }], userVerification: 'required', timeout: 60000 };
    try {
      return await navigator.credentials.get({ publicKey: opciones });
    } catch (err) {
      if (err.name === 'NotAllowedError') throw new Error('Verificación cancelada');
      throw new Error('Error al verificar huella: ' + err.message);
    }
  }

  return { init, limpiar, obtenerDataURL, tieneFirma, initModal, registrarHuella, verificarHuella };
})();

const Firma = (() => {
  // Mapa de pads activos: { canvasId -> { canvas, ctx, dibujando, tieneTrazo, callbacks } }
  const pads = {};

  // ─────────────────────────────────────────────
  //  Inicializar un pad de firma
  // ─────────────────────────────────────────────
  function init(canvasId, opciones = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Ajustar resolución para pantallas de alta densidad
    function ajustarTamaño() {
      const rect = canvas.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = (opciones.altura || 120) * dpr;
      canvas.style.height = (opciones.altura || 120) + 'px';
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1a3a5c';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
    }

    ajustarTamaño();
    window.addEventListener('resize', ajustarTamaño);

    const estado = {
      canvas, ctx,
      dibujando: false,
      tieneTrazo: false,
      onFirma:   opciones.onFirma   || (() => {}),
      onLimpiar: opciones.onLimpiar || (() => {})
    };
    pads[canvasId] = estado;

    function getPosicion(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function iniciar(e) {
      e.preventDefault();
      estado.dibujando = true;
      const pos = getPosicion(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function dibujar(e) {
      e.preventDefault();
      if (!estado.dibujando) return;
      const pos = getPosicion(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      estado.tieneTrazo = true;
    }

    function terminar(e) {
      e.preventDefault();
      if (!estado.dibujando) return;
      estado.dibujando = false;
      if (estado.tieneTrazo) {
        const dataURL = canvas.toDataURL('image/png');
        estado.onFirma(dataURL);
      }
    }

    // Eventos mouse
    canvas.addEventListener('mousedown',  iniciar);
    canvas.addEventListener('mousemove',  dibujar);
    canvas.addEventListener('mouseup',    terminar);
    canvas.addEventListener('mouseleave', terminar);

    // Eventos táctiles
    canvas.addEventListener('touchstart', iniciar,   { passive: false });
    canvas.addEventListener('touchmove',  dibujar,   { passive: false });
    canvas.addEventListener('touchend',   terminar,  { passive: false });
  }

  // ─────────────────────────────────────────────
  //  Limpiar un pad
  // ─────────────────────────────────────────────
  function limpiar(canvasId) {
    const estado = pads[canvasId];
    if (!estado) return;
    const { canvas, ctx } = estado;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    estado.tieneTrazo = false;
    estado.onLimpiar();
  }

  // ─────────────────────────────────────────────
  //  Obtener dataURL de un pad
  // ─────────────────────────────────────────────
  function obtenerDataURL(canvasId) {
    const estado = pads[canvasId];
    if (!estado || !estado.tieneTrazo) return null;
    return estado.canvas.toDataURL('image/png');
  }

  function tieneFirma(canvasId) {
    const estado = pads[canvasId];
    return estado ? estado.tieneTrazo : false;
  }

  // ─────────────────────────────────────────────
  //  Crear pad dinámico para modal de trabajador
  // ─────────────────────────────────────────────
  function initModal(canvasId, altura, callback) {
    init(canvasId, {
      altura,
      onFirma: callback,
      onLimpiar: () => {}
    });
  }

  // ─────────────────────────────────────────────
  //  Huella digital — WebAuthn
  // ─────────────────────────────────────────────
  async function registrarHuella(userId) {
    if (!window.PublicKeyCredential) {
      throw new Error('Este dispositivo no soporta autenticación biométrica');
    }

    const disponible = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!disponible) {
      throw new Error('No se detectó sensor biométrico en este dispositivo');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const opciones = {
      challenge,
      rp: { name: 'APTIM PERU Charlas', id: location.hostname || 'localhost' },
      user: {
        id: new TextEncoder().encode(String(userId)),
        name: String(userId),
        displayName: String(userId)
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    };

    try {
      const credencial = await navigator.credentials.create({ publicKey: opciones });
      // Guardar id de credencial en localStorage para verificar después
      const credIds = JSON.parse(localStorage.getItem('credenciales_biom') || '{}');
      credIds[String(userId)] = btoa(String.fromCharCode(...new Uint8Array(credencial.rawId)));
      localStorage.setItem('credenciales_biom', JSON.stringify(credIds));
      return credencial;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Registro de huella cancelado por el usuario');
      }
      throw new Error('Error al registrar huella: ' + err.message);
    }
  }

  async function verificarHuella(userId) {
    if (!window.PublicKeyCredential) {
      throw new Error('Este dispositivo no soporta autenticación biométrica');
    }

    const credIds = JSON.parse(localStorage.getItem('credenciales_biom') || '{}');
    const credIdB64 = credIds[String(userId)];
    if (!credIdB64) {
      throw new Error('No hay huella registrada para este usuario');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credIdBytes = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));

    const opciones = {
      challenge,
      allowCredentials: [{ id: credIdBytes, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000
    };

    try {
      const asercion = await navigator.credentials.get({ publicKey: opciones });
      return asercion;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Verificación de huella cancelada');
      }
      throw new Error('Error al verificar huella: ' + err.message);
    }
  }

  // ─────────────────────────────────────────────
  //  API pública
  // ─────────────────────────────────────────────
  return {
    init,
    limpiar,
    obtenerDataURL,
    tieneFirma,
    initModal,
    registrarHuella,
    verificarHuella
  };
})();
