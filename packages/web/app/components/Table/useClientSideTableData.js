import { useMemo, useState } from 'react';
import { useTableSorting } from './useTableSorting';
import { usePageSizePreference } from './usePageSizePreference';

// Sorts and paginates a plain in-memory array for tables backed by local/mock data rather
// than a server endpoint (see DataFetchingTable for the server-driven equivalent, where the
// server itself handles sorting and slicing). `defaultRowsPerPage` applies only to a table
// without a `pageSizePreferenceKey` (see usePageSizePreference).
export const useClientSideTableData = (
  data,
  { initialSortKey, initialSortDirection, defaultRowsPerPage = 25, pageSizePreferenceKey },
) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey,
    initialSortDirection,
  });
  const [page, setPage] = useState(0);
  const { rowsPerPage, rowsPerPageOptions, onChangeRowsPerPage, isPageSizeReady } =
    usePageSizePreference({
      preferenceKey: pageSizePreferenceKey,
      defaultRowsPerPage,
    });

  const pageData = useMemo(() => {
    const sorted = customSort([...data]);
    const startIndex = page * rowsPerPage;
    return sorted.slice(startIndex, startIndex + rowsPerPage);
  }, [data, page, rowsPerPage, customSort]);

  const handleChangeOrderBy = sortKey => {
    onChangeOrderBy(sortKey);
    setPage(0);
  };

  return {
    pageData,
    count: data.length,
    orderBy,
    order,
    onChangeOrderBy: handleChangeOrderBy,
    page,
    rowsPerPage,
    rowsPerPageOptions,
    onChangePage: setPage,
    onChangeRowsPerPage,
    isPageSizeReady,
  };
};
