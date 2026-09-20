/**
 * Bootstrap da aplicacao.
 *
 * Liga rotas, estado e modulos de interface. Cada view tem uma funcao que
 * carrega o que precisa da API e entrega a renderizacao aos modulos de ui --
 * nenhuma montagem de HTML acontece aqui.
 */
(function () {
  'use strict';

  var dom = window.DA.dom;
  var dates = window.DA.dates;
  var state = window.DA.state;
  var api = window.DA.api;
  var errors = window.DA.errors;
  var toast = window.DA.toast;
  var modal = window.DA.modal;
  var router = window.DA.router;
  var calendar = window.DA.calendar;
  var emptyState = window.DA.emptyState;
  var artifactCard = window.DA.artifactCard;
  var artifactDetail = window.DA.artifactDetail;
  var artifactForm = window.DA.artifactForm;
  var filters = window.DA.filters;

  var RECENT_LIMIT = 6;

  // ------------------------------------------------------------------
  // Conexao com a API
  // ------------------------------------------------------------------

  /** Mostra ou esconde o aviso de API fora do ar. */
  function setConnection(online) {
    state.set('apiOnline', online);
    dom.toggle(dom.qs('#connection-banner'), !online);
  }

  /**
   * Trata um erro de forma centralizada.
   * Devolve true quando o erro ja foi tratado como falha de conexao.
   */
  function handleError(error) {
    if (errors.isNetworkError(error)) {
      setConnection(false);
      return true;
    }
    setConnection(true);
    return false;
  }

  /** Renderiza o erro dentro de um container de view. */
  function renderError(container, error) {
    handleError(error);
    dom.replace(container, emptyState.error(errors.toMessage(error)));
  }

  // ------------------------------------------------------------------
  // View: Hoje
  // ------------------------------------------------------------------

  /**
   * Desenha o bloco de hoje.
   * unknown = a API nao respondeu: nao da para afirmar que o dia esta vazio,
   * entao nenhum dos dois estados e exibido e o aviso de conexao explica.
   */
  function renderToday(artifact, unknown) {
    var today = dates.todayISO();

    dom.qs('#today-weekday').textContent = dates.weekdayName(today);
    dom.qs('#today-date').textContent = dates.formatDayMonth(today);

    dom.toggle(dom.qs('#today-empty'), !artifact && !unknown);
    dom.toggle(dom.qs('#today-filled'), Boolean(artifact));

    if (!artifact) {
      return;
    }

    var badge = dom.qs('#today-type');
    badge.textContent = artifactCard.typeLabel(artifact.type);
    badge.setAttribute('data-type', artifact.type);

    var title = dom.qs('#today-title');
    title.textContent = artifact.title || artifactCard.typeLabel(artifact.type) + ' de hoje';

    var body = dom.qs('#today-body');
    body.textContent = artifact.content || artifact.url || '';
    body.hidden = body.textContent === '';

    var image = dom.qs('#today-image');
    if (artifact.type === 'photo' && artifact.url) {
      image.setAttribute('src', artifact.url);
      image.setAttribute('alt', artifact.title || 'Foto de hoje');
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
    }

    dom.qs('#today-open').setAttribute('href', '#/artefato/' + artifact.id);
  }

  function loadToday() {
    // Um 404 aqui e um estado esperado: o dia ainda nao foi registrado.
    return api.getArtifactByDate(dates.todayISO()).then(
      function (artifact) {
        setConnection(true);
        renderToday(artifact);
      },
      function (error) {
        if (errors.isNotFound(error)) {
          setConnection(true);
          renderToday(null);
          return;
        }
        var offline = handleError(error);
        renderToday(null, offline);
      }
    );
  }

  function loadRecent() {
    var container = dom.qs('#recent-container');
    dom.replace(container, emptyState.loading());

    return api.listArtifacts().then(
      function (artifacts) {
        setConnection(true);
        state.set('artifacts', artifacts);

        if (artifacts.length === 0) {
          dom.replace(
            container,
            emptyState.create({
              title: 'Sua colecao ainda esta vazia.',
              message: 'O primeiro artefato pode ser o de hoje.',
              actionLabel: 'Registrar agora',
              actionHref: '#/novo',
            })
          );
          return;
        }

        dom.replace(
          container,
          artifactCard.createGrid(artifacts.slice(0, RECENT_LIMIT), openArtifact)
        );
      },
      function (error) {
        renderError(container, error);
      }
    );
  }

  function showHome() {
    router.showView('home');
    loadToday();
    loadRecent();
  }

  // ------------------------------------------------------------------
  // View: Colecao
  // ------------------------------------------------------------------

  function loadCollection() {
    var container = dom.qs('#collection-container');
    var summary = dom.qs('#collection-summary');
    var active = state.get('filters');

    dom.replace(container, emptyState.loading());
    summary.textContent = '';

    return api.listArtifacts(active).then(
      function (artifacts) {
        setConnection(true);
        summary.textContent = filters.describe(active, artifacts.length);

        if (artifacts.length === 0) {
          dom.replace(
            container,
            state.hasActiveFilters()
              ? emptyState.create({
                  title: 'Nenhum artefato encontrado.',
                  message: 'Tente afrouxar os filtros para ver mais memorias.',
                })
              : emptyState.create({
                  title: 'Sua colecao ainda esta vazia.',
                  message: 'Comece guardando o artefato de hoje.',
                  actionLabel: 'Registrar agora',
                  actionHref: '#/novo',
                })
          );
          return;
        }

        dom.replace(container, artifactCard.createGrid(artifacts, openArtifact));
      },
      function (error) {
        renderError(container, error);
      }
    );
  }

  function showCollection() {
    router.showView('collection');
    filters.write(state.get('filters'));
    loadCollection();
  }

  /** Filtra a colecao por uma tag e leva o usuario ate la. */
  function filterByTag(tag) {
    state.setFilters({ tag: tag });
    router.go('/colecao');
  }

  // ------------------------------------------------------------------
  // View: Ano
  // ------------------------------------------------------------------

  function loadYear() {
    var container = dom.qs('#year-container');
    var legend = dom.qs('#year-legend');
    var year = state.get('selectedYear');

    dom.qs('#year-value').textContent = String(year);
    dom.replace(container, emptyState.loading());
    dom.toggle(legend, false);

    return api.listArtifacts({ year: year }).then(
      function (artifacts) {
        setConnection(true);
        dom.qs('#year-summary').textContent =
          artifacts.length === 1
            ? '1 dia guardado em ' + year + '.'
            : artifacts.length + ' dias guardados em ' + year + '.';

        if (artifacts.length === 0) {
          dom.replace(
            container,
            emptyState.create({
              title: 'Seu ano ainda esta vazio.',
              message: 'Cada dia registrado vira um marcador neste mosaico.',
              actionLabel: 'Registrar um artefato',
              actionHref: '#/novo',
            })
          );
          return;
        }

        dom.replace(container, calendar.render(year, artifacts, openDay));
        dom.toggle(legend, true);
      },
      function (error) {
        renderError(container, error);
      }
    );
  }

  function showYear() {
    router.showView('year');
    loadYear();
  }

  function changeYear(delta) {
    state.set('selectedYear', state.get('selectedYear') + delta);
    loadYear();
  }

  /**
   * Abre o detalhe a partir de um dia do calendario.
   * A busca por data e o caminho natural aqui: o calendario conhece o dia.
   */
  function openDay(isoDate) {
    api.getArtifactByDate(isoDate).then(
      function (artifact) {
        setConnection(true);
        state.set('currentArtifact', artifact);
        router.go('/artefato/' + artifact.id);
      },
      function (error) {
        if (!handleError(error)) {
          toast.error('Nao foi possivel abrir este dia.', errors.toMessage(error));
        } else {
          toast.error('Sem conexao com a API.', 'Confirme que ela esta rodando.');
        }
      }
    );
  }

  // ------------------------------------------------------------------
  // View: Detalhe
  // ------------------------------------------------------------------

  function showDetail(params) {
    router.showView('detail');

    var container = dom.qs('#detail-container');
    dom.replace(container, emptyState.loading());

    api.getArtifact(params.id).then(
      function (artifact) {
        setConnection(true);
        state.set('currentArtifact', artifact);

        dom.replace(
          container,
          artifactDetail.create(artifact, {
            onDelete: confirmDelete,
            onTagClick: filterByTag,
          })
        );
      },
      function (error) {
        if (errors.isNotFound(error)) {
          setConnection(true);
          dom.replace(
            container,
            emptyState.create({
              title: 'Este artefato nao existe mais.',
              message: 'Ele pode ter sido excluido.',
              actionLabel: 'Voltar para hoje',
              actionHref: '#/',
            })
          );
          return;
        }
        renderError(container, error);
      }
    );
  }

  function openArtifact(artifact) {
    state.set('currentArtifact', artifact);
    router.go('/artefato/' + artifact.id);
  }

  // ------------------------------------------------------------------
  // Criacao e edicao
  // ------------------------------------------------------------------

  /** Converte a recusa da API em mensagem util, junto ao campo quando possivel. */
  function reportSaveError(error) {
    if (handleError(error)) {
      toast.error(
        'Sem conexao com a API.',
        'Confirme que ela esta rodando em ' + api.BASE_URL + '.'
      );
      return;
    }

    if (errors.isApiError(error, 409)) {
      artifactForm.showFieldError(
        'artifact_date',
        'Ja existe um artefato para esta data.'
      );
      toast.error('Este dia ja tem um artefato.', 'Escolha outra data ou edite o existente.');
      return;
    }

    if (errors.isApiError(error, 400)) {
      artifactForm.showFieldError('artifact_date', errors.toMessage(error));
      toast.error('Data invalida.', errors.toMessage(error));
      return;
    }

    toast.error('Nao foi possivel guardar.', errors.toMessage(error));
  }

  function showCreate() {
    router.showView('editor');
    artifactForm.open({
      mode: 'create',
      defaultDate: dates.todayISO(),
      cancelHref: '#/',
      onSubmit: function (payload) {
        return api.createArtifact(payload).then(
          function (artifact) {
            setConnection(true);
            toast.success('Artefato guardado.', dates.formatLong(artifact.artifact_date));
            router.go('/artefato/' + artifact.id);
          },
          function (error) {
            reportSaveError(error);
            throw error;
          }
        );
      },
    });
    artifactForm.focusFirstField();
  }

  function showEdit(params) {
    router.showView('editor');

    api.getArtifact(params.id).then(
      function (artifact) {
        setConnection(true);
        state.set('currentArtifact', artifact);

        artifactForm.open({
          mode: 'edit',
          artifact: artifact,
          cancelHref: '#/artefato/' + artifact.id,
          onSubmit: function (payload) {
            return api.updateArtifact(artifact.id, payload).then(
              function (updated) {
                setConnection(true);
                state.set('currentArtifact', updated);
                toast.success('Artefato atualizado.', dates.formatLong(updated.artifact_date));
                router.go('/artefato/' + updated.id);
              },
              function (error) {
                reportSaveError(error);
                throw error;
              }
            );
          },
        });
      },
      function (error) {
        if (!handleError(error)) {
          toast.error('Nao foi possivel abrir a edicao.', errors.toMessage(error));
        }
        router.go('/');
      }
    );
  }

  // ------------------------------------------------------------------
  // Exclusao
  // ------------------------------------------------------------------

  function confirmDelete(artifact) {
    modal
      .confirm({
        title: 'Excluir este artefato?',
        message:
          'O registro de ' + dates.formatLong(artifact.artifact_date) +
          ' sera removido e a data ficara livre novamente.',
        confirmLabel: 'Excluir',
        cancelLabel: 'Manter',
      })
      .then(function (confirmed) {
        if (!confirmed) {
          return;
        }

        api.deleteArtifact(artifact.id).then(
          function () {
            setConnection(true);
            state.set('currentArtifact', null);
            toast.success('Artefato excluido.', dates.formatLong(artifact.artifact_date));
            router.go('/');
          },
          function (error) {
            if (!handleError(error)) {
              toast.error('Nao foi possivel excluir.', errors.toMessage(error));
            } else {
              toast.error('Sem conexao com a API.', 'Confirme que ela esta rodando.');
            }
          }
        );
      });
  }

  // ------------------------------------------------------------------
  // Artefato aleatorio
  // ------------------------------------------------------------------

  function surpriseMe() {
    api.getRandomArtifact().then(
      function (artifact) {
        setConnection(true);
        state.set('currentArtifact', artifact);
        toast.info('Uma memoria de volta.', dates.formatLong(artifact.artifact_date));
        router.go('/artefato/' + artifact.id);
      },
      function (error) {
        if (errors.isNotFound(error)) {
          setConnection(true);
          toast.info(
            'Ainda nao ha memorias para sortear.',
            'Guarde o primeiro artefato e tente de novo.'
          );
          return;
        }
        if (!handleError(error)) {
          toast.error('Nao foi possivel sortear.', errors.toMessage(error));
        } else {
          toast.error('Sem conexao com a API.', 'Confirme que ela esta rodando.');
        }
      }
    );
  }

  // ------------------------------------------------------------------
  // Inicializacao
  // ------------------------------------------------------------------

  function registerRoutes() {
    router.add([], showHome);
    router.add(['colecao'], showCollection);
    router.add(['ano'], showYear);
    router.add(['artefato', ':id'], showDetail);
    router.add(['novo'], showCreate);
    router.add(['editar', ':id'], showEdit);
  }

  function bindGlobalControls() {
    dom.qs('#surprise-button').addEventListener('click', surpriseMe);
    dom.qs('#year-prev').addEventListener('click', function () {
      changeYear(-1);
    });
    dom.qs('#year-next').addEventListener('click', function () {
      changeYear(1);
    });
  }

  function showApiAddress() {
    dom.qs('#connection-banner-url').textContent = api.BASE_URL;
    dom.qs('#footer-api').textContent = 'API: ' + api.BASE_URL;
  }

  function init() {
    showApiAddress();
    artifactForm.init();
    filters.init(function (values) {
      state.setFilters(values);
      loadCollection();
    });
    bindGlobalControls();
    registerRoutes();
    router.start(function () {
      router.go('/');
    });
  }

  init();
})();
