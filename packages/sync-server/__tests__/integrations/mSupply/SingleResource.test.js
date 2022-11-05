import { testSingleResourceHandler } from '../../hl7fhir/routeHandlersTests';

describe('mSupply integration - Single resource', () => {
  testSingleResourceHandler('mSupply', {
    'X-Tamanu-Client': 'mSupply',
    'X-Version': '0.0.1',
  });
});
