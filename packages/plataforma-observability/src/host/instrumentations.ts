import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import type { Instrumentation } from '@opentelemetry/instrumentation'
import type { InstrumentationOptions } from '../types/config'

/**
 * Cria a lista de instrumentações automáticas com base na config.
 * Headers sensíveis são filtrados por default (ADR privacidade).
 */
export function createInstrumentations(
  options: InstrumentationOptions = {},
): Instrumentation[] {
  const {
    documentLoad = true,
    fetch: enableFetch = true,
    xhr = true,
  } = options

  const instrumentations: Instrumentation[] = []

  if (documentLoad) {
    instrumentations.push(new DocumentLoadInstrumentation())
  }

  if (enableFetch) {
    instrumentations.push(
      new FetchInstrumentation({
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (_span, _request, _response) => {
          // Hook para atributos custom no futuro, se necessário
        },
        ignoreNetworkEvents: false,
        propagateTraceHeaderCorsUrls: /.*/,
      }),
    )
  }

  if (xhr) {
    instrumentations.push(
      new XMLHttpRequestInstrumentation({
        clearTimingResources: true,
        propagateTraceHeaderCorsUrls: /.*/,
      }),
    )
  }

  return instrumentations
}
