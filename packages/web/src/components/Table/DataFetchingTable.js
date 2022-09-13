import React, { useState, useCallback, useEffect, memo } from 'react';
import { Table } from './Table';
import { useApi } from '../../api';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_SORT = { order: 'asc', orderBy: undefined };
const DEFAULT_FETCH_STATE = { data: [], count: 0, errorMessage: '', isLoading: true };

export const DataFetchingTable = memo(
  ({
    columns,
    noDataMessage,
    fetchOptions,
    endpoint,
    onRowClick,
    transformRow,
    initialSort = DEFAULT_SORT,
    customSort,
    className,
    exportName = 'TamanuExport',
    refreshCount = 0,
    rowStyle,
    allowExport = true,
    onDataFetched,
    elevated,
  }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [sorting, setSorting] = useState(initialSort);
    const [fetchState, setFetchState] = useState(DEFAULT_FETCH_STATE);
    const [forcedRefreshCount, setForcedRefreshCount] = useState(0);
    const api = useApi();

    // This callback will be passed to table cell accessors so they can force a table refresh
    const refreshTable = useCallback(() => {
      setForcedRefreshCount(prevCount => prevCount + 1);
    }, []);

    const handleChangeOrderBy = useCallback(
      columnKey => {
        const { order, orderBy } = sorting;
        const isDesc = orderBy === columnKey && order === 'desc';
        const newSorting = { order: isDesc ? 'asc' : 'desc', orderBy: columnKey };
        setSorting(newSorting);
      },
      [sorting],
    );

    const updateFetchState = useCallback(newFetchState => {
      setFetchState(oldFetchState => ({ ...oldFetchState, ...newFetchState }));
    }, []);

    useEffect(() => {
      updateFetchState({ isLoading: true });
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          const { data, count } = await api.get(endpoint, {
            page,
            rowsPerPage,
            ...sorting,
            ...fetchOptions,
          });
          const transformedData = transformRow ? data.map(transformRow) : data;
          updateFetchState({
            ...DEFAULT_FETCH_STATE,
            data: transformedData,
            count,
            isLoading: false,
          });
          if (onDataFetched) {
            onDataFetched({
              data: transformedData,
              count,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();
    }, [
      api,
      endpoint,
      page,
      rowsPerPage,
      sorting,
      fetchOptions,
      refreshCount,
      forcedRefreshCount,
      transformRow,
      onDataFetched,
      updateFetchState,
    ]);

    useEffect(() => setPage(0), [fetchOptions]);

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
        refreshTable={refreshTable}
        rowStyle={rowStyle}
        allowExport={allowExport}
        elevated={elevated}
      />
    );
  },
);
