// Pruebas del Worker. Ejecutan el código real de src/worker.js en Node (22 o superior)
// contra SQLite en memoria (el mismo motor que D1) con las migraciones reales.
// No reemplazan una prueba en Cloudflare: ver INSTRUCTIVO_CMD.md ("Verificación en Cloudflare").
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const aqui = dirname(fileURLToPath(import.meta.url));

// workerd ofrece crypto.subtle.timingSafeEqual; Node no. Equivalente solo para las pruebas.
import nodeCrypto from 'node:crypto';
if (!crypto.subtle.timingSafeEqual) {
  crypto.subtle.timingSafeEqual = (a, b) => {
    const x = Buffer.from(a), y = Buffer.from(b);
    return x.length === y.length && nodeCrypto.timingSafeEqual(x, y);
  };
}

// Adaptador mínimo con la forma de la API de D1.
function crearD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(join(aqui, 'migrations/0001_inicial.sql'), 'utf8'));
  return {
    prepare(sql) {
      const st = sqlite.prepare(sql);
      const hacer = (args) => ({
        async run() { st.run(...args); return { success: true }; },
        async first() { return st.get(...args) ?? null; },
        async all() { return { results: st.all(...args) }; },
      });
      return { ...hacer([]), bind: (...args) => hacer(args) };
    },
  };
}
const TIPOS = { '.css': 'text/css', '.js': 'text/javascript' };
const ASSETS = {
  async fetch(req) {
    const p = join(aqui, 'public', new URL(req.url).pathname);
    if (!p.startsWith(join(aqui, 'public')) || !existsSync(p)) return new Response('no', { status: 404 });
    return new Response(readFileSync(p), { headers: { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream' } });
  },
};

const { default: worker } = await import('./src/worker.js');
const env = { DB: crearD1(), ASSETS, ADMIN_USER: 'equipo', ADMIN_PASSWORD: 'clave-de-prueba-123' };
const BASE = 'https://observatorio.test';
const llamar = (ruta, init = {}) => worker.fetch(new Request(BASE + ruta, init), env);
const JSONH = { 'Content-Type': 'application/json' };

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓', m); };

try {
  for (const r of ['/', '/el-observatorio', '/metodologia', '/mapa', '/investigacion', '/contacto', '/privacidad', '/equipo']) {
    const res = await llamar(r);
    const html = await res.text();
    ok(res.status === 200, `GET ${r} responde 200`);
    ok(html.includes('<html lang="es-AR">'), `${r} declara lang="es-AR"`);
    ok(html.includes('og:locale" content="es_AR"'), `${r} tiene Open Graph es_AR`);
    ok(res.headers.get('content-security-policy').includes("default-src 'self'"), `${r} envía CSP`);
  }
  const inicio = await (await llamar('/')).text();
  for (const t of ['Inicio', 'El Observatorio', 'Metodología', 'Mapa del Ciberdelito', 'Investigación', 'Contacto'])
    ok(inicio.includes(`>${t}</a>`), `navegación incluye "${t}"`);
  for (const t of ['Explorá el Mapa Federal del Ciberdelito', 'Conocé cómo trabajamos', 'Acceso al equipo',
    '¿Fuiste víctima de una estafa virtual o un ciberdelito? Te orientamos'])
    ok(inicio.includes(t), `texto "${t}" presente`);
  ok((await (await llamar('/investigacion')).text()).includes('Conocé nuestras líneas de investigación') ||
     inicio.includes('Conocé nuestras líneas de investigación'), 'CTA de investigación presente');

  const nf = await llamar('/no-existe');
  ok(nf.status === 404 && (await nf.text()).includes('No encontramos la página'), '404 en español');
  ok((await llamar('/css/styles.css')).status === 200, 'archivo estático /css/styles.css');
  ok((await llamar('/js/mapa.js')).headers.get('x-content-type-options') === 'nosniff', 'estáticos con cabeceras de seguridad');
  ok((await llamar('/salud')).status === 200, '/salud responde');

  const mapa = await (await llamar('/api/mapa')).json();
  ok(mapa.provincias.length === 24, 'el mapa tiene 24 jurisdicciones');
  ok(mapa.provincias.every((p) => Object.values(p.valores).every((v) => v >= 0 && v <= 100)), 'valores del mapa entre 0 y 100');
  ok(mapa.demostracion === true, 'el mapa se declara como datos de demostración');

  let r = await llamar('/api/contacto', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: '', email: 'x' }) });
  ok(r.status === 422, 'contacto inválido devuelve 422');
  ok(/correo electrónico/.test((await r.json()).errores.email), 'errores de validación en español');
  r = await llamar('/api/contacto', { method: 'POST', body: '{}' });
  ok(r.status === 415, 'contacto sin JSON devuelve 415');
  r = await llamar('/api/contacto', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: 'Ana Pérez', email: 'ana@example.com', asunto: 'Prensa', mensaje: 'Hola, quiero consultar un dato.', acepto: true }) });
  ok(r.status === 201, 'contacto válido devuelve 201 y se guarda en la base');

  ok((await llamar('/api/equipo/tareas')).status === 401, 'tareas sin sesión devuelve 401');
  ok((await llamar('/api/equipo/mensajes')).status === 401, 'mensajes sin sesión devuelve 401');
  r = await llamar('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: 'equipo', clave: 'mala' }) });
  ok(r.status === 401, 'login con clave incorrecta devuelve 401');
  r = await llamar('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: 'equipo', clave: 'clave-de-prueba-123' }) });
  ok(r.status === 200, 'login correcto devuelve 200');
  const sc = r.headers.get('set-cookie');
  ok(/HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Strict/.test(sc), 'cookie HttpOnly, Secure y SameSite=Strict');
  const auth = { ...JSONH, Cookie: sc.split(';')[0] };
  ok((await (await llamar('/api/equipo/sesion', { headers: auth })).json()).autenticado === true, 'la sesión se reconoce');
  ok((await (await llamar('/api/equipo/sesion', { headers: { Cookie: 'sid=' + 'a'.repeat(64) } })).json()).autenticado === false, 'token falso no inicia sesión');

  r = await llamar('/api/equipo/tareas', { method: 'POST', headers: auth, body: JSON.stringify({ titulo: 'Revisar fuentes', responsable: 'Equipo de datos', vence: '2026-11-01' }) });
  ok(r.status === 201, 'crear tarea');
  const { tarea } = await r.json();
  r = await llamar(`/api/equipo/tareas/${tarea.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ estado: 'en_curso' }) });
  ok(r.status === 200, 'mover tarea a en curso');
  r = await llamar(`/api/equipo/tareas/${tarea.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ estado: 'invalido' }) });
  ok(r.status === 422, 'estado inválido devuelve 422');
  const lista = await (await llamar('/api/equipo/tareas', { headers: auth })).json();
  ok(lista.tareas.length === 1 && lista.tareas[0].estado === 'en_curso', 'el estado de la tarea persiste');
  const msgs = await (await llamar('/api/equipo/mensajes', { headers: auth })).json();
  ok(msgs.mensajes.length === 1 && msgs.mensajes[0].nombre === 'Ana Pérez', 'el portal lista el mensaje recibido');
  r = await llamar(`/api/equipo/tareas/${tarea.id}`, { method: 'DELETE', headers: auth });
  ok(r.status === 200, 'eliminar tarea');
  ok((await llamar(`/api/equipo/tareas/${tarea.id}`, { method: 'DELETE', headers: auth })).status === 404, 'tarea eliminada devuelve 404');

  r = await llamar('/api/equipo/logout', { method: 'POST', headers: auth, body: '{}' });
  ok(r.status === 200, 'cerrar sesión');
  ok((await llamar('/api/equipo/tareas', { headers: auth })).status === 401, 'la sesión cerrada ya no sirve');

  for (let i = 0; i < 5; i++)
    await llamar('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: 'equipo', clave: 'x' + i }) });
  r = await llamar('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: 'equipo', clave: 'clave-de-prueba-123' }) });
  ok(r.status === 429, 'tras 5 intentos fallidos el login se bloquea (429)');

  const sinSecreto = { ...env, DB: crearD1(), ADMIN_PASSWORD: undefined };
  r = await worker.fetch(new Request(BASE + '/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: 'equipo', clave: '' }) }), sinSecreto);
  ok(r.status === 401, 'sin secreto ADMIN_PASSWORD el acceso queda deshabilitado');

  console.log(`\n${n} comprobaciones correctas.`);
} catch (err) {
  console.error('\nFALLÓ:', err.message);
  process.exit(1);
}
