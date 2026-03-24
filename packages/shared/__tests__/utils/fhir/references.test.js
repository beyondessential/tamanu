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

  it('rejects ids with invalid characters', () => {
    expect(() => FhirReference.parse('Patient/id with spaces')).toThrow('Invalid FHIR resource id');
    expect(() => FhirReference.parse('Patient/id<script>')).toThrow('Invalid FHIR resource id');
  });

  it('rejects empty id segments', () => {
    expect(() => FhirReference.parse('Patient/')).toThrow('Invalid FHIR resource id');
  });

  it('rejects path traversal references', () => {
    expect(() => FhirReference.parse('Patient/../../../../etc')).toThrow('Invalid FHIR reference');
    expect(() => FhirReference.parse('../etc')).toThrow('Invalid FHIR reference');
  });
});
