/*
 * Generates a 12 digit hash made up of a uuid v4
 *
 * Probabilities of collision estimates (based on 1 - math.exp(-0.5 * k * (k - 1) / N))
 * N = 2^48 based on 12 x hex values = 48 bits of data. This assumption is based on the
 * the uuid being random which they are in uuid v4 (but not in v1)
 *
 * For k,the probability of collision is 1 in p
 * k=2    p=2.81474976711e+14
 * k=10   p=6.254999482e+12
 * k=100  p=56,863,632,000
 * k=1000 p=563,513,000
 */

const HASH_LENGTH = 12;

export function generateICAOFormatUVCI(uuid) {
  const dashLessUuid = uuid.replace(/-/g, '');

  // Need to slice the initial uuid so that this number doesn't come out so big that it displays in scientific notation
  const number = parseInt(dashLessUuid.slice(0, HASH_LENGTH + 4), 16);
  const uuidHash = number.toString(36);
  const hash = uuidHash.slice(0, HASH_LENGTH);
  return hash.toLocaleUpperCase();
}
