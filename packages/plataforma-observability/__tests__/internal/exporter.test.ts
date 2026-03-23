import { describe, it, expect, vi } from 'vitest'

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn().mockImplementation((config) => ({ config })),
}))

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { createExporter } from '../../src/internal/exporter'

describe('createExporter', () => {
  it('cria um OTLPTraceExporter com o endpoint fornecido', () => {
    createExporter('http://otel:4318/v1/traces')
    expect(OTLPTraceExporter).toHaveBeenCalledWith({
      url: 'http://otel:4318/v1/traces',
      headers: {},
    })
  })

  it('retorna uma instância de OTLPTraceExporter', () => {
    const exporter = createExporter('http://otel:4318/v1/traces')
    expect(exporter).toBeDefined()
  })

  it('passa headers vazios ao exporter', () => {
    createExporter('http://localhost:4318/v1/traces')
    expect(OTLPTraceExporter).toHaveBeenCalledWith(
      expect.objectContaining({ headers: {} }),
    )
  })

  it('usa o endpoint exato passado como argumento', () => {
    const endpoint = 'http://custom-otel-gateway:9999/custom/traces'
    createExporter(endpoint)
    expect(OTLPTraceExporter).toHaveBeenCalledWith(
      expect.objectContaining({ url: endpoint }),
    )
  })
})
