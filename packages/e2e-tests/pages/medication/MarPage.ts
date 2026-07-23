import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '@utils/navigation';

// The Medication Administration Record for a single encounter. Reached directly by URL rather than
// clicking through the encounter view, to keep the test focused on the "View change" behaviour.
export class MarPage extends BasePage {
  readonly viewChangeLink: Locator;
  readonly historyModalCurrentCard: Locator;
  readonly historyModalOriginalCard: Locator;
  readonly historyModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    // Rendered on a MAR medication row only when the latest fill was modified by pharmacy with a
    // note flagged for MAR display (see getDisplayedPharmacyNote / MarTableRow).
    this.viewChangeLink = page.getByTestId('mar-view-change');
    this.historyModalCurrentCard = page.getByTestId('modify-history-current');
    this.historyModalOriginalCard = page.getByTestId('modify-history-original');
    this.historyModalCloseButton = page.getByTestId('modify-history-close');
  }

  async goto(patientId: string, encounterId: string): Promise<void> {
    await this.page.goto(
      constructFacilityUrl(`/patients/all/${patientId}/encounter/${encounterId}/mar/view`),
    );
  }

  // Clicks the "View change" link on the (single) modified medication's MAR row and waits for the
  // change-history modal. The MAR auto-refreshes, so retrying the click → modal-visible sequence
  // rides out a re-render that lands mid-interaction.
  async openViewChange(): Promise<void> {
    const link = this.viewChangeLink.first();
    await link.waitFor({ state: 'visible' });
    await expect(async () => {
      await link.click({ timeout: 5000 });
      await this.historyModalCurrentCard.waitFor({ state: 'visible', timeout: 5000 });
    }).toPass({ timeout: 30000 });
  }
}
