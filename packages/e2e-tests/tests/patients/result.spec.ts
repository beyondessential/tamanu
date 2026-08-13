import { expect, test } from '@fixtures/baseFixture';
import { LabRequestDetailsPage } from '@pages/patients/LabRequestPage/LabRequestDetailsPage';
import { LabRequestPane } from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { LabRequestModal } from '@pages/patients/LabRequestPage/modals/LabRequestModal';
import { getTableItems } from '@utils/testHelper';

test.setTimeout(80_000);

test.describe('Results', () => {
  test('[AT-6829] flags an out-of-range numeric result in the lab request results table', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab();

    const labRequestModal = new LabRequestModal(page);
    const labRequestPane = new LabRequestPane(page);

    // ALT is a numeric test with reference range 5–40 (both sexes), so 80 is always out of range.
    await labRequestPane.newLabRequestButton.click();
    await labRequestModal.individualModal.createBasicIndividualLabRequest(['ALT']);
    await labRequestPane.waitForTableToLoad();
    await labRequestPane.clickFirstRow();

    const labRequestDetailsPage = new LabRequestDetailsPage(page);
    await labRequestDetailsPage.waitForPageToLoad();
    await labRequestDetailsPage.enterNumericResultForFirstRow('80');
    await labRequestDetailsPage.waitForResultsTableToLoad();

    // The result is shown as entered (the unit lives in its own column, not appended to the value).
    const resultItems = await getTableItems(page, 1, 'result');
    expect(resultItems[0]).toBe('80');

    // The out-of-range result is highlighted...
    const resultCell = labRequestDetailsPage.resultsTableBody.getByTestId('cellcontainer-4zzh').first();
    const backgroundColor = await resultCell.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');

    // ...and hovering it explains why, naming the breached bound.
    await resultCell.hover();
    await expect(page.getByText('Outside normal range')).toBeVisible();
  });
});
