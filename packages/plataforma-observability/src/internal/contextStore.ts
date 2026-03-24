import type { MfeContext, RouteContext } from '../types/context'
import type { SpanAttributes } from '../types/span'

type ContextState = {
  currentMfeContext: MfeContext | null
  currentRouteContext: RouteContext | null
}

const CONTEXT_STORE_KEY = '__ECADBR_PLATAFORMA_OBSERVABILITY_CONTEXT__'

function getContextStore(): ContextState {
  const runtime = globalThis as typeof globalThis & {
    [CONTEXT_STORE_KEY]?: ContextState
  }

  if (!runtime[CONTEXT_STORE_KEY]) {
    runtime[CONTEXT_STORE_KEY] = {
      currentMfeContext: null,
      currentRouteContext: null,
    }
  }

  return runtime[CONTEXT_STORE_KEY]
}

export function setCurrentMfeContext(ctx: MfeContext): void {
  const store = getContextStore()
  store.currentMfeContext = { ...ctx }
}

export function setCurrentRouteContext(ctx: RouteContext): void {
  const store = getContextStore()
  store.currentRouteContext = { ...ctx }
}

export function getCurrentMfeContext(): MfeContext | null {
  return getContextStore().currentMfeContext
}

export function getCurrentRouteContext(): RouteContext | null {
  return getContextStore().currentRouteContext
}

/**
 * Mescla atributos explícitos com o contexto armazenado.
 * Atributos explícitos têm precedência sobre o contexto.
 */
export function mergeContextAttributes(
  explicit: SpanAttributes = {},
): Record<string, string | number | boolean> {
  const { currentMfeContext, currentRouteContext } = getContextStore()
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
  const store = getContextStore()
  store.currentMfeContext = null
  store.currentRouteContext = null
}
