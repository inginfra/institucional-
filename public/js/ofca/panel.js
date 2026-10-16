// Panel de detalle del mapa. Distingue SIEMPRE entre dato territorial (por jurisdicción) y dato nacional.
// Hoy no existe ningún dato territorial verificado (ver src/datos/ufeci2024.js → TERRITORIAL), de modo que
// una jurisdicción seleccionada muestra el estado «Datos territoriales no disponibles» y, aparte y rotulado,
// el contexto nacional. La rama `fichaTerritorial` queda lista para cuando exista una fuente verificada.
import { el, vaciar } from './dom.js';
import { num, pct } from './formato.js';
import { categoriaPorId, distribucion, hayDatosTerritoriales } from './selectores.js';

/** Contenido del tooltip del mapa: nombre + estadística territorial verificada, o el mensaje exacto de ausencia. */
export function contenidoTooltipJurisdiccion(datos, jurisdiccion) {
  const t = datos.territorial;
  if (hayDatosTerritoriales(datos, jurisdiccion.id)) {
    const f = t.jurisdicciones[jurisdiccion.id];
    const total = f.categorias.reduce((s, c) => s + c.cantidad, 0);
    return {
      titulo: jurisdiccion.nombre,
      etiqueta: 'Dato territorial verificado',
      lineas: [`${num(total)} ${f.unidad} (${f.periodo.desde} a ${f.periodo.hasta})`, `${f.fuente.organismo}, ${f.fuente.titulo}`],
    };
  }
  return { titulo: jurisdiccion.nombre, lineas: [t.mensajeJurisdiccion], resumen: `${jurisdiccion.nombre}. ${t.mensajeJurisdiccion}.` };
}

function bloqueNacional(datos, estado) {
  const total = datos.total2024.total;
  const cat = estado.categoria ? categoriaPorId(datos, estado.categoria) : null;
  const cantidad = cat ? cat.total : total;
  const porcentual = estado.unidad === 'porcentaje';
  const valor = porcentual ? pct(cat ? distribucion(datos).find((d) => d.id === cat.id).participacion : 100) : num(cantidad);
  const leyenda = porcentual
    ? cat ? `del total nacional de reportes de 2024 (${num(total)})` : 'del total nacional de reportes de 2024'
    : cat ? `reportes de «${cat.nombre}» recibidos por UFECI en todo el país en 2024` : 'reportes recibidos por UFECI en todo el país en 2024';
  return el(
    'section', { class: 'panel__nacional', 'aria-labelledby': 'panel-nacional-titulo' },
    el('p', { class: 'insignia insignia--nacional', texto: 'Dato nacional' }),
    el('h4', { id: 'panel-nacional-titulo', class: 'panel__subtitulo', texto: cat ? `Total nacional · ${cat.nombre}` : 'Total nacional' }),
    el('p', { class: 'panel__cifra' }, el('strong', { texto: valor })),
    el('p', { class: 'panel__leyenda', texto: leyenda }),
    el('p', { class: 'panel__aviso-nacional', texto: 'Esta cifra corresponde a todo el país. No es un dato de la jurisdicción elegida.' })
  );
}

/** Ficha territorial: solo se dibuja con datos que hayan pasado validarTerritorial(). */
function fichaTerritorial(datos, jurisdiccion) {
  const f = datos.territorial.jurisdicciones[jurisdiccion.id];
  const total = f.categorias.reduce((s, c) => s + c.cantidad, 0);
  const filas = [...f.categorias].sort((a, b) => b.cantidad - a.cantidad).map((c) => {
    const cat = categoriaPorId(datos, c.id);
    return el('li', {}, el('span', { texto: cat ? cat.nombre : c.id }), el('strong', { texto: num(c.cantidad) }),
      // El porcentaje se calcula solo sobre el total publicado para ESA jurisdicción.
      el('small', { texto: total ? pct((c.cantidad / total) * 100) : '' }));
  });
  return el(
    'section', { class: 'panel__territorial', 'aria-label': `Datos de ${jurisdiccion.nombre}` },
    el('p', { class: 'insignia insignia--territorial', texto: 'Dato territorial verificado' }),
    el('p', { class: 'panel__cifra' }, el('strong', { texto: num(total) }), ' ', f.unidad),
    el('ul', { class: 'panel__lista' }, filas),
    el('p', { class: 'panel__leyenda', texto: `Período: ${f.periodo.desde} a ${f.periodo.hasta}. Universo: ${f.universo}.` }),
    el('p', { class: 'panel__leyenda', texto: `Cobertura: ${f.cobertura}` }),
    el('p', { class: 'panel__leyenda', texto: `Fuente: ${f.fuente.organismo}, ${f.fuente.titulo}${f.fuente.edicion ? `, ${f.fuente.edicion}` : ''}.` })
  );
}

export function crearPanel(contenedor, { datos, geometria, alVolver, alLimpiarCategoria }) {
  const porId = new Map(geometria.jurisdicciones.map((j) => [j.id, j]));

  function render(estado) {
    vaciar(contenedor);
    const j = estado.jurisdiccion ? porId.get(estado.jurisdiccion) : null;
    contenedor.classList.toggle('tiene-seleccion', Boolean(j));
    if (!j) {
      contenedor.append(
        el('p', { class: 'insignia insignia--nacional', texto: 'Vista nacional' }),
        el('h3', { class: 'panel__titulo', tabindex: '-1', texto: 'Resumen nacional' }),
        el('p', { class: 'panel__texto', texto: 'Pasá el cursor o recorré con Tab las 24 jurisdicciones del mapa y elegí una para ver su ficha. El informe de UFECI contabiliza los reportes a nivel país: el mapa sirve para navegar, no para comparar territorios.' }),
        bloqueNacional(datos, estado)
      );
      return;
    }
    const hay = hayDatosTerritoriales(datos, j.id);
    contenedor.append(
      el('p', { class: 'insignia insignia--jurisdiccion', texto: j.tipo === 'provincia' ? 'Provincia' : 'Ciudad Autónoma' }),
      el('h3', { class: 'panel__titulo', tabindex: '-1', texto: j.nombre }),
      hay
        ? fichaTerritorial(datos, j)
        : el(
            'section', { class: 'panel__vacio', 'aria-label': 'Estado de los datos territoriales' },
            el('p', { class: 'insignia insignia--sin-datos', texto: datos.territorial.estado }),
            el('p', { class: 'panel__texto', texto: `${datos.territorial.mensajeJurisdiccion}.` }),
            el('p', { class: 'panel__leyenda', texto: datos.territorial.motivo })
          ),
      bloqueNacional(datos, estado),
      el('div', { class: 'panel__acciones' },
        el('button', { type: 'button', class: 'boton boton--secundario', onclick: alVolver, texto: 'Volver al resumen nacional' }),
        estado.categoria ? el('button', { type: 'button', class: 'boton boton--texto', onclick: alLimpiarCategoria, texto: 'Quitar filtro de categoría' }) : null)
    );
  }
  return { render };
}
