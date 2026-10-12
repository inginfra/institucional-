// Prueba de extremo a extremo contra el sitio publicado (Cloudflare Workers + D1).
// Uso (CMD):  set ADMIN_PASSWORD=...  &&  npm run probar:produccion
// Variables:  ADMIN_PASSWORD (obligatoria), URL_SITIO (opcional), ADMIN_USER (opcional, por defecto "equipo").
// Deja en la base un mensaje de contacto marcado como "[PRUEBA AUTOMÁTICA]"; las tareas de prueba se eliminan.

const BASE = (process.env.URL_SITIO || 'https://institucional.infra-ofca.workers.dev').replace(/\/$/, '');
const USUARIO = process.env.ADMIN_USER || 'equipo';
const CLAVE = process.env.ADMIN_PASSWORD;
if (!CLAVE) {
  console.error('Falta ADMIN_PASSWORD. En CMD: set ADMIN_PASSWORD=tu-clave');
  process.exit(2);
}

const JSONH = { 'Content-Type': 'application/json' };
let aprobadas = 0;
const fallas = [];
function comprobar(cond, nombre) {
  if (cond) { aprobadas++; console.log('  OK   ', nombre); }
  else { fallas.push(nombre); console.log('  FALLA', nombre); }
}
const pedir = (ruta, init = {}) => fetch(BASE + ruta, { redirect: 'manual', ...init });

console.log(`Probando ${BASE}\n`);

// Páginas, idioma y cabeceras
for (const ruta of ['/', '/el-observatorio', '/metodologia', '/mapa', '/investigacion', '/contacto', '/privacidad', '/equipo']) {
  const r = await pedir(ruta);
  const html = await r.text();
  comprobar(r.status === 200, `GET ${ruta} responde 200`);
  comprobar(html.includes('<html lang="es-AR">'), `${ruta} declara lang="es-AR"`);
}
const inicio = await pedir('/');
comprobar((inicio.headers.get('content-security-policy') || '').includes("default-src 'self'"), 'cabecera Content-Security-Policy presente');
comprobar(inicio.headers.get('x-content-type-options') === 'nosniff', 'cabecera X-Content-Type-Options presente');
const r404 = await pedir('/ruta-inexistente-prueba');
const t404 = await r404.text();
comprobar(r404.status === 404 && t404.includes('No encontramos la página'), 'página 404 en español');
comprobar(!/stack|at\s+\S+\s+\(|ADMIN_PASSWORD|Error:/i.test(t404), 'la página 404 no expone detalles técnicos');
comprobar((await pedir('/css/styles.css')).status === 200, 'archivo estático /css/styles.css');
comprobar((await pedir('/js/mapa.js')).status === 200, 'archivo estático /js/mapa.js');

// Mapa
const mapa = await (await pedir('/api/mapa')).json();
comprobar(mapa.provincias?.length === 24, 'el mapa devuelve 24 jurisdicciones');
comprobar(mapa.provincias?.every((p) => Object.values(p.valores).every((v) => v >= 0 && v <= 100)), 'valores del mapa entre 0 y 100');

// Formulario de contacto (validación y persistencia)
let r = await pedir('/api/contacto', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: '', email: 'x' }) });
comprobar(r.status === 422, 'contacto inválido devuelve 422');
r = await pedir('/api/contacto', { method: 'POST', headers: JSONH, body: '{no es json' });
const cuerpoMalo = await r.text();
comprobar(r.status === 400 && !/stack|ADMIN_PASSWORD/i.test(cuerpoMalo), 'JSON malformado devuelve 400 sin detalles internos');
const marca = `[PRUEBA AUTOMÁTICA] ${new Date().toISOString()}`;
r = await pedir('/api/contacto', {
  method: 'POST', headers: JSONH,
  body: JSON.stringify({ nombre: 'Prueba Automática', email: 'prueba@example.com', asunto: 'Otro', mensaje: marca, acepto: true }),
});
comprobar(r.status === 201, 'contacto válido devuelve 201 (guardado en D1)');

// Rutas internas protegidas
comprobar((await pedir('/api/equipo/tareas')).status === 401, 'tareas sin sesión devuelve 401');
comprobar((await pedir('/api/equipo/mensajes')).status === 401, 'mensajes sin sesión devuelve 401');
r = await pedir('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: USUARIO, clave: 'clave-incorrecta-prueba' }) });
const malLogin = await r.text();
comprobar(r.status === 401 && !malLogin.includes(CLAVE), 'login con clave incorrecta devuelve 401 y no expone secretos');

// Sesión, tareas y persistencia
r = await pedir('/api/equipo/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ usuario: USUARIO, clave: CLAVE }) });
comprobar(r.status === 200, 'login correcto devuelve 200');
const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
const flags = r.headers.get('set-cookie') || '';
comprobar(/HttpOnly/i.test(flags) && /Secure/i.test(flags) && /SameSite=Strict/i.test(flags), 'cookie de sesión HttpOnly, Secure y SameSite=Strict');
if (r.status === 200 && cookie) {
  const auth = { ...JSONH, Cookie: cookie };
  r = await pedir('/api/equipo/tareas', { method: 'POST', headers: auth, body: JSON.stringify({ titulo: '[PRUEBA] tarea temporal', responsable: 'Prueba', vence: '2026-12-31' }) });
  comprobar(r.status === 201, 'crear tarea');
  const { tarea } = await r.json();
  r = await pedir(`/api/equipo/tareas/${tarea.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ estado: 'en_curso' }) });
  comprobar(r.status === 200, 'mover la tarea a "en curso"');
  const lista = await (await pedir('/api/equipo/tareas', { headers: auth })).json();
  comprobar(lista.tareas.some((t) => t.id === tarea.id && t.estado === 'en_curso'), 'la tarea y su estado persisten en D1');
  const msgs = await (await pedir('/api/equipo/mensajes', { headers: auth })).json();
  comprobar(msgs.mensajes.some((m) => m.mensaje === marca), 'el mensaje de contacto quedó guardado en D1 y se ve en el portal');
  r = await pedir(`/api/equipo/tareas/${tarea.id}`, { method: 'DELETE', headers: auth });
  comprobar(r.status === 200, 'eliminar la tarea de prueba');
  r = await pedir('/api/equipo/logout', { method: 'POST', headers: auth, body: '{}' });
  comprobar(r.status === 200, 'cerrar sesión');
  comprobar((await pedir('/api/equipo/tareas', { headers: auth })).status === 401, 'después de cerrar sesión la ruta interna vuelve a estar protegida');
}

console.log(`\n${aprobadas} aprobadas, ${fallas.length} con falla.`);
if (fallas.length) {
  console.log('Fallas:\n - ' + fallas.join('\n - '));
  process.exit(1);
}
