/**
 * Detalhe de um artefato.
 *
 * O corpo muda conforme o tipo: foto vira imagem, citacao ganha destaque
 * tipografico, link e musica viram um recurso acionavel, texto fica como esta.
 */
window.DA = window.DA || {};

window.DA.artifactDetail = (function () {
  'use strict';

  const dom = window.DA.dom;
  const dates = window.DA.dates;
  const card = window.DA.artifactCard;

  /** Preenche a parte do corpo especifica do tipo. */
  function renderBody(fragment, artifact) {
    if (artifact.type === 'quote') {
      dom.fillText(fragment, 'quote', artifact.content);
      return;
    }

    if (artifact.type === 'text') {
      dom.fillText(fragment, 'text', artifact.content);
      return;
    }

    if (artifact.type === 'photo') {
      const image = dom.slot(fragment, 'image');
      image.setAttribute('src', artifact.url);
      image.setAttribute('alt', artifact.title || 'Foto de ' +
        dates.formatLong(artifact.artifact_date));
      image.hidden = false;
      image.addEventListener('error', function () {
        image.hidden = true;
      });
      dom.fillText(fragment, 'caption', artifact.content);
      return;
    }

    // link e music apontam para um recurso externo.
    const resource = dom.slot(fragment, 'resource');
    dom.slot(fragment, 'url').textContent = artifact.url;
    const open = dom.slot(fragment, 'open');
    open.setAttribute('href', artifact.url);
    open.textContent = artifact.type === 'music' ? 'Ouvir' : 'Abrir';
    resource.hidden = false;
    dom.fillText(fragment, 'caption', artifact.content);
  }

  /**
   * Monta o detalhe completo.
   * handlers: { onDelete, onTagClick }
   */
  function create(artifact, handlers) {
    const callbacks = handlers || {};
    const fragment = dom.fromTemplate('tpl-detail');

    dom.slot(fragment, 'date').textContent = dates.formatLong(artifact.artifact_date);

    const typeBadge = dom.slot(fragment, 'type');
    typeBadge.textContent = card.typeLabel(artifact.type);
    typeBadge.setAttribute('data-type', artifact.type);

    dom.fillText(fragment, 'title', artifact.title);
    renderBody(fragment, artifact);

    card.renderTags(dom.slot(fragment, 'tags'), artifact.tags, callbacks.onTagClick);

    dom.slot(fragment, 'created').textContent =
      'Registrado em ' + dates.formatTimestamp(artifact.created_at);

    // So faz sentido mostrar a edicao quando ela de fato aconteceu.
    if (artifact.updated_at && artifact.updated_at !== artifact.created_at) {
      const updated = dom.slot(fragment, 'updated');
      updated.textContent = 'Editado em ' + dates.formatTimestamp(artifact.updated_at);
      updated.hidden = false;
    }

    dom.slot(fragment, 'edit').setAttribute('href', '#/editar/' + artifact.id);

    dom.slot(fragment, 'delete').addEventListener('click', function () {
      if (callbacks.onDelete) {
        callbacks.onDelete(artifact);
      }
    });

    return fragment;
  }

  return { create: create };
})();
