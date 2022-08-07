import { testDiagnosticReportHandler } from '../../hl7fhir/routeHandlersTests';

describe('FHIR integration - Immunization', () => {
  testDiagnosticReportHandler('mSupply', {
    'X-Tamanu-Client': 'mSupply',
    'X-Version': '0.0.1',
  });
});
