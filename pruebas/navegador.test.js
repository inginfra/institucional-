// Pruebas de NAVEGADOR REAL (Chromium vía Playwright) contra el Worker ejecutado localmente en Node.
//   npm run test:navegador          (requiere Playwright y Chromium instalados)
// No prueban Cloudflare ni el despliegue real: para eso, ver scripts/prueba-produccion.mjs.
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { iniciarServidor } from './servidor-local.js';
import { validarTerritorial } from '../src/datos/ufeci2024.js';

async function cargarPlaywright() {
  const candidatos = [process.env.PLAYWRIGHT_DIR, '/opt/npm-tools/node_modules/', import.meta.url].filter(Boolean);
  for (const c of candidatos) {
    try {
      const base = c.startsWith('file:') || c.startsWith('/') ? c : `${c}/`;
      return createRequire(base.endsWith('/') || base.startsWith('file:') ? base : `${base}/`)('playwright');
    } catch { /* probar el siguiente */ }
  }
  return null;
}

const pw = await cargarPlaywright();
if (!pw) {
  console.log('OMITIDAS: Playwright no está instalado, no se ejecutó ninguna prueba de navegador.');
  process.exit(process.env.REQUIERE_NAVEGADOR ? 1 : 0);
}

const srv = await iniciarServidor();
const browser = await pw.chromium.launch();
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓', m); };
const MENSAJE = 'El informe consultado no publica datos desagregados para esta jurisdicción';

async function abrir(ruta = '/mapa', opciones = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: opciones.reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  const problemas = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemas.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`));
  if (opciones.antes) await opciones.antes(page);
  await page.goto(srv.url + ruta);
  if (!opciones.sinEsperar) await page.waitForSelector('#ofca-app[data-listo="true"]', { timeout: 8000 });
  return { ctx, page, problemas };
}
const txt = async (page, sel) => (await page.locator(sel).first().textContent()).replace(/\u00a0/g, ' ');

try {
  console.log('Carga y estructura');
  {
    const { ctx, page, problemas } = await abrir();
    ok((await page.locator('.mapa-svg path.jur').count()) === 24, 'el mapa dibuja 24 jurisdicciones como regiones SVG individuales');
    ok((await page.locator('.mapa-svg path.jur[tabindex="0"]').count()) === 24, 'las 24 jurisdicciones son enfocables con teclado');
    const etiquetas = await page.locator('.mapa-svg path.jur').evaluateAll((l) => l.map((e) => e.getAttribute('aria-label')));
    ok(etiquetas.every((e) => e.includes(MENSAJE)), 'cada jurisdicción declara en su etiqueta accesible que no hay datos desagregados');
    ok((await txt(page, '#ofca-kpis')).includes('34.468'), 'KPI con el total nacional 34.468');
    ok((await txt(page, '#ofca-kpis')).includes('+21,1'), 'KPI con la variación +21,1 %');
    ok((await txt(page, '#ofca-kpis')).includes('Fraude en línea') && (await txt(page, '#ofca-kpis')).includes('Marzo'), 'KPI de modalidad principal y mes pico');
    ok((await txt(page, 'main')).includes('Fuente: UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025'), 'fuente visible');
    ok((await page.locator('.barra').count()) === 6, 'gráfico de categorías con 6 barras');
    ok((await txt(page, '#ofca-categorias')).indexOf('Fraude en línea') < (await txt(page, '#ofca-categorias')).indexOf('Acoso'), 'barras ordenadas de mayor a menor');
    ok((await page.locator('#ofca-anual .col-g').count()) === 4, 'columnas interanuales 2021-2024');
    ok(await page.evaluate(() => document.documentElement.lang === 'es-AR'), 'html lang es-AR');
    ok((await page.locator('#ofca-tablas table').count()) === 3, 'tablas de datos de respaldo');
    const infinitas = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.getTiming().iterations === Infinity).length);
    ok(infinitas === 0, 'no hay animaciones infinitas ni destellos decorativos');
    ok(problemas.length === 0, `sin errores ni avisos de consola ni violaciones de CSP (${problemas.join(' | ') || 'ninguno'})`);
    await ctx.close();
  }

  console.log('Mapa: hover, selección y panel');
  {
    const { ctx, page } = await abrir();
    await page.hover('.jur[data-id="AR-X"]');
    const tip = page.locator('#ofca-tooltip');
    ok(await tip.isVisible(), 'el hover muestra el tooltip');
    const t = await tip.innerText();
    ok(t.includes('Córdoba') && t.includes(MENSAJE), 'tooltip con nombre y mensaje exacto de ausencia de datos');
    ok(!/\d{2,}/.test(t), 'el tooltip no muestra cifras inventadas');
    ok((await page.locator('.resalte--hover').getAttribute('d')).length > 10, 'la región resaltada se dibuja al pasar el cursor');
    await page.mouse.move(2, 2);
    ok(await tip.isHidden(), 'el tooltip se oculta al salir');

    await page.click('.jur[data-id="AR-X"]');
    ok((await page.getAttribute('.jur[data-id="AR-X"]', 'aria-pressed')) === 'true', 'el click selecciona la jurisdicción (aria-pressed)');
    let panel = await txt(page, '#ofca-panel');
    ok(panel.includes('Córdoba') && panel.includes('Datos territoriales no disponibles') && panel.includes(MENSAJE), 'el panel indica que no hay datos territoriales');
    ok(panel.includes('Dato nacional') && panel.includes('34.468') && panel.includes('No es un dato de la jurisdicción elegida'), 'el dato nacional está rotulado y separado del territorial');
    ok((await page.locator('.resalte--sel').getAttribute('d')).length > 10, 'la selección es persistente (borde ámbar)');
    await page.mouse.move(2, 2);
    ok((await page.getAttribute('.jur[data-id="AR-X"]', 'aria-pressed')) === 'true', 'la selección persiste al quitar el cursor');
    ok(await page.locator('#ofca-aviso-jurisdiccion').isVisible(), 'aviso: los gráficos muestran datos nacionales');
    ok((await page.inputValue('#ofca-sel-jur')) === 'AR-X', 'el selector de jurisdicción se sincroniza con el mapa');
    ok(page.url().includes('jurisdiccion=AR-X'), 'la selección queda en la URL');

    await page.click('.barra[data-id="phishing"]');
    ok((await txt(page, '#ofca-panel')).includes('1.563'), 'el panel respeta el filtro de categoría (dato nacional de Phishing)');
    await page.dispatchEvent('.jur[data-id="AR-A"]', 'click');
    ok((await txt(page, '#ofca-panel')).includes('Salta') && (await page.getAttribute('.barra[data-id="phishing"]', 'aria-pressed')) === 'true', 'cambiar de provincia mantiene los filtros del tablero');
    ok((await page.getAttribute('.jur[data-id="AR-X"]', 'aria-pressed')) === 'false', 'solo una jurisdicción queda seleccionada');
    await page.click('#ofca-panel >> text=Volver al resumen nacional');
    panel = await txt(page, '#ofca-panel');
    ok(panel.includes('Resumen nacional') && (await page.locator('.jur[aria-pressed="true"]').count()) === 0, 'volver al resumen nacional deselecciona');
    ok((await page.getAttribute('.barra[data-id="phishing"]', 'aria-pressed')) === 'true', 'el filtro de categoría sobrevive al volver al resumen nacional');
    await page.dispatchEvent('.jur[data-id="AR-C"]', 'click'); // CABA por la ruta accesible
    await page.click('.lupa__circulo'); // clic en la lupa = alternar CABA (la deselecciona)
    ok((await page.locator('.jur[aria-pressed="true"]').count()) === 0, 'la lupa de CABA alterna la selección de CABA');
    await page.click('.lupa__circulo');
    ok((await txt(page, '#ofca-panel')).includes('Ciudad Autónoma de Buenos Aires'), 'CABA se puede seleccionar con la lupa');
    await ctx.close();
  }

  console.log('Teclado');
  {
    const { ctx, page } = await abrir();
    await page.focus('.jur >> nth=0');
    ok(await page.locator('#ofca-tooltip').isVisible(), 'el foco por teclado muestra el tooltip');
    await page.keyboard.press('Tab');
    ok((await page.evaluate(() => document.activeElement.classList.contains('jur'))), 'Tab avanza entre jurisdicciones');
    const id = await page.evaluate(() => document.activeElement.getAttribute('data-id'));
    await page.keyboard.press('Enter');
    ok((await page.getAttribute(`.jur[data-id="${id}"]`, 'aria-pressed')) === 'true', 'Enter selecciona la jurisdicción enfocada');
    await page.keyboard.press('Space');
    ok((await page.getAttribute(`.jur[data-id="${id}"]`, 'aria-pressed')) === 'false', 'Espacio alterna la selección');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    ok((await page.locator('.jur[aria-pressed="true"]').count()) === 0, 'Escape limpia la selección');
    // gráfico mensual: recorrido con flechas
    await page.focus('#ofca-mensual .banda[tabindex="0"]');
    ok((await txt(page, '#ofca-tooltip')).includes('Enero de 2024') && (await txt(page, '#ofca-tooltip')).includes('3.531'), 'el gráfico mensual muestra el valor real al enfocar');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    ok((await txt(page, '#ofca-tooltip')).includes('Marzo de 2024') && (await txt(page, '#ofca-tooltip')).includes('4.312'), 'las flechas recorren los meses con valores reales');
    await page.keyboard.press('End');
    ok((await txt(page, '#ofca-tooltip')).includes('Diciembre'), 'End salta al último mes');
    await ctx.close();
  }

  console.log('Dashboard: filtros, unidades, tooltips');
  {
    const { ctx, page } = await abrir();
    await page.click('.barra[data-id="acoso"]');
    ok((await txt(page, '#ofca-kpis')).includes('1.458'), 'filtrar por categoría actualiza los KPI');
    ok((await page.locator('.barra.es-atenuada').count()) === 5 && (await page.locator('.barra.es-elegida').count()) === 1, 'las demás barras se atenúan');
    ok(await page.evaluate(() => document.activeElement.getAttribute('data-id') === 'acoso'), 'el foco se conserva en la barra tras filtrar');
    ok((await txt(page, '#ofca-mensual-nota')).includes('Acoso') && (await txt(page, '#ofca-mensual-nota')).includes('1.458'), 'la serie mensual sigue el filtro');
    ok((await txt(page, '#ofca-modalidades')).includes('Difusión no autorizada de imágenes íntimas') && (await txt(page, '#ofca-modalidades')).includes('340'), 'el detalle muestra la subcategoría publicada con su cantidad');
    ok((await txt(page, '#ofca-anual-nota')).includes('no la desagrega por categoría'), 'la serie anual aclara que no se desagrega por categoría');
    ok(page.url().includes('categoria=acoso'), 'el filtro queda en la URL');
    await page.click('#ofca-filtros >> text=Porcentaje');
    ok((await txt(page, '#ofca-kpis')).includes('4,2 %'), 'el modo porcentaje cambia los KPI');
    ok((await txt(page, '#ofca-categorias')).includes('4,2'), 'el modo porcentaje cambia las barras');
    await page.focus('#ofca-mensual .banda[tabindex="0"]');
    ok((await txt(page, '#ofca-tooltip')).includes('del total anual de la serie'), 'el tooltip mensual en porcentaje aclara el denominador');
    await page.click('#ofca-filtros >> text=Limpiar filtros');
    ok(await page.locator('#ofca-filtros button:has-text("Limpiar filtros")').isDisabled(), 'sin filtros, «Limpiar filtros» queda deshabilitado');
    ok((await txt(page, '#ofca-kpis')).includes('34.468') && page.url().endsWith('/mapa'), 'limpiar restaura el total nacional y la URL');
    await page.click('#ofca-comparar');
    ok((await page.locator('#ofca-mensual .serie-linea').count()) === 2 && (await txt(page, '#ofca-mensual-nota')).includes('suma'), 'la superposición con 2023 muestra la advertencia de discrepancia');
    await page.click('.barra[data-id="phishing"]');
    ok(await page.locator('#ofca-comparar').isDisabled() && (await page.locator('#ofca-mensual .serie-linea').count()) === 1, 'la comparación 2023 solo existe para el total');
    await page.click('.barra[data-id="otros"]');
    ok((await txt(page, '#ofca-modalidades')).includes('no desglosa'), '«Otros» declara que el informe no lo desglosa');
    await page.hover('.barra[data-id="otros"]');
    ok((await txt(page, '#ofca-tooltip')).includes('2.204'), 'tooltip de barras con el valor real');
    await page.hover('#ofca-anual .col-g >> nth=3');
    ok((await txt(page, '#ofca-tooltip')).includes('34.468') && (await txt(page, '#ofca-tooltip')).includes('+21,1'), 'tooltip interanual con valor y variación');
    ok((await txt(page, '#ofca-analisis')).includes('774') && (await txt(page, '#ofca-analisis')).includes('no se suma al total'), 'extorsión y ransomware se muestran aparte y sin sumar');
    ok((await txt(page, '#ofca-notas')).includes('Discrepancias internas del informe'), 'las discrepancias de la fuente se informan');
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/mapa#categoria=fraude-en-linea&jurisdiccion=AR-M&unidad=porcentaje');
    ok((await txt(page, '#ofca-panel')).includes('Mendoza') && (await txt(page, '#ofca-kpis')).includes('63,0 %'), 'el estado se restaura desde la URL compartida');
    await ctx.close();
  }

  console.log('Estados de carga, error y vacío');
  {
    const { ctx, page } = await abrir('/mapa', { sinEsperar: true, antes: (p) => p.route('**/api/estadisticas', async (r) => { await new Promise((f) => setTimeout(f, 1200)); r.continue(); }) });
    ok((await page.locator('#ofca-estado').innerText()).includes('Cargando'), 'estado de carga visible mientras llegan los datos');
    await page.waitForSelector('#ofca-app[data-listo="true"]', { timeout: 8000 });
    ok(await page.locator('#ofca-estado').isHidden(), 'el estado de carga desaparece al terminar');
    await ctx.close();
  }
  {
    let fallar = true;
    const { ctx, page } = await abrir('/mapa', { sinEsperar: true, antes: (p) => p.route('**/api/estadisticas', (r) => (fallar ? r.fulfill({ status: 500, body: 'x' }) : r.continue())) });
    await page.waitForSelector('#ofca-estado.estado-carga--error');
    ok((await page.locator('#ofca-estado').innerText()).includes('No pudimos cargar'), 'estado de error con mensaje claro');
    fallar = false;
    await page.click('#ofca-estado >> text=Reintentar');
    await page.waitForSelector('#ofca-app[data-listo="true"]');
    ok((await page.locator('.jur').count()) === 24, 'Reintentar recupera el tablero');
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/mapa', { sinEsperar: true, antes: (p) => p.route('**/api/estadisticas', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ categorias: [] }) })) });
    await page.waitForSelector('#ofca-estado.estado-carga--error');
    ok(true, 'datos vacíos o incompletos se tratan como error, no como un tablero en blanco');
    ok((await page.locator('#ofca-app .jur').count()) === 0, 'no se dibuja el mapa sin datos válidos');
    await ctx.close();
  }

  console.log('Datos territoriales futuros (fixture, NO son datos reales)');
  {
    const fixture = { fuente: { organismo: 'Organismo de prueba', titulo: 'Fixture de pruebas' }, periodo: { desde: '2024-01', hasta: '2024-12' }, unidad: 'reportes de prueba',
      universo: 'Solo para pruebas', cobertura: 'Solo Córdoba', categorias: [{ id: 'fraude-en-linea', cantidad: 70 }, { id: 'phishing', cantidad: 30 }] };
    const { ctx, page } = await abrir('/mapa', { antes: (p) => p.route('**/api/estadisticas', async (r) => {
      const res = await r.fetch(); const j = await res.json();
      j.territorial = { ...j.territorial, disponible: true, estado: 'Datos territoriales disponibles', jurisdicciones: { 'AR-X': fixture } };
      if (validarTerritorial(j.territorial).length) throw new Error('el fixture debería ser válido');
      r.fulfill({ response: res, json: j });
    }) });
    await page.hover('.jur[data-id="AR-X"]');
    ok((await txt(page, '#ofca-tooltip')).includes('Dato territorial verificado') && (await txt(page, '#ofca-tooltip')).includes('100'), 'con datos verificados, el tooltip muestra el dato territorial con su fuente');
    await page.hover('.jur[data-id="AR-M"]');
    ok((await txt(page, '#ofca-tooltip')).includes(MENSAJE), 'las jurisdicciones sin dato siguen mostrando el mensaje de ausencia');
    await page.click('.jur[data-id="AR-X"]');
    const panel = await txt(page, '#ofca-panel');
    ok(panel.includes('Dato territorial verificado') && panel.includes('70,0 %') && panel.includes('Dato nacional') && panel.includes('Organismo de prueba'), 'la ficha territorial y el dato nacional conviven rotulados por separado');
    await ctx.close();
  }

  console.log('Responsive, movimiento reducido y estilos');
  {
    const { ctx, page } = await abrir('/mapa', { reducedMotion: 'reduce' });
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector('.jur')).transitionDuration);
    ok(/^0s(, 0s)*$/.test(dur), `prefers-reduced-motion desactiva las transiciones del mapa (${dur})`);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.barra__relleno')).animationName);
    ok(anim === 'none', 'prefers-reduced-motion desactiva la animación de barras');
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir();
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector('.jur')).transitionDuration);
    ok(dur !== '0s', 'sin preferencia de movimiento reducido, el resaltado tiene transición suave');
    await ctx.close();
  }
  for (const [w, h] of [[375, 740], [768, 900], [1440, 900]]) {
    const { ctx, page, problemas } = await abrir();
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(desborde <= 1, `sin scroll horizontal a ${w} px (desborde ${desborde})`);
    const caja = await page.locator('.mapa-svg').boundingBox();
    ok(caja && caja.width > 200 && caja.width <= w, `el mapa es visible y se adapta a ${w} px (${Math.round(caja.width)} px)`);
    if (w === 375) {
      await page.dispatchEvent('.jur[data-id="AR-V"]', 'click');
      ok((await txt(page, '#ofca-panel')).includes('Tierra del Fuego'), 'la selección funciona en pantalla chica');
      const barra = await page.locator('.barra').first().boundingBox();
      ok(barra.width <= w, 'las barras caben en pantalla chica');
    }
    ok(problemas.length === 0, `sin errores de consola a ${w} px`);
    await ctx.close();
  }

  console.log('Páginas restantes');
  {
    const { ctx, page, problemas } = await abrir('/', { sinEsperar: true });
    ok((await page.locator('.marca__logo').count()) === 1 && (await page.locator('link[rel="icon"][href="/favicon.svg"]').count()) === 1, 'logo y favicon propios de OFCA');
    ok((await txt(page, '.cifras')).includes('34.468'), 'el inicio muestra las cifras 2024');
    ok(problemas.length === 0, 'el inicio no genera errores de consola');
    await ctx.close();
  }

  console.log(`\n${n} comprobaciones de navegador correctas (Chromium ${browser.version()}).`);
} catch (err) {
  console.error('\nFALLÓ:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await srv.cerrar();
}
