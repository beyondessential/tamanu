import { BasePatientPage } from './BasePatientPage';
import { constructFacilityUrl } from '@utils/navigation';
import { MedicationDispenseDetailsModal } from '../medication/MedicationDispenseDetailsModal';

export class PatientEncounterPage extends BasePatientPage {
  constructor(page) {
    super(page);
  }

  // Opens the encounter's Medication tab with a not dispensed request's details window showing,
  // through the same link the not dispensed notification follows.
  async gotoNotDispensedDetails(
    patientId: string,
    encounterId: string,
    medicationRequestId: string,
  ): Promise<MedicationDispenseDetailsModal> {
    await this.page.goto(
      constructFacilityUrl(
        `/patients/all/${patientId}/encounter/${encounterId}?tab=medication&openNotDispensedId=${medicationRequestId}`,
      ),
    );
    const detailsModal = new MedicationDispenseDetailsModal(this.page, 'Not dispensed medication');
    await detailsModal.waitForModalToLoad();
    return detailsModal;
  }
}
