import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { createSpan } from './createSpan'
import type { SpanAttributes } from '../types/span'

/**
 * Executa uma função dentro de um span com gerenciamento automático de ciclo de vida.
 *
 * O span é encerrado automaticamente ao final (sucesso ou erro).
 * Exceções são registradas no span e re-lançadas para não engolir erros.
 *
 * Forma recomendada para instrumentação manual — reduz boilerplate
 * comparado a createSpan + try/finally.
 *
 * @example
 * ```ts
 * const resultado = await withSpan('ui.action.aprovar', {
 *   feature: 'aprovacao',
 *   operation: 'aprovar',
 * }, async () => {
 *   return await aprovarDocumento(id)
 * })
 * ```
 */
export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: () => Promise<T> | T,
): Promise<T> {
  const span = createSpan(name, attributes)
  const spanContext = trace.setSpan(context.active(), span)

  try {
    const result = await context.with(spanContext, fn)
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error instanceof Error ? error : new Error(String(error)))
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    span.end()
  }
}
