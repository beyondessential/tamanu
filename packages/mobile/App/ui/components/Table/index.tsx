import React, { FunctionComponent } from 'react';
import { StyledView, RowView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { VaccineTableCell } from '../VaccinesTable/VaccinesTableCell';

export type Row = {
  rowKey: string;
  rowTitle: string;
  rowHeader: () => Element;
};

interface TableProps {
  Title: FunctionComponent<any>;
  cells: any[];
  rows: Row[];
  columns: string[];
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
            {rows.map(row => (
              <VaccineTableCell
                key={row.rowKey}
                onPress={onPressItem}
                data={cells[column].find(c => c[row.rowKey] === row.rowTitle)}
              />
            ))}
          </StyledView>
        ))}
      </RowView>
    </ScrollView>
  </RowView>
);
