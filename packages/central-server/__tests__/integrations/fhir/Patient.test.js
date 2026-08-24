import { describe } from 'vitest';
import { testPatientHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - Patient', () => {
  testPatientHandler('fhir');
});