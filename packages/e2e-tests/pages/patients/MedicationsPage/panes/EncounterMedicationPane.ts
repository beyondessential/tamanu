import { expect, Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { NewPrescriptionModal } from '../modals/NewPrescriptionModal';
import { MedicationDetailsModal } from '../modals/MedicationDetailsModal';

export class EncounterMedicationPane extends BasePatientPane {
  readonly contentPane!: Locator;
  readonly tableButtonRow!: Locator;
  readonly dispenseMedicationButton!: Locator;
  readonly shoppingCartButton!: Locator;
  readonly medicationAdminRecordButton!: Locator;
  readonly newPrescriptionButton!: Locator;

  readonly medicationTable!: Locator;
  readonly tableHead!: Locator;
  readonly tableBody!: Locator;

  readonly medicationSortHeader!: Locator;
  readonly doseHeader!: Locator;
  readonly frequencyHeader!: Locator;
  readonly routeSortHeader!: Locator;
  readonly dateSortHeader!: Locator;
  readonly prescriberSortHeader!: Locator;
  readonly lastOrderedHeader!: Locator;

  constructor(page: Page) {
    super(page);

    const testIds = {
      contentPane: 'tabpane-u787',
      tableButtonRow: 'tablebuttonrow-dl51',
      dispenseMedicationButton: 'styledtextbutton-hbja',
      shoppingCartButton: 'styledtextbutton-uhgj',
      medicationTable: 'styledtable-1dlu',
      tableHead: 'styledtablehead-ays3',
      tableBody: 'styledtablebody-a0jz',
      medicationSortHeader: 'tablesortlabel-0qxx-medication.name',
      doseHeader: 'tablelabel-0eff-dose',
      frequencyHeader: 'tablelabel-0eff-frequency',
      routeSortHeader: 'tablesortlabel-0qxx-route',
      dateSortHeader: 'tablesortlabel-0qxx-date',
      prescriberSortHeader: 'tablesortlabel-0qxx-prescriber.displayName',
      lastOrderedHeader: 'tablelabel-0eff-lastOrderedAt',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

    this.newPrescriptionButton = page
      .getByTestId('component-enxe')
      .filter({ hasText: 'New prescription' });
    this.medicationAdminRecordButton = page.getByRole('button', {
      name: 'Medication admin record',
      exact: true,
    });
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.medicationTable.waitFor({ state: 'visible' });
  }

  /**
   * Where the deployment has medication sets configured, New prescription opens a chooser first —
   * step through it to the single-medication form so the caller gets the same modal either way.
   */
  async openNewPrescription(): Promise<NewPrescriptionModal> {
    await this.newPrescriptionButton.click();

    const modal = new NewPrescriptionModal(this.page);
    const chooserContinue = this.page.getByRole('button', { name: 'Continue', exact: true });

    // Wait for whichever arrives — the chooser, or the form when there are no medication sets —
    // rather than assuming the chooser has already rendered.
    await expect(modal.medicationField.or(chooserContinue).first()).toBeVisible();

    if (await chooserContinue.isVisible()) {
      await this.page.getByRole('radio', { name: 'Single medication' }).check();
      await chooserContinue.click();
    }

    await modal.waitForModalToLoad();
    return modal;
  }

  async clickFirstMedicationRow(): Promise<MedicationDetailsModal> {
    // The table always renders a single <tr>: a status row (loading/error/no-data,
    // one cell with testid `statustablecell-rwkq`) until real data arrives, then data
    // rows whose cells carry `styledtablecell-2gyy-<row>-<col>`. The `statusrow-fsiy`
    // / `row-1kia` testids are never emitted to the DOM, so we cannot guard on them.
    // Wait for a real data cell before clicking, otherwise on a slow backend we click
    // the status row (no row handler) and the details modal never opens.
    const firstDataCell = this.tableBody
      .locator('[data-testid^="styledtablecell-2gyy-0-"]')
      .first();
    await firstDataCell.waitFor({ state: 'visible' });
    await firstDataCell.click();

    const detailsModal = new MedicationDetailsModal(this.page);
    await detailsModal.waitForModalToLoad();
    return detailsModal;
  }
}
