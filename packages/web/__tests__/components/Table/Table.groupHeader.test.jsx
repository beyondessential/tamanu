/*
 * Covers the shared Table's opt-in `getRowGroupHeader` prop: it renders a full-width
 * (colSpan) header row before the first row of each group, and — crucially for paginated
 * grouped tables — nothing changes for tables that don't pass it.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';
import { Table } from '../../../app/components/Table/Table';

vi.mock('../../../app/contexts/Settings', async () => {
  const actual = await vi.importActual('../../../app/contexts/Settings');
  return {
    ...actual,
    useSettings: () => ({ getSetting: () => undefined }),
  };
});

const columns = [
  { key: 'name', title: 'Name', sortable: false },
  { key: 'value', title: 'Value', sortable: false },
];

const data = [
  { id: '1', group: 'A', name: 'a1', value: 'x' },
  { id: '2', group: 'A', name: 'a2', value: 'y' },
  { id: '3', group: 'B', name: 'b1', value: 'z' },
];

const getRowGroupHeader = (row, previousRow) =>
  !previousRow || previousRow.group !== row.group ? `Group ${row.group}` : null;

describe('Table getRowGroupHeader', () => {
  it('renders a full-width group header before the first row of each group', () => {
    renderElementWithTranslatedText(
      <Table columns={columns} data={data} getRowGroupHeader={getRowGroupHeader} />,
    );

    const headers = screen.getAllByTestId('table-group-header-row');
    expect(headers).toHaveLength(2); // one per group (A, B), not per row
    // getByText throws if absent, so these assert the labels render
    expect(screen.getByText('Group A')).toBeTruthy();
    expect(screen.getByText('Group B')).toBeTruthy();

    // the header cell spans every column
    expect(headers[0].querySelector('td')?.getAttribute('colspan')).toBe(String(columns.length));
  });

  it('renders no group headers when getRowGroupHeader is not provided', () => {
    renderElementWithTranslatedText(<Table columns={columns} data={data} />);
    expect(screen.queryByTestId('table-group-header-row')).toBeNull();
  });
});
