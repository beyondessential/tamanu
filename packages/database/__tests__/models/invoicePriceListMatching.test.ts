import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { InvoicePriceList } from '../../src';
import {
  matchesAgeIfPresent,
  matchesFacilityWithExclusionaryLogic,
} from '../../src/models/Invoice/invoicePriceListMatching';

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

  describe('exact numeric value', () => {
    it.each([
      { condition: 15, dob: '2010-10-14', expected: true, description: 'exact match' },
      { condition: 15, dob: '2010-10-15', expected: false, description: 'no match when younger' },
      { condition: 15, dob: '2009-10-14', expected: false, description: 'no match when older' },
      { condition: 0, dob: '2025-10-14', expected: true, description: 'exact age 0' },
      { condition: 120, dob: '1905-10-14', expected: true, description: 'exact age 120' },
      { condition: 65, dob: '1960-10-14', expected: true, description: 'exact age 65' },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('min only', () => {
    it.each([
      {
        condition: { min: 65 },
        dob: '1960-10-14',
        expected: true,
        description: 'age 65 matches min 65',
      },
      {
        condition: { min: 65 },
        dob: '1959-10-14',
        expected: true,
        description: 'age 66 matches min 65',
      },
      {
        condition: { min: 65 },
        dob: '1960-10-15',
        expected: false,
        description: 'age 64 does not match min 65',
      },
      {
        condition: { min: 0 },
        dob: '2025-10-14',
        expected: true,
        description: 'age 0 matches min 0',
      },
      {
        condition: { min: 18 },
        dob: '2007-10-14',
        expected: true,
        description: 'age 18 matches min 18',
      },
      {
        condition: { min: 18 },
        dob: '2007-10-15',
        expected: false,
        description: 'age 17 does not match min 18',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('max only', () => {
    it.each([
      {
        condition: { max: 14 },
        dob: '2010-10-15',
        expected: true,
        description: 'age 14 matches max 14',
      },
      {
        condition: { max: 14 },
        dob: '2011-10-14',
        expected: true,
        description: 'age 14 matches max 14 (same day)',
      },
      {
        condition: { max: 14 },
        dob: '2010-10-14',
        expected: false,
        description: 'age 15 does not match max 14',
      },
      {
        condition: { max: 0 },
        dob: '2025-10-14',
        expected: true,
        description: 'age 0 matches max 0',
      },
      {
        condition: { max: 0 },
        dob: '2024-10-14',
        expected: false,
        description: 'age 1 does not match max 0',
      },
      {
        condition: { max: 18 },
        dob: '2007-10-14',
        expected: true,
        description: 'age 18 matches max 18',
      },
      {
        condition: { max: 18 },
        dob: '2006-10-14',
        expected: false,
        description: 'age 19 does not match max 18',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('min and max (range)', () => {
    it.each([
      {
        condition: { min: 15, max: 64 },
        dob: '2010-10-14',
        expected: true,
        description: 'age 15 matches range 15-64',
      },
      {
        condition: { min: 15, max: 64 },
        dob: '1960-10-15',
        expected: true,
        description: 'age 64 matches range 15-64',
      },
      {
        condition: { min: 15, max: 64 },
        dob: '1960-10-14',
        expected: false,
        description: 'age 65 does not match range 15-64',
      },
      {
        condition: { min: 15, max: 64 },
        dob: '2010-10-15',
        expected: false,
        description: 'age 14 does not match range 15-64',
      },
      {
        condition: { min: 15, max: 64 },
        dob: '1990-10-14',
        expected: true,
        description: 'age 35 matches range 15-64',
      },
      {
        condition: { min: 0, max: 0 },
        dob: '2025-10-14',
        expected: true,
        description: 'age 0 matches range 0-0',
      },
      {
        condition: { min: 0, max: 0 },
        dob: '2024-10-14',
        expected: false,
        description: 'age 1 does not match range 0-0',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('boundary conditions', () => {
    it.each([
      {
        condition: { max: 18 },
        dob: '2007-10-14',
        expected: true,
        description: 'exactly 18 years old matches max 18',
      },
      {
        condition: { max: 18 },
        dob: '2007-10-15',
        expected: true,
        description: 'age 17 matches max 18',
      },
      {
        condition: { max: 18 },
        dob: '2006-10-13',
        expected: false,
        description: 'age 19+1 day does not match max 18',
      },
      {
        condition: { min: 65 },
        dob: '1960-10-14',
        expected: true,
        description: 'exactly 65 years old matches min 65',
      },
      {
        condition: { min: 65 },
        dob: '1959-10-13',
        expected: true,
        description: 'age 66+1 day matches min 65',
      },
      {
        condition: { min: 65 },
        dob: '1960-10-15',
        expected: false,
        description: 'age 64 does not match min 65',
      },
    ])('$description', ({ condition, dob, expected }) => {
      expect(matchesAgeIfPresent(condition, dob)).toBe(expected);
    });
  });

  describe('empty object', () => {
    it('matches any age when neither min nor max is specified', () => {
      expect(matchesAgeIfPresent({}, '2010-10-14')).toBe(true);
      expect(matchesAgeIfPresent({}, '1950-10-14')).toBe(true);
      expect(matchesAgeIfPresent({}, '2025-10-14')).toBe(true);
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
      expect(matchesAgeIfPresent(15, dob as any)).toBe(false);
      expect(matchesAgeIfPresent({ min: 15 }, dob as any)).toBe(false);
    });
  });

  describe('no condition', () => {
    it('returns true when condition is undefined or null', () => {
      expect(matchesAgeIfPresent(undefined, '2010-10-14')).toBe(true);
      expect(matchesAgeIfPresent(null as any, '2010-10-14')).toBe(true);
    });
  });
});

describe('matchesFacilityWithExclusionaryLogic', () => {
  describe('when input facility is not provided', () => {
    it('returns true regardless of rule or other rules', () => {
      const allRules = [{ facilityId: 'facility-1' }, { facilityId: 'facility-2' }];
      expect(matchesFacilityWithExclusionaryLogic('facility-1', undefined, allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic(undefined, undefined, allRules)).toBe(true);
    });
  });

  describe('when rule specifies a facility', () => {
    it('returns true when rule facility matches input facility', () => {
      const allRules = [{ facilityId: 'facility-1' }, { facilityId: 'facility-2' }];
      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-1', allRules)).toBe(true);
    });

    it('returns false when rule facility does not match input facility', () => {
      const allRules = [{ facilityId: 'facility-1' }, { facilityId: 'facility-2' }];
      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-2', allRules)).toBe(
        false,
      );
      expect(matchesFacilityWithExclusionaryLogic('facility-2', 'facility-3', allRules)).toBe(
        false,
      );
    });
  });

  describe('when rule does not specify a facility (exclusionary logic)', () => {
    describe('and no other rules specify facilities', () => {
      it('returns true for any input facility', () => {
        const allRules = [{ patientBillingType: 'type-1' }, { patientAge: { min: 18 } }, {}];
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-1', allRules)).toBe(true);
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-2', allRules)).toBe(true);
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'any-facility', allRules)).toBe(
          true,
        );
      });
    });

    describe('and some other rules specify facilities', () => {
      it('returns false when input facility is explicitly specified by another rule', () => {
        const allRules = [
          { facilityId: 'facility-1' },
          { facilityId: 'facility-2' },
          { patientBillingType: 'type-1' }, // no facilityId
        ];
        // Rule without facilityId should NOT match facilities that are explicitly specified
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-1', allRules)).toBe(false);
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-2', allRules)).toBe(false);
      });

      it('returns true when input facility is not explicitly specified by any rule', () => {
        const allRules = [
          { facilityId: 'facility-1' },
          { facilityId: 'facility-2' },
          { patientBillingType: 'type-1' }, // no facilityId
        ];
        // Rule without facilityId should match all OTHER facilities
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-3', allRules)).toBe(true);
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-4', allRules)).toBe(true);
        expect(matchesFacilityWithExclusionaryLogic(undefined, 'any-other', allRules)).toBe(true);
      });
    });
  });

  describe('complex scenarios', () => {
    it('handles multiple rules with and without facility IDs correctly', () => {
      const allRules = [
        { facilityId: 'facility-A', patientBillingType: 'type-1' },
        { facilityId: 'facility-B', patientBillingType: 'type-2' },
        { patientBillingType: 'type-3' }, // no facilityId - should match all except A and B
        { patientAge: { min: 18 } }, // no facilityId - should match all except A and B
      ];

      // Rules with specific facility IDs
      expect(matchesFacilityWithExclusionaryLogic('facility-A', 'facility-A', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic('facility-A', 'facility-B', allRules)).toBe(
        false,
      );
      expect(matchesFacilityWithExclusionaryLogic('facility-B', 'facility-B', allRules)).toBe(true);

      // Rules without facility IDs (exclusionary logic)
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-A', allRules)).toBe(false);
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-B', allRules)).toBe(false);
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-C', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-D', allRules)).toBe(true);
    });

    it('handles single rule with facility ID', () => {
      const allRules = [{ facilityId: 'facility-1' }];

      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-1', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-2', allRules)).toBe(
        false,
      );
    });

    it('handles single rule without facility ID', () => {
      const allRules = [{ patientBillingType: 'type-1' }];

      // No facilities specified, so matches any facility
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-1', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-2', allRules)).toBe(true);
    });

    it('handles empty rules array', () => {
      const allRules: Array<Record<string, any>> = [];

      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-1', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-1', allRules)).toBe(true);
      expect(matchesFacilityWithExclusionaryLogic('facility-1', 'facility-2', allRules)).toBe(
        false,
      );
    });

    it('handles null and undefined facility IDs in rules', () => {
      const allRules = [
        { facilityId: 'facility-1' },
        { facilityId: null },
        { facilityId: undefined },
        {},
      ];

      // Only facility-1 is explicitly specified
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-1', allRules)).toBe(false);
      expect(matchesFacilityWithExclusionaryLogic(undefined, 'facility-2', allRules)).toBe(true);
    });
  });
});

// Helper to build mock encounter objects
const buildMockEncounter = (
  overrides: Partial<{ patientBillingType: string; patientDOB: string | null; facilityId: string }>,
) => ({
  patientBillingTypeId: overrides.patientBillingType,
  patient: {
    dateOfBirth: overrides.patientDOB,
    additionalData: overrides.patientBillingType ? [] : [{ patientBillingTypeId: undefined }],
  },
  location: {
    facilityId: overrides.facilityId,
  },
});

describe('InvoicePriceList.getIdForPatientEncounter', () => {
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

  it('returns the matching price list id when facility, patientBillingType and age match', async () => {
    const mockEncounter = buildMockEncounter({
      facilityId: 'facility-1',
      patientBillingType: 'patientType-Charity',
      // 2010-10-15 is 14 years old on 2025-10-14
      patientDOB: '2010-10-15',
    });

    const mockFindByPk = vi.fn().mockResolvedValue(mockEncounter);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    const spy = vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      {
        id: 'pl-1',
        rules: {
          facilityId: 'facility-1',
          patientBillingType: 'patientType-Charity',
          patientAge: { max: 17 },
        },
      },
      {
        id: 'pl-2',
        rules: {
          facilityId: 'facility-1',
          patientBillingType: 'patientType-Private',
          patientAge: { min: 65 },
        },
      },
    ]);

    const id = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(spy).toHaveBeenCalled();
    expect(id).toBe('pl-1');
  });

  it('returns null when no price list rules match', async () => {
    const mockEncounter = buildMockEncounter({
      facilityId: 'facility-1',
      patientBillingType: 'patientType-Charity',
    });

    const mockFindByPk = vi.fn().mockResolvedValue(mockEncounter);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      {
        id: 'pl-1',
        rules: { facilityId: 'facility-1', patientBillingType: 'patientType-Private' },
      },
    ]);

    const id = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(id).toBeNull();
  });

  it('supports exact age matching with numeric value', async () => {
    // Age 15 exactly on 2025-10-14 if DOB is 2010-10-14
    const mockEncounter = buildMockEncounter({ patientDOB: '2010-10-14' });

    const mockFindByPk = vi.fn().mockResolvedValue(mockEncounter);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: 15 } },
    ]);

    const id1 = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(id1).toBe('pl-1');
  });

  it('does not match age-based rules if DOB is missing or invalid', async () => {
    const mockEncounterNullDob = buildMockEncounter({ patientDOB: null });
    const mockEncounterInvalidDob = buildMockEncounter({ patientDOB: 'not-a-date' as any });

    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { patientAge: { max: 17 } } },
      { id: 'pl-2', rules: { patientAge: { min: 65 } } },
    ]);

    const mockFindByPk1 = vi.fn().mockResolvedValue(mockEncounterNullDob);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk1,
          },
        },
      },
      configurable: true,
    });

    const id1 = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(id1).toBeNull();

    const mockFindByPk2 = vi.fn().mockResolvedValue(mockEncounterInvalidDob);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk2,
          },
        },
      },
      configurable: true,
    });

    const id2 = await InvoicePriceList.getIdForPatientEncounter('encounter-2');
    expect(id2).toBeNull();
  });

  it('returns the matching price list id when only one matches', async () => {
    const mockEncounter = buildMockEncounter({ facilityId: 'facility-1' });

    const mockFindByPk = vi.fn().mockResolvedValue(mockEncounter);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([
      { id: 'pl-1', rules: { facilityId: 'facility-1' } },
      { id: 'pl-2', rules: { facilityId: 'facility-2' } },
    ]);

    const id = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(id).toBe('pl-1');
  });

  it('matches when unspecified rule fields are absent (treated as no constraint)', async () => {
    const mockEncounter = buildMockEncounter({});

    const mockFindByPk = vi.fn().mockResolvedValue(mockEncounter);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    vi.spyOn(InvoicePriceList as any, 'findAll').mockResolvedValue([{ id: 'pl-1', rules: {} }]);

    const id = await InvoicePriceList.getIdForPatientEncounter('encounter-1');
    expect(id).toBe('pl-1');
  });

  it('throws an error when encounter is not found', async () => {
    const mockFindByPk = vi.fn().mockResolvedValue(null);
    Object.defineProperty(InvoicePriceList, 'sequelize', {
      value: {
        models: {
          Encounter: {
            findByPk: mockFindByPk,
          },
        },
      },
      configurable: true,
    });

    await expect(InvoicePriceList.getIdForPatientEncounter('non-existent')).rejects.toThrow(
      'Encounter not found: non-existent',
    );
  });
});
