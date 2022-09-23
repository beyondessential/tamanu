import { testPatientHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - Patient', () => {
  testPatientHandler('fhir');
});

// describe('FHIR Materialised integration - Patient', () => {
//   testPatientHandler('fhir/mat');
// });
