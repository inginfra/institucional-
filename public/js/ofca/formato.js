// Formato numérico y de fechas para es-AR. Funciones puras (sin DOM).
const fNum = new Intl.NumberFormat('es-AR', { useGrouping: 'always', maximumFractionDigits: 0 });
const fDec1 = new Intl.NumberFormat('es-AR', { useGrouping: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fDec1Signo = new Intl.NumberFormat('es-AR', { useGrouping: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' });

export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const num = (n) => fNum.format(n);
/** 63,0 % (con espacio fino no separable antes del signo, como en el uso editorial argentino). */
export const pct = (n) => `${fDec1.format(n)} %`;
export const pctSigno = (n) => `${fDec1Signo.format(n)} %`;
/** Porcentaje publicado con sus decimales originales (56 % no se muestra como 56,0 %). */
export const pctPublicado = (n) => `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(n)} %`;
export const mayus = (s) => (s ? s[0].toLocaleUpperCase('es-AR') + s.slice(1) : s);
export const redondear1 = (n) => Math.round(n * 10) / 10;
export const porcentaje = (parte, total) => (total ? (parte / total) * 100 : 0);
export const suma = (a) => a.reduce((s, v) => s + v, 0);

/** Escala "agradable" para el eje Y: devuelve { max, paso, marcas }. */
export function escalaY(maximo, marcasDeseadas = 5) {
  if (!(maximo > 0)) return { max: 1, paso: 1, marcas: [0, 1] };
  const bruto = maximo / (marcasDeseadas - 1);
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / pot;
  const paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pot;
  const max = Math.ceil(maximo / paso) * paso;
  const marcas = [];
  for (let v = 0; v <= max + paso / 1000; v += paso) marcas.push(Math.round(v * 1000) / 1000);
  return { max, paso, marcas };
}
