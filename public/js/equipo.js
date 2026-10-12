(function () {
  var vistaLogin = document.getElementById('vista-login');
  var vistaPortal = document.getElementById('vista-portal');
  if (!vistaLogin || !vistaPortal) return;

  var ESTADOS = [
    { id: 'pendiente', nombre: 'Pendientes' },
    { id: 'en_curso', nombre: 'En curso' },
    { id: 'hecha', nombre: 'Hechas' },
  ];
  var fmtFecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
  var fmtFechaHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

  function api(url, opciones) {
    opciones = opciones || {};
    if (opciones.body && typeof opciones.body !== 'string') {
      opciones.body = JSON.stringify(opciones.body);
      opciones.headers = { 'Content-Type': 'application/json' };
    }
    if (opciones.method && opciones.method !== 'GET' && !opciones.headers) opciones.headers = { 'Content-Type': 'application/json' };
    return fetch(url, opciones).then(function (r) {
      return r.json().then(function (d) { return { status: r.status, ok: r.ok, d: d }; });
    });
  }
  function el(tag, props, hijos) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'texto') e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    });
    (hijos || []).forEach(function (h) { e.appendChild(h); });
    return e;
  }
  function fechaLocal(iso) {
    var p = iso.split('-');
    return fmtFecha.format(new Date(+p[0], +p[1] - 1, +p[2]));
  }

  function mostrarLogin() {
    vistaPortal.hidden = true;
    vistaLogin.hidden = false;
  }
  function mostrarPortal(usuario) {
    vistaLogin.hidden = true;
    vistaPortal.hidden = false;
    document.getElementById('nombre-usuario').textContent = usuario;
    cargarTareas();
    cargarMensajes();
  }

  // ----- Inicio de sesión -----
  document.getElementById('form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var err = document.getElementById('error-login');
    err.textContent = '';
    api('/api/equipo/login', {
      method: 'POST',
      body: { usuario: document.getElementById('usuario').value, clave: document.getElementById('clave').value },
    }).then(function (r) {
      if (r.ok) {
        document.getElementById('clave').value = '';
        mostrarPortal(r.d.usuario);
      } else err.textContent = r.d.error || 'No pudimos iniciar la sesión.';
    }).catch(function () { err.textContent = 'No pudimos conectarnos con el servidor.'; });
  });

  document.getElementById('salir').addEventListener('click', function () {
    api('/api/equipo/logout', { method: 'POST', body: {} }).then(mostrarLogin);
  });

  // ----- Tareas -----
  var tareas = [];
  function cargarTareas() {
    api('/api/equipo/tareas').then(function (r) {
      if (r.status === 401) return mostrarLogin();
      tareas = r.d.tareas || [];
      dibujarTablero();
    });
  }
  function dibujarTablero() {
    var tablero = document.getElementById('tablero');
    tablero.textContent = '';
    ESTADOS.forEach(function (est, idx) {
      var lista = tareas.filter(function (t) { return t.estado === est.id; });
      var col = el('section', { class: 'columna', 'aria-label': est.nombre }, [
        el('h3', { texto: est.nombre + ' (' + lista.length + ')' }),
      ]);
      if (!lista.length) col.appendChild(el('p', { class: 'nota', texto: 'Sin tareas.' }));
      lista.forEach(function (t) {
        var meta = [];
        if (t.responsable) meta.push('Responsable: ' + t.responsable);
        if (t.vence) meta.push('Vence: ' + fechaLocal(t.vence));
        var acciones = el('div', { class: 'tarea__acciones' });
        if (idx > 0) {
          var atras = el('button', { type: 'button', class: 'mini', texto: '← ' + ESTADOS[idx - 1].nombre.replace(/s$/, '') });
          atras.addEventListener('click', function () { mover(t.id, ESTADOS[idx - 1].id); });
          acciones.appendChild(atras);
        }
        if (idx < ESTADOS.length - 1) {
          var adelante = el('button', { type: 'button', class: 'mini', texto: ESTADOS[idx + 1].nombre.replace(/s$/, '') + ' →' });
          adelante.addEventListener('click', function () { mover(t.id, ESTADOS[idx + 1].id); });
          acciones.appendChild(adelante);
        }
        var borrar = el('button', { type: 'button', class: 'mini mini--peligro', texto: 'Eliminar' });
        borrar.addEventListener('click', function () {
          if (window.confirm('¿Querés eliminar esta tarea?')) eliminar(t.id);
        });
        acciones.appendChild(borrar);
        col.appendChild(el('article', { class: 'tarea' }, [
          el('p', { texto: t.titulo }),
          el('p', { class: 'tarea__meta', texto: meta.join(' · ') }),
          acciones,
        ]));
      });
      tablero.appendChild(col);
    });
  }
  function mover(id, estado) {
    api('/api/equipo/tareas/' + id, { method: 'PATCH', body: { estado: estado } }).then(cargarTareas);
  }
  function eliminar(id) {
    api('/api/equipo/tareas/' + id, { method: 'DELETE' }).then(cargarTareas);
  }
  document.getElementById('form-tarea').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var err = document.getElementById('error-tarea');
    err.textContent = '';
    var titulo = document.getElementById('titulo-tarea');
    api('/api/equipo/tareas', {
      method: 'POST',
      body: {
        titulo: titulo.value,
        responsable: document.getElementById('responsable-tarea').value,
        vence: document.getElementById('vence-tarea').value,
      },
    }).then(function (r) {
      if (r.ok) {
        ev.target.reset();
        cargarTareas();
      } else err.textContent = r.d.error || 'No pudimos crear la tarea.';
    });
  });

  // ----- Mensajes -----
  function cargarMensajes() {
    var cont = document.getElementById('mensajes');
    api('/api/equipo/mensajes').then(function (r) {
      cont.textContent = '';
      var lista = (r.d && r.d.mensajes) || [];
      if (!lista.length) return cont.appendChild(el('p', { texto: 'Todavía no recibimos mensajes.' }));
      lista.forEach(function (m) {
        cont.appendChild(el('article', { class: 'mensaje-recibido' }, [
          el('h3', { texto: m.asunto + ' — ' + m.nombre }),
          el('p', { class: 'tarea__meta', texto: m.email + ' · ' + fmtFechaHora.format(new Date(m.fecha)) }),
          el('p', { texto: m.mensaje }),
        ]));
      });
    });
  }

  // ----- Estado inicial -----
  api('/api/equipo/sesion').then(function (r) {
    if (r.d.autenticado) mostrarPortal(r.d.usuario);
    else mostrarLogin();
  }).catch(mostrarLogin);
})();
