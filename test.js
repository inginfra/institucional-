'use strict';
// Pruebas de humo: rutas, idioma es-AR, formulario, mapa, sesión y tareas.
const os = require('os');
const fs = require('fs');
const path = require('path');
process.env.ADMIN_PASSWORD = 'clave-de-prueba-123';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-'));
const assert = require('assert');
const { servidor } = require('./server');

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓', m); };

servidor.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const jh = { 'Content-Type': 'application/json' };
  try {
    for (const r of ['/', '/el-observatorio', '/metodologia', '/mapa', '/investigacion', '/contacto', '/privacidad', '/equipo']) {
      const res = await fetch(base + r);
      const html = await res.text();
      ok(res.status === 200, `GET ${r} responde 200`);
      ok(html.includes('<html lang="es-AR">'), `${r} declara lang="es-AR"`);
      ok(html.includes('og:locale" content="es_AR"'), `${r} tiene Open Graph es_AR`);
    }
    const nav = await (await fetch(base + '/')).text();
    for (const t of ['Inicio', 'El Observatorio', 'Metodología', 'Mapa del Ciberdelito', 'Investigación', 'Contacto'])
      ok(nav.includes(`>${t}</a>`), `navegación incluye "${t}"`);
    for (const t of ['Explorá el Mapa Federal del Ciberdelito', 'Conocé cómo trabajamos', 'Conocé nuestras líneas de investigación', 'Acceso al equipo'])
      ok(nav.includes(t), `texto "${t}" presente`);
    ok(nav.includes('¿Fuiste víctima de una estafa virtual o un ciberdelito? Te orientamos'), 'CTA de orientación presente');
    ok((await fetch(base + '/no-existe')).status === 404, '404 en ruta inexistente');
    ok((await (await fetch(base + '/no-existe')).text()).includes('No encontramos la página'), '404 en español');

    const mapa = await (await fetch(base + '/api/mapa')).json();
    ok(mapa.provincias.length === 24, 'el mapa tiene 24 jurisdicciones');
    ok(mapa.demostracion === true, 'el mapa se declara como datos de demostración');

    let r = await fetch(base + '/api/contacto', { method: 'POST', headers: jh, body: JSON.stringify({ nombre: '', email: 'x' }) });
    ok(r.status === 422, 'contacto inválido devuelve 422');
    const e = await r.json();
    ok(e.errores.email && /correo electrónico/.test(e.errores.email), 'errores de validación en español');
    r = await fetch(base + '/api/contacto', { method: 'POST', headers: jh, body: JSON.stringify({ nombre: 'Ana Pérez', email: 'ana@example.com', asunto: 'Prensa', mensaje: 'Hola, quiero consultar un dato.', acepto: true }) });
    ok(r.status === 201, 'contacto válido devuelve 201');

    r = await fetch(base + '/api/equipo/tareas');
    ok(r.status === 401, 'tareas sin sesión devuelve 401');
    r = await fetch(base + '/api/equipo/login', { method: 'POST', headers: jh, body: JSON.stringify({ usuario: 'equipo', clave: 'mala' }) });
    ok(r.status === 401, 'login con clave incorrecta devuelve 401');
    r = await fetch(base + '/api/equipo/login', { method: 'POST', headers: jh, body: JSON.stringify({ usuario: 'equipo', clave: 'clave-de-prueba-123' }) });
    ok(r.status === 200, 'login correcto devuelve 200');
    const cookie = r.headers.get('set-cookie').split(';')[0];
    ok(/HttpOnly/.test(r.headers.get('set-cookie')), 'cookie de sesión HttpOnly');
    const auth = { ...jh, Cookie: cookie };

    r = await fetch(base + '/api/equipo/tareas', { method: 'POST', headers: auth, body: JSON.stringify({ titulo: 'Revisar fuentes', responsable: 'Equipo de datos', vence: '2026-11-01' }) });
    ok(r.status === 201, 'crear tarea');
    const { tarea } = await r.json();
    r = await fetch(base + `/api/equipo/tareas/${tarea.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ estado: 'en_curso' }) });
    ok(r.status === 200, 'mover tarea a en curso');
    const lista = await (await fetch(base + '/api/equipo/tareas', { headers: auth })).json();
    ok(lista.tareas[0].estado === 'en_curso', 'el estado persiste');
    const msgs = await (await fetch(base + '/api/equipo/mensajes', { headers: auth })).json();
    ok(msgs.mensajes.length === 1 && msgs.mensajes[0].nombre === 'Ana Pérez', 'el portal lista el mensaje recibido');
    r = await fetch(base + `/api/equipo/tareas/${tarea.id}`, { method: 'DELETE', headers: auth });
    ok(r.status === 200, 'eliminar tarea');

    r = await fetch(base + '/css/../server.js');
    ok(r.status !== 200 || !(await r.text()).includes('createServer'), 'no se puede salir de /public');
    r = await fetch(base + '/%2e%2e/server.js');
    ok(!(await r.text()).includes('createServer'), 'path traversal codificado bloqueado');

    console.log(`\n${n} comprobaciones correctas.`);
    servidor.close();
    process.exit(0);
  } catch (err) {
    console.error('\nFALLÓ:', err.message);
    servidor.close();
    process.exit(1);
  }
});
