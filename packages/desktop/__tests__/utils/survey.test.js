import { checkVisibility } from '../../app/utils';

describe('checkVisibility()', () => {
  const generateAllComponents = components =>
    components.map((component, index) => ({
      id: `component-${component.code}`,
      required: false,
      dataElement: {
        id: component.code,
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
      { code: 'TEST', type: 'Number' },
      { code: 'TEST_2', type: 'Number' },
    ]);

    const result = checkVisibility(allComponents[0], { TEST: 1, TEST_2: 2 }, allComponents);
    expect(result).toBe(true);
  });

  it('should not be visible if component type is result', () => {
    const allComponents = generateAllComponents([
      { code: 'TEST_ALWAYS', type: 'Result' },
      { code: 'REF', type: 'Binary' },
      { code: 'TEST_CHECK', type: 'Result', visibilityCriteria: 'REF: Yes' },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK: 100, TEST_ALWAYS: 0, REF: true },
      allComponents,
    );

    expect(result).toBe(false);
  });

  it('should be visible if criteria is met', () => {
    const allComponents = generateAllComponents([
      { code: 'TEST_ALWAYS', type: 'Result' },
      { code: 'REF', type: 'Binary' },
      { code: 'TEST_CHECK', type: 'Binary', visibilityCriteria: 'REF: Yes' },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK: 100, TEST_ALWAYS: 0, REF: true },
      allComponents,
    );

    expect(result).toBe(true);
  });

  it('should ignore a non-visible result field', () => {
    const allComponents = generateAllComponents([
      { code: 'TEST_ALWAYS', type: 'Result' },
      { code: 'REF', type: 'Binary' },
      { code: 'TEST_CHECK', type: 'Binary', visibilityCriteria: 'REF: Yes' },
    ]);

    const result = checkVisibility(
      allComponents[2],
      { TEST_CHECK: 0, TEST_ALWAYS: 100, REF: false },
      allComponents,
    );

    expect(result).toBe(false);
  });

  describe('Range type criteria', () => {
    const allComponents = generateAllComponents([
      {
        code: 'TEST_RESULT',
        type: 'Binary',
        visibilityCriteria: JSON.stringify({
          TEST_A: { type: 'range', start: 30 },
          TEST_B: { type: 'range', end: 50 },
          _conjunction: 'and',
        }),
      },
      { code: 'TEST_A', type: 'Binary' },
      { code: 'TEST_B', type: 'Binary' },
    ]);

    const testData = [
      { TEST_A: 30, TEST_B: 40, expected: true },
      { TEST_A: 30, TEST_B: 50, expected: false },
      { TEST_A: 30, TEST_B: 51, expected: false },
      { TEST_A: 29, TEST_B: 40, expected: false },
    ];

    it.each(testData)(
      'should return $expected for TEST_A: $TEST_A and TEST_B: $TEST_B',
      ({ TEST_A, TEST_B, expected }) => {
        const result = checkVisibility(
          allComponents[0],
          { TEST_A, TEST_B, TEST_RESULT: 20 },
          allComponents,
        );

        expect(result).toBe(expected);
      },
    );
  });
});
