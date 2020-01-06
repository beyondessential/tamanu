import React from 'react';
import { StyledView, RowView } from '../../styled/common';
import { TableData } from './TableData';
import { TableTitle } from './TableTitle';
import { RowHeaderCell } from './RowHeaderCell';

export type Column = {
  key: string;
  title?: string;
  accessor: any;
};

interface TableProps {
  title: string;
  data: any;
  columns: Column[];
  tableHeader: Column;
}

export const Table = ({
  title,
  data,
  columns,
  tableHeader,
}: TableProps): JSX.Element => (
  <RowView>
    <StyledView>
      <TableTitle title={title} />
      {columns.map(c => (
        <RowHeaderCell key={c.key}>{c.title}</RowHeaderCell>
      ))}
    </StyledView>
    <TableData data={data} columns={columns} tableHeader={tableHeader} />
  </RowView>
);
