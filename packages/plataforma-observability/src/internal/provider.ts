import { trace, type Tracer } from '@opentelemetry/api'
import {
  WebTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-web'
import type { Resource } from '@opentelemetry/resources'
import type { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import type { InstrumentationOption } from '@opentelemetry/instrumentation'
import { registerInstrumentations } from '@opentelemetry/instrumentation'

const TRACER_NAME = '@ECADBR/plataforma-observability'

let initialized = false
let providerInstance: WebTracerProvider | null = null

export type ProviderInitOptions = {
  resource: Resource
  exporter: OTLPTraceExporter
  instrumentations: InstrumentationOption[]
}

/**
 * Inicializa o WebTracerProvider como singleton.
 * Chamadas subsequentes são silenciosamente ignoradas com console.warn em dev.
 */
export function initProvider(options: ProviderInitOptions): void {
  if (initialized) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[@ECADBR/plataforma-observability] initObservability() chamado mais de uma vez. ' +
          'Apenas o Host deve inicializar. Chamada ignorada.',
      )
    }
    return
  }

  const provider = new WebTracerProvider({ resource: options.resource })

  provider.addSpanProcessor(new BatchSpanProcessor(options.exporter))
  provider.register()

  registerInstrumentations({
    instrumentations: options.instrumentations,
  })

  providerInstance = provider
  initialized = true
}

/**
 * Retorna o Tracer registrado.
 * Se o provider não foi inicializado, retorna um NoopTracer (OTel default).
 */
export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME)
}

/** Verifica se o provider foi inicializado. */
export function isInitialized(): boolean {
  return initialized
}

/**
 * Desliga o provider (flush + shutdown).
 * Útil para testes e cleanup.
 * @internal
 */
export async function _shutdownProvider(): Promise<void> {
  if (providerInstance) {
    await providerInstance.forceFlush()
    await providerInstance.shutdown()
    providerInstance = null
    initialized = false
  }
}
