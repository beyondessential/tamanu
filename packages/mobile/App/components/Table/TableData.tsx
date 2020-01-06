import React from 'react';
import { ScrollView } from 'react-native';
import { RowView } from '../../styled/common';
import { Column } from './index';
import { TableCol } from './TableCol';

interface TableDataProps {
  data: any[];
  tableHeader: Column;
  columns: Column[];
}

export const TableData = ({
  data,
  tableHeader,
  columns,
}: TableDataProps): JSX.Element => (
  <ScrollView
    bounces={false}
    scrollEnabled
    showsHorizontalScrollIndicator
    horizontal
  >
    <RowView>
      {data.map((d: any) => (
        <TableCol
          tableHeader={tableHeader}
          key={d.id}
          columns={columns}
          row={d}
        />
      ))}
    </RowView>
  </ScrollView>
);
