export const sleepAsync = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
