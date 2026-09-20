/**
 * Mosaico anual.
 *
 * Desenha os doze meses do ano, um marcador por dia, distinguindo o dia vazio
 * do dia que ja tem artefato. A cor do marcador vem do tipo do artefato.
 *
 * Toda a aritmetica de datas usa os helpers de DA.dates, sempre no fuso local.
 */
window.DA = window.DA || {};

window.DA.calendar = (function () {
  'use strict';

  const dom = window.DA.dom;
  const dates = window.DA.dates;
  const schemas = window.DA.schemas;

  /** Indexa os artefatos do ano por data, para consulta direta ao desenhar. */
  function indexByDate(artifacts) {
    const index = {};
    artifacts.forEach(function (artifact) {
      index[artifact.artifact_date] = artifact;
    });
    return index;
  }

  /** Celula vazia usada para alinhar o primeiro dia ao dia da semana certo. */
  function createPlaceholder() {
    const cell = document.createElement('span');
    cell.className = 'day day--placeholder';
    cell.setAttribute('aria-hidden', 'true');
    return cell;
  }

  /** Celula de um dia: botao quando ha artefato, marcador estatico quando nao. */
  function createDay(iso, day, artifact, today, onSelect) {
    const isFilled = Boolean(artifact);
    const cell = document.createElement(isFilled ? 'button' : 'span');

    cell.className = 'day' + (isFilled ? ' day--filled' : '');
    cell.textContent = String(day);

    if (iso === today) {
      cell.classList.add('day--today');
    }

    if (isFilled) {
      cell.type = 'button';
      cell.setAttribute('data-type', artifact.type);
      cell.setAttribute(
        'aria-label',
        dates.formatLong(iso) + ': ' + schemas.TYPE_LABELS[artifact.type]
      );
      cell.addEventListener('click', function () {
        onSelect(iso, artifact);
      });
    } else {
      cell.setAttribute('aria-label', dates.formatLong(iso) + ': sem registro');
    }

    return cell;
  }

  /** Desenha um mes completo. */
  function createMonth(year, monthIndex, index, today, onSelect) {
    const fragment = dom.fromTemplate('tpl-month');
    const grid = dom.slot(fragment, 'grid');

    dom.slot(fragment, 'name').textContent = dates.monthName(monthIndex);

    const offset = dates.firstWeekdayOfMonth(year, monthIndex);
    for (let i = 0; i < offset; i += 1) {
      grid.appendChild(createPlaceholder());
    }

    const total = dates.daysInMonth(year, monthIndex);
    for (let day = 1; day <= total; day += 1) {
      const iso = dates.buildISO(year, monthIndex, day);
      grid.appendChild(createDay(iso, day, index[iso], today, onSelect));
    }

    return fragment;
  }

  /**
   * Desenha o ano inteiro.
   * onSelect recebe (isoDate, artifact) ao clicar em um dia preenchido.
   */
  function render(year, artifacts, onSelect) {
    const index = indexByDate(artifacts);
    const today = dates.todayISO();
    const grid = document.createElement('div');
    grid.className = 'year-grid';

    for (let month = 0; month < 12; month += 1) {
      grid.appendChild(createMonth(year, month, index, today, onSelect));
    }

    return grid;
  }

  return { render: render };
})();
