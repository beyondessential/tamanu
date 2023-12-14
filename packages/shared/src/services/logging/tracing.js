import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { trace } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ENV, serviceContext, serviceName } from './context';

export async function setupTracing({ settings }) {
  const { apiKey, sampleRate = 1, enabled } = await settings.get('honeycomb');
  if (!enabled || !apiKey) return null;

  const context = serviceContext();
  if (!context) return null;

  const sdk = new HoneycombSDK({
    apiKey,
    serviceName: serviceName(context),
    sampleRate,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: ENV !== 'production',
          requestHook: (span, { query }) => {
            if (
              ENV === 'production' &&
              (span.name.startsWith('pg.query:UPDATE') ||
                span.name.startsWith('pg.query:INSERT') ||
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
