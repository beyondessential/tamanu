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
    status = 'GIVEN',
  ) => ({
    date: new Date(dateStr),
    status,
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

  it('throws if fromDate is after toDate', async () => {
    const models = mockModels([mockRow(1), mockRow(2)]);

    const runReport = async () => {
      return dataGenerator(
        models,
        { fromDate: '2021-05-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
        mockTupaiaApi(),
      );
    };

    await expect(runReport()).rejects.toThrow('fromDate must be before toDate');
  });

  it('builds', async () => {
    const models = mockModels([mockRow(1), mockRow(2)]);

    const report = await dataGenerator(
      models,
      // note: it looks up until the end of the day of toDate, so we can pass 00:00:00Z and still have the data returned
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([['VIL_A', '2021-01-01 23:59:59', 0, 2, 0, 2, 0, 0, 0, 0]]),
      ),
    );
  });

  it('groups by date and village', async () => {
    const models = mockModels([
      mockRow(1, '2021-01-01T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(2, '2021-01-01T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(3, '2021-01-02T01:02:03.000Z', undefined, 'Village_A'),
      mockRow(4, '2021-01-01T01:02:03.000Z', undefined, 'Village_B'),
    ]);

    const report = await dataGenerator(
      models,
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021-01-01 23:59:59', 0, 2, 0, 2, 0, 0, 0, 0],
          ['VIL_A', '2021-01-02 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
          ['VIL_B', '2021-01-01 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
        ]),
      ),
    );
  });

  it('calculates over 65', async () => {
    const models = mockModels([
      mockRow(1, '2000-01-01T01:02:03.000Z', '1934-01-01T01:02:03.000Z', 'Village_A'), // 66 years old at first dose
      mockRow(2, '2000-01-01T01:02:03.000Z', '1936-01-01T01:02:03.000Z', 'Village_A'), // 64 years old at first dose
      mockRow(3, '2000-01-01T01:02:03.000Z', '1934-01-01T01:02:03.000Z', 'Village_B', undefined, 'Dose 2'), // 66 years old at second dose
      mockRow(4, '2000-01-01T01:02:03.000Z', '1936-01-01T01:02:03.000Z', 'Village_B', undefined, 'Dose 2'), // 64 years old at second dose
    ]);

    const report = await dataGenerator(
      models,
      { fromDate: '2000-01-01T00:00:00Z', toDate: '2000-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2000-01-01 23:59:59', 0, 2, 1, 2, 0, 0, 0, 0],
        ['VIL_B', '2000-01-01 23:59:59', 0, 0, 0, 0, 0, 2, 1, 2],
      ]),
    );
  });

  it('has empty rows for no data', async () => {
    const models = mockModels([
      mockRow(1, '2021-01-01T01:02:03.000Z'), // village B missing
    ]);

    const report = await dataGenerator(
      models,
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2021-01-01 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
        ['VIL_A', '2021-01-02 23:59:59', null, null, null, null, null, null, null, null],
        ['VIL_B', '2021-01-01 23:59:59', null, null, null, null, null, null, null, null],
        ['VIL_B', '2021-01-02 23:59:59', null, null, null, null, null, null, null, null],
      ]),
    );
  });

  it('uses earliest dose if multiple per patient', async () => {
    const models = mockModels([
      // Same patient, same Dose 1, different days
      mockRow(1, '2021-01-02T01:02:03.000Z'),
      mockRow(1, '2021-01-01T01:02:03.000Z'),
    ]);

    const report = await dataGenerator(
      models,
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021-01-01 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
          ['VIL_A', '2021-01-02 23:59:59', null, null, null, null, null, null, null, null],
        ]),
      ),
    );
  });

  it('only considers given vaccines', async () => {
    const models = mockModels([
      // Same patient, same Dose 1, different days
      mockRow(1, '2021-01-01T01:02:03.000Z', undefined, undefined, undefined, undefined, 'GIVEN'),
      mockRow(2, '2021-01-01T01:02:03.000Z', undefined, undefined, undefined, undefined, 'NOT_GIVEN'),
    ]);

    const report = await dataGenerator(
      models,
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021-01-01 23:59:59', 0, 1, 0, 1, 0, 0, 0, 0],
        ]),
      ),
    );
  });
});
