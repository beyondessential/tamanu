// spec: CAP, CACHE
// Storage bounds for the device's blob store, derived from the device's own
// storage rather than configured: fleet devices vary too widely for one figure,
// and there is no administrator per device to set one the way there is per
// facility.

export interface DeviceStorageInfo {
  totalSpace: number;
  freeSpace: number;
}

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

// spec: CAP
// The free-disk floor: space the store must leave available for the device's
// own storage and the local database. Proportional to the device's capacity,
// clamped so small devices keep a workable minimum and large devices don't
// reserve more than the system plausibly needs.
const RESERVE_SHARE_OF_TOTAL = 0.05;
const RESERVE_MIN_BYTES = 500 * MIB;
const RESERVE_MAX_BYTES = 2 * GIB;

// spec: CACHE
// The cache budget: at most a modest share of the device's capacity, and never
// more than half of the space that would be free if the cache were emptied
// (above the reserve). The second term shrinks as unrelated data fills the
// device, so the budget is re-derived downward and the cache yields space back
// rather than holding to a budget it can no longer afford.
const BUDGET_SHARE_OF_TOTAL = 0.1;
const BUDGET_SHARE_OF_HEADROOM = 0.5;

export function deriveFreeDiskReserveBytes({ totalSpace }: DeviceStorageInfo): number {
  return Math.min(
    RESERVE_MAX_BYTES,
    Math.max(RESERVE_MIN_BYTES, Math.floor(totalSpace * RESERVE_SHARE_OF_TOTAL)),
  );
}

export function deriveCacheBudgetBytes(
  info: DeviceStorageInfo,
  currentCacheBytes: number,
): number {
  const reserve = deriveFreeDiskReserveBytes(info);
  const headroom = Math.max(0, info.freeSpace + currentCacheBytes - reserve);
  return Math.min(
    Math.floor(info.totalSpace * BUDGET_SHARE_OF_TOTAL),
    Math.floor(headroom * BUDGET_SHARE_OF_HEADROOM),
  );
}
