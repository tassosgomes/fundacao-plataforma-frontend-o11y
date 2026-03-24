# Demo executável — plataforma-observability

Esta pasta contém uma aplicação de exemplo em React + Vite com o cenário alvo da biblioteca:

- `host-app`: inicializa a observabilidade uma única vez
- `mfe-clientes`: demonstra `withSpan()` e HTTP automático via `fetch`
- `mfe-pagamentos`: demonstra erro controlado com `recordError()`
- `backend-api`: continua o `traceparent` recebido do browser e exporta spans Node para o mesmo collector

## O que a demo prova

1. Inicialização centralizada do OpenTelemetry no Host
2. Atualização de rota com `setRouteContext()`
3. Contexto de MFE com `setMfeContext()`
4. Span manual com `createSpan()`
5. Span manual com ciclo automático via `withSpan()`
6. Instrumentação HTTP automática (`fetch`)
7. Registro de erro padronizado com `recordError()`
8. Trace distribuído frontend -> backend
9. Visualização local dos traces no Jaeger

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker com Compose

## Subir a stack de observabilidade

Na raiz do repositório:

```bash
docker compose -f packages/plataforma-observability/docker/docker-compose.yml up -d
```

Serviços locais:

- Jaeger UI: `http://localhost:16686`
- OTLP HTTP: `http://localhost:4318/v1/traces`
- Backend API demo: `http://localhost:4319`

## Instalar dependências da demo

```bash
cd examples
npm install
```

## Executar Host + MFEs + backend

```bash
npm run dev
```

Portas padrão:

- Host: `http://localhost:4170`
- MFE Clientes dev: `http://localhost:4171`
- MFE Pagamentos dev: `http://localhost:4172`
- Backend API: `http://localhost:4319`
- MFE Clientes preview: `http://localhost:4271`
- MFE Pagamentos preview: `http://localhost:4272`

O host resolve os remotes automaticamente por ambiente:
- `vite dev` do host pode receber os remotes por variavel de ambiente
- `vite build` + `vite preview` do host aponta para `4271/assets/remoteEntry.js` e `4272/assets/remoteEntry.js`

Se precisar sobrescrever esses enderecos, defina:
- `VITE_MFE_CLIENTES_REMOTE_URL`
- `VITE_MFE_PAGAMENTOS_REMOTE_URL`

Fluxo recomendado para a demo local:
- `npm run dev` na raiz de `examples` sobe o host em `4170`, publica os remotes via `vite preview` em `4271` e `4272`, e inicia o backend Node em `4319`
- esse fluxo evita inconsistencias de federation no modo de desenvolvimento dos remotes
- os remotes fazem bundle do proprio CSS no JavaScript federado para evitar perda de estilos no host
- o `mfe-clientes` recebe `VITE_MFE_CLIENTES_API_BASE_URL=http://localhost:4319` no fluxo principal da demo para enviar a chamada observada ao backend

## Fluxo sugerido de validação

1. Abra `http://localhost:4170`
2. No Host, clique em `Registrar pulso manual do host`
3. Navegue para `MFE Clientes` e clique em `Buscar carteira observada`
4. Navegue para `MFE Pagamentos` e clique em `Forçar recusa controlada`
5. Abra o Jaeger em `http://localhost:16686`
6. Procure pelos serviços `demo-host-observability` e `demo-backend-clientes`

## O que procurar no Jaeger

- `service.name = demo-host-observability`
- `service.name = demo-backend-clientes`
- `deployment.environment = local`
- atributo `app.route` variando entre `/`, `/clientes` e `/pagamentos`
- atributos `mfe.name` e `mfe.version` nos spans emitidos pelos remotes
- span manual do host: `ui.host.registrar-pulso`
- span manual do MFE clientes: `feature.clientes.buscar-carteira`
- span HTTP client do browser para `GET http://localhost:4319/api/clientes-demo.json`
- span da rota Express e span interno `clientes.api.montar-carteira` no backend
- span de erro no MFE pagamentos após a recusa controlada

## Scripts úteis

```bash
npm run dev
npm run dev:host
npm run dev:clientes
npm run dev:pagamentos
npm run dev:backend
npm run build
```

## Observações

- A demo consome `@ECADBR/plataforma-observability` por alias local para usar a API pública real sem exigir publicação do pacote.
- O Host é o único aplicativo que chama `initObservability()`.
- Os MFEs compartilham `@opentelemetry/api` via Module Federation `shared`.
- O backend usa OpenTelemetry Node e extrai automaticamente o `traceparent` propagado pelo browser, permitindo visualizar um único trace distribuído no Jaeger.