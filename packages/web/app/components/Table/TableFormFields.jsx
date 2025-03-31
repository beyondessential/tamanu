import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialTable from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';

import { Colors } from '../../constants';
import { Paginator } from './Paginator.jsx';

import { TranslatedText } from '../../components/Translation';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const StyledFixedTable = styled(MaterialTable)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px 3px 0 0;
  border-collapse: unset;
  background: ${Colors.white};

  table-layout: fixed;
  width: 100%;

  &:last-child {
    border-bottom: ${props => (props.$pagination ? 'auto' : 'none')};
  }
`;

const StyledTableHead = styled(TableHead)`
  background: ${Colors.background};
`;

const StyledTableHeaderCell = styled(TableCell)`
  width: ${props => (props.width ? props.width : 'auto')};
  padding: 1.5%;
  text-align: center;
`;

const StyledTableDataCell = styled(TableCell)`
  padding: 1.5%;
`;

const StyledTableFooter = styled(TableFooter)`
  background: ${Colors.background};
  width: 100%;

  tr:last-child td {
    border-bottom: none;
  }
`;

const PaginationRow = styled(TableRow)`
  display: flex;
  justify-content: flex-end;
`;

const NoDataTableCell = styled(TableCell)`
  text-align: center;
  padding: 60px;
`;

/*
Component created to display form fields shaped as a table.
This component borrows heavily from the Table component but
utilizes a fixed layout, provides a way to specify column widths
and removes extra functionality (download, sort, etc.).

This component doesn't provide any extra functionality to handle
the form fields that can be contained within each column accessor.

In order to properly manage form state and fields you should use
Formik's Field component and provide a special naming scheme to avoid
namespace collisions.
*/
export const TableFormFields = React.memo(
  ({ columns, data, className = '', pagination = false, ...props }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(
      pagination ? ROWS_PER_PAGE_OPTIONS[0] : data.length,
    );
    const [pageRows, setPageRows] = useState(pagination ? data.slice(page, rowsPerPage) : data);

    // When the data to be displayed is changed (e.g. by search), update the rows and set to page 1
    useEffect(() => {
      setPageRows(data.slice(0, rowsPerPage));
      setPage(0);
    }, [data]);

    // Display the relevant page's rows when the table page is changed
    const handlePageChange = (event, newPage) => {
      setPage(newPage - 1);
      setPageRows(data.slice(rowsPerPage * (newPage - 1), rowsPerPage * newPage));
    };

    // Display the new amount of rows per page and set to page 1
    const handleRowsPerPageChange = event => {
      const newRowsPerPage = event.target.value;
      setRowsPerPage(newRowsPerPage);
      setPage(0);
      setPageRows(data.slice(0, newRowsPerPage));
    };

    return (
      <>
        <TableContainer>
          <StyledFixedTable className={className} $pagination={pagination} {...props}>
            <StyledTableHead>
              <TableRow data-testid='tablerow-fy16'>
                {columns.map(({ key, title, width }) => (
                  <StyledTableHeaderCell key={key} width={width}>
                    {title}
                  </StyledTableHeaderCell>
                ))}
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {pageRows && pageRows.length > 0 ? (
                pageRows.map((rowData, i) => (
                  <TableRow key={rowData.id || i} data-testid='tablerow-1ujb'>
                    {columns.map(({ key, accessor }) => (
                      <StyledTableDataCell key={key} data-testid='styledtabledatacell-5fg8'>{accessor(rowData, i)}</StyledTableDataCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow data-testid='tablerow-t2ja'>
                  <NoDataTableCell colSpan={columns.length}>
                    <TranslatedText
                      stringId="general.table.noData"
                      fallback="No data found"
                      data-testid='translatedtext-mrtn' />
                  </NoDataTableCell>
                </TableRow>
              )}
            </TableBody>
          </StyledFixedTable>
        </TableContainer>
        {pagination && (
          <StyledTableFooter>
            <PaginationRow>
              <Paginator
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                colSpan={columns.length}
                page={page}
                count={data.length}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </PaginationRow>
          </StyledTableFooter>
        )}
      </>
    );
  },
);

TableFormFields.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.node,
      accessor: PropTypes.func.isRequired,
      width: PropTypes.string,
    }),
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};
