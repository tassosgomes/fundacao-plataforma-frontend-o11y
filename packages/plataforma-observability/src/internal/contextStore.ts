import type { MfeContext, RouteContext } from '../types/context'
import type { SpanAttributes } from '../types/span'

let currentMfeContext: MfeContext | null = null
let currentRouteContext: RouteContext | null = null

export function setCurrentMfeContext(ctx: MfeContext): void {
  currentMfeContext = { ...ctx }
}

export function setCurrentRouteContext(ctx: RouteContext): void {
  currentRouteContext = { ...ctx }
}

export function getCurrentMfeContext(): MfeContext | null {
  return currentMfeContext
}

export function getCurrentRouteContext(): RouteContext | null {
  return currentRouteContext
}

/**
 * Mescla atributos explícitos com o contexto armazenado.
 * Atributos explícitos têm precedência sobre o contexto.
 */
export function mergeContextAttributes(
  explicit: SpanAttributes = {},
): Record<string, string | number | boolean> {
  const merged: Record<string, string | number | boolean> = {}

  // Contexto de rota (menor precedência)
  if (currentRouteContext) {
    merged['app.route'] = currentRouteContext.appRoute
  }

  // Contexto de MFE
  if (currentMfeContext) {
    merged['mfe.name'] = currentMfeContext.mfeName
    if (currentMfeContext.mfeVersion) {
      merged['mfe.version'] = currentMfeContext.mfeVersion
    }
  }

  // Atributos explícitos (maior precedência)
  for (const [key, value] of Object.entries(explicit)) {
    if (value !== undefined) {
      merged[key] = value
    }
  }

  return merged
}

/**
 * Reset para testes. Não deve ser usado em código de produção.
 * @internal
 */
export function _resetContextStore(): void {
  currentMfeContext = null
  currentRouteContext = null
}
