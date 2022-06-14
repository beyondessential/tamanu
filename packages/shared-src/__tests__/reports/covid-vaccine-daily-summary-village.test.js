import sinon from 'sinon';
import moment from 'moment';
import { parseISO, format } from 'date-fns';
import { dataGenerator } from '../../src/reports/covid-module/covid-vaccine-daily-summary-village';

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
    label = 'COVID-19-AZ',
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
      label,
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
        'start_time',
        'end_time',
        'COVIDVac1',
        'COVIDVac2',
        'COVIDVac3',
        'COVIDVac4',
        'COVIDVac5',
        'COVIDVac6',
        'COVIDVac7',
        'COVIDVac8',
        'COVIDVac9',
        'COVIDVac10',
        'COVIDVac11',
        'COVIDVac12',
        'COVIDVac13',
        'COVIDVac14',
        'COVIDVac15',
        'COVIDVac16',
        'COVIDVac17',
        'COVIDVac18',
        'COVIDVac19',
        'COVIDVac20',
        'COVIDVac21',
        'COVIDVac22',
        'COVIDVac23',
        'COVIDVac24',
      ],
      ...shorthandExpectedDataArray.map(shorthandRow => {
        const [entity_code, timestamp, specifiedValues] = shorthandRow;
        const covidDataPointValues = {
          COVIDVac1: 0,
          COVIDVac2: 0,
          COVIDVac3: 0,
          COVIDVac4: 0,
          COVIDVac5: 0,
          COVIDVac6: 0,
          COVIDVac7: 0,
          COVIDVac8: 0,
          COVIDVac9: 0,
          COVIDVac10: 0,
          COVIDVac11: 0,
          COVIDVac12: 0,
          COVIDVac13: 0,
          COVIDVac14: 0,
          COVIDVac15: 0,
          COVIDVac16: 0,
          COVIDVac17: 0,
          COVIDVac18: 0,
          COVIDVac19: 0,
          COVIDVac20: 0,
          COVIDVac21: 0,
          COVIDVac22: 0,
          COVIDVac23: 0,
          COVIDVac24: 0,
        };
        Object.entries(specifiedValues).forEach(([specifiedKey, specifiedValue]) => {
          covidDataPointValues[specifiedKey] = specifiedValue;
        });
        return [
          entity_code,
          timestamp,
          format(parseISO('2021-10-10T00:00:00+11:00'), 'yyyy/MM/dd HH:mm:ss'), // mocked now
          format(parseISO('2021-10-10T00:00:00+11:00'), 'yyyy/MM/dd HH:mm:ss'), // mocked now
          ...Object.values(covidDataPointValues),
        ];
      }),
    ];
  };

  let clock;
  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: 1633784400000, // 2021-10-10T00:00:00+11:00
    });
    moment.tz.setDefault('Australia/Melbourne');
  });

  afterAll(() => {
    clock.restore();
  });

  it('throws if fromDate is after toDate', async () => {
    const models = mockModels([mockRow(1), mockRow(2)]);

    const runReport = async () => {
      return dataGenerator(
        { models },
        { fromDate: '2021-05-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
        mockTupaiaApi(),
      );
    };

    await expect(runReport()).rejects.toThrow('fromDate must be before toDate');
  });

  it('builds', async () => {
    const models = mockModels([mockRow(1), mockRow(2)]);

    const report = await dataGenerator(
      { models },
      // note: it looks up until the end of the day of toDate, so we can pass 00:00:00Z and still have the data returned
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([['VIL_A', '2021/01/01 23:59:59', { COVIDVac2: 2, COVIDVac4: 2 }]]),
      ),
    );
  });

  it('groups by date and village', async () => {
    const models = mockModels([
      mockRow(1, '2021/01/01 01:02:03', undefined, 'Village_A'),
      mockRow(2, '2021/01/01 01:02:03', undefined, 'Village_A'),
      mockRow(3, '2021/01/02 01:02:03', undefined, 'Village_A'),
      mockRow(4, '2021/01/01 01:02:03', undefined, 'Village_B'),
    ]);

    const report = await dataGenerator(
      { models },
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021/01/01 23:59:59', { COVIDVac2: 2, COVIDVac4: 2 }],
          ['VIL_A', '2021/01/02 23:59:59', { COVIDVac2: 1, COVIDVac4: 1 }],
          ['VIL_B', '2021/01/01 23:59:59', { COVIDVac2: 1, COVIDVac4: 1 }],
        ]),
      ),
    );
  });

  it('calculates over 65', async () => {
    const models = mockModels([
      mockRow(1, '2000-01-01T01:02:03.000Z', '1934-01-01T01:02:03.000Z', 'Village_A'), // 66 years old at first dose
      mockRow(2, '2000-01-01T01:02:03.000Z', '1936-01-01T01:02:03.000Z', 'Village_A'), // 64 years old at first dose
      mockRow(
        3,
        '2000-01-01T01:02:03.000Z',
        '1934-01-01T01:02:03.000Z',
        'Village_B',
        undefined,
        'Dose 2',
      ), // 66 years old at second dose
      mockRow(
        4,
        '2000-01-01T01:02:03.000Z',
        '1936-01-01T01:02:03.000Z',
        'Village_B',
        undefined,
        'Dose 2',
      ), // 64 years old at second dose
    ]);

    const report = await dataGenerator(
      { models },
      { fromDate: '2000-01-01T00:00:00Z', toDate: '2000-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2000/01/01 23:59:59', { COVIDVac2: 2, COVIDVac3: 1, COVIDVac4: 2 }],
        ['VIL_B', '2000/01/01 23:59:59', { COVIDVac6: 2, COVIDVac7: 1, COVIDVac8: 2 }],
      ]),
    );
  });

  it('has empty rows for no data', async () => {
    const models = mockModels([
      mockRow(1, '2021-01-01T01:02:03.000Z'), // village B missing
    ]);

    const report = await dataGenerator(
      { models },
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      getExpectedDataArray([
        ['VIL_A', '2021/01/01 23:59:59', { COVIDVac2: 1, COVIDVac4: 1 }],
        [
          'VIL_A',
          '2021/01/02 23:59:59',
          {
            COVIDVac1: null,
            COVIDVac2: null,
            COVIDVac3: null,
            COVIDVac4: null,
            COVIDVac5: null,
            COVIDVac6: null,
            COVIDVac7: null,
            COVIDVac8: null,
            COVIDVac9: null,
            COVIDVac10: null,
            COVIDVac11: null,
            COVIDVac12: null,
            COVIDVac13: null,
            COVIDVac14: null,
            COVIDVac15: null,
            COVIDVac16: null,
            COVIDVac17: null,
            COVIDVac18: null,
            COVIDVac19: null,
            COVIDVac20: null,
            COVIDVac21: null,
            COVIDVac22: null,
            COVIDVac23: null,
            COVIDVac24: null,
          },
        ],
        [
          'VIL_B',
          '2021/01/01 23:59:59',
          {
            COVIDVac1: null,
            COVIDVac2: null,
            COVIDVac3: null,
            COVIDVac4: null,
            COVIDVac5: null,
            COVIDVac6: null,
            COVIDVac7: null,
            COVIDVac8: null,
            COVIDVac9: null,
            COVIDVac10: null,
            COVIDVac11: null,
            COVIDVac12: null,
            COVIDVac13: null,
            COVIDVac14: null,
            COVIDVac15: null,
            COVIDVac16: null,
            COVIDVac17: null,
            COVIDVac18: null,
            COVIDVac19: null,
            COVIDVac20: null,
            COVIDVac21: null,
            COVIDVac22: null,
            COVIDVac23: null,
            COVIDVac24: null,
          },
        ],
        [
          'VIL_B',
          '2021/01/02 23:59:59',
          {
            COVIDVac1: null,
            COVIDVac2: null,
            COVIDVac3: null,
            COVIDVac4: null,
            COVIDVac5: null,
            COVIDVac6: null,
            COVIDVac7: null,
            COVIDVac8: null,
            COVIDVac9: null,
            COVIDVac10: null,
            COVIDVac11: null,
            COVIDVac12: null,
            COVIDVac13: null,
            COVIDVac14: null,
            COVIDVac15: null,
            COVIDVac16: null,
            COVIDVac17: null,
            COVIDVac18: null,
            COVIDVac19: null,
            COVIDVac20: null,
            COVIDVac21: null,
            COVIDVac22: null,
            COVIDVac23: null,
            COVIDVac24: null,
          },
        ],
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
      { models },
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-02T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021/01/01 23:59:59', { COVIDVac2: 1, COVIDVac4: 1 }],
          [
            'VIL_A',
            '2021/01/02 23:59:59',
            {
              COVIDVac1: null,
              COVIDVac2: null,
              COVIDVac3: null,
              COVIDVac4: null,
              COVIDVac5: null,
              COVIDVac6: null,
              COVIDVac7: null,
              COVIDVac8: null,
              COVIDVac9: null,
              COVIDVac10: null,
              COVIDVac11: null,
              COVIDVac12: null,
              COVIDVac13: null,
              COVIDVac14: null,
              COVIDVac15: null,
              COVIDVac16: null,
              COVIDVac17: null,
              COVIDVac18: null,
              COVIDVac19: null,
              COVIDVac20: null,
              COVIDVac21: null,
              COVIDVac22: null,
              COVIDVac23: null,
              COVIDVac24: null,
            },
          ],
        ]),
      ),
    );
  });

  it('only considers given vaccines', async () => {
    const models = mockModels([
      // Same patient, same Dose 1, different days
      mockRow(1, '2021/01/01 01:02:03', undefined, undefined, undefined, undefined, 'GIVEN'),
      mockRow(2, '2021/01/01 01:02:03', undefined, undefined, undefined, undefined, 'NOT_GIVEN'),
    ]);

    const report = await dataGenerator(
      { models },
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([['VIL_A', '2021/01/01 23:59:59', { COVIDVac2: 1, COVIDVac4: 1 }]]),
      ),
    );
  });

  it('reports on pfizer label vaccine doses', async () => {
    const models = mockModels([
      mockRow(
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'Covid-19 Pfizer',
      ),
      mockRow(2, undefined, undefined, undefined, 'male', undefined, undefined, 'Covid-19 Pfizer'),
    ]);

    const report = await dataGenerator(
      { models },
      // note: it looks up until the end of the day of toDate, so we can pass 00:00:00Z and still have the data returned
      { fromDate: '2021-01-01T00:00:00Z', toDate: '2021-01-01T00:00:00Z' },
      mockTupaiaApi(),
    );

    expect(report).toEqual(
      expect.objectContaining(
        getExpectedDataArray([
          ['VIL_A', '2021/01/01 23:59:59', { COVIDVac13: 1, COVIDVac14: 1, COVIDVac16: 2 }],
        ]),
      ),
    );
  });
});
