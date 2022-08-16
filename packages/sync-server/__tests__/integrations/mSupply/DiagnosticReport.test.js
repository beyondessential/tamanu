import { testDiagnosticReportHandler } from '../../hl7fhir/routeHandlersTests';

describe('mSupply integration - DiagnosticReport', () => {
  testDiagnosticReportHandler('mSupply', {
    'X-Tamanu-Client': 'mSupply',
    'X-Version': '0.0.1',
  });
});
