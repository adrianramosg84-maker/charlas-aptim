/**
 * database.js
 * Gestión de base de datos local usando IndexedDB
 * APTIM PERÚ S.A.C. - Sistema de Charlas de 5 Min
 */

const DB_NAME = 'CharlaDB';
const DB_VERSION = 1;
const PASS_EHS = 'aptimehs2024'; // Contraseña acceso EHS (cambiar en producción)

// Lista maestra de personal extraída del Excel
const LISTA_MAESTRA = [
  { item: 1,  dni: '22251089', nombre: 'AVILES SAIRITUPAC MARIO ENRIQUE',         empresa: 'APTIM / SS.GG', cargo: 'Técnico Civil' },
  { item: 2,  dni: '72961092', nombre: 'AYO QUIROZ LUIS FRANCISCO',                empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 3,  dni: '73813476', nombre: 'CAMASCA LEGUA MARIO DANIEL',               empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 4,  dni: '41973165', nombre: 'CAPUÑAY OLIVARES LUIS FELIPE',             empresa: 'APTIM / SS.GG', cargo: 'Op. Compresor' },
  { item: 5,  dni: '41632966', nombre: 'CARBAJAL MONROY CHARLY RICHARD',           empresa: 'APTIM / SS.GG', cargo: 'Técnico de Aislamiento' },
  { item: 6,  dni: '41481611', nombre: 'CARBAJAL QUISPE CHRISTIAN RONALD',         empresa: 'APTIM / SS.GG', cargo: 'Operador de Grúa' },
  { item: 7,  dni: '77163331', nombre: 'CARRASCO HEREDIA BREITMER WILLIAN',        empresa: 'APTIM / SS.GG', cargo: 'Operador Técnico Vertical' },
  { item: 8,  dni: '70258900', nombre: 'CASTILLA CHAVEZ JEFFERSON ALEXANDER',      empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 9,  dni: '40431653', nombre: 'CHACALIAZA ESCALANTE EMIR ALEJANDRO',      empresa: 'APTIM / SS.GG', cargo: 'Técnico Andamiero' },
  { item: 10, dni: '61371235', nombre: 'CHOQUEGONZA SARAVIA BRANDON YERYK',        empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 11, dni: '72702963', nombre: 'CORDERO FLORES JHONATHAN JESUS',           empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 12, dni: '43158633', nombre: 'CORDOVA CASTILLA CARLOS ALBERTO',          empresa: 'APTIM / SS.GG', cargo: 'Líder Técnico de SS.GG.' },
  { item: 13, dni: '44176918', nombre: 'CORDOVA SOTO EBER EDUARDO',                empresa: 'APTIM / SS.GG', cargo: 'Técnico de Aislamiento' },
  { item: 14, dni: '70264012', nombre: 'CORY MORON JHONNY FELIPE',                 empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 15, dni: '70278398', nombre: 'DE LA CRUZ JIMENEZ PEDRO ALBERTO',         empresa: 'APTIM / SS.GG', cargo: 'Pintor' },
  { item: 16, dni: '73486548', nombre: 'DIAZ RODRIGUEZ CRISTHIAN YAHIR',           empresa: 'APTIM / SS.GG', cargo: 'Rigger' },
  { item: 17, dni: '41067603', nombre: 'ECHEVARRIA PRADO WELLDY VLADIMIR',         empresa: 'APTIM / SS.GG', cargo: 'Supervisor Senior de SS.GG.' },
  { item: 18, dni: '45205808', nombre: 'ENRIQUEZ DE LA CRUZ VICTOR JAVIER',        empresa: 'APTIM / SS.GG', cargo: 'Líder Técnico de SS.GG.' },
  { item: 19, dni: '70500210', nombre: 'ESCATE VALDIVIA JORGE ADAN',               empresa: 'APTIM / SS.GG', cargo: 'Ayudante Soldador' },
  { item: 20, dni: '41374224', nombre: 'ESCOBAR ARTEAGA JESUS CIPRIANO',           empresa: 'APTIM / SS.GG', cargo: 'Técnico Civil' },
  { item: 21, dni: '22291613', nombre: 'FAJARDO SIGUAS RICHARD IVAN',              empresa: 'APTIM / SS.GG', cargo: 'Técnico Andamiero' },
  { item: 22, dni: '22313689', nombre: 'FONG NESTAREZ CHRISTIAN ADAN',             empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 23, dni: '44570417', nombre: 'GABRIEL VERGARA JHONNY ALEXANDER',         empresa: 'APTIM / SS.GG', cargo: 'Técnico Civil' },
  { item: 24, dni: '73117927', nombre: 'GUERRA MORALES CARLOS EDUARDO',            empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 25, dni: '72153392', nombre: 'HERNANDEZ CAVERO CARLOS AARON',            empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 26, dni: '70287442', nombre: 'HERRERA CRUZADO JOSEPH GERMAN',            empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 27, dni: '42440811', nombre: 'HERRERA TOMAYRO ALFREDO DARIO',            empresa: 'APTIM / SS.GG', cargo: 'Soldador 6G' },
  { item: 28, dni: '22298176', nombre: 'HUAMAN ORE JULIO CESAR',                   empresa: 'APTIM / SS.GG', cargo: 'Técnico Andamiero' },
  { item: 29, dni: '76430474', nombre: 'JIMENEZ GUERRERO MARCOS OMAR',             empresa: 'APTIM / SS.GG', cargo: 'Operador de Compresora' },
  { item: 30, dni: '70579308', nombre: 'LEGUA FARFAN ALAN OMAR',                   empresa: 'APTIM / SS.GG', cargo: 'Pintor' },
  { item: 31, dni: '43082142', nombre: 'LOPEZ CARDENAS JUAN PABLO',                empresa: 'APTIM / SS.GG', cargo: 'Operador Técnico Vertical' },
  { item: 32, dni: '45837875', nombre: 'MARCOS CAMACHO JOSE ANGEL',                empresa: 'APTIM / SS.GG', cargo: 'Técnico Civil' },
  { item: 33, dni: '72287968', nombre: 'MATOS SALAZAR NILSSON LEONARDO',           empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 34, dni: '72867530', nombre: 'MELGAR SAAVEDRA YUSSEPY JESUS DEMETRIO',   empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 35, dni: '22256008', nombre: 'MENDOZA MALPARTIDA LUIS ALBERTO',          empresa: 'APTIM / SS.GG', cargo: 'Conductor' },
  { item: 36, dni: '22298284', nombre: 'MONROY OLIVARES EDGAR EDMUNDO',            empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 37, dni: '41805006', nombre: 'MOREYRA AVALOS OMAR ANTONIO',              empresa: 'APTIM / SS.GG', cargo: 'Operador de Grúa' },
  { item: 38, dni: '21885568', nombre: 'MOREYRA AVALOS GEORGE',                    empresa: 'APTIM / SS.GG', cargo: 'Rigger' },
  { item: 39, dni: '41459002', nombre: 'MUÑOZ RIVAS EYVER JESUS',                  empresa: 'APTIM / SS.GG', cargo: 'Soldador Estructural' },
  { item: 40, dni: '41788298', nombre: 'NAJARRO VICENTE FREDY',                    empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 41, dni: '70166539', nombre: 'NAVARRO ÑAHUI MIGUEL ANGEL',               empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 42, dni: '40761514', nombre: 'NOA SACCATOMA NILVER',                     empresa: 'APTIM / SS.GG', cargo: 'Técnico Andamiero' },
  { item: 43, dni: '74773284', nombre: 'OLIVARES MORON ROBERTO CARLOS',            empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 44, dni: '40215850', nombre: 'PACHAS CARTAGENA JUAN ALBERTO',            empresa: 'APTIM / SS.GG', cargo: 'Técnico de Aislamiento' },
  { item: 45, dni: '72485373', nombre: 'PADILLA NASCIMENTO RICHARD FABRIZIO',      empresa: 'APTIM / SS.GG', cargo: 'Ayudante Soldador' },
  { item: 46, dni: '21143263', nombre: 'PANDURO PEZO QUILMER',                     empresa: 'APTIM / SS.GG', cargo: 'Técnico Automotriz' },
  { item: 47, dni: '72512793', nombre: 'PANTA CASTILLO JAIRO ALDAIR',              empresa: 'APTIM / SS.GG', cargo: 'Técnico Andamiero' },
  { item: 48, dni: '46100552', nombre: 'PASACHE HUAMANI FRANCISCO ALEXANDER',      empresa: 'APTIM / SS.GG', cargo: 'Líder Técnico de SS.GG.' },
  { item: 49, dni: '70781138', nombre: 'PASACHE MORALES FABRIZIO ALBERTO',         empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 50, dni: '48243005', nombre: 'PECHO SANDOVAL JORGE ANDERSSON',           empresa: 'APTIM / SS.GG', cargo: 'Operador Técnico Vertical' },
  { item: 51, dni: '42058208', nombre: "PEÑA CORDOVA RUBEN ALBERTO JUNIOR'S",      empresa: 'APTIM / SS.GG', cargo: 'Rigger' },
  { item: 52, dni: '22252652', nombre: 'PEÑA ESPINO JUAN CARLOS',                  empresa: 'APTIM / SS.GG', cargo: 'Técnico Metalmecánico' },
  { item: 53, dni: '42637746', nombre: 'PEÑA ROJAS VICTOR',                        empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 54, dni: '75378786', nombre: 'PERALES TAGLE ANGEL ORLANDO',              empresa: 'APTIM / SS.GG', cargo: 'Pintor' },
  { item: 55, dni: '48713624', nombre: 'PEREZ QUISPE LUIS FRANCISCO',              empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Pintura' },
  { item: 56, dni: '72020672', nombre: 'PURILLA BRAVO ADRIAN ALONSO',              empresa: 'APTIM / SS.GG', cargo: 'Ayudante Soldador' },
  { item: 57, dni: '43408716', nombre: 'RAFAELE QUISPE EDGAR',                     empresa: 'APTIM / SS.GG', cargo: 'Pintor' },
  { item: 58, dni: '73022212', nombre: 'RAMIREZ CHACALIAZA EDMILSON',              empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 59, dni: '42717905', nombre: 'RAMOS GARAVITO ADRIAN TRINIDAD',           empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 60, dni: '44629309', nombre: 'RAMOS GUERRA EDGAR ELIAS',                 empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 61, dni: '47130664', nombre: 'RODRIGUEZ FLORES JULIO CESAR',             empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Andamios' },
  { item: 62, dni: '21828856', nombre: 'SALAS YEREN LUIS ALBERTO',                 empresa: 'APTIM / SS.GG', cargo: 'Operador de Brazo Telescópico' },
  { item: 63, dni: '47010809', nombre: 'SARAVIA TIPISIANO MIGUEL',                 empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 64, dni: '21810905', nombre: 'SIFUENTES SOTELO JOSE JAIME',              empresa: 'APTIM / SS.GG', cargo: 'Rigger' },
  { item: 65, dni: '73983093', nombre: 'SOTO URIBE JEFERSON ALFREDO',              empresa: 'APTIM / SS.GG', cargo: 'Ayudante de Pintura' },
  { item: 66, dni: '70165649', nombre: 'TAFUR MELENDEZ LUIS ANGEL',                empresa: 'APTIM / SS.GG', cargo: 'Técnico de Aislamiento' },
  { item: 67, dni: '22289292', nombre: 'TOLEDO GUZMAN MIRIAM MARGOT',              empresa: 'APTIM / SS.GG', cargo: 'Operario de Limpieza Industrial' },
  { item: 68, dni: '71585449', nombre: 'TORRES NAVARRETE MARIA LUISA',             empresa: 'APTIM / SS.GG', cargo: 'Técnico Junior SAP' },
  { item: 69, dni: '22283122', nombre: 'VALENZUELA GUILLEN CONSTANTINO',           empresa: 'APTIM / SS.GG', cargo: 'Operador de Grúa' },
  { item: 70, dni: '73855195', nombre: 'VILCHEZ CANCINO PERCY JOSIMAR',            empresa: 'APTIM / SS.GG', cargo: 'Operador de Hidrolavadora' },
  { item: 71, dni: '40965995', nombre: 'YAÑEZ TIPACTI JOSE WILLIAM',               empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 72, dni: '21868970', nombre: 'YATACO NEIRA JOSE LUIS MANUEL',            empresa: 'APTIM / SS.GG', cargo: 'Pintor / Aislador' },
  { item: 73, dni: '45783040', nombre: 'YUPANQUI CCAULLA FREDY',                   empresa: 'APTIM / SS.GG', cargo: 'Pintor' }
];

// ─────────────────────────────────────────────
//  Inicialización de IndexedDB
// ─────────────────────────────────────────────
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Tabla personal
      if (!db.objectStoreNames.contains('personal')) {
        const store = db.createObjectStore('personal', { keyPath: 'dni' });
        store.createIndex('nombre', 'nombre', { unique: false });
      }

      // Tabla charlas
      if (!db.objectStoreNames.contains('charlas')) {
        const store = db.createObjectStore('charlas', { keyPath: 'id', autoIncrement: true });
        store.createIndex('fecha', 'fecha', { unique: false });
      }

      // Tabla asistencias
      if (!db.objectStoreNames.contains('asistencias')) {
        const store = db.createObjectStore('asistencias', { keyPath: 'id', autoIncrement: true });
        store.createIndex('charlaId', 'charlaId', { unique: false });
        store.createIndex('dni', 'dni', { unique: false });
      }

      // Tabla configuración
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'clave' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ─────────────────────────────────────────────
//  Cargar lista maestra al iniciar
// ─────────────────────────────────────────────
async function inicializarPersonal() {
  const db = await abrirDB();
  const tx = db.transaction('personal', 'readwrite');
  const store = tx.objectStore('personal');

  // Solo inserta si la tabla está vacía
  const count = await new Promise((res, rej) => {
    const r = store.count();
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });

  if (count === 0) {
    for (const p of LISTA_MAESTRA) {
      store.put(p);
    }
    console.log(`Lista maestra cargada: ${LISTA_MAESTRA.length} trabajadores`);
  }

  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror    = () => rej(tx.error);
  });
}

// ─────────────────────────────────────────────
//  PERSONAL — operaciones
// ─────────────────────────────────────────────
async function buscarPorDNI(dni) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('personal', 'readonly');
    const store = tx.objectStore('personal');
    const req   = store.get(String(dni));
    req.onsuccess = () => res(req.result || null);
    req.onerror   = () => rej(req.error);
  });
}

async function buscarPorNombre(texto) {
  const db   = await abrirDB();
  const todos = await obtenerTodoElPersonal();
  const t = texto.toLowerCase().trim();
  return todos.filter(p =>
    p.nombre.toLowerCase().includes(t) ||
    p.dni.includes(t)
  );
}

async function obtenerTodoElPersonal() {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('personal', 'readonly');
    const store = tx.objectStore('personal');
    const req   = store.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function agregarPersonal(trabajador) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('personal', 'readwrite');
    const store = tx.objectStore('personal');
    const req   = store.put(trabajador);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ─────────────────────────────────────────────
//  CHARLAS — operaciones
// ─────────────────────────────────────────────
async function guardarCharla(charla) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('charlas', 'readwrite');
    const store = tx.objectStore('charlas');
    const req   = store.add(charla);
    req.onsuccess = () => res(req.result); // retorna el id generado
    req.onerror   = () => rej(req.error);
  });
}

async function actualizarCharla(charla) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('charlas', 'readwrite');
    const store = tx.objectStore('charlas');
    const req   = store.put(charla);
    req.onsuccess = () => res(true);
    req.onerror   = () => rej(req.error);
  });
}

async function obtenerCharla(id) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('charlas', 'readonly');
    const store = tx.objectStore('charlas');
    const req   = store.get(id);
    req.onsuccess = () => res(req.result || null);
    req.onerror   = () => rej(req.error);
  });
}

async function obtenerTodasLasCharlas() {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('charlas', 'readonly');
    const store = tx.objectStore('charlas');
    const req   = store.getAll();
    req.onsuccess = () => {
      // Ordenar por fecha descendente
      const lista = req.result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      res(lista);
    };
    req.onerror = () => rej(req.error);
  });
}

// ─────────────────────────────────────────────
//  ASISTENCIAS — operaciones
// ─────────────────────────────────────────────
async function registrarAsistencia(asistencia) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('asistencias', 'readwrite');
    const store = tx.objectStore('asistencias');
    const req   = store.add(asistencia);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function obtenerAsistenciasPorCharla(charlaId) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('asistencias', 'readonly');
    const store = tx.objectStore('asistencias');
    const idx   = store.index('charlaId');
    const req   = idx.getAll(charlaId);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function verificarDuplicado(charlaId, dni) {
  const asistencias = await obtenerAsistenciasPorCharla(charlaId);
  return asistencias.some(a => a.dni === String(dni));
}

// ─────────────────────────────────────────────
//  CONFIGURACIÓN — correos con memoria
// ─────────────────────────────────────────────
async function guardarConfig(clave, valor) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    const req   = store.put({ clave, valor });
    req.onsuccess = () => res(true);
    req.onerror   = () => rej(req.error);
  });
}

async function obtenerConfig(clave) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx    = db.transaction('config', 'readonly');
    const store = tx.objectStore('config');
    const req   = store.get(clave);
    req.onsuccess = () => res(req.result ? req.result.valor : null);
    req.onerror   = () => rej(req.error);
  });
}

async function agregarCorreoMemoria(correo) {
  let lista = await obtenerConfig('correos_memoria') || [];
  if (!lista.includes(correo)) {
    lista.unshift(correo);
    if (lista.length > 10) lista = lista.slice(0, 10); // máximo 10 en memoria
    await guardarConfig('correos_memoria', lista);
  }
}

async function obtenerCorreosMemoria() {
  return await obtenerConfig('correos_memoria') || [];
}

// ─────────────────────────────────────────────
//  SEGURIDAD — acceso EHS
// ─────────────────────────────────────────────
function verificarPasswordEHS(pass) {
  // En producción esto debería compararse con un hash almacenado
  const passGuardada = localStorage.getItem('ehs_pass') || PASS_EHS;
  return pass === passGuardada;
}

function cambiarPasswordEHS(passActual, passNueva) {
  if (!verificarPasswordEHS(passActual)) return false;
  localStorage.setItem('ehs_pass', passNueva);
  return true;
}

// ─────────────────────────────────────────────
//  Exportar funciones al scope global
// ─────────────────────────────────────────────
window.DB = {
  inicializar: inicializarPersonal,
  personal: {
    buscarDNI:   buscarPorDNI,
    buscarNombre: buscarPorNombre,
    todos:       obtenerTodoElPersonal,
    agregar:     agregarPersonal
  },
  charlas: {
    guardar:    guardarCharla,
    actualizar: actualizarCharla,
    obtener:    obtenerCharla,
    todas:      obtenerTodasLasCharlas
  },
  asistencias: {
    registrar:      registrarAsistencia,
    porCharla:      obtenerAsistenciasPorCharla,
    esDuplicado:    verificarDuplicado
  },
  config: {
    guardar:          guardarConfig,
    obtener:          obtenerConfig,
    agregarCorreo:    agregarCorreoMemoria,
    correosMemoria:   obtenerCorreosMemoria
  },
  ehs: {
    verificar: verificarPasswordEHS,
    cambiarPass: cambiarPasswordEHS
  }
};
