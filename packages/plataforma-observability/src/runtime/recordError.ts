import { trace, SpanStatusCode } from '@opentelemetry/api'
import { getTracer } from '../internal/provider'
import { mergeContextAttributes } from '../internal/contextStore'
import type { SpanAttributes } from '../types/span'

/**
 * Registra um erro com contexto padronizado.
 *
 * Se houver um span ativo no contexto atual, o erro é registrado nele.
 * Caso contrário, cria um span efêmero de erro que é imediatamente encerrado.
 *
 * @example
 * ```ts
 * try {
 *   await processarPagamento(dados)
 * } catch (err) {
 *   recordError(err, { feature: 'pagamentos', operation: 'processar' })
 *   throw err
 * }
 * ```
 */
export function recordError(
  error: unknown,
  context?: SpanAttributes,
): void {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error))

  const activeSpan = trace.getActiveSpan()

  if (activeSpan) {
    // Enriquece o span ativo com atributos de contexto
    if (context) {
      const merged = mergeContextAttributes(context)
      activeSpan.setAttributes(merged)
    }
    activeSpan.recordException(normalizedError)
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: normalizedError.message,
    })
    return
  }

  // Sem span ativo — cria span efêmero de erro
  const tracer = getTracer()
  const merged = mergeContextAttributes(context)
  const errorSpan = tracer.startSpan('error', { attributes: merged })

  errorSpan.recordException(normalizedError)
  errorSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: normalizedError.message,
  })
  errorSpan.end()
}
