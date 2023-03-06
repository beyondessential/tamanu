import { SemanticAttributes as OpenTelSemantics } from '@opentelemetry/semantic-conventions';

export const SemanticAttributes = {
  ...OpenTelSemantics,
  DEPLOYMENT_NAME: 'deployment.name',
  DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  DEPLOYMENT_FACILITY: 'deployment.facility',
  SERVICE_TYPE: 'service.type',
  SERVICE_VERSION: 'service.version',
  SOURCE_BRANCH: 'source.branch',
  SOURCE_COMMIT_HASH: 'source.commit.hash',
  SOURCE_COMMIT_SUBJECT: 'source.commit.subject',
  SOURCE_DATE: 'source.date',
  SOURCE_DATE_EPOCH: 'source.date.epoch',
  SOURCE_DATE_ISO: 'source.date.iso',
};
