import React from 'react';
import { ScrollView } from 'react-native';
import { RowView } from '/styled/common';
import { Column } from './index';
import { TableCol } from './TableCol';

interface TableDataProps {
  data: any[];
  tableHeader: Column;
  columns: Column[];
  columnKey: string;
  onPressItem: (item: any) => void;
}

export const TableData = ({
  data,
  tableHeader,
  columns,
  columnKey,
  onPressItem,
}: TableDataProps): Element => (
  <ScrollView
    bounces={false}
    scrollEnabled
    showsHorizontalScrollIndicator
    horizontal
  >
    <RowView>
      {data.map((dataEntry: any) => (
        <TableCol
          onPressItem={onPressItem}
          key={dataEntry[columnKey]}
          tableHeader={tableHeader}
          columns={columns}
          row={dataEntry}
        />
      ))}
    </RowView>
  </ScrollView>
);
