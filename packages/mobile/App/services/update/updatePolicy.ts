/**
 * The decisions behind the update screen, kept apart from the screen and the native module so they
 * can be reasoned about and tested on their own.
 */

/** Attempts after which the manual download address is offered alongside automatic retries. */
export const ATTEMPTS_BEFORE_MANUAL_FALLBACK = 3;

const FIRST_RETRY_DELAY_MS = 5 * 1000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

/**
 * How long to wait before the next download attempt. The gap lengthens with each failure so a
 * device with no usable connection stops hammering it, and settles at five minutes so a connection
 * that comes back is picked up without the user doing anything.
 */
export function retryDelay(failedAttempts: number): number {
  if (failedAttempts < 1) return 0;
  const delay = FIRST_RETRY_DELAY_MS * 2 ** (failedAttempts - 1);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

/**
 * Whether the manual download address should be offered. It appears once automatic retries have
 * had a fair go, and straight away for a failure retrying cannot fix.
 */
export function shouldOfferManualFallback(failedAttempts: number): boolean {
  return failedAttempts >= ATTEMPTS_BEFORE_MANUAL_FALLBACK;
}

/**
 * Installing needs room for the package itself as well as the copy Android unpacks, so a device
 * with only just enough space for the download would fail at the install instead.
 */
export function hasEnoughSpace(freeBytes: number, packageBytes: number): boolean {
  return freeBytes >= packageBytes * 2;
}

/**
 * The address the app asks for its package. The app adds its own branding, which the server it
 * connects to does not know.
 */
export function buildPackageUrl(updateUrl: string, branding: string): string {
  const separator = updateUrl.includes('?') ? '&' : '?';
  return `${updateUrl}${separator}branding=${encodeURIComponent(branding)}`;
}

/** The proportion downloaded, or null while the server's declared size is unknown. */
export function downloadProportion(downloadedBytes: number, totalBytes: number): number | null {
  if (!totalBytes || totalBytes <= 0) return null;
  return Math.min(downloadedBytes / totalBytes, 1);
}
