import { calculateCacheSizeKiB, DEFAULT_CACHE_OPTIONS, UNSAFE_CACHE_OPTIONS } from './cacheSize';

const GiB_IN_BYTES = 1024 * 1024 * 1024;

describe('calculateCacheSizeKiB', () => {
  describe('default cache fraction', () => {
    it('scales to ~20 MiB on a 2 GiB device', () => {
      expect(calculateCacheSizeKiB(2 * GiB_IN_BYTES, DEFAULT_CACHE_OPTIONS)).toBe(20_972);
    });

    it('scales to ~40 MiB on a 4 GiB device', () => {
      expect(calculateCacheSizeKiB(4 * GiB_IN_BYTES, DEFAULT_CACHE_OPTIONS)).toBe(41_943);
    });

    it('clamps to the 64 MiB ceiling on an 8 GiB device', () => {
      expect(calculateCacheSizeKiB(8 * GiB_IN_BYTES, DEFAULT_CACHE_OPTIONS)).toBe(
        DEFAULT_CACHE_OPTIONS.maxKiB,
      );
    });

    it('clamps to the 4 MiB floor on a tiny/invalid memory reading', () => {
      expect(calculateCacheSizeKiB(-1, DEFAULT_CACHE_OPTIONS)).toBe(DEFAULT_CACHE_OPTIONS.minKiB);
      expect(calculateCacheSizeKiB(0, DEFAULT_CACHE_OPTIONS)).toBe(DEFAULT_CACHE_OPTIONS.minKiB);
    });
  });

  describe('unsafe cache fraction', () => {
    it('scales to ~250 MiB on a 2 GiB device', () => {
      expect(calculateCacheSizeKiB(2 * GiB_IN_BYTES, UNSAFE_CACHE_OPTIONS)).toBe(262_144);
    });

    it('scales to ~500 MiB on a 4 GiB device', () => {
      expect(calculateCacheSizeKiB(4 * GiB_IN_BYTES, UNSAFE_CACHE_OPTIONS)).toBe(524_288);
    });

    it('reaches exactly the 1 GiB ceiling on an 8 GiB device', () => {
      expect(calculateCacheSizeKiB(8 * GiB_IN_BYTES, UNSAFE_CACHE_OPTIONS)).toBe(
        UNSAFE_CACHE_OPTIONS.maxKiB,
      );
    });

    it('clamps to the 32 MiB floor on a tiny/invalid memory reading', () => {
      expect(calculateCacheSizeKiB(-1, UNSAFE_CACHE_OPTIONS)).toBe(UNSAFE_CACHE_OPTIONS.minKiB);
      expect(calculateCacheSizeKiB(0, UNSAFE_CACHE_OPTIONS)).toBe(UNSAFE_CACHE_OPTIONS.minKiB);
    });
  });
});
