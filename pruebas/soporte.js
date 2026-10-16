// Soporte compartido por las pruebas: ejecuta el Worker real (src/worker.js) en Node, con SQLite en memoria
// (el mismo motor que D1) y las migraciones reales. NO reemplaza una prueba en Cloudflare.
import { DatabaseSync } from 'node:sqlite';
import nodeCrypto from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// workerd ofrece crypto.subtle.timingSafeEqual; Node no. Equivalente solo para las pruebas.
if (!crypto.subtle.timingSafeEqual) {
  crypto.subtle.timingSafeEqual = (a, b) => {
    const x = Buffer.from(a), y = Buffer.from(b);
    return x.length === y.length && nodeCrypto.timingSafeEqual(x, y);
  };
}

// Adaptador mínimo con la forma de la API de D1.
export function crearD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(join(RAIZ, 'migrations/0001_inicial.sql'), 'utf8'));
  return {
    prepare(sql) {
      const st = sqlite.prepare(sql);
      const hacer = (args) => ({
        async run() { st.run(...args); return { success: true }; },
        async first() { return st.get(...args) ?? null; },
        async all() { return { results: st.all(...args) }; },
      });
      return { ...hacer([]), bind: (...args) => hacer(args) };
    },
  };
}

export const TIPOS = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8',
};

export const ASSETS = {
  async fetch(req) {
    const base = join(RAIZ, 'public');
    const p = join(base, new URL(req.url).pathname);
    if (!p.startsWith(base) || !existsSync(p)) return new Response('no', { status: 404 });
    return new Response(readFileSync(p), { headers: { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream' } });
  },
};

export async function crearEntorno() {
  const { default: worker } = await import(join(RAIZ, 'src/worker.js'));
  const env = { DB: crearD1(), ASSETS, ADMIN_USER: 'equipo', ADMIN_PASSWORD: 'clave-de-prueba-123' };
  const BASE = 'https://observatorio.test';
  const llamar = (ruta, init = {}) => worker.fetch(new Request(BASE + ruta, init), env);
  return { worker, env, BASE, llamar };
}
