import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { InvoicePriceList } from '../../src';
import { matchesAgeIfPresent } from '../../src/models/Invoice/invoicePriceListMatching';

// Freeze time so age calculations are deterministic
const FIXED_NOW = new Date('2025-10-14T00:00:00Z');

describe('matchesAgeIfPresent', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('exact age matching', () => {
    it.each([
      {
        condition: '=15',
        dob: '2010-10-14',
        expected: true,
        description: 'matches exact age with = operator',
      },
      {
        condition: '=15',
        dob: '2010-10-15',
        expected: false,
        description: 'does not match when age is younger',
      },
      {
        condition: '=  15',
        dob: '2010-10-14',
        expected: true,
        description: 'handles whitespace after operator',
      },
      {
        condition: '  =  15  ',
        dob: '2010-10-14',
        expected: true,
        description: 'handles whitespace around operator and number',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('less than operators', () => {
    it.each([
      {
        condition: '<18',
        dob: '2010-10-15',
        expected: true,
        description: 'age 14 is less than 18',
      },
      {
        condition: '<14',
        dob: '2010-10-15',
        expected: false,
        description: 'age 14 is not less than 14',
      },
      {
        condition: '<15',
        dob: '2010-10-15',
        expected: true,
        description: 'age 14 is less than 15',
      },
      {
        condition: '<=15',
        dob: '2010-10-14',
        expected: true,
        description: 'age 15 is less than or equal to 15',
      },
      {
        condition: '<=14',
        dob: '2010-10-14',
        expected: false,
        description: 'age 15 is not less than or equal to 14',
      },
      {
        condition: '<=18',
        dob: '2010-10-14',
        expected: true,
        description: 'age 15 is less than or equal to 18',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });

    it.each([
      {
        condition: '<18',
        dob: '2007-10-14',
        expected: false,
        description: 'exactly 18 years old is not < 18',
      },
      { condition: '<18', dob: '2007-10-15', expected: true, description: 'age 17 is < 18' },
      {
        condition: '<=18',
        dob: '2007-10-14',
        expected: true,
        description: 'exactly 18 years old is <= 18',
      },
      {
        condition: '<=18',
        dob: '2006-10-13',
        expected: false,
        description: 'age 19+1 day is not <= 18',
      },
    ])('handles boundary condition: $description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('greater than operators', () => {
    it.each([
      {
        condition: '>65',
        dob: '1950-10-14',
        expected: true,
        description: 'age 75 is greater than 65',
      },
      {
        condition: '>75',
        dob: '1950-10-14',
        expected: false,
        description: 'age 75 is not greater than 75',
      },
      {
        condition: '>74',
        dob: '1950-10-14',
        expected: true,
        description: 'age 75 is greater than 74',
      },
      {
        condition: '>=65',
        dob: '1960-10-14',
        expected: true,
        description: 'age 65 is greater than or equal to 65',
      },
      {
        condition: '>=66',
        dob: '1960-10-14',
        expected: false,
        description: 'age 65 is not greater than or equal to 66',
      },
      {
        condition: '>=60',
        dob: '1960-10-14',
        expected: true,
        description: 'age 65 is greater than or equal to 60',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });

    it.each([
      {
        condition: '>65',
        dob: '1960-10-14',
        expected: false,
        description: 'exactly 65 years old is not > 65',
      },
      { condition: '>65', dob: '1959-10-13', expected: true, description: 'age 66+1 day is > 65' },
      {
        condition: '>=65',
        dob: '1960-10-14',
        expected: true,
        description: 'exactly 65 years old is >= 65',
      },
      { condition: '>=65', dob: '1960-10-15', expected: false, description: 'age 64 is not >= 65' },
    ])('handles boundary condition: $description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('invalid DOB inputs', () => {
    it.each([
      { dob: null, description: 'null DOB' },
      { dob: undefined, description: 'undefined DOB' },
      { dob: '', description: 'empty string DOB' },
      { dob: 'not-a-date', description: 'invalid date string' },
      { dob: 'invalid', description: 'invalid string' },
    ])('returns false for $description', ({ dob }) => {
      expect(matchesAgeIfPresent('=15', dob as any)).toBe(false);
    });
  });

  describe('invalid condition formats', () => {
    it.each([
      { condition: '<', description: 'operator without number' },
      { condition: '>=', description: 'operator without number' },
      { condition: 'abc', description: 'non-numeric value' },
      { condition: '<abc', description: 'operator with non-numeric value' },
      { condition: '!15', description: 'invalid operator !' },
      { condition: '~15', description: 'invalid operator ~' },
      { condition: '1234', description: 'number with 4 digits' },
      { condition: '<1234', description: 'operator with 4 digit number' },
      { condition: '15', description: 'number without operator' },
      { condition: '5', description: '1 digit number without operator' },
      { condition: '100', description: '3 digit number without operator' },
    ])('returns false for $description', ({ condition }) => {
      expect(matchesAgeIfPresent(condition, '2010-10-14')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it.each([
      { condition: '=0', dob: '2025-10-14', expected: true, description: 'exact age 0' },
      { condition: '<1', dob: '2025-10-14', expected: true, description: 'less than 1 year old' },
      {
        condition: '>=0',
        dob: '2025-10-14',
        expected: true,
        description: 'greater than or equal to 0',
      },
    ])('handles age 0 (newborn): $description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });

    it.each([
      { condition: '=120', dob: '1905-10-14', expected: true, description: 'exact age 120' },
      { condition: '>100', dob: '1905-10-14', expected: true, description: 'greater than 100' },
      {
        condition: '<=120',
        dob: '1905-10-14',
        expected: true,
        description: 'less than or equal to 120',
      },
    ])('handles very old ages: $description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });

    it('handles leap year dates', () => {
      vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
      expect(matchesAgeIfPresent('=4', '2020-02-29')).toBe(true);
      expect(matchesAgeIfPresent('<5', '2020-02-29')).toBe(true);
      vi.setSystemTime(new Date('2025-10-14T12:00:00Z')); // Reset
    });
  });
});

// Helper to build inputs similar to production usage
const buildInputs = (
  overrides: Partial<{ patientType: string; patientDOB: string | null; facilityId: string }>,
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

  it('returns the matching price list id when facility, patientType and age match', async () => {
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

  it('supports exact age matching with = operator', async () => {
    // Age 15 exactly on 2025-10-14 if DOB is 2010-10-14
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: '=15' } },
    ]);

    const inputs = buildInputs({ patientDOB: '2010-10-14' });

    const id1 = await InvoicePriceList.getIdForInputs(inputs);
    expect(id1).toBe('pl-1');
  });

  it('does not match age rules without explicit operator', async () => {
    // Age 15 exactly on 2025-10-14 if DOB is 2010-10-14
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: '15' } },
      { id: 'pl-2', rules: { patientAge: '15' } },
    ]);

    const inputs = buildInputs({ patientDOB: '2010-10-14' });

    const id = await InvoicePriceList.getIdForInputs(inputs);
    expect(id).toBeNull();
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

  it('throws an error when multiple price lists match', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { facilityId: 'facility-1' } },
      { id: 'pl-2', rules: { facilityId: 'facility-1' } },
    ]);

    const inputs = buildInputs({ facilityId: 'facility-1' });

    await expect(InvoicePriceList.getIdForInputs(inputs)).rejects.toThrow(
      'Multiple price lists match the provided inputs: pl-1, pl-2',
    );
  });

  it('returns the matching price list id when only one matches', async () => {
    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { facilityId: 'facility-1' } },
      { id: 'pl-2', rules: { facilityId: 'facility-2' } },
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
