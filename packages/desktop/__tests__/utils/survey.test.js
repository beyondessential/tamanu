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
});
