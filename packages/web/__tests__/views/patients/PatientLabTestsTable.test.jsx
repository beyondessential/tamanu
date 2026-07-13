/*
 * Regression test for the "Normal range" column of PatientLabTestsTable.
 *
 * The column accessor read `row.normalRanges[patient?.sex]` directly. The
 * server only ever builds "male"/"female" keys, so a patient with sex
 * "other" produced `undefined`, and accessing `range.min` on it threw a
 * TypeError (rendered as an error cell by the table's per-cell error
 * boundary). Separately, the accessor used a truthiness check on
 * `range.min`, so a legitimate range of `{ min: 0, max: ... }` was treated
 * as absent and rendered the no-range fallback instead of "0–...".
 *
 * We stub the heavy Table component to invoke only the "normalRange"
 * column's accessor, so we can exercise the accessor logic in isolation.
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

vi.mock('../../../app/components/Table', () => ({
  Table: ({ columns, data }) => {
    const normalRangeColumn = columns.find(column => column.key === 'normalRange');
    return (
      <div>
        {data.map((row, index) => (
          <div key={row.testType} data-testid={`normal-range-cell-${index}`}>
            {normalRangeColumn.accessor(row)}
          </div>
        ))}
      </div>
    );
  },
}));

import { PatientLabTestsTable } from '../../../app/views/patients/PatientLabTestsTable';

const renderTable = (patient, labTests) =>
  renderElementWithTranslatedText(
    <PatientLabTestsTable
      patient={patient}
      labTests={labTests}
      count={labTests.length}
      isLoading={false}
      searchParameters={{}}
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
});
