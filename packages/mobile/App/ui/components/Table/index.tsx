import React from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type TableHeader = {
  key: string;
  accessor: (
    value: string,
    onPress: (item: any) => void,
    headerOffsetPosition?: number,
  ) => JSX.Element;
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
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const Table = ({
         Title = null,
         rows,
         columns,
         cells,
         tableHeader = null,
         onPressItem,
         scrollHandler,
       }: TableProps): JSX.Element => (
         <ScrollView>
           <RowView>
             <StyledView>
               {Title && <Title />}
               {rows.map((r, i) => r.rowHeader(i))}
             </StyledView>
             <ScrollView
               bounces={false}
               showsHorizontalScrollIndicator
               onScroll={scrollHandler}
               horizontal
             >
               <RowView>
                 {columns.map((column: any) => (
                   <StyledView key={`${column}`}>
                     {tableHeader?.accessor(column, onPressItem)}
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
         </ScrollView>
       );
