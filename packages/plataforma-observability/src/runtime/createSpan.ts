import type { Span } from '@opentelemetry/api'
import { getTracer } from '../internal/provider'
import { mergeContextAttributes } from '../internal/contextStore'
import type { SpanAttributes } from '../types/span'

/**
 * Cria um span manual. O chamador é responsável por chamar span.end().
 *
 * Atributos de contexto (MFE, rota) são injetados automaticamente
 * se definidos via setMfeContext/setRouteContext.
 *
 * @example
 * ```ts
 * const span = createSpan('feature.clientes.salvar', {
 *   feature: 'clientes',
 *   operation: 'salvar',
 * })
 * try {
 *   await salvarCliente(dados)
 * } catch (err) {
 *   span.recordException(err as Error)
 *   span.setStatus({ code: SpanStatusCode.ERROR })
 *   throw err
 * } finally {
 *   span.end()
 * }
 * ```
 */
export function createSpan(name: string, attributes?: SpanAttributes): Span {
  const tracer = getTracer()
  const merged = mergeContextAttributes(attributes)

  return tracer.startSpan(name, { attributes: merged })
}
