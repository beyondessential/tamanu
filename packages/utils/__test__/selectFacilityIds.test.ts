import { facilityIdsFromEnv, selectFacilityIds } from '../src/selectFacilityIds';
import { afterEach, describe, expect, it } from 'vitest';

describe('selectFacilityIds', () => {
  afterEach(() => {
    delete process.env.TAMANU_FACILITY_IDS;
  });

  it('should prefer TAMANU_FACILITY_IDS over config', () => {
    process.env.TAMANU_FACILITY_IDS = 'env-a,env-b';
    expect(selectFacilityIds({ serverFacilityIds: ['config-a'] })).toEqual(['env-a', 'env-b']);
  });

  it('should fall back to config when TAMANU_FACILITY_IDS names no facility', () => {
    process.env.TAMANU_FACILITY_IDS = ' , ';
    expect(selectFacilityIds({ serverFacilityIds: ['config-a'] })).toEqual(['config-a']);
  });

  it('should return the env ids when config has none', () => {
    process.env.TAMANU_FACILITY_IDS = 'env-a';
    expect(selectFacilityIds({})).toEqual(['env-a']);
  });

  it('should return an array with serverFacilityId if only serverFacilityId is provided', () => {
    const config = { serverFacilityId: 'facility1' };
    expect(selectFacilityIds(config)).toEqual(['facility1']);
  });

  it('should return serverFacilityIds if only serverFacilityIds is provided', () => {
    const config = { serverFacilityIds: ['facility1', 'facility2'] };
    expect(selectFacilityIds(config)).toEqual(['facility1', 'facility2']);
  });

  it('should return an empty array if neither serverFacilityId nor serverFacilityIds are provided', () => {
    const config = {};
    expect(selectFacilityIds(config)).toEqual(undefined);
  });

  it('should throw an error if both serverFacilityId and serverFacilityIds are provided', () => {
    const config = { serverFacilityId: 'facility1', serverFacilityIds: ['facility1', 'facility2'] };
    expect(() => selectFacilityIds(config)).toThrow(
      'Both serverFacilityId and serverFacilityIds are set in config, a facility server should either have a single facility or multiple facilities, not both.',
    );
  });
});

describe('facilityIdsFromEnv', () => {
  afterEach(() => {
    delete process.env.TAMANU_FACILITY_IDS;
  });

  it('should return undefined when the variable is unset', () => {
    expect(facilityIdsFromEnv()).toBeUndefined();
  });

  it('should return undefined for an empty variable, rather than an empty list', () => {
    process.env.TAMANU_FACILITY_IDS = '';
    expect(facilityIdsFromEnv()).toBeUndefined();
  });

  it('should split a single id into a one-element array', () => {
    process.env.TAMANU_FACILITY_IDS = 'facility1';
    expect(facilityIdsFromEnv()).toEqual(['facility1']);
  });

  it('should trim, dedupe and drop blanks, preserving first-seen order', () => {
    process.env.TAMANU_FACILITY_IDS = ' facility2 , facility1,facility2 ,, ';
    expect(facilityIdsFromEnv()).toEqual(['facility2', 'facility1']);
  });

  // A set variable holding nothing usable resolves to no facilities rather than
  // falling through to config, which leaves the server unconfigured.
  it('should return an empty list, not undefined, when the variable holds only separators', () => {
    process.env.TAMANU_FACILITY_IDS = ' , , ';
    expect(facilityIdsFromEnv()).toEqual([]);
  });
});
