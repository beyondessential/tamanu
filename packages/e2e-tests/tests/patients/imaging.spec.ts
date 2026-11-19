import { APIRequestContext, Page } from '@playwright/test';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { expect, test } from '@fixtures/baseFixture';
import { ImagingRequestDetailsPage } from '@pages/patients/ImagingRequestPage/ImagingRequestDetailsPage';
import { createImagingRequestViaApi, getCurrentEncounterViaApi, getUser } from '@utils/apiHelpers';

const { PENDING, COMPLETED } = IMAGING_REQUEST_STATUS_TYPES;

const openImagingRequest = async (
  page: Page,
  api: APIRequestContext,
  patientId: string,
  status: string,
) => {
  const encounter = await getCurrentEncounterViaApi(api, patientId);
  const imagingRequest = await createImagingRequestViaApi(api, encounter.id, status);
  const detailsPage = new ImagingRequestDetailsPage(page);
  await detailsPage.goto(patientId, encounter.id, imagingRequest.id);
  return detailsPage;
};

test.describe('Imaging request Completed by', () => {
  test('defaults to the current user when the status changes to Completed', async ({
    page,
    api,
    newPatientWithHospitalAdmission: patient,
  }) => {
    const { displayName } = await getUser(api);
    const detailsPage = await openImagingRequest(page, api, patient.id, PENDING);

    await detailsPage.selectStatus('Completed');
    await expect(detailsPage.completedByInput).toHaveValue(displayName);
  });

  test('is empty when a Completed request is opened', async ({
    page,
    api,
    newPatientWithHospitalAdmission: patient,
  }) => {
    const detailsPage = await openImagingRequest(page, api, patient.id, COMPLETED);

    await expect(detailsPage.statusSelect).toContainText('Completed');
    await expect(detailsPage.completedByInput).toHaveValue('');
  });

  test('keeps a chosen clinician when the status changes away from Completed and back', async ({
    page,
    api,
    newPatientWithHospitalAdmission: patient,
  }) => {
    const { displayName } = await getUser(api);
    const detailsPage = await openImagingRequest(page, api, patient.id, PENDING);

    await detailsPage.selectStatus('Completed');
    await expect(detailsPage.completedByInput).toHaveValue(displayName);
    const chosenClinician = await detailsPage.changeCompletedBy(displayName);

    await detailsPage.selectStatus('In progress');
    await detailsPage.selectStatus('Completed');
    await expect(detailsPage.completedByInput).toHaveValue(chosenClinician);
  });
});
