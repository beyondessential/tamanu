export function sleepAsync(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
