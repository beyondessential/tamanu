import { Locator, Page } from '@playwright/test';
import { Patient } from '@tamanu/database';

import { constructFacilityUrl } from '@utils/navigation';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';

export class PatientDetailsPage extends BasePatientPage {
  readonly vaccineTab: Locator;
  patientVaccinePane?: PatientVaccinePane;

  constructor(page: Page) {
    super(page);

    this.vaccineTab = this.page.getByTestId('tab-vaccines');
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
  }

  async goToPatient(patient: Patient) {
    console.log('going to');
    await this.page.goto(constructFacilityUrl(`/#/patients/all/${patient.id}`));
  }
}
