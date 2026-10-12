'use strict';
// Plantillas del sitio. Todo el contenido visible está en español argentino (es-AR).

const SITE = {
  nombre: 'Observatorio Federal del Ciberdelito',
  corto: 'Observatorio del Ciberdelito',
  descripcion:
    'Observatorio federal que analiza el ciberdelito y las estafas virtuales en las provincias argentinas, con metodología abierta e investigación independiente.',
};

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

function layout({ ruta, titulo, descripcion, cuerpo, scripts = [], noindex = false }) {
  const tituloCompleto = ruta === '/' ? `${SITE.nombre}` : `${titulo} | ${SITE.corto}`;
  const desc = descripcion || SITE.descripcion;
  const nav = NAV.map(
    (n) =>
      `<li><a href="${n.href}"${n.href === ruta ? ' aria-current="page"' : ''}>${n.texto}</a></li>`
  ).join('');
  const sc = scripts.map((s) => `<script src="${s}" defer></script>`).join('\n  ');
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
  <meta name="theme-color" content="#0b2545">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230b2545'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%2313c4a3' stroke-width='3'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <a class="saltar" href="#contenido">Saltar al contenido principal</a>
  <header class="cabecera">
    <div class="contenedor cabecera__fila">
      <a class="marca" href="/" aria-label="${esc(SITE.nombre)}: ir al inicio">
        <span class="marca__icono" aria-hidden="true"></span>
        <span class="marca__texto">${esc(SITE.nombre)}</span>
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
        <p>Información independiente y rigurosa para entender y reducir el ciberdelito en todo el país.</p>
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
    </div>
  </footer>
  <script src="/js/menu.js" defer></script>
  ${sc}
</body>
</html>`;
}

// ---------- Páginas ----------

function inicio() {
  return {
    titulo: SITE.nombre,
    cuerpo: `
    <section class="hero">
      <div class="contenedor hero__grid">
        <div>
          <p class="etiqueta">Observatorio independiente</p>
          <h1>Datos abiertos y análisis riguroso para enfrentar el ciberdelito en todo el país</h1>
          <p class="bajada">Relevamos, comparamos y explicamos cómo se manifiestan las estafas virtuales y otros delitos informáticos en cada provincia, para que la sociedad y las instituciones decidan con mejor información.</p>
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
        <h2>Qué hacemos</h2>
        <div class="grilla grilla--3">
          <article class="tarjeta">
            <h3>Medimos</h3>
            <p>Integramos fuentes públicas y registros institucionales con criterios comunes, para comparar provincias sin distorsiones.</p>
          </article>
          <article class="tarjeta">
            <h3>Investigamos</h3>
            <p>Estudiamos modalidades, perfiles de víctimas y brechas de respuesta con enfoque federal e interdisciplinario.</p>
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
          <li><strong>Protección de datos personales.</strong> Trabajamos con información agregada y anonimizada.</li>
          <li><strong>Independencia.</strong> Nuestros informes no responden a intereses comerciales ni partidarios.</li>
          <li><strong>Enfoque federal.</strong> Ninguna provincia queda afuera de la mirada.</li>
        </ul>
      </div>
    </section>`,
  };
}

function elObservatorio() {
  return {
    titulo: 'El Observatorio',
    descripcion:
      'Quiénes somos, para qué existimos y cómo nos organizamos: un observatorio federal e independiente sobre ciberdelito y estafas virtuales en Argentina.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>El Observatorio</h1>
        <p class="bajada">Somos un equipo interdisciplinario que estudia el ciberdelito desde una perspectiva federal, con evidencia verificable y lenguaje accesible.</p>
        <h2>Misión</h2>
        <p>Producir conocimiento confiable sobre el ciberdelito y las estafas virtuales en las provincias argentinas, y ponerlo a disposición de la sociedad, la academia y el Estado.</p>
        <h2>Objetivos</h2>
        <ul>
          <li>Construir y mantener el Mapa Federal del Ciberdelito con criterios metodológicos públicos.</li>
          <li>Documentar modalidades delictivas emergentes y su evolución territorial.</li>
          <li>Identificar brechas en la prevención, la denuncia y la respuesta institucional.</li>
          <li>Difundir recomendaciones prácticas para reducir riesgos.</li>
        </ul>
        <h2>Gobernanza</h2>
        <p>El Observatorio se rige por principios de independencia editorial, transparencia en el uso de fuentes y protección de datos personales. Las decisiones metodológicas se documentan y se publican junto con cada informe.</p>
        <h2>Seguridad de la información</h2>
        <p>Aplicamos prácticas de desarrollo seguro (DevSecOps) y controles alineados con estándares reconocidos, como la norma ISO/IEC 27001, para resguardar la información que gestionamos.</p>
        <p><a class="boton" href="/contacto">Escribinos</a></p>
      </div>
    </section>`,
  };
}

function metodologia() {
  return {
    titulo: 'Metodología',
    descripcion:
      'Conocé cómo trabajamos: fuentes, criterios de clasificación, tratamiento de datos personales y límites de los indicadores del Observatorio.',
    cuerpo: `
    <section class="seccion">
      <div class="contenedor contenido-texto">
        <h1>Metodología</h1>
        <p class="bajada">Un indicador solo es útil si se entiende cómo se construyó. Esta sección explica nuestro proceso de punta a punta.</p>

        <h2>1. Fuentes</h2>
        <p>Trabajamos con tres tipos de fuentes: registros institucionales publicados por organismos oficiales, relevamientos propios y fuentes abiertas analizadas mediante técnicas de OSINT (inteligencia de fuentes abiertas). Toda fuente se identifica, se fecha y se archiva.</p>

        <h2>2. Clasificación de los hechos</h2>
        <p>Agrupamos los hechos en categorías comunes —por ejemplo, estafas virtuales, suplantación de identidad y extorsión digital— para poder comparar provincias, aun cuando los registros locales usen denominaciones distintas.</p>

        <h2>3. Normalización</h2>
        <p>Los valores se expresan en relación con la población y se ajustan por diferencias en la cantidad de denuncias formales. De este modo se evita confundir mayor conectividad o mayor propensión a denunciar con mayor incidencia delictiva.</p>

        <h2>4. Subregistro y límites</h2>
        <p>Una parte importante de los ciberdelitos no se denuncia. Por eso, los indicadores describen lo registrado y lo relevado, no la totalidad de los hechos. Cada publicación detalla sus limitaciones.</p>

        <h2>5. Protección de datos personales</h2>
        <p>Solo trabajamos con información agregada o anonimizada. No publicamos datos que permitan identificar a víctimas ni a terceros, en cumplimiento de la normativa argentina de protección de datos personales.</p>

        <h2>6. Control de calidad y trazabilidad</h2>
        <p>Los procesos de integración de datos se automatizan mediante CI/CD (integración y entrega continuas) con pruebas automáticas y revisión por pares. Cada cambio queda registrado y puede auditarse.</p>

        <p><a class="boton" href="/mapa">Explorá el Mapa Federal del Ciberdelito</a></p>
      </div>
    </section>`,
  };
}

function mapa() {
  return {
    titulo: 'Mapa del Ciberdelito',
    descripcion:
      'Explorá el Mapa Federal del Ciberdelito: una vista esquemática de las 24 jurisdicciones argentinas con indicadores por categoría.',
    scripts: ['/js/mapa.js'],
    cuerpo: `
    <section class="seccion">
      <div class="contenedor">
        <h1>Mapa del Ciberdelito</h1>
        <p class="bajada">Vista federal esquemática: cada recuadro representa una jurisdicción. Elegí una categoría y seleccioná una provincia para ver el detalle.</p>
        <div class="aviso" role="note">
          <strong>Datos de demostración.</strong> Los valores que se muestran son ilustrativos y no representan cifras oficiales. Se reemplazarán por los indicadores reales cuando se complete la integración de fuentes descripta en la <a href="/metodologia">metodología</a>.
        </div>
        <div class="mapa-layout">
          <div>
            <label for="categoria" class="etiqueta-campo">Categoría</label>
            <select id="categoria" class="campo"></select>
            <div id="mapa" class="mapa" role="group" aria-label="Mapa esquemático de las jurisdicciones argentinas"></div>
            <div class="leyenda" aria-hidden="true">
              <span>Menor</span><span class="leyenda__barra"></span><span>Mayor</span>
            </div>
          </div>
          <aside class="tarjeta" aria-live="polite" id="detalle">
            <h2>Detalle</h2>
            <p>Seleccioná una provincia en el mapa.</p>
          </aside>
        </div>
        <noscript><p class="aviso">Para ver el mapa interactivo necesitás habilitar JavaScript en tu navegador.</p></noscript>
        <h2>Cómo leer el mapa</h2>
        <p>El índice va de 0 a 100 y es relativo: compara jurisdicciones entre sí dentro de una misma categoría. No indica cantidad de casos ni permite comparar categorías distintas.</p>
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
      'Escribinos al Observatorio del Ciberdelito y encontrá orientación inicial si fuiste víctima de una estafa virtual o un ciberdelito.',
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
      'Política de protección de datos personales del Observatorio Federal del Ciberdelito.',
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
      noindex: def.noindex,
    }),
  };
}

module.exports = { render, RUTAS };
