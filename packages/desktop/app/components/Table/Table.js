/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core/styles';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const StyledTableRow = styled(TableRow)`
  margin-top: 1rem;

  ${p =>
    p.onClick
      ? `
  cursor: pointer;
  &:hover {
    background: rgba(255,255,255,0.6);
  }
  `
      : ''}
`;

const StyledTableContainer = styled.div`
  margin: 1rem;
`;

const RowContainer = React.memo(({ children, onClick }) => (
  <StyledTableRow onClick={onClick} style={{ marginTop: '1rem' }}>
    {children}
  </StyledTableRow>
));

const Row = React.memo(({ columns, data, onClick }) => {
  const cells = columns.map(({ key, accessor, CellComponent, numeric }) => {
    const value = accessor ? React.createElement(accessor, data) : data[key];
    return (
      <TableCell key={key} align={numeric ? 'right' : 'left'}>
        {CellComponent ? <CellComponent value={value} /> : value}
      </TableCell>
    );
  });
  return <RowContainer onClick={onClick && (() => onClick(data))}>{cells}</RowContainer>;
});

const ErrorSpan = styled.span`
  color: #ff0000;
`;

const ErrorRow = React.memo(({ colSpan, children }) => (
  <RowContainer>
    <TableCell colSpan={colSpan} align="center">
      {children}
    </TableCell>
  </RowContainer>
));

const tableStyles = () => ({
  root: {
    border: '1px solid #DEDEDE',
    borderRadius: '3px 3px 0 0',
    borderCollapse: 'unset',
    background: '#fff',

    '&:last-child': {
      borderBottom: 'none',
    },
  },
  tableHead: {
    background: '#F3F5F7',
  },
});

class TableComponent extends React.Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        title: PropTypes.node.isRequired,
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
    rowIdKey: PropTypes.string,
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
    onRowClick: null,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE_OPTIONS[0],
    rowsPerPageOptions: DEFAULT_ROWS_PER_PAGE_OPTIONS,
    rowIdKey: '_id', // specific to data expected for tamanu REST api fetches
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
    const { data, columns, onRowClick, errorMessage, rowIdKey } = this.props;
    const error = this.getErrorMessage();
    if (error) {
      return (
        <ErrorRow colSpan={columns.length}>
          {errorMessage ? <ErrorSpan>{error}</ErrorSpan> : error}
        </ErrorRow>
      );
    }
    return data.map(rowData => {
      const key = rowData[rowIdKey] || rowData[columns[0].key];
      return <Row data={rowData} key={key} columns={columns} onClick={onRowClick} />;
    });
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
          y
        />
      </TableRow>
    );
  }

  render() {
    const { page, classes } = this.props;
    return (
      <StyledTableContainer>
        <MaterialTable classes={{ root: classes.root }}>
          <TableHead className={classes.tableHead}>
            <TableRow>{this.renderHeaders()}</TableRow>
          </TableHead>
          <TableBody>{this.renderBodyContent()}</TableBody>
          {page !== null && <TableFooter>{this.renderPaginator()}</TableFooter>}
        </MaterialTable>
      </StyledTableContainer>
    );
  }
}

export const Table = withStyles(tableStyles)(TableComponent);
