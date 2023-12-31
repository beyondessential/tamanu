import Chance from 'chance';

// use a static seed to make data generation predictable
const STATIC_SEED = '82c8a4df-0b64-4c06-9491-944284e9184b';
export const seed = STATIC_SEED;
export const chance = new Chance(STATIC_SEED);
