// Plantillas del sitio. Todo el contenido visible está en español argentino (es-AR).
import { FUENTE, CATEGORIAS, TOTAL_2024, ANUAL } from './datos/ufeci2024.js';

const SITE = {
  nombre: 'Observatorio Federal de Ciberdelincuencia Argentina',
  sigla: 'OFCA',
  corto: 'OFCA',
  descripcion:
    'OFCA es una iniciativa civil independiente que organiza y explica la información pública sobre ciberdelito y estafas virtuales en Argentina, con fuentes citadas y límites a la vista.',
};

const fmt = new Intl.NumberFormat('es-AR', { useGrouping: 'always' });
const fmt1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const NBSP = '\u00a0';

// Logo de OFCA: anillo abierto (el cuadrante noreste queda sin trazo) con dos puntos de acento.
const LOGO_SVG = `<svg class="marca__logo" viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" focusable="false"><path d="M20 5.5A14.5 14.5 0 1 0 34.5 20" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="20" cy="20" r="3.2" class="logo__nucleo"/><circle cx="29.2" cy="10.8" r="2.6" class="logo__acento"/><circle cx="34" cy="6" r="1.5" class="logo__acento"/></svg>`;

const NAV = [
  { href: '/', texto: 'Inicio' },
  { href: '/el-observatorio', texto: 'El Observatorio' },
  { href: '/metodologia', texto: 'Metodología' },
  { href: '/mapa', texto: 'Mapa del Ciberdelito' },
  { href: '/investigacion', texto: 'Investigación' },
  { href: '/contacto', texto: 'Contacto' },
];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ ruta, titulo, descripcion, cuerpo, scripts = [], modulos = [], estilos = [], noindex = false }) {
  const tituloCompleto = ruta === '/' ? `${SITE.nombre}` : `${titulo} | ${SITE.corto}`;
  const desc = descripcion || SITE.descripcion;
  const nav = NAV.map(
    (n) =>
      `<li><a href="${n.href}"${n.href === ruta ? ' aria-current="page"' : ''}>${n.texto}</a></li>`
  ).join('');
  const sc = [
    ...scripts.map((s) => `<script src="${s}" defer></script>`),
    ...modulos.map((s) => `<script type="module" src="${s}"></script>`),
  ].join('\n  ');
  const css = ['/css/styles.css', ...estilos].map((h) => `<link rel="stylesheet" href="${h}">`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(tituloCompleto)}</title>
  <meta name="description" content="${esc(desc)}">
  ${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_AR">
  <meta property="og:site_name" content="${esc(SITE.nombre)}">
  <meta property="og:title" content="${esc(tituloCompleto)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta name="theme-color" content="#0b1b2e">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  ${css}
</head>
<body>
  <a class="saltar" href="#contenido">Saltar al contenido principal</a>
  <header class="cabecera">
    <div class="contenedor cabecera__fila">
      <a class="marca" href="/" aria-label="${esc(SITE.sigla)}, ${esc(SITE.nombre)}: ir al inicio">
        ${LOGO_SVG}
        <span class="marca__texto"><strong>${SITE.sigla}</strong><small>Observatorio Federal de Ciberdelincuencia Argentina</small></span>
      </a>
      <button class="menu-boton" type="button" aria-expanded="false" aria-controls="menu-principal">Menú</button>
      <nav aria-label="Navegación principal">
        <ul id="menu-principal" class="menu">${nav}</ul>
      </nav>
    </div>
  </header>
  <main id="contenido" tabindex="-1">
${cuerpo}
  </main>
  <footer class="pie">
    <div class="contenedor pie__grid">
      <div>
        <strong>${esc(SITE.nombre)}</strong>
        <p>Iniciativa civil independiente para entender el ciberdelito con datos públicos, fuentes citadas y límites a la vista.</p>
      </div>
      <nav aria-label="Enlaces del pie de página">
        <ul class="pie__enlaces">
          <li><a href="/metodologia">Conocé cómo trabajamos</a></li>
          <li><a href="/investigacion">Líneas de investigación</a></li>
          <li><a href="/privacidad">Protección de datos personales</a></li>
          <li><a href="/equipo">Acceso al equipo</a></li>
        </ul>
      </nav>
    </div>
    <div class="contenedor pie__legal">
      <p>Este sitio no recibe denuncias. Si fuiste víctima de un delito, hacé la denuncia ante la autoridad competente de tu provincia.</p>
      <p>OFCA es una iniciativa civil independiente: no es UFECI, no integra el Ministerio Público Fiscal ni representa a ningún organismo del Estado. Las estadísticas que se muestran pertenecen a sus fuentes, citadas en cada sección.</p>
    </div>
  </footer>
  <script src="/js/menu.js" defer></script>
  ${sc}
</body>
</html>`;
}

// ---------- Páginas ----------

function inicio() {
  const fraude = CATEGORIAS.find((c) => c.id === 'fraude-en-linea');
  const a23 = ANUAL.serie.find((x) => x.anio === 2023).total;
  return {
    titulo: SITE.nombre,
    cuerpo: `
    <section class="hero">
      <div class="contenedor hero__grid">
        <div>
          <p class="etiqueta">Iniciativa civil independiente</p>
          <h1>Datos públicos y análisis riguroso para entender el ciberdelito en Argentina</h1>
          <p class="bajada">Organizamos y explicamos la información pública disponible sobre estafas virtuales y otros ciberdelitos. Cada cifra cita su fuente y cada límite queda a la vista.</p>
          <p class="acciones">
            <a class="boton" href="/mapa">Explorá el Mapa Federal del Ciberdelito</a>
            <a class="boton boton--secundario" href="/metodologia">Conocé cómo trabajamos</a>
          </p>
        </div>
        <aside class="tarjeta tarjeta--oscura" aria-labelledby="ayuda-titulo">
          <h2 id="ayuda-titulo">¿Necesitás ayuda?</h2>
          <p>Si fuiste víctima de una estafa virtual o un ciberdelito, podés ver qué pasos seguir de inmediato.</p>
          <p><a class="boton boton--claro" href="/contacto#orientacion">¿Fuiste víctima de una estafa virtual o un ciberdelito? Te orientamos</a></p>
        </aside>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <h2>2024 en cifras</h2>
        <div class="cifras">
          <article class="cifra"><p class="cifra__valor">${fmt.format(TOTAL_2024.total)}</p><p>reportes recibidos por UFECI en 2024</p></article>
          <article class="cifra"><p class="cifra__valor">+${fmt1.format(ANUAL.variacion2024vs2023Publicada)}${NBSP}%</p><p>respecto de 2023 (${fmt.format(a23)} reportes)</p></article>
          <article class="cifra"><p class="cifra__valor">${fmt1.format(fraude.porcentajePublicado)}${NBSP}%</p><p>corresponde a «${fraude.nombre}», la categoría más reportada</p></article>
        </div>
        <p class="nota">${esc(FUENTE.cita)} ${esc(FUENTE.aclaracion)}</p>
        <p class="acciones"><a class="enlace-flecha" href="/mapa">Explorá el Mapa Federal del Ciberdelito</a></p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <h2>Qué hacemos</h2>
        <div class="grilla grilla--3">
          <article class="tarjeta">
            <h3>Transcribimos y verificamos</h3>
            <p>Tomamos cifras de fuentes oficiales, las cargamos en una base estructurada y las controlamos con pruebas automáticas de sumas y porcentajes.</p>
          </article>
          <article class="tarjeta">
            <h3>Explicamos</h3>
            <p>Presentamos los datos con gráficos accesibles, aclarando qué cuenta cada cifra, qué no cuenta y dónde el propio informe tiene discrepancias.</p>
          </article>
          <article class="tarjeta">
            <h3>Orientamos</h3>
            <p>Traducimos los hallazgos en recomendaciones claras para la ciudadanía, los equipos técnicos y los organismos públicos.</p>
          </article>
        </div>
        <p class="acciones"><a class="enlace-flecha" href="/investigacion">Conocé nuestras líneas de investigación</a></p>
      </div>
    </section>

    <section class="seccion seccion--gris">
      <div class="contenedor">
        <h2>Principios de trabajo</h2>
        <ul class="lista-principios">
          <li><strong>Transparencia metodológica.</strong> Cada indicador explica de dónde sale y cuáles son sus límites.</li>
          <li><strong>Sin datos inventados.</strong> Si una fuente no publica una cifra, lo decimos; no la estimamos.</li>
          <li><strong>Protección de datos personales.</strong> Trabajamos con información agregada y pública.</li>
          <li><strong>Independencia.</strong> Somos una iniciativa civil, sin vínculo institucional con los organismos cuyas fuentes citamos.</li>
          <li><strong>Enfoque federal.</strong> Incorporaremos datos por provincia cuando una fuente oficial los publique. Hoy el informe base no los incluye.</li>
        </ul>
      </div>
    </section>`,
  };
}

function elObservatorio() {
  return {
    titulo: 'El Observatorio',
    descripcion:
      'Quiénes somos, para qué existimos y cómo trabajamos: OFCA, una iniciativa civil independiente sobre ciberdelito y estafas virtuales en Argentina.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>El Observatorio</h1>
        <p class="bajada">OFCA es una iniciativa civil independiente que estudia el ciberdelito con evidencia verificable y lenguaje accesible.</p>
        <h2>Qué es y qué no es</h2>
        <p>OFCA no es la Unidad Fiscal Especializada en Ciberdelincuencia (UFECI), no integra el Ministerio Público Fiscal ni representa a ningún organismo del Estado. Usamos información pública de esas y otras instituciones, la citamos y la presentamos con análisis propio, que no fue elaborado ni avalado por ellas.</p>
        <h2>Misión</h2>
        <p>Producir y difundir conocimiento confiable sobre el ciberdelito y las estafas virtuales en Argentina, y ponerlo a disposición de la sociedad, la academia y el Estado.</p>
        <h2>Objetivos</h2>
        <ul>
          <li>Mantener el Mapa Federal del Ciberdelito con criterios metodológicos públicos.</li>
          <li>Documentar modalidades delictivas y su evolución en el tiempo y, cuando existan fuentes oficiales, en el territorio.</li>
          <li>Identificar brechas en la prevención, la denuncia y la respuesta institucional.</li>
          <li>Difundir recomendaciones prácticas para reducir riesgos.</li>
        </ul>
        <h2>Principios editoriales</h2>
        <p>Independencia editorial, transparencia en el uso de fuentes y protección de datos personales. Las decisiones metodológicas se documentan y se publican junto con cada visualización.</p>
        <p><a class="boton" href="/contacto">Escribinos</a></p>
      </div>
    </section>`,
  };
}

function metodologia() {
  return {
    titulo: 'Metodología',
    descripcion:
      'Conocé cómo trabajamos: fuente, transcripción, cálculos propios, límites de los indicadores y criterios para incorporar datos territoriales.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>Metodología</h1>
        <p class="bajada">Un indicador solo es útil si se entiende cómo se construyó. Esta página describe lo que OFCA hace hoy, no lo que planea hacer.</p>

        <h2>1. Fuente actual</h2>
        <p>Todas las estadísticas del tablero provienen de un único documento: <em>UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI</em>, edición de junio de 2025. Las cifras son <strong>reportes recibidos por UFECI</strong>: no miden delitos ocurridos, víctimas únicas, denuncias judiciales ni prevalencia.</p>

        <h2>2. Transcripción y control de integridad</h2>
        <p>Las cifras se cargaron en un archivo estructurado, con la página del informe de la que surgen. Pruebas automáticas verifican que las categorías sumen el total, que los porcentajes coincidan con los publicados y que las series mensuales y anuales sean consistentes. Cuando el informe tiene discrepancias internas, no las corregimos: las mostramos en «Notas sobre la fuente».</p>

        <h2>3. Cálculos propios</h2>
        <ul>
          <li>Los porcentajes se calculan sobre el universo indicado en cada gráfico y se redondean a un decimal.</li>
          <li>En «Porcentaje», la serie mensual muestra qué parte del total anual de esa serie corresponde a cada mes.</li>
          <li>Las variaciones interanuales de 2022 y 2023 se calculan con los totales publicados; la de 2024 coincide con la que publica UFECI.</li>
        </ul>

        <h2>4. Lo que no hacemos</h2>
        <p>No estimamos cifras por provincia, no calculamos tasas por habitante y no dibujamos mapas de calor con datos que la fuente no publica. El informe de UFECI no desagrega por jurisdicción, por lo que el mapa permite navegar entre las 24 jurisdicciones pero indica expresamente que no hay datos territoriales.</p>

        <h2>5. Subregistro y límites</h2>
        <p>Solo llegan a UFECI los hechos que las personas deciden reportar y por ese canal, de modo que hay subregistro y sesgo de canal. Los análisis específicos (extorsión, ransomware, subtipos) tienen universos propios y no se suman a las seis categorías principales.</p>

        <h2>6. Cartografía</h2>
        <p>Las geometrías provienen de Natural Earth (dominio público), simplificadas para visualización nacional. No reemplazan la cartografía oficial del Instituto Geográfico Nacional ni incluyen las islas del Atlántico Sur ni la Antártida Argentina.</p>

        <h2>7. Incorporación futura de datos territoriales</h2>
        <p>Un dato por jurisdicción solo se incorporará si cuenta con fuente oficial citable, período, unidad de medida, universo y cobertura explícitos. El sistema rechaza automáticamente los datos territoriales que no declaren esos campos, y no calcula tasas ni rankings sin un denominador verificado.</p>

        <h2>8. Protección de datos personales</h2>
        <p>Solo trabajamos con información agregada y pública. No publicamos datos que permitan identificar a víctimas ni a terceros, en cumplimiento de la normativa argentina de protección de datos personales.</p>

        <p><a class="boton" href="/mapa">Explorá el Mapa Federal del Ciberdelito</a></p>
      </div>
    </section>`,
  };
}

function tablaNoscript() {
  const filas = [...CATEGORIAS]
    .sort((a, b) => b.total - a.total)
    .map((c) => `<tr><th scope="row">${esc(c.nombre)}</th><td>${fmt.format(c.total)}</td><td>${fmt1.format(c.porcentajePublicado)}${NBSP}%</td></tr>`)
    .join('');
  return `<noscript>
          <div class="aviso" role="note">Para usar el mapa y los gráficos interactivos necesitás habilitar JavaScript. Mientras tanto, esta es la tabla de reportes de 2024 por categoría.</div>
          <table class="tabla"><caption>Reportes recibidos por UFECI en 2024, por categoría</caption>
            <thead><tr><th scope="col">Categoría</th><th scope="col">Reportes</th><th scope="col">% del total</th></tr></thead>
            <tbody>${filas}</tbody>
            <tfoot><tr><th scope="row">Total</th><td>${fmt.format(TOTAL_2024.total)}</td><td>100,0${NBSP}%</td></tr></tfoot>
          </table>
        </noscript>`;
}

function mapa() {
  return {
    titulo: 'Mapa del Ciberdelito',
    descripcion:
      'Explorá el Mapa Federal del Ciberdelito: las 24 jurisdicciones argentinas y el tablero de reportes recibidos por UFECI en 2024, con fuente y límites a la vista.',
    modulos: ['/js/ofca/dashboard.js'],
    estilos: ['/css/dashboard.css'],
    cuerpo: `
    <section class="explorador" id="ofca-app" data-cargando="true">
      <div class="contenedor">
        <header class="explorador__cabecera">
          <p class="etiqueta">Mapa Federal del Ciberdelito</p>
          <h1>Mapa del Ciberdelito</h1>
          <p class="bajada">Explorá las 24 jurisdicciones y el tablero de reportes de ciberdelito de 2024. Los números son nacionales: el informe de origen no publica datos por provincia.</p>
        </header>
        <aside class="fuente" aria-label="Fuente y alcance de los datos">
          <p class="fuente__cita"><strong>${esc(FUENTE.cita)}</strong></p>
          <p>${esc(FUENTE.aclaracion)}</p>
          <p>${esc(FUENTE.autoria)}</p>
        </aside>
        <div id="ofca-estado" class="estado-carga estado-carga--cargando" role="status"><p>Cargando datos del explorador…</p></div>
        ${tablaNoscript()}
        <div id="ofca-anuncio" class="solo-lectores" role="status" aria-live="polite"></div>

        <div class="filtros" id="ofca-filtros" aria-label="Filtros del tablero"></div>
        <p id="ofca-aviso-jurisdiccion" class="aviso aviso--jurisdiccion" role="note" hidden></p>

        <div class="explorador__cuerpo">
          <section class="explorador__mapa" aria-labelledby="titulo-mapa">
            <h2 id="titulo-mapa">Jurisdicciones</h2>
            <div id="ofca-mapa" class="mapa-caja"></div>
            <ul id="ofca-leyenda-mapa" class="leyenda-mapa"></ul>
            <p id="ofca-aviso-mapa" class="nota"></p>
          </section>
          <aside class="explorador__panel" aria-label="Detalle de la jurisdicción" id="ofca-panel" aria-live="polite"></aside>
        </div>

        <section class="tablero" aria-labelledby="titulo-kpis">
          <h2 id="titulo-kpis">Indicadores clave · Total nacional, 2024</h2>
          <div id="ofca-kpis" class="kpis"></div>
        </section>

        <section class="tablero" aria-labelledby="titulo-cat">
          <h2 id="titulo-cat">Reportes por categoría</h2>
          <p class="nota">Elegí una barra para filtrar el resto del tablero; volvé a elegirla para quitar el filtro.</p>
          <div id="ofca-categorias" class="grafico"></div>
        </section>

        <div class="tablero__doble">
          <section class="tablero" aria-labelledby="titulo-mensual">
            <h2 id="titulo-mensual">Evolución mensual, 2024</h2>
            <div id="ofca-mensual" class="grafico"></div>
            <p id="ofca-mensual-nota" class="nota"></p>
          </section>
          <section class="tablero" aria-labelledby="titulo-anual">
            <h2 id="titulo-anual">Evolución interanual</h2>
            <div id="ofca-anual" class="grafico"></div>
            <p id="ofca-anual-nota" class="nota"></p>
          </section>
        </div>

        <section class="tablero" aria-labelledby="titulo-modalidades">
          <h2 id="titulo-modalidades">Detalle por modalidad</h2>
          <div id="ofca-modalidades"></div>
        </section>

        <section class="tablero" aria-labelledby="titulo-analisis">
          <h2 id="titulo-analisis">Análisis específicos del informe</h2>
          <p class="nota">Tienen universo y unidad propios: no se suman a las seis categorías ni al total.</p>
          <div id="ofca-analisis" class="analisis-grilla"></div>
        </section>

        <section class="tablero" aria-labelledby="titulo-notas">
          <h2 id="titulo-notas">Notas sobre la fuente</h2>
          <div id="ofca-notas"></div>
        </section>

        <section class="tablero" aria-labelledby="titulo-tablas">
          <h2 id="titulo-tablas">Datos en tablas</h2>
          <div id="ofca-tablas" class="tablas"></div>
        </section>
      </div>
    </section>`,
  };
}

function investigacion() {
  const lineas = [
    ['Estafas virtuales y fraude financiero', 'Modalidades, canales de contacto, medios de pago utilizados y recorrido del dinero desde la perspectiva de las víctimas.'],
    ['Suplantación de identidad', 'Robo y uso indebido de identidades digitales, y su impacto en el acceso a servicios financieros y públicos.'],
    ['Extorsión y hostigamiento digital', 'Patrones de extorsión en línea y circuitos de denuncia y atención en cada provincia.'],
    ['Respuesta institucional', 'Capacidades de prevención, recepción de denuncias e investigación en el territorio, con foco en las brechas federales.'],
    ['Cultura de ciberseguridad', 'Hábitos, percepción de riesgo y estrategias de educación digital para distintos grupos de población.'],
    ['Ética y datos', 'Uso responsable de datos, anonimización y diseño de indicadores respetuosos de la privacidad.'],
  ];
  const tarjetas = lineas
    .map(([t, d]) => `<article class="tarjeta"><h3>${t}</h3><p>${d}</p></article>`)
    .join('');
  return {
    titulo: 'Investigación',
    descripcion:
      'Líneas de investigación del Observatorio sobre estafas virtuales, suplantación de identidad, extorsión digital y respuesta institucional.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor">
        <h1>Investigación</h1>
        <p class="bajada">Nuestras líneas de investigación orientan el trabajo del equipo y la selección de indicadores del mapa.</p>
        <div class="grilla grilla--3">${tarjetas}</div>
        <h2>Publicaciones</h2>
        <p>Los informes se publicarán en esta sección junto con su documentación metodológica y los conjuntos de datos agregados que los respaldan. Por el momento no hay informes publicados.</p>
        <p><a class="boton" href="/contacto">Proponé una colaboración</a></p>
      </div>
    </section>`,
  };
}

function contacto() {
  return {
    titulo: 'Contacto',
    descripcion:
      'Escribinos a OFCA y encontrá orientación inicial si fuiste víctima de una estafa virtual o un ciberdelito.',
    scripts: ['/js/contacto.js'],
    cuerpo: `
    <section class="seccion">
      <div class="contenedor grilla grilla--2">
        <div>
          <h1>Contacto</h1>
          <p class="bajada">Escribinos para consultas institucionales, colaboraciones académicas o pedidos de prensa.</p>
          <form id="form-contacto" class="formulario" novalidate>
            <div class="grupo">
              <label for="nombre">Nombre y apellido</label>
              <input id="nombre" name="nombre" class="campo" type="text" autocomplete="name" required maxlength="120">
              <p class="error" id="error-nombre" role="alert"></p>
            </div>
            <div class="grupo">
              <label for="email">Correo electrónico</label>
              <input id="email" name="email" class="campo" type="email" autocomplete="email" required maxlength="160">
              <p class="error" id="error-email" role="alert"></p>
            </div>
            <div class="grupo">
              <label for="asunto">Motivo de la consulta</label>
              <select id="asunto" name="asunto" class="campo" required>
                <option value="">Elegí una opción</option>
                <option>Consulta institucional</option>
                <option>Colaboración académica</option>
                <option>Prensa</option>
                <option>Fuentes de datos</option>
                <option>Otro</option>
              </select>
              <p class="error" id="error-asunto" role="alert"></p>
            </div>
            <div class="grupo">
              <label for="mensaje">Mensaje</label>
              <textarea id="mensaje" name="mensaje" class="campo" rows="6" required maxlength="3000"></textarea>
              <p class="error" id="error-mensaje" role="alert"></p>
            </div>
            <div class="trampa" aria-hidden="true">
              <label for="sitio">No completes este campo</label>
              <input id="sitio" name="sitio" type="text" tabindex="-1" autocomplete="off">
            </div>
            <div class="grupo grupo--check">
              <input id="acepto" name="acepto" type="checkbox" required>
              <label for="acepto">Acepto el tratamiento de mis datos personales según la <a href="/privacidad">política de protección de datos personales</a>.</label>
              <p class="error" id="error-acepto" role="alert"></p>
            </div>
            <p><button class="boton" type="submit">Enviar mensaje</button></p>
            <p id="estado-form" class="estado" role="status" aria-live="polite"></p>
          </form>
        </div>

        <aside id="orientacion" class="tarjeta tarjeta--destacada" tabindex="-1">
          <h2>¿Fuiste víctima de una estafa virtual o un ciberdelito? Te orientamos</h2>
          <p>El Observatorio no recibe denuncias, pero estos pasos te pueden ayudar a actuar rápido:</p>
          <ol>
            <li><strong>Conservá las pruebas.</strong> Guardá capturas de pantalla, mensajes, enlaces, comprobantes de pago y números de cuenta o teléfono involucrados.</li>
            <li><strong>Avisá a tu banco o billetera virtual</strong> de inmediato para intentar bloquear o revertir operaciones y proteger tus cuentas.</li>
            <li><strong>Cambiá tus contraseñas</strong> y activá la verificación en dos pasos en las cuentas afectadas.</li>
            <li><strong>Hacé la denuncia</strong> ante la fiscalía o la dependencia policial de tu provincia, llevando las pruebas que reuniste.</li>
            <li><strong>Pedí acompañamiento</strong> a un familiar o a una persona de confianza. Ser víctima de una estafa no es motivo de vergüenza.</li>
          </ol>
          <p class="nota">Si hay una amenaza inmediata para tu seguridad o la de otra persona, comunicate con los servicios de emergencia de tu localidad.</p>
        </aside>
      </div>
    </section>`,
  };
}

function privacidad() {
  return {
    titulo: 'Protección de datos personales',
    descripcion:
      'Política de protección de datos personales de OFCA, Observatorio Federal de Ciberdelincuencia Argentina.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>Protección de datos personales</h1>
        <p>Esta política describe cómo se tratan los datos personales que se reciben a través de este sitio, en el marco de la normativa argentina de protección de datos personales.</p>
        <h2>Datos que recolectamos</h2>
        <p>Únicamente los datos que completás voluntariamente en el formulario de contacto: nombre y apellido, correo electrónico, motivo de la consulta y mensaje.</p>
        <h2>Finalidad</h2>
        <p>Responder tu consulta y gestionar la comunicación institucional. No usamos tus datos para publicidad ni los cedemos a terceros con fines comerciales.</p>
        <h2>Conservación</h2>
        <p>Los mensajes se conservan durante el tiempo necesario para atender la consulta y cumplir obligaciones de gestión documental.</p>
        <h2>Tus derechos</h2>
        <p>Podés solicitar el acceso, la rectificación o la supresión de tus datos escribiéndonos desde la sección de <a href="/contacto">contacto</a>. Asimismo, podés recurrir ante la autoridad de control en materia de protección de datos personales.</p>
        <h2>Cookies</h2>
        <p>El sitio público no utiliza cookies de seguimiento ni de publicidad. El acceso al equipo emplea una cookie técnica de sesión, necesaria para su funcionamiento.</p>
        <p class="nota">Este texto es una versión inicial y debe ser revisado por el área legal antes de la publicación definitiva.</p>
      </div>
    </section>`,
  };
}

function equipo() {
  return {
    titulo: 'Acceso al equipo',
    descripcion: 'Acceso restringido para integrantes del equipo del Observatorio.',
    noindex: true,
    scripts: ['/js/equipo.js'],
    cuerpo: `
    <section class="seccion">
      <div class="contenedor">
        <h1>Acceso al equipo</h1>

        <div id="vista-login" class="tarjeta tarjeta--angosta" hidden>
          <p>Ingresá con tus credenciales para acceder al portal interno.</p>
          <form id="form-login" class="formulario" novalidate>
            <div class="grupo">
              <label for="usuario">Usuario</label>
              <input id="usuario" class="campo" type="text" autocomplete="username" required>
            </div>
            <div class="grupo">
              <label for="clave">Contraseña</label>
              <input id="clave" class="campo" type="password" autocomplete="current-password" required>
            </div>
            <p><button class="boton" type="submit">Ingresar</button></p>
            <p id="error-login" class="error" role="alert"></p>
          </form>
        </div>

        <div id="vista-portal" hidden>
          <div class="portal__barra">
            <p>Sesión iniciada como <strong id="nombre-usuario"></strong></p>
            <button id="salir" class="boton boton--secundario" type="button">Cerrar sesión</button>
          </div>

          <h2>Gestión de tareas</h2>
          <form id="form-tarea" class="formulario formulario--fila" novalidate>
            <div class="grupo grupo--crece">
              <label for="titulo-tarea">Nueva tarea</label>
              <input id="titulo-tarea" class="campo" type="text" maxlength="160" required>
            </div>
            <div class="grupo">
              <label for="responsable-tarea">Responsable</label>
              <input id="responsable-tarea" class="campo" type="text" maxlength="80">
            </div>
            <div class="grupo">
              <label for="vence-tarea">Fecha límite</label>
              <input id="vence-tarea" class="campo" type="date">
            </div>
            <p><button class="boton" type="submit">Agregar tarea</button></p>
          </form>
          <p id="error-tarea" class="error" role="alert"></p>

          <div class="tablero" id="tablero"></div>

          <h2>Mensajes recibidos</h2>
          <div id="mensajes"><p>Cargando…</p></div>
        </div>
      </div>
    </section>`,
  };
}

function noEncontrada() {
  return {
    titulo: 'Página no encontrada',
    descripcion: 'La página que buscás no existe o fue movida.',
    status: 404,
    noindex: true,
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>No encontramos la página</h1>
        <p class="bajada">Es posible que el enlace esté incompleto o que la página haya cambiado de lugar.</p>
        <p><a class="boton" href="/">Volvé al inicio</a></p>
      </div>
    </section>`,
  };
}

const RUTAS = {
  '/': inicio,
  '/el-observatorio': elObservatorio,
  '/metodologia': metodologia,
  '/mapa': mapa,
  '/investigacion': investigacion,
  '/contacto': contacto,
  '/privacidad': privacidad,
  '/equipo': equipo,
};

function render(pathname) {
  const fn = RUTAS[pathname];
  const def = fn ? fn() : noEncontrada();
  return {
    status: def.status || 200,
    html: layout({
      ruta: fn ? pathname : '',
      titulo: def.titulo,
      descripcion: def.descripcion,
      cuerpo: def.cuerpo,
      scripts: def.scripts,
      modulos: def.modulos,
      estilos: def.estilos,
      noindex: def.noindex,
    }),
  };
}

export { render, RUTAS };
