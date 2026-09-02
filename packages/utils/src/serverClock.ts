/**
 * Clock authority for browser clients. Workstation clocks cannot be trusted,
 * so "now" is corrected by the offset to the connected server's clock, taken
 * from the `Date` header of the most recent HTTP response.
 */

let offsetMs = 0;

export function updateServerClockFromDateHeader(dateHeader: string | null | undefined): void {
  if (!dateHeader) return;
  const serverMs = Date.parse(dateHeader);
  if (Number.isNaN(serverMs)) return;
  offsetMs = serverMs - Date.now();
}

/** Current epoch milliseconds, corrected to the server clock where one has been seen. */
export function serverNowMs(): number {
  return Date.now() + offsetMs;
}

export function resetServerClock(): void {
  offsetMs = 0;
}
