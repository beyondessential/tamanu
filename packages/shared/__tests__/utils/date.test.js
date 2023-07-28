import { getDisplayAge } from '../../src/utils/date';

describe('date', () => {
  describe('getDisplayAge', () => {
    const now = new Date('2023-07-11');

    beforeAll(() => {
      jest.resetModules();
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    const ageDisplayFormat = [
      {
        as: 'days',
        range: {
          min: { duration: { days: 0 } },
          max: { duration: { days: 8 }, exclusive: true },
        },
      },
      {
        as: 'weeks',
        range: {
          min: { duration: { days: 8 } },
          max: { duration: { months: 1 }, exclusive: true },
        },
      },
      {
        as: 'months',
        range: {
          min: { duration: { months: 1 } },
          max: { duration: { years: 2 }, exclusive: true },
        },
      },
      {
        as: 'years',
        range: {
          min: { duration: { years: 2 } },
        },
      },
    ];

    const testCases = [
      {
        dateOfBirth: '2023-07-11',
        expectedDisplayAge: '0 day',
      },
      {
        dateOfBirth: '2023-07-10',
        expectedDisplayAge: '1 day',
      },
      {
        dateOfBirth: '2023-07-04',
        expectedDisplayAge: '7 days',
      },
      {
        dateOfBirth: '2023-07-03',
        expectedDisplayAge: '1 week',
      },
      {
        dateOfBirth: '2023-06-12',
        expectedDisplayAge: '4 weeks',
      },
      {
        dateOfBirth: '2023-06-11',
        expectedDisplayAge: '1 month',
      },
      {
        dateOfBirth: '2022-07-12',
        expectedDisplayAge: '11 months',
      },
      {
        dateOfBirth: '2022-07-11',
        expectedDisplayAge: '12 months',
      },
      {
        dateOfBirth: '2021-07-12',
        expectedDisplayAge: '23 months',
      },
      {
        dateOfBirth: '2021-07-11',
        expectedDisplayAge: '2 years',
      },
      {
        dateOfBirth: '2020-07-12',
        expectedDisplayAge: '2 years',
      },
      {
        dateOfBirth: '2020-07-11',
        expectedDisplayAge: '3 years',
      },
      {
        dateOfBirth: '2018-07-11',
        expectedDisplayAge: '5 years',
      },
    ];

    testCases.forEach(testCase => {
      it(`should display age '${testCase.expectedDisplayAge}' from date of birth '${testCase.dateOfBirth}'`, () => {
        const displayAge = getDisplayAge(testCase.dateOfBirth, ageDisplayFormat);
        expect(displayAge).toEqual(testCase.expectedDisplayAge);
      });
    });
  });
});
