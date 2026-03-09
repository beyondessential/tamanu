import { parseFhirReference } from '../../../src/utils/fhir/references';

describe('parseFhirReference', () => {
  it('extracts id from a bare id', () => {
    expect(parseFhirReference('abc-123')).toEqual({ resourceType: null, id: 'abc-123' });
  });

  it('extracts resourceType and id from Type/id', () => {
    expect(parseFhirReference('Patient/abc-123')).toEqual({
      resourceType: 'Patient',
      id: 'abc-123',
    });
  });

  it('extracts resourceType and id from a full URL', () => {
    const ref = 'http://example.com/fhir/ServiceRequest/sr-456';
    const { resourceType, id } = parseFhirReference(ref);
    expect(resourceType).toBe('ServiceRequest');
    expect(id).toBe('sr-456');
  });
});
