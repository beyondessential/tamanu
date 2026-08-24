import { describe } from 'vitest';
import { testImmunizationHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - Immunization', () => {
  testImmunizationHandler('fhir');
});
