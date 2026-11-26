import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '@utils/navigation';
import { MedicationDispenseDetailsModal } from './MedicationDispenseDetailsModal';

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
  //
  // The dispensed table auto-refreshes, which re-renders the row and can close (detach) an open
  // menu mid-click. Retrying the whole open-menu → click-item → modal-visible sequence rides out
  // any refresh that lands between steps.
  async openModifyHistoryForPatient(patientDisplayId: string): Promise<void> {
    const row = this.rowForPatient(patientDisplayId);
    await row.waitFor({ state: 'visible' });
    await expect(async () => {
      await row.getByTestId('openbutton-d1ec').click();
      await this.page
        .getByTestId('list-i0ae')
        .getByText('View modify history')
        .click({ timeout: 5000 });
      await this.historyModalCurrentCard.waitFor({ state: 'visible', timeout: 5000 });
    }).toPass({ timeout: 30000 });
  }

  // Clicks the patient's row to open its Dispensed medication details window. The click lands on
  // the patient ID cell, clear of the actions cell, which does not open the window. Retried for the
  // same auto-refresh reason as above.
  async openDetailsForPatient(patientDisplayId: string): Promise<MedicationDispenseDetailsModal> {
    const row = this.rowForPatient(patientDisplayId);
    await row.waitFor({ state: 'visible' });
    const detailsModal = new MedicationDispenseDetailsModal(this.page, 'Dispensed medication');
    await expect(async () => {
      await row.getByText(patientDisplayId, { exact: true }).click({ timeout: 5000 });
      await detailsModal.title.waitFor({ state: 'visible', timeout: 5000 });
    }).toPass({ timeout: 30000 });
    return detailsModal;
  }
}
