import { format } from 'date-fns';
import { getDisplayAge, type AgeDisplayFormat } from '../src/date';
import { describe, it, expect, beforeAll, afterAll, vitest } from 'vitest';

describe('date', () => {
  describe('getDisplayAge', () => {
    const now = new Date('2023-07-11 22:55:36');

    beforeAll(() => {
      vitest.resetModules();
      vitest.useFakeTimers();
      vitest.setSystemTime(now);
    });

    afterAll(() => {
      vitest.useRealTimers();
    });

    const ageDisplayFormat: AgeDisplayFormat[] = [
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
        expectedDisplayAge: '0 days',
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
      it(`should display age '${testCase.expectedDisplayAge}' from date of birth '${
        testCase.dateOfBirth
      }' at '${format(now, 'yyyy-MM-dd')}'`, () => {
        const displayAge = getDisplayAge(testCase.dateOfBirth, ageDisplayFormat);
        expect(displayAge).toEqual(testCase.expectedDisplayAge);
      });
    });
  });
});
