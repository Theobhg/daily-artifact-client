/**
 * Roteamento por hash.
 *
 * O hash funciona sob file:// e da o botao voltar do navegador de graca, sem
 * precisar de servidor nem de History API. A navegacao apenas alterna quais
 * sections ficam visiveis -- a pagina nunca recarrega.
 *
 * Rotas:
 *   #/                -> hoje
 *   #/colecao         -> listagem com filtros
 *   #/ano             -> mosaico anual
 *   #/artefato/:id    -> detalhe
 *   #/novo            -> criacao
 *   #/editar/:id      -> edicao
 */
window.DA = window.DA || {};

window.DA.router = (function () {
  'use strict';

  const dom = window.DA.dom;

  const routes = [];
  let notFoundHandler = null;

  /** Converte "#/artefato/12" em ['artefato', '12']. */
  function currentSegments() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === '') {
      return [];
    }
    return hash.split('/').filter(function (segment) {
      return segment !== '';
    });
  }

  /** Mostra apenas a section da view ativa. */
  function showView(name) {
    dom.qsa('[data-view]').forEach(function (section) {
      section.hidden = section.getAttribute('data-view') !== name;
    });
    window.DA.state.set('currentView', name);
    updateNav(name);
  }

  /** Marca o link de navegacao correspondente a view atual. */
  function updateNav(name) {
    dom.qsa('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === name) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Registra uma rota.
   * pattern e uma lista de segmentos; ':' marca um parametro. Ex: ['artefato', ':id']
   */
  function add(pattern, handler) {
    routes.push({ pattern: pattern, handler: handler });
  }

  function match(segments) {
    for (let i = 0; i < routes.length; i += 1) {
      const route = routes[i];
      if (route.pattern.length !== segments.length) {
        continue;
      }

      const params = {};
      let matched = true;

      for (let j = 0; j < route.pattern.length; j += 1) {
        const part = route.pattern[j];
        if (part.charAt(0) === ':') {
          params[part.slice(1)] = decodeURIComponent(segments[j]);
        } else if (part !== segments[j]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        return { handler: route.handler, params: params };
      }
    }
    return null;
  }

  function resolve() {
    const found = match(currentSegments());
    if (found) {
      found.handler(found.params);
      return;
    }
    if (notFoundHandler) {
      notFoundHandler();
    }
  }

  /** Navega para uma rota. */
  function go(path) {
    const target = path.charAt(0) === '#' ? path : '#' + path;
    if (window.location.hash === target) {
      resolve();
      return;
    }
    window.location.hash = target;
  }

  function start(onNotFound) {
    notFoundHandler = onNotFound || null;
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add: add, start: start, go: go, showView: showView, resolve: resolve };
})();
