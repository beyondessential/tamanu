import type { Page } from '@playwright/test';
import { addWeeks, format, startOfWeek, subWeeks, subYears } from 'date-fns';
import { test, expect } from '../../../fixtures/test';
import { createPatient } from '../../../fixtures/api';
import { getBrowserDate } from '@helpers/dates';
import { VaccinePane, RecordVaccineModal } from '@pages/patients/VaccinePage';
import { PatientVaccinePane } from '@pages/patients/PatientDetailsPage/panes/PatientVaccinePane';

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

async function expectedDueDateWeek(date: Date, weeksToAdd: number): Promise<string> {
  const dueDate = addWeeks(date, weeksToAdd);

  const year = dueDate.getFullYear();
  const month = dueDate.getMonth();
  const day = dueDate.getDate();

  const localDate = new Date(year, month, day);
  const weekStart = startOfWeek(localDate, { weekStartsOn: 1 });

  const utcWeekStart = new Date(
    Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
  );

  return format(utcWeekStart, 'MM/dd/yyyy');
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

interface RecordScheduledVaccineOptions {
  given?: boolean;
  category?: Category;
  count?: number;
}

async function recordScheduledVaccine(
  page: Page,
  vaccinePane: VaccinePane,
  patientPane: PatientVaccinePane,
  vaccine: string,
  schedule: string,
  dueDate: string,
  status: string,
  options: RecordScheduledVaccineOptions = {},
) {
  await patientPane.assertScheduledVaccinesTable(vaccine, schedule, dueDate, status);

  const isGiven = options.given ?? true;
  const category = options.category ?? 'Routine';
  const defaultCount = isGiven ? 1 : 0;
  const count = options.count ?? defaultCount;

  await addVaccineAndAssert(page, vaccinePane, patientPane, isGiven, category, count, {
    recordScheduledVaccine: true,
    specificVaccine: vaccine,
    specificScheduleOption: schedule,
    viewVaccineRecord: true,
  });
}

async function confirmVaccineNoLongerScheduled(
  patientPane: PatientVaccinePane,
  vaccine: string,
  schedule: string,
) {
  const vaccineNoLongerScheduled = await patientPane.confirmScheduledVaccineDoesNotExist(
    vaccine,
    schedule,
  );
  expect(vaccineNoLongerScheduled).toBe(true);
}

test.describe('Scheduled vaccines', () => {
  test('[AT-1045]Vaccines scheduled at birth display', async ({ page, api, patientDetailsPage }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const birthDueDate = await expectedDueDateWeek(currentDate, 1);
    const status = 'Due';
    const schedule = 'Birth';

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const patientPane = new PatientVaccinePane(page);

    await patientPane.assertScheduledVaccinesTable('BCG', schedule, birthDueDate, status);
    await patientPane.assertScheduledVaccinesTable('Hep B', schedule, birthDueDate, status);
  });

  test('[AT-1046]Vaccines scheduled weeks from birth display', async ({ page, api, patientDetailsPage }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const status = 'Scheduled';

    const sixWeekDueDate = await expectedDueDateWeek(currentDate, 6);
    const tenWeekDueDate = await expectedDueDateWeek(currentDate, 10);
    const fourteenWeekDueDate = await expectedDueDateWeek(currentDate, 14);

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const vaccinePane = new VaccinePane(page);
    const patientPane = new PatientVaccinePane(page);

    await vaccinePane.scrollToVaccine('PCV13');

    await patientPane.assertScheduledVaccinesTable('PCV13', '6 weeks', sixWeekDueDate, status);
    await patientPane.assertScheduledVaccinesTable('Pentavalent', '10 weeks', tenWeekDueDate, status);
    await patientPane.assertScheduledVaccinesTable('PCV13', '14 weeks', fourteenWeekDueDate, status);
  });

  test('[AT-1047]Vaccines scheduled months from birth display', async ({ page, api, patientDetailsPage }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const status = 'Scheduled';

    const nineMonthDueDate = await expectedDueDateWeek(currentDate, 39);
    const fifteenMonthDueDate = await expectedDueDateWeek(currentDate, 65);

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const vaccinePane = new VaccinePane(page);
    const patientPane = new PatientVaccinePane(page);

    await vaccinePane.scrollToVaccine('MMR');

    await patientPane.assertScheduledVaccinesTable('MMR', '9 months', nineMonthDueDate, status);
    await patientPane.assertScheduledVaccinesTable(
      'DTP Booster',
      '15 months',
      fifteenMonthDueDate,
      status,
    );
  });

  test('[AT-1048]Vaccines scheduled years from birth display', async ({ page, api, patientDetailsPage }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'Td Booster';
    const schedule = '10 years';
    const status = 'Due';

    const tenYearDueDate = await expectedDueDateWeek(birthDateTenYearsAgo, 521);

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const patientPane = new PatientVaccinePane(page);

    await patientPane.assertScheduledVaccinesTable(vaccine, schedule, tenYearDueDate, status);
  });

  test('[AT-1049]Vaccines scheduled weeks from last vaccination display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 8);
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'COVID-19 AZ';
    const schedule = 'Dose 2';
    const status = 'Scheduled';

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const vaccinePane = new VaccinePane(page);
    const patientPane = new PatientVaccinePane(page);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 1, {
      specificVaccine: vaccine,
    });

    await patientPane.assertScheduledVaccinesTable(vaccine, schedule, doseTwoDueDate, status);
  });

  test('[AT-1050]Different scheduled statuses display', async ({ page, api, patientDetailsPage }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const birthDateThreeWeeksAgo = subWeeks(currentDate, 3);

    const due = {
      status: 'Due',
      dueDate: await expectedDueDateWeek(currentDate, 1),
    };
    const scheduled = {
      status: 'Scheduled',
      dueDate: await expectedDueDateWeek(currentDate, 6),
    };
    const overdue = {
      status: 'Overdue',
      dueDate: await expectedDueDateWeek(birthDateThreeWeeksAgo, 1),
    };
    const upcoming = {
      status: 'Upcoming',
      dueDate: await expectedDueDateWeek(birthDateThreeWeeksAgo, 6),
    };

    const patientBornToday = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    const patientBornThreeWeeksAgo = await createPatient(api, page, {
      dateOfBirth: birthDateThreeWeeksAgo,
    });

    await patientDetailsPage.goToPatient(patientBornToday);
    await patientDetailsPage.navigateToVaccineTab();
    let patientPane = new PatientVaccinePane(page);

    await patientPane.assertScheduledVaccinesTable('BCG', 'Birth', due.dueDate, due.status);

    await patientPane.assertScheduledVaccinesTable('PCV13', '6 weeks', scheduled.dueDate, scheduled.status);

    await patientDetailsPage.goToPatient(patientBornThreeWeeksAgo);
    await patientDetailsPage.navigateToVaccineTab();
    patientPane = new PatientVaccinePane(page);

    await patientPane.assertScheduledVaccinesTable('BCG', 'Birth', overdue.dueDate, overdue.status);

    await patientPane.assertScheduledVaccinesTable(
      'PCV13',
      '6 weeks',
      upcoming.dueDate,
      upcoming.status,
    );
  });

  const recordScheduledVaccineTestCases = [
    {
      status: 'Due',
      getBirthDate: (currentDate: Date) => currentDate,
      vaccine: 'BCG',
      schedule: 'Birth',
      getDueDate: async (birthDate: Date) => expectedDueDateWeek(birthDate, 1),
      testId: '[AT-1051]',
    },
    {
      status: 'Scheduled',
      getBirthDate: (currentDate: Date) => currentDate,
      vaccine: 'PCV13',
      schedule: '6 weeks',
      getDueDate: async (birthDate: Date) => expectedDueDateWeek(birthDate, 6),
      testId: '[AT-1052]',
    },
    {
      status: 'Overdue',
      getBirthDate: (currentDate: Date) => subWeeks(currentDate, 3),
      vaccine: 'BCG',
      schedule: 'Birth',
      getDueDate: async (birthDate: Date) => expectedDueDateWeek(birthDate, 1),
      testId: '[AT-1053]',
    },
    {
      status: 'Upcoming',
      getBirthDate: (currentDate: Date) => subWeeks(currentDate, 3),
      vaccine: 'PCV13',
      schedule: '6 weeks',
      getDueDate: async (birthDate: Date) => expectedDueDateWeek(birthDate, 6),
      testId: '[AT-1054]',
    },
  ];

  for (const {
    status,
    getBirthDate,
    vaccine,
    schedule,
    getDueDate,
    testId,
  } of recordScheduledVaccineTestCases) {
    test(`${testId}Record vaccine with ${status.toLowerCase()} status from scheduled vaccines table`, async ({
      page,
      api,
      patientDetailsPage,
    }) => {
      const currentDate = new Date(await getBrowserDate(page));
      const birthDate = getBirthDate(currentDate);
      const dueDate = await getDueDate(birthDate);

      const patient = await createPatient(api, page, {
        dateOfBirth: birthDate,
      });

      await patientDetailsPage.goToPatient(patient);
      await patientDetailsPage.navigateToVaccineTab();
      const vaccinePane = new VaccinePane(page);
      const patientPane = new PatientVaccinePane(page);

      await recordScheduledVaccine(page, vaccinePane, patientPane, vaccine, schedule, dueDate, status);

      await confirmVaccineNoLongerScheduled(patientPane, vaccine, schedule);
    });
  }

  test('[AT-1055]Vaccine remains scheduled if "not given" is selected when recording', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const vaccine = 'BCG';
    const schedule = 'Birth';
    const status = 'Due';
    const dueDate = await expectedDueDateWeek(currentDate, 1);
    const givenStatus = false;

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const vaccinePane = new VaccinePane(page);
    const patientPane = new PatientVaccinePane(page);

    await recordScheduledVaccine(page, vaccinePane, patientPane, vaccine, schedule, dueDate, status, {
      given: givenStatus,
    });

    await patientPane.assertScheduledVaccinesTable(vaccine, schedule, dueDate, status);
  });

  test('[AT-1056]Record 2nd dose of vaccine scheduled weeks from last vaccination', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(await getBrowserDate(page));
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 8);
    const birthDateTenYearsAgo = subYears(currentDate, 10);
    const vaccine = 'COVID-19 AZ';
    const schedule = 'Dose 2';
    const status = 'Scheduled';

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();
    const vaccinePane = new VaccinePane(page);
    const patientPane = new PatientVaccinePane(page);

    await addVaccineAndAssert(page, vaccinePane, patientPane, true, 'Campaign', 1, {
      specificVaccine: vaccine,
    });

    await recordScheduledVaccine(page, vaccinePane, patientPane, vaccine, schedule, doseTwoDueDate, status, {
      category: 'Campaign',
      count: 2,
    });

    await confirmVaccineNoLongerScheduled(patientPane, vaccine, schedule);
  });
});
