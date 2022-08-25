import { testImmunizationHandler } from '../../hl7fhir/routeHandlersTests';

describe('VPS integration - Immunization', () => {
  testImmunizationHandler('fijiVps', {
    'X-Tamanu-Client': 'fiji-vps',
    'X-Version': '0.0.1',
  });
});
