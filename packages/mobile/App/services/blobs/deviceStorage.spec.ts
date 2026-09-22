import { deriveCacheBudgetBytes, deriveFreeDiskReserveBytes } from './deviceStorage';

const GIB = 1024 ** 3;

describe('deviceStorage', () => {
  describe('deriveFreeDiskReserveBytes', () => {
    it('scales the reserve with device capacity between its bounds', () => {
      // 5% of 20 GB = 1 GB, within [500 MB, 2 GB]
      expect(deriveFreeDiskReserveBytes({ totalSpace: 20 * GIB, freeSpace: 0 })).toBe(
        Math.floor(20 * GIB * 0.05),
      );
    });

    it('clamps a tiny device up to the minimum reserve', () => {
      const reserve = deriveFreeDiskReserveBytes({ totalSpace: 2 * GIB, freeSpace: 0 });
      expect(reserve).toBe(500 * 1024 ** 2);
    });

    it('clamps a large device down to the maximum reserve', () => {
      const reserve = deriveFreeDiskReserveBytes({ totalSpace: 512 * GIB, freeSpace: 0 });
      expect(reserve).toBe(2 * GIB);
    });
  });

  describe('deriveCacheBudgetBytes', () => {
    // verifies spec: CACHE — two devices of different capacity get different budgets
    it('gives a larger-capacity device a larger budget', () => {
      const small = deriveCacheBudgetBytes({ totalSpace: 16 * GIB, freeSpace: 8 * GIB }, 0);
      const large = deriveCacheBudgetBytes({ totalSpace: 128 * GIB, freeSpace: 64 * GIB }, 0);
      expect(large).toBeGreaterThan(small);
    });

    // verifies spec: CACHE — a device filling with unrelated data gives cache space back
    it('shrinks the budget as free space falls, counting the current cache as reclaimable', () => {
      const info = { totalSpace: 64 * GIB, freeSpace: 64 * GIB };
      const roomy = deriveCacheBudgetBytes(info, 0);
      const tight = deriveCacheBudgetBytes({ ...info, freeSpace: 1 * GIB }, 2 * GIB);
      expect(tight).toBeLessThan(roomy);
    });

    it('never returns a negative budget when the device is past its reserve', () => {
      const budget = deriveCacheBudgetBytes({ totalSpace: 16 * GIB, freeSpace: 0 }, 0);
      expect(budget).toBeGreaterThanOrEqual(0);
    });
  });
});
