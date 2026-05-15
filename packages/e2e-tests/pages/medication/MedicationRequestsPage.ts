import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class MedicationRequestsPage extends BasePage {
  readonly pageContainer!: Locator;
  readonly contentPane!: Locator;
  readonly searchTitle!: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page, '/medication/active');

    const testIds = {
      pageContainer: 'pagecontainer-medication-request-listing',
      contentPane: 'styledcontentpane-medication',
      searchTitle: 'searchtabletitle-medication',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    this.pageHeading = page.getByTestId('topbarheading-go4f');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.pageContainer.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
