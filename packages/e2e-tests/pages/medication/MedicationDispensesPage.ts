import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '@utils/navigation';

export class MedicationDispensesPage extends BasePage {
  readonly table: Locator;
  readonly modifiedFootnote: Locator;
  readonly historyModalCurrentCard: Locator;
  readonly historyModalOriginalCard: Locator;
  readonly historyModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = page.getByTestId('searchtablewithpermissioncheck-medication-dispenses');
    // Shown below the table when it contains at least one pharmacy-modified fill.
    this.modifiedFootnote = page.getByText('*Prescription modified by pharmacy');
    this.historyModalCurrentCard = page.getByTestId('modify-history-current');
    this.historyModalOriginalCard = page.getByTestId('modify-history-original');
    this.historyModalCloseButton = page.getByTestId('modify-history-close');
  }

  async goto(): Promise<void> {
    await this.page.goto(constructFacilityUrl('/medication/dispensed'));
  }

  rowForPatient(patientDisplayId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: patientDisplayId });
  }

  // Opens a dispensed row's actions menu and picks "View modify history", then waits for the
  // history modal to load. The action only appears for fills modified by pharmacy at dispensing
  // time. The row actions MenuButton renders with the shared 'openbutton-d1ec' testid; scoping to
  // the patient's row keeps it unambiguous across parallel test data.
  async openModifyHistoryForPatient(patientDisplayId: string): Promise<void> {
    const row = this.rowForPatient(patientDisplayId);
    await row.waitFor({ state: 'visible' });
    await row.getByTestId('openbutton-d1ec').click();
    await this.page.getByTestId('list-i0ae').getByText('View modify history').click();
    await this.historyModalCurrentCard.waitFor({ state: 'visible' });
  }
}
