/*
 * Tests for useSelectableColumn's initial-selection behaviour.
 *
 * The hook can pre-select rows on load (selectAllOnInit, or a getIsRowInitiallySelected subset).
 * Rows that arrive after the first render — e.g. a prescription added while the Print modal's table
 * is still mounted — must get the same initial treatment, while rows the user has already toggled
 * must never be revisited.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useSelectableColumn } from '../../../app/components/Table/useSelectableColumn';

const selectedIds = result => result.current.selectedRows.map(row => row.id);

// Toggle a row's checkbox the way the rendered cell would, without mounting the DOM.
const toggleRow = (result, rowIndex, checked) => {
  const cell = result.current.selectableColumn.accessor({ rowIndex });
  act(() => cell.props.onChange({ target: { checked } }));
};

describe('useSelectableColumn initial selection', () => {
  it('selects every row on init with selectAllOnInit', () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    const { result } = renderHook(() => useSelectableColumn(rows, { selectAllOnInit: true }));

    expect(selectedIds(result)).toEqual(['a', 'b']);
  });

  it('selects a row that appears after the first render', () => {
    const { result, rerender } = renderHook(({ rows }) =>
      useSelectableColumn(rows, { selectAllOnInit: true }),
    { initialProps: { rows: [{ id: 'a' }, { id: 'b' }] } });

    expect(selectedIds(result)).toEqual(['a', 'b']);

    // A new prescription is added while the table is mounted.
    rerender({ rows: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

    expect(selectedIds(result)).toEqual(['a', 'b', 'c']);
  });

  it('does not re-select a row the user has deselected when new rows arrive', () => {
    const { result, rerender } = renderHook(({ rows }) =>
      useSelectableColumn(rows, { selectAllOnInit: true }),
    { initialProps: { rows: [{ id: 'a' }, { id: 'b' }] } });

    toggleRow(result, 1, false); // user unticks 'b'
    expect(selectedIds(result)).toEqual(['a']);

    rerender({ rows: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

    // 'c' is selected, but the user's deselection of 'b' is preserved.
    expect(selectedIds(result)).toEqual(['a', 'c']);
  });

  it('only initially selects rows matching getIsRowInitiallySelected, including later arrivals', () => {
    const getIsRowInitiallySelected = row => Boolean(row.sampled);
    const { result, rerender } = renderHook(({ rows }) =>
      useSelectableColumn(rows, { getIsRowInitiallySelected }),
    { initialProps: { rows: [{ id: 'a', sampled: true }, { id: 'b', sampled: false }] } });

    expect(selectedIds(result)).toEqual(['a']);

    rerender({
      rows: [
        { id: 'a', sampled: true },
        { id: 'b', sampled: false },
        { id: 'c', sampled: true },
        { id: 'd', sampled: false },
      ],
    });

    // Only the newly-arrived sampled row is added; the unsampled ones stay unselected.
    expect(selectedIds(result)).toEqual(['a', 'c']);
  });

  it('leaves rows unselected when no initial-selection rule is given', () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    const { result } = renderHook(() => useSelectableColumn(rows));

    expect(selectedIds(result)).toEqual([]);
  });
});
