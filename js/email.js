/**
 * email.js
 * Envío de correo con PDF adjunto usando EmailJS
 * APTIM PERÚ S.A.C.
 *
 * CONFIGURACIÓN REQUERIDA (primera vez):
 * 1. Crear cuenta gratuita en https://www.emailjs.com
 * 2. Crear un "Email Service" (Gmail, Outlook, etc.)
 * 3. Crear un "Email Template" con las variables:
 *    - {{to_email}}       → destinatario
 *    - {{subject}}        → asunto
 *    - {{message}}        → cuerpo HTML
 *    - {{from_name}}      → nombre remitente
 *    - {{attachment}}     → adjunto (PDF en base64)
 * 4. Ingresar los IDs en la sección CONFIGURACIÓN abajo
 */

const Correo = (() => {

  // ─────────────────────────────────────────────
  //  CONFIGURACIÓN EMAILJS
  //  Completar con los datos de su cuenta
  // ─────────────────────────────────────────────
  const CONFIG = {
    publicKey:   localStorage.getItem('ejs_public_key')   || 'TU_PUBLIC_KEY_AQUI',
    serviceId:   localStorage.getItem('ejs_service_id')   || 'TU_SERVICE_ID_AQUI',
    templateId:  localStorage.getItem('ejs_template_id')  || 'TU_TEMPLATE_ID_AQUI',
    fromName:    'APTIM PERÚ - Sistema de Charlas',
  };

  let emailJSCargado = false;

  // ─────────────────────────────────────────────
  //  Cargar EmailJS desde CDN
  // ─────────────────────────────────────────────
  function cargarEmailJS() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        emailjs.init(CONFIG.publicKey);
        emailJSCargado = true;
        resolve();
      };
      script.onerror = () => reject(new Error('No se pudo cargar EmailJS'));
      document.head.appendChild(script);
    });
  }

  // ─────────────────────────────────────────────
  //  Convertir Blob a base64
  // ─────────────────────────────────────────────
  function blobABase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('Error al leer el PDF'));
      reader.readAsDataURL(blob);
    });
  }

  // ─────────────────────────────────────────────
  //  ENVIAR CORREO
  //  Si EmailJS no está configurado, solo descarga
  // ─────────────────────────────────────────────
  async function enviar({ destinatarios, asunto, cuerpo, pdfBlob, nombreArchivo }) {
    // Verificar configuración
    const configurado = CONFIG.publicKey !== 'TU_PUBLIC_KEY_AQUI' &&
                        CONFIG.serviceId !== 'TU_SERVICE_ID_AQUI' &&
                        CONFIG.templateId !== 'TU_TEMPLATE_ID_AQUI';

    if (!configurado) {
      console.warn('EmailJS no está configurado. El PDF se descargará localmente.');
      // Aun así descargar el PDF localmente
      GenerarPDF.descargar(pdfBlob, nombreArchivo || 'charla.pdf');
      throw Object.assign(
        new Error('EmailJS no configurado. PDF descargado localmente.'),
        { tipoPDF: true }
      );
    }

    await cargarEmailJS();
    const pdfBase64 = await blobABase64(pdfBlob);

    // Enviar a cada destinatario
    const promesas = destinatarios.map(correo =>
      emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
        to_email:   correo,
        subject:    asunto,
        message:    cuerpo,
        from_name:  CONFIG.fromName,
        pdf_base64: pdfBase64,
        pdf_nombre: nombreArchivo || 'charla.pdf'
      })
    );

    const resultados = await Promise.allSettled(promesas);
    const errores = resultados
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.text || r.reason?.message || 'Error desconocido');

    if (errores.length === destinatarios.length) {
      throw new Error('No se pudo enviar a ningún destinatario: ' + errores[0]);
    }
    if (errores.length > 0) {
      console.warn('Algunos envíos fallaron:', errores);
    }

    return { enviados: destinatarios.length - errores.length, errores };
  }

  // ─────────────────────────────────────────────
  //  Guardar configuración de EmailJS
  // ─────────────────────────────────────────────
  function guardarConfigEmailJS(publicKey, serviceId, templateId) {
    localStorage.setItem('ejs_public_key',  publicKey);
    localStorage.setItem('ejs_service_id',  serviceId);
    localStorage.setItem('ejs_template_id', templateId);
    CONFIG.publicKey  = publicKey;
    CONFIG.serviceId  = serviceId;
    CONFIG.templateId = templateId;
  }

  function obtenerConfigEmailJS() {
    return {
      publicKey:  CONFIG.publicKey  !== 'TU_PUBLIC_KEY_AQUI'  ? CONFIG.publicKey  : '',
      serviceId:  CONFIG.serviceId  !== 'TU_SERVICE_ID_AQUI'  ? CONFIG.serviceId  : '',
      templateId: CONFIG.templateId !== 'TU_TEMPLATE_ID_AQUI' ? CONFIG.templateId : '',
    };
  }

  function estaConfigurado() {
    return CONFIG.publicKey  !== 'TU_PUBLIC_KEY_AQUI' &&
           CONFIG.serviceId  !== 'TU_SERVICE_ID_AQUI' &&
           CONFIG.templateId !== 'TU_TEMPLATE_ID_AQUI';
  }

  // ─────────────────────────────────────────────
  //  API pública
  // ─────────────────────────────────────────────
  return {
    enviar,
    guardarConfig:   guardarConfigEmailJS,
    obtenerConfig:   obtenerConfigEmailJS,
    estaConfigurado
  };
})();
