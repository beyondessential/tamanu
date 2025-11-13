import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';

export class EncounterMedicationPane extends BasePatientPane {
  declare readonly page: Page;

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
  }
