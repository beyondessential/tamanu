import { testDiagnosticReportHandler } from '../../hl7fhir/routeHandlersTests';

describe('VPS integration - DiagnosticReport', () => {
  testDiagnosticReportHandler('fijiVps', {
    'X-Tamanu-Client': 'fiji-vps',
    'X-Version': '0.0.1',
  });
});
