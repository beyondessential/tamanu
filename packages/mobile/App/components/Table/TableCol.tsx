import React from 'react';
import { StyledView } from '../../styled/common';
import { Column } from '.';

interface TableColProps {
  columns: Column[];
  row: any;
  tableHeader: Column;
  onPressItem?: (item: any) => void;
}

export const TableCol = ({
  columns,
  row,
  tableHeader,
  onPressItem,
}: TableColProps): JSX.Element => (
  <StyledView>
    {tableHeader.accessor(row, onPressItem)}
    {columns.map(c => c.accessor(row, onPressItem, c))}
  </StyledView>
);
