import { describe } from 'vitest';
import { testSingleResourceHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - Single resource', () => {
  testSingleResourceHandler('fhir');
});
