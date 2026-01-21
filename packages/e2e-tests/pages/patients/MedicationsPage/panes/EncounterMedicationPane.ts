import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { MedicationModal, MedicationFormData } from '../modals/MedicationModal';

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
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  async waitForMedicationToAppearInTable(): Promise<void> {
    await this.medicationTable.waitFor({ state: 'visible' });
    await this.medicationSortHeader.waitFor({ state: 'visible' });
  }

  async clickNewPrescription(): Promise<MedicationModal> {
    await this.newPrescriptionButton.click();
    await this.page.waitForTimeout(500);
    const medicationModal = new MedicationModal(this.page);
    await medicationModal.waitForModalToLoad();
    return medicationModal;
  }

  async prescribeMedication(medicationData: MedicationFormData, print: boolean = false): Promise<void> {
    const modal = await this.clickNewPrescription();
    await modal.fillMedicationForm(medicationData);
    await modal.submitForm(print);
    await this.waitForPaneToLoad();
  }

  getMedicationModal(): MedicationModal {
    return new MedicationModal(this.page);
  }

  async getMedicationTableRows(): Promise<Locator> {
    return this.tableBody.locator('tr')
  }

  async getMedicationCount(): Promise<number> {
    const rows = await this.getMedicationTableRows();
    return await rows.count();
  }

  async validateMedicationInTable(medicationName: string): Promise<void> {
    const rows = await this.getMedicationTableRows();
    const count = await rows.count();
    let found = false;

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const medicationCell = row.locator('td').first();
      const text = await medicationCell.textContent();
      if (text?.includes(medicationName)) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  }

  async validateMedicationDetails(
    medicationName: string,
    expectedDose?: string,
    expectedFrequency?: string,
    expectedRoute?: string,
  ): Promise<void> {
    const rows = await this.getMedicationTableRows();
    const count = await rows.count();
    let found = false;

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      const medicationCell = cells.nth(0);
      const text = await medicationCell.textContent();

      if (text?.includes(medicationName)) {
        found = true;

        if (expectedDose) {
          const doseCell = cells.nth(1);
          const doseText = await doseCell.textContent();
          expect(doseText).toContain(expectedDose);
        }

        if (expectedFrequency) {
          const frequencyCell = cells.nth(2);
          const frequencyText = await frequencyCell.textContent();
          expect(frequencyText).toContain(expectedFrequency);
        }

        if (expectedRoute) {
          const routeCell = cells.nth(3);
          const routeText = await routeCell.textContent();
          expect(routeText).toContain(expectedRoute);
        }

        break;
      }
    }

    expect(found).toBe(true);
  }

  async clickDispenseMedication(): Promise<void> {
    await this.dispenseMedicationButton.click();
  }

  async clickShoppingCart(): Promise<void> {
    await this.shoppingCartButton.click();
  }

  async clickMedicationAdminRecord(): Promise<void> {
    await this.medicationAdminRecordButton.click();
  }

  async sortByMedication(): Promise<void> {
    await this.medicationSortHeader.click();
  }

  async sortByRoute(): Promise<void> {
    await this.routeSortHeader.click();
  }

  async sortByDate(): Promise<void> {
    await this.dateSortHeader.click();
  }

  async sortByPrescriber(): Promise<void> {
    await this.prescriberSortHeader.click();
  }
}
