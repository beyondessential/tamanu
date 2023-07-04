/**
 * Tamanu
 * Copyright (c) 2018-2022 Beyond Essential Systems Pty Ltd
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Table as MaterialTable,
  TableBody,
  TableCell,
  TableHead,
  TableSortLabel,
  TableRow,
  TableFooter,
  TablePagination,
} from '@material-ui/core';
import { PaperStyles } from '../Paper';
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
  const showMessage = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log(error);
  }, [error]);

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
        background: #f4f9ff;
      }
    `
      : ''}

  ${p => (p.$rowStyle ? p.$rowStyle : '')}
`;

const StyledTableContainer = styled.div`
  overflow: auto;
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
  ${props => (props.$elevated ? PaperStyles : null)};
`;

const StyledTableCellContent = styled.div`
  max-width: ${props => props.maxWidth}px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const StyledTableCell = styled(TableCell)`
  padding: 15px;
  font-size: 14px;
  line-height: 18px;
  background: ${props => props.background};

  &.MuiTableCell-body {
    padding: 20px 15px;
  }

  &:first-child {
    padding-left: 20px;
  }

  &:last-child {
    padding-right: 20px;
  }
`;

const StyledTable = styled(MaterialTable)`
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

  tr:last-child td {
    border-bottom: none;
  }
`;

const RowContainer = React.memo(({ children, rowStyle, onClick }) => (
  <StyledTableRow onClick={onClick} $rowStyle={rowStyle}>
    {children}
  </StyledTableRow>
));

const Row = React.memo(({ columns, data, onClick, rowStyle, refreshTable }) => {
  const cells = columns.map(
    ({ key, accessor, CellComponent, numeric, maxWidth, cellColor, dontCallRowInput }) => {
      const value = accessor ? React.createElement(accessor, { refreshTable, ...data }) : data[key];
      const displayValue = value === 0 ? '0' : value;
      const backgroundColor = typeof cellColor === 'function' ? cellColor(data) : cellColor;
      return (
        <StyledTableCell
          onClick={dontCallRowInput ? preventInputCallback : undefined}
          background={backgroundColor}
          key={key}
          align={numeric ? 'right' : 'left'}
          data-test-class={`table-column-${key}`}
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
  return (
    <RowContainer
      onClick={onClick && (() => onClick(data))}
      rowStyle={rowStyle ? rowStyle(data) : ''}
    >
      {cells}
    </RowContainer>
  );
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
  getErrorMessage() {
    const { isLoading, errorMessage, data, noDataMessage } = this.props;
    if (isLoading) return 'Loading...';
    if (errorMessage) return errorMessage;
    if (!data.length) return noDataMessage;
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
    const {
      data,
      customSort,
      columns,
      onRowClick,
      errorMessage,
      rowIdKey,
      rowStyle,
      refreshTable,
    } = this.props;
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
      return (
        <Row
          data={rowData}
          key={key}
          columns={columns}
          onClick={onRowClick}
          refreshTable={refreshTable}
          rowStyle={rowStyle}
        />
      );
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
        onPageChange={this.handleChangePage}
        onRowsPerPageChange={this.handleChangeRowsPerPage}
      />
    );
  }

  renderFooter() {
    const { page, exportName, columns, data, allowExport } = this.props;

    // Footer is empty, don't render anything
    if (page === null && !allowExport) {
      return null;
    }

    return (
      <StyledTableFooter>
        <TableRow>
          {allowExport ? (
            <TableCell colSpan={page !== null ? 1 : columns.length}>
              <DownloadDataButton exportName={exportName} columns={columns} data={data} />
            </TableCell>
          ) : null}
          {page !== null && this.renderPaginator()}
        </TableRow>
      </StyledTableFooter>
    );
  }

  render() {
    const { className, elevated } = this.props;
    return (
      <StyledTableContainer className={className} $elevated={elevated}>
        <StyledTable>
          <StyledTableHead>
            <TableRow>{this.renderHeaders()}</TableRow>
          </StyledTableHead>
          <TableBody>{this.renderBodyContent()}</TableBody>
          {this.renderFooter()}
        </StyledTable>
      </StyledTableContainer>
    );
  }
}

TableComponent.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.node,
      accessor: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
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
  refreshTable: PropTypes.func,
  rowStyle: PropTypes.func,
  allowExport: PropTypes.bool,
  elevated: PropTypes.bool,
};

TableComponent.defaultProps = {
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
  elevated: true,
  onRowClick: null,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE_OPTIONS[0],
  rowsPerPageOptions: DEFAULT_ROWS_PER_PAGE_OPTIONS,
  rowIdKey: 'id', // specific to data expected for tamanu REST api fetches
  className: null,
  exportName: 'TamanuExport',
  refreshTable: null,
  rowStyle: null,
  allowExport: true,
};

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
