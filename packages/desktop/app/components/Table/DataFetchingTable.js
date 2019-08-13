import React, { useState, useCallback, useEffect } from 'react';
import { Table } from './Table';
import { connectApi } from '../../api';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function DataFetchingTableComponent({ columns, fetchData }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [sorting, setSorting] = useState({ order: 'asc', orderBy: undefined });
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
        console.log(data, count);
        updateFetchState({ ...defaultFetchState, data, count, isLoading: false });
      } catch (error) {
        updateFetchState({ errorMessage: error.message, isLoading: false });
      }
    })();

    return () => {
      updateFetchState = () => {}; // discard the fetch state update if this request is stale
    };
  }, [page, rowsPerPage, sorting]);

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
      noDataMessage="No admitted patients match your search"
    />
  );
}

function mapApiToProps(api, { endpoint, fetchOptions }) {
  return {
    fetchData: queryParameters => api.get(endpoint, { ...queryParameters, ...fetchOptions }),
  };
}

export const DataFetchingTable = connectApi(mapApiToProps)(DataFetchingTableComponent);
