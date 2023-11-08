// Copied from https://github.com/beyondessential/tamanu-mobile/blob/dev/App/ui/components/Forms/SurveyForm/surveyCalculations.spec.ts
import { getResultValue } from '../../src/utils/fields';
import { runCalculations } from '../../src/utils/calculations';

function makeDummySurvey(components) {
  return components.map((component, index) => ({
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
}

describe('Survey calculations', () => {
  describe('CalculatedField', () => {
    it('should run a trivial calculation', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'CalculatedQuestion', calculation: '1' },
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(1);
    });

    it('should run a simple calculation', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'CalculatedQuestion', calculation: '1 + 1' },
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(2);
    });

    it('should run several calculations', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'CalculatedQuestion', calculation: '3 * 5' },
        { code: 'TEST_2', type: 'CalculatedQuestion', calculation: '100 - 1' },
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(15);
      expect(calculations.TEST_2).toEqual(99);
    });

    it('should round the value to the configured number of decimal places', () => {
      const survey = makeDummySurvey([
        {
          code: 'TEST',
          type: 'CalculatedQuestion',
          calculation: '13 / 3',
          config: '{ "rounding": 1 }',
        },
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(4.3);
    });

    it('should use substitutions', () => {
      const survey = makeDummySurvey([
        { code: 'TEST_1' },
        { code: 'TEST_2' },
        { code: 'TEST', type: 'CalculatedQuestion', calculation: 'TEST_1 + TEST_2' },
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 24,
        TEST_2: 1000,
      });
      expect(calculations.TEST).toEqual(1024);
    });

    it('should use second-order substitutions', () => {
      const survey = makeDummySurvey([
        { code: 'TEST_1' },
        { code: 'TEST_2' },
        { code: 'TEST_BEFORE', type: 'CalculatedQuestion', calculation: 'TEST_1 + TEST_2' },
        { code: 'TEST_AFTER', type: 'CalculatedQuestion', calculation: 'TEST_BEFORE + 2000' },
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 24,
        TEST_2: 1000,
      });
      expect(calculations.TEST_AFTER).toEqual(3024);
    });

    it('should register errored calculations as undefined', () => {
      const survey = makeDummySurvey([
        { code: 'TEST_1' },
        { code: 'TEST_WORKS', type: 'CalculatedQuestion', calculation: 'TEST_1 * 3' },
        { code: 'TEST_BROKEN', type: 'CalculatedQuestion', calculation: 'TEST_NONEXISTENT' },
        { code: 'TEST_BROKEN_2', type: 'CalculatedQuestion', calculation: '1 + + / * 4' },
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 5,
      });
      expect(calculations.TEST_WORKS).toEqual(15);
      expect(calculations).toHaveProperty('TEST_BROKEN', null);
      expect(calculations).toHaveProperty('TEST_BROKEN_2', null);
    });
  });

  describe('Results', () => {
    it('should return correct values for absent result field', () => {
      const survey = makeDummySurvey([{ code: 'TEST', type: 'Number' }]);
      const { result, resultText } = getResultValue(survey, { TEST: 123 });
      expect(result).toEqual(0);
      expect(resultText).toEqual('');
    });

    it('should use a result field', () => {
      const survey = makeDummySurvey([{ code: 'TEST', type: 'Result' }]);
      const { result, resultText } = getResultValue(survey, { TEST: 123 });
      expect(result).toEqual(123);
      expect(resultText).toEqual('123%');
    });

    it('should be OK with a result field that has no value', () => {
      const survey = makeDummySurvey([{ code: 'TEST', type: 'Result' }]);
      const { result, resultText } = getResultValue(survey, {});
      expect(result).toEqual(0);
      expect(resultText).toEqual('');
    });

    it('should use a calculated result field that has no value', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Number' },
        { code: 'RESULT', type: 'Result', calculation: 'TEST * 2' },
      ]);
      const values = runCalculations(survey, {
        TEST: 10,
      });
      const { result, resultText } = getResultValue(survey, values);
      expect(result).toEqual(20);
      expect(resultText).toEqual('20%');
    });

    describe('Visibility', () => {
      const visibilitySurvey = makeDummySurvey([
        { code: 'TEST_ALWAYS', type: 'Result' },
        { code: 'REF', type: 'Binary' },
        { code: 'TEST_CHECK', type: 'Result', visibilityCriteria: 'REF: Yes' },
        {
          code: 'TEST_CHECK_SPECIAL',
          type: 'Result',
          visibilityCriteria: '{"encounterType": "clinical"}',
        },
      ]);

      it('should use a visible result field', () => {
        const { result, resultText } = getResultValue(visibilitySurvey, {
          TEST_CHECK: 100,
          TEST_ALWAYS: 0,
          REF: true,
        });
        expect(result).toEqual(100);
        expect(resultText).toEqual('100%');
      });

      it('should ignore a non-visible result field', () => {
        const { result, resultText } = getResultValue(visibilitySurvey, {
          TEST_CHECK: 0,
          TEST_ALWAYS: 100,
          REF: false,
        });
        expect(result).toEqual(100);
        expect(resultText).toEqual('100%');
      });

      const multiVisibilitySurvey = makeDummySurvey([
        { code: 'TEST_A', type: 'Result', visibilityCriteria: 'REF: Yes' },
        { code: 'TEST_B', type: 'Result' },
        { code: 'REF', type: 'Binary' },
        { code: 'TEST_C', type: 'Result' },
      ]);

      it('should ignore a non-visible result field using special values', () => {
        const { result, resultText } = getResultValue(
          visibilitySurvey,
          {
            TEST_CHECK_SPECIAL: 0,
            TEST_ALWAYS: 100,
            REF: false,
          },
          { encounterType: 'admission' },
        );
        expect(result).toEqual(100);
        expect(resultText).toEqual('100%');
      });

      const visibilitySurvey2 = makeDummySurvey([
        { code: 'TEST_ALWAYS', type: 'Result' },
        { code: 'REF', type: 'Binary' },
        { code: 'TEST_CHECK', type: 'Result', visibilityCriteria: 'REF: Yes' },
        {
          code: 'TEST_CHECK_SPECIAL',
          type: 'Result',
          visibilityCriteria: '{"encounterType": "admission"}',
        },
      ]);

      it('should not ignore a visible result field using special values', () => {
        const { result, resultText } = getResultValue(
          visibilitySurvey2,
          {
            TEST_CHECK_SPECIAL: 0,
            TEST_ALWAYS: 100,
            REF: false,
          },
          { encounterType: 'admission' },
        );
        expect(result).toEqual(0);
        expect(resultText).toEqual('0%');
      });

      it('should use the last result field if multiple are visible', () => {
        const { result, resultText } = getResultValue(multiVisibilitySurvey, {
          TEST_A: 0,
          TEST_B: 50,
          TEST_C: 100,
          REF: false,
        });
        expect(result).toEqual(100);
        expect(resultText).toEqual('100%');
      });
    });
  });
});
