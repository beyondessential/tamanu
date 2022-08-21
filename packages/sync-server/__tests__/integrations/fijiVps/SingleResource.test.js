import { testSingleResourceHandler } from '../../hl7fhir/routeHandlersTests';

describe('VPS integration - Single resource', () => {
  testSingleResourceHandler('fijiVps', {
    'X-Tamanu-Client': 'fiji-vps',
    'X-Version': '0.0.1',
  });
});
