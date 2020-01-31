import React from 'react';
import { StyledView } from '../../styled/common';
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
    {tableHeader.accessor(row)}
    {columns.map(c => c.accessor(row, c))}
  </StyledView>
);
