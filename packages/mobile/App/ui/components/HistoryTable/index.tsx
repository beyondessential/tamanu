import React, { ReactElement } from 'react';
import { DataTable } from 'react-native-paper';
import { HistoryTableRows } from '~/ui/interfaces/HistoryTable';
import MultilineCell from './MultilineCell';

/**
 * @param data Object
 * @param rows Object where each key matches a key in data to render,
 *             and each value has a name and optional accessor function.
 */
export const HistoryTable = ({ data, rows }: {
  data: { [key: string]: any };
  rows: HistoryTableRows;
}): ReactElement => (
  <DataTable style={{ paddingHorizontal: 10 }}>
    {Object.entries(rows).map(([key, row]): ReactElement => {
      const cellValue = row.accessor
        ? row.accessor(data[key])
        : ((data[key] === null || data[key] === undefined) || '');
      return (
        <DataTable.Row key={key}>
          <MultilineCell>{row.name}</MultilineCell>
          <MultilineCell>{cellValue}</MultilineCell>
        </DataTable.Row>
      );
    })}
  </DataTable>
);
