import { testPatientHandler as oldstyleHandler } from '../../hl7fhir/routeHandlersTests';
import { testPatientHandler as materialHandler } from '../../hl7fhir/materialisedTests';

describe('FHIR integration - Patient', () => {
  oldstyleHandler('fhir');
});

describe('FHIR Materialised integration - Patient', () => {
  materialHandler('fhir/mat');
});
