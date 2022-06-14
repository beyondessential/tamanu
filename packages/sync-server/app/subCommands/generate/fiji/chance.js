import Chance from 'chance';
import crypto from 'crypto';

// see https://github.com/nodejs/node/blob/v12.22.1/lib/internal/crypto/random.js#L125
const RAND_MAX = 0xffffffffffff;

export const seed = crypto.randomInt(RAND_MAX);
export const chance = new Chance(seed);
