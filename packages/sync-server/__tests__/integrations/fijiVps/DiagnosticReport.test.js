import { testDiagnosticReportHandler } from '../../hl7fhir/routeHandlersTests';

describe('fijiVps integration - DiagnosticReport', () => {
  testDiagnosticReportHandler('fijiVps', {
    'X-Tamanu-Client': 'fiji-vps',
    'X-Version': '0.0.1',
  });
});
