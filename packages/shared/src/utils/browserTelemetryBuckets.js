// spec: BTAG
// Bucket arithmetic for the browser telemetry rollup. Buckets sit on fixed
// boundaries measured from midnight UTC; every allowed size divides a day, so
// every size's boundaries include each midnight and buckets from different
// servers line up.

const MINUTE_MS = 60 * 1000;

const isOnBoundary = (time, bucketMinutes) => time.getTime() % (bucketMinutes * MINUTE_MS) === 0;

/** The start of the bucket of the given size that contains `time`. */
export function floorToBucket(time, bucketMinutes) {
  const bucketMs = bucketMinutes * MINUTE_MS;
  return new Date(Math.floor(time.getTime() / bucketMs) * bucketMs);
}

/**
 * The bucket to roll up next, starting where the last one ended.
 *
 * A change of bucket size takes effect from the first boundary of the new size:
 * until `start` reaches one, buckets keep the size the rollup was using, so no
 * stretch of time is skipped or counted twice. Both sizes divide a day, so the
 * previous size reaches a boundary of the new one by midnight at the latest.
 *
 * @param {Date} start where the previous bucket ended
 * @param {number} previousBucketMinutes the size the rollup was using
 * @param {number} bucketMinutes the size now configured
 * @returns {{ start: Date, end: Date, bucketMinutes: number }}
 */
export function nextBucket(start, previousBucketMinutes, bucketMinutes) {
  const size = isOnBoundary(start, bucketMinutes) ? bucketMinutes : previousBucketMinutes;
  return {
    start,
    end: new Date(start.getTime() + size * MINUTE_MS),
    bucketMinutes: size,
  };
}
