/** Returns the current datetime as an ISO 9075 string (yyyy-MM-dd HH:mm:ss). */
export function nowIso9075(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/** Returns today's date as a plain date string (yyyy-MM-dd). */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
