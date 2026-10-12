-- Esquema inicial del Observatorio (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS mensajes (
  id        TEXT PRIMARY KEY,
  fecha     TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  email     TEXT NOT NULL,
  asunto    TEXT NOT NULL,
  mensaje   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha ON mensajes (fecha);

CREATE TABLE IF NOT EXISTS tareas (
  id           TEXT PRIMARY KEY,
  titulo       TEXT NOT NULL,
  responsable  TEXT NOT NULL DEFAULT '',
  vence        TEXT NOT NULL DEFAULT '',
  estado       TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'hecha')),
  creada       TEXT NOT NULL
);

-- Sesiones del portal: se guarda solo el hash del token.
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash  TEXT PRIMARY KEY,
  usuario     TEXT NOT NULL,
  exp         INTEGER NOT NULL
);

-- Límites de intentos (inicio de sesión y envíos del formulario).
CREATE TABLE IF NOT EXISTS limites (
  clave  TEXT PRIMARY KEY,
  n      INTEGER NOT NULL,
  hasta  INTEGER NOT NULL
);
