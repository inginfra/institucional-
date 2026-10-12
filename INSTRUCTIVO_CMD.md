# Instructivo: vista previa local desde CMD (Windows)

Esta guía te permite ejecutar el Observatorio **en tu computadora** y probarlo en el navegador.

> **Vista previa local ≠ versión publicada en Cloudflare.**
> Los comandos de las secciones 1 a 10 usan siempre el modo `--local`: levantan una copia del sitio con una base de datos simulada en tu PC (carpeta `.wrangler\`). **No se conectan a Cloudflare, no usan tu cuenta y no modifican la versión de producción.** Al cerrar CMD, el sitio local deja de funcionar. No depende de ningún servidor ejecutándose en otro lado.
> Los comandos que sí afectan producción están únicamente en la sección 11 y están marcados con ⚠.

---

## 1. Requisitos previos

- **Node.js 22 o superior** (versión LTS). Descarga: https://nodejs.org
- **Git para Windows**. Descarga: https://git-scm.com/download/win

Abrí **CMD** (tecla Windows, escribí `cmd`, Enter) y verificá:

```bat
node --version
npm --version
git --version
```

Node debe mostrar `v22.x` o mayor. Si algún comando no se reconoce, andá a la sección 10.

## 2. Clonar el repositorio

```bat
cd %USERPROFILE%\Documents
git clone https://github.com/inginfra/institucional-.git
```

Si el repositorio es privado, Git te pedirá iniciar sesión en GitHub la primera vez.

## 3. Entrar en la carpeta del proyecto

```bat
cd institucional-
dir wrangler.toml
```

Si `dir` muestra el archivo `wrangler.toml`, estás en el lugar correcto.

## 4. Instalar dependencias

El proyecto usa Wrangler (la herramienta de Cloudflare) para simular Workers y D1 en tu PC:

```bat
npm install
```

## 5. Configurar el entorno

La contraseña del *Acceso al equipo* se guarda en un archivo local `.dev.vars`, que **está excluido del repositorio** (`.gitignore`) y nunca se sube a GitHub.

```bat
copy .dev.vars.example .dev.vars
notepad .dev.vars
```

En el Bloc de notas, reemplazá el valor después de `ADMIN_PASSWORD=` por una clave de prueba tuya, guardá y cerrá. No uses una contraseña real que uses en otros sitios.

El usuario del portal es `equipo` (definido en `wrangler.toml`). Si no creás `.dev.vars`, el portal de equipo queda **deshabilitado** (no hay contraseña por defecto).

## 6. Iniciar el servidor

```bat
npm start
```

Este comando primero crea las tablas en la base **local** y luego inicia Wrangler en `127.0.0.1:8787` (solo accesible desde tu computadora). Dejá la ventana abierta mientras probás.

## 7. Abrir el sitio

Abrí en tu navegador: **http://localhost:8787**

Ese es el puerto configurado en `npm start`. Si lo cambiás (sección 10), usá el nuevo número.

## 8. Verificar el funcionamiento

- **Páginas:** recorré Inicio, El Observatorio, Metodología, Mapa del Ciberdelito, Investigación, Contacto y el enlace *Acceso al equipo* del pie de página.
- **Mapa interactivo:** en `/mapa` cambiá la categoría y hacé clic en una provincia; debe aparecer su detalle. Los valores son de demostración y el sitio lo avisa.
- **Formulario de contacto:** en `/contacto` probá enviarlo vacío (errores en español). Luego completalo, marcá la casilla de aceptación y enviá: debe aparecer "Recibimos tu mensaje…". El mensaje queda en la base **local**.
- **Portal interno:** en `/equipo` ingresá con usuario `equipo` y la clave que pusiste en `.dev.vars`. Creá una tarea, movela entre columnas, eliminala, y comprobá que aparezca el mensaje de contacto que enviaste.

**Prueba automática (opcional)**, en otra ventana de CMD dentro de la carpeta del proyecto:

```bat
npm test
```

Ejecuta el código del Worker contra una base SQLite en memoria (no toca tu base local ni Cloudflare). Al final debe decir cuántas comprobaciones fueron correctas. Requiere Node 22 o superior.

## 9. Detener el servidor

En la ventana donde corre, presioná **Ctrl + C**. Si CMD pregunta "¿Desea terminar el trabajo por lotes (S/N)?", respondé `S`.

Para borrar los datos de prueba locales (mensajes, tareas y sesiones):

```bat
rmdir /s /q .wrangler
```

## 10. Solucionar errores comunes

**`'node' no se reconoce como un comando interno o externo`**
Instalá Node.js (https://nodejs.org), **cerrá y reabrí CMD** y repetí `node --version`.

**`'git' no se reconoce…`**
Instalá Git para Windows, cerrá y reabrí CMD.

**`'wrangler' no se reconoce` / `Cannot find module` / `npm start` falla enseguida**
Faltan las dependencias o estás en la carpeta equivocada. Verificá con `dir wrangler.toml` y ejecutá `npm install`.

**Puerto ocupado (`Address already in use` / `EADDRINUSE`)**
Usá otro puerto:

```bat
npm run migrar:local
npx wrangler dev --local --ip 127.0.0.1 --port 8788
```

y abrí http://localhost:8788. Para ver qué usa el 8787:

```bat
netstat -ano | findstr :8787
taskkill /PID <NUMERO_PID> /F
```

**El login dice "Usuario o contraseña incorrectos" o no deja ingresar**
Revisá que exista `.dev.vars` con `ADMIN_PASSWORD=...` (sin espacios alrededor del `=`) y **reiniciá** el servidor (Ctrl + C y `npm start`) después de editarlo. Con 5 intentos fallidos el acceso se bloquea unos 10 minutos: borrá la base local con `rmdir /s /q .wrangler` y volvé a iniciar.

**`npm test` falla con "Cannot find module 'node:sqlite'"**
Tu Node es anterior a la versión 22. Actualizalo y verificá con `node --version`.

**Variables de entorno incorrectas**
En la vista previa local no se usan variables de CMD: todo sale de `wrangler.toml` y `.dev.vars`. No hace falta ejecutar `set`.

**La página carga sin estilos o el mapa no aparece**
Recargá con **Ctrl + F5** y mirá la consola de CMD en busca de errores.

---

## 11. Versión publicada en Cloudflare (producción)

> ⚠ Esta sección **sí afecta producción**. No la ejecutes si solo querés la vista previa.

- **Worker:** `institucional` (Cloudflare Workers). **Base de datos:** D1 `observatorio-ciberdelito`.
- **URL temporal gratuita:** `https://institucional.<tu-subdominio>.workers.dev`. El subdominio exacto se ve en el panel de Cloudflare, en *Workers y Pages → institucional*.
- **Despliegue automático:** cada `push` a la rama `main` de https://github.com/inginfra/institucional-.git lo despliega la integración de Cloudflare con GitHub. En el panel del Worker, *Configuración → Compilaciones*, el comando de despliegue debe ser:

```text
npx wrangler d1 migrations apply observatorio-ciberdelito --remote && npx wrangler deploy
```

- **Secreto obligatorio:** `ADMIN_PASSWORD`, cargado en el panel del Worker (*Configuración → Variables y secretos → Agregar → tipo Secreto*). No se escribe en el código ni en GitHub. Sin él, el acceso al equipo queda deshabilitado.

**Despliegue manual desde tu PC (alternativa):**

```bat
npx wrangler login
npm run migrar:produccion
npx wrangler secret put ADMIN_PASSWORD
npm run desplegar
```

`wrangler secret put` te pide la contraseña por teclado y la guarda cifrada en Cloudflare.

## 12. Cambiar al dominio definitivo (más adelante)

El sitio no depende de la URL temporal, así que el cambio no requiere reconstruirlo:

1. El dominio debe estar agregado a tu cuenta de Cloudflare (zona con DNS en Cloudflare).
2. En el panel: *Workers y Pages → institucional → Configuración → Dominios y rutas → Agregar → Dominio personalizado*, e ingresá el dominio (por ejemplo `observatorio.tudominio.org`). Cloudflare crea el registro DNS y emite el certificado HTTPS automáticamente.
3. Alternativa por código: agregá a `wrangler.toml` la línea `routes = [{ pattern = "observatorio.tudominio.org", custom_domain = true }]` y hacé `push` a `main`.
4. Mantené `workers_dev = true` mientras dure la transición: la URL temporal sigue funcionando junto con el dominio nuevo. Cuando ya no la necesites, ponelo en `false`.
5. Verificá que `https://tu-dominio/salud` responda y que el login del equipo funcione (la cookie de sesión se emite como `Secure` al usar HTTPS).
