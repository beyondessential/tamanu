import { checkMandatory, checkVisibility } from '../../app/utils';

describe('checkVisibility()', () => {
  const generateAllComponents = components =>
    components.map((component, index) => ({
      code: `component-${component.code}`,
      required: false,
      dataElement: {
        id: component.id,
        code: component.code,
        name: component.name,
        type: component.type,
        defaultText: '',
        defaultOptions: '',
      },
      screenIndex: 0,
      componentIndex: index,
      text: '',
      visibilityCriteria: '',
      options: '',
      getConfigObject: () => component.config || {},
      ...component,
    }));

  it('should be visible without any visibility criteria', () => {
    const allComponents = generateAllComponents([
      { id: 'TEST_ID', code: 'TEST_CODE', type: 'Number' },
      { id: 'TEST_2_ID', code: 'TEST_2_CODE', type: 'Number' },
    ]);

    const result = checkVisibility(allComponents[0], { TEST: 1, TEST_2: 2 }, allComponents);
    expect(result).toBe(true);
  });

  it('should not be visible if component type is result', () => {
    const allComponents = generateAllComponents([
      { id: 'TEST_ALWAYS_ID', code: 'TEST_ALWAYS_CODE', type: 'Result' },
      { id: 'REF_ID', code: 'REF_CODE', type: 'Binary' },
      {
        id: 'TEST_CHECK_ID',
        code: 'TEST_CHECK_CODE',
        type: 'Result',
        visibilityCriteria: 'REF_CODE: Yes',
      },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK_ID: 100, TEST_ALWAYS_ID: 0, REF_ID: true },
      allComponents,
    );

    expect(result).toBe(false);
  });

  it('should be visible if criteria is met', () => {
    const allComponents = generateAllComponents([
      { id: 'TEST_ALWAYS_ID', code: 'TEST_ALWAYS_CODE', type: 'Result' },
      { id: 'REF_ID', code: 'REF_CODE', type: 'Binary' },
      {
        id: 'TEST_CHECK_ID',
        code: 'TEST_CHECK_CODE',
        type: 'Binary',
        visibilityCriteria: 'REF_ID: Yes',
      },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK_ID: 100, TEST_ALWAYS_ID: 0, REF_ID: true },
      allComponents,
    );

    expect(result).toBe(true);
  });

  it('should ignore a non-visible result field', () => {
    const allComponents = generateAllComponents([
      { id: 'TEST_ALWAYS_ID', code: 'TEST_ALWAYS_CODE', type: 'Result' },
      { id: 'REF_ID', code: 'REF_CODE', type: 'Binary' },
      {
        id: 'TEST_CHECK_ID',
        code: 'TEST_CHECK_CODE',
        type: 'Binary',
        visibilityCriteria: 'REF_CODE: Yes',
      },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK_ID: 0, TEST_ALWAYS_ID: 100, REF_ID: false },
      allComponents,
    );

    expect(result).toBe(false);
  });

  describe('Range type criteria', () => {
    const allComponents = generateAllComponents([
      {
        id: 'TEST_RESULT_ID',
        code: 'TEST_RESULT_CODE',
        type: 'Binary',
        visibilityCriteria: JSON.stringify({
          TEST_A_CODE: { type: 'range', start: 30 },
          TEST_B_CODE: { type: 'range', end: 50 },
          _conjunction: 'and',
        }),
      },
      { id: 'TEST_A_ID', code: 'TEST_A_CODE', type: 'Binary' },
      { id: 'TEST_B_ID', code: 'TEST_B_CODE', type: 'Binary' },
    ]);

    const testData = [
      { TEST_A_ID: 30, TEST_B_ID: 40, expected: true },
      { TEST_A_ID: 30, TEST_B_ID: 50, expected: false },
      { TEST_A_ID: 30, TEST_B_ID: 51, expected: false },
      { TEST_A_ID: 29, TEST_B_ID: 40, expected: false },
    ];

    it.each(testData)(
      'should return $expected for TEST_A_ID: $TEST_A_ID and TEST_B_ID: $TEST_B_ID',
      ({ TEST_A_ID, TEST_B_ID, expected }) => {
        const result = checkVisibility(
          allComponents[0],
          { TEST_A_ID, TEST_B_ID, TEST_RESULT: 20 },
          allComponents,
        );

        expect(result).toBe(expected);
      },
    );
  });

  describe('checkMandatory()', () => {
    it('should support mandatory in Boolean type', () => {
      const result = checkMandatory(true);
      expect(result).toBe(true);
    });

    const testData = [
      { encounterType: 'Admission', expected: true },
      { encounterType: 'SurveyResponse', expected: true },
      { encounterType: 'Clinic', expected: false },
    ];

    it.each(testData)(
      'should return $expected for encounterType: $encounterType',
      ({ encounterType, expected }) => {
        const result = checkMandatory(
          { encounterType: ['Admission', 'SurveyResponse'] },
          { encounterType },
        );

        expect(result).toBe(expected);
      },
    );
  });
});
