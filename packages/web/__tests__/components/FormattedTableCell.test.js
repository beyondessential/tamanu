import { describe, expect, test } from 'vitest';

import { formatValue, getValidationState } from '../../app/components/FormattedTableCell';

describe('formatValue', () => {
  test.each([
    {
      title: 'preserves free-text that starts with a letter',
      value: 'mild',
      config: {},
      expected: 'mild',
    },
    {
      title: 'formats a whole numeric string with default rounding',
      value: '36.6',
      config: {},
      expected: '37',
    },
    {
      title: 'formats a number with configured rounding',
      value: '36.64',
      config: { rounding: 1 },
      expected: '36.6',
    },
    {
      title: 'appends a short unit to numeric values',
      value: '36.6',
      config: { rounding: 1, unit: 'C' },
      expected: '36.6C',
    },
    {
      title: 'does not append units longer than 2 characters',
      value: '98.6',
      config: { rounding: 1, unit: 'bpm' },
      expected: '98.6',
    },
    {
      title: 'returns an em dash for empty values',
      value: '',
      config: {},
      expected: '—',
    },
    {
      title: 'returns an em dash for null',
      value: null,
      config: {},
      expected: '—',
    },
    {
      title: 'formats numeric zero',
      value: 0,
      config: {},
      expected: '0',
    },
    {
      title: 'skips rounding when rounding is null',
      value: '36.64',
      config: { rounding: null },
      expected: '36.64',
    },
  ])('$title', ({ value, config, expected }) => {
    expect(formatValue(value, config)).toBe(expected);
  });

  test('displays a detection-limit result verbatim', () => {
    expect(formatValue('< 0.3', { unit: 'mg/L' })).toBe('< 0.3');
  });
});

describe('getValidationState', () => {
  test('flags "< n" out of range when n reaches the lower bound', () => {
    expect(
      getValidationState('< 0.3', { unit: 'mg/L' }, { normalRange: { min: 0.3, max: 5 } }).severity,
    ).toBe('alert');
  });

  test('does not flag "< n" when n sits inside the range', () => {
    expect(
      getValidationState('< 0.3', {}, { normalRange: { min: 0.1, max: 2 } }).severity,
    ).toBe('info');
  });

  test('flags "> n" out of range when n reaches the upper bound', () => {
    expect(getValidationState('> 100', {}, { normalRange: { min: 1, max: 50 } }).severity).toBe(
      'alert',
    );
  });

  test('does not flag a comparator result against a qualitative text range', () => {
    expect(getValidationState('< 0.3', {}, { rangeText: 'Negative' }).severity).toBe('info');
  });

  test('still flags a plain numeric result below the range', () => {
    expect(getValidationState('0.05', {}, { normalRange: { min: 0.3, max: 5 } }).severity).toBe(
      'alert',
    );
  });

  test('leaves an in-range plain numeric result informational', () => {
    expect(getValidationState('2', {}, { normalRange: { min: 0.3, max: 5 } }).severity).toBe('info');
  });
});
