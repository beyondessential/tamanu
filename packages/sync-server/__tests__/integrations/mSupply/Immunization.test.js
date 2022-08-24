import { testImmunizationHandler } from '../../hl7fhir/routeHandlersTests';

describe('mSupply integration - Immunization', () => {
  testImmunizationHandler('mSupply', {
    'X-Tamanu-Client': 'mSupply',
    'X-Version': '0.0.1',
  });
});
