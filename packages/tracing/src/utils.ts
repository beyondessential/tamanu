import { trace, Tracer, Span, Attributes } from '@opentelemetry/api';
import { SemanticAttributes } from './semantics';

export function getTracer(name: string = 'tamanu'): Tracer {
  return trace.getTracer(name);
}

export type WrappedFn<T> = (span: Span) => Promise<T> | T;

export async function spanWrapFn<T>(
  name: string,
  fn: WrappedFn<T>,
  attributes: Attributes = {},
  tracer: string = 'tamanu',
) {
  return getTracer(tracer).startActiveSpan(name, async span => {
    span.setAttribute(SemanticAttributes.CODE_FUNCTION, name);
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
}
