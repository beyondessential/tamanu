import type { Page } from '@playwright/test';
import { Patient } from '@tamanu/database';
import { test, expect } from '../../../fixtures/test';
import {
  VaccinePane,
  RecordVaccineModal,
  EditVaccineModal,
  DeleteVaccineModal,
} from '@pages/patients/VaccinePage';
import { PatientVaccinePane } from '@pages/patients/PatientDetailsPage/panes/PatientVaccinePane';
import { fillDate, getBrowserDate, shiftYears, toIsoDate, toTableDate } from '@helpers/dates';
import type { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { Vaccine } from 'types/vaccine/Vaccine';

type Category = 'Routine' | 'Catchup' | 'Campaign' | 'Other';

interface AddVaccineOptions {
  specificVaccine?: string | null;
  fillOptionalFields?: boolean;
  viewVaccineRecord?: boolean;
  isFollowUpVaccine?: boolean;
  specificScheduleOption?: string;
  specificDate?: string;
  recordScheduledVaccine?: boolean;
  vaccineGivenElsewhere?: string;
}

async function addVaccineAndAssert(
  page: Page,
  vaccinePane: VaccinePane,
  patientPane: PatientVaccinePane,
  given: boolean,
  category: Category,
  count: number,
  {
    specificVaccine = null,
    fillOptionalFields = false,
    viewVaccineRecord = false,
    isFollowUpVaccine = false,
    specificScheduleOption = undefined,
    specificDate = undefined,
    recordScheduledVaccine = false,
    vaccineGivenElsewhere = undefined,
  }: AddVaccineOptions = {},
) {
  if (recordScheduledVaccine) {
    if (!specificVaccine || !specificScheduleOption) {
      throw new Error('Vaccine and schedule are required when recordScheduledVaccine is true');
    }
    await vaccinePane.recordScheduledVaccine(specificVaccine, specificScheduleOption);
  } else {
    await vaccinePane.clickRecordVaccineButton();
  }

  const recordModal = new RecordVaccineModal(page);
  const vaccine = await recordModal.recordVaccine(given, category, count, {
    specificVaccine: specificVaccine ?? undefined,
    fillOptionalFields,
    isFollowUpVaccine,
    specificScheduleOption,
    specificDate,
    recordScheduledVaccine,
    vaccineGivenElsewhere,
  });

  if (!vaccine) {
    throw new Error('Vaccine record was not created successfully');
  }

  await recordModal.waitForModalToClose();

  expect(await patientPane.getRecordedVaccineCount()).toBe(count);

  if (!given) {
    await vaccinePane.notGivenCheckbox.click();
  }

  await patientPane.assertRecordedVaccineTable(vaccine);

  if (viewVaccineRecord) {
    await patientPane.viewVaccineRecordAndAssert(vaccine);
  }

  return vaccine;
}

async function triggerDateError(
  page: Page,
  vaccinePane: VaccinePane,
  date: string,
  expectedErrorMessage: string,
) {
  await vaccinePane.clickRecordVaccineButton();
  const recordModal = new RecordVaccineModal(page);
  await fillDate(recordModal.dateField, date);
  await recordModal.confirmButton.click();

  const recordVaccineDialog = page
    .getByTestId('dialog-g9qi')
    .filter({ visible: true })
    .filter({ hasText: /Record vaccine/i });

  await expect(recordVaccineDialog.getByText(expectedErrorMessage, { exact: true })).toBeVisible();
}

async function editVaccine(
  patientPane: PatientVaccinePane,
  page: Page,
  vaccine: Partial<Vaccine>,
  specificEdits: Partial<Vaccine> = {},
  onlyEditSpecificFields?: boolean,
) {
  const edits = {
    ...vaccine,
    ...specificEdits,
  };

  await patientPane.clickEditVaccineButton(vaccine);
  const editModal = new EditVaccineModal(page);
  await editModal.assertUneditableFields(vaccine);

  const editedVaccineValues = await editModal.editFields(
    onlyEditSpecificFields ? specificEdits : edits,
  );

  if (!editedVaccineValues) {
    throw new Error('Vaccine record was not edited successfully');
  }

  return {
    ...vaccine,
    ...editedVaccineValues,
  };
}

async function assertEditedVaccine(
  patientPane: PatientVaccinePane,
  page: Page,
  vaccine: Partial<Vaccine>,
) {
  await patientPane.assertRecordedVaccineTable(vaccine);
  await patientPane.viewVaccineRecordAndAssert(vaccine);

  await patientPane.clickEditVaccineButton(vaccine);
  const editModal = new EditVaccineModal(page);
  await editModal.assertUneditableFields(vaccine);
  await editModal.assertEditableFields(vaccine);
  await editModal.closeModalButton.click();
}

async function testGivenElsewhereForCategory(
  page: Page,
  patient: Patient,
  patientDetailsPage: PatientDetailsPage,
  category: Category,
) {
  const givenElsewhereReason = 'Given overseas';
  const currentBrowserDate = await getBrowserDate(page);
  await patientDetailsPage.goToPatient(patient);
  await patientDetailsPage.navigateToVaccineTab();
  const vaccinePane = new VaccinePane(page);
  const patientPane = new PatientVaccinePane(page);

  await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 1, {
    vaccineGivenElsewhere: givenElsewhereReason,
    specificDate: currentBrowserDate,
    viewVaccineRecord: true,
  });
}

test.describe('Vaccines', () => {
  let vaccinePane: VaccinePane;
  let patientPane: PatientVaccinePane;

  test.beforeEach(async ({ newPatient, patientDetailsPage, page }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    vaccinePane = new VaccinePane(page);
    patientPane = new PatientVaccinePane(page);
  });

  test('[T-0432][AT-1001]Add a routine vaccine', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1);
  });

  test('[T-0432][AT-1002]Add a catchup vaccine', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Catchup', 1);
  });

  test('[T-0432][AT-1003]Add a campaign vaccine', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 1);
  });

  test('[T-0434][AT-1004]Add an other vaccine', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 1);
  });

  test('[T-0432][T-0434][AT-1005]Add multiple vaccines of different types', async ({ page }) => {
    test.setTimeout(45000);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'MMR',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Catchup', 2, {
      specificVaccine: 'Rotavirus',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 3, {
      specificVaccine: 'COVID-19 AZ',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 4, {
      specificVaccine: 'Test Vaccine',
    });
  });

  test('[T-0438][AT-1011]Add a routine vaccine (not given)', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 0);
  });

  test('[T-0438][AT-1012]Add a catchup vaccine (not given)', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Catchup', 0);
  });

  test('[T-0438][AT-1013]Add a campaign vaccine (not given)', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Campaign', 0);
  });

  test('[T-0440][AT-1014]Add an other vaccine (not given)', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Other', 0);
  });

  test('[T-0432][T-0438][T-0440][AT-1027]Add multiple vaccines with different given statuses', async ({ page }) => {
    test.setTimeout(45000);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'IPV',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Catchup', 1, {
      specificVaccine: 'HPV',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 2, {
      specificVaccine: 'COVID-19 AZ',
    });
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Other', 2, {
      specificVaccine: 'Test Vaccine',
    });
  });

  test('[T-0432][AT-1028]Add vaccine and view vaccine record with just required fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'IPV',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('[T-0438][AT-1029]Select not given, add vaccine and view vaccine record with just required fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 0, {
      specificVaccine: 'IPV',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('[T-0434][AT-1030]Add other vaccine and view vaccine record with just required fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('[T-0440][AT-1031]Select not given, add other vaccine and view vaccine record with just required fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Other', 0, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: false,
      viewVaccineRecord: true,
    });
  });

  test('[T-0432][AT-1032]Add vaccine and view vaccine record with optional fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('[T-0434][AT-1033]Add other vaccine and view vaccine record with optional fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('[T-0440][AT-1034]Select not given, add other vaccine and view vaccine record with optional fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Other', 0, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('[T-0438][AT-1035]Select not given, add vaccine and view vaccine record with optional fields filled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 0, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('[T-0432][T-0434][AT-1036]Add multiple different vaccines and view each of their vaccine records', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });

    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 1, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 2, {
      specificVaccine: 'bOPV',
      fillOptionalFields: true,
      viewVaccineRecord: true,
    });
  });

  test('[T-0432][AT-1037]Add multiple doses of the same vaccine and confirm the first dose is disabled', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'Pentavalent',
      viewVaccineRecord: true,
    });

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 2, {
      specificVaccine: 'Pentavalent',
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
      viewVaccineRecord: true,
    });
  });

  test('[T-0432][AT-1038]When a vaccine has all doses administered remove it from dropdown', async ({ page }) => {
    const category = 'Routine';
    const vaccineName = 'Rotavirus';
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 1, {
      specificVaccine: vaccineName,
    });

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 2, {
      specificVaccine: vaccineName,
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
    });

    await vaccinePane.clickRecordVaccineButton();
    const recordModal = new RecordVaccineModal(page);
    await recordModal.assertVaccineNotSelectable(vaccineName, category);
  });

  test('[T-0438][AT-1039]Select not given when giving the second scheduled dose of a vaccine', async ({ page }) => {
    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificVaccine: 'bOPV',
      viewVaccineRecord: true,
    });

    await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 1, {
      specificVaccine: 'bOPV',
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
      viewVaccineRecord: true,
    });
  });

  test('[T-0432][AT-1040]Add vaccine and confirm default date is today', async ({ page }) => {
    const currentBrowserDate = await getBrowserDate(page);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1);

    await expect(vaccinePane.dateCell(0)).toContainText(toTableDate(currentBrowserDate));
  });

  test('[T-0432][AT-1041]Add vaccine with custom date given', async ({ page }) => {
    const currentBrowserDate = await getBrowserDate(page);
    const dateGiven = shiftYears(currentBrowserDate, -1);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      specificDate: dateGiven,
      viewVaccineRecord: true,
    });

    await expect(vaccinePane.dateCell(0)).toContainText(toTableDate(dateGiven));
  });

  test('[T-0432][AT-1042]Date given cannot be before patient date of birth', async ({
    page,
    newPatient,
  }) => {
    const dateBeforePatientDob = shiftYears(toIsoDate(String(newPatient.dateOfBirth!)), -1);
    const expectedErrorMessage = 'Date cannot be prior to patient date of birth';

    await triggerDateError(page, vaccinePane, dateBeforePatientDob, expectedErrorMessage);
  });

  test('[T-0432][AT-1043]Date given cannot be in the future', async ({ page }) => {
    const currentBrowserDate = await getBrowserDate(page);
    const futureDateGiven = shiftYears(currentBrowserDate, 1);
    const expectedErrorMessage = 'Date cannot be in the future';

    await triggerDateError(page, vaccinePane, futureDateGiven, expectedErrorMessage);
  });

  test('[T-0432][AT-1044]Mandatory fields must be filled', async ({ page }) => {
    const expectedAreaAndLocationError =
      'locationId must be a `string` type, but the final value was: `null`';
    const expectedDepartmentError =
      'departmentId must be a `string` type, but the final value was: `null`';
    const genericExpectedError = 'Required';

    await vaccinePane.clickRecordVaccineButton();
    const recordModal = new RecordVaccineModal(page);

    await recordModal.confirmButton.click();

    await expect(recordModal.areaFieldIncludingError).toContainText(expectedAreaAndLocationError);
    await expect(recordModal.locationFieldIncludingError).toContainText(expectedAreaAndLocationError);
    await expect(recordModal.departmentFieldIncludingError).toContainText(expectedDepartmentError);
    await expect(recordModal.categoryRequiredError).toContainText(genericExpectedError);
    await expect(recordModal.consentGivenRequiredError).toContainText(genericExpectedError);

    await recordModal.categoryRoutineRadio.click();
    await recordModal.confirmButton.click();

    await expect(recordModal.vaccineNameRequiredError).toContainText(genericExpectedError);
  });

  test('[T-0441][AT-1015]Edit a vaccine and edit all fields', async ({ page }) => {
    const given = true;
    const category = 'Routine';
    const fillOptionalFields = true;

    const currentBrowserDate = await getBrowserDate(page);
    const editedDateGiven = shiftYears(currentBrowserDate, -1);

    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, given, category, 1, {
      fillOptionalFields: fillOptionalFields,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(patientPane, page, vaccine, {
      batch: 'Edited batch field',
      dateGiven: editedDateGiven,
      givenBy: 'Edited given by field',
      consentGivenBy: 'Edited consent field',
    });

    await assertEditedVaccine(patientPane, page, editedVaccine);
  });

  test('[T-0441][AT-1016]Edit a vaccine and fill fields that were originally skipped', async ({ page }) => {
    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1);

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientPane,
      page,
      vaccine,
      {
        batch: 'New batch field',
        givenBy: 'New given by field',
        consentGivenBy: 'New consent field',
        injectionSite: 'To be edited automatically',
      },
      true,
    );

    await assertEditedVaccine(patientPane, page, editedVaccine);
  });

  test('[T-0441][AT-1017]Edit unique fields for other vaccine', async ({ page }) => {
    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Other', 1, {
      specificVaccine: 'Test Vaccine',
      fillOptionalFields: true,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientPane,
      page,
      vaccine,
      {
        brand: 'Edited brand',
        disease: 'Edited disease',
      },
      true,
    );

    await assertEditedVaccine(patientPane, page, editedVaccine);
  });

  test('[T-0441][AT-1018]Edit unique fields for not given vaccine', async ({ page }) => {
    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, false, 'Routine', 0, {
      specificVaccine: 'Hep B',
      fillOptionalFields: true,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    const editedVaccine = await editVaccine(
      patientPane,
      page,
      vaccine,
      {
        notGivenReason: vaccine.notGivenReason,
        notGivenClinician: 'Edited clinician',
      },
      true,
    );

    await vaccinePane.notGivenCheckbox.click();

    await assertEditedVaccine(patientPane, page, editedVaccine);
  });

  test('[T-0441][AT-1019]Edit one vaccine when multiple are present', async ({ page }) => {
    const firstVaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Catchup', 1);

    const secondVaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 2);

    firstVaccine.count = 2;

    const editedVaccine = await editVaccine(patientPane, page, firstVaccine, {
      batch: 'Edited batch field',
      givenBy: 'Edited given by field',
      consentGivenBy: 'Edited consent field',
      injectionSite: 'Will be edited automatically',
    });

    await assertEditedVaccine(patientPane, page, editedVaccine);

    await assertEditedVaccine(patientPane, page, secondVaccine);
  });

  test('[T-0441][AT-1020]Validation works when editing a vaccine', async ({ page }) => {
    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1);

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientPane.clickEditVaccineButton(vaccine);
    const editModal = new EditVaccineModal(page);

    await editModal.clearAllFields();

    await editModal.submitEditsButton.click();

    await editModal.assertRequiredFieldErrors();
  });

  test('[T-0443][AT-1021]Delete a vaccine', async ({ page }) => {
    const vaccineToDelete = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1);
    const vaccineToKeep = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 2);
    const vaccineCountAfterDeletion = 1;

    vaccineToDelete.count = 2;

    if (!vaccineToDelete || !vaccineToKeep) {
      throw new Error('Vaccine record was not created successfully');
    }

    await patientPane.openVaccineKebabMenu(vaccineToDelete);
    await patientPane.deleteVaccineOption.click();

    const deleteModal = new DeleteVaccineModal(page);
    await expect(deleteModal.title).toContainText('Delete vaccination record');
    await expect(deleteModal.content).toContainText('WARNING: This action is irreversible!');
    await deleteModal.confirmButton.click();
    await expect(deleteModal.title).not.toBeVisible();

    await patientPane.viewVaccineRecordAndAssert(vaccineToKeep);

    expect(await patientPane.getRecordedVaccineCount()).toBe(vaccineCountAfterDeletion);
  });

  test('[T-0445][AT-1022]Vaccine does not appear in dropdown if all doses have been given (vaccine with 1 dose)', async ({ page }) => {
    const category = 'Routine';
    const vaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 1, {
      specificVaccine: 'Hep B',
    });

    if (!vaccine || !vaccine.vaccineName) {
      throw new Error('Vaccine record was not created successfully');
    }

    await vaccinePane.clickRecordVaccineButton();
    const recordModal = new RecordVaccineModal(page);

    await recordModal.assertVaccineNotInDropdown(category, vaccine.vaccineName);
  });

  test('[T-0445][AT-1023]Vaccine does not appear in dropdown if all doses have been given (vaccine with multiple doses)', async ({ page }) => {
    const category = 'Routine';
    const vaccineName = 'Rotavirus';

    const firstDose = await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 1, {
      specificVaccine: vaccineName,
    });

    const secondDose = await addVaccineAndAssert(page, vaccinePane, patientPane, true, category, 2, {
      specificVaccine: vaccineName,
      isFollowUpVaccine: true,
      specificScheduleOption: '10 weeks',
    });

    if (!firstDose || !secondDose) {
      throw new Error('Vaccine record was not created successfully');
    }

    await vaccinePane.clickRecordVaccineButton();
    const recordModal = new RecordVaccineModal(page);

    await recordModal.assertVaccineNotInDropdown(category, vaccineName);
  });

  test('[T-0447][AT-1024]Not given vaccines should be hidden if there is a corresponding given vaccine (desktop only)', async ({ page }) => {
    const uniqueVaccineName = 'Hep B';
    const matchingVaccineName = 'MMR';

    const uniqueNotGivenVaccine = await addVaccineAndAssert(
      page,
      vaccinePane,
      patientPane,
      false,
      'Routine',
      0,
      {
        specificVaccine: uniqueVaccineName,
      },
    );
    const matchingNotGivenVaccine = await addVaccineAndAssert(
      page,
      vaccinePane,
      patientPane,
      false,
      'Catchup',
      0,
      {
        specificVaccine: matchingVaccineName,
      },
    );
    const givenVaccine = await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Catchup', 1, {
      specificVaccine: matchingVaccineName,
    });
    const totalVaccineCount = 2;
    uniqueNotGivenVaccine.count = totalVaccineCount;
    givenVaccine.count = totalVaccineCount;

    if (!uniqueNotGivenVaccine || !matchingNotGivenVaccine || !givenVaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    await vaccinePane.notGivenCheckbox.click();
    await patientPane.viewVaccineRecordAndAssert(uniqueNotGivenVaccine);
    await patientPane.viewVaccineRecordAndAssert(givenVaccine);
    expect(await patientPane.getRecordedVaccineCount()).toBe(totalVaccineCount);
  });

  test('[T-0448][AT-1025]Recorded vaccines table can be sorted by clicking column headers', async ({ page }) => {
    const currentBrowserDate = await getBrowserDate(page);
    const dateOneYearAgo = shiftYears(currentBrowserDate, -1);
    const dateTwoYearsAgo = shiftYears(currentBrowserDate, -2);

    const vaccines = [
      await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Catchup', 1, {
        specificVaccine: 'Rotavirus',
        specificDate: currentBrowserDate,
      }),
      await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 2, {
        specificVaccine: 'Hep B',
        specificDate: dateOneYearAgo,
      }),
      await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 3, {
        specificVaccine: 'TCV Typhoid',
        specificDate: dateTwoYearsAgo,
      }),
    ];

    if (!vaccines.every((vaccine) => vaccine)) {
      throw new Error('Vaccine records were not created successfully');
    }

    await vaccinePane.sortByVaccine.click();
    await patientPane.assertVaccineOrder(vaccines, 'vaccine', 'desc');

    await vaccinePane.sortByVaccine.click();
    await patientPane.assertVaccineOrder(vaccines, 'vaccine', 'asc');

    await vaccinePane.sortByDate.click();
    await patientPane.assertVaccineOrder(vaccines, 'date', 'desc');

    await vaccinePane.sortByDate.click();
    await patientPane.assertVaccineOrder(vaccines, 'date', 'asc');
  });

  test('[T-0449][AT-1026]Location is prefilled for patients with active encounter', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    const prefilledLocations = {
      area: 'Emergency Department',
      location: 'Bed 1',
      department: 'Cardiology',
    };

    const given = true;
    const category = 'Routine';
    const count = 1;

    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVaccineTab();
    vaccinePane = new VaccinePane(page);
    patientPane = new PatientVaccinePane(page);

    await vaccinePane.clickRecordVaccineButton();
    const recordModal = new RecordVaccineModal(page);

    await recordModal.assertLocationPrefilled(prefilledLocations);

    const vaccine = await recordModal.recordVaccine(given, category, count, {
      prefilledLocations: prefilledLocations,
    });

    if (!vaccine) {
      throw new Error('Vaccine record was not created successfully');
    }

    await recordModal.waitForModalToClose();

    await patientPane.assertRecordedVaccineTable(vaccine);

    await patientPane.viewVaccineRecordAndAssert(vaccine);
  });

  test('[T-0435][AT-1006]Record given elsewhere for Routine vaccine', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    await testGivenElsewhereForCategory(
      page,
      newPatientWithHospitalAdmission,
      patientDetailsPage,
      'Routine',
    );
  });

  test('[T-0435][AT-1007]Record given elsewhere for Catchup vaccine', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    await testGivenElsewhereForCategory(
      page,
      newPatientWithHospitalAdmission,
      patientDetailsPage,
      'Catchup',
    );
  });

  test('[T-0435][AT-1008]Record given elsewhere for Campaign vaccine', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    await testGivenElsewhereForCategory(
      page,
      newPatientWithHospitalAdmission,
      patientDetailsPage,
      'Campaign',
    );
  });

  test('[T-0437][AT-1009]Record given elsewhere for Other vaccine', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    await testGivenElsewhereForCategory(
      page,
      newPatientWithHospitalAdmission,
      patientDetailsPage,
      'Other',
    );
  });

  test('[T-0435][AT-1010]Date field can be empty when vaccine is given elsewhere', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
    page,
  }) => {
    const givenElsewhereReason = 'Given overseas';
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToVaccineTab();
    vaccinePane = new VaccinePane(page);
    patientPane = new PatientVaccinePane(page);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Routine', 1, {
      vaccineGivenElsewhere: givenElsewhereReason,
      viewVaccineRecord: true,
    });
  });
});
