import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { head } from 'lodash';

export type TableHeader = {
  key: string;
  accessor: (value: string, onPress: (item: any) => void, headerOffsetPosition?: number) => JSX.Element;
};

export type TableRow = {
  rowKey: string;
  rowTitle: string;
  rowHeader: (i: number) => JSX.Element;
  cell: (cellContent: any, i: number) => JSX.Element;
};

export type TableCells<T> = {
  [key: string]: T[];
};

interface TableProps {
  Title: React.MemoExoticComponent<() => JSX.Element> | (() => JSX.Element);
  cells: TableCells<any>;
  rows: TableRow[];
  columns: string[];
  tableHeader: TableHeader;
  onPressItem?: (item: any) => void;
  headerOffsetPosition?: number;
}

export const Table = ({
  Title,
  rows,
  columns,
  cells,
  tableHeader,
  onPressItem,
  headerOffsetPosition,
}: TableProps): JSX.Element => {

  return (
    <RowView>
      <StyledView>
        <StyledView zIndex={1} top={headerOffsetPosition}><Title /></StyledView>
        {rows.map((r, i) => r.rowHeader(i))}
      </StyledView>
      <ScrollView bounces={false} showsHorizontalScrollIndicator horizontal>
        <RowView>
          {columns.map((column: any) => (
            <StyledView key={`${column}`}>
              <StyledView zIndex={1} top={headerOffsetPosition}>{tableHeader.accessor(column, onPressItem)}</StyledView>
              {cells[column] &&
                rows.map((row, i) =>
                  row.cell(
                    cells[column].find(c => c[row.rowKey] === row.rowTitle),
                    i,
                  ),
                )}
            </StyledView>
          ))}
        </RowView>
      </ScrollView>
    </RowView>
  );
};
