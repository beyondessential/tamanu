import { Locator, Page } from '@playwright/test';

import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';

export class PatientDetailsPage extends BasePatientPage {
  readonly vaccineTab: Locator;
  readonly healthIdText: Locator;
  patientVaccinePane?: PatientVaccinePane;

  constructor(page: Page) {
    super(page);

    this.vaccineTab = this.page.getByTestId('tab-vaccines');
    this.healthIdText = this.page.getByTestId('healthidtext-fqvn');
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
  }
}
