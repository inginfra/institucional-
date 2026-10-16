// Gráficos SVG/HTML sin dependencias. Todos reciben valores YA calculados y mantienen teclado, tooltip y etiquetas.
import { el, svg, vaciar } from './dom.js';
import { escalaY } from './formato.js';

/** Barras horizontales (HTML): cada fila es un botón nativo, accesible por teclado. */
export function barrasHorizontales(contenedor, items, { ariaLabel, alElegir, tooltip, animar = false }) {
  vaciar(contenedor);
  const hayElegida = items.some((i) => i.elegida);
  const lista = el('ul', { class: 'barras', role: 'list', 'aria-label': ariaLabel });
  for (const it of items) {
    const relleno = el('span', { class: `barra__relleno ${it.claseColor || ''}${animar ? ' barra__relleno--entra' : ''}` });
    relleno.style.width = `${Math.max(0, Math.min(1, it.proporcion)) * 100}%`;
    const boton = el(
      alElegir ? 'button' : 'div',
      {
        class: `barra${it.elegida ? ' es-elegida' : ''}${hayElegida && !it.elegida ? ' es-atenuada' : ''}`,
        type: alElegir ? 'button' : false,
        'aria-pressed': alElegir ? String(Boolean(it.elegida)) : false,
        'data-id': it.id,
      },
      el('span', { class: 'barra__etiqueta', texto: it.etiqueta }),
      el('span', { class: 'barra__pista' }, relleno),
      el('span', { class: 'barra__valor' }, el('strong', { texto: it.textoValor }), it.textoSecundario ? el('small', { texto: it.textoSecundario }) : null)
    );
    if (tooltip && it.tooltip) {
      const mostrar = (e) => tooltip.mostrar(it.tooltip, e.clientX, e.clientY);
      boton.addEventListener('pointerenter', mostrar);
      boton.addEventListener('pointermove', (e) => tooltip.mover(e.clientX, e.clientY));
      boton.addEventListener('pointerleave', () => tooltip.ocultar());
      boton.addEventListener('focus', () => tooltip.mostrarSobre(boton, it.tooltip));
      boton.addEventListener('blur', () => tooltip.ocultar());
    }
    if (alElegir) boton.addEventListener('click', () => alElegir(it.id));
    lista.append(el('li', {}, boton));
  }
  contenedor.append(lista);
}

function ejeY(minimo, maximo) {
  if (minimo >= 0) return escalaY(maximo);
  const positivo = escalaY(Math.max(maximo, 0.0001));
  const paso = positivo.paso;
  const min = Math.floor(minimo / paso) * paso;
  const marcas = [];
  for (let v = min; v <= positivo.max + paso / 1000; v += paso) marcas.push(Math.round(v * 1000) / 1000);
  return { max: positivo.max, min, paso, marcas };
}

/** Líneas con área opcional. Una banda enfocable por cada punto del eje X (flechas ← → para recorrer). */
export function lineas(contenedor, { series, etiquetasX, formatoY, ariaLabel, tooltipEn, tooltip, indicePico = null, etiquetaPico = '' }) {
  vaciar(contenedor);
  const W = 640, H = 300, L = 58, R = 18, T = 26, B = 34;
  const n = etiquetasX.length;
  const todos = series.flatMap((s) => s.valores);
  const eje = escalaY(Math.max(...todos));
  const x = (i) => L + (i * (W - L - R)) / (n - 1);
  const y = (v) => T + (1 - v / eje.max) * (H - T - B);
  const raiz = svg('svg', { class: 'grafico-svg', viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': ariaLabel, focusable: 'false' });

  for (const m of eje.marcas) {
    raiz.append(
      svg('line', { class: 'eje-grilla', x1: L, x2: W - R, y1: y(m), y2: y(m) }),
      svg('text', { class: 'eje-texto', x: L - 8, y: y(m) + 4, 'text-anchor': 'end' }, formatoY(m))
    );
  }
  etiquetasX.forEach((e, i) => raiz.append(svg('text', { class: 'eje-texto', x: x(i), y: H - 10, 'text-anchor': 'middle' }, e)));

  const guia = svg('line', { class: 'guia', x1: 0, x2: 0, y1: T, y2: H - B, visibility: 'hidden' });
  raiz.append(guia);

  series.forEach((s, k) => {
    const d = s.valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
    if (s.area) raiz.append(svg('path', { class: `serie-area ${s.claseColor}`, d: `${d}L${x(n - 1).toFixed(1)} ${y(0)}L${x(0).toFixed(1)} ${y(0)}Z` }));
    raiz.append(svg('path', { class: `serie-linea ${s.claseColor}${s.discontinua ? ' es-discontinua' : ''}`, d, fill: 'none', 'data-serie': k }));
  });
  const puntos = series.map((s, k) => s.valores.map((v, i) =>
    svg('circle', { class: `serie-punto ${s.claseColor}${s.discontinua ? ' es-discontinua' : ''}`, cx: x(i), cy: y(v), r: 3.4, 'data-serie': k, 'data-i': i })));
  puntos.flat().forEach((p) => raiz.append(p));

  if (indicePico !== null) {
    const px = x(indicePico), py = y(series[0].valores[indicePico]);
    const ancla = px > W - 120 ? 'end' : px < L + 80 ? 'start' : 'middle';
    raiz.append(svg('text', { class: 'pico-texto', x: px, y: py - 10, 'text-anchor': ancla }, etiquetaPico));
  }

  // Bandas de interacción (una por punto del eje X).
  const ancho = (W - L - R) / (n - 1);
  const bandas = [];
  for (let i = 0; i < n; i++) {
    const b = svg('rect', {
      class: 'banda', x: Math.max(L - ancho / 2 + i * ancho, 0), y: T - 8, width: i === 0 || i === n - 1 ? ancho / 2 + 2 : ancho, height: H - T - B + 8,
      tabindex: i === 0 ? '0' : '-1', role: 'img', 'aria-label': tooltipEn(i).resumen,
    });
    if (i === 0) b.setAttribute('x', String(L - 2));
    bandas.push(b);
    raiz.append(b);
  }
  function activar(i, desdeTeclado, e) {
    guia.setAttribute('x1', x(i)); guia.setAttribute('x2', x(i)); guia.setAttribute('visibility', 'visible');
    puntos.flat().forEach((p) => p.classList.toggle('es-activo', Number(p.getAttribute('data-i')) === i));
    if (tooltip) {
      if (desdeTeclado || !e) tooltip.mostrarSobre(bandas[i], tooltipEn(i));
      else tooltip.mostrar(tooltipEn(i), e.clientX, e.clientY);
    }
  }
  function apagar() {
    guia.setAttribute('visibility', 'hidden');
    puntos.flat().forEach((p) => p.classList.remove('es-activo'));
    if (tooltip) tooltip.ocultar();
  }
  bandas.forEach((b, i) => {
    b.addEventListener('pointerenter', (e) => activar(i, false, e));
    b.addEventListener('pointermove', (e) => { if (tooltip) tooltip.mover(e.clientX, e.clientY); });
    b.addEventListener('pointerleave', apagar);
    b.addEventListener('focus', () => activar(i, true));
    b.addEventListener('blur', apagar);
    b.addEventListener('keydown', (e) => {
      const mover = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (mover === undefined) return;
      e.preventDefault();
      const j = Math.max(0, Math.min(n - 1, mover));
      bandas.forEach((o, k) => o.setAttribute('tabindex', k === j ? '0' : '-1'));
      bandas[j].focus();
    });
  });
  contenedor.append(raiz);
}

/** Columnas verticales con línea base en cero (admite valores negativos y nulos = «sin dato»). */
export function columnas(contenedor, items, { ariaLabel, formatoY, tooltip, alto = 280, compacto = false }) {
  vaciar(contenedor);
  const W = 640, H = alto, L = compacto ? 40 : 58, R = 14, T = 28, B = 36;
  const valores = items.map((i) => i.valor).filter((v) => v !== null);
  const eje = ejeY(Math.min(0, ...valores), Math.max(...valores, 0.0001));
  const min = eje.min ?? 0;
  const y = (v) => T + (1 - (v - min) / (eje.max - min)) * (H - T - B);
  const raiz = svg('svg', { class: `grafico-svg${compacto ? ' grafico-svg--compacto' : ''}`, viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': ariaLabel, focusable: 'false' });
  for (const m of eje.marcas) {
    raiz.append(
      svg('line', { class: `eje-grilla${m === 0 ? ' eje-cero' : ''}`, x1: L, x2: W - R, y1: y(m), y2: y(m) }),
      svg('text', { class: 'eje-texto', x: L - 8, y: y(m) + 4, 'text-anchor': 'end' }, formatoY(m))
    );
  }
  const paso = (W - L - R) / items.length;
  const anchoCol = Math.min(compacto ? 26 : 84, paso * 0.62);
  items.forEach((it, i) => {
    const cx = L + paso * i + paso / 2;
    raiz.append(svg('text', { class: 'eje-texto', x: cx, y: H - 12, 'text-anchor': 'middle' }, it.etiqueta));
    const g = svg('g', { class: `col-g${it.destacada ? ' es-destacada' : ''}`, tabindex: '0', role: 'img', 'aria-label': it.tooltip.resumen });
    if (it.valor === null) {
      g.append(svg('text', { class: 'columna__valor', x: cx, y: y(0) - 8, 'text-anchor': 'middle' }, 's/d'));
    } else {
      const y0 = y(0), y1 = y(it.valor);
      g.append(svg('rect', { class: `columna__barra ${it.claseColor || ''}`, x: cx - anchoCol / 2, y: Math.min(y0, y1), width: anchoCol, height: Math.max(1.5, Math.abs(y1 - y0)), rx: 3 }));
      if (!compacto || items.length <= 6)
        g.append(svg('text', { class: 'columna__valor', x: cx, y: it.valor >= 0 ? y1 - 7 : y1 + 15, 'text-anchor': 'middle' }, it.textoValor));
    }
    g.append(svg('rect', { class: 'columna__zona', x: cx - paso / 2, y: T - 10, width: paso, height: H - T - B + 10, fill: 'transparent' }));
    if (tooltip) {
      g.addEventListener('pointerenter', (e) => tooltip.mostrar(it.tooltip, e.clientX, e.clientY));
      g.addEventListener('pointermove', (e) => tooltip.mover(e.clientX, e.clientY));
      g.addEventListener('pointerleave', () => tooltip.ocultar());
      g.addEventListener('focus', () => tooltip.mostrarSobre(g, it.tooltip));
      g.addEventListener('blur', () => tooltip.ocultar());
    }
    raiz.append(g);
  });
  contenedor.append(raiz);
}
