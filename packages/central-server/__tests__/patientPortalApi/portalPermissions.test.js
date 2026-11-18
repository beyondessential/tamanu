import { describe, expect, it } from 'vitest';

import { isPermittedForPortal } from '../../app/patientPortalApi/auth/patientPortalMiddleware';

describe('isPermittedForPortal', () => {
  it('permits reading and listing records', () => {
    expect(isPermittedForPortal('list', 'ReferenceData')).toBe(true);
    expect(isPermittedForPortal('read', 'ReferenceData')).toBe(true);
  });

  it('refuses actions that change records', () => {
    expect(isPermittedForPortal('create', 'ReferenceData')).toBe(false);
    expect(isPermittedForPortal('write', 'ReferenceData')).toBe(false);
  });

  it('refuses sensitive records, even to read', () => {
    expect(isPermittedForPortal('list', 'SensitiveLabRequest')).toBe(false);
    expect(isPermittedForPortal('read', 'SensitiveMedication')).toBe(false);
  });
});
