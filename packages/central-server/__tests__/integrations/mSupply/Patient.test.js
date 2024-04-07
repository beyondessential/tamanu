import { testPatientHandler } from '../../hl7fhir/routeHandlersTests';

describe('mSupply integration - Patient', () => {
  testPatientHandler('mSupply', {
    'X-Tamanu-Client': 'mSupply',
    'X-Version': '0.0.1',
  });
});
