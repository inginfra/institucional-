// Servidor HTTP local que ejecuta el Worker real (src/worker.js) en Node, con SQLite en memoria.
// Sirve para probar el sitio en un navegador real SIN Cloudflare. No es el entorno de producción.
import http from 'node:http';
import { crearEntorno } from './soporte.js';

export async function iniciarServidor(puerto = 0) {
  const { worker, env } = await crearEntorno();
  const servidor = http.createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const cuerpo = chunks.length ? Buffer.concat(chunks) : undefined;
      const url = `http://${req.headers.host}${req.url}`;
      const r = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : cuerpo }), env);
      const cab = {};
      r.headers.forEach((v, k) => { cab[k] = v; });
      res.writeHead(r.status, cab);
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  await new Promise((ok) => servidor.listen(puerto, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${servidor.address().port}`, cerrar: () => new Promise((ok) => servidor.close(ok)) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await iniciarServidor(Number(process.env.PORT || 8788));
  console.log(`Servidor local de pruebas en ${s.url} (Ctrl+C para detener)`);
}
