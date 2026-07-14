/*
 * Regression test for ProgramRegistryTable's related conditions cell.
 *
 * The conditions cell must sort condition names ascending (A-Z), matching the
 * ascending sort used for the same data on the patient program registry
 * detail page. A swapped localeCompare comparator would sort descending
 * instead, so in a line-clamped cell the wrong (i.e. last-alphabetically)
 * conditions end up truncated from view.
 */

import { describe, it, expect } from 'vitest';

import { ConditionsCell } from '../../../app/views/programRegistry/ProgramRegistryTable';

describe('ConditionsCell', () => {
  it('sorts related condition names ascending (A-Z)', () => {
    const conditions = [
      { id: 'condition-zebra', name: 'Zebra condition' },
      { id: 'condition-apple', name: 'Apple condition' },
      { id: 'condition-mango', name: 'Mango condition' },
    ];
    const getTranslation = (_stringId, fallback) => fallback;

    const result = ConditionsCell({ conditions, getTranslation });

    expect(result).toBe('Apple condition, Mango condition, Zebra condition');
  });
});
