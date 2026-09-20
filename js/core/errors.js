/**
 * Tipos de erro da aplicacao.
 *
 * Separar falha de rede de falha HTTP permite reagir de formas diferentes: a
 * primeira significa "a API nao respondeu"; a segunda, "a API respondeu e
 * recusou". A interface trata cada caso com uma mensagem propria.
 */
window.DA = window.DA || {};

window.DA.errors = (function () {
  'use strict';

  /** A requisicao nao chegou a API (servidor fora do ar, CORS, DNS). */
  function NetworkError(message) {
    this.name = 'NetworkError';
    this.message = message || 'Nao foi possivel conectar a API.';
  }
  NetworkError.prototype = Object.create(Error.prototype);
  NetworkError.prototype.constructor = NetworkError;

  /** A API respondeu com um status de erro. */
  function ApiError(status, detail, payload) {
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail || 'A API recusou a requisicao.';
    this.payload = payload || null;
    this.message = this.detail;
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  /** A resposta chegou, mas em um formato diferente do esperado. */
  function ValidationError(message, issues) {
    this.name = 'ValidationError';
    this.message = message || 'Os dados recebidos nao estao no formato esperado.';
    this.issues = issues || [];
  }
  ValidationError.prototype = Object.create(Error.prototype);
  ValidationError.prototype.constructor = ValidationError;

  function isNetworkError(error) {
    return error instanceof NetworkError;
  }

  function isApiError(error, status) {
    if (!(error instanceof ApiError)) {
      return false;
    }
    return status === undefined ? true : error.status === status;
  }

  function isNotFound(error) {
    return isApiError(error, 404);
  }

  /** Mensagem pronta para exibir ao usuario, qualquer que seja o erro. */
  function toMessage(error) {
    if (isNetworkError(error)) {
      return 'Nao foi possivel conectar a Daily Artifact API.';
    }
    if (error instanceof ApiError) {
      return error.detail;
    }
    if (error instanceof ValidationError) {
      return error.message;
    }
    return 'Algo inesperado aconteceu.';
  }

  return {
    NetworkError: NetworkError,
    ApiError: ApiError,
    ValidationError: ValidationError,
    isNetworkError: isNetworkError,
    isApiError: isApiError,
    isNotFound: isNotFound,
    toMessage: toMessage,
  };
})();
