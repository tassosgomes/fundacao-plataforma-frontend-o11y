import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/internal/resource', () => ({
  createResource: vi.fn().mockReturnValue({ attributes: {} }),
}))

vi.mock('../../src/internal/exporter', () => ({
  createExporter: vi.fn().mockReturnValue({ url: 'http://mock-endpoint' }),
}))

vi.mock('../../src/internal/provider', () => ({
  initProvider: vi.fn(),
}))

vi.mock('../../src/host/instrumentations', () => ({
  createInstrumentations: vi.fn().mockReturnValue([]),
}))

import { createResource } from '../../src/internal/resource'
import { createExporter } from '../../src/internal/exporter'
import { initProvider } from '../../src/internal/provider'
import { createInstrumentations } from '../../src/host/instrumentations'
import { initObservability } from '../../src/host/initObservability'
import type { ObservabilityConfig } from '../../src/types/config'

const baseConfig: ObservabilityConfig = {
  serviceName: 'test-host',
  environment: 'dev',
  endpoint: 'http://otel:4318/v1/traces',
  serviceVersion: '1.0.0',
}

describe('initObservability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama createResource com a config fornecida', () => {
    initObservability(baseConfig)
    expect(createResource).toHaveBeenCalledOnce()
    expect(createResource).toHaveBeenCalledWith(baseConfig)
  })

  it('chama createExporter com o endpoint da config', () => {
    initObservability(baseConfig)
    expect(createExporter).toHaveBeenCalledOnce()
    expect(createExporter).toHaveBeenCalledWith(baseConfig.endpoint)
  })

  it('chama createInstrumentations com as opções de instrumentação da config', () => {
    const config: ObservabilityConfig = {
      ...baseConfig,
      instrumentations: { documentLoad: true, fetch: false, xhr: true },
    }
    initObservability(config)
    expect(createInstrumentations).toHaveBeenCalledOnce()
    expect(createInstrumentations).toHaveBeenCalledWith(config.instrumentations)
  })

  it('chama createInstrumentations com undefined quando instrumentations não está na config', () => {
    const { instrumentations: _, ...configSemInstrumentations } = baseConfig as any
    initObservability(configSemInstrumentations)
    expect(createInstrumentations).toHaveBeenCalledWith(undefined)
  })

  it('chama initProvider com resource, exporter e instrumentations corretos', () => {
    const mockResource = { attributes: { 'service.name': 'test-host' } }
    const mockExporter = { url: 'http://otel:4318/v1/traces' }
    const mockInstrumentations = [{ name: 'doc-load' }]

    vi.mocked(createResource).mockReturnValue(mockResource as any)
    vi.mocked(createExporter).mockReturnValue(mockExporter as any)
    vi.mocked(createInstrumentations).mockReturnValue(mockInstrumentations as any)

    initObservability(baseConfig)

    expect(initProvider).toHaveBeenCalledOnce()
    expect(initProvider).toHaveBeenCalledWith({
      resource: mockResource,
      exporter: mockExporter,
      instrumentations: mockInstrumentations,
    })
  })
})
