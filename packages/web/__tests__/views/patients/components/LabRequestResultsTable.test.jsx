/*
 * Tests for the result column of LabRequestResultsTable.
 *
 * A result is checked against its reference range by what the result actually is, not by the
 * test type's configured result type: reference data routinely types numeric analytes as
 * FreeText, and those results went unflagged here while the patient's results table flagged
 * them. Option results stay qualitative and unflagged, and a result that is only partly
 * numeric ("12 colonies") must be shown as entered rather than truncated to its leading number.
 */

import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LAB_TEST_RESULT_TYPES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../../helpers';

const testRows = vi.hoisted(() => ({ current: [] }));

// The real table fetches its own rows; stub it so the result column's accessor runs over rows
// supplied by the test.
vi.mock('../../../../app/components/Table/DataFetchingTable', async importOriginal => ({
  ...(await importOriginal()),
  DataFetchingTable: ({ columns }) => {
    const resultColumn = columns.find(column => column.key === 'result');
    return (
      <div>
        {testRows.current.map((row, index) => (
          <div key={row.id} data-testid={`result-cell-${index}`}>
            {resultColumn.accessor(row)}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('../../../../app/views/patients/LabTestResultModal', () => ({
  LabTestResultModal: () => null,
}));

import { LabRequestResultsTable } from '../../../../app/views/patients/components/LabRequestResultsTable';

// AST as the supplied reference data types it: a numeric analyte recorded as free text.
const freeTextTestType = {
  id: 'labTestType-AST',
  name: 'Aspartate Aminotransferase, AST',
  unit: 'U/L',
  maleMin: 5,
  maleMax: 35,
  femaleMin: 13,
  femaleMax: 43,
  resultType: LAB_TEST_RESULT_TYPES.FREE_TEXT,
};

const renderResults = rows => {
  testRows.current = rows;
  return renderElementWithTranslatedText(
    <LabRequestResultsTable
      labRequest={{ id: 'lab-request-1', displayId: 'LR1' }}
      patient={{ sex: 'male' }}
    />,
  );
};

const resultCell = (index = 0) => screen.getByTestId(`result-cell-${index}`);

describe('LabRequestResultsTable result column', () => {
  it('flags an out-of-range result on a test type recorded as free text', async () => {
    renderResults([{ id: 'lab-test-1', labTestType: freeTextTestType, result: '120' }]);

    expect(resultCell().textContent).toBe('120');

    fireEvent.mouseOver(screen.getByTestId('cellcontainer-4zzh'));
    const tooltip = await screen.findByText(/Outside normal range/);
    expect(tooltip.textContent).toContain('>35U/L');
  });

  it('shows a result that is only partly numeric as entered', () => {
    renderResults([
      {
        id: 'lab-test-2',
        labTestType: { ...freeTextTestType, maleMin: 0, maleMax: 5 },
        result: '12 colonies',
      },
    ]);

    expect(resultCell().textContent).toBe('12 colonies');
  });

  it('does not range-check an option result', () => {
    renderResults([
      {
        id: 'lab-test-3',
        labTestType: {
          ...freeTextTestType,
          options: 'Positive, Negative',
          resultType: LAB_TEST_RESULT_TYPES.SELECT,
        },
        result: 'Positive',
      },
    ]);

    expect(resultCell().textContent).toBe('Positive');
    expect(screen.queryByTestId('cellcontainer-4zzh')).toBeNull();
  });
});
