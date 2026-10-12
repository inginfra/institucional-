# Instructivo: vista previa local desde CMD (Windows)

Esta guía te permite ejecutar el Observatorio **en tu propia computadora** y probarlo en el navegador.

> **Vista previa local ≠ versión publicada.**
> Todo lo que hagas acá corre solo en tu PC (`localhost`), usa su propia carpeta `data\` y **no toca ninguna versión publicada**. Cuando cierres la ventana de CMD, el servidor se detiene. No depende de ningún servidor ejecutándose en otro lado.

Reemplazá `<TU_USUARIO>` y `<TU_REPO>` por los datos reales de tu repositorio de GitHub cuando lo hayas publicado.

---

## 1. Requisitos previos

Necesitás:

- **Node.js 18 o superior** (recomendado: versión LTS actual). Descarga: https://nodejs.org
- **Git para Windows**. Descarga: https://git-scm.com/download/win

Abrí **CMD** (tecla Windows, escribí `cmd`, Enter) y verificá:

```bat
node --version
npm --version
git --version
```

Tiene que mostrar números de versión. El de Node debe ser `v18.x` o mayor. Si algún comando dice que "no se reconoce", andá a la sección 10.

## 2. Clonar el repositorio

```bat
cd %USERPROFILE%\Documents
git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git
```

Si el repositorio es privado, Git te va a pedir que inicies sesión en GitHub la primera vez.

## 3. Entrar en la carpeta del proyecto

```bat
cd <TU_REPO>
```

El proyecto está en la raíz del repositorio. Si en tu repositorio quedó dentro de una subcarpeta `observatorio`, entrá también en ella (`cd observatorio`). Comprobalo con:

```bat
dir server.js
```

Si lista el archivo, estás en el lugar correcto.

## 4. Instalar dependencias

Este proyecto **no tiene dependencias externas**: usa solo Node.js. No hace falta `npm install`. Si lo ejecutás, no instala nada y no da error:

```bat
npm install
```

## 5. Configurar el entorno

El servidor lee estas variables (todas opcionales):

| Variable | Para qué sirve | Valor por defecto |
|---|---|---|
| `ADMIN_PASSWORD` | Contraseña del *Acceso al equipo* | Se genera una al azar en cada inicio y se muestra en la consola |
| `ADMIN_USER` | Usuario del *Acceso al equipo* | `equipo` |
| `PORT` | Puerto local | `3000` |
| `HOST` | Interfaz de red | `0.0.0.0` |
| `COOKIE_SECURE` | Poné `1` solo si el sitio se sirve por HTTPS | sin definir |

Para la vista previa local, definilas **solo en la ventana de CMD actual** (se borran al cerrarla, así no queda ninguna contraseña guardada en archivos ni en el repositorio):

```bat
set HOST=127.0.0.1
set ADMIN_PASSWORD=elegi-una-clave-solo-para-probar
```

`HOST=127.0.0.1` hace que el sitio sea accesible únicamente desde tu computadora, no desde otros equipos de tu red.

> Si no definís `ADMIN_PASSWORD`, no pasa nada: el servidor genera una temporal y la imprime al iniciar. No escribas contraseñas reales en archivos del repositorio.

## 6. Iniciar el servidor

```bat
npm start
```

Es equivalente a `node server.js`. Deberías ver:

```text
Observatorio del Ciberdelito en http://localhost:3000
Acceso al equipo: usuario "equipo"
```

Dejá esta ventana abierta mientras probás el sitio.

## 7. Abrir el sitio

Abrí en tu navegador: **http://localhost:3000**

Eso es válido mientras no hayas cambiado `PORT`. Si definiste otro puerto (por ejemplo `set PORT=3001`), usá ese número en la URL.

## 8. Verificar el funcionamiento

- **Páginas:** recorré Inicio, El Observatorio, Metodología, Mapa del Ciberdelito, Investigación, Contacto y el enlace *Acceso al equipo* del pie de página.
- **Mapa interactivo:** en `/mapa` cambiá la categoría y hacé clic en una provincia; debe aparecer su detalle. Los datos son de demostración y el sitio lo avisa.
- **Formulario de contacto:** en `/contacto`, probá enviarlo vacío (deben aparecer errores en español). Completalo, marcá la casilla de aceptación y enviá: debe mostrar "Recibimos tu mensaje…". El mensaje se guarda en `data\mensajes.json` de tu copia local.
- **Portal interno:** en `/equipo` ingresá con el usuario `equipo` y la contraseña que definiste en el paso 5 (o la que se imprimió en la consola). Probá crear una tarea, moverla entre columnas, eliminarla, y revisá que aparezca el mensaje de contacto que enviaste.

**Prueba automática (opcional).** En una segunda ventana de CMD, dentro de la carpeta del proyecto:

```bat
npm test
```

Usa una carpeta de datos temporal y su propio puerto, así que no interfiere con tu vista previa ni con tus datos. Al final debe decir que todas las comprobaciones fueron correctas.

## 9. Detener el servidor

En la ventana donde corre el servidor, presioná **Ctrl + C**. Si CMD pregunta "¿Desea terminar el trabajo por lotes (S/N)?", respondé `S`.

## 10. Solucionar errores comunes

**`'node' no se reconoce como un comando interno o externo`**
Node.js no está instalado o CMD no lo detecta. Instalalo desde https://nodejs.org, **cerrá y volvé a abrir CMD** y repetí `node --version`.

**`'git' no se reconoce…`**
Instalá Git para Windows, cerrá y reabrí CMD.

**`Error: listen EADDRINUSE: address already in use`** (puerto ocupado)
Opción rápida, usar otro puerto:

```bat
set PORT=3001
npm start
```

y abrí http://localhost:3001. Para liberar el 3000, buscá qué proceso lo usa:

```bat
netstat -ano | findstr :3000
```

El último número de la línea es el PID. Cerralo con:

```bat
taskkill /PID <NUMERO_PID> /F
```

**`Cannot find module`… o `package.json` no encontrado**
Estás en la carpeta equivocada. Verificá con `dir server.js` y, si no aparece, volvé al paso 3.

**El login del portal dice "Usuario o contraseña incorrectos"**
Las variables `set` valen solo en esa ventana de CMD y hasta que la cierres. Si abriste una ventana nueva, volvé a definir `ADMIN_PASSWORD` antes de `npm start`, o usá la contraseña temporal impresa en la consola. Con 5 intentos fallidos el acceso se bloquea unos 10 minutos: reiniciá el servidor (Ctrl + C y `npm start`).

**Verificar las variables de la sesión actual**

```bat
echo %PORT% %HOST% %ADMIN_USER%
```

No imprimas `ADMIN_PASSWORD` si estás compartiendo pantalla.

**La página carga sin estilos o el mapa no aparece**
Recargá con **Ctrl + F5**. Si persiste, mirá la consola del servidor en CMD en busca de errores.

---

## Versión publicada (Cloudflare)

La publicación en Cloudflare es independiente de esta vista previa. Probar localmente nunca modifica la versión publicada, y publicar no requiere tener el servidor local encendido.

**Estado actual:** el sitio todavía **no está desplegado en Cloudflare**. Este proyecto es un servidor Node.js que guarda datos en archivos JSON, y eso no se ejecuta tal cual en Cloudflare Workers. Para publicarlo hay que adaptarlo (por ejemplo, almacenar mensajes y tareas en D1 o KV y servir los archivos estáticos desde Workers). Cuando eso esté hecho y verificado, la URL pública se registrará en el `README.md`.
