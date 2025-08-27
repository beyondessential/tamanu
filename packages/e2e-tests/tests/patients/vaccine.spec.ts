import { test, expect } from '@fixtures/baseFixture';
import { convertDateFormat, offsetYear } from '../../utils/testHelper';
import {
  addVaccineAndAssert,
  triggerDateError,
  editVaccine,
  assertEditedVaccine,
  expectedDueDateWeek,
  recordScheduledVaccine,
  confirmVaccineNoLongerScheduled,
} from '@utils/vaccineTestHelpers';
import { createPatient } from '@utils/apiHelpers';
import { scrollTableToElement } from '@utils/tableHelper';
import { subYears, subWeeks } from 'date-fns';

test.describe('Recorded vaccines', () => {
  test.beforeEach(async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
  });

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

  test('Add other vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('Select not given, add other vaccine and view vaccine record with just required fields filled', async ({
    patientDetailsPage,
  }) => {
    await addVaccineAndAssert(patientDetailsPage, false, 'Other', 0, {
      specificVaccine: 'Test Vaccine',
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

    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 1, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });

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

    await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 1, {
      specificVaccine: 'bOPV',
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
      viewVaccineRecord: true,
    });
  });

  test('Add vaccine and confirm default date is today', async ({ patientDetailsPage }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);

    await expect(patientDetailsPage.patientVaccinePane?.dateFieldForSingleVaccine!).toContainText(
      convertDateFormat(currentBrowserDate),
    );
  });

  test('Add vaccine with custom date given', async ({ patientDetailsPage }) => {
    //Date is one year ago - a patient is always 18+ years old so this avoids any validation errors
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
    const dateGiven = offsetYear(currentBrowserDate, 'decrease', 1);

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificDate: dateGiven,
      viewVaccineRecord: true,
    });

    await expect(patientDetailsPage.patientVaccinePane?.dateFieldForSingleVaccine!).toContainText(
      convertDateFormat(dateGiven),
    );
  });

  test('Date given cannot be before patient date of birth', async ({
    patientDetailsPage,
    newPatient,
  }) => {
    const dateBeforePatientDob = offsetYear(newPatient.dateOfBirth!, 'decrease', 1);
    const expectedErrorMessage = 'Date cannot be prior to patient date of birth';

    //Attempt to submit a date before the patient's date of birth and assert the expected error message appears
    await triggerDateError(patientDetailsPage, dateBeforePatientDob, expectedErrorMessage);
  });

  test('Date given cannot be in the future', async ({ patientDetailsPage }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
    const futureDateGiven = offsetYear(currentBrowserDate, 'increase', 1);
    const expectedErrorMessage = 'Date cannot be in the future';

    //Attempt to submit a future date and assert the expected error message appears
    await triggerDateError(patientDetailsPage, futureDateGiven, expectedErrorMessage);
  });

  test('Mandatory fields must be filled', async ({ patientDetailsPage }) => {
    const expectedAreaAndLocationError =
      'locationId must be a `string` type, but the final value was: `null`';
    const expectedDepartmentError =
      'departmentId must be a `string` type, but the final value was: `null`';
    const genericExpectedError = 'Required';

    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    //Attempt to submit without filling any fields
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.confirmButton.click();

    //Assert the expected validation errors appear
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.areaFieldIncludingError!,
    ).toContainText(expectedAreaAndLocationError);
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.locationFieldIncludingError!,
    ).toContainText(expectedAreaAndLocationError);
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.departmentFieldIncludingError!,
    ).toContainText(expectedDepartmentError);
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.categoryRequiredError!,
    ).toContainText(genericExpectedError);
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.consentGivenRequiredError!,
    ).toContainText(genericExpectedError);

    //Select a category to trigger validation on the vaccine field
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.categoryRoutineRadio.click();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.confirmButton.click();

    //Assert the vaccine field validation error now appears
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.vaccineNameRequiredError!,
    ).toContainText(genericExpectedError);
  });

  test('Edit a vaccine and edit all fields', async ({ patientDetailsPage }) => {
    const given = true;
    const category = 'Routine';
    const fillOptionalFields = true;

    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
    //The vaccine is created with today's date and this edits it to be one year ago
    //A patient is always 18+ years old so one year ago avoids any validation errors
    const editedDateGiven = offsetYear(currentBrowserDate, 'decrease', 1);

    const vaccine = await addVaccineAndAssert(patientDetailsPage, given, category, 1, {
      fillOptionalFields: fillOptionalFields,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(patientDetailsPage, vaccine, {
      batch: 'Edited batch field',
      dateGiven: editedDateGiven,
      givenBy: 'Edited given by field',
      consentGivenBy: 'Edited consent field',
    });

    await assertEditedVaccine(patientDetailsPage, editedVaccine);
  });

  test('Edit a vaccine and fill fields that were originally skipped', async ({
    patientDetailsPage,
  }) => {
    const vaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientDetailsPage,
      vaccine,
      {
        batch: 'New batch field',
        givenBy: 'New given by field',
        consentGivenBy: 'New consent field',
        injectionSite: 'To be edited automatically',
      },
      true,
    );

    await assertEditedVaccine(patientDetailsPage, editedVaccine);
  });

  test('Edit unique fields for other vaccine', async ({ patientDetailsPage }) => {
    const vaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientDetailsPage,
      vaccine,
      {
        brand: 'Edited brand',
        disease: 'Edited disease',
      },
      true,
    );

    await assertEditedVaccine(patientDetailsPage, editedVaccine);
  });

  test('Edit unique fields for not given vaccine', async ({ patientDetailsPage }) => {
    const vaccine = await addVaccineAndAssert(patientDetailsPage, false, 'Routine', 0, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientDetailsPage,
      vaccine,
      {
        //The current value is given because this is a prefilled dropdown field and we want to avoid this current value
        notGivenReason: vaccine.notGivenReason,
        notGivenClinician: 'Edited clinician',
      },
      true,
    );

    await patientDetailsPage.patientVaccinePane?.vaccineNotGivenCheckbox.click();

    await assertEditedVaccine(patientDetailsPage, editedVaccine);
  });

  test('Edit one vaccine when multiple are present', async ({ patientDetailsPage }) => {
    const firstVaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 1);

    const secondVaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 2);

    //Updates the count to 2 after a second vaccine is added
    firstVaccine.count = 2;

    const editedVaccine = await editVaccine(patientDetailsPage, firstVaccine, {
      batch: 'Edited batch field',
      givenBy: 'Edited given by field',
      consentGivenBy: 'Edited consent field',
      injectionSite: 'Will be edited automatically',
    });

    //Confirm the first vaccine is edited as expected
    await assertEditedVaccine(patientDetailsPage, editedVaccine);

    //Confirm the second vaccine is not edited
    await assertEditedVaccine(patientDetailsPage, secondVaccine);
  });

  test('Validation works when editing a vaccine', async ({ patientDetailsPage }) => {
    const vaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientDetailsPage.patientVaccinePane?.clickEditVaccineButton(vaccine);

    expect(patientDetailsPage.patientVaccinePane?.editVaccineModal).toBeDefined();

    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.clearAllFields();

    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.submitEditsButton.click();

    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertRequiredFieldErrors();
  });

  test('Delete a vaccine', async ({ patientDetailsPage }) => {
    const vaccineToDelete = await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1);
    const vaccineToKeep = await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 2);
    const vaccineCountAfterDeletion = 1;

    //Update the count to 2 after the second vaccine is added
    vaccineToDelete.count = 2;

    if (!vaccineToDelete || !vaccineToKeep) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientDetailsPage.patientVaccinePane?.deleteVaccine(vaccineToDelete);

    //Assert that the vaccine to keep remains unchanged and only the deleted vaccine is removed
    await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(vaccineToKeep);

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(
      vaccineCountAfterDeletion,
    );
  });

  test('Vaccine does not appear in dropdown if all doses have been given (vaccine with 1 dose)', async ({
    patientDetailsPage,
  }) => {
    const category = 'Routine';
    const vaccine = await addVaccineAndAssert(patientDetailsPage, true, category, 1, {
      specificVaccine: 'Hep B',
    });

    if (!vaccine || !vaccine.vaccineName) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.assertVaccineNotInDropdown(
      category,
      vaccine.vaccineName,
    );
  });

  test('Vaccine does not appear in dropdown if all doses have been given (vaccine with multiple doses)', async ({
    patientDetailsPage,
  }) => {
    const category = 'Routine';
    const vaccineName = 'Rotavirus';

    const firstDose = await addVaccineAndAssert(patientDetailsPage, true, category, 1, {
      specificVaccine: vaccineName,
    });

    const secondDose = await addVaccineAndAssert(patientDetailsPage, true, category, 2, {
      specificVaccine: vaccineName,
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
    });

    if (!firstDose || !secondDose) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.assertVaccineNotInDropdown(
      category,
      vaccineName,
    );
  });

  test('Not given vaccines should be hidden if there is a corresponding given vaccine (desktop only)', async ({
    patientDetailsPage,
  }) => {
    const uniqueVaccineName = 'Hep B';
    const matchingVaccineName = 'MMR';

    const uniqueNotGivenVaccine = await addVaccineAndAssert(
      patientDetailsPage,
      false,
      'Routine',
      0,
      {
        specificVaccine: uniqueVaccineName,
      },
    );
    const matchingNotGivenVaccine = await addVaccineAndAssert(
      patientDetailsPage,
      false,
      'Catchup',
      0,
      {
        specificVaccine: matchingVaccineName,
      },
    );
    const givenVaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 1, {
      specificVaccine: matchingVaccineName,
    });
    //When given and not given vaccinations are both displayed the count should be 2 instead of 3 since the given vaccine replaces matchingNotGivenVaccine
    const totalVaccineCount = 2;
    uniqueNotGivenVaccine.count = totalVaccineCount;
    givenVaccine.count = totalVaccineCount;

    if (!uniqueNotGivenVaccine || !matchingNotGivenVaccine || !givenVaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    //Confirms only two vaccines are displayed in the table and neither of them are the not given vaccine that should be hidden
    await patientDetailsPage.patientVaccinePane?.vaccineNotGivenCheckbox.click();
    await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(uniqueNotGivenVaccine);
    await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(givenVaccine);
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(
      totalVaccineCount,
    );
  });

  test('Recorded vaccines table can be sorted by clicking column headers', async ({
    patientDetailsPage,
  }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
    const dateOneYearAgo = offsetYear(currentBrowserDate, 'decrease', 1);
    const dateTwoYearsAgo = offsetYear(currentBrowserDate, 'decrease', 2);

    const vaccines = [
      await addVaccineAndAssert(patientDetailsPage, true, 'Catchup', 1, {
        specificVaccine: 'Rotavirus',
        specificDate: currentBrowserDate,
      }),
      await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 2, {
        specificVaccine: 'Hep B',
        specificDate: dateOneYearAgo,
      }),
      await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 3, {
        specificVaccine: 'TCV Typhoid',
        specificDate: dateTwoYearsAgo,
      }),
    ];

    if (!vaccines.every(vaccine => vaccine)) {
      throw new Error('Vaccine records were not created successfully');
    }

    //Clicks the vaccine column header to sort the table in descending order by vaccine name
    await patientDetailsPage.patientVaccinePane?.vaccineColumnHeader.click();
    await patientDetailsPage.patientVaccinePane?.assertVaccineOrder(vaccines, 'vaccine', 'desc');

    //Clicks the vaccine column header to sort the table in ascending order by vaccine name
    await patientDetailsPage.patientVaccinePane?.vaccineColumnHeader.click();
    await patientDetailsPage.patientVaccinePane?.assertVaccineOrder(vaccines, 'vaccine', 'asc');

    //Clicks the date column header to sort the table in descending order by date
    await patientDetailsPage.patientVaccinePane?.dateColumnHeader.click();
    await patientDetailsPage.patientVaccinePane?.assertVaccineOrder(vaccines, 'date', 'desc');

    //Clicks the date column header to sort the table in ascending order by date
    await patientDetailsPage.patientVaccinePane?.dateColumnHeader.click();
    await patientDetailsPage.patientVaccinePane?.assertVaccineOrder(vaccines, 'date', 'asc');
  });


});

//TODO: check other todos in other files (jsdocs, consoles etc)
//TODO: add any remaining vaccine tests from slack?
test.describe('Scheduled vaccines', () => {
  test('Vaccines scheduled at birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDueDate = await expectedDueDateWeek(currentDate, 'weeks', 1);
    const status = 'Due';
    const schedule = 'Birth';
    
    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('BCG', schedule, birthDueDate, status);
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('Hep B', schedule, birthDueDate, status);
  });

  test('Vaccines scheduled weeks from birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const status = 'Scheduled';

    const sixWeekDueDate = await expectedDueDateWeek(currentDate, 'weeks', 6);
    const tenWeekDueDate = await expectedDueDateWeek(currentDate, 'weeks', 10);
    const fourteenWeekDueDate = await expectedDueDateWeek(currentDate, 'weeks', 14);
    
    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    //Load all records in the table by scrolling through table and triggering lazy loading
    const tableToScroll = patientDetailsPage.patientVaccinePane?.scheduledVaccinesTableBody!;
    const rowToScrollTo = patientDetailsPage.patientVaccinePane?.finalScheduledVaccine!;
    await scrollTableToElement(tableToScroll, rowToScrollTo);
   
    //6 weeks from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('PCV13', '6 weeks', sixWeekDueDate, status);
    //10 weeks from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('Pentavalent', '10 weeks', tenWeekDueDate, status);
    //14 weeks from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('PCV13', '14 weeks', fourteenWeekDueDate, status);
  });

  test('Vaccines scheduled months from birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const status = 'Scheduled';
    
    const nineMonthDueDate = await expectedDueDateWeek(currentDate, 'months', 9);
    const fifteenMonthDueDate = await expectedDueDateWeek(currentDate, 'months', 15);

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    //Load all records in the table by scrolling through table and triggering lazy loading
    const tableToScroll = patientDetailsPage.patientVaccinePane?.scheduledVaccinesTableBody!;
    const rowToScrollTo = patientDetailsPage.patientVaccinePane?.finalScheduledVaccine!;
    await scrollTableToElement(tableToScroll, rowToScrollTo);

    //9 months from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('MMR', '9 months', nineMonthDueDate, status);
    //15 months from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('DTP Booster', '15 months', fifteenMonthDueDate, status);
  });

  test('Vaccines scheduled years from birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'Td Booster';
    const schedule = '10 years';
    const status = 'Due';

    //521 weeks is used here because this is how the due date is calculated in the database
    const tenYearDueDate = await expectedDueDateWeek(birthDateTenYearsAgo, 'weeks', 521);

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    
    //Assert that a vaccine is scheduled for a patient born 10 years ago
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(vaccine, schedule, tenYearDueDate, status);
  });

  test('Vaccines scheduled weeks from last vaccination display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 'weeks', 8);
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'COVID-19 AZ';
    const schedule = 'Dose 2';
    const status = 'Scheduled';

    //Create patient with birthdate <15 years ago because 15 years old is the threshold for scheduled vaccines
    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    //Give first dose of vaccine to trigger scheduled vaccine for second dose to appear
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 1, {
      specificVaccine: vaccine,
    });

    //Assert that the second dose is scheduled
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(vaccine, schedule, doseTwoDueDate, status);
  });

  //Note that the "missed" status is not displayed in this table as per comments on NASS-1113
  test('Different scheduled statuses display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDateThreeWeeksAgo = subWeeks(currentDate, 3);

    const due = {
      status: 'Due',
      dueDate: await expectedDueDateWeek(currentDate, 'weeks', 1),
    };
    const scheduled = {
      status: 'Scheduled',
      dueDate: await expectedDueDateWeek(currentDate, 'weeks', 6),
    };
    const overdue = {
      status: 'Overdue',
      dueDate: await expectedDueDateWeek(birthDateThreeWeeksAgo, 'weeks', 1),
    };
    const upcoming = {
      status: 'Upcoming',
      dueDate: await expectedDueDateWeek(birthDateThreeWeeksAgo, 'weeks', 6),
    };

    const patientBornToday = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    const patientBornThreeWeeksAgo = await createPatient(api, page, {
      dateOfBirth: birthDateThreeWeeksAgo,
    });

    await patientDetailsPage.goToPatient(patientBornToday);
    await patientDetailsPage.navigateToVaccineTab();

    //Assert statusDue
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('BCG', 'Birth', due.dueDate, due.status);

    //Assert statusScheduled
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('PCV13', '6 weeks', scheduled.dueDate, scheduled.status);
    
    await patientDetailsPage.goToPatient(patientBornThreeWeeksAgo);
    await patientDetailsPage.navigateToVaccineTab();

    //Assert statusOverdue
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('BCG', 'Birth', overdue.dueDate, overdue.status);
    
    //Assert statusUpcoming
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable('PCV13', '6 weeks', upcoming.dueDate, upcoming.status);
  });

  test('Record vaccine with due status from scheduled vaccines table', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const vaccine = 'BCG';
    const schedule = 'Birth';
    const status = 'Due';
    const dueDate = await expectedDueDateWeek(currentDate, 'weeks', 1);

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status);

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
  });

  test('Record vaccine with scheduled status from scheduled vaccines table', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const vaccine = 'PCV13';
    const schedule = '6 weeks';
    const status = 'Scheduled';
    const dueDate = await expectedDueDateWeek(currentDate, 'weeks', 6);

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status);

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
  });

  test('Record vaccine with overdue status from scheduled vaccines table', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDateThreeWeeksAgo = subWeeks(currentDate, 3);
    const vaccine = 'BCG';
    const schedule = 'Birth';
    const status = 'Overdue';
    const dueDate = await expectedDueDateWeek(birthDateThreeWeeksAgo, 'weeks', 1);

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateThreeWeeksAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status);

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
  });

  test('Record vaccine with upcoming status from scheduled vaccines table', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDateThreeWeeksAgo = subWeeks(currentDate, 3);
    const vaccine = 'PCV13';
    const schedule = '6 weeks';
    const status = 'Upcoming';
    const dueDate = await expectedDueDateWeek(birthDateThreeWeeksAgo, 'weeks', 6);

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateThreeWeeksAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status);

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
  });

  test('Vaccine remains scheduled if "not given" is selected when recording', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const vaccine = 'BCG';
    const schedule = 'Birth';
    const status = 'Due';
    const dueDate = await expectedDueDateWeek(currentDate, 'weeks', 1);
    const givenStatus = false;

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status, { given: givenStatus });

    //Confirm the vaccine is still scheduled
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(vaccine, schedule, dueDate, status);
  });

  test('Record 2nd dose of vaccine scheduled weeks from last vaccination', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 'weeks', 8);
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'COVID-19 AZ';
    const schedule = 'Dose 2';
    const status = 'Scheduled';

    //Create patient with birthdate <15 years ago because 15 years old is the threshold for scheduled vaccines
    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    //Give first dose of vaccine to trigger scheduled vaccine for second dose to appear
    await addVaccineAndAssert(patientDetailsPage, true, 'Campaign', 1, {
      specificVaccine: vaccine,
    });

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, doseTwoDueDate, status, {category: 'Campaign', count: 2});

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
});
});
