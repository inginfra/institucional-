// Tooltip accesible compartido por el mapa y los gráficos.
import { el, vaciar } from './dom.js';

export function crearTooltip(raiz) {
  const caja = el('div', { class: 'ofca-tooltip', role: 'tooltip', id: 'ofca-tooltip', hidden: true });
  raiz.append(caja);

  function posicionar(x, y) {
    // x, y en coordenadas de la ventana (clientX/clientY)
    const r = raiz.getBoundingClientRect();
    caja.style.left = '0px';
    caja.style.top = '0px';
    const w = caja.offsetWidth;
    const h = caja.offsetHeight;
    let left = x - r.left + 14;
    let top = y - r.top + 14;
    if (left + w > r.width - 4) left = Math.max(4, x - r.left - w - 14);
    if (top + h > r.height - 4) top = Math.max(4, y - r.top - h - 14);
    caja.style.left = `${Math.round(left)}px`;
    caja.style.top = `${Math.round(top)}px`;
  }

  return {
    /** contenido: { titulo, lineas: string[], etiqueta?: string, aviso?: string } */
    mostrar(contenido, x, y) {
      vaciar(caja);
      caja.append(el('strong', { class: 'ofca-tooltip__titulo', texto: contenido.titulo }));
      if (contenido.etiqueta) caja.append(el('span', { class: 'ofca-tooltip__etiqueta', texto: contenido.etiqueta }));
      for (const l of contenido.lineas || []) caja.append(el('span', { class: 'ofca-tooltip__linea', texto: l }));
      if (contenido.aviso) caja.append(el('span', { class: 'ofca-tooltip__aviso', texto: contenido.aviso }));
      caja.hidden = false;
      posicionar(x, y);
    },
    mostrarSobre(elemento, contenido) {
      const r = elemento.getBoundingClientRect();
      this.mostrar(contenido, r.left + r.width / 2, r.top + r.height / 2);
    },
    mover(x, y) { if (!caja.hidden) posicionar(x, y); },
    ocultar() { caja.hidden = true; },
    id: caja.id,
  };
}
