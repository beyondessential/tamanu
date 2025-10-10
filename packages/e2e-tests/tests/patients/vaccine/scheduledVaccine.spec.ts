import { test } from '@fixtures/baseFixture';
import {
  addVaccineAndAssert,
  expectedDueDateWeek,
  recordScheduledVaccine,
  confirmVaccineNoLongerScheduled,
} from '@utils/vaccineTestHelpers';
import { createPatient } from '@utils/apiHelpers';
import { scrollTableToElement } from '@utils/tableHelper';
import { subYears, subWeeks } from 'date-fns';

test.describe('Scheduled vaccines', () => {
  test('[AT-1045]Vaccines scheduled at birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const birthDueDate = await expectedDueDateWeek(currentDate, 1);
    const status = 'Due';
    const schedule = 'Birth';

    const patient = await createPatient(api, page, {
      dateOfBirth: currentDate,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'BCG',
      schedule,
      birthDueDate,
      status,
    );
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'Hep B',
      schedule,
      birthDueDate,
      status,
    );
  });

  test('[AT-1046]Vaccines scheduled weeks from birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const status = 'Scheduled';

    const sixWeekDueDate = await expectedDueDateWeek(currentDate, 6);
    const tenWeekDueDate = await expectedDueDateWeek(currentDate, 10);
    const fourteenWeekDueDate = await expectedDueDateWeek(currentDate, 14);

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
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'PCV13',
      '6 weeks',
      sixWeekDueDate,
      status,
    );
    //10 weeks from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'Pentavalent',
      '10 weeks',
      tenWeekDueDate,
      status,
    );
    //14 weeks from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'PCV13',
      '14 weeks',
      fourteenWeekDueDate,
      status,
    );
  });

  test('[AT-1047]Vaccines scheduled months from birth display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const status = 'Scheduled';

    //Weeks are used in this calculation because this is how its calculated in the database
    const nineMonthDueDate = await expectedDueDateWeek(currentDate, 39);
    const fifteenMonthDueDate = await expectedDueDateWeek(currentDate, 65);

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
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'MMR',
      '9 months',
      nineMonthDueDate,
      status,
    );
    //15 months from birth
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'DTP Booster',
      '15 months',
      fifteenMonthDueDate,
      status,
    );
  });

  test('[AT-1048]Vaccines scheduled years from birth display', async ({
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
    const tenYearDueDate = await expectedDueDateWeek(birthDateTenYearsAgo, 521);

    const patient = await createPatient(api, page, {
      dateOfBirth: birthDateTenYearsAgo,
    });

    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToVaccineTab();

    //Assert that a vaccine is scheduled for a patient born 10 years ago
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      vaccine,
      schedule,
      tenYearDueDate,
      status,
    );
  });

  test('[AT-1049]Vaccines scheduled weeks from last vaccination display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 8);
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
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      vaccine,
      schedule,
      doseTwoDueDate,
      status,
    );
  });

  //Note that the "missed" status is not displayed in this table as per comments on NASS-1113
  test('[AT-1050]Different scheduled statuses display', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
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

    //Assert statusDue
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'BCG',
      'Birth',
      due.dueDate,
      due.status,
    );

    //Assert statusScheduled
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'PCV13',
      '6 weeks',
      scheduled.dueDate,
      scheduled.status,
    );

    await patientDetailsPage.goToPatient(patientBornThreeWeeksAgo);
    await patientDetailsPage.navigateToVaccineTab();

    //Assert statusOverdue
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'BCG',
      'Birth',
      overdue.dueDate,
      overdue.status,
    );

    //Assert statusUpcoming
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      'PCV13',
      '6 weeks',
      upcoming.dueDate,
      upcoming.status,
    );
  });

  //Test data for recording scheduled vaccines test cases
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
      const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
      const birthDate = getBirthDate(currentDate);
      const dueDate = await getDueDate(birthDate);

      const patient = await createPatient(api, page, {
        dateOfBirth: birthDate,
      });

      await patientDetailsPage.goToPatient(patient);
      await patientDetailsPage.navigateToVaccineTab();

      await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status);

      await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
    });
  }

  test('[AT-1055]Vaccine remains scheduled if "not given" is selected when recording', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
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

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, dueDate, status, {
      given: givenStatus,
    });

    //Confirm the vaccine is still scheduled
    await patientDetailsPage.patientVaccinePane?.assertScheduledVaccinesTable(
      vaccine,
      schedule,
      dueDate,
      status,
    );
  });

  test('[AT-1056]Record 2nd dose of vaccine scheduled weeks from last vaccination', async ({
    page,
    api,
    patientDetailsPage,
  }) => {
    const currentDate = new Date(patientDetailsPage.getCurrentBrowserDateISOFormat());
    const doseTwoDueDate = await expectedDueDateWeek(currentDate, 8);
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

    await recordScheduledVaccine(patientDetailsPage, vaccine, schedule, doseTwoDueDate, status, {
      category: 'Campaign',
      count: 2,
    });

    await confirmVaccineNoLongerScheduled(patientDetailsPage, vaccine, schedule);
  });
});
