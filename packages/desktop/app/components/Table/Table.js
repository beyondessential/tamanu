/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';

import { DownloadDataButton } from './DownloadDataButton';
import { useLocalisation } from '../../contexts/Localisation';
import { ErrorBoundary } from '../ErrorBoundary';
import { Colors } from '../../constants';

const preventInputCallback = e => {
  e.stopPropagation();
  e.preventDefault();
};

const CellErrorMessage = styled.div`
  display: block;
  background: red;
  width: 100%;
  height: 100%;
  color: white;
  cursor: pointer;
`;

const CellError = React.memo(({ error }) => {
  const showMessage = React.useCallback(() => {
    console.log(error);
  });

  return <CellErrorMessage onClick={showMessage}>ERROR</CellErrorMessage>;
});

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

const StyledTableCellContent = styled.div`
  max-width: ${props => props.maxWidth}px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const StyledTableCell = styled(TableCell)`
  padding: 16px;
  background: ${props => props.background};
`;

const StyledTable = styled(MaterialTable)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px 3px 0 0;
  border-collapse: unset;
  background: ${Colors.white};

  &:last-child {
    border-bottom: none;
  }
`;

const StyledTableHead = styled(TableHead)`
  background: ${Colors.background};
`;

const StyledTableFooter = styled(TableFooter)`
  background: ${Colors.background};
  border-bottom: 1px solid black;
`;

const RowContainer = React.memo(({ children, onClick }) => (
  <StyledTableRow onClick={onClick} style={{ marginTop: '1rem' }}>
    {children}
  </StyledTableRow>
));

const Row = React.memo(({ columns, data, onClick }) => {
  const cells = columns.map(
    ({ key, accessor, CellComponent, numeric, maxWidth, cellColor, dontCallRowInput }) => {
      const value = accessor ? React.createElement(accessor, data) : data[key];
      const displayValue = value === 0 ? '0' : value;
      const backgroundColor = typeof cellColor === 'function' ? cellColor(data) : cellColor;
      return (
        <StyledTableCell
          onClick={dontCallRowInput ? preventInputCallback : undefined}
          background={backgroundColor}
          key={key}
          align={numeric ? 'right' : 'left'}
        >
          <ErrorBoundary ErrorComponent={CellError}>
            {CellComponent ? (
              <CellComponent value={displayValue} />
            ) : (
              <DisplayValue maxWidth={maxWidth} displayValue={displayValue} />
            )}
          </ErrorBoundary>
        </StyledTableCell>
      );
    },
  );
  return <RowContainer onClick={onClick && (() => onClick(data))}>{cells}</RowContainer>;
});

const ErrorSpan = styled.span`
  color: #ff0000;
`;

const DisplayValue = React.memo(({ maxWidth, displayValue }) =>
  maxWidth ? (
    <StyledTableCellContent title={displayValue} maxWidth={maxWidth}>
      {displayValue}
    </StyledTableCellContent>
  ) : (
    displayValue
  ),
);

const ErrorRow = React.memo(({ colSpan, children }) => (
  <RowContainer>
    <StyledTableCell colSpan={colSpan} align="center">
      {children}
    </StyledTableCell>
  </RowContainer>
));

class TableComponent extends React.Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        title: PropTypes.node,
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
    className: PropTypes.string,
    exportName: PropTypes.string,
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
    rowIdKey: 'id', // specific to data expected for tamanu REST api fetches
    className: null,
    exportName: 'TamanuExport',
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
    const { columns, order, orderBy, onChangeOrderBy, getLocalisation } = this.props;
    const getContent = (key, sortable, title) =>
      sortable ? (
        <TableSortLabel
          active={orderBy === key}
          direction={order}
          onClick={() => onChangeOrderBy(key)}
        >
          {title || getLocalisation(`fields.${key}.shortLabel`) || key}
        </TableSortLabel>
      ) : (
        title || getLocalisation(`fields.${key}.shortLabel`) || key
      );

    return columns.map(({ key, title, numeric, sortable = true }) => (
      <StyledTableCell key={key} align={numeric ? 'right' : 'left'}>
        {getContent(key, sortable, title)}
      </StyledTableCell>
    ));
  }

  renderBodyContent() {
    const { data, customSort, columns, onRowClick, errorMessage, rowIdKey } = this.props;
    const error = this.getErrorMessage();
    if (error) {
      return (
        <ErrorRow colSpan={columns.length}>
          {errorMessage ? <ErrorSpan>{error}</ErrorSpan> : error}
        </ErrorRow>
      );
    }
    const sortedData = customSort ? customSort(data) : data;
    return sortedData.map(rowData => {
      const key = rowData[rowIdKey] || rowData[columns[0].key];
      return <Row data={rowData} key={key} columns={columns} onClick={onRowClick} />;
    });
  }

  renderPaginator() {
    const { columns, page, count, rowsPerPage, rowsPerPageOptions } = this.props;
    return (
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        colSpan={columns.length}
        page={page}
        count={count}
        rowsPerPage={rowsPerPage}
        onChangePage={this.handleChangePage}
        onChangeRowsPerPage={this.handleChangeRowsPerPage}
      />
    );
  }

  render() {
    const { page, className, exportName, columns, data } = this.props;
    return (
      <StyledTableContainer className={className}>
        <StyledTable>
          <StyledTableHead>
            <TableRow>{this.renderHeaders()}</TableRow>
          </StyledTableHead>
          <TableBody>{this.renderBodyContent()}</TableBody>
          <StyledTableFooter>
            <TableRow>
              <TableCell>
                <DownloadDataButton exportName={exportName} columns={columns} data={data} />
              </TableCell>
              {page !== null && this.renderPaginator()}
            </TableRow>
          </StyledTableFooter>
        </StyledTable>
      </StyledTableContainer>
    );
  }
}

export const Table = ({ columns: allColumns, data, exportName, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const columns = allColumns.filter(({ key }) => getLocalisation(`fields.${key}.hidden`) !== true);

  return (
    <TableComponent
      columns={columns}
      data={data}
      exportname={exportName}
      getLocalisation={getLocalisation}
      {...props}
    />
  );
};
