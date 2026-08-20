/**
 * app.js
 * Utilidades compartidas entre todas las páginas
 * APTIM PERÚ S.A.C.
 */

// ─────────────────────────────────────────────
//  Toast global
// ─────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'info', duracion = 3500) {
  const iconos = { exito: '✅', error: '❌', aviso: '⚠️', info: 'ℹ️' };
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = `<span class="toast-icono">${iconos[tipo] || 'ℹ️'}</span><span>${mensaje}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duracion);
}

// ─────────────────────────────────────────────
//  Formateo de fecha
// ─────────────────────────────────────────────
function formatearFecha(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString + (isoString.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatearFechaCorta(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString + (isoString.includes('T') ? '' : 'T00:00:00'));
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return { dia: d.getDate(), mes: meses[d.getMonth()], anio: d.getFullYear() };
}

function formatearHora(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function horaAhora() {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
//  Iniciales de nombre (para avatar)
// ─────────────────────────────────────────────
function iniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return partes[0].substring(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────
//  Leer config de charla desde sessionStorage
// ─────────────────────────────────────────────
function obtenerConfigCharla() {
  const raw = sessionStorage.getItem('charla_config');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function limpiarConfigCharla() {
  sessionStorage.removeItem('charla_config');
  sessionStorage.removeItem('charla_id_activa');
}

// ─────────────────────────────────────────────
//  Validación de correo
// ─────────────────────────────────────────────
function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

// ─────────────────────────────────────────────
//  Número de página del formato (20 por hoja)
// ─────────────────────────────────────────────
function calcularPaginas(totalAsistentes) {
  return Math.ceil(totalAsistentes / 20) || 1;
}

function paginaActual(totalAsistentes) {
  return Math.ceil(totalAsistentes / 20) || 1;
}

// ─────────────────────────────────────────────
//  Generar nombre de archivo PDF
// ─────────────────────────────────────────────
function nombreArchivoPDF(charlaConfig) {
  const fecha = (charlaConfig.fecha || fechaHoy()).replace(/-/g, '');
  const sede  = (charlaConfig.sede || 'SEDE').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
  const hora  = new Date().toTimeString().substring(0, 5).replace(':', '');
  return `Charla_${sede}_${fecha}_${hora}.pdf`;
}

// ─────────────────────────────────────────────
//  Datos fijos de la empresa (para el PDF)
// ─────────────────────────────────────────────
const EMPRESA = {
  razonSocial:    'APTIM PERÚ S.A.C.',
  ruc:            '20601961009',
  domicilio:      'Calle 2 Zona B-1 mz. A1 lt. 2, urb. Las Vertientes de Lurín, Villa el Salvador-Lima-Lima-Perú',
  actividad:      'Actividades de arquitectura e ingeniería y actividades conexas de consultoría técnica',
  numFormato:     'APTIMP-QA-FM-000030',
  revision:       '8',
  fechaAprobacion:'16/06/2026',
  docMatriz:      'APTIMP-HS-PR-501900'
};

window.EMPRESA = EMPRESA;
