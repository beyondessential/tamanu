import { useMemo, useState } from 'react';
import { useTableSorting } from './useTableSorting';

// Sorts and paginates a plain in-memory array for tables backed by local/mock data rather
// than a server endpoint (see DataFetchingTable for the server-driven equivalent, where the
// server itself handles sorting and slicing).
export const useClientSideTableData = (
  data,
  { initialSortKey, initialSortDirection, defaultRowsPerPage = 25 },
) => {
  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey,
    initialSortDirection,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

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
    onChangePage: setPage,
    onChangeRowsPerPage: setRowsPerPage,
  };
};
