import Chance from 'chance';
import crypto from 'crypto';

// for some reason this isn't the same as Number.MAX_SAFE_INTEGER
const MAX_SAFE_CRYPTO_INTEGER = 281474976710655;

export const seed = crypto.randomInt(MAX_SAFE_CRYPTO_INTEGER);
export const chance = new Chance(seed);
