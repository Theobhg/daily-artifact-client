/**
 * Estado compartilhado da aplicacao.
 *
 * Proposito deliberadamente pequeno: guardar o que mais de uma view precisa
 * conhecer. Nao e um store reativo -- quem altera o estado tambem decide o que
 * re-renderizar.
 */
window.DA = window.DA || {};

window.DA.state = (function () {
  'use strict';

  const state = {
    currentView: null,
    currentArtifact: null,
    artifacts: [],
    selectedYear: new Date().getFullYear(),
    filters: { type: '', year: '', month: '', tag: '' },
    apiOnline: true,
  };

  function get(key) {
    return state[key];
  }

  function set(key, value) {
    state[key] = value;
    return value;
  }

  /** Substitui os filtros, preservando as chaves conhecidas. */
  function setFilters(filters) {
    state.filters = {
      type: filters.type || '',
      year: filters.year || '',
      month: filters.month || '',
      tag: filters.tag || '',
    };
    return state.filters;
  }

  function clearFilters() {
    return setFilters({});
  }

  /** Indica se ha ao menos um filtro ativo. */
  function hasActiveFilters() {
    const filters = state.filters;
    return Boolean(filters.type || filters.year || filters.month || filters.tag);
  }

  return {
    get: get,
    set: set,
    setFilters: setFilters,
    clearFilters: clearFilters,
    hasActiveFilters: hasActiveFilters,
  };
})();
