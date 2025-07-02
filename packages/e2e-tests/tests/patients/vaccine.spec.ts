import { test, expect } from '@fixtures/baseFixture';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';

//TODO: run all the tests that open view vaccine modal in debug mode and confirm everything matches
//TODO: check todos above specific tests, some still to do
//TODO: make changes to other fieldhelpers to match the changes i made?
//TODO: assert date is correct
//TODO: do test with custom date?
//TODO: test case for given elsewhere checkbox
//TODO: test case for all fields
//TODO: test case for followup vaccine
//TODO: in recorded vaccines table toggle on "include vaccines not given" and confirm it shows not given vaccines
//TODO: if using a custom given by field when filling out the form, confirm it matches the value in the recorded vaccines table
//TODO: after adding all optional parameters to recordVaccine potentially refactor to use parameter format of selectAutocompleteFieldOption
//TODO: in the assertRecordedVaccineDetails maybe its necessary to match using different date formats? e.g try both MM/DD/YYYY and DD/MM etc etc
//TODO: merge searchRecordVaccineTableForMatch and searchSpecificTableRowForMatch so all my assertions are checking specific rows instead of whole table?
//TODO: when writing function that checks table for matching vaccination record make sure it can account for multiple doses of same vaccine
//TODO: if there is no "given by" value then this is "Unknown" in the recorded vaccines table, does this change how my functions / asserts work? Currently I don't check for Unknown
//TODO: Add helper comment with params documentation to any complex functions?
//TODO: figure out a way to get rid of all the ! in the addVaccineAndAssert function
//TODO: other vaccine has custom disease fields for given/not given and brand for given, make sure these are covered in asserts
//TODO: test asserting table for multiple vaccines, multiple doses of same vaccines etc
//TODO: search TODO in general, there are some TODOs in other files
//TODO: check regression test doc
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
    fillOptionalFields?: boolean,
    viewVaccineRecord?: boolean,
  ) {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    const vaccine = await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(
      given,
      category,
      specificVaccine,
      fillOptionalFields,
    );

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);

    if (given) {
      await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineTable(
        vaccine!.vaccineName!,
        vaccine!.scheduleOption!,
        vaccine!.date!,
        count,
        vaccine!.givenBy,
      );
    }

    if (!given) {
      await patientDetailsPage.patientVaccinePane?.vaccineNotGivenCheckbox.click();
      await patientDetailsPage.patientVaccinePane?.confirmNotGivenLabelIsVisible(
        count,
        vaccine!.vaccineName!,
      );
    }

    if (viewVaccineRecord) {
      const requiredParams = {
        vaccineName: vaccine!.vaccineName!,
        date: vaccine!.date!,
        area: vaccine!.area!,
        location: vaccine!.location!,
        department: vaccine!.department!,
        given,
        count,
        category,
        fillOptionalFields,
      };

      const optionalParams = {
        batch: vaccine!.vaccineBatch!,
        schedule: vaccine!.scheduleOption!,
        injectionSite: vaccine!.injectionSite!,
        givenBy: vaccine!.givenBy!,
        brand: vaccine!.brand!,
        disease: vaccine!.disease!,
        notGivenClinician: vaccine!.notGivenClinician!,
        notGivenReason: vaccine!.notGivenReason!,
      };

      await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(
        requiredParams,
        optionalParams,
      );
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

  test('Add vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    const fillOptionalFields = false;
    const viewVaccineRecord = true;

    await addVaccineAndAssert(
      patientDetailsPage,
      true,
      'Routine',
      1,
      'IPV',
      fillOptionalFields,
      viewVaccineRecord,
    );
  });

  test('Select not given, add vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, 'IPV');
    //TODO:
  });

  //TODO: is it is possible to merge this and the next test case for other?
  test('Add vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    const fillOptionalFields = true;
    const viewVaccineRecord = true;

    await addVaccineAndAssert(
      patientDetailsPage,
      true,
      'Routine',
      1,
      'Hep B',
      fillOptionalFields,
      viewVaccineRecord,
    );
  });

  test('Add other vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    const fillOptionalFields = true;
    const viewVaccineRecord = true;

    await addVaccineAndAssert(
      patientDetailsPage,
      true,
      'Other',
      1,
      'Test Vaccine',
      fillOptionalFields,
      viewVaccineRecord,
    );
  });

  //TODO: is it possible to merge this and the next test case for non-other?
  test('Select not given, add other vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    const fillOptionalFields = true;
    const viewVaccineRecord = true;
    //TODO: this test case needs to handle reason once the reference data is added
    await addVaccineAndAssert(
      patientDetailsPage,
      false,
      'Other',
      0,
      'Test Vaccine',
      fillOptionalFields,
      viewVaccineRecord,
    );
  });

  test('Select not given, add vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    const fillOptionalFields = true;
    const viewVaccineRecord = true;

    await addVaccineAndAssert(
      patientDetailsPage,
      false,
      'Routine',
      0,
      'Hep B',
      fillOptionalFields,
      viewVaccineRecord,
    );
  });

  test('Add vaccine and confirm default date is today', async ({ patientDetailsPage }) => {
    //TODO:
    //  const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat();
  });

  test('Add vaccine with custom date', async ({ patientDetailsPage }) => {
    //TODO:
  });
});
