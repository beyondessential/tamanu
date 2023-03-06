import { SemanticAttributes as OpenTelSemantics } from '@opentelemetry/semantic-conventions';

export const SemanticAttributes = {
  ...OpenTelSemantics,
  DEPLOYMENT_NAME: 'deployment.name',
  DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  DEPLOYMENT_FACILITY: 'deployment.facility',
  SERVICE_TYPE: 'service.type',
  SERVICE_VERSION: 'service.version',
};