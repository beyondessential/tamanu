import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  createEncounterPrescriptionViaApi,
  createPharmacyOrderViaApi,
} from '@utils/apiHelpers';

test.describe('Not dispensed medication', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Record a medication request as not dispensed', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const row = medicationRequestsPage.rowForPatient(newPatient.displayId);
    await expect(row).toBeVisible();

    const notDispensedModal = await medicationRequestsPage.openNotDispensed(newPatient.displayId);
    await notDispensedModal.selectReason();
    await notDispensedModal.confirm();

    // The request is soft deleted and drops out of the active requests list.
    await expect(row).toBeHidden();
  });
});
