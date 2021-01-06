import React, { FunctionComponent } from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { VaccineTableCell } from '../VaccinesTable/VaccinesTableCell';

export type Column = {
  id?: string | number;
  key: string;
  title: string;
  subtitle?: string;
  schedule?: string;
  accessor: (
    row: any,
    onPress?: (item: any) => void,
    column?: any,
  ) => Element;
  rowHeader: (row: any, column?: any) => Element;
};

interface TableProps {
  Title: FunctionComponent<any>;
  cells: any;
  rows: any;
  columns: any[];
  tableHeader: any;
  onPressItem: (item: any) => void;
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
    <ScrollView
      bounces={false}
      scrollEnabled
      showsHorizontalScrollIndicator
      horizontal
    >
      <RowView>
        {columns.map((column: any) => (
          <StyledView key={`${column}`}>
            {tableHeader.accessor(column, onPressItem)}
            {rows.map((row, i) => (
              <VaccineTableCell
                key={`${column}${row.id}`}
                onPress={onPressItem}
                data={cells[column].find(d => d.label === row.label)}
              />
            ))}
          </StyledView>
        ))}
      </RowView>
    </ScrollView>
  </RowView>
);
