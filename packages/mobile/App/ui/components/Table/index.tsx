import React, { FunctionComponent } from 'react';
import { StyledView, RowView } from '/styled/common';
import { TableData } from './TableData';

export type Column = {
  id?: string | number;
  key: string;
  title: string;
  subtitle?: string;
  accessor: (
    row: any,
    onPress?: (item: any) => void,
    column?: any,
  ) => Element;
  rowHeader: (row: any, column?: any) => Element;
};

interface TableProps {
  Title: FunctionComponent<any>;
  data: any;
  columns: Column[];
  tableHeader: any;
  columnKey: string;
  onPressItem: (item: any) => void;
}

export const Table = ({
  Title,
  data,
  columns,
  tableHeader,
  columnKey,
  onPressItem,
}: TableProps): JSX.Element => (
  <RowView>
    <StyledView>
      <Title />
      {columns.map(c => c.rowHeader(c))}
    </StyledView>
    <TableData
      columnKey={columnKey}
      data={data}
      columns={columns}
      tableHeader={tableHeader}
      onPressItem={onPressItem}
    />
  </RowView>
);
