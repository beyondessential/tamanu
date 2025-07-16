import { test, expect } from '@fixtures/baseFixture';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { convertDateFormat, offsetYear } from '../../utils/testHelper';
import { Vaccine } from 'types/vaccine/Vaccine';

//TODO: add tests to confirm error messages if try to submit without required fields
//TODO: can i make flynns timeout when recording vaccine reduced or removed?
//TODO: if i end up with a lot of custom functions in this file maybe move to a separate file?
//TODO: does vaccine always need to be <Partial> or is there a way to not do that?
//TODO: is there a better way to handle count? especially in situations like vaccineToDelete.count = 2 after a second vaccine is added?
//TODO: double check regression test doc, is vaccine schedule stuff possible?
//TODO: delete all console logs and TODOsthat i added before submitting
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
      count,
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

    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);

    if (!given) {
      await patientDetailsPage.patientVaccinePane?.vaccineNotGivenCheckbox.click();
    }

    await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineTable(vaccine);

    if (viewVaccineRecord) {
      await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(vaccine);
    }

    return vaccine;
  }

  async function triggerDateError(
    patientDetailsPage: PatientDetailsPage,
    date: string,
    expectedErrorMessage: string,
  ) {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();

    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();

    //Attempt to submit a date that should trigger a validation error
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.dateField.fill(date);
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.confirmButton.click();

    //Assert the validation error appears
    await expect(
      patientDetailsPage.patientVaccinePane?.recordVaccineModal?.dateFieldIncludingError!,
    ).toContainText(expectedErrorMessage);
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

  test('Add vaccine with custom date given', async ({ patientDetailsPage }) => {
    //Date is one year ago - a patient is always 18+ years old so this avoids any validation errors
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat();
    const dateGiven = await offsetYear(currentBrowserDate, 'decreaseByOneYear');

    await addVaccineAndAssert(patientDetailsPage, true, 'Routine', 1, {
      specificDate: dateGiven,
      viewVaccineRecord: true,
    });

    await patientDetailsPage.closeViewVaccineModalButton().click();

    await expect(patientDetailsPage.patientVaccinePane?.dateFieldForSingleVaccine!).toContainText(
      convertDateFormat(dateGiven),
    );
  });

  test('Date given cannot be before patient date of birth', async ({
    patientDetailsPage,
    newPatient,
  }) => {
    const dateBeforePatientDob = await offsetYear(newPatient.dateOfBirth!, 'decreaseByOneYear');
    const expectedErrorMessage = 'Date cannot be prior to patient date of birth';

    //Attempt to submit a date before the patient's date of birth and assert the expected error message appears
    await triggerDateError(patientDetailsPage, dateBeforePatientDob, expectedErrorMessage);
  });

  test('Date given cannot be in the future', async ({ patientDetailsPage }) => {
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat();
    const futureDateGiven = await offsetYear(currentBrowserDate, 'increaseByOneYear');
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

  //TODO: move this to top of page when done
  //TODO: add documentation for this function, in particular document that area location etc will be randomly edited
  async function editVaccine(
    patientDetailsPage: PatientDetailsPage,
    vaccine: Partial<Vaccine>,
    specificEdits: Partial<Vaccine> = {},
    onlyEditSpecificFields?: boolean,
  ) {
    const {
      injectionSite,
      area,
      location,
      department,
      batch,
      dateGiven,
      givenBy,
      consentGivenBy,
    } = {
      ...vaccine,
      ...specificEdits,
    };

    const edits = {
      batch,
      dateGiven,
      injectionSite,
      area,
      location,
      department,
      givenBy,
      consentGivenBy,
    }

    await patientDetailsPage.patientVaccinePane?.clickEditVaccineButton(vaccine);

    expect(patientDetailsPage.patientVaccinePane?.editVaccineModal).toBeDefined();

    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertUneditableFields(vaccine);

    const editedVaccineValues = await patientDetailsPage.patientVaccinePane?.editVaccineModal?.editFields(
      onlyEditSpecificFields ? specificEdits : edits,
    );

    if (!editedVaccineValues) {
      throw new Error('Vaccine record was not edited successfully');
    }

    const editedVaccine = {
      ...vaccine,
      ...editedVaccineValues,
    };

    return editedVaccine;
  }

  //TODO: add documentation for this function
  async function assertEditedVaccine(
    patientDetailsPage: PatientDetailsPage,
    vaccine: Partial<Vaccine>,
  ) {

    await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineTable(vaccine);

    //Confirm the expected changes are reflected when viewing the vaccine record modal
    await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(vaccine);
    await patientDetailsPage.closeViewVaccineModalButton().click();

    //Confirm the expected changes are reflected when opening the edit modal again
    await patientDetailsPage.patientVaccinePane?.clickEditVaccineButton(vaccine);

    expect(patientDetailsPage.patientVaccinePane?.editVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertUneditableFields(vaccine);
    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertEditableFields(vaccine);
    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.closeModalButton.click();
  }

  test('Edit a vaccine and edit all fields', async ({ patientDetailsPage }) => {
    const given = true;
    const category = 'Routine';
    const fillOptionalFields = true;

    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat();
    //The vaccine is created with today's date and this edits it to be one year ago
    //A patient is always 18+ years old so one year ago avoids any validation errors
    const editedDateGiven = await offsetYear(currentBrowserDate, 'decreaseByOneYear');

    const vaccine = await addVaccineAndAssert(patientDetailsPage, given, category, 1, {
      fillOptionalFields: fillOptionalFields,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientDetailsPage,
      vaccine,
      {
        batch: 'Edited batch field',
        dateGiven: editedDateGiven,
        givenBy: 'Edited given by field',
        consentGivenBy: 'Edited consent field',
      },
    );

    await assertEditedVaccine(
      patientDetailsPage,
      editedVaccine,
    );
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

    await assertEditedVaccine(
      patientDetailsPage,
      editedVaccine,
    );
  });

  test('Edit unique fields for other vaccine', async ({ patientDetailsPage }) => {
    const vaccine = await addVaccineAndAssert(patientDetailsPage, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(patientDetailsPage, vaccine, {
      brand: 'Edited brand',
      disease: 'Edited disease',
    }, true);

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

    const editedVaccine = await editVaccine(patientDetailsPage, vaccine, {
      notGivenReason: 'Edited reason',
      notGivenClinician: 'Edited clinician',
    }, true);

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
    await patientDetailsPage.closeViewVaccineModalButton().click();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(vaccineCountAfterDeletion);
  });

  test('Check given elsewhere checkbox', async () => {
    //TODO: this feature is currently not working as per EPI-1019, if fixed then add test case
  });
});
