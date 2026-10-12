(function () {
  var form = document.getElementById('form-contacto');
  if (!form) return;
  var estado = document.getElementById('estado-form');
  var campos = ['nombre', 'email', 'asunto', 'mensaje', 'acepto'];

  function limpiarErrores() {
    campos.forEach(function (c) {
      var e = document.getElementById('error-' + c);
      var i = document.getElementById(c);
      if (e) e.textContent = '';
      if (i) i.removeAttribute('aria-invalid');
    });
  }
  function mostrarErrores(errores) {
    var primero = null;
    campos.forEach(function (c) {
      if (!errores[c]) return;
      var e = document.getElementById('error-' + c);
      var i = document.getElementById(c);
      if (e) e.textContent = errores[c];
      if (i) {
        i.setAttribute('aria-invalid', 'true');
        i.setAttribute('aria-describedby', 'error-' + c);
        if (!primero) primero = i;
      }
    });
    if (primero) primero.focus();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    limpiarErrores();
    estado.className = 'estado';
    estado.textContent = '';
    var cuerpo = {
      nombre: form.nombre.value,
      email: form.email.value,
      asunto: form.asunto.value,
      mensaje: form.mensaje.value,
      sitio: form.sitio.value,
      acepto: form.acepto.checked,
    };
    var errores = {};
    if (cuerpo.nombre.trim().length < 2) errores.nombre = 'Ingresá tu nombre y apellido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cuerpo.email.trim())) errores.email = 'Ingresá un correo electrónico válido.';
    if (!cuerpo.asunto) errores.asunto = 'Elegí el motivo de tu consulta.';
    if (cuerpo.mensaje.trim().length < 10) errores.mensaje = 'Escribí un mensaje de al menos 10 caracteres.';
    if (!cuerpo.acepto) errores.acepto = 'Tenés que aceptar el tratamiento de tus datos personales para continuar.';
    if (Object.keys(errores).length) return mostrarErrores(errores);

    estado.textContent = 'Enviando…';
    fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          estado.className = 'estado estado--ok';
          estado.textContent = r.d.mensaje || 'Recibimos tu mensaje. Te vamos a responder a la brevedad.';
        } else if (r.d.errores) {
          estado.textContent = '';
          mostrarErrores(r.d.errores);
        } else {
          estado.textContent = r.d.error || 'No pudimos enviar tu mensaje. Intentá nuevamente.';
        }
      })
      .catch(function () {
        estado.textContent = 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá nuevamente.';
      });
  });
})();
