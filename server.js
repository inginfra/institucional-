'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { render } = require('./views');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC = path.join(__dirname, 'public');
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const MAX_BODY = 32 * 1024;
const SESSION_MS = 8 * 60 * 60 * 1000;

fs.mkdirSync(DATA, { recursive: true });

// ---------- Almacenamiento JSON simple (reemplazable por una base de datos) ----------
function leer(nombre, defecto) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, nombre), 'utf8'));
  } catch {
    return defecto;
  }
}
function guardar(nombre, valor) {
  const destino = path.join(DATA, nombre);
  const tmp = destino + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(valor, null, 2));
  fs.renameSync(tmp, destino);
}

// ---------- Credenciales del equipo ----------
const ADMIN_USER = process.env.ADMIN_USER || 'equipo';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
let claveGenerada = false;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
  claveGenerada = true;
}
const SALT = crypto.randomBytes(16);
const HASH = crypto.scryptSync(ADMIN_PASSWORD, SALT, 32);
const CLAVE_TEMPORAL = claveGenerada ? ADMIN_PASSWORD : null;
ADMIN_PASSWORD = null;

function credencialesValidas(usuario, clave) {
  const h = crypto.scryptSync(String(clave), SALT, 32);
  const okClave = crypto.timingSafeEqual(h, HASH);
  const okUsuario = String(usuario) === ADMIN_USER;
  return okClave && okUsuario;
}

// ---------- Sesiones y límite de intentos ----------
const sesiones = new Map();
const intentos = new Map(); // ip -> {n, hasta}
const envios = new Map(); // ip -> [timestamps]

function ipDe(req) {
  return req.socket.remoteAddress || 'desconocida';
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function sesionDe(req) {
  const t = parseCookies(req).sid;
  const s = t && sesiones.get(t);
  if (!s) return null;
  if (s.exp < Date.now()) {
    sesiones.delete(t);
    return null;
  }
  return { token: t, ...s };
}

// ---------- Datos de demostración del mapa ----------
const PROVINCIAS = [
  ['jujuy', 'Jujuy', 1, 0], ['salta', 'Salta', 2, 0], ['formosa', 'Formosa', 4, 0],
  ['tucuman', 'Tucumán', 2, 1], ['santiago', 'Santiago del Estero', 3, 1], ['chaco', 'Chaco', 4, 1], ['misiones', 'Misiones', 6, 1],
  ['larioja', 'La Rioja', 1, 2], ['catamarca', 'Catamarca', 2, 2], ['santafe', 'Santa Fe', 4, 2], ['corrientes', 'Corrientes', 5, 2],
  ['sanjuan', 'San Juan', 1, 3], ['cordoba', 'Córdoba', 3, 3], ['entrerios', 'Entre Ríos', 5, 3],
  ['mendoza', 'Mendoza', 1, 4], ['sanluis', 'San Luis', 2, 4], ['lapampa', 'La Pampa', 3, 4], ['buenosaires', 'Buenos Aires', 4, 4], ['caba', 'Ciudad Autónoma de Buenos Aires', 5, 4],
  ['neuquen', 'Neuquén', 2, 5], ['rionegro', 'Río Negro', 3, 5],
  ['chubut', 'Chubut', 3, 6], ['santacruz', 'Santa Cruz', 3, 7], ['tierradelfuego', 'Tierra del Fuego', 3, 8],
];
const CATEGORIAS = [
  { id: 'estafas', nombre: 'Estafas virtuales' },
  { id: 'identidad', nombre: 'Suplantación de identidad' },
  { id: 'extorsion', nombre: 'Extorsión digital' },
];
function valorDemo(prov, cat) {
  const h = crypto.createHash('sha256').update(`demo:${prov}:${cat}`).digest();
  return Math.round((h.readUInt16BE(0) / 65535) * 100);
}
function datosMapa() {
  return {
    demostracion: true,
    aviso: 'Datos de demostración: no representan cifras oficiales.',
    categorias: CATEGORIAS,
    provincias: PROVINCIAS.map(([id, nombre, col, fila]) => ({
      id, nombre, col, fila,
      valores: Object.fromEntries(CATEGORIAS.map((c) => [c.id, valorDemo(id, c.id)])),
    })),
  };
}

// ---------- Utilidades HTTP ----------
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const CABECERAS = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

function enviar(res, status, cuerpo, tipo, extra = {}) {
  res.writeHead(status, { 'Content-Type': tipo, ...CABECERAS, ...extra });
  res.end(cuerpo);
}
function json(res, status, obj, extra = {}) {
  enviar(res, status, JSON.stringify(obj), TIPOS['.json'], { 'Cache-Control': 'no-store', ...extra });
}
function leerJSON(req) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json/i.test(req.headers['content-type'] || '')) return reject({ status: 415, msg: 'El contenido debe enviarse como JSON.' });
    let tam = 0;
    const partes = [];
    req.on('data', (c) => {
      tam += c.length;
      if (tam > MAX_BODY) {
        reject({ status: 413, msg: 'El mensaje es demasiado largo.' });
        req.destroy();
      } else partes.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'));
      } catch {
        reject({ status: 400, msg: 'No pudimos interpretar los datos enviados.' });
      }
    });
    req.on('error', () => reject({ status: 400, msg: 'Error al recibir los datos.' }));
  });
}
const limpiar = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

// ---------- API ----------
async function api(req, res, url) {
  const ruta = url.pathname;
  const metodo = req.method;

  if (ruta === '/api/mapa' && metodo === 'GET') return json(res, 200, datosMapa());

  if (ruta === '/api/contacto' && metodo === 'POST') {
    const ip = ipDe(req);
    const ahora = Date.now();
    const recientes = (envios.get(ip) || []).filter((t) => ahora - t < 10 * 60 * 1000);
    if (recientes.length >= 5) return json(res, 429, { ok: false, error: 'Enviaste varios mensajes seguidos. Probá de nuevo en unos minutos.' });
    const b = await leerJSON(req);
    if (b.sitio) return json(res, 200, { ok: true }); // honeypot: se descarta sin avisar
    const errores = {};
    const nombre = limpiar(b.nombre, 120);
    const email = limpiar(b.email, 160);
    const asunto = limpiar(b.asunto, 80);
    const mensaje = limpiar(b.mensaje, 3000);
    if (nombre.length < 2) errores.nombre = 'Ingresá tu nombre y apellido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errores.email = 'Ingresá un correo electrónico válido.';
    if (!asunto) errores.asunto = 'Elegí el motivo de tu consulta.';
    if (mensaje.length < 10) errores.mensaje = 'Escribí un mensaje de al menos 10 caracteres.';
    if (b.acepto !== true) errores.acepto = 'Tenés que aceptar el tratamiento de tus datos personales para continuar.';
    if (Object.keys(errores).length) return json(res, 422, { ok: false, errores });
    const lista = leer('mensajes.json', []);
    lista.push({ id: crypto.randomUUID(), fecha: new Date().toISOString(), nombre, email, asunto, mensaje });
    guardar('mensajes.json', lista);
    recientes.push(ahora);
    envios.set(ip, recientes);
    return json(res, 201, { ok: true, mensaje: 'Recibimos tu mensaje. Te vamos a responder a la brevedad.' });
  }

  if (ruta === '/api/equipo/login' && metodo === 'POST') {
    const ip = ipDe(req);
    const reg = intentos.get(ip);
    if (reg && reg.n >= 5 && reg.hasta > Date.now())
      return json(res, 429, { ok: false, error: 'Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.' });
    const b = await leerJSON(req);
    if (credencialesValidas(limpiar(b.usuario, 80), limpiar(b.clave, 200))) {
      intentos.delete(ip);
      const token = crypto.randomBytes(32).toString('hex');
      sesiones.set(token, { usuario: ADMIN_USER, exp: Date.now() + SESSION_MS });
      const seguro = process.env.COOKIE_SECURE === '1' ? '; Secure' : '';
      return json(res, 200, { ok: true, usuario: ADMIN_USER }, {
        'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${seguro}`,
      });
    }
    const n = (reg && reg.hasta > Date.now() ? reg.n : 0) + 1;
    intentos.set(ip, { n, hasta: Date.now() + 10 * 60 * 1000 });
    return json(res, 401, { ok: false, error: 'Usuario o contraseña incorrectos.' });
  }

  if (ruta.startsWith('/api/equipo/')) {
    const s = sesionDe(req);
    if (ruta === '/api/equipo/sesion' && metodo === 'GET')
      return s ? json(res, 200, { autenticado: true, usuario: s.usuario }) : json(res, 200, { autenticado: false });
    if (!s) return json(res, 401, { ok: false, error: 'Tu sesión no está activa. Ingresá nuevamente.' });

    if (ruta === '/api/equipo/logout' && metodo === 'POST') {
      sesiones.delete(s.token);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (ruta === '/api/equipo/mensajes' && metodo === 'GET')
      return json(res, 200, { mensajes: leer('mensajes.json', []).slice().reverse() });

    if (ruta === '/api/equipo/tareas' && metodo === 'GET') return json(res, 200, { tareas: leer('tareas.json', []) });
    if (ruta === '/api/equipo/tareas' && metodo === 'POST') {
      const b = await leerJSON(req);
      const titulo = limpiar(b.titulo, 160);
      if (!titulo) return json(res, 422, { ok: false, error: 'Escribí un título para la tarea.' });
      const vence = /^\d{4}-\d{2}-\d{2}$/.test(b.vence || '') ? b.vence : '';
      const tarea = { id: crypto.randomUUID(), titulo, responsable: limpiar(b.responsable, 80), vence, estado: 'pendiente', creada: new Date().toISOString() };
      const lista = leer('tareas.json', []);
      lista.push(tarea);
      guardar('tareas.json', lista);
      return json(res, 201, { ok: true, tarea });
    }
    const m = ruta.match(/^\/api\/equipo\/tareas\/([0-9a-f-]{36})$/);
    if (m) {
      const lista = leer('tareas.json', []);
      const i = lista.findIndex((t) => t.id === m[1]);
      if (i < 0) return json(res, 404, { ok: false, error: 'No encontramos esa tarea.' });
      if (metodo === 'PATCH') {
        const b = await leerJSON(req);
        if (!['pendiente', 'en_curso', 'hecha'].includes(b.estado)) return json(res, 422, { ok: false, error: 'Estado de tarea no válido.' });
        lista[i].estado = b.estado;
        guardar('tareas.json', lista);
        return json(res, 200, { ok: true, tarea: lista[i] });
      }
      if (metodo === 'DELETE') {
        lista.splice(i, 1);
        guardar('tareas.json', lista);
        return json(res, 200, { ok: true });
      }
    }
  }
  return json(res, 404, { ok: false, error: 'Recurso no encontrado.' });
}

// ---------- Servidor ----------
function estatico(res, pathname, metodo) {
  const rel = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const archivo = path.join(PUBLIC, rel);
  if (!archivo.startsWith(PUBLIC + path.sep)) return false;
  let st;
  try { st = fs.statSync(archivo); } catch { return false; }
  if (!st.isFile()) return false;
  const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Cache-Control': 'public, max-age=300', ...CABECERAS });
  if (metodo === 'HEAD') res.end();
  else fs.createReadStream(archivo).pipe(res);
  return true;
}

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

    if (pathname.startsWith('/api/')) {
      url.pathname = pathname;
      return await api(req, res, url);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD')
      return enviar(res, 405, 'Método no permitido', TIPOS['.txt'], { Allow: 'GET, HEAD' });

    if (pathname === '/robots.txt')
      return enviar(res, 200, 'User-agent: *\nDisallow: /equipo\nDisallow: /api/\n', TIPOS['.txt']);
    if (pathname === '/salud') return json(res, 200, { ok: true });

    if (estatico(res, pathname, req.method)) return;

    const { status, html } = render(pathname);
    enviar(res, status, req.method === 'HEAD' ? '' : html, TIPOS['.html'], { 'Cache-Control': 'no-cache' });
  } catch (e) {
    if (e && e.status) return json(res, e.status, { ok: false, error: e.msg });
    console.error(e);
    json(res, 500, { ok: false, error: 'Ocurrió un error inesperado. Intentá nuevamente en unos minutos.' });
  }
});

if (require.main === module) {
  servidor.listen(PORT, HOST, () => {
    console.log(`Observatorio del Ciberdelito en http://localhost:${PORT}`);
    console.log(`Acceso al equipo: usuario "${ADMIN_USER}"`);
    if (CLAVE_TEMPORAL)
      console.log(`Contraseña temporal (nueva en cada inicio; definí ADMIN_PASSWORD para fijarla): ${CLAVE_TEMPORAL}`);
  });
}

module.exports = { servidor, ADMIN_USER };
