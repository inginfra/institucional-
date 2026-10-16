// Pruebas UNITARIAS (Node, sin red ni navegador): datos, selectores, formato, estado y geometrías.
//   node pruebas/datos.test.js
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte.js';
import {
  CATEGORIAS, TOTAL_2024, ANUAL, COMPARACION_MENSUAL, MODALIDADES, TERRITORIAL, JURISDICCIONES_ISO, FUENTE,
  verificarIntegridad, detectarInconsistenciasFuente, validarTerritorial, datosPublicos,
} from '../src/datos/ufeci2024.js';
import { num, pct, pctSigno, escalaY, redondear1 } from '../public/js/ofca/formato.js';
import {
  distribucion, serieMensual, valoresMensuales, mesPico, variacionesAnuales, indicadores, detalleModalidad, hayDatosTerritoriales,
} from '../public/js/ofca/selectores.js';
import { crearEstado } from '../public/js/ofca/estado.js';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓', m); };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; console.log('  ✓', m); };

try {
  console.log('Datos de la fuente (UFECI 2024)');
  const integridad = verificarIntegridad();
  for (const c of integridad) ok(c.ok, `${c.descripcion}${c.detalle ? ` (${c.detalle})` : ''}`);
  eq(CATEGORIAS.map((c) => [c.nombre, c.total, c.porcentajePublicado]), [
    ['Fraude en línea', 21729, 63.0], ['Usurpación de identidad', 4637, 13.5], ['Acceso ilegítimo', 2877, 8.3],
    ['Phishing', 1563, 4.5], ['Acoso', 1458, 4.2], ['Otros', 2204, 6.4],
  ], 'categorías con denominaciones oficiales, cantidades y porcentajes publicados');
  ok(TOTAL_2024.total === 34468, 'total 2024 = 34.468');
  eq(ANUAL.serie.map((x) => x.total), [22364, 32395, 28456, 34468], 'serie 2021-2024');
  ok(ANUAL.variacion2024vs2023Publicada === 21.1, 'variación interanual publicada +21,1 %');
  eq(TOTAL_2024.mensual, [3531, 2823, 4312, 2774, 2948, 2526, 2632, 2625, 2251, 2967, 2387, 2692], 'serie mensual 2024');
  ok(!CATEGORIAS.some((c) => /extors|ransom/i.test(c.nombre)), 'extorsión y ransomware no se agregaron a las categorías principales');
  eq(detectarInconsistenciasFuente().map((x) => x.id).sort(), ['compra-internet-porcentaje', 'mensual-2023-vs-anual', 'piramidales-total', 'ransomware-variacion'], 'discrepancias internas del informe documentadas');
  ok(MODALIDADES['usurpacion-de-identidad'].universo.total === 5509, 'el desglose de WhatsApp conserva su universo propio (5.509)');
  ok(MODALIDADES.otros.distribucion === null, '«Otros» no inventa un desglose');
  ok(FUENTE.cita === 'Fuente: UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025.', 'cita de fuente literal');
  ok(JSON.stringify(datosPublicos()).length > 1000 && datosPublicos().territorial.disponible === false, 'la API pública expone datos y estado territorial');

  console.log('Sin datos territoriales artificiales');
  ok(TERRITORIAL.disponible === false && Object.keys(TERRITORIAL.jurisdicciones).length === 0, 'no hay cifras por provincia');
  ok(JURISDICCIONES_ISO.length === 24 && new Set(JURISDICCIONES_ISO).size === 24, '24 códigos ISO únicos');
  ok(JURISDICCIONES_ISO.every((i) => !hayDatosTerritoriales(datosPublicos(), i)), 'ninguna jurisdicción reporta datos territoriales');
  ok(TERRITORIAL.mensajeJurisdiccion === 'El informe consultado no publica datos desagregados para esta jurisdicción', 'mensaje exacto de ausencia de datos');
  const fixtureOk = { disponible: true, jurisdicciones: { 'AR-X': {
    fuente: { organismo: 'Organismo X', titulo: 'Informe X' }, periodo: { desde: '2024-01', hasta: '2024-12' }, unidad: 'denuncias',
    universo: 'Denuncias registradas', cobertura: 'Provincia de Córdoba', categorias: [{ id: 'fraude-en-linea', cantidad: 10 }] } } };
  eq(validarTerritorial(fixtureOk), [], 'una entrada territorial completa y verificada es aceptada (estructura lista para datos futuros)');
  const sinFuente = JSON.parse(JSON.stringify(fixtureOk)); delete sinFuente.jurisdicciones['AR-X'].fuente;
  ok(validarTerritorial(sinFuente).length > 0, 'un dato territorial sin fuente es rechazado');
  const conTasa = JSON.parse(JSON.stringify(fixtureOk)); conTasa.jurisdicciones['AR-X'].tasa = 12.3;
  ok(validarTerritorial(conTasa).some((e) => /tasas/.test(e)), 'las tasas sin denominador verificado son rechazadas');
  const isoMalo = JSON.parse(JSON.stringify(fixtureOk)); isoMalo.jurisdicciones['AR-ZZ'] = isoMalo.jurisdicciones['AR-X']; delete isoMalo.jurisdicciones['AR-X'];
  ok(validarTerritorial(isoMalo).length > 0, 'una jurisdicción inexistente es rechazada');
  ok(validarTerritorial({ disponible: false, jurisdicciones: fixtureOk.jurisdicciones }).length > 0, '«disponible: false» con datos cargados es inconsistente');

  console.log('Formato es-AR y redondeos');
  ok(num(34468) === '34.468' && num(4312) === '4.312' && num(999) === '999', 'separador de miles con punto, incluso de 4 cifras');
  ok(/^63,0\s%$/.test(pct(63)) && /^\+21,1\s%$/.test(pctSigno(21.1)) && /^-12,2\s%$/.test(pctSigno(-12.2).replace('−', '-')), 'porcentajes con coma decimal y signo');
  eq(distribucion(datosPublicos()).map((d) => d.participacion), [63.0, 13.5, 8.3, 4.5, 4.2, 6.4].sort((a, b) => b - a), 'participaciones calculadas = publicadas, ordenadas');
  ok(distribucion(datosPublicos()).every((d) => d.participacion === d.participacionPublicada), 'cada participación calculada coincide con la publicada');
  eq(variacionesAnuales(datosPublicos()).map((v) => v.variacion), [null, 44.9, -12.2, 21.1], 'variaciones interanuales calculadas (2021 sin año previo)');
  const e = escalaY(4312);
  ok(e.max >= 4312 && e.marcas[0] === 0 && e.marcas.at(-1) === e.max, 'escala del eje Y cubre el máximo y parte de cero');
  ok(redondear1(0.05) === 0.1 || redondear1(0.05) === 0, 'redondeo a un decimal definido');

  console.log('Selectores');
  const d = datosPublicos();
  ok(serieMensual(d, null).total === 34468, 'serie mensual nacional');
  eq(serieMensual(d, 'phishing').valores, CATEGORIAS.find((c) => c.id === 'phishing').mensual, 'serie mensual por categoría');
  assert.throws(() => serieMensual(d, 'inexistente')); n++; console.log('  ✓ categoría inexistente lanza error');
  const pctMes = valoresMensuales(serieMensual(d, null), 'porcentaje');
  ok(Math.abs(pctMes.reduce((s, v) => s + v, 0) - 100) < 1e-9, 'en modo porcentaje los meses suman 100 % de la serie');
  ok(mesPico(d.total2024.mensual).indice === 2 && indicadores(d, null).pico.mes === 'marzo', 'mes pico = marzo (4.312)');
  ok(indicadores(d, 'acoso').total.valor === 1458 && indicadores(d, 'acoso').total.categoria.posicion === 6, 'KPI con filtro de categoría');
  ok(indicadores(d, null).lider.nombre === 'Fraude en línea' && indicadores(d, null).variacion.calculada === 21.1, 'KPI de modalidad principal y variación');
  ok(detalleModalidad(d, null) === null && detalleModalidad(d, 'otros').distribucion === null, 'detalle de modalidad sin categoría / sin desglose');

  console.log('Estado y filtros');
  const est = crearEstado({ categorias: d.categorias.map((c) => c.id), jurisdicciones: JURISDICCIONES_ISO });
  let avisos = 0; est.suscribir(() => avisos++);
  ok(est.esInicial(), 'estado inicial sin filtros');
  est.cambiar({ jurisdiccion: 'AR-X', categoria: 'phishing', unidad: 'porcentaje' });
  ok(est.obtener().jurisdiccion === 'AR-X' && est.obtener().categoria === 'phishing', 'cambiar de jurisdicción conserva los filtros del tablero');
  est.cambiar({ jurisdiccion: 'AR-A' });
  ok(est.obtener().categoria === 'phishing' && est.obtener().unidad === 'porcentaje', 'cambiar de provincia no rompe los filtros');
  est.cambiar({ jurisdiccion: null });
  ok(est.obtener().jurisdiccion === null && est.obtener().categoria === 'phishing', 'volver al resumen nacional conserva la categoría');
  ok(est.cambiar({ jurisdiccion: null }) === false, 'un cambio sin efecto no notifica');
  est.cambiar({ categoria: 'inventada', jurisdiccion: 'AR-ZZ', unidad: 'otra' });
  ok(est.obtener().categoria === null && est.obtener().jurisdiccion === null && est.obtener().unidad === 'cantidad', 'valores inválidos se normalizan');
  est.cambiar({ comparar2023: true, categoria: 'acoso' });
  ok(est.obtener().comparar2023 === false, 'la comparación 2023 solo existe para el total nacional');
  est.cambiar({ categoria: 'phishing', jurisdiccion: 'AR-C', unidad: 'porcentaje' });
  const hash = est.aHash();
  est.limpiarFiltros();
  ok(est.esInicial() && est.aHash() === '', 'limpiar filtros vuelve al estado inicial');
  est.desdeHash(hash);
  ok(est.obtener().categoria === 'phishing' && est.obtener().jurisdiccion === 'AR-C' && est.obtener().unidad === 'porcentaje', 'el estado se restaura desde el hash de la URL');
  ok(avisos > 3, 'los suscriptores reciben notificaciones');

  console.log('Geometrías');
  const g = JSON.parse(readFileSync(join(RAIZ, 'public/data/argentina-jurisdicciones.json'), 'utf8'));
  ok(g.jurisdicciones.length === 24, 'hay 24 geometrías (23 provincias + CABA)');
  eq(g.jurisdicciones.map((j) => j.id).sort(), [...JURISDICCIONES_ISO].sort(), 'los ids coinciden con los códigos ISO de los datos');
  ok(g.jurisdicciones.filter((j) => j.tipo === 'provincia').length === 23 && g.jurisdicciones.filter((j) => j.tipo === 'ciudad autónoma').length === 1, '23 provincias y 1 ciudad autónoma');
  ok(g.jurisdicciones.every((j) => /^M[\d. ]+(L[\d. ]+)+Z/.test(j.d) && j.d.split('M').length > 1 && j.d.split('Z').length > 1), 'todas las rutas son polígonos cerrados');
  const por = Object.fromEntries(g.jurisdicciones.map((j) => [j.id, j]));
  ok(por['AR-V'].centroide[1] > por['AR-Z'].centroide[1] && por['AR-Z'].centroide[1] > por['AR-B'].centroide[1], 'Tierra del Fuego está al sur de Santa Cruz y esta al sur de Buenos Aires');
  ok(por['AR-Y'].centroide[1] < por['AR-X'].centroide[1], 'Jujuy está al norte de Córdoba');
  ok(por['AR-M'].centroide[0] < por['AR-B'].centroide[0], 'Mendoza está al oeste de Buenos Aires');
  ok(por['AR-N'].centroide[0] > por['AR-M'].centroide[0], 'Misiones está al este de Mendoza');
  ok(por['AR-C'].caja[2] - por['AR-C'].caja[0] < 20, 'CABA es diminuta en el lienzo (por eso se ofrece una lupa)');
  ok(g.lupaCaba && g.lupaCaba.r > 10, 'hay lupa interactiva para CABA');
  ok(g.jurisdicciones.every((j) => j.caja[0] >= 0 && j.caja[1] >= 0 && j.caja[2] <= g.lienzo.ancho && j.caja[3] <= g.lienzo.alto), 'ninguna geometría sale del lienzo');
  ok(/Natural Earth/.test(g.fuente.nombre) && /Dominio público/.test(g.fuente.licencia) && /IGN/.test(g.fuente.nota), 'la geometría declara fuente, licencia y limitaciones');
  ok(new Set(g.jurisdicciones.map((j) => j.slug)).size === 24, 'slugs únicos');

  console.log(`\n${n} comprobaciones unitarias correctas.`);
} catch (err) {
  console.error('\nFALLÓ:', err.message);
  process.exit(1);
}
