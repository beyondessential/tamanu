import { ISurveyScreenComponent } from '~/types/ISurvey';

import { getResultValue } from '~/ui/helpers/fields';

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
