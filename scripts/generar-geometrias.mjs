// Genera public/data/argentina-jurisdicciones.json a partir de Natural Earth (dominio público).
//
// Uso:
//   node scripts/generar-geometrias.mjs <ruta/a/ne_10m_admin_1_states_provinces.geojson> [salida.json]
//
// Fuente: Natural Earth, "Admin 1 – States, Provinces", escala 1:10m
//   https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
//   Repositorio: https://github.com/nvkelso/natural-earth-vector (geojson/ne_10m_admin_1_states_provinces.geojson)
//   Licencia: dominio público (https://www.naturalearthdata.com/about/terms-of-use/).
//
// El script solo transforma geometrías: proyecta, simplifica y exporta rutas SVG. No agrega ni
// calcula ninguna estadística. Es determinista: la misma entrada produce la misma salida.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const entrada = process.argv[2];
const salida = process.argv[3] || 'public/data/argentina-jurisdicciones.json';
if (!entrada) {
  console.error('Uso: node scripts/generar-geometrias.mjs <ne_10m_admin_1_states_provinces.geojson> [salida.json]');
  process.exit(2);
}

// ---- Parámetros documentados ----
const PARALELO_ESTANDAR = -40; // grados; proyección equirrectangular con este paralelo estándar
const PX_POR_GRADO = 27; // escala del lienzo SVG
const TOLERANCIA_GRADOS = 0.02; // Douglas-Peucker (~2 km): conserva la forma a escala nacional
const AREA_MINIMA_GRADOS2 = 0.012; // descarta islotes menores (~120 km²); CABA se conserva siempre
const MARGEN = 8; // px alrededor del dibujo

// Nombres y tipos en español de Argentina, indexados por código ISO 3166-2.
const NOMBRES = {
  'AR-A': ['Salta', 'provincia'], 'AR-B': ['Buenos Aires', 'provincia'],
  'AR-C': ['Ciudad Autónoma de Buenos Aires', 'ciudad autónoma'], 'AR-D': ['San Luis', 'provincia'],
  'AR-E': ['Entre Ríos', 'provincia'], 'AR-F': ['La Rioja', 'provincia'],
  'AR-G': ['Santiago del Estero', 'provincia'], 'AR-H': ['Chaco', 'provincia'],
  'AR-J': ['San Juan', 'provincia'], 'AR-K': ['Catamarca', 'provincia'],
  'AR-L': ['La Pampa', 'provincia'], 'AR-M': ['Mendoza', 'provincia'],
  'AR-N': ['Misiones', 'provincia'], 'AR-P': ['Formosa', 'provincia'],
  'AR-Q': ['Neuquén', 'provincia'], 'AR-R': ['Río Negro', 'provincia'],
  'AR-S': ['Santa Fe', 'provincia'], 'AR-T': ['Tucumán', 'provincia'],
  'AR-U': ['Chubut', 'provincia'], 'AR-V': ['Tierra del Fuego', 'provincia'],
  'AR-W': ['Corrientes', 'provincia'], 'AR-X': ['Córdoba', 'provincia'],
  'AR-Y': ['Jujuy', 'provincia'], 'AR-Z': ['Santa Cruz', 'provincia'],
};
const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s) => sinAcentos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---- Lectura ----
const fc = JSON.parse(readFileSync(entrada, 'utf8'));
const feats = fc.features.filter((f) => f.properties && f.properties.adm0_a3 === 'ARG');
if (feats.length !== 24) throw new Error(`Se esperaban 24 jurisdicciones de Argentina y se encontraron ${feats.length}`);

// ---- Geometría ----
const k = Math.cos((PARALELO_ESTANDAR * Math.PI) / 180);
const proyectar = ([lon, lat]) => [lon * k, -lat]; // grados "equivalentes"; y crece hacia el sur

function areaAnillo(r) {
  let a = 0;
  for (let i = 0, n = r.length; i < n - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return Math.abs(a) / 2;
}
function distPuntoSegmento(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function douglasPeucker(pts, tol) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const pila = [[0, pts.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop();
    let maxD = 0, idx = -1;
    for (let m = i + 1; m < j; m++) {
      const d = distPuntoSegmento(pts[m], pts[i], pts[j]);
      if (d > maxD) { maxD = d; idx = m; }
    }
    if (idx > -1 && maxD > tol) { keep[idx] = 1; pila.push([i, idx], [idx, j]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function simplificarAnillo(anillo, tol) {
  // Un anillo es cerrado: se simplifica partiéndolo en dos mitades para no perder el punto de cierre.
  const pts = anillo.slice(0, -1).map(proyectar);
  const mitad = Math.floor(pts.length / 2);
  const a = douglasPeucker(pts.slice(0, mitad + 1), tol);
  const b = douglasPeucker([...pts.slice(mitad), pts[0]], tol);
  const res = [...a.slice(0, -1), ...b.slice(0, -1)];
  return res.length >= 3 ? res : null;
}

const jurisdicciones = [];
for (const f of feats) {
  const iso = f.properties.iso_3166_2;
  if (!NOMBRES[iso]) throw new Error(`Código ISO inesperado: ${iso}`);
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  const rings = [];
  for (const poly of polys) {
    const area = areaAnillo(poly[0]);
    if (iso !== 'AR-C' && area < AREA_MINIMA_GRADOS2) continue;
    poly.forEach((anillo, idx) => {
      if (idx > 0 && areaAnillo(anillo) < AREA_MINIMA_GRADOS2) return; // huecos mínimos
      const s = simplificarAnillo(anillo, iso === 'AR-C' ? TOLERANCIA_GRADOS / 4 : TOLERANCIA_GRADOS);
      if (s) rings.push(s);
    });
  }
  jurisdicciones.push({ iso, nombre: NOMBRES[iso][0], tipo: NOMBRES[iso][1], rings });
}

// ---- Lienzo ----
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const j of jurisdicciones) for (const r of j.rings) for (const [x, y] of r) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const ancho = Math.ceil((maxX - minX) * PX_POR_GRADO + MARGEN * 2);
const alto = Math.ceil((maxY - minY) * PX_POR_GRADO + MARGEN * 2);
const aPx = ([x, y]) => [(x - minX) * PX_POR_GRADO + MARGEN, (y - minY) * PX_POR_GRADO + MARGEN];
const f1 = (n) => (Math.round(n * 10) / 10).toString();

let puntosTotales = 0;
const salidaJ = jurisdicciones.map((j) => {
  let d = '';
  let sx = 0, sy = 0, sa = 0;
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const r of j.rings) {
    const px = r.map(aPx);
    puntosTotales += px.length;
    d += 'M' + px.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
    // centroide ponderado por área del anillo exterior (aprox. suficiente para ubicar la navegación por teclado)
    for (const [x, y] of px) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
    const a = areaAnillo([...px, px[0]]);
    const cx = px.reduce((s, p) => s + p[0], 0) / px.length;
    const cy = px.reduce((s, p) => s + p[1], 0) / px.length;
    sx += cx * a; sy += cy * a; sa += a;
  }
  return {
    id: j.iso,
    slug: slug(j.nombre === 'Ciudad Autónoma de Buenos Aires' ? 'caba' : j.nombre),
    nombre: j.nombre,
    nombreCorto: j.iso === 'AR-C' ? 'CABA' : j.nombre,
    tipo: j.tipo,
    d,
    centroide: [Math.round(sx / sa), Math.round(sy / sa)],
    caja: [Math.floor(bx0), Math.floor(by0), Math.ceil(bx1), Math.ceil(by1)],
  };
});
// Orden de lectura norte → sur (define también el orden de tabulación).
salidaJ.sort((a, b) => a.centroide[1] - b.centroide[1] || a.centroide[0] - b.centroide[0]);

// CABA es demasiado pequeña para operarla con el puntero: se agrega una "lupa" (círculo ampliado) en el océano.
const caba = salidaJ.find((j) => j.id === 'AR-C');
const lupa = { cx: Math.min(ancho - 34, caba.centroide[0] + 62), cy: caba.centroide[1] + 6, r: 15 };

const resultado = {
  fuente: {
    nombre: 'Natural Earth — Admin 1: States, Provinces (1:10m)',
    url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/',
    licencia: 'Dominio público',
    nota:
      'Geometría simplificada para visualización a escala nacional. No reemplaza la cartografía oficial del Instituto Geográfico Nacional (IGN) ni representa la totalidad del territorio nacional (islas del Atlántico Sur y Antártida Argentina).',
  },
  proyeccion: `Equirrectangular con paralelo estándar ${PARALELO_ESTANDAR}°`,
  parametros: { pxPorGrado: PX_POR_GRADO, toleranciaGrados: TOLERANCIA_GRADOS, areaMinimaGrados2: AREA_MINIMA_GRADOS2 },
  lienzo: { ancho, alto },
  lupaCaba: lupa,
  jurisdicciones: salidaJ,
};

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(resultado));
const bytes = Buffer.byteLength(JSON.stringify(resultado));
console.log(`OK ${salidaJ.length} jurisdicciones, ${puntosTotales} vértices, lienzo ${ancho}×${alto}, ${(bytes / 1024).toFixed(1)} KiB → ${salida}`);
