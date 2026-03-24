# @ECADBR/plataforma-observability

![versão](https://img.shields.io/badge/versão-0.1.0-blue)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-1.x-blueviolet)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## O que é

Biblioteca padronizada de observabilidade frontend baseada em OpenTelemetry, projetada para arquiteturas de microfrontends com Module Federation (Host + MFEs).

A biblioteca encapsula toda a configuração do OpenTelemetry Web SDK, expõe uma API enxuta para instrumentação manual e garante que o SDK seja inicializado uma única vez pelo Host, enquanto os MFEs consomem o tracer global sem nenhuma configuração adicional.

## Demo distribuida

Existe uma demo executável em [examples/README.md](/home/tsgomes/github-tassosgomes/fundacao-plataforma-frontend-o11y/examples/README.md) mostrando o cenário Host + MFEs e, adicionalmente, um backend Node instrumentado que continua o `traceparent` recebido do browser para visualização de trace distribuído no Jaeger.

## Instalação

```bash
npm install @ECADBR/plataforma-observability @opentelemetry/api
```

> `@opentelemetry/api` é uma `peerDependency` e deve ser declarada como `shared` no Module Federation para que Host e MFEs compartilhem a mesma instância em runtime.

---

## Quick Start — Host

No `main.tsx` do Host, chame `initObservability()` **antes** de `ReactDOM.createRoot().render()` para que a instrumentação de carregamento de página (`documentLoad`) capture o evento de navegação inicial.

```tsx
// main.tsx (Host)
import { initObservability, setRouteContext } from '@ECADBR/plataforma-observability'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation, useEffect } from 'react-router'
import App from './App'

initObservability({
  serviceName: import.meta.env.VITE_HOST_PLATAFORMA_APP_NAME ?? 'host',
  environment: import.meta.env.VITE_HOST_PLATAFORMA_APP_ENVIRONMENT ?? 'local',
  endpoint:
    import.meta.env.VITE_HOST_PLATAFORMA_OTEL_ENDPOINT ??
    'http://localhost:4318/v1/traces',
  serviceVersion: import.meta.env.VITE_HOST_PLATAFORMA_APP_VERSION,
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <RouteTracker />
    <App />
  </BrowserRouter>,
)
```

Para manter o contexto de rota atualizado a cada navegação, crie um componente auxiliar no Host que chame `setRouteContext()`:

```tsx
// RouteTracker.tsx (Host)
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { setRouteContext } from '@ECADBR/plataforma-observability'

export function RouteTracker() {
  const location = useLocation()

  useEffect(() => {
    setRouteContext({ appRoute: location.pathname })
  }, [location.pathname])

  return null
}
```

---

## Quick Start — MFE

No componente raiz do MFE, chame `setMfeContext()` para que todos os spans criados a partir deste ponto sejam automaticamente enriquecidos com o nome e a versão do MFE.

```tsx
// App.tsx (MFE)
import { useEffect } from 'react'
import { setMfeContext } from '@ECADBR/plataforma-observability'

export function App() {
  useEffect(() => {
    setMfeContext({
      mfeName: 'mfe-clientes',
      mfeVersion: '1.0.0',
    })
  }, [])

  return <div>...</div>
}
```

> Os MFEs **não** devem chamar `initObservability()`. O SDK é inicializado exclusivamente pelo Host.

---

## API Reference

### Funções públicas

| Função | Descrição |
|---|---|
| `initObservability(config)` | Inicializa o OpenTelemetry Web SDK. Deve ser chamado apenas pelo Host, uma única vez antes do render. Chamadas subsequentes são silenciosamente ignoradas (singleton). |
| `createSpan(name, attrs?)` | Cria um span manual e o retorna. O chamador é responsável por chamar `span.end()`. Atributos de contexto (MFE, rota) são injetados automaticamente. |
| `withSpan(name, attrs, fn)` | Executa a função `fn` dentro de um span com gerenciamento automático de ciclo de vida. O span é encerrado ao término, com status `OK` ou `ERROR` conforme o resultado. Exceções são re-lançadas. |
| `recordError(error, context?)` | Registra um erro no span ativo do contexto atual. Caso não exista span ativo, cria um span efêmero de erro e o encerra imediatamente. |
| `setMfeContext(ctx)` | Define o contexto do MFE ativo. Deve ser chamado no componente raiz do MFE ao montar. |
| `setRouteContext(ctx)` | Define a rota atual da aplicação. Deve ser chamado pelo Host a cada mudança de rota. |

### Exemplos de uso

**`createSpan`** — quando é necessário controle manual do ciclo de vida do span:

```ts
import { createSpan } from '@ECADBR/plataforma-observability'
import { SpanStatusCode } from '@opentelemetry/api'

const span = createSpan('feature.clientes.salvar', {
  feature: 'clientes',
  operation: 'salvar',
})
try {
  await salvarCliente(dados)
} catch (err) {
  span.recordException(err as Error)
  span.setStatus({ code: SpanStatusCode.ERROR })
  throw err
} finally {
  span.end()
}
```

**`withSpan`** — forma recomendada para instrumentação manual, sem boilerplate de try/finally:

```ts
import { withSpan } from '@ECADBR/plataforma-observability'

const resultado = await withSpan(
  'ui.action.aprovar',
  { feature: 'aprovacao', operation: 'aprovar' },
  async () => {
    return await aprovarDocumento(id)
  },
)
```

**`recordError`** — para capturar erros em boundaries ou handlers:

```ts
import { recordError } from '@ECADBR/plataforma-observability'

try {
  await processarPagamento(dados)
} catch (err) {
  recordError(err, { feature: 'pagamentos', operation: 'processar' })
  throw err
}
```

---

## Types

### `ObservabilityConfig`

Parâmetro de `initObservability()`.

```ts
type ObservabilityConfig = {
  /** Nome do serviço host (ex.: 'ecad-distribuicao-host') */
  serviceName: string

  /** Ambiente de deploy: 'dev' | 'hml' | 'prd' | 'local' */
  environment: string

  /** URL completa do endpoint OTLP HTTP (ex.: 'http://otel-gateway:4318/v1/traces') */
  endpoint: string

  /** Versão do serviço (tag semver, commit SHA). Default: 'unknown' */
  serviceVersion?: string

  /**
   * Instrumentações automáticas a habilitar.
   * Default: todas habilitadas (documentLoad, fetch, xhr).
   */
  instrumentations?: InstrumentationOptions
}
```

### `InstrumentationOptions`

```ts
type InstrumentationOptions = {
  /** Mede navigation timing e carregamento inicial. Default: true */
  documentLoad?: boolean

  /** Cria spans para requests via fetch(). Default: true */
  fetch?: boolean

  /** Cria spans para requests via XMLHttpRequest (inclui Axios). Default: true */
  xhr?: boolean
}
```

### `SpanAttributes`

Atributos que podem ser passados a `createSpan`, `withSpan` e `recordError`. Os campos `mfeName`, `mfeVersion` e `appRoute` também são injetados automaticamente a partir do contexto global quando definidos.

```ts
type SpanAttributes = {
  mfeName?: string
  mfeVersion?: string
  appRoute?: string
  feature?: string
  operation?: string
  [key: string]: string | number | boolean | undefined
}
```

### `MfeContext`

Parâmetro de `setMfeContext()`.

```ts
type MfeContext = {
  mfeName: string
  mfeVersion?: string
}
```

### `RouteContext`

Parâmetro de `setRouteContext()`.

```ts
type RouteContext = {
  appRoute: string
}
```

---

## Vite Config — Module Federation

Para que Host e MFEs compartilhem a mesma instância de `@opentelemetry/api` em runtime, declare o pacote como `shared` na configuração do Module Federation de ambos os lados.

**Host (`vite.config.ts`)**

```ts
federation({
  name: 'host',
  remotes: {
    mfeClientes: 'http://localhost:3001/assets/remoteEntry.js',
  },
  shared: ['@opentelemetry/api'],
})
```

**Remote / MFE (`vite.config.ts`)**

```ts
federation({
  name: 'mfe-clientes',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
  },
  shared: ['@opentelemetry/api'],
})
```

> Sem essa configuração, Host e MFE carregariam instâncias separadas da API, quebrando a propagação de contexto e o singleton do tracer.

---

## Validação Local

A biblioteca inclui uma stack Docker com OpenTelemetry Collector e Jaeger para validação de traces em ambiente local.

### Subir a stack

```bash
# A partir do diretório do pacote
docker compose -f docker/docker-compose.yml up -d
```

Serviços disponíveis:

| Serviço | URL | Descrição |
|---|---|---|
| Jaeger UI | http://localhost:16686 | Visualização de traces e spans |
| OTLP HTTP | http://localhost:4318 | Endpoint receptor (frontend → collector) |

### Configurar o endpoint local

```ts
initObservability({
  serviceName: 'meu-host-local',
  environment: 'local',
  endpoint: 'http://localhost:4318/v1/traces',
})
```

### Verificar traces

1. Acesse http://localhost:16686
2. Selecione o serviço pelo nome configurado em `serviceName`
3. Clique em "Find Traces"

### Encerrar a stack

```bash
docker compose -f docker/docker-compose.yml down
```

## Aplicação de exemplo

O repositório inclui uma aplicação executável de referência em `examples/`, com um Host e dois MFEs consumindo a biblioteca em cenário real de Module Federation.

Essa demo cobre:

- `initObservability()` no Host
- `setRouteContext()` em navegação
- `setMfeContext()` nos remotes
- spans manuais com `createSpan()` e `withSpan()`
- `recordError()` para falhas controladas
- visualização local no Jaeger

Para executar, siga o guia em `examples/README.md` na raiz do repositório.

---

## Desenvolvimento

### Pré-requisitos

- Node.js 20+
- npm 10+

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run build` | Compila o pacote (ESM + CJS) e gera declarações TypeScript em `dist/` |
| `npm test` | Executa os testes uma única vez |
| `npm run test:coverage` | Executa os testes com relatório de cobertura |
| `npm run lint` | Verifica o código com ESLint |
| `npm run typecheck` | Verifica tipos com TypeScript sem emitir arquivos |

### Estrutura do pacote

```
src/
  host/
    initObservability.ts   # Ponto de entrada do Host
    instrumentations.ts    # Configuração das instrumentações automáticas
  runtime/
    createSpan.ts          # Criação de span manual
    withSpan.ts            # Execução com ciclo de vida automático
    recordError.ts         # Registro padronizado de erros
    setMfeContext.ts        # Definição do contexto do MFE
    setRouteContext.ts      # Definição do contexto de rota
  internal/
    provider.ts            # Singleton do WebTracerProvider
    contextStore.ts        # Estado global de contexto (MFE + rota)
    resource.ts            # Configuração de Resource OTel
    exporter.ts            # Configuração do OTLP HTTP Exporter
  types/
    config.ts              # ObservabilityConfig, InstrumentationOptions
    span.ts                # SpanAttributes
    context.ts             # MfeContext, RouteContext
  index.ts                 # Barrel de exportações públicas
```

---

## Decisoes de Design

### Singleton via estado de módulo

O `WebTracerProvider` é armazenado em variáveis de módulo (`let initialized`, `let providerInstance`) no arquivo `provider.ts`. Chamadas subsequentes a `initObservability()` são detectadas e ignoradas com um aviso em ambiente de desenvolvimento.

Essa abordagem foi escolhida em detrimento de soluções como React Context ou Zustand porque:

- O OTel SDK não é estado de UI — não precisa de re-render
- MFEs consomem o tracer global via `@opentelemetry/api` sem precisar acessar o provider diretamente
- Estado de módulo é mais simples, previsível e sem dependência de framework

### `@opentelemetry/api` como `peerDependency` e `shared`

`@opentelemetry/api` define as interfaces e o contexto global de propagação de traces. Se Host e MFEs carregassem instâncias separadas, cada um teria seu próprio registro de tracer global, quebrando a continuidade dos spans entre boundaries de MFE.

Declarar o pacote como `peerDependency` no `package.json` e como `shared` no Module Federation garante que todos os módulos do bundle utilizem exatamente a mesma instância em runtime.

### MFEs não inicializam o SDK

A responsabilidade de inicializar o `WebTracerProvider` pertence exclusivamente ao Host. Os MFEs chamam apenas `setMfeContext()` para enriquecer o contexto e as funções de runtime (`createSpan`, `withSpan`, `recordError`) para instrumentação manual. Se o Host não inicializar o SDK, os MFEs continuam funcionando sem erros — o OTel retorna um `NoopTracer` por padrão.
