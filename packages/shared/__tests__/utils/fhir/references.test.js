import { FhirReference } from '../../../src/services/fhirTypes/reference';

describe('FhirReference.parse', () => {
  it('extracts id from a bare id', () => {
    expect(FhirReference.parse('abc-123')).toEqual({ resourceType: null, id: 'abc-123' });
  });

  it('extracts resourceType and id from Type/id', () => {
    expect(FhirReference.parse('Patient/abc-123')).toEqual({
      resourceType: 'Patient',
      id: 'abc-123',
    });
  });

  it('extracts resourceType and id from a full URL', () => {
    const ref = 'http://example.com/fhir/ServiceRequest/sr-456';
    const { resourceType, id } = FhirReference.parse(ref);
    expect(resourceType).toBe('ServiceRequest');
    expect(id).toBe('sr-456');
  });
});
