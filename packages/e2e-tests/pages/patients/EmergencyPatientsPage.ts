import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX, tableSortLabel } from '@ids';
import { DataTable } from '@components/DataTable';

export class EmergencyPatientsPage {
  readonly table: DataTable;
  readonly container: Locator;
  readonly heading: Locator;
  readonly statsContainer: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);
    this.container = page.getByTestId(ids.emergency.container);
    this.heading = page.getByTestId(ids.emergency.heading);
    this.statsContainer = page.getByTestId(ids.emergency.statsContainer);
  }

  /** Get the triage count for a specific level (1-5). */
  statHeader(level: number): Locator {
    return this.page.getByTestId(`header-2rlj-${level}`);
  }

  statValue(level: number): Locator {
    return this.page.getByTestId(`valuetext-0dus-${level}`);
  }

  async getTriageCounts(): Promise<Record<number, number>> {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      const text = await this.statValue(i).textContent();
      counts[i] = parseInt(text || '0', 10);
    }
    return counts;
  }
}
