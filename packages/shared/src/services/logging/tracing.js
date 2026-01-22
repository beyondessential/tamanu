import { trace } from '@opentelemetry/api';

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
