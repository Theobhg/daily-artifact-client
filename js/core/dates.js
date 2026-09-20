/**
 * Helpers de data.
 *
 * Regra central: a API trabalha em ISO (YYYY-MM-DD) e representa um DIA, nao
 * um instante. Usar new Date('2026-09-20') interpreta a string como UTC e, em
 * fusos negativos, devolve o dia anterior. Por isso toda conversao aqui e
 * feita componente a componente, sempre no fuso local.
 */
window.DA = window.DA || {};

window.DA.dates = (function () {
  'use strict';

  const WEEKDAYS = [
    'Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sabado',
  ];

  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const MONTHS_SHORT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  /** Converte um Date local para a string ISO do dia. */
  function toISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /** Converte uma string ISO em um Date local, sem deslocamento de fuso. */
  function parseISO(iso) {
    const parts = String(iso).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  /** Data de hoje, em ISO. */
  function todayISO() {
    return toISO(new Date());
  }

  /** Verifica se a string esta no formato ISO e representa uma data real. */
  function isValidISO(iso) {
    if (!ISO_PATTERN.test(String(iso || ''))) {
      return false;
    }
    const date = parseISO(iso);
    return !isNaN(date.getTime()) && toISO(date) === iso;
  }

  /** Verifica se a data ISO esta no futuro em relacao a hoje. */
  function isFuture(iso) {
    return isValidISO(iso) && iso > todayISO();
  }

  /** "Sabado" */
  function weekdayName(iso) {
    return WEEKDAYS[parseISO(iso).getDay()];
  }

  /** "20 de setembro" */
  function formatDayMonth(iso) {
    const date = parseISO(iso);
    return date.getDate() + ' de ' + MONTHS[date.getMonth()].toLowerCase();
  }

  /** "20 de setembro de 2026" */
  function formatLong(iso) {
    return formatDayMonth(iso) + ' de ' + parseISO(iso).getFullYear();
  }

  /** "20 set 2026" */
  function formatShort(iso) {
    const date = parseISO(iso);
    return date.getDate() + ' ' + MONTHS_SHORT[date.getMonth()].toLowerCase() + ' ' +
      date.getFullYear();
  }

  /** Formata o carimbo de data e hora devolvido pela API. */
  function formatTimestamp(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    return toISO(date).split('-').reverse().join('/') + ' as ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  /** Nome do mes pelo indice base zero. */
  function monthName(index) {
    return MONTHS[index];
  }

  /** Quantidade de dias do mes (indice base zero). */
  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /** Dia da semana do primeiro dia do mes: 0 = domingo. */
  function firstWeekdayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex, 1).getDay();
  }

  /** Monta a string ISO a partir dos componentes. */
  function buildISO(year, monthIndex, day) {
    return year + '-' + pad(monthIndex + 1) + '-' + pad(day);
  }

  return {
    toISO: toISO,
    parseISO: parseISO,
    todayISO: todayISO,
    isValidISO: isValidISO,
    isFuture: isFuture,
    weekdayName: weekdayName,
    formatDayMonth: formatDayMonth,
    formatLong: formatLong,
    formatShort: formatShort,
    formatTimestamp: formatTimestamp,
    monthName: monthName,
    daysInMonth: daysInMonth,
    firstWeekdayOfMonth: firstWeekdayOfMonth,
    buildISO: buildISO,
  };
})();
