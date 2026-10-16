# Observatorio Federal del Ciberdelito

Sitio web del Observatorio (español argentino, es-AR): inicio, El Observatorio, metodología, Mapa del Ciberdelito, investigación, contacto y acceso interno al equipo con gestión de tareas.

Corre sobre **Cloudflare Workers** con base de datos **Cloudflare D1**.

- Repositorio: https://github.com/inginfra/institucional-

## Vista previa local

Para ejecutar el sitio en tu computadora con Windows (CMD), seguí el [instructivo paso a paso](INSTRUCTIVO_CMD.md). La vista previa local es independiente de la versión publicada en Cloudflare y no la modifica.

Resumen rápido:

```bat
git clone https://github.com/inginfra/institucional-.git
cd institucional-
npm install
copy .dev.vars.example .dev.vars
npm start
```

Luego abrí http://localhost:8787 (editá `.dev.vars` antes para definir tu clave de prueba).

## Pruebas

```bat
npm test
```

Requiere Node 22 o superior. Ejecuta el código del Worker contra SQLite (el motor de D1); no reemplaza una verificación en Cloudflare.

## Estructura

- `src/worker.js`: Worker (rutas, API, sesiones y acceso a D1).
- `src/views.js`: páginas y plantilla (todo el contenido en es-AR).
- `public/`: estilos y scripts del navegador.
- `migrations/`: esquema de la base D1.
- `wrangler.toml`: configuración de Cloudflare.
- `.github/workflows/pruebas.yml`: pruebas automáticas en GitHub.
- `src/datos/ufeci2024.js`: **fuente única** de las estadísticas (UFECI, Informe 2024), con controles de integridad.
- `public/js/ofca/`: módulos del mapa interactivo y del tablero (mapa SVG, gráficos, panel, filtros, tooltips).
- `public/data/argentina-jurisdicciones.json`: geometrías de las 24 jurisdicciones (generadas con `scripts/generar-geometrias.mjs`).
- `docs/FUENTE_UFECI_2024.md`: verificación del informe, variables, límites y discrepancias.
- `test.js`, `pruebas/`: pruebas (ver «Pruebas» más abajo).

## Configuración y secretos

- `ADMIN_USER`: se define en `wrangler.toml` (valor `equipo`).
- `ADMIN_PASSWORD`: **secreto**. En local va en `.dev.vars` (excluido de Git); en producción se carga con `wrangler secret put` o desde el panel del Worker. Sin este secreto el acceso al equipo queda deshabilitado.
- No guardes contraseñas ni tokens en el repositorio.

## Publicación

- **Worker de Cloudflare:** `institucional`, con despliegue automático desde la rama `main` mediante la integración de Cloudflare con GitHub.
- **URL temporal gratuita:** **https://institucional.infra-ofca.workers.dev**.
- **Dominio definitivo:** se agrega después sin reconstruir el sitio; pasos en la sección 12 del [instructivo](INSTRUCTIVO_CMD.md).
- **Datos del mapa y del tablero:** reales, tomados de *UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025*. Son reportes recibidos por UFECI a nivel nacional. **El informe no publica datos por provincia**: el mapa permite navegar entre las 24 jurisdicciones pero informa que no hay datos territoriales. Ver [docs/FUENTE_UFECI_2024.md](docs/FUENTE_UFECI_2024.md).

## Pruebas

| Comando | Qué es | Qué NO prueba |
|---|---|---|
| `npm test` | **Local, en Node:** Worker real con SQLite en memoria (rutas, formulario, sesión, tareas, cabeceras) + pruebas unitarias de datos, selectores, formato, estado y geometrías. Corre también en GitHub Actions. | Cloudflare ni D1 reales. |
| `npm run test:navegador` | **Local, navegador real** (Chromium vía Playwright) contra el Worker en Node: hover, selección, teclado, filtros, estados de carga/error, responsive, movimiento reducido, CSP. Requiere Playwright (`PLAYWRIGHT_DIR` si no está en el proyecto). | Producción. |
| `npm run probar:produccion` | **Producción:** consulta la URL pública (requiere `ADMIN_PASSWORD` para las pruebas del portal). | — |

## Cómo se incorporarían datos territoriales

Cargar las cifras en `TERRITORIAL.jurisdicciones` (`src/datos/ufeci2024.js`) indexadas por código ISO 3166-2, con fuente, período, unidad, universo, cobertura y cantidades por categoría. `validarTerritorial()` rechaza entradas incompletas, tasas y rankings sin denominador verificado. El mapa y el panel muestran entonces el dato territorial, siempre separado del nacional.
