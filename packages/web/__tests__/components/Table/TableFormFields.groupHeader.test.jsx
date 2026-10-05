/*
 * Covers TableFormFields' opt-in `getRowGroupHeader` prop: it renders a full-width (colSpan)
 * header row before the first row of each group, and renders none when the prop is absent.
 * This is what brings the lab results entry modal onto the same grouped layout as the view table.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';
import { TableFormFields } from '../../../app/components/Table/TableFormFields';

const columns = [
  { key: 'name', title: 'Name', accessor: row => row.name },
  { key: 'value', title: 'Value', accessor: row => row.value },
];

const data = [
  { id: '1', group: 'A', name: 'a1', value: 'x' },
  { id: '2', group: 'A', name: 'a2', value: 'y' },
  { id: '3', group: 'B', name: 'b1', value: 'z' },
];

const getRowGroupHeader = (row, previousRow) =>
  !previousRow || previousRow.group !== row.group ? `Group ${row.group}` : null;

describe('TableFormFields getRowGroupHeader', () => {
  it('renders a full-width group header before the first row of each group', () => {
    renderElementWithTranslatedText(
      <TableFormFields columns={columns} data={data} getRowGroupHeader={getRowGroupHeader} />,
    );

    // getByText throws if absent, so these assert the labels render
    expect(screen.getByText('Group A')).toBeTruthy();
    expect(screen.getByText('Group B')).toBeTruthy();

    // one header per group, not per row: shown above row 0 (group A) and row 2 (group B),
    // but not above row 1 which continues group A
    const headerA = screen.getByTestId('tableformfields-group-header-row-0');
    expect(screen.getByTestId('tableformfields-group-header-row-2')).toBeTruthy();
    expect(screen.queryByTestId('tableformfields-group-header-row-1')).toBeNull();

    // the header cell spans every column
    expect(headerA.querySelector('td')?.getAttribute('colspan')).toBe(String(columns.length));
  });

  it('renders no group headers when getRowGroupHeader is not provided', () => {
    renderElementWithTranslatedText(<TableFormFields columns={columns} data={data} />);
    expect(screen.queryByTestId('tableformfields-group-header-row-0')).toBeNull();
  });
});
