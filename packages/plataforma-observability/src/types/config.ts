/**
 * Configuração para inicialização do OpenTelemetry no Host.
 * Chamada uma única vez via initObservability().
 */
export type ObservabilityConfig = {
  /** Nome do serviço host (ex.: 'ecad-distribuicao-host') */
  serviceName: string

  /** Ambiente de deploy: 'dev' | 'hml' | 'prd' | 'local' */
  environment: string

  /** URL completa do endpoint OTLP HTTP (ex.: 'http://otel-gateway:4318/v1/traces') */
  endpoint: string

  /** Versão do serviço (tag, semver, commit SHA). Default: 'unknown' */
  serviceVersion?: string

  /**
   * Instrumentações automáticas a habilitar.
   * Default: todas habilitadas (documentLoad, fetch, xhr).
   */
  instrumentations?: InstrumentationOptions
}

export type InstrumentationOptions = {
  /** Mede navigation timing e carregamento inicial. Default: true */
  documentLoad?: boolean

  /** Cria spans para requests via fetch(). Default: true */
  fetch?: boolean

  /** Cria spans para requests via XMLHttpRequest (inclui Axios). Default: true */
  xhr?: boolean
}
