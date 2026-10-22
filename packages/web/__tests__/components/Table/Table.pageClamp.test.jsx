import * as React from 'react';
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

const pagedTable = props => (
  <Table columns={columns} data={[]} rowsPerPage={10} allowExport={false} {...props} />
);

describe('Table page clamping', () => {
  it('moves to the last page when the count drops below the current page', () => {
    const onChangePage = vi.fn();
    const { rerender } = renderElementWithTranslatedText(
      pagedTable({ page: 1, count: 11, onChangePage }),
    );
    expect(onChangePage).not.toHaveBeenCalled();

    rerender(pagedTable({ page: 1, count: 10, onChangePage }));

    expect(onChangePage).toHaveBeenCalledWith(0);
  });

  it('moves to the first page when the list empties', () => {
    const onChangePage = vi.fn();
    const { rerender } = renderElementWithTranslatedText(
      pagedTable({ page: 2, count: 21, onChangePage }),
    );

    rerender(pagedTable({ page: 2, count: 0, onChangePage }));

    expect(onChangePage).toHaveBeenCalledWith(0);
  });

  it('leaves the page alone when it is still in range', () => {
    const onChangePage = vi.fn();
    const { rerender } = renderElementWithTranslatedText(
      pagedTable({ page: 1, count: 12, onChangePage }),
    );

    rerender(pagedTable({ page: 1, count: 11, onChangePage }));

    expect(onChangePage).not.toHaveBeenCalled();
  });
});
