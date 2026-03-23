/** Contexto do MFE ativo. Definido ao montar o MFE. */
export type MfeContext = {
  mfeName: string
  mfeVersion?: string
}

/** Contexto de rota. Atualizado a cada navegação. */
export type RouteContext = {
  appRoute: string
}
