import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';

export type TableHeader = {
  key: string;
  accessor: (value: string, onPress: (item: any) => void) => JSX.Element;
}

export type TableRow = {
  rowKey: string;
  rowTitle: string;
  rowHeader: () => JSX.Element;
  cell: (cellContent: any) => JSX.Element;
};

export type TableCells<T> = {
  [key: string]: T[];
}

interface TableProps {
  Title: React.MemoExoticComponent<() => JSX.Element> | (() => JSX.Element);
  cells: TableCells<any>;
  rows: TableRow[];
  columns: string[];
  tableHeader: TableHeader;
  onPressItem?: (item: any) => void;
}

export const Table = ({
  Title,
  rows,
  columns,
  cells,
  tableHeader,
  onPressItem,
}: TableProps): JSX.Element => (
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
              && rows.map(row => row.cell(cells[column]
                .find(c => c[row.rowKey] === row.rowTitle)))}
          </StyledView>
        ))}
      </RowView>
    </ScrollView>
  </RowView>
);
