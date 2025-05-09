import { useState, useEffect } from 'react';

const defaultRowsPerPage = 25;

export const useTablePaginator = ({ resetPage }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
  };

  useEffect(() => {
    setPage(0);
  }, [resetPage]);

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  return { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage };
};
