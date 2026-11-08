import { describe, expect, it } from 'vitest';

import { floorToBucket, nextBucket } from '../../src/utils/browserTelemetryBuckets';

// spec: BTAG
const at = iso => new Date(iso);

describe('floorToBucket', () => {
  it('floors to a boundary measured from midnight UTC', () => {
    expect(floorToBucket(at('2026-11-05T13:47:12.345Z'), 60)).toEqual(at('2026-11-05T13:00:00Z'));
    expect(floorToBucket(at('2026-11-05T13:47:12.345Z'), 15)).toEqual(at('2026-11-05T13:45:00Z'));
    expect(floorToBucket(at('2026-11-05T13:47:12.345Z'), 1440)).toEqual(at('2026-11-05T00:00:00Z'));
  });

  it('leaves a time already on a boundary where it is', () => {
    expect(floorToBucket(at('2026-11-05T13:00:00Z'), 60)).toEqual(at('2026-11-05T13:00:00Z'));
  });
});

describe('nextBucket', () => {
  it('starts where the last bucket ended, at the configured size', () => {
    expect(nextBucket(at('2026-11-05T13:00:00Z'), 60, 60)).toEqual({
      start: at('2026-11-05T13:00:00Z'),
      end: at('2026-11-05T14:00:00Z'),
      bucketMinutes: 60,
    });
  });

  it('switches to a smaller size straight away, since the old boundary is also a new one', () => {
    expect(nextBucket(at('2026-11-05T13:00:00Z'), 60, 15)).toEqual({
      start: at('2026-11-05T13:00:00Z'),
      end: at('2026-11-05T13:15:00Z'),
      bucketMinutes: 15,
    });
  });

  it('keeps the previous size until the first boundary of a larger size', () => {
    let bucket = nextBucket(at('2026-11-05T22:00:00Z'), 60, 1440);
    expect(bucket).toEqual({
      start: at('2026-11-05T22:00:00Z'),
      end: at('2026-11-05T23:00:00Z'),
      bucketMinutes: 60,
    });

    bucket = nextBucket(bucket.end, bucket.bucketMinutes, 1440);
    expect(bucket.end).toEqual(at('2026-11-06T00:00:00Z'));
    expect(bucket.bucketMinutes).toBe(60);

    bucket = nextBucket(bucket.end, bucket.bucketMinutes, 1440);
    expect(bucket).toEqual({
      start: at('2026-11-06T00:00:00Z'),
      end: at('2026-11-07T00:00:00Z'),
      bucketMinutes: 1440,
    });
  });

  it('reaches a boundary of a size that is not a multiple of the old one without a gap', () => {
    // 90-minute buckets end at 01:30; 60-minute buckets resume at 03:00.
    let bucket = nextBucket(at('2026-11-05T01:30:00Z'), 90, 60);
    expect(bucket).toEqual({
      start: at('2026-11-05T01:30:00Z'),
      end: at('2026-11-05T03:00:00Z'),
      bucketMinutes: 90,
    });
    bucket = nextBucket(bucket.end, bucket.bucketMinutes, 60);
    expect(bucket).toEqual({
      start: at('2026-11-05T03:00:00Z'),
      end: at('2026-11-05T04:00:00Z'),
      bucketMinutes: 60,
    });
  });
});
