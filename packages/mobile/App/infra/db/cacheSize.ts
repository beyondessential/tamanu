import { getTotalMemory } from 'react-native-device-info';

/** 1% of device memory, clamped to [4 MiB, 64 MiB] */
export const DEFAULT_CACHE_OPTIONS = {
  fraction: 0.01,
  minKiB: 4_096,
  maxKiB: 65_536,
} as const;

/** 12.5% of device memory, clamped to [32 MiB, 1 GiB] */
export const UNSAFE_CACHE_OPTIONS = {
  fraction: 0.125,
  minKiB: 32_768,
  maxKiB: 1_048_576,
} as const;

/** Result is in KiB — the unit SQLite's `cache_size` pragma takes when given a negative value. */
export function calculateCacheSizeKiB(
  totalMemoryBytes: number,
  { fraction, minKiB, maxKiB }: typeof DEFAULT_CACHE_OPTIONS | typeof UNSAFE_CACHE_OPTIONS,
): number {
  const targetBytes = totalMemoryBytes * fraction;
  const targetKiB = Math.round(targetBytes / 1024);
  return Math.max(minKiB, Math.min(targetKiB, maxKiB));
}

export default async function getCacheSizeKiB(
  unsafe: boolean | undefined = false,
): Promise<number> {
  const total = await getTotalMemory();
  if (Number.isFinite(total)) {
    return calculateCacheSizeKiB(total, unsafe ? UNSAFE_CACHE_OPTIONS : DEFAULT_CACHE_OPTIONS);
  }
  return unsafe ? 1_048_576 : 8_192; // Sensible fallbacks, hopefully never used
}
