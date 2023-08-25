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
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { PaperStyles } from '../Paper';
import { LoadingIndicator } from '../LoadingIndicator';
import { DownloadDataButton } from './DownloadDataButton';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { ThemedTooltip } from '../Tooltip';
import { ErrorBoundary } from '../ErrorBoundary';
import { Paginator } from './Paginator';

const preventInputCallback = e => {
  e.stopPropagation();
  e.preventDefault();
};

const LAZY_LOADING_BOTTOM_SENSITIVITY = 0;

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

const CenteredLoadingIndicatorContainer = styled.div`
  width: fit-content;
  margin: 1rem auto 0.5rem;
`;

const OptionRow = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  font-size: 0.85rem;
  padding: 0.7rem;
`;

const StyledTableRow = styled(TableRow)`
  ${p =>
    p.onClick
      ? `
      cursor: pointer;
      &:hover {
        background: ${Colors.veryLightBlue};
      }
    `
      : ''}

  ${p => (p.$rowStyle ? p.$rowStyle : '')}

  ${p =>
    p.$lazyLoading
      ? `
      &.MuiTableRow-root {
        display: table;
        table-layout: fixed;
        width: 100%;
      }
    `
      : ''}


`;

const StyledTableContainer = styled.div`
  overflow: auto;
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
  ${props => (props.$elevated ? PaperStyles : null)};
`;

const StyledTableBody = styled(TableBody)`
  &.MuiTableBody-root {
    ${props =>
      props.$lazyLoading
        ? `
        overflow: auto;
        max-height: 300px;
        display: block;
      `
        : ''};
  }
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
  background: ${props => props.$backgroundColor};

  &:last-child {
    border-bottom: none;
  }
`;

const StyledTableHead = styled(TableHead)`
  ${props =>
    props.$lazyLoading
      ? `
      display: table;
      table-layout: fixed;
      width: 100%;
    `
      : ''}
  background: ${props => (props.$headerColor ? props.$headerColor : Colors.background)};
  white-space: nowrap;
  .MuiTableCell-head {
    background: ${props => (props.$headerColor ? props.$headerColor : Colors.background)};
    ${props => (props.$fixedHeader ? 'top: 0; position: sticky;' : '')}
  }
`;

const StyledTableFooter = styled(TableFooter)`
  background: ${Colors.background};

  tr:last-child td {
    border-bottom: none;
  }
`;

const ActiveSortIcon = styled(ExpandMore)`
  color: ${Colors.darkestText} !important;
`;

const InactiveSortIcon = styled(ActiveSortIcon)`
  color: ${Colors.midText} !important;
`;

const HeaderContainer = React.memo(({ children, numeric }) => (
  <StyledTableCell align={numeric ? 'right' : 'left'}>{children}</StyledTableCell>
));

const RowContainer = React.memo(({ children, lazyLoading, rowStyle, onClick }) => (
  <StyledTableRow onClick={onClick} $rowStyle={rowStyle} $lazyLoading={lazyLoading}>
    {children}
  </StyledTableRow>
));

const StatusTableCell = styled(StyledTableCell)`
  &.MuiTableCell-body {
    padding: 60px;
    ${props => (props.$color ? `color: ${props.$color};` : '')}
  }
`;

const Row = React.memo(
  ({ rowIndex, columns, data, onClick, cellOnChange, lazyLoading, rowStyle, refreshTable }) => {
    const cells = columns.map(
      ({ key, accessor, CellComponent, numeric, maxWidth, cellColor, dontCallRowInput }) => {
        const onChange = cellOnChange ? event => cellOnChange(event, key, rowIndex, data) : null;
        const value = accessor
          ? React.createElement(accessor, { refreshTable, onChange, ...data, rowIndex })
          : data[key];
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
                <CellComponent value={displayValue} data={data} />
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
        lazyLoading={lazyLoading}
      >
        {cells}
      </RowContainer>
    );
  },
);

const ErrorSpan = styled.span`
  color: #ff0000;
`;

const DisplayValue = React.memo(({ maxWidth, displayValue }) => {
  const title = typeof displayValue === 'string' ? displayValue : null;
  return maxWidth ? (
    <StyledTableCellContent title={title} maxWidth={maxWidth}>
      {displayValue}
    </StyledTableCellContent>
  ) : (
    displayValue
  );
});

const StatusRow = React.memo(({ colSpan, children, textColor }) => (
  <RowContainer>
    <StatusTableCell $color={textColor} colSpan={colSpan} align="center">
      {children}
    </StatusTableCell>
  </RowContainer>
));

class TableComponent extends React.Component {
  getStatusMessage() {
    const { isLoading, errorMessage, data, noDataMessage } = this.props;
    if (isLoading) return 'Loading...';
    if (errorMessage) return errorMessage;
    if (!data.length) return noDataMessage;
    return null;
  }

  handleChangePage = (event, newPage) => {
    const { onChangePage } = this.props;
    if (onChangePage) onChangePage(newPage - 1);
  };

  handleScroll = event => {
    const { count, lazyLoading, isLoadingMore, onChangePage, page, rowsPerPage } = this.props;
    if (!lazyLoading || isLoadingMore || !onChangePage) return;
    const bottom =
      event.target.scrollHeight -
        Math.ceil(event.target.scrollTop) -
        LAZY_LOADING_BOTTOM_SENSITIVITY <=
      event.target.clientHeight;
    const isNotLastPage = page + 1 < Math.ceil(count / rowsPerPage);
    if (bottom && isNotLastPage) onChangePage(page + 1);
  };

  handleChangeRowsPerPage = event => {
    const { onChangeRowsPerPage, onChangePage } = this.props;
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onChangeRowsPerPage) onChangeRowsPerPage(newRowsPerPage);
    if (onChangePage) onChangePage(0);
  };

  renderHeaders() {
    const {
      columns,
      order,
      orderBy,
      onChangeOrderBy,
      getLocalisation,
      titleData,
      headerOnChange,
    } = this.props;
    const getContent = ({ key, sortable, title, titleAccessor, tooltip, TitleCellComponent }) => {
      const onChange = headerOnChange ? event => headerOnChange(event, key) : null;
      const displayTitle = titleAccessor
        ? React.createElement(titleAccessor, { onChange, ...titleData, title })
        : title;

      const titleCellComponent = TitleCellComponent ? (
        <TitleCellComponent value={displayTitle} />
      ) : null;

      const defaultHeaderElement = sortable ? (
        <TableSortLabel
          active
          direction={orderBy === key ? order : 'desc'}
          onClick={() => onChangeOrderBy(key)}
          IconComponent={orderBy === key ? ActiveSortIcon : InactiveSortIcon}
        >
          {title || getLocalisation(`fields.${key}.shortLabel`) || key}
        </TableSortLabel>
      ) : (
        <span>{displayTitle || getLocalisation(`fields.${key}.shortLabel`) || key}</span>
      );

      const headerElement = titleCellComponent || defaultHeaderElement;

      return tooltip ? (
        <ThemedTooltip title={tooltip}>{headerElement}</ThemedTooltip>
      ) : (
        headerElement
      );
    };

    return columns.map(
      ({ key, title, numeric, titleAccessor, sortable = true, tooltip, TitleCellComponent }) => (
        <HeaderContainer key={key} numeric={numeric}>
          {getContent({ key, sortable, title, titleAccessor, tooltip, TitleCellComponent })}
        </HeaderContainer>
      ),
    );
  }

  renderBodyContent() {
    const {
      data,
      customSort,
      columns,
      onRowClick,
      cellOnChange,
      errorMessage,
      lazyLoading,
      rowIdKey,
      rowStyle,
      refreshTable,
      isLoadingMore,
    } = this.props;

    const status = this.getStatusMessage();
    if (status) {
      return (
        <StatusRow colSpan={columns.length}>
          {errorMessage ? <ErrorSpan>{status}</ErrorSpan> : status}
        </StatusRow>
      );
    }
    // Ignore frontend sorting if lazyLoading as it causes a terrible UX
    const sortedData = customSort && !lazyLoading ? customSort(data) : data;
    return (
      <>
        {sortedData.map((rowData, rowIndex) => {
          const key = rowData[rowIdKey] || rowData[columns[0].key];
          return (
            <Row
              rowIndex={rowIndex}
              data={rowData}
              key={key}
              columns={columns}
              onClick={onRowClick}
              cellOnChange={cellOnChange}
              refreshTable={refreshTable}
              rowStyle={rowStyle}
              lazyLoading={lazyLoading}
            />
          );
        })}
        {isLoadingMore && (
          <StyledTableRow $lazyLoading={lazyLoading}>
            <CenteredLoadingIndicatorContainer>
              <LoadingIndicator
                backgroundColor="transparent"
                opacity={1}
                height="24px"
                width="20px"
                size="20px"
              />
            </CenteredLoadingIndicatorContainer>
          </StyledTableRow>
        )}
      </>
    );
  }

  renderPaginator() {
    const { columns, page, count, rowsPerPage, rowsPerPageOptions } = this.props;
    return (
      <Paginator
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
    const { page, lazyLoading, exportName, columns, data, allowExport, count } = this.props;

    // Footer is empty, don't render anything
    if (((page === null || lazyLoading) && !allowExport) || count === 0) {
      return null;
    }

    return (
      <StyledTableFooter>
        <StyledTableRow $lazyLoading={lazyLoading}>
          {allowExport ? (
            <TableCell colSpan={page !== null ? 2 : columns.length}>
              <DownloadDataButton exportName={exportName} columns={columns} data={data} />
            </TableCell>
          ) : null}
          {page !== null && !lazyLoading && this.renderPaginator()}
        </StyledTableRow>
      </StyledTableFooter>
    );
  }

  render() {
    const {
      className,
      elevated,
      headerColor,
      hideHeader,
      fixedHeader,
      lazyLoading,
      optionRow,
      data,
      isLoading,
      noDataBackgroundColor,
      tableRef,
    } = this.props;

    return (
      <StyledTableContainer className={className} $elevated={elevated} ref={tableRef}>
        {optionRow && <OptionRow>{optionRow}</OptionRow>}
        <StyledTable
          $backgroundColor={data.length || isLoading ? Colors.white : noDataBackgroundColor}
        >
          {!hideHeader && (
            <StyledTableHead
              $headerColor={headerColor}
              $fixedHeader={fixedHeader}
              $lazyLoading={lazyLoading}
            >
              <StyledTableRow $lazyLoading={lazyLoading}>{this.renderHeaders()}</StyledTableRow>
            </StyledTableHead>
          )}
          <StyledTableBody onScroll={this.handleScroll} $lazyLoading={lazyLoading}>
            {this.renderBodyContent()}
          </StyledTableBody>
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
  hideHeader: PropTypes.bool,
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
  cellOnChange: PropTypes.func,
  headerOnChange: PropTypes.func,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  rowIdKey: PropTypes.string,
  className: PropTypes.string,
  exportName: PropTypes.string,
  refreshTable: PropTypes.func,
  rowStyle: PropTypes.func,
  allowExport: PropTypes.bool,
  elevated: PropTypes.bool,
  lazyLoading: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  noDataBackgroundColor: PropTypes.string,
};

TableComponent.defaultProps = {
  errorMessage: '',
  noDataMessage: 'No data found',
  count: 0,
  hideHeader: false,
  isLoading: false,
  onChangePage: null,
  onChangeRowsPerPage: null,
  onChangeOrderBy: null,
  orderBy: null,
  order: 'asc',
  page: null,
  elevated: true,
  onRowClick: null,
  cellOnChange: null,
  headerOnChange: null,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE_OPTIONS[0],
  rowsPerPageOptions: DEFAULT_ROWS_PER_PAGE_OPTIONS,
  rowIdKey: 'id', // specific to data expected for tamanu REST api fetches
  className: null,
  exportName: 'TamanuExport',
  refreshTable: null,
  rowStyle: null,
  allowExport: true,
  lazyLoading: false,
  isLoadingMore: false,
  noDataBackgroundColor: Colors.white,
};

export const Table = React.forwardRef(
  ({ columns: allColumns, data, exportName, ...props }, ref) => {
    const { getLocalisation } = useLocalisation();
    const columns = allColumns.filter(
      ({ key }) => getLocalisation(`fields.${key}.hidden`) !== true,
    );

    return (
      <TableComponent
        columns={columns}
        data={data}
        exportname={exportName}
        getLocalisation={getLocalisation}
        tableRef={ref}
        {...props}
      />
    );
  },
);
