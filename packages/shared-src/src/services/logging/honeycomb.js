import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { trace } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import config from 'config';
import shortid from 'shortid';
import os from 'os';

function setupHoneycomb() {
  const { apiKey, sampleRate = 1, enabled } = config?.honeycomb || {};

  if (!enabled || !apiKey) {
    return;
  }

  const { serverType, version } = global.serverInfo;
  const deploymentHost = config?.canonicalHostName || config?.sync?.host;
  const deployment = new URL(deploymentHost).hostname.replace(/[^a-z0-9]+/gi, '-');
  const facilityId = config?.serverFacilityId?.replace(/([^a-z0-9]+|^(ref\/)?facility[-/])/gi, '');

  let serviceName = `${deployment}-${serverType}`;
  if (facilityId) serviceName += `-${facilityId}`;

  const honey = new HoneycombSDK({
    apiKey,
    serviceName,
    sampleRate,
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: process.env.NODE_ENV !== 'production',
      }
    })],
    resource: new Resource({
      'net.host.name': os.hostname(),
      'process.id': shortid.generate(),
      'service.deployment': deployment,
      'service.environment': process.env.NODE_ENV,
      'service.facility': facilityId,
      'service.type': serverType,
      'service.version': version,
    }),
  });

  honey.start();
  return honey;
}

export const honey = setupHoneycomb();
export const getTracer = (name = 'tamanu') => trace.getTracer(name);
export const spanWrapFn = async (name, fn, attributes = {}, tracer = 'tamanu') =>
  getTracer(tracer).startActiveSpan(name, async span => {
    span.setAttribute('code.function', name);
    span.setAttributes(attributes);
    try {
      return await fn(span);
    } catch (e) {
      span.recordException(e);
      throw e;
    } finally {
      span.end();
    }
  });
