import React, { useState, useCallback, useEffect, memo } from 'react';
import { Table } from './Table';
import { useApi } from '../../api';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_SORT = { order: 'asc', orderBy: undefined };
const DEFAULT_FETCH_STATE = {
  data: [],
  count: 0,
  errorMessage: '',
  isLoading: true,
  isLoadingMore: false,
};

export const DataFetchingTable = memo(
  ({
    fetchOptions,
    endpoint,
    transformRow,
    initialSort = DEFAULT_SORT,
    refreshCount = 0,
    onDataFetched,
    disablePagination = false,
    lazyLoading = false,
    ...props
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

    const fetchOptionsString = JSON.stringify(fetchOptions);

    useEffect(() => {
      if (fetchState?.data?.length > 0 && lazyLoading) {
        updateFetchState({ isLoadingMore: true });
      } else {
        updateFetchState({ isLoading: true });
      }
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          const { data, count } = await api.get(
            endpoint,
            {
              page,
              ...(!disablePagination ? { rowsPerPage } : {}),
              ...sorting,
              ...fetchOptions,
            },
            {
              showUnknownErrorToast: false,
            },
          );
          const transformedData = transformRow ? data.map(transformRow) : data;
          updateFetchState({
            ...DEFAULT_FETCH_STATE,
            data: lazyLoading
              ? [...(fetchState?.data || []), ...(transformedData || [])]
              : transformedData,
            count,
            isLoading: false,
            isLoadingMore: false,
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
          updateFetchState({ errorMessage: error.message, isLoading: false, isLoadingMore: false });
        }
      })();
      // Needed to compare fetchOptions as a string instead of an object
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      api,
      endpoint,
      lazyLoading,
      page,
      rowsPerPage,
      sorting,
      fetchOptionsString,
      refreshCount,
      forcedRefreshCount,
      transformRow,
      onDataFetched,
      updateFetchState,
      disablePagination,
    ]);

    useEffect(() => setPage(0), [fetchOptions]);

    const { data, count, isLoading, isLoadingMore, errorMessage } = fetchState;
    const { order, orderBy } = sorting;
    return (
      <Table
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        data={data}
        errorMessage={errorMessage}
        rowsPerPage={rowsPerPage}
        page={disablePagination ? null : page}
        count={count}
        onChangePage={setPage}
        onChangeRowsPerPage={setRowsPerPage}
        onChangeOrderBy={handleChangeOrderBy}
        order={order}
        orderBy={orderBy}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        refreshTable={refreshTable}
        lazyLoading={lazyLoading}
        {...props}
      />
    );
  },
);
