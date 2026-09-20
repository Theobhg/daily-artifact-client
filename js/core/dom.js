/**
 * Helpers minimos de DOM.
 *
 * A aplicacao nao monta HTML concatenando strings: a marcacao vive nos
 * <template> do index.html e aqui ficam apenas os utilitarios para cloná-los
 * e preencher seus "slots" (elementos marcados com data-slot).
 */
window.DA = window.DA || {};

window.DA.dom = (function () {
  'use strict';

  /** Busca um elemento pelo seletor. */
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  /** Busca todos os elementos do seletor, ja como array. */
  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /** Clona o conteudo de um <template> pelo id. */
  function fromTemplate(templateId) {
    const template = document.getElementById(templateId);
    if (!template) {
      throw new Error('Template nao encontrado: ' + templateId);
    }
    return template.content.cloneNode(true);
  }

  /** Busca um slot (data-slot) dentro de um fragmento ou elemento. */
  function slot(root, name) {
    return root.querySelector('[data-slot="' + name + '"]');
  }

  /**
   * Preenche um slot com texto.
   * Quando o valor e vazio, o elemento e escondido em vez de ficar em branco.
   */
  function fillText(root, name, value) {
    const element = slot(root, name);
    if (!element) {
      return null;
    }
    const text = value === null || value === undefined ? '' : String(value);
    element.textContent = text;
    element.hidden = text === '';
    return element;
  }

  /** Remove todos os filhos de um elemento. */
  function clear(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    return element;
  }

  /** Substitui todo o conteudo de um elemento pelo no informado. */
  function replace(element, node) {
    clear(element);
    if (node) {
      element.appendChild(node);
    }
    return element;
  }

  /** Mostra ou esconde um elemento. */
  function toggle(element, visible) {
    if (element) {
      element.hidden = !visible;
    }
  }

  return {
    qs: qs,
    qsa: qsa,
    fromTemplate: fromTemplate,
    slot: slot,
    fillText: fillText,
    clear: clear,
    replace: replace,
    toggle: toggle,
  };
})();
