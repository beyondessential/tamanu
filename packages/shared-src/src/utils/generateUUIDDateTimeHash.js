/*
 * Generates a 12 digit hash made up of a uuid v4 and a date
 * - First 6 digits are the first 7 digits of the uuid in base 36
 * - Second 6 digits are the timestamp converted to seconds since epoch in base 36
 *
 * Probabilities of collision estimates (based on 1 - math.exp(-0.5 * k * (k - 1) / N))
 * N = 2^28 based on 7 x hex values = 28 bits of data. This assumption is based on the first
 * 7 values of the uuid being random which they are in uuid v4 (but not in v1)
 *
 * For k,the probability of collision is 1 in p
 * k=2    p=268,435,000
 * k=10   p=5,965,000
 * k=100  p=54,000
 * k=1000 p=1,000
 *
 * eg. If 2 patients get a latest vaccine updatedAt the same time to the second then
 * there is a 1 in 268 million chance of collision
 */
export function generateUUIDDateTimeHash(uuid, date) {
  // uuid hash - 7 x hex values = 28 bits of data
  const segment = uuid.slice(0, 7);
  const number = parseInt(segment, 16);
  const uuidHash = number.toString(36).padStart(6, '0');

  // time hash
  const time = new Date(date).getTime();
  const updatedAtSeconds = (time / 1000).toFixed();
  const timeHash = Number(updatedAtSeconds)
    .toString(36)
    .padStart(6, '0');

  return `${uuidHash}${timeHash}`;
}
