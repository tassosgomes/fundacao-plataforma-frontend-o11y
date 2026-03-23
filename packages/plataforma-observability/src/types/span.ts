/**
 * Atributos que podem ser anexados a um span.
 * Atributos de contexto (mfe, rota) são injetados automaticamente
 * quando definidos via setMfeContext/setRouteContext.
 */
export type SpanAttributes = {
  /** Nome do MFE que originou o span */
  mfeName?: string

  /** Versão do MFE */
  mfeVersion?: string

  /** Rota da aplicação no momento do span */
  appRoute?: string

  /** Domínio/feature funcional (ex.: 'clientes', 'pagamentos') */
  feature?: string

  /** Operação sendo executada (ex.: 'salvar', 'aprovar') */
  operation?: string

  /** Atributos livres adicionais */
  [key: string]: string | number | boolean | undefined
}
