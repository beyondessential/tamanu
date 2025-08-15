import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { expect } from '@playwright/test';
import { Vaccine } from 'types/vaccine/Vaccine';
import { addWeeks, startOfWeek, format } from 'date-fns';

/**
 * Adds a vaccine to the patient's vaccine record and asserts the vaccine was added successfully
 * @param patientDetailsPage - The patient details page
 * @param given - Whether the vaccine was given
 * @param category - The category of the vaccine
 * @param count - The number of vaccines that have been added
 * @param specificVaccine - Optional: The specific vaccine to add
 * @param fillOptionalFields - Optional: Whether to fill optional fields
 * @param viewVaccineRecord - Optional: Whether to view the vaccine record
 * @param isFollowUpVaccine - Optional: Whether the vaccine is a follow-up vaccine
 * @param specificScheduleOption - Optional: The specific schedule option to use
 * @param specificDate - Optional: The specific date to use
 */
export async function addVaccineAndAssert(
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

/**
 * Triggers a date error in the record vaccine modal
 * @param patientDetailsPage - The patient details page
 * @param date - The date to use to trigger the error
 * @param expectedErrorMessage - The expected error message
 */
export async function triggerDateError(
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

/**
 * Edits a vaccine in the patient's vaccine record
 * @param patientDetailsPage - The patient details page
 * @param vaccine - The vaccine to edit
 * @param specificEdits - Optional: The specific edits to make
 * @param onlyEditSpecificFields - Optional: Whether to only edit specific fields
 */
export async function editVaccine(
  patientDetailsPage: PatientDetailsPage,
  vaccine: Partial<Vaccine>,
  specificEdits: Partial<Vaccine> = {},
  onlyEditSpecificFields?: boolean,
) {

  const edits = {
    ...vaccine,
    ...specificEdits
  };

  await patientDetailsPage.patientVaccinePane?.clickEditVaccineButton(vaccine);

  expect(patientDetailsPage.patientVaccinePane?.editVaccineModal).toBeDefined();

  await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertUneditableFields(vaccine);

  const editedVaccineValues =
    await patientDetailsPage.patientVaccinePane?.editVaccineModal?.editFields(
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

/**
 * Asserts the edited vaccine is reflected in the patient's vaccine record and when viewing the vaccine record modal
 * @param patientDetailsPage - The patient details page
 * @param vaccine - The vaccine to assert
 */
export async function assertEditedVaccine(
  patientDetailsPage: PatientDetailsPage,
  vaccine: Partial<Vaccine>,
) {
  await patientDetailsPage.patientVaccinePane?.assertRecordedVaccineTable(vaccine);

  //Confirm the expected changes are reflected when viewing the vaccine record modal
  await patientDetailsPage.patientVaccinePane?.viewVaccineRecordAndAssert(vaccine);

  //Confirm the expected changes are reflected when opening the edit modal again
  await patientDetailsPage.patientVaccinePane?.clickEditVaccineButton(vaccine);

  expect(patientDetailsPage.patientVaccinePane?.editVaccineModal).toBeDefined();
  await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertUneditableFields(vaccine);
  await patientDetailsPage.patientVaccinePane?.editVaccineModal?.assertEditableFields(vaccine);
  await patientDetailsPage.patientVaccinePane?.editVaccineModal?.closeModalButton.click();
}

//TODO: eventually remove these console logs if it works on mornings as well as afternoon
//TODO: the console logs are currently commented out unless needed for debugging
export async function expectedDueDateWeek(date: Date, weeksToAdd: number) {
  //TODO: delete these console logs
 // console.log('date', date);
  const dueDate = addWeeks(date, weeksToAdd);
 // console.log('dueDate', dueDate);

  // Extract just the date components to avoid timezone issues
  const year = dueDate.getUTCFullYear();
  const month = dueDate.getUTCMonth();
  const day = dueDate.getUTCDate();
  
  // Create a local date object for startOfWeek
  const localDate = new Date(year, month, day);
  const weekStart = startOfWeek(localDate, { weekStartsOn: 1 });
//  console.log('weekStart', weekStart);
  
  // Convert result back to UTC
  const utcWeekStart = new Date(Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()));
 // console.log('utcWeekStart', utcWeekStart);

  const formattedUtcWeekStart = format(utcWeekStart, 'MM/dd/yyyy');
  console.log('formattedUtcWeekStart', formattedUtcWeekStart);
  
  return formattedUtcWeekStart;
}