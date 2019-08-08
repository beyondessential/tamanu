import React, { useState, useCallback, useEffect } from 'react';
import { Table } from './Table';
import { connectApi } from '../../api';

function DataFetchingTableComponent({ columns, fetchData }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // TODO fix magic number
  const [sorting, setSorting] = useState({ order: 'asc', orderBy: null });
  const defaultFetchState = { data: null, count: 0, errorMessage: null, isLoading: true };
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
    let isCanceled = false;
    const asyncFetch = async () => {
      try {
        setFetchState({ ...defaultFetchState, isLoading: true });
        const { data, count } = await fetchData({ page, rowsPerPage, sorting });
        if (isCanceled) return;
        setFetchState({ data, count, isLoading: false });
      } catch (error) {
        if (isCanceled) return;
        setFetchState({ ...defaultFetchState, errorMessage: error.message, isLoading: false });
      }
    };
    asyncFetch();
    const cleanupOnStateChange = () => {
      isCanceled = true; // throw away the stale fetch when state changes
    };
    return cleanupOnStateChange;
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
    />
  );
}

function mapApiToProps(api, { endpoint }) {
  return {
    fetchData: queryParameters => api.getRecords(endpoint, queryParameters),
  };
}

export const DataFetchingTable = connectApi(mapApiToProps)(DataFetchingTableComponent);
