import Chance from 'chance';
export const chance = new Chance();

export function upto(max = 100): Iterable<number> {
  const top = chance.natural({ min: 0, max });
  return Array(top).keys();
}

export function possibly<T, U>(value: T, percentChance = 50, fallback?: U): T | (U | null) {
  return chance.bool({ likelihood: Math.max(0, Math.min(percentChance, 100)) })
    ? value
    : fallback ?? null;
}
