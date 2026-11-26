import { test, expect } from '@fixtures/baseFixture';
import { assignPortalForm, issuePortalLoginCode } from '@utils/centralDatabase';
import { testData } from '@utils/testData';

test.describe('Patient portal', () => {
  test('[PORTAL-0001] Patient signs in with an emailed code and logs out', async ({
    portalPatient,
    portalLoginPage,
    portalDashboardPage,
  }) => {
    await portalLoginPage.goto();
    await portalLoginPage.requestCode(portalPatient.email);
    await expect(portalLoginPage.emailSentText).toBeVisible();

    await portalLoginPage.enterCode(await issuePortalLoginCode(portalPatient.portalUserId));
    await expect(portalDashboardPage.greeting(portalPatient.firstName)).toBeVisible();
    await expect(portalDashboardPage.allUpToDateText).toBeVisible();
    await expect(portalDashboardPage.detailsSection).toContainText(portalPatient.displayId);

    await portalDashboardPage.logOut();
    await expect(portalLoginPage.title).toBeVisible();
  });

  test('[PORTAL-0002] A wrong code does not sign the patient in', async ({
    portalPatient,
    portalLoginPage,
    portalDashboardPage,
  }) => {
    await portalLoginPage.goto();
    await portalLoginPage.requestCode(portalPatient.email);
    await issuePortalLoginCode(portalPatient.portalUserId);

    await portalLoginPage.enterCode('000000');
    await expect(portalLoginPage.invalidCodeText).toBeVisible();

    await portalDashboardPage.goto();
    await expect(portalLoginPage.title).toBeVisible();
  });

  test('[PORTAL-0003] Patient updates their primary contact number', async ({
    signedInPortalPatient: _signedIn,
    portalDashboardPage,
    portalEditDetailsPage,
  }) => {
    const phoneNumber = '021 555 0147';

    await portalDashboardPage.editDetailsLink.click();
    await expect(portalEditDetailsPage.title).toBeVisible();
    // The deployment's translations rename Mobile phone, as the default reference data does here
    await portalEditDetailsPage.detail('Primary contact number').fill(phoneNumber);
    await portalEditDetailsPage.saveButton.click();

    await expect(portalDashboardPage.detailsSavedMessage).toBeVisible();
    await expect(portalDashboardPage.detailsSection).toContainText(phoneNumber);
  });

  test('[PORTAL-0004] Patient fills in and submits a form they were sent', async ({
    signedInPortalPatient,
    portalDashboardPage,
    patientSurveyFormPane: form,
  }) => {
    await assignPortalForm({
      patientId: signedInPortalPatient.id,
      surveyId: testData.kioskDemo.healthQuestionsSurveyId,
      facilityId: testData.facilityId,
    });
    await portalDashboardPage.goto();

    await portalDashboardPage.formToFillIn(testData.kioskDemo.healthQuestionsSurveyName).click();
    await form.nextButton.click();
    await expect(form.requiredMessages).toHaveCount(1);
    await form.answerText('What is the main reason for your visit?', 'Check-up');
    await form.nextButton.click();
    await form.answerYesNo('Do you have a fever, cough or sore throat today?', 'No');
    await form.nextButton.click();
    await form.submitButton.click();

    await expect(portalDashboardPage.formSubmittedMessage).toBeVisible();
    await expect(portalDashboardPage.allUpToDateText).toBeVisible();
  });
});
