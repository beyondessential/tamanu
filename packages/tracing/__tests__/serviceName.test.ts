import { it, expect } from '@jest/globals';
import { SemanticAttributes } from '../src/semantics';
import { serviceName } from '../src/serviceName';

it('should return null if no deployment name is supplied', () => {
  expect(serviceName({
    [SemanticAttributes.SERVICE_TYPE]: 'test',
  })).toBe(null);
});

it('should work for a central server', () => {
  expect(
    serviceName({
      [SemanticAttributes.DEPLOYMENT_NAME]: 'princeton',
      [SemanticAttributes.SERVICE_TYPE]: 'central',
    }),
  ).toBe('princeton-central');
});

it('should work for a facility server', () => {
  expect(
    serviceName({
      [SemanticAttributes.DEPLOYMENT_NAME]: 'princeton',
      [SemanticAttributes.SERVICE_TYPE]: 'facility',
      [SemanticAttributes.DEPLOYMENT_FACILITY]: 'plainsboro-teaching-hospital',
    }),
  ).toBe('princeton-facility-plainsboro-teaching-hospital');
});
