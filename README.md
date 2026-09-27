# Daily Artifact Web

> **One day. One artifact.**

Frontend do **Daily Artifact**: uma SPA em HTML, Tailwind CSS e JavaScript puro
onde cada dia é representado por um único artefato (frase, pensamento, foto,
música ou link).

A API está em
[`daily-artifact-server`](https://github.com/Theobhg/daily-artifact-server).

## Como executar

1. Suba a API em `http://127.0.0.1:8000`.
2. Abra `index.html` direto no navegador.

Não há instalação nem build. É preciso estar **online**, pois o Tailwind é
carregado via CDN.

## Configuração

O endereço da API fica em `js/config.js`, que é o arquivo lido pelo navegador:

```javascript
window.DailyArtifactConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000',
};
```

O `.env.example` só documenta a variável. Como a página abre via `file://`, o
navegador não lê `.env`.

## Funcionalidades

- **Hoje:** mostra o artefato do dia ou convida a criar um.
- **Coleção:** lista com filtros por tipo, ano, mês e tag.
- **Ano:** mosaico dos 12 meses, com um marcador por dia.
- **Me surpreenda:** abre um artefato aleatório.
- **Registrar, editar e excluir** artefatos.
