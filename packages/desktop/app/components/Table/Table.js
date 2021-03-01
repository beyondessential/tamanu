/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import XLSX from 'xlsx';
import { remote, shell } from 'electron';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import { Button } from '@material-ui/core';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

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

const PaddedDownloadIcon = styled(SaveAltIcon)`
  padding: 5px;
  font-size: 42px;
`;

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
    ({ key, accessor, CellComponent, numeric, cellColor, dontCallRowInput }) => {
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
            {CellComponent ? <CellComponent value={displayValue} /> : displayValue}
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
    className: PropTypes.string,
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
      <StyledTableCell key={key} align={numeric ? 'right' : 'left'}>
        {getContent(key, sortable, title)}
      </StyledTableCell>
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
    const { page, className, data, columns, exportName } = this.props;
    const onDownloadData = async () => {
      const headers = columns.map(c => c.key);
      const rows = await Promise.all(
        data.map(async d => {
          const dx = {};
          await Promise.all(
            columns.map(async c => {
              if (c.asyncExportAccessor) {
                const value = await c.asyncExportAccessor(d);
                dx[c.key] = value;
                return;
              }

              dx[c.key] = d[c.key];
            }),
          );
          return dx;
        }),
      );

      const ws = XLSX.utils.json_to_sheet(rows, {
        header: headers,
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, exportName);

      /* show a file-save dialog and write the workbook */
      const path = await remote.dialog.showSaveDialog();
      if (path.canceled) return; // Dialog was cancelled - don't write file.
      XLSX.writeFile(wb, `${path.filePath}.xlsx`);
      shell.openPath(`${path.filePath}.xlsx`);
    };

    return (
      <StyledTableContainer className={className}>
        <StyledTable>
          <StyledTableHead>
            <TableRow>{this.renderHeaders()}</TableRow>
          </StyledTableHead>
          <TableBody>{this.renderBodyContent()}</TableBody>
          <StyledTableFooter>
            <TableRow>
              <Button onClick={onDownloadData}>
                <PaddedDownloadIcon />
              </Button>
              {page !== null && this.renderPaginator()}
            </TableRow>
          </StyledTableFooter>
        </StyledTable>
      </StyledTableContainer>
    );
  }
}

export const Table = TableComponent;
