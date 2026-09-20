/**
 * Cards de artefato e a grade que os agrupa.
 */
window.DA = window.DA || {};

window.DA.artifactCard = (function () {
  'use strict';

  var dom = window.DA.dom;
  var dates = window.DA.dates;
  var schemas = window.DA.schemas;

  var EXCERPT_LIMIT = 160;

  function typeLabel(type) {
    return schemas.TYPE_LABELS[type] || type;
  }

  /** Texto de apoio do card, variando conforme o tipo. */
  function excerptFor(artifact) {
    if (artifact.content) {
      return artifact.content.length > EXCERPT_LIMIT
        ? artifact.content.slice(0, EXCERPT_LIMIT).trim() + '...'
        : artifact.content;
    }
    // Sem conteudo, a URL ja diz de onde veio a memoria.
    if (artifact.url && artifact.type !== 'photo') {
      return artifact.url;
    }
    return '';
  }

  /** Preenche uma lista de tags. Se onTagClick existir, as tags viram botoes. */
  function renderTags(container, tags, onTagClick) {
    dom.clear(container);
    (tags || []).forEach(function (name) {
      var fragment = dom.fromTemplate(onTagClick ? 'tpl-tag-button' : 'tpl-tag');
      var element = dom.slot(fragment, 'tag');
      element.textContent = name;
      if (onTagClick) {
        element.addEventListener('click', function (event) {
          event.stopPropagation();
          onTagClick(name);
        });
      }
      container.appendChild(fragment);
    });
  }

  /** Monta um card. onSelect recebe o artefato clicado. */
  function create(artifact, onSelect) {
    var fragment = dom.fromTemplate('tpl-card');
    var card = fragment.querySelector('.card');

    card.setAttribute('data-type', artifact.type);
    card.classList.add('card--' + artifact.type);
    card.setAttribute(
      'aria-label',
      'Artefato de ' + dates.formatLong(artifact.artifact_date)
    );

    dom.fillText(fragment, 'date', dates.formatShort(artifact.artifact_date));
    dom.fillText(fragment, 'type', typeLabel(artifact.type));
    dom.fillText(fragment, 'title', artifact.title);
    dom.fillText(fragment, 'excerpt', excerptFor(artifact));

    if (artifact.type === 'photo' && artifact.url) {
      var thumb = dom.slot(fragment, 'thumb');
      thumb.setAttribute('src', artifact.url);
      thumb.setAttribute('alt', artifact.title || 'Foto de ' +
        dates.formatLong(artifact.artifact_date));
      thumb.hidden = false;
      // Uma URL quebrada nao deve deixar um buraco no card.
      thumb.addEventListener('error', function () {
        thumb.hidden = true;
      });
    }

    renderTags(dom.slot(fragment, 'tags'), artifact.tags);

    card.addEventListener('click', function () {
      onSelect(artifact);
    });

    return fragment;
  }

  /** Monta a grade com todos os cards. */
  function createGrid(artifacts, onSelect) {
    var fragment = dom.fromTemplate('tpl-card-grid');
    var grid = dom.slot(fragment, 'grid');
    artifacts.forEach(function (artifact) {
      grid.appendChild(create(artifact, onSelect));
    });
    return fragment;
  }

  return {
    create: create,
    createGrid: createGrid,
    renderTags: renderTags,
    typeLabel: typeLabel,
  };
})();
