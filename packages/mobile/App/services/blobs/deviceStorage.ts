// spec: CAP, CACHE
// Derived rather than configured: fleet devices vary too widely, and there's no administrator per
// device.

export interface DeviceStorageInfo {
  totalSpace: number;
  freeSpace: number;
}

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

// spec: CAP
// Proportional to capacity, clamped at both ends.
const RESERVE_SHARE_OF_TOTAL = 0.05;
const RESERVE_MIN_BYTES = 500 * MIB;
const RESERVE_MAX_BYTES = 2 * GIB;

// spec: CACHE
// The headroom term shrinks as unrelated data fills the device, so the cache yields space back.
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
