// Pruebas del Worker (locales, en Node). Ejecutan el código real de src/worker.js en Node (22 o superior)
// contra SQLite en memoria (el mismo motor que D1) con las migraciones reales.
// No reemplazan una prueba en Cloudflare: ver INSTRUCTIVO_CMD.md ("Verificación en Cloudflare").
import assert from 'node:assert';
import { crearEntorno, crearD1 } from './pruebas/soporte.js';

const { llamar, worker, env, BASE } = await crearEntorno();
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
  ok((await llamar('/js/ofca/dashboard.js')).headers.get('x-content-type-options') === 'nosniff', 'estáticos con cabeceras de seguridad');
  ok((await llamar('/salud')).status === 200, '/salud responde');

  // --- Mapa federal y tablero estadístico ---
  const mapa = await (await llamar('/api/mapa')).json();
  ok(mapa.jurisdicciones.length === 24 && new Set(mapa.jurisdicciones).size === 24, '/api/mapa lista 24 jurisdicciones únicas');
  ok(mapa.demostracion === false, '/api/mapa ya no es de demostración');
  ok(mapa.territorial.disponible === false && /no disponibles/i.test(mapa.territorial.estado), '/api/mapa declara que no hay datos territoriales');
  ok(!('provincias' in mapa), '/api/mapa no expone valores por provincia');
  const est = await llamar('/api/estadisticas');
  const dat = await est.json();
  ok(est.status === 200 && dat.total2024.total === 34468, '/api/estadisticas devuelve el total 2024 (34.468)');
  ok(dat.categorias.reduce((s, c) => s + c.total, 0) === dat.total2024.total, 'las categorías suman el total publicado');
  ok(dat.fuente.cita === 'Fuente: UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025.', 'la cita de la fuente es literal');
  ok(Object.keys(dat.territorial.jurisdicciones).length === 0, 'no hay datos territoriales inventados');
  const pm = await (await llamar('/mapa')).text();
  ok(pm.includes('type="module" src="/js/ofca/dashboard.js"'), '/mapa carga el tablero como módulo');
  ok(pm.includes('Fuente: UFECI, Informe 2024') && pm.includes('reportes recibidos por UFECI'), '/mapa muestra la fuente y su alcance');
  ok(pm.includes('no fueron elaborados ni avalados por UFECI'), '/mapa distingue el análisis de OFCA de la autoría de UFECI');
  ok(!/demostraci[oó]n|ilustrativ/i.test(pm), '/mapa ya no dice que son datos de demostración');
  ok(!pm.includes(' style="'), '/mapa no usa atributos style (compatibles con la CSP)');
  ok(pm.includes('Reportes recibidos por UFECI en 2024, por categoría') && pm.includes('34.468'), '/mapa incluye la tabla de respaldo sin JavaScript');
  for (const a of ['/js/ofca/dashboard.js', '/js/ofca/mapa-svg.js', '/css/dashboard.css', '/data/argentina-jurisdicciones.json', '/favicon.svg'])
    ok((await llamar(a)).status === 200, `estático ${a} disponible`);
  const home = await (await llamar('/')).text();
  ok(home.includes('34.468') && home.includes('+21,1'), 'el inicio muestra cifras 2024 con formato es-AR');
  ok(!/ISO\/IEC 27001|revisi[oó]n por pares|OSINT/.test(home + pm + (await (await llamar('/metodologia')).text()) + (await (await llamar('/el-observatorio')).text())), 'sin afirmaciones no verificables (ISO 27001, revisión por pares, OSINT)');
  ok((await (await llamar('/')).text()).includes('no es UFECI'), 'el pie aclara que OFCA no es UFECI ni integra el MPF');

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
