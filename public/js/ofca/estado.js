// Estado global del explorador (filtros, jurisdicción) con sincronización opcional con el hash de la URL.
import { UNIDADES } from './selectores.js';

export const ESTADO_INICIAL = Object.freeze({
  categoria: null, // id de categoría o null (= total nacional)
  jurisdiccion: null, // código ISO 3166-2 (p. ej. 'AR-X') o null (= vista nacional)
  unidad: 'cantidad', // 'cantidad' | 'porcentaje'
  comparar2023: false,
});

export function crearEstado(validos) {
  let actual = { ...ESTADO_INICIAL };
  const oyentes = new Set();
  const normalizar = (e) => ({
    categoria: validos.categorias.includes(e.categoria) ? e.categoria : null,
    jurisdiccion: validos.jurisdicciones.includes(e.jurisdiccion) ? e.jurisdiccion : null,
    unidad: UNIDADES.includes(e.unidad) ? e.unidad : 'cantidad',
    // La serie mensual de 2023 solo existe para el total nacional.
    comparar2023: Boolean(e.comparar2023) && !e.categoria,
  });
  return {
    obtener: () => actual,
    cambiar(parche) {
      const siguiente = normalizar({ ...actual, ...parche });
      if (JSON.stringify(siguiente) === JSON.stringify(actual)) return false;
      actual = siguiente;
      oyentes.forEach((f) => f(actual));
      return true;
    },
    limpiarFiltros() {
      return this.cambiar({ categoria: null, jurisdiccion: null, unidad: 'cantidad', comparar2023: false });
    },
    esInicial: () => JSON.stringify(actual) === JSON.stringify(ESTADO_INICIAL),
    suscribir(f) { oyentes.add(f); return () => oyentes.delete(f); },
    aHash() {
      const p = new URLSearchParams();
      if (actual.categoria) p.set('categoria', actual.categoria);
      if (actual.jurisdiccion) p.set('jurisdiccion', actual.jurisdiccion);
      if (actual.unidad !== 'cantidad') p.set('unidad', actual.unidad);
      if (actual.comparar2023) p.set('comparar', '2023');
      const s = p.toString();
      return s ? `#${s}` : '';
    },
    desdeHash(hash) {
      const p = new URLSearchParams((hash || '').replace(/^#/, ''));
      return this.cambiar({
        categoria: p.get('categoria'),
        jurisdiccion: p.get('jurisdiccion'),
        unidad: p.get('unidad') || 'cantidad',
        comparar2023: p.get('comparar') === '2023',
      });
    },
  };
}
