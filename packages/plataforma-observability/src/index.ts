// ─── Host (inicialização — apenas Host importa) ────────────────────
export { initObservability } from './host/initObservability'

// ─── Runtime (Host e MFEs) ──────────────────────────────────────────
export { createSpan } from './runtime/createSpan'
export { withSpan } from './runtime/withSpan'
export { recordError } from './runtime/recordError'
export { setMfeContext } from './runtime/setMfeContext'
export { setRouteContext } from './runtime/setRouteContext'

// ─── Types ──────────────────────────────────────────────────────────
export type { ObservabilityConfig, InstrumentationOptions } from './types/config'
export type { SpanAttributes } from './types/span'
export type { MfeContext, RouteContext } from './types/context'
