import { SemanticAttributes } from '@tamanu/tracing';
import config from 'config';
import shortid from 'shortid';
import os from 'os';

export const ENV = process.env.NODE_ENV ?? 'development';
export const PROCESS_ID = shortid.generate();
export const HOSTNAME = os.hostname();

export function serviceContext() {
  const { serverType = 'unknown', version = '0.0.0' } = global?.serverInfo || {};
  const deploymentHost = config?.canonicalHostName || config?.sync?.host;
  const deployment =
    deploymentHost && new URL(deploymentHost).hostname.replace(/[^a-z0-9]+/gi, '-');
  const facilityId = config?.serverFacilityId?.replace(/([^a-z0-9]+|^(ref\/)?facility[-/])/gi, '');

  const context = {
    [SemanticAttributes.NET_HOST_NAME]: HOSTNAME,
    [SemanticAttributes.PROCESS_ID]: PROCESS_ID,
    [SemanticAttributes.DEPLOYMENT_NAME]: deployment,
    [SemanticAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    [SemanticAttributes.DEPLOYMENT_FACILITY]: facilityId,
    [SemanticAttributes.SERVICE_TYPE]: serverType,
    [SemanticAttributes.SERVICE_VERSION]: version,
  };

  // These can be set by the container image or runtime in production
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('OTEL_CONTEXT_')) continue;
    const contextKey = key
      .replace(/^OTEL_CONTEXT_/, '')
      .toLowerCase()
      .replace(/_/g, '.');
    context[contextKey] = value;
  }

  return context;
}
