import { describe, expect, it } from 'vitest';
import { FHIR_RESOURCE_ID_NAMESPACE } from '@tamanu/constants';
import { fhirResourceId, uuidv5 } from '../../src/utils/fhir/resourceId';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidv5', () => {
  // Published RFC 4122 test vector: DNS namespace + "www.example.com".
  it('matches the known test vector', () => {
    expect(uuidv5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(
      '2ed6657d-e927-568b-95e1-2665a8aea6a2',
    );
  });
});

describe('fhirResourceId', () => {
  it('produces a syntactically valid v5 UUID', () => {
    expect(fhirResourceId('Patient', 'abc-123')).toMatch(UUID_PATTERN);
  });

  it('is deterministic: the same type and upstream id always give the same id', () => {
    expect(fhirResourceId('Patient', 'abc-123')).toBe(fhirResourceId('Patient', 'abc-123'));
  });

  it('differs when the upstream id differs', () => {
    expect(fhirResourceId('Patient', 'abc-123')).not.toBe(fhirResourceId('Patient', 'abc-124'));
  });

  it('differs when the resource type differs', () => {
    expect(fhirResourceId('Patient', 'abc-123')).not.toBe(fhirResourceId('Encounter', 'abc-123'));
  });

  it('derives from `<type>/<upstreamId>` in the frozen namespace', () => {
    expect(fhirResourceId('ServiceRequest', 'xyz-789')).toBe(
      uuidv5('ServiceRequest/xyz-789', FHIR_RESOURCE_ID_NAMESPACE),
    );
  });
});
