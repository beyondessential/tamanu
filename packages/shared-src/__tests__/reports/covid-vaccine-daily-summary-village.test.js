import { dataGenerator } from '../../src/reports/covid-vaccine-daily-summary-village';
jest.mock('config', () => ({
  reports: {
    'covid-vaccine-daily-summary-village': {
      hierarchyName: 'TEST_HIERARCHY',
      countryCode: 'TEST_COUNTRY',
    },
  },
}));

describe('covid-vaccine-daily-summary-village', () => {
  const mockModels = administeredVaccinesData => {
    return {
      AdministeredVaccine: {
        findAll: () =>
          administeredVaccinesData.map(row => ({
            get: () => row,
          })),
      },
      Patient: null,
      ScheduledVaccine: null,
    };
  };

  const mockRow = (
    num,
    dateStr = '2021-01-01T01:02:03.000Z',
    dateOfBirthStr = '1990-01-01T01:02:03.000Z',
    villageName = 'Village_A',
    sex = 'female',
    schedule = 'Dose 1',
  ) => ({
    date: new Date(dateStr),
    encounter: {
      patientId: `patientId_${num}`,
      patient: {
        displayId: `displayId_${num}`,
        firstName: `firstName_${num}`,
        lastName: `lastName_${num}`,
        dateOfBirth: new Date(dateOfBirthStr),
        village: {
          name: villageName,
        },
        sex,
      },
    },
    scheduledVaccine: {
      label: 'COVID-19',
      schedule,
    },
  });

  const mockTupaiaApi = () => ({
    entity: {
      getDescendantsOfEntity: () => [
        {
          code: 'VIL_A',
          name: 'Village_A',
        },
        {
          code: 'VIL_B',
          name: 'Village_B',
        },
      ],
    },
  });

  const getExpectedDataArray = shorthandExpectedDataArray => {
    return [
      [
        'entity_code',
        'timestamp',
        'COVIDVac1',
        'COVIDVac2',
        'COVIDVac3',
        'COVIDVac4',
        'COVIDVac5',
        'COVIDVac6',
        'COVIDVac7',
        'COVIDVac8',
      ],
      ...shorthandExpectedDataArray,
    ];
  };

  it('builds', async () => {
    const models = mockModels([mockRow(1), mockRow(2)]);

    const report = await dataGenerator(models, {}, mockTupaiaApi());

    expect(report).toEqual(
      getExpectedDataArray([['VIL_A', '2021-01-01 23:59:59', 0, 2, 0, 2, 0, 0, 0, 0]]),
    );
  });

  it('groups by date and village', async () => {
    const models = mockModels([
      mockRow(1, '2021-01-01T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(2, '2021-01-01T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(3, '2021-01-02T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(4, '2021-01-01T01:02:03.000Z', undefined, 'Village_B'),
    ]);

    const report = await dataGenerator(models, {}, mockTupaiaApi());

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2021-01-01 23:59:59', 0, 2, 0, 2, 0, 0, 0, 0],
        ['VIL_A', '2021-01-02 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
        ['VIL_B', '2021-01-01 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
      ]),
    );
  });

  it('calculates over 65', async () => {
    const models = mockModels([
      mockRow(1, '2000-01-01T01:02:03.000Z', '1934-01-01T01:02:03.000Z', 'Village_A'), // 66 years old at first dose
      mockRow(2, '2000-01-01T01:02:03.000Z', '1936-01-01T01:02:03.000Z', 'Village_A'), // 64 years old at first dose
      mockRow(3, '2000-01-01T01:02:03.000Z', '1934-01-01T01:02:03.000Z', 'Village_B', undefined, 'Dose 2'), // 66 years old at second dose
      mockRow(4, '2000-01-01T01:02:03.000Z', '1936-01-01T01:02:03.000Z', 'Village_B', undefined, 'Dose 2'), // 64 years old at second dose
    ]);

    const report = await dataGenerator(models, {}, mockTupaiaApi());

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2000-01-01 23:59:59', 0, 2, 1, 2, 0, 0, 0, 0],
        ['VIL_B', '2000-01-01 23:59:59', 0, 0, 0, 0, 0, 2, 1, 2],
      ]),
    );
  });
});
