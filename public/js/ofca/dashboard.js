// Explorador federal y tablero estadístico de OFCA. Punto de entrada del módulo (se carga con type="module").
// Datos: /api/estadisticas (fuente única: src/datos/ufeci2024.js) y /data/argentina-jurisdicciones.json (geometrías).
import { el, vaciar } from './dom.js';
import { num, pct, pctSigno, mayus, MESES_CORTOS } from './formato.js';
import { crearEstado } from './estado.js';
import { crearTooltip } from './tooltip.js';
import { crearMapa } from './mapa-svg.js';
import { barrasHorizontales, lineas, columnas } from './graficos.js';
import { crearPanel, contenidoTooltipJurisdiccion } from './panel.js';
import {
  categoriaPorId, distribucion, serieMensual, valoresMensuales, indicadores, detalleModalidad, variacionesAnuales,
} from './selectores.js';

const CLASE_CATEGORIA = {
  'fraude-en-linea': 'c-fraude', 'usurpacion-de-identidad': 'c-usurpacion', 'acceso-ilegitimo': 'c-acceso',
  phishing: 'c-phishing', acoso: 'c-acoso', otros: 'c-otros',
};
const claseDe = (id) => CLASE_CATEGORIA[id] || 'c-total';
const q = (id) => document.getElementById(id);

async function pedirJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

function mostrarEstado(tipo, mensaje, reintentar) {
  const caja = q('ofca-estado');
  if (!caja) return;
  vaciar(caja);
  caja.hidden = tipo === 'listo';
  caja.className = `estado-carga estado-carga--${tipo}`;
  if (tipo === 'listo') return;
  caja.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  caja.append(el('p', { texto: mensaje }));
  if (reintentar) caja.append(el('button', { type: 'button', class: 'boton boton--secundario', onclick: reintentar, texto: 'Reintentar' }));
}

function nombreMes(datos, i) { return mayus(datos.meses[i]); }

export async function iniciar() {
  const raiz = q('ofca-app');
  if (!raiz) return;
  raiz.dataset.cargando = 'true';
  mostrarEstado('cargando', 'Cargando datos del explorador…');
  let datos, geometria;
  try {
    [datos, geometria] = await Promise.all([pedirJson('/api/estadisticas'), pedirJson('/data/argentina-jurisdicciones.json')]);
    if (!datos.categorias || !datos.categorias.length || !geometria.jurisdicciones || geometria.jurisdicciones.length !== 24)
      throw new Error('Los datos recibidos están incompletos');
  } catch (e) {
    raiz.dataset.cargando = 'false';
    mostrarEstado('error', 'No pudimos cargar los datos del mapa y del tablero. Revisá tu conexión e intentá de nuevo.', () => iniciar());
    return;
  }
  mostrarEstado('listo');
  raiz.dataset.cargando = 'false';
  construir(raiz, datos, geometria);
}

function construir(raiz, datos, geometria) {
  const porIdJur = new Map(geometria.jurisdicciones.map((j) => [j.id, j]));
  const estado = crearEstado({ categorias: datos.categorias.map((c) => c.id), jurisdicciones: geometria.jurisdicciones.map((j) => j.id) });
  const tooltip = crearTooltip(raiz);
  const anuncio = q('ofca-anuncio');
  const anunciar = (t) => { if (anuncio) anuncio.textContent = t; };
  const ranking = distribucion(datos);
  let primeraVez = true;

  // ---------------- Mapa + panel ----------------
  const hayTerritorial = Boolean(datos.territorial && datos.territorial.disponible);
  let ultimoResaltado = null;
  const mapaCont = q('ofca-mapa');
  vaciar(mapaCont);
  const mapa = crearMapa(mapaCont, geometria, {
    etiquetaJurisdiccion: (j) => `${j.nombre}. ${hayTerritorial && datos.territorial.jurisdicciones[j.id] ? 'Con datos territoriales verificados' : datos.territorial.mensajeJurisdiccion}`,
    alSeleccionar: (id) => estado.cambiar({ jurisdiccion: id }),
    alResaltar: (id, nodo, evento) => {
      if (!id) { ultimoResaltado = null; tooltip.ocultar(); return; }
      if (evento && id === ultimoResaltado) { tooltip.mover(evento.clientX, evento.clientY); return; }
      ultimoResaltado = id;
      const c = contenidoTooltipJurisdiccion(datos, porIdJur.get(id));
      if (evento) tooltip.mostrar(c, evento.clientX, evento.clientY);
      else tooltip.mostrarSobre(nodo, c);
    },
  });
  const panel = crearPanel(q('ofca-panel'), {
    datos, geometria,
    alVolver: () => { estado.cambiar({ jurisdiccion: null }); mapa.enfocar(null); const t = q('ofca-mapa').querySelector('.jur'); if (t) t.focus(); },
    alLimpiarCategoria: () => estado.cambiar({ categoria: null }),
  });
  const leyenda = q('ofca-leyenda-mapa');
  if (leyenda) {
    vaciar(leyenda);
    leyenda.append(
      el('li', {}, el('span', { class: 'leyenda__muestra leyenda__muestra--neutra', 'aria-hidden': 'true' }), hayTerritorial ? 'Jurisdicción con datos territoriales' : 'Jurisdicción sin datos territoriales publicados'),
      el('li', {}, el('span', { class: 'leyenda__muestra leyenda__muestra--sel', 'aria-hidden': 'true' }), 'Jurisdicción seleccionada')
    );
  }
  const aviso = q('ofca-aviso-mapa');
  if (aviso) aviso.textContent = hayTerritorial ? '' : `${datos.territorial.estado}. Todas las jurisdicciones se dibujan con el mismo color porque el informe de UFECI no publica cifras por provincia: el mapa no representa intensidad ni ranking territorial.`;

  // ---------------- Filtros ----------------
  const filtros = q('ofca-filtros');
  vaciar(filtros);
  const chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Categoría' });
  const botonesCat = new Map();
  const mkChip = (id, texto) => {
    const b = el('button', { type: 'button', class: `chip ${id ? claseDe(id) : 'c-total'}`, 'aria-pressed': 'false', onclick: () => estado.cambiar({ categoria: id }) }, texto);
    botonesCat.set(id, b);
    chips.append(b);
  };
  mkChip(null, 'Todas las categorías');
  ranking.forEach((r) => mkChip(r.id, r.nombre));

  const selectJur = el('select', { id: 'ofca-sel-jur', class: 'campo campo--oscuro', onchange: (e) => estado.cambiar({ jurisdiccion: e.target.value || null }) },
    el('option', { value: '', texto: 'Todo el país' }),
    [...geometria.jurisdicciones].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-AR')).map((j) => el('option', { value: j.id, texto: j.nombre })));
  const btnCantidad = el('button', { type: 'button', 'aria-pressed': 'true', onclick: () => estado.cambiar({ unidad: 'cantidad' }) }, 'Cantidad');
  const btnPorcentaje = el('button', { type: 'button', 'aria-pressed': 'false', onclick: () => estado.cambiar({ unidad: 'porcentaje' }) }, 'Porcentaje');
  const chkComparar = el('input', { type: 'checkbox', id: 'ofca-comparar', onchange: (e) => estado.cambiar({ comparar2023: e.target.checked }) });
  const btnLimpiar = el('button', { type: 'button', class: 'boton boton--texto', onclick: () => { estado.limpiarFiltros(); anunciar('Se limpiaron los filtros.'); }, texto: 'Limpiar filtros' });
  const resumenFiltros = el('p', { class: 'filtros__resumen', 'aria-live': 'polite' });

  filtros.append(
    el('div', { class: 'filtros__grupo' }, el('span', { class: 'filtros__rotulo', id: 'rot-cat', texto: 'Categoría' }), chips),
    el('div', { class: 'filtros__fila' },
      el('div', { class: 'filtros__grupo' }, el('label', { class: 'filtros__rotulo', for: 'ofca-sel-jur', texto: 'Jurisdicción' }), selectJur),
      el('div', { class: 'filtros__grupo' }, el('span', { class: 'filtros__rotulo', texto: 'Unidad' }), el('div', { class: 'segmentado', role: 'group', 'aria-label': 'Unidad de medida' }, btnCantidad, btnPorcentaje)),
      el('div', { class: 'filtros__grupo filtros__grupo--check' }, chkComparar, el('label', { for: 'ofca-comparar', texto: 'Superponer 2023 (total mensual)' })),
      btnLimpiar),
    resumenFiltros
  );

  // ---------------- Secciones ----------------
  const kpis = q('ofca-kpis');
  const contCategorias = q('ofca-categorias');
  const contMensual = q('ofca-mensual');
  const contAnual = q('ofca-anual');
  const contModalidades = q('ofca-modalidades');

  function tarjetaKpi({ rotulo, valor, detalle, clase }) {
    return el('article', { class: `kpi ${clase || ''}` }, el('h3', { class: 'kpi__rotulo', texto: rotulo }), el('p', { class: 'kpi__valor' }, valor), el('p', { class: 'kpi__detalle', texto: detalle }));
  }

  function renderKpis(e) {
    const ind = indicadores(datos, e.categoria);
    const cat = ind.total.categoria;
    const alcance = cat ? cat.nombre : 'Total nacional';
    vaciar(kpis);
    kpis.append(
      tarjetaKpi({
        rotulo: `Reportes 2024 · ${alcance}`, clase: cat ? claseDe(cat.id) : 'c-total',
        valor: e.unidad === 'porcentaje' ? pct(ind.total.participacion) : num(ind.total.valor),
        detalle: e.unidad === 'porcentaje'
          ? `del total nacional (${num(ind.total.nacional)} reportes)`
          : cat ? `${pct(ind.total.participacion)} del total nacional de ${num(ind.total.nacional)}` : 'reportes recibidos por UFECI entre enero y diciembre',
      }),
      tarjetaKpi({
        rotulo: 'Variación 2024 vs. 2023 · Total nacional', clase: 'c-total',
        valor: pctSigno(ind.variacion.publicada),
        detalle: `${num(ind.variacion.a23)} → ${num(ind.variacion.a24)} reportes (variación publicada por UFECI)${cat ? '. El informe no publica la serie anual por categoría.' : ''}`,
      }),
      tarjetaKpi({
        rotulo: 'Modalidad principal · Total nacional', clase: claseDe(ind.lider.id),
        valor: ind.lider.nombre,
        detalle: `${pct(ind.lider.participacion)} del total (${num(ind.lider.cantidad)} reportes)${cat ? `. «${cat.nombre}» ocupa el puesto ${cat.posicion} de ${ranking.length}.` : ''}`,
      }),
      tarjetaKpi({
        rotulo: `Mes pico · ${alcance}`, clase: cat ? claseDe(cat.id) : 'c-total',
        valor: mayus(ind.pico.mes),
        detalle: `${num(ind.pico.valor)} reportes en el mes de mayor volumen de 2024`,
      })
    );
  }

  function renderCategorias(e, foco) {
    const max = ranking[0].cantidad;
    const pctMode = e.unidad === 'porcentaje';
    barrasHorizontales(contCategorias, ranking.map((r) => ({
      id: r.id, etiqueta: r.nombre, proporcion: r.cantidad / max, claseColor: claseDe(r.id),
      textoValor: pctMode ? pct(r.participacion) : num(r.cantidad),
      textoSecundario: pctMode ? `${num(r.cantidad)} reportes` : pct(r.participacion),
      elegida: e.categoria === r.id,
      tooltip: { titulo: r.nombre, lineas: [`${num(r.cantidad)} reportes en 2024`, `${pct(r.participacion)} del total nacional (${num(datos.total2024.total)})`, `Porcentaje publicado por UFECI: ${pct(r.participacionPublicada)}`] },
    })), {
      ariaLabel: 'Reportes por categoría, ordenados de mayor a menor. Cada barra es un botón que filtra el tablero.',
      alElegir: (id) => { estado.cambiar({ categoria: e.categoria === id ? null : id }); },
      tooltip, animar: primeraVez,
    });
    if (foco) { const b = contCategorias.querySelector(`[data-id="${foco}"]`); if (b) b.focus(); }
  }

  function renderMensual(e) {
    const serie = serieMensual(datos, e.categoria);
    const pctMode = e.unidad === 'porcentaje';
    const valores = valoresMensuales(serie, e.unidad);
    const cat = e.categoria ? categoriaPorId(datos, e.categoria) : null;
    const comparar = e.comparar2023 && !pctMode;
    const s = [{ valores, claseColor: claseDe(e.categoria), area: !comparar }];
    if (comparar) s.push({ valores: datos.comparacionMensual.anio2023, claseColor: 'c-2023', discontinua: true });
    const pico = valores.indexOf(Math.max(...valores));
    const f = pctMode ? (v) => `${num(Math.round(v * 10) / 10)} %` : num;
    lineas(contMensual, {
      series: s, etiquetasX: MESES_CORTOS, formatoY: f, indicePico: pico,
      etiquetaPico: `Pico: ${datos.meses[pico]}`,
      ariaLabel: `Reportes mensuales de 2024 · ${serie.nombre}${comparar ? ', con 2023 superpuesto' : ''}. Recorré los meses con las flechas.`,
      tooltip,
      tooltipEn: (i) => {
        const v = serie.valores[i];
        const lineasT = pctMode
          ? [`${serie.nombre}: ${pct((v / serie.total) * 100)} del total anual de la serie`, `${num(v)} reportes (total anual de la serie: ${num(serie.total)})`]
          : [`${serie.nombre} 2024: ${num(v)} reportes`];
        if (comparar) lineasT.push(`Total 2023 (gráfico del informe): ${num(datos.comparacionMensual.anio2023[i])} reportes`);
        return { titulo: `${nombreMes(datos, i)} de 2024`, lineas: lineasT, resumen: `${nombreMes(datos, i)}: ${lineasT.join('. ')}` };
      },
    });
    const nota = q('ofca-mensual-nota');
    vaciar(nota);
    nota.append(pctMode
      ? `Cada punto es la parte del total anual de «${serie.nombre}» que corresponde a ese mes (suma 100 %). No compara categorías entre sí.`
      : `${cat ? `Categoría «${cat.nombre}».` : 'Total nacional.'} ${num(serie.total)} reportes en el año.`);
    if (comparar) {
      const inc = datos.inconsistenciasFuente.find((x) => x.id === 'mensual-2023-vs-anual');
      nota.append(' ', el('strong', { texto: 'Atención: ' }), inc
        ? `la serie mensual de 2023 del informe suma ${num(inc.calculado)}, no los ${num(inc.publicado)} del total anual 2023. Se la muestra solo como referencia visual.`
        : 'la serie mensual de 2023 proviene del gráfico comparativo del informe.');
    }
  }

  function renderAnual(e) {
    const pctMode = e.unidad === 'porcentaje';
    const vars = variacionesAnuales(datos);
    columnas(contAnual, vars.map((v) => ({
      etiqueta: String(v.anio),
      valor: pctMode ? v.variacion : v.total,
      textoValor: pctMode ? (v.variacion === null ? 's/d' : pctSigno(v.variacion)) : num(v.total),
      destacada: v.anio === 2024, claseColor: v.anio === 2024 ? 'c-total' : 'c-historico',
      tooltip: {
        titulo: `Año ${v.anio}`,
        lineas: [`${num(v.total)} reportes recibidos por UFECI`, v.variacion === null ? 'Sin año anterior en la serie publicada' : `Variación respecto de ${v.anio - 1}: ${pctSigno(v.variacion)} (calculada por OFCA con los totales publicados)`],
        resumen: `${v.anio}: ${num(v.total)} reportes${v.variacion === null ? '' : `, ${pctSigno(v.variacion)} respecto del año anterior`}`,
      },
    })), {
      ariaLabel: pctMode ? 'Variación porcentual interanual de reportes, 2022 a 2024' : 'Reportes recibidos por UFECI por año, 2021 a 2024',
      formatoY: pctMode ? (v) => `${num(v)} %` : num, tooltip,
    });
    const nota = q('ofca-anual-nota');
    vaciar(nota);
    nota.append(e.categoria ? el('strong', { texto: 'La serie anual publicada es del total nacional; el informe no la desagrega por categoría. ' }) : '',
      'Las variaciones de 2022 y 2023 las calcula OFCA a partir de los totales publicados; la de 2024 coincide con la publicada por UFECI (',
      pctSigno(datos.anual.variacion2024vs2023Publicada), '). ',
      `Referencias fuera de la serie calendario: ${datos.anual.referencias.map((r) => `${r.etiqueta}: ${num(r.total)} reportes`).join('; ')}.`);
  }

  function renderModalidades(e) {
    vaciar(contModalidades);
    const cat = e.categoria ? categoriaPorId(datos, e.categoria) : null;
    if (!cat) {
      contModalidades.append(el('p', { class: 'vacio', texto: 'Elegí una categoría en el gráfico de barras o en los filtros para ver cómo se compone según el informe.' }));
      return;
    }
    const det = detalleModalidad(datos, cat.id);
    contModalidades.append(el('h3', { texto: `Detalle de «${cat.nombre}»` }));
    if (!det || !det.distribucion) {
      contModalidades.append(el('p', { class: 'vacio', texto: `El informe de UFECI no desglosa «${cat.nombre}» en modalidades (${num(cat.total)} reportes).` }));
      if (cat.nota) contModalidades.append(el('p', { class: 'nota', texto: cat.nota }));
      return;
    }
    const d = det.distribucion;
    const pctMode = e.unidad === 'porcentaje';
    const universo = det.universo;
    contModalidades.append(el('p', { class: 'nota', texto: `${d.titulo}. Universo: ${universo.etiqueta}, ${num(universo.total)} reportes. Porcentajes tal como los publica el informe (p. ${d.pagina}).` }));
    if (universo.aclaracion) contModalidades.append(el('p', { class: 'nota nota--aviso', texto: universo.aclaracion }));
    const caja = el('div', { class: 'modalidad-barras' });
    contModalidades.append(caja);
    const max = Math.max(...d.items.map((i) => i.porcentaje));
    barrasHorizontales(caja, d.items.map((i) => ({
      id: i.id, etiqueta: i.nombre, proporcion: i.porcentaje / max, claseColor: claseDe(cat.id),
      textoValor: pctMode || i.cantidad === null ? pct(i.porcentaje) : num(i.cantidad),
      textoSecundario: pctMode ? (i.cantidad === null ? 'cantidad no publicada' : `${num(i.cantidad)} reportes`) : (i.cantidad === null ? 'cantidad no publicada' : pct(i.porcentaje)),
      tooltip: { titulo: i.nombre, lineas: [`${pct(i.porcentaje)} de ${universo.etiqueta} (publicado)`, i.cantidad === null ? 'El informe no publica la cantidad' : `${num(i.cantidad)} reportes`] },
    })), { ariaLabel: d.titulo, tooltip });
    if (d.restoNoDesglosado) contModalidades.append(el('p', { class: 'nota', texto: d.restoNoDesglosado }));
    for (const a of det.analisis) {
      const total = a.serie.reduce((s, v) => s + v, 0);
      const bloque = el('figure', { class: 'figura' }, el('figcaption', { texto: `${a.titulo} (p. ${a.pagina})` }));
      const g = el('div', { class: 'grafico' });
      bloque.append(g, el('p', { class: 'nota', texto: `${a.nota} Suma de la serie mensual: ${num(total)} reportes.` }));
      contModalidades.append(bloque);
      const vals = pctMode ? a.serie.map((v) => (v / total) * 100) : a.serie;
      lineas(g, {
        series: [{ valores: vals, claseColor: claseDe(cat.id), area: true }], etiquetasX: MESES_CORTOS,
        formatoY: pctMode ? (v) => `${num(Math.round(v * 10) / 10)} %` : num,
        ariaLabel: `${a.titulo}. Recorré los meses con las flechas.`, tooltip,
        tooltipEn: (i) => {
          const l = pctMode ? [`${pct((a.serie[i] / total) * 100)} de la serie anual`, `${num(a.serie[i])} reportes`] : [`${num(a.serie[i])} reportes`];
          return { titulo: `${nombreMes(datos, i)} de 2024`, lineas: l, resumen: `${nombreMes(datos, i)}: ${l.join('. ')}` };
        },
      });
    }
  }

  // ---------------- Análisis específicos, notas y tablas (no dependen de filtros) ----------------
  function renderEstaticos() {
    const cont = q('ofca-analisis');
    vaciar(cont);
    for (const a of datos.analisisEspecificos) {
      const art = el('article', { class: 'analisis tarjeta-oscura' }, el('h3', { texto: a.titulo }), el('p', { class: 'insignia insignia--aparte', texto: `Universo propio · ${a.unidad} · no se suma al total` }));
      if (a.valores) {
        art.append(el('ul', { class: 'analisis__cifras' }, a.valores.map((v) => el('li', {}, el('strong', { texto: num(v.cantidad) }), ' ', v.etiqueta))));
      }
      if (a.anual) {
        const g = el('div', { class: 'grafico grafico--compacto' });
        art.append(g);
        columnas(g, a.anual.map((x) => ({
          etiqueta: String(x.anio), valor: a.totalPublicado[x.anio], textoValor: num(a.totalPublicado[x.anio]), claseColor: 'c-aparte', destacada: x.anio === 2024,
          tooltip: { titulo: `Ransomware ${x.anio}`, lineas: [`${num(a.totalPublicado[x.anio])} casos`, `Investigación preliminar: ${x.investigacionPreliminar}`, `Asistencia: ${x.asistencia}`, `Cooperación internacional: ${x.cooperacionInternacional}`], resumen: `${x.anio}: ${a.totalPublicado[x.anio]} casos` },
        })), { ariaLabel: 'Casos de ransomware con intervención de UFECI, 2022 a 2024', formatoY: num, tooltip, alto: 220, compacto: true });
        art.append(el('p', { class: 'nota', texto: `Acumulado 2022-2024: ${num(a.acumulado2022a2024)} casos.` }));
      }
      art.append(el('p', { class: 'nota', texto: `${a.nota} (p. ${a.pagina}).` }));
      cont.append(art);
    }

    const notas = q('ofca-notas');
    vaciar(notas);
    notas.append(el('ul', { class: 'lista-notas' }, datos.notasMetodologicas.map((n) => el('li', { texto: n }))));
    if (datos.inconsistenciasFuente.length) {
      notas.append(el('h3', { texto: 'Discrepancias internas del informe' }),
        el('p', { class: 'nota', texto: 'Al transcribir el informe detectamos diferencias entre sus propias cifras. No las corregimos: las mostramos tal como están publicadas.' }),
        el('ul', { class: 'lista-notas' }, datos.inconsistenciasFuente.map((x) =>
          el('li', {}, el('strong', { texto: `p. ${x.paginas.join(' y ')}: ` }), `${x.descripcion} Publicado: ${num(x.publicado)}; calculado: ${num(x.calculado)}. ${x.tratamiento}`))));
    }

    const tablas = q('ofca-tablas');
    vaciar(tablas);
    const t1 = el('table', { class: 'tabla' }, el('caption', { texto: 'Reportes recibidos por UFECI en 2024, por categoría' }),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', texto: 'Categoría' }), el('th', { scope: 'col', texto: 'Reportes' }), el('th', { scope: 'col', texto: '% del total' }))),
      el('tbody', {}, ranking.map((r) => el('tr', {}, el('th', { scope: 'row', texto: r.nombre }), el('td', { texto: num(r.cantidad) }), el('td', { texto: pct(r.participacion) })))),
      el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', texto: 'Total' }), el('td', { texto: num(datos.total2024.total) }), el('td', { texto: pct(100) }))));
    const t2 = el('table', { class: 'tabla' }, el('caption', { texto: 'Reportes mensuales de 2024: total nacional y categorías' }),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', texto: 'Mes' }), el('th', { scope: 'col', texto: 'Total' }), datos.categorias.map((c) => el('th', { scope: 'col', texto: c.nombre })))),
      el('tbody', {}, datos.meses.map((m, i) => el('tr', {}, el('th', { scope: 'row', texto: mayus(m) }), el('td', { texto: num(datos.total2024.mensual[i]) }), datos.categorias.map((c) => el('td', { texto: num(c.mensual[i]) }))))));
    const t3 = el('table', { class: 'tabla' }, el('caption', { texto: 'Reportes por año (serie publicada)' }),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', texto: 'Año' }), el('th', { scope: 'col', texto: 'Reportes' }), el('th', { scope: 'col', texto: 'Variación (calculada por OFCA)' }))),
      el('tbody', {}, variacionesAnuales(datos).map((v) => el('tr', {}, el('th', { scope: 'row', texto: String(v.anio) }), el('td', { texto: num(v.total) }), el('td', { texto: v.variacion === null ? 's/d' : pctSigno(v.variacion) })))));
    tablas.append(el('div', { class: 'tabla-caja' }, t1), el('div', { class: 'tabla-caja' }, t3), el('div', { class: 'tabla-caja tabla-caja--ancha' }, t2));
  }

  // ---------------- Render principal ----------------
  let previo = null;
  function actualizar(e, origen) {
    // controles
    for (const [id, b] of botonesCat) b.setAttribute('aria-pressed', String(e.categoria === id));
    selectJur.value = e.jurisdiccion || '';
    btnCantidad.setAttribute('aria-pressed', String(e.unidad === 'cantidad'));
    btnPorcentaje.setAttribute('aria-pressed', String(e.unidad === 'porcentaje'));
    chkComparar.checked = e.comparar2023;
    chkComparar.disabled = Boolean(e.categoria) || e.unidad === 'porcentaje';
    const inicial = estado.esInicial();
    btnLimpiar.disabled = inicial;
    const partes = [];
    if (e.categoria) partes.push(`Categoría: ${categoriaPorId(datos, e.categoria).nombre}`);
    if (e.jurisdiccion) partes.push(`Jurisdicción: ${porIdJur.get(e.jurisdiccion).nombre}`);
    if (e.unidad === 'porcentaje') partes.push('Unidad: porcentaje');
    if (e.comparar2023) partes.push('Comparación con 2023');
    resumenFiltros.textContent = partes.length ? `Filtros activos: ${partes.join(' · ')}.` : 'Sin filtros: se muestra el total nacional de 2024, en cantidades.';
    resumenFiltros.classList.toggle('es-vacio', !partes.length);

    mapa.seleccionar(e.jurisdiccion);
    panel.render(e);
    renderKpis(e);
    renderCategorias(e, origen === 'barras' ? e.categoria || (previo && previo.categoria) : null);
    renderMensual(e);
    renderAnual(e);
    renderModalidades(e);

    const aviso = q('ofca-aviso-jurisdiccion');
    vaciar(aviso);
    aviso.hidden = !e.jurisdiccion;
    if (e.jurisdiccion) aviso.append(el('strong', { texto: `${porIdJur.get(e.jurisdiccion).nombre}: ` }), `${datos.territorial.mensajeJurisdiccion}. Los gráficos de abajo muestran datos NACIONALES.`);

    if (previo && previo.jurisdiccion !== e.jurisdiccion) {
      anunciar(e.jurisdiccion ? `${porIdJur.get(e.jurisdiccion).nombre} seleccionada. ${datos.territorial.mensajeJurisdiccion}.` : 'Volviste al resumen nacional.');
    }
    const hash = estado.aHash();
    try {
      if (hash !== location.hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    } catch (_) { /* entornos sin History API */ }
    previo = { ...e };
    primeraVez = false;
  }

  contCategorias.addEventListener('click', () => { origenActual = 'barras'; }, true);
  let origenActual = null;
  estado.suscribir((e) => { actualizar(e, origenActual); origenActual = null; });

  renderEstaticos();
  estado.desdeHash(location.hash);
  actualizar(estado.obtener(), null);
  window.addEventListener('hashchange', () => estado.desdeHash(location.hash));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') tooltip.ocultar();
  });
  raiz.dataset.listo = 'true';
}

iniciar();
