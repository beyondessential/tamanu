import moment from 'moment';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from 'shared/demoData/patients';
import { createAdministeredVaccine, createScheduledVaccine } from 'shared/demoData/vaccines';
import { createTestContext } from '../../utilities';

const response = [
  {
    id: 'b0ffba2e-aecb-46b5-a522-f5124d80fa5a',
    date: '2022-08-04T04:49:35.797Z',
    'national health number': 'b67c412c',
    'patient first name': 'Effie',
    'patient last name': 'Abbott',
  },
  {
    id: 'b678885c-642b-41a2-afdc-75c21ee1a685',
    date: '2022-08-15T23:48:51.584Z',
    'national health number': 'b67c412c',
    'patient first name': 'Effie',
    'patient last name': 'Abbott',
  },
];

const example = [
  [
    'Patient First Name',
    'Patient Last Name',
    'National Health Number',
    'Diagnoses',
    'Referring Doctor',
    'Department',
    'Date',
  ],
  ['Effie', 'Abbott', 'b67c412c', null, null, '', '2022-08-04T04:49:35.797Z'],
  ['Effie', 'Abbott', 'b67c412c', null, null, '', '2022-08-15T23:48:51.584Z'],
];

const originalGenerateReportFromQueryData = (queryData, columnTemplate) => [
  columnTemplate.map(c => c.title),
  ...queryData.map(r =>
    columnTemplate.map(c => {
      try {
        return c.accessor(r);
      } catch (e) {
        return undefined;
      }
    }),
  ),
];

const generateReportFromQueryData = queryData => [
  Object.keys(queryData[0]),
  ...queryData.map(col => Object.values(col)),
];

describe('Database Defined Reports', () => {
  let baseApp = null;
  let village;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const models = ctx.models;
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  describe('Inline report', () => {
    it('Run a report inline for a single facility', async () => {
      console.log('Running test...');
      // const result = await baseApp.post(`/v1/reports/123`, { legacyReport: false });
      // expect(result).toHaveSucceeded();

      const output = generateReportFromQueryData(response);
      console.log('output:', output);
      expect(output).toEqual(example);
    });
  });

  // describe('returns data based on parameters', () => {
  //   it('should return data for patients of the right village', async () => {
  //     const result = await app.post('/v1/reports/vaccine-list').send({
  //       parameters: { village: village, fromDate: '2021-03-15' },
  //     });
  //
  //     expect(result).toHaveSucceeded();
  //
  //   });
  // });
});
