import { testPatientHandler } from '../../hl7fhir/routeHandlersTests';

describe('VPS integration - Patient', () => {
  testPatientHandler('fijiVps', {
    'X-Tamanu-Client': 'fiji-vps',
    'X-Version': '0.0.1',
  });
});
