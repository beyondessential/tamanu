export { testImmunizationHandler } from './testImmunizationHandler';
export { testDiagnosticReportHandler } from './testDiagnosticReportHandler';
export { testPatientHandler } from './testPatientHandler';
export { testSingleResourceHandler } from './testSingleResourceHandler';

/*
  The HL7 FHIR functionality is re-used across multiple integrations
  (fijiVps, mSupply and fhir). Since they all share the same route handler,
  they will do pretty much the same and should share the same tests.
*/
