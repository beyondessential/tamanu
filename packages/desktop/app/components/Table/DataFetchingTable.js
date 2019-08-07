import React, { useState, useCallback } from 'react';
import { Table } from './Table';
import { connectApi } from '../../api';

function DataFetchingTableComponent({
  columns,
  onChangeRowsPerPage,
  onChangeSorting,
  onChangePage,
  errorMessage,
  data,
  fetchId,
  count,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // TODO fix magic number
  const [sorting, setSorting] = useState({ order: 'asc', orderBy: null });

  const handleChangePage = useCallback(
    newPage => {
      setPage(newPage);
      onChangePage(newPage);
    },
    [onChangePage],
  );

  const handleChangeOrderBy = useCallback(
    columnKey => {
      const { order, orderBy } = sorting;
      const isDesc = orderBy === columnKey && order === 'desc';
      const newSorting = { order: isDesc ? 'asc' : 'desc', orderBy: columnKey };
      setSorting(newSorting);
      onChangeSorting(newSorting);
    },
    [sorting, onChangeSorting],
  );

  const handleChangeRowsPerPage = useCallback(
    newRowsPerPage => {
      setRowsPerPage(newRowsPerPage);
      onChangeRowsPerPage(newRowsPerPage);
    },
    [onChangeRowsPerPage],
  );

  return (
    <Table
      isLoading={!!fetchId}
      columns={columns}
      data={data}
      errorMessage={errorMessage}
      rowsPerPage={rowsPerPage}
      page={page}
      count={count}
      onChangePage={handleChangePage}
      onChangeRowsPerPage={handleChangeRowsPerPage}
      onChangeOrderBy={handleChangeOrderBy}
    />
  );
}

function mapApiToProps(api) {
  return {
    onChangeRowsPerPage: () => api.todo('change rows per page'),
    onChangeSorting: () => api.todo('change sorting'),
    onChangePage: () => api.todo('change page'),
  };
}

export const DataFetchingTable = connectApi(mapApiToProps)(DataFetchingTableComponent);
