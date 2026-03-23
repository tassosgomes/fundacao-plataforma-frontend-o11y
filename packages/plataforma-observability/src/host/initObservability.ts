import type { ObservabilityConfig } from '../types/config'
import { createResource } from '../internal/resource'
import { createExporter } from '../internal/exporter'
import { initProvider } from '../internal/provider'
import { createInstrumentations } from './instrumentations'

/**
 * Inicializa o OpenTelemetry Web SDK.
 *
 * DEVE ser chamado ANTES de ReactDOM.createRoot().render()
 * para capturar o carregamento inicial da página.
 *
 * Chamadas subsequentes são silenciosamente ignoradas (singleton).
 *
 * @example
 * ```ts
 * import { initObservability } from '@ECADBR/plataforma-observability'
 *
 * initObservability({
 *   serviceName: import.meta.env.VITE_HOST_PLATAFORMA_APP_NAME ?? 'host',
 *   environment: import.meta.env.VITE_HOST_PLATAFORMA_APP_ENVIRONMENT ?? 'local',
 *   endpoint: import.meta.env.VITE_HOST_PLATAFORMA_OTEL_ENDPOINT ?? 'http://localhost:4318/v1/traces',
 *   serviceVersion: import.meta.env.VITE_HOST_PLATAFORMA_APP_VERSION,
 * })
 * ```
 */
export function initObservability(config: ObservabilityConfig): void {
  const resource = createResource(config)
  const exporter = createExporter(config.endpoint)
  const instrumentations = createInstrumentations(config.instrumentations)

  initProvider({ resource, exporter, instrumentations })
}
