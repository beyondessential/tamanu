/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const Row = React.memo(({ children, onClick, data }) => (
  <TableRow onClick={() => onClick(data)} style={{ marginTop: '1rem' }}>
    {children}
  </TableRow>
));

const ErrorRow = React.memo(({ colSpan, message }) => (
  <Row>
    <TableCell colSpan={colSpan} align="center">
      {message}
    </TableCell>
  </Row>
));

const Cell = React.memo(({ value, CellComponent, sortDirection, align }) => (
  <TableCell sortDirection={sortDirection} align={align}>
    {CellComponent ? <CellComponent value={value} /> : value}
  </TableCell>
));

export function Table({
  columns,
  data,
  errorMessage,
  noDataMessage,
  isLoading,
  order,
  orderBy,
  count,
  page,
  rowsPerPage,
  onChangePage,
  onChangeOrderBy,
  onChangeRowsPerPage,
  onRowClick,
}) {
  function getErrorMessage() {
    if (isLoading) return 'Loading...';
    if (errorMessage) return errorMessage;
    if (data.length === 0) return noDataMessage;
    return null;
  }

  function handleChangePage(event, newPage) {
    if (onChangePage) onChangePage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    const { value: newRowsPerPage } = parseInt(event.target, 10);
    if (onChangeRowsPerPage) onChangeRowsPerPage(newRowsPerPage);
  }

  function renderHeaders() {
    return columns.map(({ key, title, numeric, sortable = true }) => {
      if (sortable) {
        return (
          <TableCell
            key={key}
            align={numeric ? 'right' : 'left'}
            sortDirection={orderBy === key ? order : false}
          >
            <TableSortLabel
              active={orderBy === key}
              direction={order}
              onClick={() => onChangeOrderBy(key)}
            >
              {title}
            </TableSortLabel>
          </TableCell>
        );
      }
      return (
        <TableCell key={key} align={numeric ? 'right' : 'left'}>
          {title}
        </TableCell>
      );
    });
  }

  function renderRow(rowData) {
    const cells = columns.map(({ key, accessor, CellComponent, numeric }) => (
      <Cell
        key={key}
        value={accessor ? accessor(rowData) : rowData[key]}
        align={numeric ? 'right' : 'left'}
        sortDirection={orderBy === key ? order : false}
        CellComponent={CellComponent}
      />
    ));
    return <Row onClick={() => onRowClick(rowData)}>{cells}</Row>;
  }

  function renderBodyContent() {
    const error = getErrorMessage();
    if (error) {
      return <ErrorRow message={error} colSpan={columns.length} />;
    }
    return data.map(renderRow);
  }

  function renderPaginator() {
    return (
      <TableRow>
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          colSpan={columns.length}
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </TableRow>
    );
  }

  return (
    <MaterialTable>
      <TableHead>{renderHeaders()}</TableHead>
      <TableBody>{renderBodyContent()}</TableBody>
      {page !== null && <TableFooter>{renderPaginator()}</TableFooter>}
    </MaterialTable>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      accessor: PropTypes.func,
      sortable: PropTypes.bool,
    }),
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  errorMessage: PropTypes.string,
  noDataMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  count: PropTypes.number,
  onChangePage: PropTypes.func,
  onChangeRowsPerPage: PropTypes.func,
  onChangeOrderBy: PropTypes.func,
  orderBy: PropTypes.string,
  order: PropTypes.string,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
};

Table.defaultProps = {
  errorMessage: '',
  noDataMessage: 'No data found',
  count: 0,
  isLoading: false,
  onChangePage: null,
  onChangeRowsPerPage: null,
  onChangeOrderBy: null,
  orderBy: null,
  order: 'asc',
  page: null,
  rowsPerPage: null,
};
