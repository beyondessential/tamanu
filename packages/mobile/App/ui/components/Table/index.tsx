import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';

export type TableHeader = {
  key: string;
  accessor: (value: string) => Element;
}

export type Row = {
  rowKey: string;
  rowTitle: string;
  rowHeader: () => Element;
  cell: (cellContent: any) => Element;
};

export type Cells<T> = {
  [key: string]: T[];
}

interface TableProps {
  Title: React.FC<any>;
  cells: Cells<any>;
  rows: Row[];
  columns: string[];
  tableHeader: any;
  onPressItem?: (item: any) => void;
}

export const Table : React.FC<TableProps> = ({
  Title,
  rows,
  columns,
  cells,
  tableHeader,
  onPressItem,
}) => (
  <RowView>
    <StyledView>
      <Title />
      {rows.map(r => r.rowHeader())}
    </StyledView>
    <ScrollView bounces={false} scrollEnabled showsHorizontalScrollIndicator horizontal>
      <RowView>
        {columns.map((column: any) => (
          <StyledView key={`${column}`}>
            {tableHeader.accessor(column, onPressItem)}
            {cells[column]
                && rows.map(row => row.cell(
                  cells[column].find(c => c[row.rowKey] === row.rowTitle),
                ))}
          </StyledView>
        ))}
      </RowView>
    </ScrollView>
  </RowView>
);
