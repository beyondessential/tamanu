import { expect, Locator, Page } from '@playwright/test';

/** Clinician tasking region on the main dashboard (filter + task table). */
export class DashboardTaskPane {
  readonly pane: Locator;
  readonly tabPane: Locator;
  readonly locationInput: Locator;
  readonly highPriorityOnlyInput: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.pane = page.getByTestId('dashboardtaskpane-42x7');
    this.tabPane = page.getByTestId('tabpane-s00l');
    this.locationInput = this.pane.getByTestId('locationinput-aabz');
    this.highPriorityOnlyInput = this.pane.getByTestId('styledcheckinput-fzec');
    this.table = this.pane.getByTestId('styledtable-l8ab');
  }

  async setHighPriorityOnly(enabled: boolean): Promise<void> {
    const checkbox = this.highPriorityOnlyInput.getByRole('checkbox');
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async assertTaskVisible(taskName: string): Promise<void> {
    await expect(this.pane.getByText(taskName)).toBeVisible({ timeout: 20_000 });
  }

  async assertTaskNotVisible(taskName: string): Promise<void> {
    await expect(this.pane.getByText(taskName)).toHaveCount(0);
  }

  async sortByColumn(columnName: string): Promise<void> {
    await this.table.getByRole('columnheader', { name: columnName }).click();
  }

  async expectColumnSort(columnName: string, direction: 'ascending' | 'descending'): Promise<void> {
    await expect(this.table.getByRole('columnheader', { name: columnName })).toHaveAttribute(
      'aria-sort',
      direction,
    );
  }
}
