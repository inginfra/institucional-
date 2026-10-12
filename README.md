# Observatorio Federal del Ciberdelito

Sitio web del Observatorio (español argentino, es-AR): inicio, El Observatorio, metodología, Mapa del Ciberdelito, investigación, contacto y acceso interno al equipo con gestión de tareas.

Servidor Node.js sin dependencias externas (Node 18 o superior).

## Vista previa local

Para ejecutar el sitio en tu computadora con Windows (CMD) seguí el [instructivo paso a paso](INSTRUCTIVO_CMD.md). La vista previa local es independiente de cualquier versión publicada.

Resumen rápido:

```bat
set HOST=127.0.0.1
npm start
```

Luego abrí http://localhost:3000.

## Pruebas

```bat
npm test
```

## Estructura

- `server.js`: servidor HTTP, API y almacenamiento en `data/`.
- `views.js`: páginas y plantilla (todo el contenido en es-AR).
- `public/`: estilos y scripts del navegador.
- `test.js`: pruebas de humo.

## Variables de entorno

`ADMIN_USER`, `ADMIN_PASSWORD`, `PORT`, `HOST`, `COOKIE_SECURE`, `DATA_DIR`. Ver el instructivo. No guardes contraseñas en el repositorio.

## Estado de la publicación

- **GitHub:** pendiente de publicación.
- **Cloudflare:** pendiente. Requiere adaptar el almacenamiento (hoy son archivos JSON) a los servicios de Cloudflare.
- **Datos del mapa:** de demostración, no son cifras oficiales.
