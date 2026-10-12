(function () {
  var contenedor = document.getElementById('mapa');
  var selector = document.getElementById('categoria');
  var detalle = document.getElementById('detalle');
  if (!contenedor || !selector || !detalle) return;

  var datos = null;
  var seleccion = null;

  function color(v) {
    // De celeste claro a azul oscuro según el índice (0-100)
    var l = 92 - (v / 100) * 70;
    var s = 60 + (v / 100) * 10;
    return 'hsl(' + (200 + (v / 100) * 15) + ' ' + s + '% ' + l + '%)';
  }

  function dibujarMapa() {
    var cat = selector.value;
    contenedor.textContent = '';
    var maxFila = 0;
    datos.provincias.forEach(function (p) { if (p.fila > maxFila) maxFila = p.fila; });
    contenedor.style.gridTemplateRows = 'repeat(' + (maxFila + 1) + ', auto)';

    datos.provincias.forEach(function (p) {
      var v = p.valores[cat];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'celda' + (v < 45 ? ' celda--clara' : '');
      b.style.gridColumn = String(p.col + 1);
      b.style.gridRow = String(p.fila + 1);
      b.style.background = color(v);
      b.setAttribute('aria-pressed', String(seleccion === p.id));
      b.setAttribute('aria-label', p.nombre + ': índice ' + v + ' de 100');
      b.title = p.nombre + ' — ' + v;
      b.textContent = p.id === 'caba' ? 'CABA' : p.nombre;
      b.addEventListener('click', function () {
        seleccion = p.id;
        dibujarMapa();
        dibujarDetalle();
      });
      contenedor.appendChild(b);
    });
  }

  function dibujarDetalle() {
    detalle.textContent = '';
    var h = document.createElement('h2');
    h.textContent = 'Detalle';
    detalle.appendChild(h);
    var p = datos.provincias.find(function (x) { return x.id === seleccion; });
    if (!p) {
      var t = document.createElement('p');
      t.textContent = 'Seleccioná una provincia en el mapa.';
      detalle.appendChild(t);
      return;
    }
    var h3 = document.createElement('h3');
    h3.textContent = p.nombre;
    detalle.appendChild(h3);
    datos.categorias.forEach(function (c) {
      var v = p.valores[c.id];
      var lbl = document.createElement('p');
      lbl.textContent = c.nombre + ': ' + v + ' / 100';
      var med = document.createElement('div');
      med.className = 'medidor';
      var barra = document.createElement('span');
      barra.style.width = v + '%';
      med.appendChild(barra);
      detalle.appendChild(lbl);
      detalle.appendChild(med);
    });
    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = datos.aviso;
    detalle.appendChild(nota);
  }

  fetch('/api/mapa')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      datos = d;
      d.categorias.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.nombre;
        selector.appendChild(o);
      });
      selector.addEventListener('change', dibujarMapa);
      dibujarMapa();
    })
    .catch(function () {
      contenedor.textContent = 'No pudimos cargar el mapa. Intentá nuevamente en unos minutos.';
    });
})();
