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
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { PaperStyles } from '../Paper';
import { LoadingIndicator } from '../LoadingIndicator';
import { DownloadDataButton } from './DownloadDataButton';
import { useSettings } from '../../contexts/Settings';
import { Colors } from '../../constants';
import { ThemedTooltip } from '../Tooltip';
import { ErrorBoundary } from '../ErrorBoundary';
import { Paginator } from './Paginator';
import { TranslatedText } from '../Translation/TranslatedText';
import { get } from 'lodash';
import { useTranslation } from '../../contexts/Translation.jsx';

const preventInputCallback = (e) => {
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

  return (
    <CellErrorMessage onClick={showMessage} data-testid="cellerrormessage-6ffz">
      ERROR
    </CellErrorMessage>
  );
});

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const CenteredLoadingIndicatorContainer = styled.div`
  width: fit-content;
  margin: 1rem auto 0.5rem;
`;

const StyledTableRow = styled(TableRow)`
  ${(p) =>
    p.onClick
      ? `
      cursor: pointer;
      &:hover {
        background: ${Colors.veryLightBlue};
      }
    `
      : ''}

  ${(p) => (p.$rowStyle ? p.$rowStyle : '')}

  ${(p) =>
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
  width: 100%;
  border: 1px solid ${(props) => (props.$borderColor ? props.$borderColor : Colors.outline)};
  ${(props) => (props.$elevated ? PaperStyles : null)};
  ${(props) => (props.containerStyle ? props.containerStyle : null)}
`;

const StyledTableBody = styled(TableBody)`
  &.MuiTableBody-root {
    ${(props) =>
    props.$lazyLoading
      ? `
        overflow: auto;
        height: 62vh;
        display: block;
      `
      : ''};
  }
`;

const StyledTableCellContent = styled.div`
  max-width: ${(props) => props.maxWidth}px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const StyledTableCell = styled(TableCell)`
  padding: 15px;
  font-size: 14px;
  line-height: 18px;
  background: ${(props) => props.background};

  &.MuiTableCell-body {
    padding: 20px 15px;
  }

  &:first-child {
    padding-left: 20px;
  }

  &:last-child {
    padding-right: 20px;
  }
  ${(props) => (props.$cellStyle ? props.$cellStyle : '')}
`;

const StyledTable = styled(MaterialTable)`
  border-collapse: unset;
  background: ${(props) => props.$backgroundColor};

  &:last-child {
    border-bottom: none;
  }
`;

const StyledTableHead = styled(TableHead)`
  ${(props) =>
    props.$lazyLoading
      ? `
      display: table;
      table-layout: fixed;
      width: 100%;
      padding-right: 15px;
    `
      : ''}
  ${(props) =>
    props.$isBodyScrollable
      ? `
      position: sticky;
      top: 0;
  `
      : ``}
  background: ${(props) => (props.$headerColor ? props.$headerColor : Colors.background)};
  white-space: nowrap;
  .MuiTableCell-head {
    background: ${(props) => (props.$headerColor ? props.$headerColor : Colors.background)};
    ${(props) => (props.$fixedHeader ? 'top: 0; position: sticky;' : '')}
  }
  ${(props) => (props.$headStyle ? props.$headStyle : '')}
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

const getTableRow = ({
  children,
  lazyLoading,
  rowStyle,
  onClick,
  className,
  onMouseEnter,
  onMouseLeave,
}) => (
  <StyledTableRow
    className={className}
    onClick={onClick}
    $rowStyle={rowStyle}
    $lazyLoading={lazyLoading}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </StyledTableRow>
);

const RowTooltip = ({ title, children }) => (
  <ThemedTooltip
    title={title}
    PopperProps={{
      modifiers: {
        flip: {
          enabled: false,
        },
        offset: {
          enabled: true,
          offset: '0, -10',
        },
      },
    }}
  >
    {children}
  </ThemedTooltip>
);

const RowContainer = React.memo(({ rowTooltip, ...rowProps }) => {
  if (rowTooltip) {
    return (
      <RowTooltip title={rowTooltip} data-testid="rowtooltip-18ht">
        {getTableRow(rowProps)}
      </RowTooltip>
    );
  }
  return getTableRow(rowProps);
});

const StatusTableCell = styled(StyledTableCell)`
  &.MuiTableCell-body {
    padding: 60px;
    ${(props) => (props.$color ? `color: ${props.$color};` : '')}
    border-bottom: none;
  }
  ${(props) => (props.$statusCellStyle ? props.$statusCellStyle : '')}
`;

const formatCellValue = (value) => {
  const isEmpty = value === null || value === undefined || value === '';
  if (isEmpty) return '–';
  return value === 0 ? '0' : value;
};

const Row = React.memo(
  ({
    rowIndex,
    columns,
    data,
    onClick,
    cellOnChange,
    lazyLoading,
    rowStyle,
    refreshTable,
    cellStyle,
    onClickRow,
    onMouseEnter,
    onMouseLeave,
    getRowTooltip,
  }) => {
    const cells = columns.map(
      ({ key, accessor, CellComponent, numeric, maxWidth, cellColor, dontCallRowInput }) => {
        const onChange = cellOnChange ? (event) => cellOnChange(event, key, rowIndex, data) : null;
        const passingData = { refreshTable, onChange, ...data, rowIndex };
        const value = accessor ? React.createElement(accessor, passingData) : get(data, key);
        const backgroundColor = typeof cellColor === 'function' ? cellColor(data) : cellColor;
        return (
          <StyledTableCell
            key={key}
            onClick={dontCallRowInput ? preventInputCallback : (e) => onClickRow?.(e, passingData)}
            background={backgroundColor}
            $cellStyle={cellStyle}
            align={numeric ? 'right' : 'left'}
            data-test-class={`table-column-${rowIndex}-${key}`}
            data-testid={`styledtablecell-2gyy-${rowIndex}-${key}`}
          >
            <ErrorBoundary
              ErrorComponent={CellError}
              data-testid={`errorboundary-vajt-${rowIndex}-${key}`}
            >
              {CellComponent ? (
                <CellComponent
                  value={formatCellValue(value)}
                  data={data}
                  data-testid={`cellcomponent-pz8j-${rowIndex}-${key}`}
                />
              ) : (
                <DisplayValue
                  maxWidth={maxWidth}
                  displayValue={formatCellValue(value)}
                  data-testid={`displayvalue-ds9w-${rowIndex}-${key}`}
                />
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
        onMouseEnter={onMouseEnter && (() => onMouseEnter(data))}
        onMouseLeave={onMouseLeave && (() => onMouseLeave(data))}
        rowTooltip={getRowTooltip && getRowTooltip(data)}
        data-testid="rowcontainer-42fq"
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
    <StyledTableCellContent
      title={title}
      maxWidth={maxWidth}
      data-testid="styledtablecellcontent-t9n3"
    >
      {displayValue}
    </StyledTableCellContent>
  ) : (
    displayValue
  );
});

const StatusRow = React.memo(({ className, colSpan, children, textColor, statusCellStyle }) => (
  <RowContainer className={className} data-testid="rowcontainer-x9xp">
    <StatusTableCell
      $color={textColor}
      colSpan={colSpan}
      align="center"
      $statusCellStyle={statusCellStyle}
      data-testid="statustablecell-rwkq"
    >
      {children}
    </StatusTableCell>
  </RowContainer>
));

class TableComponent extends React.Component {
  getStatusMessage() {
    const { isLoading, errorMessage, data, noDataMessage, isEmpty } = this.props;
    if (isLoading)
      return (
        <TranslatedText
          stringId="general.table.loading"
          fallback="Loading..."
          data-testid="translatedtext-yvlt"
        />
      );
    if (errorMessage) return errorMessage;
    if (isEmpty || !data.length) return noDataMessage;
    return null;
  }

  handleChangePage = (event, newPage) => {
    const { onChangePage } = this.props;
    if (onChangePage) onChangePage(newPage - 1);
  };

  handleScroll = (event) => {
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

  handleChangeRowsPerPage = (event) => {
    const { onChangeRowsPerPage, onChangePage } = this.props;
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onChangeRowsPerPage) onChangeRowsPerPage(newRowsPerPage);
    if (onChangePage) onChangePage(0);
  };

  renderHeaders() {
    const { columns, order, orderBy, onChangeOrderBy, titleData, headerOnChange } = this.props;
    const getContent = ({ key, sortable, title, titleAccessor, tooltip, TitleCellComponent }) => {
      const onChange = headerOnChange ? (event) => headerOnChange(event, key) : null;
      const displayTitle = titleAccessor
        ? React.createElement(titleAccessor, { onChange, ...titleData, title })
        : title;

      const titleCellComponent = TitleCellComponent ? (
        <TitleCellComponent value={displayTitle} data-testid={`titlecellcomponent-si8a-${key}`} />
      ) : null;

      const defaultHeaderElement = sortable ? (
        <TableSortLabel
          active
          direction={orderBy === key ? order : 'desc'}
          onClick={() => onChangeOrderBy(key)}
          IconComponent={orderBy === key ? ActiveSortIcon : InactiveSortIcon}
          data-testid={`tablesortlabel-0qxx-${key}`}
        >
          {title || key}
        </TableSortLabel>
      ) : (
        <span data-testid={`tablelabel-0eff-${key}`}>{displayTitle ?? key}</span>
      );

      const headerElement = titleCellComponent || defaultHeaderElement;

      return tooltip ? (
        <ThemedTooltip title={tooltip} data-testid={`themedtooltip-fnr7-${key}`}>
          {headerElement}
        </ThemedTooltip>
      ) : (
        headerElement
      );
    };

    return columns.map(
      ({ key, title, numeric, titleAccessor, sortable = true, tooltip, TitleCellComponent }) => (
        <HeaderContainer key={key} numeric={numeric} data-testid={`headercontainer-6mxd-${key}`}>
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
      cellStyle,
      statusCellStyle,
      onClickRow,
      onMouseEnterRow,
      onMouseLeaveRow,
      getRowTooltip,
    } = this.props;

    const status = this.getStatusMessage();
    if (status) {
      return (
        <StatusRow
          className="statusRow"
          colSpan={columns.length}
          statusCellStyle={statusCellStyle}
          data-testid="statusrow-fsiy"
        >
          {errorMessage ? <ErrorSpan data-testid="errorspan-dbf1">{status}</ErrorSpan> : status}
        </StatusRow>
      );
    }
    // Ignore frontend sorting if lazyLoading as it causes a terrible UX
    const sortedData = customSort && !lazyLoading ? customSort(data) : data;
    return (
      <>
        {Array.isArray(sortedData) &&
          sortedData.map((rowData, rowIndex) => {
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
                cellStyle={cellStyle}
                onClickRow={onClickRow}
                onMouseEnter={onMouseEnterRow}
                onMouseLeave={onMouseLeaveRow}
                getRowTooltip={getRowTooltip}
                data-testid="row-1kia"
              />
            );
          })}
        {isLoadingMore && (
          <StyledTableRow $lazyLoading={lazyLoading} data-testid="styledtablerow-b6kf">
            <CenteredLoadingIndicatorContainer data-testid="centeredloadingindicatorcontainer-38t4">
              <LoadingIndicator
                backgroundColor="transparent"
                opacity={1}
                height="24px"
                width="20px"
                size="20px"
                data-testid="loadingindicator-ur6w"
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
        data-testid="paginator-vq9f"
      />
    );
  }

  renderFooter() {
    const {
      page,
      lazyLoading,
      exportName,
      columns,
      data,
      allowExport,
      count,
      ExportButton,
    } = this.props;

    // Footer is empty, don't render anything
    if (((page === null || lazyLoading) && !allowExport) || count === 0) {
      return null;
    }

    return (
      <StyledTableFooter data-testid="styledtablefooter-7pgn">
        <StyledTableRow $lazyLoading={lazyLoading} data-testid="styledtablerow-oomc">
          {allowExport ? (
            <TableCell colSpan={page !== null ? 2 : columns.length} data-testid="tablecell-zqda">
              <DownloadDataButton
                exportName={exportName}
                columns={columns}
                data={data}
                ExportButton={ExportButton}
                data-testid="downloaddatabutton-w1c5"
              />
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
      TableHeader,
      data,
      isLoading,
      noDataBackgroundColor,
      tableRef,
      containerStyle,
      isBodyScrollable,
      headStyle,
      'data-testid': dataTestId,
    } = this.props;

    return (
      <StyledTableContainer
        className={className}
        $elevated={elevated}
        isBodyScrollable
        containerStyle={containerStyle}
        $borderColor={
          noDataBackgroundColor !== Colors.white && !(data?.length || isLoading)
            ? noDataBackgroundColor
            : Colors.outline
        }
        data-testid={dataTestId}
      >
        {TableHeader && TableHeader}
        <StyledTable
          $backgroundColor={data?.length || isLoading ? Colors.white : noDataBackgroundColor}
          data-testid="styledtable-1dlu"
        >
          {!hideHeader && (
            <StyledTableHead
              $headerColor={headerColor}
              $fixedHeader={fixedHeader}
              $lazyLoading={lazyLoading}
              $isBodyScrollable={isBodyScrollable}
              $headStyle={headStyle}
              data-testid="styledtablehead-ays3"
            >
              <StyledTableRow $lazyLoading={lazyLoading}>{this.renderHeaders()}</StyledTableRow>
            </StyledTableHead>
          )}
          <StyledTableBody
            onScroll={lazyLoading ? this.handleScroll : undefined}
            $lazyLoading={!this.getStatusMessage() && lazyLoading}
            ref={tableRef}
            data-testid="styledtablebody-a0jz"
          >
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
  noDataMessage: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
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
  onMouseEnterRow: PropTypes.func,
  onMouseLeaveRow: PropTypes.func,
  cellOnChange: PropTypes.func,
  headerOnChange: PropTypes.func,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  rowIdKey: PropTypes.string,
  className: PropTypes.string,
  exportName: PropTypes.string,
  refreshTable: PropTypes.func,
  rowStyle: PropTypes.func,
  containerStyle: PropTypes.string,
  allowExport: PropTypes.bool,
  elevated: PropTypes.bool,
  lazyLoading: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  noDataBackgroundColor: PropTypes.string,
  isBodyScrollable: PropTypes.bool,
  getRowTooltip: PropTypes.func,
  ExportButton: PropTypes.func,
};

TableComponent.defaultProps = {
  errorMessage: '',
  noDataMessage: (
    <TranslatedText
      stringId="general.table.noDataMessage"
      fallback="No data found"
      data-testid="translatedtext-d4jv"
    />
  ),
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
  onMouseEnterRow: null,
  onMouseLeaveRow: null,
  cellOnChange: null,
  headerOnChange: null,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE_OPTIONS[0],
  rowsPerPageOptions: DEFAULT_ROWS_PER_PAGE_OPTIONS,
  rowIdKey: 'id', // specific to data expected for tamanu REST api fetches
  className: null,
  exportName: 'Export',
  refreshTable: null,
  rowStyle: null,
  containerStyle: null,
  allowExport: true,
  lazyLoading: false,
  isLoadingMore: false,
  noDataBackgroundColor: Colors.white,
  isBodyScrollable: false,
  getRowTooltip: null,
};

export const Table = React.forwardRef(
  ({ columns: allColumns, data, exportName, ...props }, ref) => {
    const { getTranslation } = useTranslation();
    const { getSetting } = useSettings();
    const columns = allColumns.filter(({ key }) => getSetting(`fields.${key}.hidden`) !== true);

    return (
      <TableComponent
        columns={columns}
        data={data}
        exportName={getTranslation('general.table.action.export', exportName)}
        tableRef={ref}
        {...props}
      />
    );
  },
);
