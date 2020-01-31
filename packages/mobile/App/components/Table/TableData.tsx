import React from 'react';
import { ScrollView } from 'react-native';
import { RowView } from '../../styled/common';
import { Column } from './index';
import { TableCol } from './TableCol';

interface TableDataProps {
  data: any[];
  tableHeader: Column;
  columns: Column[];
  columnKey: string
}

export const TableData = ({
  data,
  tableHeader,
  columns,
  columnKey,
}: TableDataProps): JSX.Element => (
  <ScrollView
    bounces={false}
    scrollEnabled
    showsHorizontalScrollIndicator
    horizontal
  >
    <RowView>
      {data.map((dataEntry: any) => (
        <TableCol
          key={dataEntry[columnKey]}
          tableHeader={tableHeader}
          columns={columns}
          row={dataEntry}
        />
      ))}
    </RowView>
  </ScrollView>
);
