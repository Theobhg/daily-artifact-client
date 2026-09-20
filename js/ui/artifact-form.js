/**
 * Formulario de criacao e edicao.
 *
 * O mesmo formulario atende os dois fluxos: muda apenas o titulo, o texto do
 * botao e o que acontece no envio. Os campos visiveis se adaptam ao tipo
 * escolhido, seguindo as mesmas regras que o backend aplica.
 */
window.DA = window.DA || {};

window.DA.artifactForm = (function () {
  'use strict';

  var dom = window.DA.dom;
  var dates = window.DA.dates;
  var schemas = window.DA.schemas;

  var FIELDS = ['artifact_date', 'type', 'title', 'content', 'url', 'tags'];

  var CONTENT_HINTS = {
    text: 'O que aconteceu hoje?',
    quote: 'A frase que ficou.',
    photo: 'Uma legenda para a foto. Opcional.',
    link: 'Por que este link vale ser guardado? Opcional.',
    music: 'Um comentario sobre a musica. Opcional.',
  };

  var URL_HINTS = {
    photo: 'Endereco da imagem.',
    link: 'Endereco da pagina.',
    music: 'Endereco da musica.',
  };

  var elements = {};
  var onSubmit = null;

  function cacheElements() {
    elements = {
      form: dom.qs('#artifact-form'),
      heading: dom.qs('#editor-heading'),
      subtitle: dom.qs('#editor-subtitle'),
      date: dom.qs('#form-date'),
      title: dom.qs('#form-title'),
      content: dom.qs('#form-content'),
      contentLabel: dom.qs('#form-content-label'),
      contentHint: dom.qs('#form-content-hint'),
      url: dom.qs('#form-url'),
      urlField: dom.qs('#form-url-field'),
      urlHint: dom.qs('#form-url-hint'),
      tags: dom.qs('#form-tags'),
      submit: dom.qs('#form-submit'),
      cancel: dom.qs('#form-cancel'),
      typePicker: dom.qs('#form-type-picker'),
    };
  }

  function selectedType() {
    var checked = elements.form.querySelector('input[name="type"]:checked');
    return checked ? checked.value : 'text';
  }

  function setSelectedType(type) {
    var input = elements.form.querySelector('input[name="type"][value="' + type + '"]');
    if (input) {
      input.checked = true;
    }
  }

  /** Mostra os campos que o tipo escolhido exige. */
  function applyTypeRules() {
    var type = selectedType();
    var needsUrl = schemas.requiresUrl(type);
    var needsContent = schemas.requiresContent(type);

    dom.toggle(elements.urlField, needsUrl);
    elements.urlHint.textContent = URL_HINTS[type] || '';

    elements.contentLabel.textContent = needsContent ? 'Conteudo' : 'Comentario';
    elements.contentHint.textContent = CONTENT_HINTS[type] || '';
    elements.content.setAttribute('placeholder', CONTENT_HINTS[type] || '');
  }

  function errorElement(field) {
    return dom.qs('#form-' + field.replace('artifact_date', 'date') + '-error');
  }

  function inputElement(field) {
    if (field === 'artifact_date') {
      return elements.date;
    }
    return elements[field] || null;
  }

  function clearErrors() {
    FIELDS.forEach(function (field) {
      var target = errorElement(field);
      if (target) {
        target.textContent = '';
        var input = inputElement(field);
        if (input && input.closest) {
          var wrapper = input.closest('.field');
          if (wrapper) {
            wrapper.classList.remove('field--invalid');
          }
        }
      }
    });
  }

  /** Exibe os erros junto dos respectivos campos e foca o primeiro deles. */
  function showErrors(errors) {
    clearErrors();
    var firstInput = null;

    Object.keys(errors).forEach(function (field) {
      var target = errorElement(field);
      if (!target) {
        return;
      }
      target.textContent = errors[field];

      var input = inputElement(field);
      if (input && input.closest) {
        var wrapper = input.closest('.field');
        if (wrapper) {
          wrapper.classList.add('field--invalid');
        }
        if (!firstInput) {
          firstInput = input;
        }
      }
    });

    if (firstInput) {
      firstInput.focus();
    }
  }

  /** Marca um campo especifico como invalido, a partir da resposta da API. */
  function showFieldError(field, message) {
    var errors = {};
    errors[field] = message;
    showErrors(errors);
  }

  function readValues() {
    return {
      artifact_date: elements.date.value,
      type: selectedType(),
      title: elements.title.value,
      content: elements.content.value,
      url: schemas.requiresUrl(selectedType()) ? elements.url.value : '',
      tags: schemas.parseTagInput(elements.tags.value),
    };
  }

  function setBusy(busy) {
    elements.submit.disabled = busy;
    elements.submit.textContent = busy ? 'Guardando...' : elements.submit.dataset.label;
  }

  /**
   * Prepara o formulario para um dos dois modos.
   * options: { mode, artifact, defaultDate, onSubmit, cancelHref }
   */
  function open(options) {
    var settings = options || {};
    var isEdit = settings.mode === 'edit';
    var artifact = settings.artifact || null;

    clearErrors();
    elements.form.reset();

    elements.heading.textContent = isEdit ? 'Editar artefato' : 'Registrar um artefato';
    elements.subtitle.textContent = isEdit
      ? 'Ajuste o que voce guardou deste dia.'
      : 'Um dia. Um artefato. Escolha o que representa este dia.';

    elements.submit.dataset.label = isEdit ? 'Salvar alteracoes' : 'Guardar artefato';
    elements.submit.textContent = elements.submit.dataset.label;
    elements.submit.disabled = false;

    elements.cancel.setAttribute('href', settings.cancelHref || '#/');

    // Impede a escolha de datas futuras ja no seletor do navegador.
    elements.date.setAttribute('max', dates.todayISO());

    if (artifact) {
      elements.date.value = artifact.artifact_date;
      setSelectedType(artifact.type);
      elements.title.value = artifact.title || '';
      elements.content.value = artifact.content || '';
      elements.url.value = artifact.url || '';
      elements.tags.value = (artifact.tags || []).join(', ');
    } else {
      elements.date.value = settings.defaultDate || dates.todayISO();
      setSelectedType('text');
    }

    applyTypeRules();
    onSubmit = settings.onSubmit || null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    var result = schemas.validateArtifactInput(readValues());
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }

    clearErrors();
    if (onSubmit) {
      setBusy(true);
      Promise.resolve(onSubmit(result.data)).then(
        function () {
          setBusy(false);
        },
        function () {
          setBusy(false);
        }
      );
    }
  }

  function init() {
    cacheElements();
    elements.form.addEventListener('submit', handleSubmit);
    elements.typePicker.addEventListener('change', function () {
      applyTypeRules();
    });
  }

  function focusFirstField() {
    if (elements.date) {
      elements.date.focus();
    }
  }

  return {
    init: init,
    open: open,
    showErrors: showErrors,
    showFieldError: showFieldError,
    focusFirstField: focusFirstField,
  };
})();
