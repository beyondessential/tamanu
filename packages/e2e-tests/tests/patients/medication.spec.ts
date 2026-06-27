import { test, expect } from '../../fixtures/baseFixture';
import {
  createPatientOngoingPrescriptionViaApi,
  getUser,
} from '@utils/apiHelpers';
import { MedicationDetailsModal } from '@pages/patients/MedicationsPage/modals/MedicationDetailsModal';

test.describe('Medication - Patient', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Discontinue ongoing medication defaults discontinued by to current user', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);
    await createPatientOngoingPrescriptionViaApi(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToPatientMedicationTab();

    await medicationPane.clickFirstOngoingMedicationRow();

    const detailsModal = new MedicationDetailsModal(page);
    await detailsModal.waitForModalToLoad();
    const discontinueModal = await detailsModal.clickDiscontinue();

    expect(await discontinueModal.getDiscontinuedByValue()).toBe(currentUser.displayName);
  });

  test('Discontinue ongoing medication allows changing the discontinued by user', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const currentUser = await getUser(api);
    await createPatientOngoingPrescriptionViaApi(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToPatientMedicationTab();

    await medicationPane.clickFirstOngoingMedicationRow();

    const detailsModal = new MedicationDetailsModal(page);
    await detailsModal.waitForModalToLoad();
    const discontinueModal = await detailsModal.clickDiscontinue();

    await discontinueModal.changeDiscontinuedBy(currentUser.displayName);
    await discontinueModal.fillReason('Test reason');
    await discontinueModal.submit();
  });
});
