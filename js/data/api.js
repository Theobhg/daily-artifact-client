/**
 * Cliente HTTP da Daily Artifact API.
 *
 * Unico lugar da aplicacao que chama fetch. Concentra a base URL, o preparo do
 * JSON, a traducao das falhas para os tipos de erro do projeto e a validacao
 * estrutural das respostas.
 */
window.DA = window.DA || {};

window.DA.api = (function () {
  'use strict';

  const errors = window.DA.errors;
  const schemas = window.DA.schemas;

  const config = window.DailyArtifactConfig || {};
  const BASE_URL = String(config.API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  /** Monta a URL completa, anexando apenas os parametros preenchidos. */
  function buildUrl(path, params) {
    const url = BASE_URL + path;
    if (!params) {
      return url;
    }
    const query = [];
    Object.keys(params).forEach(function (key) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
    });
    return query.length > 0 ? url + '?' + query.join('&') : url;
  }

  /** Extrai a mensagem de erro da API, inclusive dos 422 do Pydantic. */
  function extractDetail(payload, status) {
    if (!payload) {
      return 'A API respondeu com o status ' + status + '.';
    }
    if (typeof payload.detail === 'string') {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map(function (issue) {
          return issue && issue.msg ? String(issue.msg).replace(/^Value error,\s*/, '') : null;
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return 'A API respondeu com o status ' + status + '.';
  }

  /**
   * Executa a requisicao e normaliza o resultado.
   * Falhas de rede viram NetworkError; status de erro viram ApiError.
   */
  function request(method, path, options) {
    const settings = options || {};
    const init = { method: method, headers: {} };

    if (settings.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(settings.body);
    }

    return fetch(buildUrl(path, settings.params), init)
      .catch(function () {
        // fetch so rejeita quando a requisicao nao chega ao servidor.
        throw new errors.NetworkError();
      })
      .then(function (response) {
        if (response.status === 204) {
          return null;
        }
        return response
          .json()
          .catch(function () {
            return null;
          })
          .then(function (payload) {
            if (!response.ok) {
              throw new errors.ApiError(
                response.status,
                extractDetail(payload, response.status),
                payload
              );
            }
            return payload;
          });
      });
  }

  /** Aplica um validador a resposta, transformando desvios em ValidationError. */
  function validated(promise, validate) {
    return promise.then(function (payload) {
      const result = validate(payload);
      if (!result.ok) {
        throw new errors.ValidationError(result.errors._, result.errors.issues);
      }
      return result.data;
    });
  }

  // --------------------------------------------------------------------
  // Rotas
  // --------------------------------------------------------------------

  /** POST /artifacts */
  function createArtifact(payload) {
    return validated(
      request('POST', '/artifacts', { body: payload }),
      schemas.validateArtifact
    );
  }

  /** GET /artifacts -- aceita os filtros type, year, month e tag. */
  function listArtifacts(filters) {
    return validated(
      request('GET', '/artifacts', { params: filters || {} }),
      schemas.validateArtifactList
    );
  }

  /** GET /artifacts/random */
  function getRandomArtifact() {
    return validated(request('GET', '/artifacts/random'), schemas.validateArtifact);
  }

  /** GET /artifacts/by-date/{date} */
  function getArtifactByDate(isoDate) {
    return validated(
      request('GET', '/artifacts/by-date/' + encodeURIComponent(isoDate)),
      schemas.validateArtifact
    );
  }

  /** GET /artifacts/{id} */
  function getArtifact(id) {
    return validated(
      request('GET', '/artifacts/' + encodeURIComponent(id)),
      schemas.validateArtifact
    );
  }

  /** PUT /artifacts/{id} */
  function updateArtifact(id, payload) {
    return validated(
      request('PUT', '/artifacts/' + encodeURIComponent(id), { body: payload }),
      schemas.validateArtifact
    );
  }

  /** DELETE /artifacts/{id} */
  function deleteArtifact(id) {
    return request('DELETE', '/artifacts/' + encodeURIComponent(id));
  }

  return {
    BASE_URL: BASE_URL,
    createArtifact: createArtifact,
    listArtifacts: listArtifacts,
    getRandomArtifact: getRandomArtifact,
    getArtifactByDate: getArtifactByDate,
    getArtifact: getArtifact,
    updateArtifact: updateArtifact,
    deleteArtifact: deleteArtifact,
  };
})();
