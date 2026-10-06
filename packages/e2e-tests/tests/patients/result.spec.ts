import { expect, test } from '@fixtures/baseFixture';
import { LabRequestDetailsPage } from '@pages/patients/LabRequestPage/LabRequestDetailsPage';
import { LabRequestPane } from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { LabRequestModal } from '@pages/patients/LabRequestPage/modals/LabRequestModal';
import { getTableItems } from '@utils/testHelper';

test.setTimeout(80_000);

test.describe('Results', () => {
  test('[AT-6829] flags an out-of-range result in the lab request results table', async ({
    page,
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab();

    const labRequestModal = new LabRequestModal(page);
    const labRequestPane = new LabRequestPane(page);

    // AST carries a reference range of 5–35 (male) / 13–43 (female), so 80 is always out of
    // range. Like most analytes in the supplied reference data it is typed as free text, which
    // is the point: the flag follows the result, not the configured result type.
    await labRequestPane.newLabRequestButton.click();
    await labRequestModal.createBasicIndividualLabRequest([
      'Aspartate Aminotransferase, AST | 84451',
    ]);
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
    await expect(page.getByText(/>(35|43)U\/L/)).toBeVisible();
  });
});
