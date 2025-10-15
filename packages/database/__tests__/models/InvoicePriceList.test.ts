import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import { InvoicePriceList } from '../../src/models/PriceList';

// Freeze time so age calculations are deterministic
const FIXED_NOW = new Date('2025-10-14T12:00:00Z');

// Helper to build inputs similar to production usage
const buildInputs = (
  overrides: Partial<{ patientType: string; patientDOB: string | Date | null; facilityId: string }>,
) => ({
  patientType: undefined,
  patientDOB: undefined,
  facilityId: undefined,
  ...overrides,
});

describe('InvoicePriceList.getIdForInputs', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the first matching price list id when facility, patientType and age match', async () => {
    const spy = vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      {
        id: 'pl-1',
        rules: { facilityId: 'facility-1', patientType: 'patientType-Charity', patientAge: '<18' },
      },
      {
        id: 'pl-2',
        rules: { facilityId: 'facility-1', patientType: 'patientType-Private', patientAge: '>=65' },
      },
    ]);

    const inputs = buildInputs({
      facilityId: 'facility-1',
      patientType: 'patientType-Charity',
      // 2010-10-15 is 14 years old on 2025-10-14
      patientDOB: '2010-10-15',
    });

    const id = await InvoicePriceList.getIdForInputs(inputs);
    expect(spy).toHaveBeenCalled();
    expect(id).toBe('pl-1');
  });

  it('returns null when no price list rules match', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { facilityId: 'facility-1', patientType: 'patientType-Private' } },
    ]);

    const inputs = buildInputs({
      facilityId: 'facility-1',
      patientType: 'patientType-Charity',
    });

    const id = await InvoicePriceList.getIdForInputs(inputs);
    expect(id).toBeNull();
  });

  it('supports exact age matching with string and number conditions', async () => {
    // Age 15 exactly on 2025-10-14 if DOB is 2010-10-14
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: '15' } },
      { id: 'pl-2', rules: { patientAge: 15 } },
    ]);

    const inputs = buildInputs({ patientDOB: '2010-10-14' });

    // Should return the first matching (pl-1)
    const id1 = await InvoicePriceList.getIdForInputs(inputs);
    expect(id1).toBe('pl-1');

    // If we swap order to ensure numeric also works
    (InvoicePriceList as any).findAll.mockResolvedValue([
      { id: 'pl-2', rules: { patientAge: 15 } },
      { id: 'pl-1', rules: { patientAge: '15' } },
    ]);
    const id2 = await InvoicePriceList.getIdForInputs(inputs);
    expect(id2).toBe('pl-2');
  });

  it('does not match age-based rules if DOB is missing or invalid', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: '<18' } },
      { id: 'pl-2', rules: { patientAge: '>=65' } },
    ]);

    const id1 = await InvoicePriceList.getIdForInputs(buildInputs({ patientDOB: null }));
    expect(id1).toBeNull();

    const id2 = await InvoicePriceList.getIdForInputs(
      buildInputs({ patientDOB: 'not-a-date' as any }),
    );
    expect(id2).toBeNull();
  });

  it('returns the first matching price list when multiple match', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { facilityId: 'facility-1' } },
      { id: 'pl-2', rules: { facilityId: 'facility-1' } },
    ]);

    const inputs = buildInputs({ facilityId: 'facility-1' });

    const id = await InvoicePriceList.getIdForInputs(inputs);
    expect(id).toBe('pl-1');
  });

  it('matches when unspecified rule fields are absent (treated as no constraint)', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([{ id: 'pl-1', rules: {} }]);

    const id = await InvoicePriceList.getIdForInputs(buildInputs({}));
    expect(id).toBe('pl-1');
  });
});
