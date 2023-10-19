import { doAgeRangesHaveGaps, doAgeRangesOverlap } from '../../src/utils/dateTime';

describe('doAgeRangesHaveGaps', () => {
  it('should return true for ranges with gaps', () => {
    // Gap between [0-10)-[11-20)
    const ranges = [
      { ageMin: 0, ageMax: 10, ageUnit: 'years' },
      { ageMin: 11, ageMax: 20, ageUnit: 'years' },
      { ageMin: 21, ageMax: 30, ageUnit: 'years' },
    ];
    expect(doAgeRangesHaveGaps(ranges)).toBe(true);
  });

  it('should return false for ranges without gaps', () => {
    const ranges = [
      { ageMin: 0, ageMax: 10, ageUnit: 'years' },
      { ageMin: 10, ageMax: 20, ageUnit: 'years' },
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
    ];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });

  it('should return false for empty ranges', () => {
    const ranges = [];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });

  it('should return false for single range', () => {
    const ranges = [{ ageMin: 0, ageMax: 10, ageUnit: 'years' }];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });
});

describe('doAgeRangesOverlap', () => {
  it('should return true if ranges overlap', () => {
    const ranges = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 25, ageMax: 35, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges[0], ranges[1])).toBe(true);
  });

  it('should return true if ranges match', () => {
    const ranges = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges[0], ranges[1])).toBe(true);
  });

  it('should return false if ranges do not overlap', () => {
    const ranges = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 30, ageMax: 35, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges[0], ranges[1])).toBe(false);
  });
});
