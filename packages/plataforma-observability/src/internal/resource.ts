import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import type { ObservabilityConfig } from '../types/config'

/**
 * Cria o Resource do OpenTelemetry com atributos globais.
 * Esses atributos são anexados a TODOS os spans da sessão.
 */
export function createResource(config: ObservabilityConfig): Resource {
  return new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion ?? 'unknown',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.environment,
  })
}
