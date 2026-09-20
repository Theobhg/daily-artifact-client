/**
 * Validacao em runtime, escrita a mao.
 *
 * Os validadores seguem a ergonomia de um safeParse: devolvem sempre
 * { ok: boolean, data?, errors? }, nunca lancam excecao. Sao usados nos dois
 * sentidos -- sobre o payload antes de enviar e sobre a resposta que chega.
 *
 * O backend continua sendo a fonte definitiva de verdade: regras como "um
 * artefato por dia" so podem ser decididas la.
 */
window.DA = window.DA || {};

window.DA.schemas = (function () {
  'use strict';

  var dates = window.DA.dates;

  var TYPES = ['text', 'quote', 'photo', 'link', 'music'];
  var TEXTUAL_TYPES = ['text', 'quote'];
  var LINKED_TYPES = ['photo', 'link', 'music'];
  var MAX_TAGS = 10;
  var MAX_TITLE = 120;

  var TYPE_LABELS = {
    text: 'Texto',
    quote: 'Citacao',
    photo: 'Foto',
    link: 'Link',
    music: 'Musica',
  };

  function ok(data) {
    return { ok: true, data: data, errors: {} };
  }

  function fail(errors) {
    return { ok: false, data: null, errors: errors };
  }

  function isString(value) {
    return typeof value === 'string';
  }

  function isBlank(value) {
    return !isString(value) || value.trim() === '';
  }

  function requiresContent(type) {
    return TEXTUAL_TYPES.indexOf(type) !== -1;
  }

  function requiresUrl(type) {
    return LINKED_TYPES.indexOf(type) !== -1;
  }

  /** Aceita apenas http e https: o backend guarda enderecos navegaveis. */
  function isValidUrl(value) {
    if (isBlank(value)) {
      return false;
    }
    try {
      var parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /** Converte "viagem, familia" na lista enviada a API. */
  function parseTagInput(value) {
    if (isBlank(value)) {
      return [];
    }
    var seen = [];
    value.split(',').forEach(function (raw) {
      var tag = raw.trim().toLowerCase();
      if (tag !== '' && seen.indexOf(tag) === -1) {
        seen.push(tag);
      }
    });
    return seen;
  }

  /**
   * Valida o payload de criacao ou atualizacao.
   * Espelha as regras do backend para que o erro apareca antes da viagem.
   */
  function validateArtifactInput(input) {
    var errors = {};

    if (isBlank(input.artifact_date)) {
      errors.artifact_date = 'Informe a data do artefato.';
    } else if (!dates.isValidISO(input.artifact_date)) {
      errors.artifact_date = 'Data invalida.';
    } else if (dates.isFuture(input.artifact_date)) {
      errors.artifact_date = 'Nao e possivel registrar um artefato em uma data futura.';
    }

    if (TYPES.indexOf(input.type) === -1) {
      errors.type = 'Escolha um tipo de artefato.';
    } else {
      if (requiresContent(input.type) && isBlank(input.content)) {
        errors.content = 'O conteudo e obrigatorio para ' +
          TYPE_LABELS[input.type].toLowerCase() + '.';
      }
      if (requiresUrl(input.type)) {
        if (isBlank(input.url)) {
          errors.url = 'Informe o endereco do recurso.';
        } else if (!isValidUrl(input.url)) {
          errors.url = 'Informe uma URL valida, comecando com http:// ou https://.';
        }
      }
    }

    if (isString(input.title) && input.title.trim().length > MAX_TITLE) {
      errors.title = 'O titulo deve ter no maximo ' + MAX_TITLE + ' caracteres.';
    }

    if (!Array.isArray(input.tags)) {
      errors.tags = 'Formato de tags invalido.';
    } else if (input.tags.length > MAX_TAGS) {
      errors.tags = 'Use no maximo ' + MAX_TAGS + ' tags.';
    }

    if (Object.keys(errors).length > 0) {
      return fail(errors);
    }

    return ok(normalizeArtifactInput(input));
  }

  /** Monta o corpo exatamente no formato que a API espera. */
  function normalizeArtifactInput(input) {
    function orNull(value) {
      return isBlank(value) ? null : value.trim();
    }

    return {
      artifact_date: input.artifact_date,
      type: input.type,
      title: orNull(input.title),
      content: orNull(input.content),
      url: orNull(input.url),
      tags: Array.isArray(input.tags) ? input.tags : [],
    };
  }

  /** Valida um artefato vindo da API. */
  function validateArtifact(value) {
    var issues = [];

    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return fail({ _: 'Resposta invalida: era esperado um artefato.' });
    }
    if (typeof value.id !== 'number') {
      issues.push('id ausente ou invalido');
    }
    if (!dates.isValidISO(value.artifact_date)) {
      issues.push('artifact_date fora do formato ISO');
    }
    if (TYPES.indexOf(value.type) === -1) {
      issues.push('type desconhecido: ' + value.type);
    }
    if (!Array.isArray(value.tags)) {
      issues.push('tags nao e uma lista');
    }

    if (issues.length > 0) {
      return fail({ _: 'Resposta invalida da API.', issues: issues });
    }
    return ok(value);
  }

  /** Valida uma lista de artefatos vinda da API. */
  function validateArtifactList(value) {
    if (!Array.isArray(value)) {
      return fail({ _: 'Resposta invalida: era esperada uma lista de artefatos.' });
    }
    for (var i = 0; i < value.length; i += 1) {
      var result = validateArtifact(value[i]);
      if (!result.ok) {
        return result;
      }
    }
    return ok(value);
  }

  return {
    TYPES: TYPES,
    TYPE_LABELS: TYPE_LABELS,
    MAX_TAGS: MAX_TAGS,
    requiresContent: requiresContent,
    requiresUrl: requiresUrl,
    isValidUrl: isValidUrl,
    parseTagInput: parseTagInput,
    validateArtifactInput: validateArtifactInput,
    validateArtifact: validateArtifact,
    validateArtifactList: validateArtifactList,
  };
})();
