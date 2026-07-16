import { describe, expect, test } from 'vitest';

import { formatValue } from '../../app/components/FormattedTableCell';

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
});
