import { describe, expect, it } from 'vitest';
import { fhirResourceId } from '../../src/utils/fhir/resourceId';

const UUID_V5_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('fhirResourceId', () => {
  it('produces a syntactically valid v5 UUID', () => {
    expect(fhirResourceId('Patient', 'abc-123')).toMatch(UUID_V5_PATTERN);
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

  // The namespace, name format and UUID version are a frozen contract: external systems
  // recompute these ids, so a change to any of them is a breaking change. These values
  // pin the derivation, and a failure here means derived ids have moved.
  it.each([
    ['Patient', 'abc-123', 'e6701935-022a-5c99-8566-f69c13499bb2'],
    ['Encounter', 'abc-123', '781ad762-064b-5800-8c9d-6073b0ca3707'],
    ['ServiceRequest', 'xyz-789', 'b0f5cbdd-3371-56a1-8a1e-9d6526c1f09e'],
    ['MediciReport', 'rep-1', 'cbe0fda7-caa4-5398-af04-e3347cc470a7'],
  ])('derives a stable id for %s/%s', (resourceType, upstreamId, expected) => {
    expect(fhirResourceId(resourceType, upstreamId)).toBe(expected);
  });
});
