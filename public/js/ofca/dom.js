// Utilidades mínimas para construir DOM sin innerHTML (evita inyecciones y respeta la CSP).
const NS_SVG = 'http://www.w3.org/2000/svg';

function aplicar(nodo, attrs) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') nodo.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') nodo.setAttribute('class', v);
    else if (k === 'texto') nodo.textContent = v;
    else nodo.setAttribute(k, v === true ? '' : String(v));
  }
}
function agregar(nodo, hijos) {
  for (const h of hijos.flat(Infinity)) {
    if (h === null || h === undefined || h === false) continue;
    nodo.append(typeof h === 'object' ? h : document.createTextNode(String(h)));
  }
}
export function el(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  aplicar(n, attrs);
  agregar(n, hijos);
  return n;
}
export function svg(tag, attrs = {}, ...hijos) {
  const n = document.createElementNS(NS_SVG, tag);
  aplicar(n, attrs);
  agregar(n, hijos);
  return n;
}
export function vaciar(nodo) {
  while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
  return nodo;
}
