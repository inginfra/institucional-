// Lógica de agregación y selección. Funciones puras: se prueban en Node y las usa el navegador.
import { porcentaje, redondear1, suma } from './formato.js';

export const UNIDADES = ['cantidad', 'porcentaje'];

export const categoriaPorId = (datos, id) => datos.categorias.find((c) => c.id === id) || null;

/** Categorías ordenadas por cantidad (descendente). Incluye cantidad, participación y rango. */
export function distribucion(datos) {
  const total = datos.total2024.total;
  return [...datos.categorias]
    .sort((a, b) => b.total - a.total)
    .map((c, i) => ({
      id: c.id, nombre: c.nombre, cantidad: c.total,
      participacion: redondear1(porcentaje(c.total, total)),
      participacionPublicada: c.porcentajePublicado,
      posicion: i + 1,
    }));
}

/** Serie mensual del total nacional o de una categoría. */
export function serieMensual(datos, categoriaId) {
  if (!categoriaId) {
    return { id: 'total', nombre: 'Total nacional', valores: datos.total2024.mensual, total: datos.total2024.total };
  }
  const c = categoriaPorId(datos, categoriaId);
  if (!c) throw new Error(`Categoría desconocida: ${categoriaId}`);
  return { id: c.id, nombre: c.nombre, valores: c.mensual, total: c.total };
}

/** Valores a graficar según la unidad. En «porcentaje», cada mes es la parte del total anual de la MISMA serie. */
export function valoresMensuales(serie, unidad) {
  if (unidad === 'porcentaje') return serie.valores.map((v) => porcentaje(v, serie.total));
  return serie.valores;
}

export function mesPico(valores) {
  const max = Math.max(...valores);
  const i = valores.indexOf(max);
  return { indice: i, valor: max };
}

/** Variación porcentual respecto del año anterior (solo entre años consecutivos de la serie anual). */
export function variacionesAnuales(datos) {
  const s = datos.anual.serie;
  return s.map((x, i) => ({
    anio: x.anio, total: x.total,
    variacion: i === 0 ? null : redondear1((x.total / s[i - 1].total - 1) * 100),
  }));
}

export function indicadores(datos, categoriaId) {
  const total = datos.total2024.total;
  const ranking = distribucion(datos);
  const lider = ranking[0];
  const serie = serieMensual(datos, categoriaId);
  const pico = mesPico(serie.valores);
  const a = datos.anual.serie;
  const a24 = a.find((x) => x.anio === 2024).total;
  const a23 = a.find((x) => x.anio === 2023).total;
  const sel = categoriaId ? ranking.find((r) => r.id === categoriaId) : null;
  return {
    total: { valor: sel ? sel.cantidad : total, nacional: total, categoria: sel, participacion: sel ? sel.participacion : 100 },
    variacion: { calculada: redondear1((a24 / a23 - 1) * 100), publicada: datos.anual.variacion2024vs2023Publicada, a24, a23 },
    lider,
    pico: { ...pico, mes: datos.meses[pico.indice], serie: serie.nombre },
  };
}

/** Sub-distribución publicada para una categoría (o null si el informe no la desglosa). */
export function detalleModalidad(datos, categoriaId) {
  return categoriaId ? datos.modalidades[categoriaId] || null : null;
}

export function hayDatosTerritoriales(datos, iso) {
  return Boolean(datos.territorial && datos.territorial.disponible && datos.territorial.jurisdicciones[iso]);
}

export function sumaSerie(valores) {
  return suma(valores);
}
