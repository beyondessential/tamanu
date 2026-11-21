import { expect } from '@playwright/test';

import { test } from '../../../fixtures/baseFixture';

const LOCATION_INFORMATION = 'Location information';
const BILLING_INFORMATION = 'Billing information';
const PERSONAL_INFORMATION = 'Personal information';

test.describe('Billing information', () => {
  // The billing fields were gathered out of Personal and Identification information into a
  // section of their own. Only the fields a deployment already shows are asserted here: the rest
  // of the section ships hidden, and unhiding one is a central setting that reaches the facility
  // server by sync, which is not something a test can arrange and then rely on.
  test('[BI-0001] gathers the billing fields into their own section below Location information', async ({
    newPatient,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatient);
    const detailsTab = await patientDetailsPage.navigateToPatientDetailsTab();
    await detailsTab.waitForSectionToLoad();
    await detailsTab.waitForBillingSectionToLoad();

    const sectionOrder = await detailsTab.getSectionOrder();
    expect(sectionOrder).toContain(PERSONAL_INFORMATION);
    expect(sectionOrder).toContain(LOCATION_INFORMATION);
    expect(sectionOrder).toContain(BILLING_INFORMATION);
    expect(sectionOrder.indexOf(BILLING_INFORMATION)).toBe(
      sectionOrder.indexOf(LOCATION_INFORMATION) + 1,
    );

    // Patient type moved here out of Personal information, so it has to be in this grid and gone
    // from the one it came from. The Personal grid is asserted visible first, or a renamed test
    // id would leave the count assertion passing against nothing.
    await expect(detailsTab.personalInformationGrid).toBeVisible();
    await expect(detailsTab.billingInformationGrid.getByText('Patient type')).toBeVisible();
    await expect(detailsTab.personalInformationGrid.getByText('Patient type')).toHaveCount(0);
  });

  test('[BI-0002] saves a patient type from the billing section and reads it back', async ({
    newPatient,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatient);
    const detailsTab = await patientDetailsPage.navigateToPatientDetailsTab();
    await detailsTab.waitForBillingSectionToLoad();

    const patientType = await detailsTab.selectPatientType();
    expect(patientType).not.toBe('');
    await detailsTab.saveButton.click();

    // Reopened from the patient list rather than re-rendered, so the value is read back from the
    // record rather than from the form state that saved it.
    const allPatientsPage = await patientDetailsPage.navigateToAllPatientsPage();
    await allPatientsPage.waitForPageToLoad();
    await allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();
    const reopenedDetailsTab = await patientDetailsPage.navigateToPatientDetailsTab();
    await reopenedDetailsTab.waitForBillingSectionToLoad();

    await expect(reopenedDetailsTab.patientTypeSelect).toContainText(patientType);
  });
});
