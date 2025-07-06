import { test, expect } from '@fixtures/baseFixture';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { convertDateFormat } from '../../utils/testHelper';

//TODO: run all the tests that open view vaccine modal in debug mode and confirm everything matches
//TODO: other vaccine has custom disease fields for given/not given and brand for given, make sure these are covered in asserts
//TODO: are there any cases i havent added tests for in terms of given/not given / multiple doses of same vaccine etc etc?
//TODO: search TODO in general, there are some TODOs in other files
//TODO: is there any way to optimise table searching/matching function?
//TODO: check regression test doc
//TODO: delete all console logs that i added
//TODO: add a test where each field uses a specified value when filling out the vaccine form (rather than relying on random selection like all the other test cases)? e.g specific location, area, department etc
//TODO: before submitting PR run the tests a bunch locally to check for any flakiness
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
    {
      specificVaccine = null,
      fillOptionalFields = false,
      viewVaccineRecord = false,
      isFollowUpVaccine = false,
      specificScheduleOption = undefined,
      specificDate = undefined,
    }: {
      specificVaccine?: string | null;
      fillOptionalFields?: boolean;
      viewVaccineRecord?: boolean;
      isFollowUpVaccine?: boolean;
      specificScheduleOption?: string;
      specificDate?: string;
    } = {},
  ) {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    const vaccine = await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(
      given,
      category,
      {
        specificVaccine: specificVaccine ?? undefined,
        fillOptionalFields,
        isFollowUpVaccine,
        specificScheduleOption,
        specificDate,
      },
    );

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    if (!vaccine.vaccineName || !vaccine.scheduleOption || !vaccine.date || !vaccine.area || !vaccine.location || !vaccine.department) {
      throw new Error('Vaccine record is missing required fields');
    }

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);

    if (!given) {
      await patientDetailsPage.patientVaccinePane?.vaccineNotGivenCheckbox.click();
    }

    await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineTable(
      vaccine.vaccineName,
      vaccine.scheduleOption!,
      vaccine.date!,
      count,
      given,
      vaccine.givenBy,
    );

    if (viewVaccineRecord) {
      const requiredParams = {
        vaccineName: vaccine.vaccineName,
        date: vaccine.date,
        area: vaccine.area,
        location: vaccine.location,
        department: vaccine.department,
        given,
        count,
        category,
        fillOptionalFields: fillOptionalFields ?? false, // default to false if undefined
        schedule: vaccine.scheduleOption,
      };

      const optionalParams = {
        batch: vaccine.vaccineBatch,
        injectionSite: vaccine.injectionSite,
        givenBy: vaccine.givenBy,
        brand: vaccine.brand,
        disease: vaccine.disease,
        notGivenClinician: vaccine.notGivenClinician,
        notGivenReason: vaccine.notGivenReason,
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

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, { specificVaccine: 'MMR' });
    await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 2, {
      specificVaccine: 'Rotavirus',
    });
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 3, {
      specificVaccine: 'COVID-19 AZ',
    });
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 4, {
      specificVaccine: 'Test Vaccine',
    });
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
    test.setTimeout(45000);
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, { specificVaccine: 'IPV' });
    await addVaccineAndAssert(patientDetailsPage, false, 'Catchup', 1, { specificVaccine: 'HPV' });
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 2, {
      specificVaccine: 'COVID-19 AZ',
    });
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 2, {
      specificVaccine: 'Test Vaccine',
    });
  });

  test('Add vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificVaccine: 'IPV',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('Select not given, add vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 0, {
      specificVaccine: 'IPV',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });


  test('Add vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('Add other vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });


  test('Select not given, add other vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 0, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('Select not given, add vaccine and view vaccine record with optional fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 0, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('Add multiple different vaccines and view each of their vaccine records', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 1, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 2, {
      specificVaccine: 'bOPV',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('Add multiple doses of the same vaccine and view each of their vaccine records', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificVaccine: 'Pentavalent',
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 2, {
      specificVaccine: 'Pentavalent',
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
      viewVaccineRecord: true,
    });
  });

  test('Select not given when giving the second scheduled dose of a vaccine', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificVaccine: 'bOPV',
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 1, {
      specificVaccine: 'bOPV',
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
      viewVaccineRecord: true,
    });
  });

  test('Add vaccine and confirm default date is today', async ({ patientDetailsPage }) => {
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat();

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);

    await expect(patientDetailsPage.patientVaccinePane?.dateFieldForSingleVaccine!).toContainText(
      convertDateFormat(currentBrowserDate),
    );
  });

  test('Add vaccine with custom date', async ({ patientDetailsPage }) => {
    const customDate = '2024-11-27';

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificDate: customDate,
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await expect(patientDetailsPage.patientVaccinePane?.dateFieldForSingleVaccine!).toContainText(
      convertDateFormat(customDate),
    );
  });

  test('Check given elsewhere checkbox', async () => {
    //TODO: this feature is currently not working as per EPI-1019, if fixed then add test case
  });
});
