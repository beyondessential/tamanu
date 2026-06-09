import { describe, expect, it } from 'vitest';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { checkJSONCriteria } from '../src/criteria';

const binaryComponents = [
  { dataElement: { code: 'gate', type: PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX } },
];

describe('checkJSONCriteria', () => {
  describe('Binary and Checkbox questions', () => {
    it.each([
      ['Yes', 'true'],
      ['Yes', true],
      ['Yes', 'Yes'],
      [true, 'true'],
      [true, true],
      [true, 'Yes'],
      ['true', 'Yes'],
      ['false', 'No'],
      [false, false],
      ['No', 'false'],
    ] as const)(
      'should treat criteria %j and answer %j as matching when equivalent',
      (criteriaValue, answerValue) => {
        const result = checkJSONCriteria(
          JSON.stringify({ gate: criteriaValue }),
          binaryComponents,
          { gate: answerValue },
        );
        expect(result).toBe(true);
      },
    );

    it.each([
      ['Yes', 'false'],
      ['Yes', false],
      ['Yes', 'No'],
      [true, 'false'],
      ['true', 'No'],
    ] as const)(
      'should treat criteria %j and answer %j as not matching when opposite',
      (criteriaValue, answerValue) => {
        const result = checkJSONCriteria(
          JSON.stringify({ gate: criteriaValue }),
          binaryComponents,
          { gate: answerValue },
        );
        expect(result).toBe(false);
      },
    );

    it('should not match when the gate question is unanswered', () => {
      const result = checkJSONCriteria(JSON.stringify({ gate: 'Yes' }), binaryComponents, {});
      expect(result).toBe(false);
    });

    it('should match any listed binary criteria value in an array', () => {
      const result = checkJSONCriteria(JSON.stringify({ gate: ['Yes', 'No'] }), binaryComponents, {
        gate: 'true',
      });
      expect(result).toBe(true);
    });
  });
});
