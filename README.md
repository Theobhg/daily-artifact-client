# Daily Artifact Web

> **One day. One artifact.**

Interface do **Daily Artifact**: uma SPA em HTML, CSS e JavaScript puro onde
cada dia é representado por um único artefato — uma frase, um pensamento, uma
foto, uma música ou um link. Ao longo do ano, a coleção vira um mosaico das
próprias memórias.

Este repositório contém apenas o frontend. A API vive em
[`daily-artifact-server`](https://github.com/Theobhg/daily-artifact-server).

---

## Tecnologias

- **HTML5** semântico, com `<template>` para as estruturas repetidas
- **Tailwind CSS** via Play CDN, com tema próprio
- **JavaScript Vanilla** (ES6), em scripts clássicos

Sem bundler, sem TypeScript, sem npm e sem build.

> ### ⚠️ A aplicação precisa de internet
>
> O Tailwind é carregado pelo **Play CDN** (`cdn.tailwindcss.com`), que compila
> o CSS dentro do próprio navegador. Isso significa que:
>
> - **é necessário estar online** para a interface renderizar com estilo;
> - o CSS é gerado em tempo de execução, então existe um instante mínimo antes
>   de a página ficar estilizada;
> - o próprio Tailwind exibe no console um aviso de que o Play CDN não é
>   destinado a produção.
>
> Esta é a **única** dependência externa do projeto. Todo o resto — HTML,
> JavaScript e configuração — está versionado e funciona localmente.

---

## Como executar

Com a API rodando em `http://127.0.0.1:8000` e **com acesso à internet**,
**abra `index.html` diretamente no navegador** — duplo clique no arquivo já
basta.

```
Não existe npm install.
Não existe build.
Não existe servidor frontend.
```

Sem internet a aplicação continua funcionando, mas aparece sem estilo algum:
o Tailwind não consegue ser carregado do CDN.

A URL ficará parecida com:

```
file:///caminho/para/client/index.html
```

### Se o navegador bloquear a conexão com a API

Navegadores baseados em Chromium aplicam a política de *Private Network
Access*, que restringe chamadas de uma página `file://` para `127.0.0.1`. A API
já responde ao preflight com `Access-Control-Allow-Private-Network: true`, o
que cobre o caso na maioria das versões. Se ainda assim aparecer um pedido de
permissão de rede local, basta permitir. Firefox e Safari não aplicam essa
restrição.

---

## Configuração

Três arquivos participam da configuração, com papéis diferentes:

| Arquivo | Versionado | Papel |
|---|---|---|
| `js/config.js` | Sim | **Configuração usada em runtime.** É o que o navegador realmente lê. |
| `.env.example` | Sim | Documenta as variáveis esperadas do projeto. |
| `.env` | Não | Cópia local do `.env.example`. |

### Por que existem `.env` e `js/config.js`

O navegador **não carrega arquivos `.env`** quando a aplicação é aberta via
`file://`. Diferente de Node ou Vite, não há processo de build nem servidor
para injetar variáveis de ambiente, e não existe `process.env` no navegador.

Por esse motivo, **`js/config.js` contém a configuração utilizada em runtime**.
O `.env` documenta a configuração de ambiente, padroniza o projeto junto ao
backend e permite evolução futura sem introduzir build ou servidor frontend.

Não há script de sincronização entre os dois: mantenha os valores iguais
manualmente.

### `API_BASE_URL`

Para apontar para outro endereço da API, altere **os dois arquivos**:

`js/config.js`:

```javascript
window.DailyArtifactConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000',
};
```

`.env`:

```
API_BASE_URL=http://127.0.0.1:8000
```

Na prática, apenas `js/config.js` afeta o comportamento da aplicação.

---

## Funcionalidades

| Tela | O que faz | Rota da API |
|---|---|---|
| **Hoje** | Destaca o dia atual. Se ainda não houver registro, convida a criar um. | `GET /artifacts/by-date/{hoje}` |
| **Artefatos recentes** | Cards com data, tipo, título ou trecho e tags. | `GET /artifacts` |
| **Me surpreenda** | Traz uma memória aleatória da coleção. | `GET /artifacts/random` |
| **Coleção** | Listagem completa com filtros de tipo, ano, mês e tag. | `GET /artifacts?...` |
| **Ano** | Mosaico dos 12 meses, com um marcador por dia. | `GET /artifacts?year=YYYY` |
| **Detalhe** | Renderiza o artefato conforme o tipo, com data, tags e timestamps. | `GET /artifacts/{id}` |
| **Registrar** | Formulário de criação. | `POST /artifacts` |
| **Editar** | Reaproveita o mesmo formulário. | `PUT /artifacts/{id}` |
| **Excluir** | Confirmação em modal próprio. | `DELETE /artifacts/{id}` |

Todas as sete rotas da API são usadas por uma funcionalidade real da interface.

### Detalhes de comportamento

- **Calendário.** Dias vazios e dias com artefato são visualmente distintos, e
  a cor do marcador indica o tipo. Clicar em um dia preenchido abre o detalhe.
- **Tags.** No formulário, são digitadas separadas por vírgula e enviadas como
  lista. No detalhe, clicar em uma tag filtra a coleção por ela.
- **Datas futuras** ficam bloqueadas tanto pelo atributo `max` do campo quanto
  pela validação antes do envio.
- **Estados vazios** têm mensagem própria: coleção vazia, ano vazio e filtro
  sem resultado dizem coisas diferentes.

---

## Arquitetura

```
index.html   → tema Tailwind, camada de componentes, marcação e <template>
config.js    → configuração de runtime
core/        → utilitários sem conhecimento do produto
data/        → comunicação com a API e validação
ui/          → renderização de cada parte da interface
calendar.js  → mosaico anual
router.js    → navegação entre views
app.js       → bootstrap e ligação entre os módulos
```

### Tailwind e organização dos estilos

Os estilos vivem em dois blocos no topo do `index.html`:

1. **`tailwind.config`** — o tema do projeto: paleta, fontes, raios, sombras e
   animações. É o equivalente ao antigo arquivo de tokens.
2. **`<style type="text/tailwindcss">`** — a camada de componentes, escrita com
   `@apply`.

O restante do layout usa utilitários do Tailwind direto na marcação.

**Por que os estilos não estão em arquivos separados?** Porque o Play CDN só
processa blocos `<style type="text/tailwindcss">` presentes no documento. Ele
não lê arquivos `.css` externos, e a aplicação não pode usar `fetch` para
carregá-los, já que sob `file://` isso é bloqueado pelo navegador. Com um build
de Tailwind (CLI ou PostCSS), a camada de componentes poderia voltar a viver em
arquivos próprios.

**Por que a camada de componentes existe?** Porque o JavaScript liga e desliga
classes de estado — `toast--success`, `day--filled`, `field--invalid`,
`card--quote`. Essas classes precisam existir de forma estável e previsível, o
que `@apply` garante. A alternativa seria espalhar listas de utilitários pelo
JavaScript, tornando-o responsável por aparência.

> **Atenção ao atributo `hidden`.** A aplicação usa `hidden` o tempo todo para
> alternar views, campos e estados. Como um utilitário de display (`flex`,
> `grid`) tem precedência sobre o `display: none` do navegador, a camada base
> declara `[hidden] { display: none !important; }`. Sem essa regra, elementos
> marcados como ocultos continuam aparecendo.

### Como a interface é montada

O JavaScript **não concatena strings de HTML**. A marcação vive nos
`<template>` do `index.html`, e o JS apenas clona esses templates e preenche os
elementos marcados com `data-slot`. Isso mantém o HTML declarativo e legível, e
evita uma função gigante gerando a interface inteira.

### Scripts clássicos, sem ES Modules

Como a página precisa abrir via `file://`, **não é possível usar
`type="module"`, `import` ou `export`** — o navegador bloqueia módulos ES em
origens de arquivo. Os scripts são carregados na ordem de dependência com
`<script defer>`, e cada arquivo expõe seu módulo em um namespace global único,
`window.DA`, usando IIFE.

### Camadas

- **`js/data/api.js`** é o único lugar da aplicação que chama `fetch`. Ele
  monta a URL base, prepara o JSON e traduz as falhas.
- **`js/core/state.js`** guarda só o que mais de uma view precisa conhecer.
  Não é um store reativo: quem altera o estado decide o que re-renderizar.
- **`js/ui/*`** cuida de renderização, sem saber de onde os dados vieram.

---

## Estrutura de arquivos

```
client/
├── index.html                  # tema Tailwind + componentes + marcação
│
├── js/
│   ├── config.js               # window.DailyArtifactConfig
│   ├── core/
│   │   ├── dom.js              # clonagem de templates e preenchimento de slots
│   │   ├── dates.js            # datas locais, sem bug de fuso
│   │   ├── errors.js           # NetworkError, ApiError, ValidationError
│   │   └── state.js
│   ├── data/
│   │   ├── schemas.js          # validação em runtime
│   │   └── api.js              # único ponto com fetch
│   ├── ui/
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── empty-state.js
│   │   ├── artifact-card.js
│   │   ├── artifact-detail.js
│   │   ├── artifact-form.js
│   │   └── filters.js
│   ├── calendar.js
│   ├── router.js
│   └── app.js
│
├── .env.example
└── README.md
```

---

## Validação

`js/data/schemas.js` valida em runtime, nos dois sentidos: o payload antes de
enviar e a resposta que chega da API. Os validadores seguem a ergonomia de um
`safeParse` — devolvem `{ ok, data, errors }` e nunca lançam exceção.

São verificados campos obrigatórios, formato de data, URLs, o tipo dentro do
enum, strings vazias e o formato das tags. As regras por tipo espelham as do
backend, para que o erro apareça antes da viagem até a API.

**O backend continua sendo a fonte definitiva de verdade.** A regra de *um
artefato por data*, por exemplo, só pode ser decidida no servidor; o frontend
apenas interpreta o `409 Conflict` e mostra a mensagem certa junto ao campo.

### Sobre o Zod

**O Zod não foi utilizado.** A biblioteca é distribuída para consumo via npm,
bundler ou ES Modules, e qualquer um desses caminhos quebraria o requisito de
abrir `index.html` diretamente, sem instalação nem build.

Existe um build UMD que funcionaria com `<script>` clássico, mas ele
acrescentaria ao repositório um arquivo minificado de mais de 160 KB, ilegível
durante a apresentação, para resolver uma validação que aqui cabe em um único
arquivo comentado.

---

## Tratamento de erros

Cada falha recebe um tratamento próprio, sem depender do console:

| Situação | O que o usuário vê |
|---|---|
| API fora do ar | Aviso fixo no topo com o endereço esperado da API |
| `409 Conflict` | "Já existe um artefato para esta data", junto ao campo de data |
| `400 Bad Request` | Mensagem sobre data futura, junto ao campo de data |
| `422` | Erros de validação junto dos respectivos campos |
| `404` na tela Hoje | Estado vazio convidando a registrar — não é tratado como erro |
| `404` em um artefato | Mensagem explicando que ele pode ter sido excluído |
| Resposta inesperada | Aviso de que os dados não vieram no formato esperado |

Quando a API não responde, a tela Hoje **não afirma** que o dia está vazio: não
há como saber. Os dois estados ficam ocultos e o aviso de conexão explica.

O feedback de sucesso e de erro usa toasts próprios — `alert()` não é usado em
nenhum fluxo, e a exclusão passa por um modal com foco controlado, no lugar de
`window.confirm()`.

---

## Identidade visual

A referência estética é o [clay.com](https://www.clay.com/): fundo creme
quente em vez de branco puro, bordas *hairline*, raios generosos, sombras de
baixa opacidade em camadas e títulos grandes com *tracking* negativo.

A paleta é inteiramente **terrosa — não há preto nem cinza neutro**. O texto
principal é um marrom de café (`#3a2a1e`), os tons de apoio são marrons
dessaturados e o acento é um terracota, que conversa com a ideia de material
guardado. Até as sombras são tingidas de marrom em vez de preto.

Os cinco tipos de artefato recebem cinco famílias terrosas distintas — taupe,
terracota, musgo, ocre e vinho — para continuarem diferenciáveis no mosaico do
ano sem quebrar a unidade da paleta.

Todas as combinações de texto e fundo foram verificadas contra o mínimo de
contraste 4.5:1 da WCAG AA, incluindo o número branco sobre cada cor de dia
preenchido do calendário.

Todos os valores vivem no bloco `tailwind.config`, no topo do `index.html`.
Mudar a identidade visual do projeto começa — e quase sempre termina — ali.

A tipografia usa a stack de fontes do sistema, sem webfonts.

### Acessibilidade e responsividade

- Labels reais associados a cada campo, botões semânticos e `alt` nas imagens
- Foco visível e consistente via `:focus-visible`
- Modal com foco preso entre os botões e fechamento por `Esc`
- Regiões `aria-live` para mensagens que mudam sem recarregar a página
- Layout verificado em desktop, tablet e mobile
- `prefers-reduced-motion` respeitado
