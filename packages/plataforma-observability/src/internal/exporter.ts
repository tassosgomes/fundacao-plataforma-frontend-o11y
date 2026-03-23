import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

/**
 * Cria o exporter OTLP HTTP apontando para o endpoint configurado.
 * O endpoint deve incluir o path completo (ex.: /v1/traces).
 */
export function createExporter(endpoint: string): OTLPTraceExporter {
  return new OTLPTraceExporter({
    url: endpoint,
    headers: {},
  })
}
