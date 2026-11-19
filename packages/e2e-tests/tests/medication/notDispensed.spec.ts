import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  createEncounterPrescriptionViaApi,
  createPharmacyOrderViaApi,
  getMedicationRequestIdViaApi,
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

  test('Not dispensed details show the prescription type and remaining repeats', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
    patientEncounterPage,
  }) => {
    test.setTimeout(60000);

    // An Outpatient/Discharge order: the window reads a missing type as Inpatient, so only this
    // type shows the type actually reached it. It also shows Remaining repeats, which an Inpatient
    // order does not.
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id, {
      isDischargePrescription: true,
    });
    const medicationRequestId = await getMedicationRequestIdViaApi(api, page, newPatient.displayId);

    await medicationRequestsPage.goto();

    const row = medicationRequestsPage.rowForPatient(newPatient.displayId);
    const notDispensedModal = await medicationRequestsPage.openNotDispensed(newPatient.displayId);
    await notDispensedModal.selectReason();
    await notDispensedModal.confirm();
    await expect(row).toBeHidden();

    const details = await patientEncounterPage.gotoNotDispensedDetails(
      newPatient.id,
      encounter.id,
      medicationRequestId,
    );
    await expect(details.field('Prescription type')).toContainText('Outpatient/Discharge');
    await expect(details.field('Remaining repeats')).toBeVisible();
  });
});
