/*
 * Tests for PatientLabTestsTable:
 *  - the "Normal range" column accessor (regression: sex "other" and a zero minimum), and
 *  - how picked panels and individual tests are grouped into rows and heading boundaries.
 *
 * We stub the heavy Table component to capture the props the table is given, so we can exercise
 * the column accessors and the grouping/heading logic in isolation.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: () => ({
      formatShort: () => '',
      formatTimeWithSeconds: () => '',
    }),
  };
});

vi.mock('../../../app/views/patients/LabTestResultModal', () => ({
  LabTestResultModal: () => null,
}));

let capturedTableProps;

vi.mock('../../../app/components/Table', () => ({
  Table: props => {
    capturedTableProps = props;
    const { columns, data } = props;
    const normalRangeColumn = columns.find(column => column.key === 'normalRange');
    expect(normalRangeColumn).toBeDefined();
    return (
      <div>
        {data.map((row, index) => (
          <div key={row.rowKey ?? row.testType} data-testid={`normal-range-cell-${index}`}>
            {normalRangeColumn.accessor(row)}
          </div>
        ))}
      </div>
    );
  },
}));

import { PatientLabTestsTable } from '../../../app/views/patients/PatientLabTestsTable';

const makeTest = (id, name) => ({
  testType: name,
  testTypeId: id,
  testCategory: 'Category A',
  unit: 'mg',
  rangeText: null,
  normalRanges: { male: { min: 1, max: 5 } },
  results: {},
});

const renderTable = (patient, labTests, props = {}) =>
  renderElementWithTranslatedText(
    <PatientLabTestsTable
      patient={patient}
      labTests={labTests}
      count={labTests.length}
      isLoading={false}
      searchParameters={{}}
      {...props}
    />,
  );

describe('PatientLabTestsTable normal range column', () => {
  it('renders the no-range fallback for a patient with sex "other" instead of throwing', () => {
    const labTests = [
      {
        testType: 'Test A',
        testTypeId: 'test-type-1',
        testCategory: 'Category A',
        unit: 'mg',
        rangeText: null,
        normalRanges: { male: { min: 1, max: 5 }, female: { min: 2, max: 6 } },
        results: {},
      },
    ];

    expect(() => renderTable({ sex: 'other' }, labTests)).not.toThrow();
    expect(screen.getByTestId('normal-range-cell-0').textContent).toBe('—');
  });

  it('renders a normal range with a zero minimum instead of the no-range fallback', () => {
    const labTests = [
      {
        testType: 'Test B',
        testTypeId: 'test-type-2',
        testCategory: 'Category A',
        unit: 'mg',
        rangeText: null,
        normalRanges: { male: { min: 0, max: 5 } },
        results: {},
      },
    ];

    renderTable({ sex: 'male' }, labTests);

    expect(screen.getByTestId('normal-range-cell-0').textContent).toBe('0–5');
  });

  it('renders the no-range fallback when the range has a min but no max', () => {
    const labTests = [
      {
        testType: 'Test C',
        testTypeId: 'test-type-3',
        testCategory: 'Category A',
        unit: 'mg',
        rangeText: null,
        normalRanges: { male: { min: 5, max: null } },
        results: {},
      },
    ];

    renderTable({ sex: 'male' }, labTests);

    expect(screen.getByTestId('normal-range-cell-0').textContent).toBe('—');
  });
});

describe('PatientLabTestsTable grouping', () => {
  const labTests = [
    makeTest('t1', 'Alpha'),
    makeTest('t2', 'Bravo'),
    makeTest('t3', 'Charlie'),
    makeTest('t4', 'Delta'),
  ];
  const groups = [
    { id: 'p1', name: 'Full blood count', testTypeIds: ['t1', 't2'] },
    { id: 'p2', name: 'Lipid profile', testTypeIds: ['t3'] },
  ];

  it('orders panels (members in configured order) before individually picked tests, repeating a shared test', () => {
    renderTable({ sex: 'male' }, labTests, {
      groups,
      searchParameters: { panelIds: ['p1', 'p2'], testIds: ['t4', 't1'] },
    });

    // Panels A–Z with members in configured order, then individual tests A–Z. t1 appears under its
    // panel and again under "Individual tests" because it was also picked on its own.
    expect(capturedTableProps.data.map(row => row.rowKey)).toEqual([
      'p1:t1',
      'p1:t2',
      'p2:t3',
      '__individual__:t1',
      '__individual__:t4',
    ]);
  });

  it('shows a heading at each group boundary and none within a group', () => {
    renderTable({ sex: 'male' }, labTests, {
      groups,
      searchParameters: { panelIds: ['p1', 'p2'], testIds: ['t4', 't1'] },
    });
    const { data, getRowGroupHeader } = capturedTableProps;

    expect(getRowGroupHeader(data[0], undefined).props.fallback).toBe('Full blood count');
    expect(getRowGroupHeader(data[1], data[0])).toBeNull();
    expect(getRowGroupHeader(data[2], data[1]).props.fallback).toBe('Lipid profile');
    expect(getRowGroupHeader(data[3], data[2]).props.fallback).toBe('Individual tests');
    expect(getRowGroupHeader(data[4], data[3])).toBeNull();
  });

  it('shows an "Individual tests" heading even when only individual tests are picked', () => {
    renderTable({ sex: 'male' }, labTests, {
      groups: [],
      searchParameters: { panelIds: [], testIds: ['t2'] },
    });
    const { data, getRowGroupHeader } = capturedTableProps;

    expect(data.map(row => row.rowKey)).toEqual(['__individual__:t2']);
    expect(getRowGroupHeader(data[0], undefined).props.fallback).toBe('Individual tests');
  });

  it('lists a picked category flat, with no group headings', () => {
    renderTable({ sex: 'male' }, labTests, {
      groups: [],
      searchParameters: { categoryId: 'category-1' },
    });

    expect(capturedTableProps.getRowGroupHeader).toBeUndefined();
    expect(capturedTableProps.data.map(row => row.rowKey)).toEqual(['t1', 't2', 't3', 't4']);
  });
});
