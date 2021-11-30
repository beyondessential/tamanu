import React, { useState, useCallback, useEffect, memo } from 'react';
import { Table } from './Table';
import { connectApi } from '../../api';
import { useFetchingTableRefresh } from '../../contexts/DataFetchingTable';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_SORT = { order: 'asc', orderBy: undefined };

const DumbDataFetchingTable = memo(
  ({
    columns,
    fetchData,
    noDataMessage,
    fetchOptions,
    onRowClick,
    transformRow,
    initialSort = DEFAULT_SORT,
    customSort,
    className,
    exportName = 'TamanuExport',
    refreshCount = 0,
    forcedRefreshCount = 0,
  }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [sorting, setSorting] = useState(initialSort);
    const defaultFetchState = { data: [], count: 0, errorMessage: '', isLoading: true };
    const [fetchState, setFetchState] = useState(defaultFetchState);

    const handleChangeOrderBy = useCallback(
      columnKey => {
        const { order, orderBy } = sorting;
        const isDesc = orderBy === columnKey && order === 'desc';
        const newSorting = { order: isDesc ? 'asc' : 'desc', orderBy: columnKey };
        setSorting(newSorting);
      },
      [sorting],
    );

    useEffect(() => {
      let updateFetchState = newFetchState => setFetchState({ ...fetchState, ...newFetchState });

      updateFetchState({ isLoading: true });
      (async () => {
        try {
          const { data, count } = await fetchData({ page, rowsPerPage, ...sorting });
          const transformedData = transformRow ? data.map(transformRow) : data;
          updateFetchState({
            ...defaultFetchState,
            data: transformedData,
            count,
            isLoading: false,
          });
        } catch (error) {
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();

      return () => {
        updateFetchState = () => {}; // discard the fetch state update if this request is stale
      };
    }, [page, rowsPerPage, sorting, fetchOptions, refreshCount, forcedRefreshCount]);

    useEffect(() => setPage(0), [fetchOptions]);

    console.log('re-rendered table');
    const { data, count, isLoading, errorMessage } = fetchState;
    const { order, orderBy } = sorting;
    return (
      <Table
        isLoading={isLoading}
        columns={columns}
        data={data}
        errorMessage={errorMessage}
        rowsPerPage={rowsPerPage}
        page={page}
        count={count}
        onChangePage={setPage}
        onChangeRowsPerPage={setRowsPerPage}
        onChangeOrderBy={handleChangeOrderBy}
        order={order}
        orderBy={orderBy}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        noDataMessage={noDataMessage}
        onRowClick={onRowClick}
        className={className}
        exportName={exportName}
        customSort={customSort}
      />
    );
  },
);

function mapApiToProps(api, dispatch, { endpoint, fetchOptions }) {
  return {
    fetchData: queryParameters => api.get(endpoint, { ...fetchOptions, ...queryParameters }),
  };
}

const ConnectedDataFetchingTable = connectApi(mapApiToProps)(DumbDataFetchingTable);

// Special table HOC used to read from a context value, allowing a refresh callback
export const DataFetchingTable = ({ tableContextId, ...props }) => {
  const { tables } = useFetchingTableRefresh();
  const forcedRefreshCount = tables[tableContextId];
  return <ConnectedDataFetchingTable {...props} forcedRefreshCount={forcedRefreshCount} />;
};
