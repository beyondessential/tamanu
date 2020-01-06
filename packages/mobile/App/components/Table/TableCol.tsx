import React from 'react';
import { StyledView } from '../../styled/common';
import { TableHeaderCell } from './TableHeaderCell';
import { TableCell } from './TableCell';
import { Column } from '.';

interface TableColProps {
  columns: Column[];
  row: any;
  tableHeader: Column;
}

export const TableCol = ({
  columns,
  row,
  tableHeader,
}: TableColProps): JSX.Element => (
  <StyledView>
    <TableHeaderCell>{tableHeader.accessor(row)}</TableHeaderCell>
    {columns.map(c => (
      <TableCell key={c.key}>{c.accessor(row)}</TableCell>
    ))}
  </StyledView>
);
