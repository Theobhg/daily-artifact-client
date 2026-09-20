/**
 * Notificacoes temporarias.
 *
 * Substituem alert() como canal de feedback: nao bloqueiam a interface e
 * permitem empilhar mais de uma mensagem.
 */
window.DA = window.DA || {};

window.DA.toast = (function () {
  'use strict';

  var dom = window.DA.dom;
  var DEFAULT_DURATION = 4500;

  function stack() {
    return document.getElementById('toast-stack');
  }

  function dismiss(element) {
    if (!element || element.classList.contains('is-leaving')) {
      return;
    }
    element.classList.add('is-leaving');
    element.addEventListener('animationend', function () {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }

  function show(variant, title, message, duration) {
    var container = stack();
    if (!container) {
      return;
    }

    var fragment = dom.fromTemplate('tpl-toast');
    var element = fragment.querySelector('.toast');
    element.classList.add('toast--' + variant);

    dom.fillText(fragment, 'title', title);
    dom.fillText(fragment, 'message', message);

    element.querySelector('.toast__close').addEventListener('click', function () {
      dismiss(element);
    });

    container.appendChild(fragment);

    window.setTimeout(function () {
      dismiss(element);
    }, duration || DEFAULT_DURATION);
  }

  function success(title, message) {
    show('success', title, message);
  }

  function error(title, message) {
    show('error', title, message, 6000);
  }

  function info(title, message) {
    show('info', title, message);
  }

  return { success: success, error: error, info: info };
})();
