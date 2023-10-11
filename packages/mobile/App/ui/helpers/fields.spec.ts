import { checkMandatory } from './fields';

describe('checkMandatory', () => {
  it('should return false if mandatory argument is falsy', () => {
    expect(checkMandatory(false, {})).toBe(false);
    expect(checkMandatory(null, {})).toBe(false);
    expect(checkMandatory(undefined, {})).toBe(false);
  });

  it('should return mandatory argument if it is a boolean', () => {
    expect(checkMandatory(true, {})).toBe(true);
  });

  const testData = [
    { encounterType: 'Admission', expected: true },
    { encounterType: 'SurveyResponse', expected: true },
    { encounterType: 'Clinic', expected: false },
  ];

  const criteria = { encounterType: ['Admission', 'SurveyResponse'] };
  it.each(testData)(
    `should return correctly with criteria: ${JSON.stringify(criteria)}`,
    ({ encounterType, expected }) => {
      const result = checkMandatory(criteria, { encounterType });

      expect(result).toBe(expected);
    },
  );

  const testData2 = [
    { encounterType: 'Admission', expected: true },
    { encounterType: 'SurveyResponse', expected: false },
    { encounterType: 'Clinic', expected: false },
  ];
  const criteria2 = { encounterType: 'Admission' };

  it.each(testData2)(
    `should return correctly with criteria: ${JSON.stringify(criteria2)}`,
    ({ encounterType, expected }) => {
      const result = checkMandatory(criteria2, { encounterType });

      expect(result).toBe(expected);
    },
  );
});
