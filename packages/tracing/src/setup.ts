import { hostname } from 'os';
import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { Resource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SemanticAttributes } from './semantics';
import { serviceName as serviceNameGen } from './serviceName';

export interface TracingConfig {
  apiKey?: string;
  sampleRate?: number;
  enabled?: boolean;

  serviceContext?: {
    [key: string]: string;
  };
}

export function setupTracing(config: TracingConfig = {}) {
  const { apiKey, sampleRate = 1, enabled } = config;
  if (!enabled || !apiKey) return null;

  const ENV = process.env.NODE_ENV ?? 'development';
  const context = {
    [SemanticAttributes.NET_HOST_NAME]: hostname(),
    [SemanticAttributes.DEPLOYMENT_ENVIRONMENT]: ENV,
    ...(config?.serviceContext ?? {}),
  };

  const serviceName = serviceNameGen(context);
  if (!serviceName) return;

  const sdk = new HoneycombSDK({
    apiKey,
    serviceName,
    sampleRate,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: ENV !== 'production',
          requestHook: (span, { query }) => {
            // hack to read a private property
            const { value: spanName } = Object.getOwnPropertyDescriptor(span, 'name') ?? {
              value: '',
            };

            if (
              ENV === 'production' &&
              (spanName.startsWith('pg.query:UPDATE') ||
                spanName.startsWith('pg.query:INSERT') ||
                query.text.startsWith('INSERT') ||
                query.text.startsWith('UPDATE'))
            ) {
              span.setAttribute('db.statement', 'REDACTED UPDATE/INSERT');
            }
          },
        },
      }),
    ],
    resource: new Resource(context),
  });

  sdk.start();
  return sdk;
}
