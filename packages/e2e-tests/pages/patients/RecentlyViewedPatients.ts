import { Locator, Page, expect } from '@playwright/test';
import { recentCard, ids } from '@ids';
import { toDisplayDate } from '@helpers/dates';

export class RecentlyViewedPatients {
  readonly navigateNextButton: Locator;

  constructor(readonly page: Page) {
    this.navigateNextButton = page.getByTestId(ids.recentlyViewed.navigateNext);
  }

  /** Get the patient name at a given index in the recently viewed list. */
  cardTitle(index: number): Locator {
    return this.page.getByTestId(recentCard('title', index));
  }

  cardText(index: number): Locator {
    return this.page.getByTestId(recentCard('text', index));
  }

  capitalizedText(index: number): Locator {
    return this.page.getByTestId(recentCard('capitalizedText', index));
  }

  subtext(index: number): Locator {
    return this.page.getByTestId(recentCard('subtext', index));
  }

  dateDisplay(index: number): Locator {
    return this.page.getByTestId(recentCard('date', index));
  }

  /** Format a date for expected display in recently viewed list. */
  static formatDateForRecentlyViewed(isoDate: string | Date): string {
    return toDisplayDate(isoDate);
  }

  async changePageSize(size: number): Promise<void> {
    await this.page.getByTestId(ids.table.recordCountDropdown).click();
    await this.page.getByText(size.toString()).click();
  }
}
