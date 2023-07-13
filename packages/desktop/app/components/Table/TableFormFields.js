import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { Colors } from '../../constants';

const StyledFixedTable = styled(MaterialTable)`
  border: 1px solid ${Colors.outline};
  border-radius: 3px 3px 0 0;
  border-collapse: unset;
  background: ${Colors.white};

  table-layout: fixed;
  width: 100%;

  &:last-child {
    border-bottom: none;
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
export const TableFormFields = React.memo(({ columns, data, className }) => (
  <StyledFixedTable className={className}>
    <StyledTableHead>
      <TableRow>
        {columns.map(({ key, title, width }) => (
          <StyledTableHeaderCell key={key} width={width}>
            {title}
          </StyledTableHeaderCell>
        ))}
      </TableRow>
    </StyledTableHead>
    <TableBody>
      {data.map((rowData, i) => (
        <TableRow key={rowData.id || i}>
          {columns.map(({ key, accessor }) => (
            <StyledTableDataCell key={key}>{accessor(rowData)}</StyledTableDataCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </StyledFixedTable>
));

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
