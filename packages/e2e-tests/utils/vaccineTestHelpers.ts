import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { createPatient } from '../utils/apiHelpers';
import { expect } from '@playwright/test';
import { Vaccine } from 'types/vaccine/Vaccine';
import { addWeeks, startOfWeek, format } from 'date-fns';

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
    recordScheduledVaccine = false,
    vaccineGivenElsewhere = undefined,
  }: AddVaccineOptions = {},
) {
  if (recordScheduledVaccine) {
    if (!specificVaccine || !specificScheduleOption) {
      throw new Error('Vaccine and schedule are required when recordScheduledVaccine is true');
    }
    await patientDetailsPage.patientVaccinePane?.recordScheduledVaccine(
      specificVaccine,
      specificScheduleOption,
    );
  } else {
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
  }

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
      recordScheduledVaccine,
      vaccineGivenElsewhere,
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
    ...specificEdits,
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

interface RecordScheduledVaccineOptions {
  given?: boolean;
  category?: 'Routine' | 'Catchup' | 'Campaign' | 'Other';
  count?: number;
}

/**
 * Records a vaccine from the scheduled vaccines table and asserts the vaccine was recorded successfully
 * @param patientDetailsPage - The patient details page
 * @param vaccine - The vaccine to record
 * @param schedule - The schedule to record the vaccine on, e.g. 'Birth', '6 weeks' etc
 * @param dueDate - The due date of the vaccine
 * @param status - The status of the vaccine, e.g. 'Overdue', 'Upcoming' etc
 * @param given - Optional: Whether the vaccine was given, e.g. true or false. Defaults to true if no value is provided
 * @param specificCategory - Optional: The specific category to use, e.g. 'Routine', 'Catchup', 'Campaign', 'Other'. Defaults to 'Routine' if no value is provided
 */
export async function recordScheduledVaccine(
  patientDetailsPage: PatientDetailsPage,
  vaccine: string,
  schedule: string,
  dueDate: string,
  status: string,
  options: RecordScheduledVaccineOptions = {},
) {
  await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
    vaccine,
    schedule,
    dueDate,
    status,
  );

  const isGiven = options.given ?? true;
  const category = options.category ?? 'Routine';
  const defaultCount = isGiven ? 1 : 0;
  const count = options.count ?? defaultCount;

  await addVaccineAndAssert(patientDetailsPage, isGiven, category, count, {
    recordScheduledVaccine: true,
    specificVaccine: vaccine,
    specificScheduleOption: schedule,
    viewVaccineRecord: true,
  });
}

/**
 * Confirms a vaccine no longer appears in the scheduled vaccines table
 * @param patientDetailsPage - The patient details page
 * @param vaccine - The vaccine to confirm is no longer scheduled
 * @param schedule - The schedule the vaccine was scheduled on, e.g. 'Birth', '6 weeks' etc
 */
export async function confirmVaccineNoLongerScheduled(
  patientDetailsPage: PatientDetailsPage,
  vaccine: string,
  schedule: string,
) {
  const vaccineNoLongerScheduled =
    await patientDetailsPage.patientVaccinePane?.confirmScheduledVaccineDoesNotExist(
      vaccine,
      schedule,
    );
  expect(vaccineNoLongerScheduled).toBe(true);
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

/**
 * Calculates the expected week a scheduled vaccine is due
 * @param date - The date to calculate the due date from
 * @param unit - The unit of time to add, e.g. 'weeks' or 'months'
 * @param unitsToAdd - The number of units to add to the date
 * @returns The expected due date in the format of "MM/dd/yyyy"
 */
export async function expectedDueDateWeek(date: Date, weeksToAdd: number) {
  const dueDate = addWeeks(date, weeksToAdd);

  // Extract just the date components to avoid timezone issues
  const year = dueDate.getFullYear();
  const month = dueDate.getMonth();
  const day = dueDate.getDate();

  // Create a local date object for startOfWeek
  const localDate = new Date(year, month, day);
  const weekStart = startOfWeek(localDate, { weekStartsOn: 1 });

  // Convert result back to UTC
  const utcWeekStart = new Date(
    Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
  );

  const formattedUtcWeekStart = format(utcWeekStart, 'MM/dd/yyyy');

  return formattedUtcWeekStart;
}

/**
 * Tests given elsewhere functionality across vaccine categories
 * @param patientDetailsPage - The patient details page
 * @param newPatientWithHospitalAdmission - The new patient with hospital admission
 * @param category - The category of the vaccine
 */
export async function testGivenElsewhereForCategory(
  patientDetailsPage: PatientDetailsPage,
  newPatientWithHospitalAdmission: Awaited<ReturnType<typeof createPatient>>,
  category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
) {
  const givenElsewhereReason = 'Given overseas';
  const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
  await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
  await patientDetailsPage.navigateToVaccineTab();

  await addVaccineAndAssert(patientDetailsPage, true, category, 1, {
    vaccineGivenElsewhere: givenElsewhereReason,
    specificDate: currentBrowserDate,
    viewVaccineRecord: true,
  });
}
