import { selectFacilityIds } from '../src/selectFacilityIds';
import { describe, expect, it } from 'vitest';

describe('selectFacilityIds', () => {
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
    expect(selectFacilityIds(config)).toEqual([]);
  });

  it('should throw an error if both serverFacilityId and serverFacilityIds are provided', () => {
    const config = { serverFacilityId: 'facility1', serverFacilityIds: ['facility1', 'facility2'] };
    expect(() => selectFacilityIds(config)).toThrow(
      'Both serverFacilityId and serverFacilityIds are set in config, a facility server should either have a single facility or multiple facilities, not both.',
    );
  });
});
