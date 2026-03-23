import { describe, it, expect, vi } from 'vitest'

vi.mock('@opentelemetry/resources', () => ({
  Resource: vi.fn().mockImplementation((attrs) => ({ attributes: attrs })),
}))

vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
}))

import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import { createResource } from '../../src/internal/resource'
import type { ObservabilityConfig } from '../../src/types/config'

describe('createResource', () => {
  const baseConfig: ObservabilityConfig = {
    serviceName: 'meu-host',
    environment: 'dev',
    endpoint: 'http://otel:4318/v1/traces',
    serviceVersion: '1.0.0',
  }

  it('cria um Resource com o service.name correto', () => {
    createResource(baseConfig)
    expect(Resource).toHaveBeenCalledWith(
      expect.objectContaining({ [ATTR_SERVICE_NAME]: 'meu-host' }),
    )
  })

  it('cria um Resource com o service.version correto', () => {
    createResource(baseConfig)
    expect(Resource).toHaveBeenCalledWith(
      expect.objectContaining({ [ATTR_SERVICE_VERSION]: '1.0.0' }),
    )
  })

  it('cria um Resource com o deployment.environment correto', () => {
    createResource(baseConfig)
    expect(Resource).toHaveBeenCalledWith(
      expect.objectContaining({ [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: 'dev' }),
    )
  })

  it('usa "unknown" como service.version quando serviceVersion não está definido', () => {
    const configSemVersion: ObservabilityConfig = {
      serviceName: 'meu-host',
      environment: 'prd',
      endpoint: 'http://otel:4318/v1/traces',
    }
    createResource(configSemVersion)
    expect(Resource).toHaveBeenCalledWith(
      expect.objectContaining({ [ATTR_SERVICE_VERSION]: 'unknown' }),
    )
  })

  it('retorna a instância criada pelo Resource', () => {
    const resource = createResource(baseConfig)
    expect(resource).toBeDefined()
  })
})
