// Mapa vectorial interactivo de Argentina (24 jurisdicciones). No contiene ni infiere estadísticas:
// solo dibuja geometrías y emite eventos de exploración (resaltar / seleccionar).
import { svg } from './dom.js';

const ETIQUETA_MAPA =
  'Mapa de Argentina con sus 23 provincias y la Ciudad Autónoma de Buenos Aires. Cada jurisdicción es un botón: pasá el cursor o usá Tab para explorar y Enter para seleccionar.';

export function crearMapa(contenedor, geometria, { alSeleccionar, alResaltar, etiquetaJurisdiccion }) {
  const { ancho, alto } = geometria.lienzo;
  const raiz = svg('svg', {
    class: 'mapa-svg', viewBox: `0 0 ${ancho} ${alto}`, role: 'group', 'aria-label': ETIQUETA_MAPA, focusable: 'false',
  });
  const capaBase = svg('g', { class: 'mapa-base' });
  const capaResalte = svg('g', { class: 'mapa-resalte', 'pointer-events': 'none', 'aria-hidden': 'true' });
  const resalteHover = svg('path', { class: 'resalte resalte--hover', d: '', 'fill-rule': 'evenodd' });
  const resalteSel = svg('path', { class: 'resalte resalte--sel', d: '', 'fill-rule': 'evenodd' });
  capaResalte.append(resalteHover, resalteSel);

  const porId = new Map(geometria.jurisdicciones.map((j) => [j.id, j]));
  const elementos = new Map(); // id -> [nodos interactivos]
  let seleccionada = null;
  let resaltada = null;

  function registrar(id, nodo) {
    if (!elementos.has(id)) elementos.set(id, []);
    elementos.get(id).push(nodo);
  }

  function activar(id, nodo, evento) {
    resaltar(id);
    alResaltar(id, nodo, evento);
  }
  function desactivar() {
    resaltar(null);
    alResaltar(null);
  }
  function alternar(id) {
    alSeleccionar(seleccionada === id ? null : id);
  }
  function conectar(nodo, id) {
    nodo.addEventListener('pointerenter', (e) => activar(id, nodo, e));
    nodo.addEventListener('pointermove', (e) => alResaltar(id, nodo, e));
    nodo.addEventListener('pointerleave', desactivar);
    nodo.addEventListener('focus', () => activar(id, nodo, null));
    nodo.addEventListener('blur', desactivar);
    nodo.addEventListener('click', () => alternar(id));
    nodo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(id); }
      else if (e.key === 'Escape') { e.preventDefault(); alSeleccionar(null); }
    });
  }

  for (const j of geometria.jurisdicciones) {
    const p = svg('path', {
      class: 'jur', d: j.d, 'fill-rule': 'evenodd', 'data-id': j.id, tabindex: '0', role: 'button',
      'aria-pressed': 'false', 'aria-label': etiquetaJurisdiccion(j),
    });
    conectar(p, j.id);
    registrar(j.id, p);
    capaBase.append(p);
  }

  // CABA mide pocos píxeles: se agrega una lupa (solo para puntero) que apunta a la misma jurisdicción.
  const caba = porId.get('AR-C');
  const { cx, cy, r } = geometria.lupaCaba;
  const lupa = svg('g', { class: 'jur-lupa', 'data-id': 'AR-C', 'aria-hidden': 'true' });
  const dx = cx - caba.centroide[0];
  const dy = cy - caba.centroide[1];
  const largo = Math.hypot(dx, dy) || 1;
  lupa.append(
    svg('line', { class: 'lupa__guia', x1: caba.centroide[0], y1: caba.centroide[1], x2: cx - (dx / largo) * r, y2: cy - (dy / largo) * r }),
    svg('circle', { class: 'lupa__circulo', cx, cy, r }),
    svg('text', { class: 'lupa__texto', x: cx, y: cy + 3.5, 'text-anchor': 'middle' }, 'CABA'),
    svg('text', { class: 'lupa__nota', x: cx, y: cy + r + 11, 'text-anchor': 'middle' }, 'ampliada')
  );
  lupa.addEventListener('pointerenter', (e) => activar('AR-C', lupa, e));
  lupa.addEventListener('pointermove', (e) => alResaltar('AR-C', lupa, e));
  lupa.addEventListener('pointerleave', desactivar);
  lupa.addEventListener('click', () => alternar('AR-C'));
  registrar('AR-C', lupa);

  raiz.append(capaBase, capaResalte, lupa);
  contenedor.append(raiz);

  function resaltar(id) {
    resaltada = id;
    resalteHover.setAttribute('d', id && porId.has(id) ? porId.get(id).d : '');
    resalteHover.classList.toggle('es-seleccion', Boolean(id) && id === seleccionada);
    lupa.classList.toggle('es-resaltada', id === 'AR-C');
  }
  function seleccionar(id) {
    seleccionada = id && porId.has(id) ? id : null;
    resalteSel.setAttribute('d', seleccionada ? porId.get(seleccionada).d : '');
    for (const [k, nodos] of elementos) {
      for (const n of nodos) {
        if (n.getAttribute('role') === 'button') n.setAttribute('aria-pressed', String(k === seleccionada));
        n.classList.toggle('es-seleccionada', k === seleccionada);
      }
    }
    raiz.classList.toggle('hay-seleccion', Boolean(seleccionada));
    resaltar(resaltada);
  }
  return { raiz, seleccionar, resaltar, enfocar: (id) => elementos.get(id)?.[0]?.focus?.() };
}
