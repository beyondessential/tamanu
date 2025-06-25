import { test, expect } from '@fixtures/baseFixture';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';


//TODO: add tests to confirm that when you click view vaccine record all the details match
//TODO: check todos above specific tests, some still to do
//TODO: make changes to other fieldhelpers to match the changes i made?
//TODO: assert date is correct
//TODO: test case for given elsewhere checkbox
//TODO: test case for all fields
//TODO: test case for followup vaccine
//TODO: in recorded vaccines table toggle on "include vaccines not given" and confirm it shows not given vaccines
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
    specificVaccine?: string,
  ) {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    const vaccine = await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(given, category, specificVaccine);

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);

    if (given) {
      await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineDetails(vaccine!.vaccineName!, vaccine!.scheduleOption!, count);
    }
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
    test.setTimeout(45000);

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, 'MMR');
    await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 2, 'Rotavirus');
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 3, 'COVID-19 AZ');
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 4);
  });

  test('Add a routine vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 0);
  });

  test('Add a catchup vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Catchup', 0);
  });

  test('Add a campaign vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Campaign', 0);
  });

  test('Add an other vaccine (not given)', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 0);
  });

  test('Add multiple vaccines with different given statuses', async ({ patientDetailsPage }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, 'IPV');
    await addVaccineAndAssert(patientDetailsPage, false, 'Catchup', 1, 'HPV');
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 2, 'COVID-19 AZ');
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 2);
  });
});
