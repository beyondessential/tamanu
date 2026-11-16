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

const columns = [{ key: 'name', title: 'Name', sortable: false }];

const renderPagedTable = ({ data, count }) =>
  renderElementWithTranslatedText(
    <Table
      columns={columns}
      data={data}
      count={count}
      page={0}
      rowsPerPage={10}
      onChangePage={() => {}}
      allowExport={false}
    />,
  );

describe('Table footer', () => {
  it('shows the pagination footer when the table holds a record', () => {
    renderPagedTable({ data: [{ id: '1', name: 'Ana' }], count: 1 });
    expect(screen.queryByTestId('paginatorwrapper-l9c5')).not.toBeNull();
  });

  it('shows no pagination footer when the table holds no records', () => {
    renderPagedTable({ data: [], count: 0 });
    expect(screen.getByText('No data found')).not.toBeNull();
    expect(screen.queryByTestId('paginatorwrapper-l9c5')).toBeNull();
  });
});
