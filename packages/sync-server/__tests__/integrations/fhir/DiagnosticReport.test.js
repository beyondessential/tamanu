import { testDiagnosticReportHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - DiagnosticReport', () => {
  testDiagnosticReportHandler('fhir');
});
