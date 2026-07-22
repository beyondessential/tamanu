import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { MedicationDetailsModal } from '../modals/MedicationDetailsModal';

export class PatientMedicationPane extends BasePatientPane {
  readonly ongoingMedicationsTable: Locator;
  readonly ongoingMedicationsTableBody: Locator;

  constructor(page: Page) {
    super(page);
    this.ongoingMedicationsTable = page.getByTestId('ongoing-medications-table');
    this.ongoingMedicationsTableBody = this.ongoingMedicationsTable.getByTestId(
      'styledtablebody-a0jz',
    );
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.ongoingMedicationsTable.waitFor({ state: 'visible' });
  }

  async clickFirstOngoingMedicationRow(): Promise<MedicationDetailsModal> {
    // The table always renders a single <tr>: a status row (loading/error/no-data,
    // one cell with testid `statustablecell-rwkq`) until real data arrives, then data
    // rows whose cells carry `styledtablecell-2gyy-<row>-<col>`. The `statusrow-fsiy`
    // / `row-1kia` testids are never emitted to the DOM, so we cannot guard on them.
    // Wait for a real data cell before clicking, otherwise on a slow backend we click
    // the status row (no row handler) and the details modal never opens.
    const firstDataCell = this.ongoingMedicationsTableBody
      .locator('[data-testid^="styledtablecell-2gyy-0-"]')
      .first();
    await firstDataCell.waitFor({ state: 'visible' });
    await firstDataCell.click();

    const detailsModal = new MedicationDetailsModal(this.page);
    await detailsModal.waitForModalToLoad();
    return detailsModal;
  }
}
