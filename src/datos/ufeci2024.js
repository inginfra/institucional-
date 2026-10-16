// FUENTE ÚNICA DE DATOS ESTADÍSTICOS DE OFCA.
//
// Todas las cifras de este archivo fueron transcriptas del documento:
//   UFECI (Unidad Fiscal Especializada en Ciberdelincuencia, Ministerio Público Fiscal),
//   «Informe 2024 — Casos y modalidades reportadas a UFECI», edición junio de 2025 (31 páginas).
// y contrastadas contra las tablas y los gráficos del PDF original (ver docs/FUENTE_UFECI_2024.md).
//
// Reglas:
//  1. Ninguna cifra se estima, interpola ni completa. Lo que el informe no publica figura como `null`.
//  2. Los números de página remiten a la numeración impresa del informe (coincide con la del PDF).
//  3. No existe ningún dato por provincia: ver `TERRITORIAL`. Si algún día se incorpora una fuente
//     territorial verificada, debe cargarse allí y pasar `validarTerritorial()`.
//  4. Los componentes visuales NO deben copiar cifras: consumen este módulo (vía /api/estadisticas).

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const FUENTE = {
  id: 'ufeci-informe-2024',
  organismo: 'Unidad Fiscal Especializada en Ciberdelincuencia (UFECI), Ministerio Público Fiscal',
  titulo: 'Informe 2024 — Casos y modalidades reportadas a UFECI',
  edicion: 'junio de 2025',
  cita: 'Fuente: UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025.',
  periodo: { desde: '2024-01', hasta: '2024-12', etiqueta: 'enero a diciembre de 2024' },
  unidad: 'reportes recibidos por UFECI',
  aclaracion:
    'Las cifras representan reportes recibidos por UFECI durante el período indicado, según la metodología del informe. No miden delitos ocurridos, víctimas únicas, denuncias judiciales ni prevalencia.',
  autoria:
    'Los datos pertenecen a UFECI. Los gráficos, la organización y los comentarios de esta página son análisis propios de OFCA y no fueron elaborados ni avalados por UFECI ni por el Ministerio Público Fiscal.',
};

// ---------------------------------------------------------------------------------------------
// Categorías principales (informe, p. 12). Denominaciones originales.
// ---------------------------------------------------------------------------------------------
export const CATEGORIAS = [
  {
    id: 'fraude-en-linea', nombre: 'Fraude en línea', total: 21729, porcentajePublicado: 63.0,
    mensual: [2341, 1809, 2315, 1931, 1946, 1627, 1638, 1615, 1328, 1893, 1348, 1938],
    pagina: 12,
  },
  {
    id: 'usurpacion-de-identidad', nombre: 'Usurpación de identidad', total: 4637, porcentajePublicado: 13.5,
    mensual: [410, 322, 720, 282, 387, 305, 389, 395, 371, 464, 439, 153],
    pagina: 12,
    nota: 'En el texto del informe (pp. 12 y 22) se la describe como «usurpación de identidad seguida de fraude»: reportes de cuentas de WhatsApp tomadas por terceros que luego piden dinero a los contactos.',
  },
  {
    id: 'acceso-ilegitimo', nombre: 'Acceso ilegítimo', total: 2877, porcentajePublicado: 8.3,
    mensual: [309, 197, 442, 168, 234, 208, 199, 242, 192, 230, 266, 190],
    pagina: 12,
  },
  {
    id: 'phishing', nombre: 'Phishing', total: 1563, porcentajePublicado: 4.5,
    mensual: [144, 200, 283, 125, 101, 136, 100, 102, 88, 97, 32, 155],
    pagina: 12,
  },
  {
    id: 'acoso', nombre: 'Acoso', total: 1458, porcentajePublicado: 4.2,
    mensual: [136, 136, 225, 110, 109, 86, 160, 110, 109, 97, 97, 83],
    pagina: 12,
  },
  {
    id: 'otros', nombre: 'Otros', total: 2204, porcentajePublicado: 6.4,
    mensual: [191, 159, 327, 158, 171, 164, 146, 161, 163, 186, 205, 173],
    pagina: 12,
    nota: 'Agrupa «diversas modalidades que no llegan a ser representativas» (p. 12). El informe no la desglosa.',
  },
];

// Fila «Total» de la tabla de la p. 12 y totales anuales publicados.
export const TOTAL_2024 = {
  total: 34468,
  mensual: [3531, 2823, 4312, 2774, 2948, 2526, 2632, 2625, 2251, 2967, 2387, 2692],
  pagina: 12,
};

// Serie anual (p. 9) y variación interanual publicada (p. 11).
export const ANUAL = {
  serie: [
    { anio: 2021, total: 22364 },
    { anio: 2022, total: 32395 },
    { anio: 2023, total: 28456 },
    { anio: 2024, total: 34468 },
  ],
  variacion2024vs2023Publicada: 21.1,
  paginas: [9, 11],
  // Períodos de 12 meses que NO son años calendario (p. 8-9). Se informan aparte, nunca en la misma serie.
  referencias: [
    { id: 'prepandemia', etiqueta: 'Abril de 2019 a marzo de 2020', total: 2581 },
    { id: 'primer-anio-pandemia', etiqueta: 'Abril de 2020 a marzo de 2021', total: 14583, aumentoPublicado: 465 },
  ],
};

// Comparación mensual 2023-2024 (p. 11). Los valores de 2023 se leyeron del gráfico de barras.
export const COMPARACION_MENSUAL = {
  anio2023: [3714, 3165, 3374, 3374, 2553, 2630, 2925, 2223, 974, 624, 1834, 1405],
  anio2024: TOTAL_2024.mensual,
  variacionesPublicadas: { marzo: 28, septiembre: 131, octubre: 375, diciembre: 92 }, // % de 2024 sobre 2023
  pagina: 11,
};

// ---------------------------------------------------------------------------------------------
// Detalle por modalidad. Cada bloque conserva el universo y la unidad con que lo publica el informe.
// `porcentaje` es el valor impreso en el informe; `cantidad` solo aparece si el informe lo publica.
// ---------------------------------------------------------------------------------------------
export const MODALIDADES = {
  'fraude-en-linea': {
    universo: { etiqueta: 'Fraude en línea', total: 21729 },
    distribucion: {
      titulo: 'Composición publicada del fraude en línea',
      pagina: 13,
      items: [
        { id: 'compra-por-internet', nombre: 'Compra por internet', porcentaje: 56, cantidad: 12004 },
        { id: 'homebanking', nombre: 'Homebanking', porcentaje: 18, cantidad: 3806 },
        { id: 'esquemas-piramidales', nombre: 'Esquemas piramidales', porcentaje: 10, cantidad: null },
        { id: 'otros', nombre: 'Otros', porcentaje: 16, cantidad: null },
      ],
    },
    analisis: [
      {
        id: 'piramidales-mensual', titulo: 'Estafas piramidales y de inversión: reportes por mes',
        unidad: 'reportes', pagina: 16,
        serie: [150, 100, 357, 241, 302, 207, 106, 92, 116, 332, 201, 269],
        nota: 'El texto del informe menciona 2.204 maniobras de este tipo; la suma de la serie mensual publicada es mayor (ver «Notas sobre la fuente»).',
      },
      {
        id: 'alquileres-temporarios', titulo: 'Alquileres temporarios y reservas turísticas: reportes por mes',
        unidad: 'reportes', pagina: 19, total: 488,
        serie: [118, 63, 69, 32, 22, 20, 26, 27, 12, 22, 35, 42],
        nota: 'El 51 % se concentra entre enero y marzo (estacionalidad estival). No se suma a la composición anterior: el informe no aclara en qué segmento se incluye.',
      },
    ],
  },
  'usurpacion-de-identidad': {
    universo: {
      etiqueta: 'Ataques a cuentas de WhatsApp (usurpación + acceso ilegítimo)',
      total: 5509,
      aclaracion:
        'Universo distinto del de la categoría: suma los 4.637 reportes de «Usurpación de identidad» y 872 reportes de accesos a WhatsApp que el informe contabiliza dentro de «Acceso ilegítimo» (p. 22).',
    },
    distribucion: {
      titulo: 'Composición publicada de los ataques a cuentas de WhatsApp',
      pagina: 22,
      items: [
        { id: 'usurpacion-whatsapp-fraude', nombre: 'Usurpación de WhatsApp + fraude', porcentaje: 84.2, cantidad: 4637 },
        { id: 'usurpacion-whatsapp', nombre: 'Usurpación de WhatsApp (sin pedido de dinero)', porcentaje: 15.8, cantidad: 872 },
      ],
    },
    analisis: [],
  },
  'acceso-ilegitimo': {
    universo: { etiqueta: 'Acceso ilegítimo', total: 2877 },
    distribucion: {
      titulo: 'Plataformas accedidas sin autorización',
      pagina: 19,
      items: [
        { id: 'whatsapp', nombre: 'WhatsApp', porcentaje: 30, cantidad: 872 },
        { id: 'mercado-pago', nombre: 'Mercado Pago', porcentaje: 26, cantidad: 740 },
        { id: 'otros', nombre: 'Otros', porcentaje: 20, cantidad: null },
        { id: 'facebook', nombre: 'Facebook', porcentaje: 15, cantidad: 440 },
        { id: 'gmail', nombre: 'Gmail', porcentaje: 4, cantidad: null },
        { id: 'instagram', nombre: 'Instagram', porcentaje: 3, cantidad: 92 },
        { id: 'hotmail', nombre: 'Hotmail', porcentaje: 2, cantidad: null },
      ],
    },
    analisis: [],
  },
  phishing: {
    universo: { etiqueta: 'Phishing', total: 1563 },
    distribucion: {
      titulo: 'Medio de contacto utilizado',
      pagina: 24,
      items: [
        { id: 'otros-medios', nombre: 'Redes sociales, llamados u otros medios', porcentaje: 65, cantidad: null },
        { id: 'correo-electronico', nombre: 'Correo electrónico', porcentaje: 35, cantidad: 545 },
      ],
    },
    analisis: [],
  },
  acoso: {
    universo: { etiqueta: 'Acoso', total: 1458 },
    distribucion: {
      titulo: 'Subcategoría publicada',
      pagina: 26,
      items: [
        { id: 'difusion-imagenes-intimas', nombre: 'Difusión no autorizada de imágenes íntimas', porcentaje: 23.3, cantidad: 340 },
      ],
      restoNoDesglosado: 'El informe no desglosa el resto de los reportes de acoso.',
    },
    analisis: [
      {
        id: 'difusion-imagenes-mensual', titulo: 'Difusión no autorizada de imágenes íntimas: reportes por mes',
        unidad: 'reportes', pagina: 26, total: 340,
        serie: [23, 23, 32, 27, 28, 24, 27, 19, 30, 50, 29, 28],
        nota: 'Es un subconjunto de los 1.458 reportes de acoso. Se incorporó como subcategoría específica en 2024 (Ley 26.485, modificada por la «Ley Olimpia»).',
      },
    ],
  },
  otros: {
    universo: { etiqueta: 'Otros', total: 2204 },
    distribucion: null,
    analisis: [],
  },
};

// Análisis del informe con universo y unidad propios. NO se suman a las categorías principales.
export const ANALISIS_ESPECIFICOS = [
  {
    id: 'extorsion',
    titulo: 'Extorsión',
    pagina: 25,
    unidad: 'reportes',
    valores: [
      { etiqueta: 'Reportes de extorsión en 2024', cantidad: 774 },
      { etiqueta: 'De ellos, extorsión por correo electrónico (falso acceso por spyware)', cantidad: 109 },
    ],
    nota: 'El informe no indica en cuál de las categorías principales se contabilizan. No debe sumarse al total.',
  },
  {
    id: 'ransomware',
    titulo: 'Ransomware',
    pagina: 28,
    unidad: 'casos en los que intervino UFECI',
    nota:
      'La unidad no es «reportes recibidos» sino casos con investigación preliminar, asistencia o cooperación internacional. El informe señala que el 57 % de las víctimas pertenece a organismos o servicios públicos, salud, energía y comunicaciones (pp. 28-29).',
    anual: [
      { anio: 2022, asistencia: 4, cooperacionInternacional: 2, investigacionPreliminar: 14 },
      { anio: 2023, asistencia: 6, cooperacionInternacional: 1, investigacionPreliminar: 14 },
      { anio: 2024, asistencia: 6, cooperacionInternacional: 1, investigacionPreliminar: 19 },
    ],
    totalPublicado: { 2022: 20, 2023: 21, 2024: 26 },
    acumulado2022a2024: 67,
  },
];

// Contexto institucional acumulado (p. 7). No es un indicador anual.
export const CONTEXTO_UNIDAD = {
  consultasYReportesHastaDic2024: 120264,
  investigacionesYAsistencias: 7500,
  casosDistintos: 5900,
  pagina: 7,
  nota: 'Cifras acumuladas históricas citadas en la introducción del informe («más de 7.500 oportunidades», «aproximadamente 5.900 casos distintos»).',
};

// ---------------------------------------------------------------------------------------------
// Datos territoriales. El informe UFECI 2024 NO publica desagregación geográfica.
// ---------------------------------------------------------------------------------------------
export const JURISDICCIONES_ISO = [
  'AR-A', 'AR-B', 'AR-C', 'AR-D', 'AR-E', 'AR-F', 'AR-G', 'AR-H', 'AR-J', 'AR-K', 'AR-L', 'AR-M',
  'AR-N', 'AR-P', 'AR-Q', 'AR-R', 'AR-S', 'AR-T', 'AR-U', 'AR-V', 'AR-W', 'AR-X', 'AR-Y', 'AR-Z',
];

export const TERRITORIAL = {
  disponible: false,
  estado: 'Datos territoriales no disponibles',
  mensajeJurisdiccion: 'El informe consultado no publica datos desagregados para esta jurisdicción',
  motivo:
    'El informe de UFECI contabiliza los reportes a nivel nacional. No publica tablas, mapas ni cifras por provincia, departamento o localidad, por lo que no es posible atribuir cantidades, porcentajes ni tendencias a una jurisdicción.',
  verificacion: {
    fuente: 'UFECI, Informe 2024 (edición junio de 2025)',
    alcance:
      'Lectura del texto completo (31 páginas), de las tablas y de los gráficos vectoriales; revisión de las imágenes embebidas (capturas de pantalla de ejemplos de maniobras) y búsqueda de menciones territoriales.',
    resultado:
      'Sin variables por jurisdicción. La única mención geográfica es la dirección postal de la institución (pie del informe).',
  },
  // Cuando exista una fuente territorial verificada, se carga acá, indexada por código ISO 3166-2.
  // Estructura exigida (ver validarTerritorial):
  //   'AR-X': {
  //     fuente: { organismo, titulo, edicion },
  //     periodo: { desde: 'AAAA-MM', hasta: 'AAAA-MM' },
  //     unidad: 'reportes' | 'denuncias' | ...,
  //     universo: 'texto que define qué se cuenta',
  //     cobertura: 'texto que describe qué parte del territorio y de los hechos abarca',
  //     categorias: [{ id: 'fraude-en-linea', cantidad: 123 }],
  //   }
  jurisdicciones: {},
};

export function validarTerritorial(t) {
  const errores = [];
  if (!t || typeof t !== 'object') return ['El objeto territorial es inválido'];
  const ids = new Set(CATEGORIAS.map((c) => c.id));
  const entradas = Object.entries(t.jurisdicciones || {});
  if (t.disponible === false && entradas.length) errores.push('`disponible` es false pero hay jurisdicciones cargadas');
  if (t.disponible === true && !entradas.length) errores.push('`disponible` es true pero no hay jurisdicciones cargadas');
  for (const [iso, d] of entradas) {
    const p = `${iso}:`;
    if (!JURISDICCIONES_ISO.includes(iso)) errores.push(`${p} código de jurisdicción desconocido`);
    if (!d || typeof d !== 'object') { errores.push(`${p} entrada inválida`); continue; }
    for (const campo of ['fuente', 'periodo', 'unidad', 'universo', 'cobertura']) {
      if (!d[campo]) errores.push(`${p} falta «${campo}» (toda cifra territorial debe indicar su procedencia)`);
    }
    if (d.fuente && (!d.fuente.organismo || !d.fuente.titulo)) errores.push(`${p} la fuente debe indicar organismo y título`);
    if (d.periodo && (!/^\d{4}-\d{2}$/.test(d.periodo.desde || '') || !/^\d{4}-\d{2}$/.test(d.periodo.hasta || '')))
      errores.push(`${p} el período debe tener formato AAAA-MM`);
    if (!Array.isArray(d.categorias) || !d.categorias.length) errores.push(`${p} faltan categorías`);
    for (const c of d.categorias || []) {
      if (!ids.has(c.id)) errores.push(`${p} categoría desconocida «${c.id}»`);
      if (!Number.isInteger(c.cantidad) || c.cantidad < 0) errores.push(`${p} cantidad inválida para «${c.id}»`);
    }
    if ('tasa' in d || 'porcentajeNacional' in d || 'ranking' in d)
      errores.push(`${p} no se admiten tasas, participaciones nacionales ni rankings sin denominadores verificados y documentados`);
  }
  return errores;
}

// ---------------------------------------------------------------------------------------------
// Verificaciones de integridad (las ejecutan las pruebas y se exponen en la API).
// ---------------------------------------------------------------------------------------------
const suma = (a) => a.reduce((s, v) => s + v, 0);
const redondear1 = (n) => Math.round(n * 10) / 10;

export function verificarIntegridad() {
  const res = [];
  const chequeo = (id, descripcion, ok, detalle = '') => res.push({ id, descripcion, ok: Boolean(ok), detalle });

  const total = TOTAL_2024.total;
  chequeo('suma-categorias', 'La suma de las categorías principales coincide con el total anual publicado',
    suma(CATEGORIAS.map((c) => c.total)) === total, `${suma(CATEGORIAS.map((c) => c.total))} vs ${total}`);
  chequeo('suma-mensual-total', 'La suma de los 12 meses del total coincide con el total anual publicado',
    suma(TOTAL_2024.mensual) === total, `${suma(TOTAL_2024.mensual)} vs ${total}`);
  for (const c of CATEGORIAS) {
    chequeo(`mensual-${c.id}`, `Los 12 meses de «${c.nombre}» suman su total anual`, suma(c.mensual) === c.total,
      `${suma(c.mensual)} vs ${c.total}`);
    chequeo(`porcentaje-${c.id}`, `El porcentaje publicado de «${c.nombre}» coincide con total/anual redondeado a 1 decimal`,
      redondear1((c.total / total) * 100) === c.porcentajePublicado, `${redondear1((c.total / total) * 100)} vs ${c.porcentajePublicado}`);
  }
  for (let m = 0; m < 12; m++) {
    const col = suma(CATEGORIAS.map((c) => c.mensual[m]));
    chequeo(`columna-${m + 1}`, `Las categorías de ${MESES[m]} suman el total mensual publicado`, col === TOTAL_2024.mensual[m],
      `${col} vs ${TOTAL_2024.mensual[m]}`);
  }
  const a23 = ANUAL.serie.find((x) => x.anio === 2023).total;
  const a24 = ANUAL.serie.find((x) => x.anio === 2024).total;
  chequeo('anual-2024', 'El total 2024 de la serie anual coincide con el total de la tabla mensual', a24 === total);
  chequeo('variacion-interanual', 'La variación interanual publicada (21,1 %) coincide con 2024/2023',
    redondear1((a24 / a23 - 1) * 100) === ANUAL.variacion2024vs2023Publicada, `${redondear1((a24 / a23 - 1) * 100)}`);
  chequeo('comparacion-2024', 'La serie mensual 2024 del gráfico comparativo coincide con la tabla',
    COMPARACION_MENSUAL.anio2024.every((v, i) => v === TOTAL_2024.mensual[i]));
  const claves = { marzo: 2, septiembre: 8, octubre: 9, diciembre: 11 };
  for (const [mes, i] of Object.entries(claves)) {
    const calc = Math.round((COMPARACION_MENSUAL.anio2024[i] / COMPARACION_MENSUAL.anio2023[i] - 1) * 100);
    chequeo(`variacion-${mes}`, `La variación publicada para ${mes} coincide con 2024/2023`, calc === COMPARACION_MENSUAL.variacionesPublicadas[mes], `${calc} %`);
  }
  chequeo('mes-maximo', 'El mes con más reportes es marzo (4.312), como indica el texto del informe',
    TOTAL_2024.mensual.indexOf(Math.max(...TOTAL_2024.mensual)) === 2 && Math.max(...TOTAL_2024.mensual) === 4312);
  chequeo('alquileres', 'Los alquileres temporarios suman 488 y el primer trimestre es el 51 %',
    suma(MODALIDADES['fraude-en-linea'].analisis[1].serie) === 488 &&
      Math.round((suma(MODALIDADES['fraude-en-linea'].analisis[1].serie.slice(0, 3)) / 488) * 100) === 51);
  chequeo('difusion-imagenes', 'La difusión no autorizada de imágenes íntimas suma 340 y es el 23,3 % del acoso',
    suma(MODALIDADES.acoso.analisis[0].serie) === 340 && redondear1((340 / 1458) * 100) === 23.3);
  for (const [id, m] of Object.entries(MODALIDADES)) {
    if (!m.distribucion) continue;
    const s = suma(m.distribucion.items.map((i) => i.porcentaje));
    if (id === 'acoso') continue; // subconjunto: no suma 100
    chequeo(`distribucion-${id}`, `La composición publicada de «${m.universo.etiqueta}» suma 100 %`, Math.round(s * 10) / 10 === 100, `${s}`);
  }
  chequeo('whatsapp-universo', 'Usurpación (4.637) + acceso a WhatsApp (872) = 5.509',
    4637 + 872 === MODALIDADES['usurpacion-de-identidad'].universo.total);
  chequeo('ransomware-totales', 'Los casos de ransomware por año suman los totales publicados y 67 en total',
    ANALISIS_ESPECIFICOS[1].anual.every((a) => a.asistencia + a.cooperacionInternacional + a.investigacionPreliminar === ANALISIS_ESPECIFICOS[1].totalPublicado[a.anio]) &&
      suma(Object.values(ANALISIS_ESPECIFICOS[1].totalPublicado)) === 67);
  const terr = validarTerritorial(TERRITORIAL);
  chequeo('territorial-sin-datos', 'No hay datos territoriales cargados y la estructura es válida', terr.length === 0 && Object.keys(TERRITORIAL.jurisdicciones).length === 0 && TERRITORIAL.disponible === false, terr.join('; '));
  return res;
}

// Discrepancias INTERNAS del informe (no son errores de transcripción): se documentan, no se corrigen.
export function detectarInconsistenciasFuente() {
  const out = [];
  const a23 = ANUAL.serie.find((x) => x.anio === 2023).total;
  const s23 = suma(COMPARACION_MENSUAL.anio2023);
  if (s23 !== a23)
    out.push({
      id: 'mensual-2023-vs-anual',
      paginas: [9, 11],
      descripcion:
        'La serie mensual de 2023 del gráfico comparativo suma un valor distinto del total anual 2023 publicado.',
      publicado: a23, calculado: s23, diferencia: s23 - a23,
      tratamiento: 'Se muestran ambas cifras tal como figuran en el informe. La serie mensual de 2023 se ofrece solo como comparación visual y con esta advertencia.',
    });
  const piram = MODALIDADES['fraude-en-linea'].analisis[0].serie;
  const sP = suma(piram);
  const hastaNov = suma(piram.slice(0, 11));
  if (sP !== 2204)
    out.push({
      id: 'piramidales-total',
      paginas: [16],
      descripcion:
        'El texto indica 2.204 maniobras de estafas piramidales y de inversión; la suma de los 12 meses del gráfico es distinta.',
      publicado: 2204, calculado: sP, diferencia: sP - 2204,
      observacion: hastaNov === 2204 ? 'El valor del texto coincide con la suma de enero a noviembre.' : undefined,
      tratamiento: 'No se publica un total único para este segmento: se muestra la serie mensual y se declara la discrepancia.',
    });
  const compra = MODALIDADES['fraude-en-linea'].distribucion.items[0];
  const pCompra = redondear1((compra.cantidad / 21729) * 100);
  if (Math.round(pCompra) !== compra.porcentaje)
    out.push({
      id: 'compra-internet-porcentaje',
      paginas: [13],
      descripcion: 'El informe indica que la compra por internet es el 56 % del fraude en línea y que suma 12.004 casos; 12.004 sobre 21.729 es menor.',
      publicado: compra.porcentaje, calculado: pCompra, diferencia: redondear1(pCompra - compra.porcentaje),
      tratamiento: 'Se muestran el porcentaje y la cantidad publicados, sin recalcular ninguno.',
    });
  const r = ANALISIS_ESPECIFICOS[1].totalPublicado;
  const varR = redondear1((r[2024] / r[2023] - 1) * 100);
  if (varR !== 20)
    out.push({
      id: 'ransomware-variacion',
      paginas: [28],
      descripcion: 'El texto habla de un aumento «del orden del 20 %» en los casos de ransomware (21 en 2023 y 26 en 2024).',
      publicado: 20, calculado: varR, diferencia: redondear1(varR - 20),
      tratamiento: 'Se muestran los casos publicados (21 y 26); no se destaca una variación porcentual.',
    });
  return out;
}

export const NOTAS_METODOLOGICAS = [
  'Las cifras son reportes recibidos por UFECI, principalmente por su casilla institucional de correo electrónico. No son delitos ocurridos, víctimas únicas, denuncias judiciales ni prevalencia.',
  'Solo llegan a UFECI los hechos que las personas deciden reportar y por ese canal: existe subregistro y sesgo de canal, y el volumen puede variar por campañas de difusión o alertas públicas.',
  'Según el informe, cada reporte se etiqueta según uno o más aspectos de la maniobra. Las seis categorías principales suman exactamente el total anual, pero los análisis específicos (extorsión, ransomware, subtipos) tienen universos propios y pueden superponerse con ellas: por eso no se suman.',
  'Las variaciones entre años que describe el informe se atribuyen a factores generales (adopción de tecnologías, aparición de nuevas modalidades). No son una medición causal.',
  'El informe no publica datos por provincia, departamento ni localidad. Elegir una jurisdicción en el mapa permite navegar, pero no implica que existan estadísticas de esa jurisdicción.',
];

export function datosPublicos() {
  return {
    fuente: FUENTE,
    meses: MESES,
    categorias: CATEGORIAS,
    total2024: TOTAL_2024,
    anual: ANUAL,
    comparacionMensual: COMPARACION_MENSUAL,
    modalidades: MODALIDADES,
    analisisEspecificos: ANALISIS_ESPECIFICOS,
    contextoUnidad: CONTEXTO_UNIDAD,
    territorial: TERRITORIAL,
    notasMetodologicas: NOTAS_METODOLOGICAS,
    inconsistenciasFuente: detectarInconsistenciasFuente(),
  };
}
