type SyncDebugLogEntry = {
  timestamp: string;
  message: string;
  data?: unknown;
};

const MAX_LOGS = 100;

class SyncDebugLogService {
  private logs: SyncDebugLogEntry[] = [];

  clear(): void {
    this.logs = [];
  }

  log(message: string, data?: unknown): void {
    const entry = { timestamp: new Date().toISOString(), message, data };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
    console.log(`[SyncDebug] ${message}`, data ?? '');
  }

  getLogs(): SyncDebugLogEntry[] {
    return [...this.logs];
  }

  formatLogs(): string {
    return this.logs
      .map(entry => {
        const dataStr = entry.data !== undefined ? `\n  ${JSON.stringify(entry.data)}` : '';
        return `${entry.timestamp}: ${entry.message}${dataStr}`;
      })
      .join('\n\n');
  }
}

export const SyncDebugLog = new SyncDebugLogService();
