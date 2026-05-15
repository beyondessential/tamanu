import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { NewPrescriptionModal } from '../modals/NewPrescriptionModal';

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

  readonly medicationRows: Locator;

  private newPrescriptionModal?: NewPrescriptionModal;

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

    this.medicationRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.medicationTable.waitFor({ state: 'visible' });
  }

  async waitForMedicationRowsToEqual(count: number): Promise<void> {
    await this.medicationRows.nth(count - 1).waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getNewPrescriptionModal(): NewPrescriptionModal {
    if (!this.newPrescriptionModal) {
      this.newPrescriptionModal = new NewPrescriptionModal(this.page);
    }
    return this.newPrescriptionModal;
  }

  /**
   * Click New prescription and handle the PrescriptionTypeModal if it appears.
   * If medication sets exist, a "Select prescription type" modal appears first.
   * This method selects "Single medication" and clicks Continue to reach the
   * actual prescription form.
   */
  async openNewPrescriptionModal(): Promise<NewPrescriptionModal> {
    await this.newPrescriptionButton.click();

    // Check if the PrescriptionTypeModal appeared (has "Continue" button)
    const continueButton = this.page.getByRole('button', { name: 'Continue', exact: true });
    const finaliseButton = this.page.getByTestId('medication-button-finalise-7x3d');

    // Wait for either the prescription type modal or the medication form to appear
    const result = await Promise.race([
      continueButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'prescriptionType' as const),
      finaliseButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'medicationForm' as const),
    ]);

    if (result === 'prescriptionType') {
      // PrescriptionTypeModal is open - "Single medication" is selected by default
      await continueButton.click();
    }

    const modal = this.getNewPrescriptionModal();
    await modal.waitForModalToLoad();
    return modal;
  }
}
