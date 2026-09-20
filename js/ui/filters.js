/**
 * Filtros da colecao.
 *
 * Traduz os controles do formulario para os parametros aceitos pela rota
 * GET /artifacts e mantem os dois lados em sincronia.
 */
window.DA = window.DA || {};

window.DA.filters = (function () {
  'use strict';

  var dom = window.DA.dom;
  var dates = window.DA.dates;

  var YEAR_RANGE = 6;

  var elements = {};
  var onApply = null;

  function cacheElements() {
    elements = {
      form: dom.qs('#filters-form'),
      type: dom.qs('#filter-type'),
      year: dom.qs('#filter-year'),
      month: dom.qs('#filter-month'),
      tag: dom.qs('#filter-tag'),
      clear: dom.qs('#filters-clear'),
    };
  }

  /** Preenche os selects de ano e mes uma unica vez. */
  function populateOptions() {
    var currentYear = new Date().getFullYear();
    for (var year = currentYear; year > currentYear - YEAR_RANGE; year -= 1) {
      var yearOption = document.createElement('option');
      yearOption.value = String(year);
      yearOption.textContent = String(year);
      elements.year.appendChild(yearOption);
    }

    for (var month = 0; month < 12; month += 1) {
      var monthOption = document.createElement('option');
      monthOption.value = String(month + 1);
      monthOption.textContent = dates.monthName(month);
      elements.month.appendChild(monthOption);
    }
  }

  function read() {
    return {
      type: elements.type.value,
      year: elements.year.value,
      month: elements.month.value,
      tag: elements.tag.value.trim().toLowerCase(),
    };
  }

  /** Reflete no formulario os filtros vindos do estado. */
  function write(filters) {
    elements.type.value = filters.type || '';
    elements.year.value = filters.year || '';
    elements.month.value = filters.month || '';
    elements.tag.value = filters.tag || '';
  }

  /** Descreve os filtros ativos para o resumo da listagem. */
  function describe(filters, total) {
    var parts = [];
    if (filters.type) {
      parts.push('tipo ' + window.DA.schemas.TYPE_LABELS[filters.type].toLowerCase());
    }
    if (filters.month) {
      parts.push(dates.monthName(Number(filters.month) - 1).toLowerCase());
    }
    if (filters.year) {
      parts.push(filters.year);
    }
    if (filters.tag) {
      parts.push('tag "' + filters.tag + '"');
    }

    var counted = total === 1 ? '1 artefato' : total + ' artefatos';
    return parts.length === 0 ? counted + '.' : counted + ' em ' + parts.join(', ') + '.';
  }

  function init(handler) {
    cacheElements();
    populateOptions();
    onApply = handler;

    elements.form.addEventListener('submit', function (event) {
      event.preventDefault();
      onApply(read());
    });

    elements.clear.addEventListener('click', function () {
      write({});
      onApply(read());
    });
  }

  return { init: init, read: read, write: write, describe: describe };
})();
