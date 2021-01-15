import { ISurveyScreenComponent } from '~/types/ISurvey';

import { getResultValue } from '~/ui/helpers/fields';
import { runCalculations } from '~/ui/helpers/calculations';

function makeDummyComponent(c: {}, index: number): ISurveyScreenComponent {
  return {
    id: `component-${c.code}`,
    required: false,
    dataElement: { 
      id: c.code,
      code: c.code,
      indicator: c.indicator,
      type: c.type,
      defaultText: '',
      defaultOptions: '',
    },
    screenIndex: 0,
    componentIndex: index,
    text: '',
    visibilityCriteria: '',
    options: '',
    ...c,
  };
}

function makeDummySurvey(parts: any[]): ISurveyScreenComponent[] {
  return parts.map((p, i) => makeDummyComponent(p, i));
}

describe('Survey calculations', () => {
  
  describe('CalculatedField', () => {

    it('should run a trivial calculation', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Calculated', calculation: '1' }
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(1);
    });

    it('should run a simple calculation', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Calculated', calculation: '1 + 1' }
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(2);
    });

    it('should run several calculations', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Calculated', calculation: '3 * 5' }
        { code: 'TEST_2', type: 'Calculated', calculation: '100 - 1' }
      ]);
      const calculations = runCalculations(survey, {});
      expect(calculations.TEST).toEqual(15);
      expect(calculations.TEST_2).toEqual(99);
    });

    it('should use substitutions', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Calculated', calculation: 'TEST_1 + TEST_2' }
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 24,
        TEST_2: 1000,
      });
      expect(calculations.TEST).toEqual(1024);
    });

    it('should use second-order substitutions', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST_BEFORE', type: 'Calculated', calculation: 'TEST_1 + TEST_2' }
        { code: 'TEST_AFTER', type: 'Calculated', calculation: 'TEST_BEFORE + 2000' }
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 24,
        TEST_2: 1000,
      });
      expect(calculations.TEST_AFTER).toEqual(3024);
    });

    it('should register errored calculations as undefined', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST_WORKS', type: 'Calculated', calculation: 'TEST_1 * 3' }
        { code: 'TEST_BROKEN', type: 'Calculated', calculation: 'TEST_NONEXISTENT' }
        { code: 'TEST_BROKEN_2', type: 'Calculated', calculation: '1 + + / * 4' }
      ]);
      const calculations = runCalculations(survey, {
        TEST_1: 5,
      });
      expect(calculations.TEST_WORKS).toEqual(15);
      expect(calculations).not.toHaveProperty('TEST_BROKEN');
      expect(calculations).not.toHaveProperty('TEST_BROKEN_2');
    });

  });

  describe('Results', () => {

    it('should return correct values for absent result field', () => { 
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Number' }
      ]);
      const { result, resultText } = getResultValue(survey, { TEST: 123 });
      expect(result).toEqual(0);
      expect(resultText).toEqual('');
    });

    it('should use a result field', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Result' }
      ]);
      const { result, resultText } = getResultValue(survey, { TEST: 123 });
      expect(result).toEqual(123);
      expect(resultText).toEqual('123%');
    });

    it('should be OK with a result field that has no value', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Result' }
      ]);
      const { result, resultText } = getResultValue(survey, {});
      expect(result).toEqual(0);
      expect(resultText).toEqual('');
    });

    it('should use a calculated result field that has no value', () => {
      const survey = makeDummySurvey([
        { code: 'TEST', type: 'Number' }
        { code: 'RESULT', type: 'Result', calculation: 'TEST * 2' }
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
        { code: 'TEST_CHECK', type: 'Result', visibilityCriteria: 'REF: Yes' }
        { code: 'REF', type: 'Binary' },
        { code: 'TEST_ALWAYS', type: 'Result' }
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
        { code: 'TEST_A', type: 'Result', visibilityCriteria: 'REF: Yes' }
        { code: 'TEST_B', type: 'Result' },
        { code: 'REF', type: 'Binary' },
        { code: 'TEST_C', type: 'Result' }
      ]);

      it('should use the first result field if multiple are visible', () => { 
        const { result, resultText } = getResultValue(multiVisibilitySurvey, {
          TEST_A: 0,
          TEST_B: 50,
          TEST_C: 100,
          REF: false,
        });
        expect(result).toEqual(50);
        expect(resultText).toEqual('50%');
      });

    });
  });

});
