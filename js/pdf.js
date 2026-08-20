/**
 * pdf.js
 * Generación del PDF usando imagen del formato como fondo
 * Replica exacta de APTIMP-QA-FM-000030 Rev.8
 * Usa jsPDF cargado desde CDN (incluido en el HTML que lo invoca)
 * APTIM PERÚ S.A.C.
 */

// jsPDF se carga dinámicamente si no está disponible
const GenerarPDF = (() => {

  // ─────────────────────────────────────────────
  //  Cargar jsPDF desde CDN si no está cargado
  // ─────────────────────────────────────────────
  function cargarJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) { resolve(window.jspdf.jsPDF); return; }
      if (window.jsPDF) { resolve(window.jsPDF); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        const J = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (J) resolve(J); else reject(new Error('jsPDF no se pudo cargar'));
      };
      script.onerror = () => reject(new Error('Error al cargar jsPDF'));
      document.head.appendChild(script);
    });
  }

  // ─────────────────────────────────────────────
  //  Cargar imagen del formato como base64
  // ─────────────────────────────────────────────
  function cargarImagenBase64(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({ dataURL: canvas.toDataURL('image/jpeg', 0.92), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen del formato'));
      img.src = url + '?t=' + Date.now();
    });
  }

  // ─────────────────────────────────────────────
  //  Dimensiones del formato en el PDF (A4 landscape)
  //  A4: 297mm x 210mm
  //  El formato original está en landscape
  // ─────────────────────────────────────────────
  const PDF_W = 297;   // mm ancho  (A4 landscape)
  const PDF_H = 210;   // mm alto   (A4 landscape)

  // Coordenadas de los campos en el PDF (en mm)
  // Calibradas sobre el formato APTIMP-QA-FM-000030
  // Origen (0,0) = esquina superior izquierda de la página
  const COORDS = {
    // Fila revisión / fecha aprobación (fila 2 del Excel)
    revision:        { x: 231, y: 10.5, size: 7 },
    fechaAprobacion: { x: 250, y: 10.5, size: 7 },

    // Datos del empleador (fila 6 Excel)
    nroTrabajadores: { x: 270, y: 38, size: 7 },

    // Datos del entrenamiento (fila 8 Excel)
    sede:   { x: 12,  y: 55, size: 8 },
    fecha:  { x: 68,  y: 55, size: 8 },
    horas:  { x: 120, y: 55, size: 8 },

    // Checkboxes tipo actividad (fila 8 Excel, celdas H-P)
    chkInduccion:   { x: 138, y: 55 },
    chkCapacitacion:{ x: 165, y: 55 },
    chkEntrenamiento:{ x:193, y: 55 },
    chkSimulacro:   { x: 225, y: 55 },
    chkOtros:       { x: 255, y: 55 },
    txtOtros:       { x: 261, y: 55, size: 7 },

    // Tema (fila 9 Excel)
    tema: { x: 12, y: 66, size: 8 },

    // Nombre del capacitador (fila 12 Excel, "Nombre y Firma de capacitador")
    nombreCapacitador: { x: 160, y: 74, size: 7.5 },

    // Firma del capacitador (imagen)
    firmaCapacitador: { x: 210, y: 64, w: 50, h: 16 },

    // Tabla de asistentes — primera fila de datos (fila 14 Excel)
    tablaInicioY: 88,
    tablaAltoFila: 8.5,

    // Columnas de la tabla
    colItem:    { x: 5,   w: 9  },
    colNombre:  { x: 14,  w: 68 },
    colDNI:     { x: 82,  w: 22 },
    colEmpresa: { x: 104, w: 32 },
    colCargo:   { x: 136, w: 34 },
    colFirma:   { x: 170, w: 55 },
    colObs:     { x: 225, w: 35 },  // Observaciones (vacío)

    // Pie de página — registro
    pieNombre:  { x: 12,  y: 195, size: 7 },
    pieCargo:   { x: 70,  y: 195, size: 7 },
    pieFecha:   { x: 120, y: 195, size: 7 },
    piePagina:  { x: 252, y: 200, size: 7 },
  };

  // ─────────────────────────────────────────────
  //  CREAR PDF COMPLETO
  // ─────────────────────────────────────────────
  async function crear(charlaConfig, asistentes) {
    const jsPDF = await cargarJsPDF();

    // Cargar imagen del formato
    let formatoImg = null;
    try {
      formatoImg = await cargarImagenBase64('assets/formato_base.png');
    } catch (e) {
      console.warn('No se pudo cargar imagen del formato, usando diseño básico:', e.message);
    }

    // Calcular número de páginas
    const porPagina   = 20;
    const totalPaginas = Math.ceil(asistentes.length / porPagina) || 1;

    // Crear documento PDF A4 landscape
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');

    for (let pag = 0; pag < totalPaginas; pag++) {
      if (pag > 0) doc.addPage();

      const inicio = pag * porPagina;
      const fin    = Math.min(inicio + porPagina, asistentes.length);
      const asistsPagina = asistentes.slice(inicio, fin);

      // ── Imagen del formato como fondo ──
      if (formatoImg) {
        doc.addImage(formatoImg.dataURL, 'JPEG', 0, 0, PDF_W, PDF_H);
      } else {
        dibujarFormatoBasico(doc);
      }

      // ── Llenar campos del encabezado ──
      llenarEncabezado(doc, charlaConfig, pag + 1, totalPaginas);

      // ── Llenar tabla de asistentes ──
      llenarTabla(doc, asistsPagina, inicio);

      // ── Pie de página ──
      llenarPie(doc, charlaConfig, pag + 1, totalPaginas);
    }

    return doc.output('blob');
  }

  // ─────────────────────────────────────────────
  //  Llenar encabezado del formato
  // ─────────────────────────────────────────────
  function llenarEncabezado(doc, cfg, pagActual, totalPags) {
    doc.setTextColor(30, 30, 30);

    // Sede y fecha
    setTexto(doc, cfg.sede || 'PFLGN - PISCO', COORDS.sede);
    setTexto(doc, formatearFechaPDF(cfg.fecha), COORDS.fecha);
    if (cfg.horas) setTexto(doc, String(cfg.horas), COORDS.horas);

    // Tema (puede ser largo — truncar si es necesario)
    setTexto(doc, (cfg.tema || '').toUpperCase(), COORDS.tema);

    // Tipo de actividad — marcar X en los checkboxes correctos
    const tipos = cfg.tiposActividad || [];
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);

    if (tipos.some(t => t === 'Inducción'))
      doc.text('X', COORDS.chkInduccion.x, COORDS.chkInduccion.y);
    if (tipos.some(t => t === 'Capacitación'))
      doc.text('X', COORDS.chkCapacitacion.x, COORDS.chkCapacitacion.y);
    if (tipos.some(t => t === 'Entrenamiento'))
      doc.text('X', COORDS.chkEntrenamiento.x, COORDS.chkEntrenamiento.y);
    if (tipos.some(t => t === 'Simulacro de Emergencia'))
      doc.text('X', COORDS.chkSimulacro.x, COORDS.chkSimulacro.y);
    if (tipos.some(t => t.startsWith('Otros'))) {
      doc.text('X', COORDS.chkOtros.x, COORDS.chkOtros.y);
      const textoOtros = tipos.find(t => t.startsWith('Otros: '));
      if (textoOtros) {
        doc.setFontSize(COORDS.txtOtros.size);
        doc.text(textoOtros.replace('Otros: ', ''), COORDS.txtOtros.x, COORDS.txtOtros.y);
      }
    }

    // Nombre del capacitador
    doc.setFontSize(COORDS.nombreCapacitador.size);
    doc.text(cfg.capacitador || '', COORDS.nombreCapacitador.x, COORDS.nombreCapacitador.y);

    // Firma del capacitador (imagen PNG/JPG desde dataURL)
    if (cfg.firmaCapacitador &&
        cfg.firmaCapacitador !== '__timestamp__' &&
        cfg.firmaCapacitador !== '__huella__') {
      try {
        const c = COORDS.firmaCapacitador;
        doc.addImage(cfg.firmaCapacitador, 'PNG', c.x, c.y, c.w, c.h);
      } catch { /* ignorar si falla la imagen */ }
    }
  }

  // ─────────────────────────────────────────────
  //  Llenar tabla de asistentes
  // ─────────────────────────────────────────────
  function llenarTabla(doc, asistentes, offsetInicio) {
    doc.setFontSize(7);
    doc.setTextColor(20, 20, 20);

    asistentes.forEach((a, i) => {
      const y = COORDS.tablaInicioY + (i * COORDS.tablaAltoFila) + 5.5;

      // Número de orden
      doc.setFontSize(7);
      doc.text(String(a.orden), COORDS.colItem.x + 2, y);

      // Apellidos y Nombres (truncar si es muy largo)
      const nombre = truncar(a.nombre || '', 38);
      doc.setFontSize(7);
      doc.text(nombre, COORDS.colNombre.x + 1, y);

      // DNI
      doc.text(String(a.dni || ''), COORDS.colDNI.x + 1, y);

      // Empresa/Área
      const empresa = truncar(a.empresa || 'APTIM / SS.GG', 18);
      doc.text(empresa, COORDS.colEmpresa.x + 1, y);

      // Cargo
      const cargo = truncar(a.cargo || '', 20);
      doc.text(cargo, COORDS.colCargo.x + 1, y);

      // Firma del trabajador
      if (a.firma && a.firma !== '__timestamp__' && a.firma !== '__huella__') {
        try {
          const fw = COORDS.colFirma.w - 4;
          const fh = COORDS.tablaAltoFila - 1.5;
          const fx = COORDS.colFirma.x + 2;
          const fy = y - fh + 1.5;
          doc.addImage(a.firma, 'PNG', fx, fy, fw, fh);
        } catch { /* ignorar */ }
      } else if (a.firma === '__timestamp__') {
        doc.setFontSize(5.5);
        doc.setTextColor(100, 100, 100);
        doc.text(formatearHoraPDF(a.horaRegistro), COORDS.colFirma.x + 2, y);
        doc.setTextColor(20, 20, 20);
      } else if (a.firma === '__huella__') {
        doc.setFontSize(6);
        doc.text('HUELLA DIGITAL', COORDS.colFirma.x + 4, y);
      }
    });
  }

  // ─────────────────────────────────────────────
  //  Llenar pie de página
  // ─────────────────────────────────────────────
  function llenarPie(doc, cfg, pagActual, totalPags) {
    doc.setFontSize(COORDS.piePagina.size);
    doc.setTextColor(30, 30, 30);

    // Fecha en el registro
    setTexto(doc, formatearFechaPDF(cfg.fecha), COORDS.pieFecha);

    // Paginación
    doc.text(
      `Página ${pagActual} de ${totalPags}`,
      COORDS.piePagina.x, COORDS.piePagina.y
    );
  }

  // ─────────────────────────────────────────────
  //  Formato de respaldo (sin imagen)
  //  Se usa solo si no se puede cargar la imagen
  // ─────────────────────────────────────────────
  function dibujarFormatoBasico(doc) {
    // Borde exterior
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(3, 3, PDF_W - 6, PDF_H - 6);

    // Título
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO DE INDUCCIÓN, CAPACITACIÓN, ENTRENAMIENTO Y SIMULACROS DE EMERGENCIA', PDF_W/2, 12, { align: 'center' });

    // Datos del empleador
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('APTIM PERÚ S.A.C.', 10, 22);
    doc.text('RUC: 20601961009', 80, 22);

    // Líneas de la tabla
    const startY = 88;
    const rowH   = 8.5;
    doc.setLineWidth(0.2);
    // Cabecera tabla
    ['#', 'APELLIDOS Y NOMBRES', 'DNI', 'EMPRESA/ÁREA', 'CARGO', 'FIRMA', 'OBSERVACIONES'].forEach((h, i) => {
      const xs = [COORDS.colItem.x, COORDS.colNombre.x, COORDS.colDNI.x, COORDS.colEmpresa.x, COORDS.colCargo.x, COORDS.colFirma.x, COORDS.colObs.x];
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(h, xs[i] + 1, startY - 2);
    });

    // Filas vacías (20)
    for (let i = 0; i < 20; i++) {
      const y = startY + (i * rowH);
      doc.line(3, y, PDF_W - 3, y);
    }
    doc.line(3, startY + 20 * rowH, PDF_W - 3, startY + 20 * rowH);

    // Columnas verticales
    [COORDS.colItem.x, COORDS.colNombre.x, COORDS.colDNI.x, COORDS.colEmpresa.x,
     COORDS.colCargo.x, COORDS.colFirma.x, COORDS.colObs.x, PDF_W - 3].forEach(x => {
      doc.line(x, startY - 6, x, startY + 20 * rowH);
    });
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  function setTexto(doc, texto, coord) {
    if (!texto) return;
    doc.setFontSize(coord.size || 8);
    doc.text(String(texto), coord.x, coord.y);
  }

  function truncar(texto, maxChars) {
    if (!texto) return '';
    return texto.length > maxChars ? texto.substring(0, maxChars - 1) + '…' : texto;
  }

  function formatearFechaPDF(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function formatearHoraPDF(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  // ─────────────────────────────────────────────
  //  Descargar el PDF en el dispositivo
  // ─────────────────────────────────────────────
  function descargar(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // ─────────────────────────────────────────────
  //  API pública
  // ─────────────────────────────────────────────
  return { crear, descargar };
})();
