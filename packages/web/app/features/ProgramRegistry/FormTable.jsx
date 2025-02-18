import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Colors } from '../../constants';

const Container = styled.div`
  border-radius: 3px;
  background: ${Colors.white};
  table-layout: fixed;
  border: 1px solid ${Colors.outline};
  padding: 0 20px;
`;

const Table = styled(MaterialTable)`
  table-layout: fixed;
  tr:last-child td {
    border-bottom: none;
  }
`;

const StyledTableHead = styled(TableHead)``;

const StyledTableHeaderCell = styled(TableCell)`
  width: ${props => (props.width ? props.width : 'auto')};
  padding: 10px 5px;

  &:last-child {
    padding-right: 0;
  }

  &:first-child {
    padding-left: 0;
  }
`;

const StyledTableDataCell = styled(TableCell)`
  padding: 30px 5px;

  &:last-child {
    padding-right: 0;
  }

  &:first-child {
    padding-left: 0;
  }
`;

export const FormTable = React.memo(({ columns, data, className = '' }) => {
  const rows = data;
  return (
    <Container className={className}>
      <Table>
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
          {rows.map((rowData, i) => (
            <TableRow key={rowData.id || i}>
              {columns.map(({ key, accessor }) => (
                <StyledTableDataCell key={key}>{accessor(rowData, i)}</StyledTableDataCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
});

FormTable.propTypes = {
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
