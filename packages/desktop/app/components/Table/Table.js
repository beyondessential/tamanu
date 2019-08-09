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

const RowContainer = React.memo(({ children, onClick }) => (
  <TableRow onClick={onClick} style={{ marginTop: '1rem' }}>
    {children}
  </TableRow>
));

const Row = React.memo(({ columns, data, onClick = () => null }) => {
  const cells = columns.map(({ key, accessor, CellComponent, numeric }) => {
    const value = accessor ? accessor(data) : data[key];
    return (
      <TableCell key={key} align={numeric ? 'right' : 'left'}>
        {CellComponent ? <CellComponent value={value} /> : value}
      </TableCell>
    );
  });
  return <RowContainer onClick={() => onClick(data)}>{cells}</RowContainer>;
});

const ErrorRow = React.memo(({ colSpan, message }) => (
  <RowContainer>
    <TableCell colSpan={colSpan} align="center">
      {message}
    </TableCell>
  </RowContainer>
));

export class Table extends React.Component {
  static propTypes = {
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
    onRowClick: PropTypes.func,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  };

  static defaultProps = {
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
    onRowClick: () => null,
    rowsPerPageOptions: [],
  };

  getErrorMessage() {
    const { isLoading, errorMessage, data, noDataMessage } = this.props;
    if (isLoading) return 'Loading...';
    if (errorMessage) return errorMessage;
    if (data.length === 0) return noDataMessage;
    return null;
  }

  handleChangePage = (event, newPage) => {
    const { onChangePage } = this.props;
    if (onChangePage) onChangePage(newPage);
  };

  handleChangeRowsPerPage = event => {
    const { onChangeRowsPerPage } = this.props;
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onChangeRowsPerPage) onChangeRowsPerPage(newRowsPerPage);
  };

  renderHeaders() {
    const { columns, order, orderBy, onChangeOrderBy } = this.props;
    const getContent = (key, sortable, title) =>
      sortable ? (
        <TableSortLabel
          active={orderBy === key}
          direction={order}
          onClick={() => onChangeOrderBy(key)}
        >
          {title}
        </TableSortLabel>
      ) : (
        title
      );

    return columns.map(({ key, title, numeric, sortable = true }) => (
      <TableCell key={key} align={numeric ? 'right' : 'left'}>
        {getContent(key, sortable, title)}
      </TableCell>
    ));
  }

  renderBodyContent() {
    const { data, columns, onRowClick } = this.props;
    const error = this.getErrorMessage();
    if (error) {
      return <ErrorRow message={error} colSpan={columns.length} />;
    }
    return data.map(rowData => (
      <Row data={rowData} key={rowData.sort} columns={columns} onClick={onRowClick} />
    ));
  }

  renderPaginator() {
    const { columns, page, count, rowsPerPage, rowsPerPageOptions } = this.props;
    return (
      <TableRow>
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          colSpan={columns.length}
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </TableRow>
    );
  }

  render() {
    const { page } = this.props;
    return (
      <MaterialTable>
        <TableHead>
          <TableRow>{this.renderHeaders()}</TableRow>
        </TableHead>
        <TableBody>{this.renderBodyContent()}</TableBody>
        {page !== null && <TableFooter>{this.renderPaginator()}</TableFooter>}
      </MaterialTable>
    );
  }
}
