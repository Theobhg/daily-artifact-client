/**
 * Estados vazios e indicador de carregamento.
 *
 * Uma colecao vazia nao e um erro: e uma etapa normal do produto, e merece uma
 * mensagem propria em vez de uma area em branco.
 */
window.DA = window.DA || {};

window.DA.emptyState = (function () {
  'use strict';

  var dom = window.DA.dom;

  /**
   * Monta um estado vazio.
   * options: { title, message, actionLabel, actionHref }
   */
  function create(options) {
    var settings = options || {};
    var fragment = dom.fromTemplate('tpl-empty-state');

    dom.fillText(fragment, 'title', settings.title || 'Nada por aqui ainda.');
    dom.fillText(fragment, 'message', settings.message || '');

    var action = dom.slot(fragment, 'action');
    if (settings.actionLabel && settings.actionHref) {
      action.textContent = settings.actionLabel;
      action.setAttribute('href', settings.actionHref);
      action.hidden = false;
    }

    return fragment;
  }

  /** Indicador de carregamento. */
  function loading(message) {
    var fragment = dom.fromTemplate('tpl-loading');
    if (message) {
      dom.slot(fragment, 'loading').textContent = message;
    }
    return fragment;
  }

  /** Estado de erro, com a mensagem ja traduzida para o usuario. */
  function error(message) {
    return create({
      title: 'Nao foi possivel carregar.',
      message: message,
    });
  }

  return { create: create, loading: loading, error: error };
})();
