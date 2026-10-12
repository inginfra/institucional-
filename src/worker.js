// Cloudflare Worker del Observatorio: páginas, API y persistencia en D1.
import { render } from './views.js';

const MAX_BODY = 32 * 1024;
const SESION_SEG = 8 * 60 * 60;
const VENTANA_MS = 10 * 60 * 1000;
const enc = new TextEncoder();

const CABECERAS = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

class ErrorHttp extends Error {
  constructor(status, msg) {
    super(msg);
    this.status = status;
  }
}

// ---------- Respuestas ----------
function responder(cuerpo, status, tipo, extra = {}) {
  return new Response(cuerpo, { status, headers: { 'Content-Type': tipo, ...CABECERAS, ...extra } });
}
function json(obj, status = 200, extra = {}) {
  return responder(JSON.stringify(obj), status, 'application/json; charset=utf-8', { 'Cache-Control': 'no-store', ...extra });
}
async function leerJSON(request) {
  if (!/^application\/json/i.test(request.headers.get('content-type') || ''))
    throw new ErrorHttp(415, 'El contenido debe enviarse como JSON.');
  const texto = await request.text();
  if (enc.encode(texto).length > MAX_BODY) throw new ErrorHttp(413, 'El mensaje es demasiado largo.');
  try {
    return JSON.parse(texto || '{}');
  } catch {
    throw new ErrorHttp(400, 'No pudimos interpretar los datos enviados.');
  }
}
const limpiar = (v, max) =>
  String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

// ---------- Criptografía ----------
async function sha256(texto) {
  return crypto.subtle.digest('SHA-256', enc.encode(String(texto)));
}
async function sha256Hex(texto) {
  return [...new Uint8Array(await sha256(texto))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function credencialesValidas(env, usuario, clave) {
  if (!env.ADMIN_PASSWORD) return false; // sin secreto configurado, el acceso queda deshabilitado
  const [u1, u2, c1, c2] = await Promise.all([
    sha256(usuario), sha256(env.ADMIN_USER || 'equipo'), sha256(clave), sha256(env.ADMIN_PASSWORD),
  ]);
  const okU = crypto.subtle.timingSafeEqual(u1, u2);
  const okC = crypto.subtle.timingSafeEqual(c1, c2);
  return okU && okC;
}

// ---------- Límites de intentos (en D1) ----------
async function limiteExcedido(env, clave, max) {
  const r = await env.DB.prepare('SELECT n, hasta FROM limites WHERE clave = ?').bind(clave).first();
  return Boolean(r && r.hasta > Date.now() && r.n >= max);
}
async function registrarIntento(env, clave) {
  const ahora = Date.now();
  await env.DB.prepare(
    `INSERT INTO limites (clave, n, hasta) VALUES (?1, 1, ?2)
     ON CONFLICT(clave) DO UPDATE SET
       n = CASE WHEN hasta > ?3 THEN n + 1 ELSE 1 END,
       hasta = CASE WHEN hasta > ?3 THEN hasta ELSE ?2 END`
  ).bind(clave, ahora + VENTANA_MS, ahora).run();
}
const ipDe = (request) => request.headers.get('CF-Connecting-IP') || 'local';

// ---------- Sesiones ----------
function cookieDe(request, nombre) {
  for (const parte of (request.headers.get('cookie') || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0 && parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
}
async function sesionDe(env, request) {
  const token = cookieDe(request, 'sid');
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = await sha256Hex(token);
  const s = await env.DB.prepare('SELECT usuario, exp FROM sesiones WHERE token_hash = ?').bind(hash).first();
  if (!s) return null;
  if (s.exp < Date.now()) {
    await env.DB.prepare('DELETE FROM sesiones WHERE token_hash = ?').bind(hash).run();
    return null;
  }
  return { hash, usuario: s.usuario };
}
function cookieSesion(valor, maxAge, seguro) {
  return `sid=${valor}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${seguro ? '; Secure' : ''}`;
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
  let h = 2166136261; // FNV-1a: determinista y sin dependencias
  for (const c of `demo:${prov}:${cat}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 101;
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

// ---------- API ----------
async function api(request, env, url) {
  const ruta = url.pathname;
  const metodo = request.method;

  if (ruta === '/api/mapa' && metodo === 'GET') return json(datosMapa());

  if (ruta === '/api/contacto' && metodo === 'POST') {
    const clave = `contacto:${ipDe(request)}`;
    if (await limiteExcedido(env, clave, 5))
      return json({ ok: false, error: 'Enviaste varios mensajes seguidos. Probá de nuevo en unos minutos.' }, 429);
    const b = await leerJSON(request);
    if (b.sitio) return json({ ok: true }); // trampa antispam: se descarta sin avisar
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
    if (Object.keys(errores).length) return json({ ok: false, errores }, 422);
    await env.DB.prepare('INSERT INTO mensajes (id, fecha, nombre, email, asunto, mensaje) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), new Date().toISOString(), nombre, email, asunto, mensaje).run();
    await registrarIntento(env, clave);
    return json({ ok: true, mensaje: 'Recibimos tu mensaje. Te vamos a responder a la brevedad.' }, 201);
  }

  if (ruta === '/api/equipo/login' && metodo === 'POST') {
    const clave = `login:${ipDe(request)}`;
    if (await limiteExcedido(env, clave, 5))
      return json({ ok: false, error: 'Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.' }, 429);
    const b = await leerJSON(request);
    if (await credencialesValidas(env, limpiar(b.usuario, 80), limpiar(b.clave, 200))) {
      await env.DB.prepare('DELETE FROM limites WHERE clave = ?').bind(clave).run();
      await env.DB.prepare('DELETE FROM sesiones WHERE exp < ?').bind(Date.now()).run();
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
      const usuario = env.ADMIN_USER || 'equipo';
      await env.DB.prepare('INSERT INTO sesiones (token_hash, usuario, exp) VALUES (?, ?, ?)')
        .bind(await sha256Hex(token), usuario, Date.now() + SESION_SEG * 1000).run();
      return json({ ok: true, usuario }, 200, { 'Set-Cookie': cookieSesion(token, SESION_SEG, url.protocol === 'https:') });
    }
    await registrarIntento(env, clave);
    return json({ ok: false, error: 'Usuario o contraseña incorrectos.' }, 401);
  }

  if (ruta.startsWith('/api/equipo/')) {
    const s = await sesionDe(env, request);
    if (ruta === '/api/equipo/sesion' && metodo === 'GET')
      return s ? json({ autenticado: true, usuario: s.usuario }) : json({ autenticado: false });
    if (!s) return json({ ok: false, error: 'Tu sesión no está activa. Ingresá nuevamente.' }, 401);

    if (ruta === '/api/equipo/logout' && metodo === 'POST') {
      await env.DB.prepare('DELETE FROM sesiones WHERE token_hash = ?').bind(s.hash).run();
      return json({ ok: true }, 200, { 'Set-Cookie': cookieSesion('', 0, url.protocol === 'https:') });
    }
    if (ruta === '/api/equipo/mensajes' && metodo === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, fecha, nombre, email, asunto, mensaje FROM mensajes ORDER BY fecha DESC LIMIT 200').all();
      return json({ mensajes: results });
    }
    if (ruta === '/api/equipo/tareas' && metodo === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, titulo, responsable, vence, estado, creada FROM tareas ORDER BY creada ASC').all();
      return json({ tareas: results });
    }
    if (ruta === '/api/equipo/tareas' && metodo === 'POST') {
      const b = await leerJSON(request);
      const titulo = limpiar(b.titulo, 160);
      if (!titulo) return json({ ok: false, error: 'Escribí un título para la tarea.' }, 422);
      const vence = /^\d{4}-\d{2}-\d{2}$/.test(b.vence || '') ? b.vence : '';
      const tarea = { id: crypto.randomUUID(), titulo, responsable: limpiar(b.responsable, 80), vence, estado: 'pendiente', creada: new Date().toISOString() };
      await env.DB.prepare('INSERT INTO tareas (id, titulo, responsable, vence, estado, creada) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(tarea.id, tarea.titulo, tarea.responsable, tarea.vence, tarea.estado, tarea.creada).run();
      return json({ ok: true, tarea }, 201);
    }
    const m = ruta.match(/^\/api\/equipo\/tareas\/([0-9a-f-]{36})$/);
    if (m) {
      const existe = await env.DB.prepare('SELECT id FROM tareas WHERE id = ?').bind(m[1]).first();
      if (!existe) return json({ ok: false, error: 'No encontramos esa tarea.' }, 404);
      if (metodo === 'PATCH') {
        const b = await leerJSON(request);
        if (!['pendiente', 'en_curso', 'hecha'].includes(b.estado)) return json({ ok: false, error: 'Estado de tarea no válido.' }, 422);
        await env.DB.prepare('UPDATE tareas SET estado = ? WHERE id = ?').bind(b.estado, m[1]).run();
        const tarea = await env.DB.prepare('SELECT id, titulo, responsable, vence, estado, creada FROM tareas WHERE id = ?').bind(m[1]).first();
        return json({ ok: true, tarea });
      }
      if (metodo === 'DELETE') {
        await env.DB.prepare('DELETE FROM tareas WHERE id = ?').bind(m[1]).run();
        return json({ ok: true });
      }
    }
  }
  return json({ ok: false, error: 'Recurso no encontrado.' }, 404);
}

// ---------- Punto de entrada ----------
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
      url.pathname = pathname;

      if (pathname.startsWith('/api/')) return await api(request, env, url);

      if (request.method !== 'GET' && request.method !== 'HEAD')
        return responder('Método no permitido', 405, 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });

      if (pathname === '/robots.txt')
        return responder('User-agent: *\nDisallow: /equipo\nDisallow: /api/\n', 200, 'text/plain; charset=utf-8');
      if (pathname === '/salud') return json({ ok: true });

      if (/\.[a-z0-9]+$/i.test(pathname)) {
        const r = await env.ASSETS.fetch(request);
        if (r.status !== 404) {
          const salida = new Response(r.body, r);
          for (const [k, v] of Object.entries(CABECERAS)) salida.headers.set(k, v);
          return salida;
        }
      }

      const { status, html } = render(pathname);
      return responder(request.method === 'HEAD' ? null : html, status, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
    } catch (e) {
      if (e instanceof ErrorHttp) return json({ ok: false, error: e.message }, e.status);
      console.error(e);
      return json({ ok: false, error: 'Ocurrió un error inesperado. Intentá nuevamente en unos minutos.' }, 500);
    }
  },
};
