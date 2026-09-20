/**
 * Modal de confirmacao.
 *
 * Usado no lugar de window.confirm para que a confirmacao de exclusao siga a
 * identidade visual da aplicacao. Devolve uma Promise que resolve para
 * true (confirmou) ou false (cancelou).
 */
window.DA = window.DA || {};

window.DA.modal = (function () {
  'use strict';

  const dom = window.DA.dom;

  function confirm(options) {
    const settings = options || {};

    return new Promise(function (resolve) {
      const fragment = dom.fromTemplate('tpl-modal');
      const element = fragment.querySelector('.modal');
      const previousFocus = document.activeElement;

      dom.fillText(fragment, 'title', settings.title || 'Confirmar acao');
      dom.fillText(fragment, 'message', settings.message || '');

      const confirmButton = dom.slot(fragment, 'confirm');
      const cancelButton = dom.slot(fragment, 'cancel');
      const backdrop = element.querySelector('.modal__backdrop');

      confirmButton.textContent = settings.confirmLabel || 'Confirmar';
      cancelButton.textContent = settings.cancelLabel || 'Cancelar';

      function close(result) {
        document.removeEventListener('keydown', onKeydown);
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
        resolve(result);
      }

      function onKeydown(event) {
        if (event.key === 'Escape') {
          close(false);
          return;
        }
        // Mantem o foco preso entre os dois botoes do dialogo.
        if (event.key === 'Tab') {
          event.preventDefault();
          const active = document.activeElement;
          (active === confirmButton ? cancelButton : confirmButton).focus();
        }
      }

      confirmButton.addEventListener('click', function () {
        close(true);
      });
      cancelButton.addEventListener('click', function () {
        close(false);
      });
      backdrop.addEventListener('click', function () {
        close(false);
      });
      document.addEventListener('keydown', onKeydown);

      document.body.appendChild(fragment);
      confirmButton.focus();
    });
  }

  return { confirm: confirm };
})();
