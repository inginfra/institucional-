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
- `test.js`: pruebas.

## Configuración y secretos

- `ADMIN_USER`: se define en `wrangler.toml` (valor `equipo`).
- `ADMIN_PASSWORD`: **secreto**. En local va en `.dev.vars` (excluido de Git); en producción se carga con `wrangler secret put` o desde el panel del Worker. Sin este secreto el acceso al equipo queda deshabilitado.
- No guardes contraseñas ni tokens en el repositorio.

## Publicación

- **Worker de Cloudflare:** `institucional`, con despliegue automático desde la rama `main` mediante la integración de Cloudflare con GitHub.
- **URL temporal gratuita:** `https://institucional.<tu-subdominio>.workers.dev` (el subdominio figura en el panel de Cloudflare).
- **Dominio definitivo:** se agrega después sin reconstruir el sitio; pasos en la sección 12 del [instructivo](INSTRUCTIVO_CMD.md).
- **Datos del mapa:** de demostración, no son cifras oficiales.
