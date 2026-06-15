import { describe, expect, it } from 'vitest';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { checkJSONCriteria, convertBinaryToYesNo, normalizeBinaryAnswer } from '../src/criteria';

const binaryComponents = [
  { dataElement: { code: 'gate', type: PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX } },
];

describe('normalizeBinaryAnswer', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['Yes', true],
    ['No', false],
    ['1', true],
    ['0', false],
    [null, null],
    [undefined, undefined],
  ] as const)('should normalize %j to %j', (answer, expected) => {
    expect(normalizeBinaryAnswer(answer)).toBe(expected);
  });
});

describe('convertBinaryToYesNo', () => {
  it.each([
    [true, 'Yes'],
    [false, 'No'],
    ['true', 'Yes'],
    ['false', 'No'],
    ['Yes', 'Yes'],
    ['No', 'No'],
    ['1', 'Yes'],
    ['0', 'No'],
    [null, null],
    [undefined, undefined],
  ] as const)('should convert %j to %j', (answer, expected) => {
    expect(convertBinaryToYesNo(answer)).toBe(expected);
  });
});

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
