import { Resource } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
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
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
  })
}
