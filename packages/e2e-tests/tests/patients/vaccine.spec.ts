import { test, expect } from '@fixtures/baseFixture';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';

test.describe('Vaccines', () => {
  test.beforeEach(async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
  });

  async function addVaccineAndAssert(
    patientDetailsPage: PatientDetailsPage,
    given: boolean,
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
    count: number = 1,
  ) {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(given, category);

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);
  }

  test('Add a routine vaccine', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine');
  });

  test('Add a catchup vaccine', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Catchup');
  });

  test('Add a campaign vaccine', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign');
  });

  test('Add an other vaccine', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Other');
  });

  test('Add multiple vaccines of different types', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine');
    await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 2);
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 3);
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 4);
  });

  test('Add a routine vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Routine');
  });

  test('Add a catchup vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Catchup');
  });

  test('Add a campaign vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Campaign');
  });

  test('Add an other vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Other');
  });

  test('Add multiple vaccines with different given statuses', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);
    await addVaccineAndAssert(patientDetailsPage, false, 'Catchup', 1);
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 2);
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 2);
  });
});
