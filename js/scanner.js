/**
 * scanner.js
 * Lector de código de barras 1D usando la cámara
 * Usa BarcodeDetector nativo (Chrome/Edge moderno)
 * con fallback a detección manual vía canvas
 * APTIM PERÚ S.A.C.
 */

const Scanner = (() => {
  let videoEl      = null;
  let stream       = null;
  let activo       = false;
  let intervalo    = null;
  let onResultado  = null;
  let detector     = null;
  let intentos     = 0;

  // ─────────────────────────────────────────────
  //  Iniciar cámara y escáner
  // ─────────────────────────────────────────────
  async function iniciar(videoId, callback) {
    videoEl     = document.getElementById(videoId);
    onResultado = callback;

    if (!videoEl) throw new Error('Elemento de video no encontrado');

    // Intentar BarcodeDetector nativo
    if ('BarcodeDetector' in window) {
      try {
        detector = new BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'upc_a', 'upc_e'] });
      } catch {
        detector = null;
      }
    }

    // Pedir acceso a la cámara
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // cámara trasera en celular
          width:  { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch (err) {
      // Si falla la trasera, intentar cualquier cámara
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        throw new Error('No se pudo acceder a la cámara. Verifique los permisos.');
      }
    }

    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', true);
    await videoEl.play();
    activo = true;
    intentos = 0;

    // Iniciar bucle de detección
    if (detector) {
      // BarcodeDetector nativo — más rápido
      intervalo = setInterval(detectarNativo, 250);
    } else {
      // Fallback: canvas + análisis básico (solo para entrada manual)
      intervalo = setInterval(detectarFallback, 500);
    }
  }

  // ─────────────────────────────────────────────
  //  Detección con BarcodeDetector nativo
  // ─────────────────────────────────────────────
  async function detectarNativo() {
    if (!activo || !videoEl || videoEl.readyState < 2) return;
    try {
      const codigos = await detector.detect(videoEl);
      if (codigos.length > 0) {
        const valor = codigos[0].rawValue.trim();
        if (valor) {
          manejarResultado(valor);
        }
      }
    } catch { /* ignorar errores de frame */ }
  }

  // ─────────────────────────────────────────────
  //  Fallback canvas (notifica que el escáner está
  //  activo pero la detección no es automática)
  // ─────────────────────────────────────────────
  function detectarFallback() {
    if (!activo) return;
    intentos++;
    // En dispositivos sin BarcodeDetector, el usuario
    // puede usar una pistola USB (que actúa como teclado)
    // o ingresar el DNI manualmente
    actualizarStatusScanner('📷 Cámara activa — use lector USB o ingrese DNI manualmente');
  }

  // ─────────────────────────────────────────────
  //  Manejar resultado detectado
  // ─────────────────────────────────────────────
  let ultimoValor = '';
  let ultimoTiempo = 0;

  function manejarResultado(valor) {
    const ahora = Date.now();
    // Evitar detecciones duplicadas en menos de 2 segundos
    if (valor === ultimoValor && (ahora - ultimoTiempo) < 2000) return;
    ultimoValor  = valor;
    ultimoTiempo = ahora;

    // El código de barras del fotocheck contiene el DNI
    // Limpiar valor: solo dígitos
    const dni = valor.replace(/\D/g, '');
    if (dni.length >= 6 && dni.length <= 12) {
      actualizarStatusScanner('✅ Código detectado: ' + dni);
      if (onResultado) onResultado(dni);
    } else {
      actualizarStatusScanner('⚠️ Código no reconocido: ' + valor);
    }
  }

  // ─────────────────────────────────────────────
  //  Detener escáner
  // ─────────────────────────────────────────────
  function detener() {
    activo = false;
    if (intervalo) { clearInterval(intervalo); intervalo = null; }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) videoEl.srcObject = null;
  }

  // ─────────────────────────────────────────────
  //  Pausa temporal (ej: mientras se muestra modal de firma)
  // ─────────────────────────────────────────────
  function pausar() {
    activo = false;
    if (intervalo) { clearInterval(intervalo); intervalo = null; }
  }

  function reanudar() {
    if (!stream) return;
    activo = true;
    ultimoValor = '';
    if (detector) {
      intervalo = setInterval(detectarNativo, 250);
    } else {
      intervalo = setInterval(detectarFallback, 500);
    }
    actualizarStatusScanner('📷 Apunte el fotocheck a la cámara...');
  }

  // ─────────────────────────────────────────────
  //  Capturar desde pistola USB (teclado)
  //  El lector USB envía el código como si fuera
  //  teclado + Enter. Esta función conecta ese campo.
  // ─────────────────────────────────────────────
  function conectarInputUSB(inputId, callback) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let buffer = '';
    let timer  = null;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = input.value.trim().replace(/\D/g, '');
        if (valor.length >= 6) {
          callback(valor);
          input.value = '';
        }
      }
    });

    // También capturar entrada rápida de pistola (llega en <50ms por carácter)
    document.addEventListener('keypress', (e) => {
      // Solo si el foco no está en otro input/textarea
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      clearTimeout(timer);
      buffer += e.key;
      timer = setTimeout(() => {
        const val = buffer.replace(/\D/g, '');
        if (val.length >= 6 && val.length <= 12) {
          callback(val);
        }
        buffer = '';
      }, 100);
    });
  }

  // ─────────────────────────────────────────────
  //  Helpers de UI
  // ─────────────────────────────────────────────
  function actualizarStatusScanner(texto) {
    const el = document.getElementById('scanner-status');
    if (el) el.textContent = texto;
  }

  function estaActivo() { return activo; }

  function tieneNativo() { return !!detector; }

  // ─────────────────────────────────────────────
  //  API pública
  // ─────────────────────────────────────────────
  return {
    iniciar,
    detener,
    pausar,
    reanudar,
    conectarInputUSB,
    estaActivo,
    tieneNativo
  };
})();
